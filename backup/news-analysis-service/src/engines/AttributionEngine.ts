/**
 * Attribution Engine - 归因引擎
 * 系统的"首席分析师"，负责对已发生的市场异动进行深度、可解释的归因分析
 * 整合了原 AnalysisPipeline 的所有功能
 */

import { DatabaseConnection } from '../database/connection';
import { Redis } from 'ioredis';
import { BaseErrorHandler } from '../utils/BaseErrorHandler';
import { BaseConfigValidator } from '../utils/BaseConfigValidator';
import { logger } from '../utils/logger';

// 导入原 AnalysisPipeline 的组件
import { SimpleAnomalyDetectionSystem } from '../services/SimpleAnomalyDetectionSystem';
import { SignalTranslationEngine } from '../services/SignalTranslationEngine';
import { SimpleDualLLMCollaborationSystem } from '../services/SimpleDualLLMCollaborationSystem';

export interface AttributionEngineConfig {
  enabled: boolean;
  anomalyDetection: {
    enabled: boolean;
    zScoreThreshold: number;
    detectionInterval: number;
    maxAnomaliesPerRun: number;
  };
  signalTranslation: {
    enabled: boolean;
    translationRules: any[];
    outputFormat: 'json' | 'text';
  };
  llmCollaboration: {
    enabled: boolean;
    providers: string[];
    maxRetries: number;
    timeout: number;
  };
  workflow: {
    enableDailyAttribution: boolean;
    enableAnomalyAttribution: boolean;
    enableHistoricalAttribution: boolean;
    enableCrossValidation: boolean;
  };
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    metricsCollection: boolean;
  };
}

export interface AnomalyEvent {
  id: string;
  timestamp: number;
  stockCode: string;
  stockName: string;
  anomalyType: 'price' | 'volume' | 'volatility' | 'correlation';
  zScore: number;
  currentValue: number;
  expectedValue: number;
  deviation: number;
  confidence: number;
  context: {
    marketState: string;
    sectorPerformance: number;
    newsCount: number;
    sentiment: number;
  };
}

export interface AttributionResult {
  eventId: string;
  timestamp: number;
  stockCode: string;
  attribution: {
    primaryFactors: Array<{
      factor: string;
      impact: number;
      confidence: number;
      evidence: string[];
    }>;
    secondaryFactors: Array<{
      factor: string;
      impact: number;
      confidence: number;
      evidence: string[];
    }>;
    marketContext: {
      overallSentiment: string;
      sectorRotation: string;
      riskAppetite: string;
    };
    narrative: {
      summary: string;
      detailed: string;
      recommendations: string[];
    };
  };
  confidence: number;
  processingTime: number;
}

export class AttributionEngine {
  private db: DatabaseConnection;
  private redis: Redis;
  private config: AttributionEngineConfig;
  
  // 原 AnalysisPipeline 的组件
  private anomalyDetectionSystem: SimpleAnomalyDetectionSystem;
  private signalTranslationEngine: SignalTranslationEngine;
  private dualLLMCollaborationSystem: SimpleDualLLMCollaborationSystem;
  
  private isRunning: boolean = false;
  private processingQueue: AnomalyEvent[] = [];
  private stats: {
    totalProcessed: number;
    successfulAttributions: number;
    failedAttributions: number;
    averageProcessingTime: number;
  } = {
    totalProcessed: 0,
    successfulAttributions: 0,
    failedAttributions: 0,
    averageProcessingTime: 0
  };

  constructor(
    db: DatabaseConnection,
    redis: Redis,
    config: AttributionEngineConfig
  ) {
    this.db = db;
    this.redis = redis;
    this.config = config;
    
    this.validateConfig(config);
    this.initializeComponents();
  }

  /**
   * 验证配置
   */
  private validateConfig(config: AttributionEngineConfig): void {
    BaseConfigValidator.validate(config, [
      'enabled', 'anomalyDetection', 'signalTranslation', 
      'llmCollaboration', 'workflow', 'monitoring'
    ]);
  }

  /**
   * 初始化组件
   */
  private initializeComponents(): void {
    // 初始化异常检测系统（原 SimpleAnomalyDetectionSystem）
    this.anomalyDetectionSystem = new SimpleAnomalyDetectionSystem(
      this.db,
      this.createLogger(),
      this.createMonitor(),
      this.config.anomalyDetection
    );

    // 初始化信号翻译引擎（原 SignalTranslationEngine）
    this.signalTranslationEngine = new SignalTranslationEngine(
      this.db,
      this.config.signalTranslation
    );

    // 初始化双LLM协作系统（原 SimpleDualLLMCollaborationSystem）
    this.dualLLMCollaborationSystem = new SimpleDualLLMCollaborationSystem(
      this.db,
      this.redis,
      this.config.llmCollaboration
    );
  }

  /**
   * 启动归因引擎
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('AttributionEngine is already running');
      return;
    }

    try {
      logger.info('Starting AttributionEngine...');

      // 启动各个组件
      if (this.config.anomalyDetection.enabled) {
        await this.anomalyDetectionSystem.start();
      }

      if (this.config.signalTranslation.enabled) {
        await this.signalTranslationEngine.start();
      }

      if (this.config.llmCollaboration.enabled) {
        await this.dualLLMCollaborationSystem.start();
      }

      this.isRunning = true;
      logger.info('AttributionEngine started successfully');

    } catch (error) {
      logger.error('Failed to start AttributionEngine:', error);
      throw error;
    }
  }

  /**
   * 停止归因引擎
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      logger.info('Stopping AttributionEngine...');

      // 停止各个组件
      await this.anomalyDetectionSystem.stop();
      await this.signalTranslationEngine.stop();
      await this.dualLLMCollaborationSystem.stop();

      this.isRunning = false;
      logger.info('AttributionEngine stopped successfully');

    } catch (error) {
      logger.error('Failed to stop AttributionEngine:', error);
      throw error;
    }
  }

  /**
   * 处理异常事件 - 核心归因逻辑
   */
  async processAnomalyEvent(event: AnomalyEvent): Promise<AttributionResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`Processing anomaly event: ${event.id} for ${event.stockCode}`);

      // 1. 信号翻译 - 将量化数据翻译成人类可读的标签
      const translatedSignals = await this.signalTranslationEngine.translateSignals({
        zScore: event.zScore,
        anomalyType: event.anomalyType,
        context: event.context
      });

      // 2. 收集证据数据
      const evidence = await this.collectEvidence(event);

      // 3. 生成归因分析和叙事报告
      const analysisResult = await this.generateAttributionAndNarrative(event, translatedSignals, evidence);

      const processingTime = Date.now() - startTime;
      const result: AttributionResult = {
        eventId: event.id,
        timestamp: event.timestamp,
        stockCode: event.stockCode,
        attribution: {
          primaryFactors: analysisResult.primaryFactors,
          secondaryFactors: analysisResult.secondaryFactors,
          marketContext: analysisResult.marketContext,
          narrative: analysisResult.narrative
        },
        confidence: analysisResult.confidence,
        processingTime
      };

      // 更新统计信息
      this.updateStats(true, processingTime);

      // 保存结果
      await this.saveAttributionResult(result);

      logger.info(`Attribution completed for event ${event.id} in ${processingTime}ms`);
      return result;

    } catch (error) {
      logger.error(`Failed to process anomaly event ${event.id}:`, error);
      this.updateStats(false, Date.now() - startTime);
      throw error;
    }
  }

  /**
   * 收集证据数据 - 并行收集提高效率
   */
  private async collectEvidence(event: AnomalyEvent): Promise<any> {
    const [newsData, technicalData, fundamentalData, marketData] = await Promise.all([
      this.collectNewsEvidence(event),
      this.collectTechnicalEvidence(event),
      this.collectFundamentalEvidence(event),
      this.collectMarketEvidence(event)
    ]);

    return { news: newsData, technical: technicalData, fundamental: fundamentalData, market: marketData };
  }

  /**
   * 生成归因分析和叙事报告 - 合并为一次LLM调用
   */
  private async generateAttributionAndNarrative(
    event: AnomalyEvent, 
    translatedSignals: any, 
    evidence: any
  ): Promise<any> {
    const analysisTask = {
      id: `attribution_${event.id}`,
      type: 'anomaly_attribution_with_narrative',
      input: {
        event,
        signals: translatedSignals,
        evidence
      },
      priority: 'high'
    };

    return await this.dualLLMCollaborationSystem.processTask(analysisTask);
  }

  /**
   * 收集新闻证据
   */
  private async collectNewsEvidence(event: AnomalyEvent): Promise<any> {
    const query = `
      SELECT title, content, published_at, source, sentiment_score
      FROM news_articles 
      WHERE stock_code = $1 AND published_at BETWEEN $2 AND $3
      ORDER BY published_at DESC LIMIT 20
    `;
    
    const result = await this.db.query(query, [
      event.stockCode,
      new Date(event.timestamp - 24 * 60 * 60 * 1000),
      new Date(event.timestamp)
    ]);
    return result.rows;
  }

  /**
   * 收集技术指标证据
   */
  private async collectTechnicalEvidence(event: AnomalyEvent): Promise<any> {
    const query = `
      SELECT signal_type, value, z_score, created_at
      FROM quant_signals 
      WHERE stock_code = $1 AND created_at BETWEEN $2 AND $3
      ORDER BY created_at DESC
    `;
    
    const result = await this.db.query(query, [
      event.stockCode,
      new Date(event.timestamp - 7 * 24 * 60 * 60 * 1000),
      new Date(event.timestamp)
    ]);
    return result.rows;
  }

  /**
   * 收集基本面证据
   */
  private async collectFundamentalEvidence(event: AnomalyEvent): Promise<any> {
    const query = `
      SELECT pe_ratio, pb_ratio, roe, revenue_growth, profit_growth
      FROM fundamental_data 
      WHERE stock_code = $1 AND report_date = (
        SELECT MAX(report_date) FROM fundamental_data WHERE stock_code = $1
      )
    `;
    
    const result = await this.db.query(query, [event.stockCode]);
    return result.rows[0] || {};
  }

  /**
   * 收集市场证据
   */
  private async collectMarketEvidence(event: AnomalyEvent): Promise<any> {
    const query = `
      SELECT signal_type, value, z_score
      FROM quant_signals 
      WHERE signal_type IN ('macro_risk', 'market_style', 'sector_rotation')
        AND created_at BETWEEN $1 AND $2
      ORDER BY created_at DESC
    `;
    
    const result = await this.db.query(query, [
      new Date(event.timestamp - 24 * 60 * 60 * 1000),
      new Date(event.timestamp)
    ]);

    return {
      marketSignals: result.rows,
      sectorPerformance: event.context.sectorPerformance,
      overallSentiment: event.context.sentiment
    };
  }

  /**
   * 保存归因结果
   */
  private async saveAttributionResult(result: AttributionResult): Promise<void> {
    const query = `
      INSERT INTO attribution_results (
        event_id, timestamp, stock_code, attribution_data, 
        confidence, processing_time, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `;
    
    await this.db.query(query, [
      result.eventId,
      result.timestamp,
      result.stockCode,
      JSON.stringify(result.attribution),
      result.confidence,
      result.processingTime
    ]);
  }

  /**
   * 更新统计信息
   */
  private updateStats(success: boolean, processingTime: number): void {
    this.stats.totalProcessed++;
    if (success) {
      this.stats.successfulAttributions++;
    } else {
      this.stats.failedAttributions++;
    }
    
    // 更新平均处理时间
    this.stats.averageProcessingTime = 
      (this.stats.averageProcessingTime * (this.stats.totalProcessed - 1) + processingTime) / 
      this.stats.totalProcessed;
  }

  /**
   * 获取引擎状态
   */
  getStatus(): any {
    return {
      isRunning: this.isRunning,
      config: this.config,
      stats: this.stats,
      queueSize: this.processingQueue.length
    };
  }

  /**
   * 创建日志记录器
   */
  private createLogger(): any {
    return {
      info: (message: string) => logger.info(message),
      warn: (message: string) => logger.warn(message),
      error: (message: string) => logger.error(message),
      debug: (message: string) => logger.debug(message)
    };
  }

  /**
   * 创建监控器
   */
  private createMonitor(): any {
    return {
      recordMetric: (name: string, value: number) => {
        // 记录监控指标
      },
      recordError: (error: Error) => {
        logger.error('Monitor recorded error:', error);
      }
    };
  }
}

export default AttributionEngine;

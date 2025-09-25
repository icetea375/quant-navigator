/**
 * WorkflowOrchestrator - 工作流编排器
 * 
 * 功能：
 * 1. 协调各个核心组件的执行
 * 2. 支持动态股票宇宙管理
 * 3. 根据股票分类执行不同的处理策略
 * 4. 管理任务调度和依赖关系
 */

import { Database } from '../database/unified-connection';
import { Logger } from '../utils/logger';
import { StockUniverseManager } from './StockUniverseManager';
import { DataPipelineV15Manager } from './DataPipelineV15Manager';
import { QuantSignalEngine } from './QuantSignalEngine';
import { PredictionEngine } from './PredictionEngine';
import { AttributionEngine } from './AttributionEngine';
// LearningLoopCoordinator 是Python实现，通过API调用

export interface WorkflowConfig {
  enableCoreUniverse: boolean;
  enableObservationUniverse: boolean;
  enableDailyPromotion: boolean;
  enableMonthlyDemotion: boolean;
  coreUniverseMaxSize: number;
  observationUniverseMaxSize: number;
  promotionCheckTime: string; // HH:MM format
  demotionCheckTime: string; // HH:MM format
}

export interface WorkflowExecutionResult {
  success: boolean;
  startTime: string;
  endTime: string;
  duration: number;
  coreUniverseProcessed: number;
  observationUniverseProcessed: number;
  errors: string[];
  warnings: string[];
}

export class WorkflowOrchestrator {
  private db: Database;
  private logger: Logger;
  private stockUniverseManager: StockUniverseManager;
  private dataPipeline: DataPipelineV15Manager;
  private quantSignalEngine: QuantSignalEngine;
  private predictionEngine: PredictionEngine;
  private attributionEngine: AttributionEngine;
  // LearningLoopCoordinator 是Python服务，通过HTTP API调用
  private config: WorkflowConfig;

  constructor(
    db: Database,
    logger: Logger,
    config: WorkflowConfig
  ) {
    this.db = db;
    this.logger = logger;
    this.config = config;
    
    // 初始化各个组件
    this.stockUniverseManager = new StockUniverseManager(db, logger);
    this.dataPipeline = new DataPipelineV15Manager(db, logger);
    this.quantSignalEngine = new QuantSignalEngine(db, logger);
    this.predictionEngine = new PredictionEngine(db, logger);
    this.attributionEngine = new AttributionEngine(db, logger);
    // LearningLoopCoordinator 是Python服务，不需要在TypeScript中实例化
  }

  /**
   * 初始化工作流编排器
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('初始化工作流编排器...');

      // 初始化股票宇宙管理器
      await this.stockUniverseManager.initializeUniverseMapping();

      // 构建初始股票宇宙
      await this.stockUniverseManager.buildInitialUniverse();

      // 初始化各个组件
      await this.dataPipeline.initialize();
      await this.quantSignalEngine.initialize();
      await this.predictionEngine.initialize();
      await this.attributionEngine.initialize();
      await this.learningLoopCoordinator.initialize();

      this.logger.info('工作流编排器初始化完成');
    } catch (error) {
      this.logger.error('初始化工作流编排器失败:', error);
      throw error;
    }
  }

  /**
   * 执行每日工作流
   */
  async executeDailyWorkflow(): Promise<WorkflowExecutionResult> {
    const startTime = new Date();
    const result: WorkflowExecutionResult = {
      success: false,
      startTime: startTime.toISOString(),
      endTime: '',
      duration: 0,
      coreUniverseProcessed: 0,
      observationUniverseProcessed: 0,
      errors: [],
      warnings: []
    };

    try {
      this.logger.info('开始执行每日工作流...');

      // 1. 检查股票宇宙晋升
      if (this.config.enableDailyPromotion) {
        await this.checkDailyPromotions();
      }

      // 2. 执行数据管道（全量数据获取）
      await this.executeDataPipeline();

      // 3. 执行核心宇宙处理
      if (this.config.enableCoreUniverse) {
        result.coreUniverseProcessed = await this.executeCoreUniverseProcessing();
      }

      // 4. 执行观察宇宙处理
      if (this.config.enableObservationUniverse) {
        result.observationUniverseProcessed = await this.executeObservationUniverseProcessing();
      }

      // 5. 执行学习循环协调器
      await this.executeLearningLoopCoordinator();

      result.success = true;
      this.logger.info('每日工作流执行完成');
    } catch (error) {
      this.logger.error('每日工作流执行失败:', error);
      result.errors.push(error.message);
    } finally {
      const endTime = new Date();
      result.endTime = endTime.toISOString();
      result.duration = endTime.getTime() - startTime.getTime();
    }

    return result;
  }

  /**
   * 检查每日晋升
   */
  private async checkDailyPromotions(): Promise<void> {
    try {
      this.logger.info('检查每日股票晋升...');
      const promotedStocks = await this.stockUniverseManager.checkDailyPromotions();
      
      if (promotedStocks.length > 0) {
        this.logger.info(`发现${promotedStocks.length}只股票需要晋升到核心宇宙`);
        
        // 对晋升的股票执行核心宇宙处理
        for (const stockCode of promotedStocks) {
          await this.processCoreUniverseStock(stockCode);
        }
      }
    } catch (error) {
      this.logger.error('检查每日晋升失败:', error);
      throw error;
    }
  }

  /**
   * 执行数据管道
   */
  private async executeDataPipeline(): Promise<void> {
    try {
      this.logger.info('执行数据管道...');
      
      // 获取所有股票列表
      const allStocks = await this.stockUniverseManager.getAllStocks();
      
      // 执行数据获取
      await this.dataPipeline.fetchAllData({
        symbols: allStocks.map(stock => stock.stock_code),
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 最近7天
        endDate: new Date().toISOString().split('T')[0]
      });

      this.logger.info('数据管道执行完成');
    } catch (error) {
      this.logger.error('数据管道执行失败:', error);
      throw error;
    }
  }

  /**
   * 执行核心宇宙处理
   */
  private async executeCoreUniverseProcessing(): Promise<number> {
    try {
      this.logger.info('执行核心宇宙处理...');
      
      // 获取核心宇宙股票列表
      const coreStocks = await this.stockUniverseManager.getCoreUniverseStocks();
      this.logger.info(`核心宇宙股票数量: ${coreStocks.length}`);

      let processedCount = 0;

      // 对每只核心宇宙股票执行完整处理
      for (const stockCode of coreStocks) {
        try {
          await this.processCoreUniverseStock(stockCode);
          processedCount++;
        } catch (error) {
          this.logger.error(`处理核心宇宙股票${stockCode}失败:`, error);
        }
      }

      this.logger.info(`核心宇宙处理完成，处理股票数量: ${processedCount}`);
      return processedCount;
    } catch (error) {
      this.logger.error('核心宇宙处理失败:', error);
      throw error;
    }
  }

  /**
   * 处理单只核心宇宙股票
   */
  private async processCoreUniverseStock(stockCode: string): Promise<void> {
    try {
      // 1. 计算复杂量化信号
      await this.quantSignalEngine.calculateComplexSignals(stockCode);

      // 2. 生成预测
      await this.predictionEngine.generatePrediction(stockCode);

      // 3. 执行深度归因分析
      await this.attributionEngine.performDeepAttribution(stockCode);

      this.logger.debug(`核心宇宙股票${stockCode}处理完成`);
    } catch (error) {
      this.logger.error(`处理核心宇宙股票${stockCode}失败:`, error);
      throw error;
    }
  }

  /**
   * 执行观察宇宙处理
   */
  private async executeObservationUniverseProcessing(): Promise<number> {
    try {
      this.logger.info('执行观察宇宙处理...');
      
      // 获取观察宇宙股票列表
      const observationStocks = await this.stockUniverseManager.getObservationUniverseStocks();
      this.logger.info(`观察宇宙股票数量: ${observationStocks.length}`);

      let processedCount = 0;

      // 对观察宇宙股票执行基础处理
      for (const stockCode of observationStocks) {
        try {
          await this.processObservationUniverseStock(stockCode);
          processedCount++;
        } catch (error) {
          this.logger.error(`处理观察宇宙股票${stockCode}失败:`, error);
        }
      }

      this.logger.info(`观察宇宙处理完成，处理股票数量: ${processedCount}`);
      return processedCount;
    } catch (error) {
      this.logger.error('观察宇宙处理失败:', error);
      throw error;
    }
  }

  /**
   * 处理单只观察宇宙股票
   */
  private async processObservationUniverseStock(stockCode: string): Promise<void> {
    try {
      // 1. 计算基础量化信号（仅个体Z分数）
      await this.quantSignalEngine.calculateBasicSignals(stockCode);

      // 2. 不执行预测和深度归因分析
      // 只保持基础监控

      this.logger.debug(`观察宇宙股票${stockCode}处理完成`);
    } catch (error) {
      this.logger.error(`处理观察宇宙股票${stockCode}失败:`, error);
      throw error;
    }
  }

  /**
   * 执行学习循环协调器 (通过Python API调用)
   */
  private async executeLearningLoopCoordinator(): Promise<void> {
    try {
      this.logger.info('执行学习循环协调器...');
      
      // 获取核心宇宙股票列表
      const coreStocks = await this.stockUniverseManager.getCoreUniverseStocks();
      
      // 通过HTTP API调用Python学习循环协调器
      const response = await fetch('http://localhost:8001/api/learning-loop/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stocks: coreStocks,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`学习循环协调器API调用失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      this.logger.info('学习循环协调器执行完成', result);

    } catch (error) {
      this.logger.error('学习循环协调器执行失败:', error);
      // 学习循环协调器是离线模块，失败时不影响主流程
      this.logger.warn('学习循环协调器执行失败，但继续执行主流程');
    }
  }

  /**
   * 执行月度降级检查
   */
  async executeMonthlyDemotionCheck(): Promise<void> {
    try {
      this.logger.info('执行月度降级检查...');
      
      const demotedStocks = await this.stockUniverseManager.checkMonthlyDemotions();
      
      if (demotedStocks.length > 0) {
        this.logger.info(`发现${demotedStocks.length}只股票需要降级到观察宇宙`);
      }

      this.logger.info('月度降级检查完成');
    } catch (error) {
      this.logger.error('月度降级检查失败:', error);
      throw error;
    }
  }

  /**
   * 获取工作流状态
   */
  async getWorkflowStatus(): Promise<any> {
    try {
      const universeStats = await this.stockUniverseManager.getUniverseStats();
      
      return {
        universe: universeStats,
        config: this.config,
        lastExecution: await this.getLastExecutionTime(),
        nextExecution: await this.getNextExecutionTime()
      };
    } catch (error) {
      this.logger.error('获取工作流状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取上次执行时间
   */
  private async getLastExecutionTime(): Promise<string | null> {
    try {
      const result = await this.db.query(`
        SELECT MAX(execution_time) as last_execution
        FROM workflow_execution_log
        WHERE status = 'success'
      `);
      
      return result.rows[0]?.last_execution || null;
    } catch (error) {
      this.logger.warn('获取上次执行时间失败:', error);
      return null;
    }
  }

  /**
   * 获取下次执行时间
   */
  private async getNextExecutionTime(): Promise<string> {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return tomorrow.toISOString();
  }

  /**
   * 记录工作流执行日志
   */
  private async logWorkflowExecution(result: WorkflowExecutionResult): Promise<void> {
    try {
      await this.db.query(`
        INSERT INTO workflow_execution_log 
        (execution_time, status, duration, core_processed, observation_processed, errors, warnings)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        result.startTime,
        result.success ? 'success' : 'failed',
        result.duration,
        result.coreUniverseProcessed,
        result.observationUniverseProcessed,
        JSON.stringify(result.errors),
        JSON.stringify(result.warnings)
      ]);
    } catch (error) {
      this.logger.error('记录工作流执行日志失败:', error);
    }
  }

  /**
   * 更新工作流配置
   */
  async updateConfig(newConfig: Partial<WorkflowConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...newConfig };
      this.logger.info('工作流配置已更新');
    } catch (error) {
      this.logger.error('更新工作流配置失败:', error);
      throw error;
    }
  }

  /**
   * 手动触发股票晋升
   */
  async promoteStockToCore(stockCode: string, reason: string): Promise<void> {
    try {
      await this.stockUniverseManager.updateUniverseMapping(stockCode, 'core', reason);
      
      // 立即处理晋升的股票
      await this.processCoreUniverseStock(stockCode);
      
      this.logger.info(`股票${stockCode}已手动晋升到核心宇宙`);
    } catch (error) {
      this.logger.error(`手动晋升股票${stockCode}失败:`, error);
      throw error;
    }
  }

  /**
   * 手动触发股票降级
   */
  async demoteStockToObservation(stockCode: string, reason: string): Promise<void> {
    try {
      await this.stockUniverseManager.updateUniverseMapping(stockCode, 'observation', reason);
      
      this.logger.info(`股票${stockCode}已手动降级到观察宇宙`);
    } catch (error) {
      this.logger.error(`手动降级股票${stockCode}失败:`, error);
      throw error;
    }
  }
}

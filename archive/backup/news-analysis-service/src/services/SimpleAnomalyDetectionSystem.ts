/**
 * 简单异常检测系统
 * 集成四层映射架构与自适应异常发现系统到现有系统中
 *
 * @author AI Assistant
 * @created 2025-01-17
 * @version 1.0.0
 */

import { DatabaseConnection } from '../database/connection';
import { SimpleLogCollector } from './SimpleLogCollector';
import { SimpleMonitor } from './SimpleMonitor';
import { AnomalyDetectionEngine, AnomalyDetectionConfig } from './AnomalyDetectionEngine';
import { RelativeStrengthAnalyzer, RelativeStrengthConfig } from './RelativeStrengthAnalyzer';
import { FourLayerDataCollector, FourLayerMappingConfig } from './FourLayerDataCollector';
import { RollingStatisticsCalculator } from './RollingStatisticsCalculator';
import { BaseErrorHandler } from '../utils/BaseErrorHandler';

export interface AnomalyDetectionSystemConfig {
  enabled: boolean;
  autoDetection: boolean;
  detectionInterval: number; // 毫秒
  batchSize: number;
  maxConcurrentDetections: number;
  defaultThresholds: {
    zScore: number;
    percentile: number;
  };
  defaultWindowSizes: {
    price: number;
    volume: number;
  };
}

export interface SystemStatus {
  isRunning: boolean;
  lastDetectionTime: string | null;
  totalDetections: number;
  anomalyCount: number;
  errorCount: number;
  averageProcessingTime: number;
}

export class SimpleAnomalyDetectionSystem {
  private db: DatabaseConnection;
  private logger: SimpleLogCollector;
  private monitor: SimpleMonitor;
  private anomalyEngine: AnomalyDetectionEngine;
  private relativeStrengthAnalyzer: RelativeStrengthAnalyzer;
  private dataCollector: FourLayerDataCollector;
  private config: AnomalyDetectionSystemConfig;
  private isRunning: boolean = false;
  private detectionTimer: NodeJS.Timeout | null = null;
  private stats: {
    totalDetections: number;
    anomalyCount: number;
    errorCount: number;
    totalProcessingTime: number;
  } = {
    totalDetections: 0,
    anomalyCount: 0,
    errorCount: 0,
    totalProcessingTime: 0
  };

  constructor(
    db: DatabaseConnection,
    logger: SimpleLogCollector,
    monitor: SimpleMonitor,
    config: AnomalyDetectionSystemConfig
  ) {
    this.db = db;
    this.logger = logger;
    this.monitor = monitor;
    this.config = config;

    this.anomalyEngine = new AnomalyDetectionEngine(db, logger);
    this.relativeStrengthAnalyzer = new RelativeStrengthAnalyzer(db, logger);
    this.dataCollector = new FourLayerDataCollector(db, logger);
  }

  /**
   * 启动异常检测系统
   */
  async start(): Promise<void> {
    try {
      if (this.isRunning) {
        this.logger.warn('异常检测系统已在运行');
        return;
      }

      this.logger.info('启动异常检测系统', {
        config: this.config
      });

      // 初始化四层映射数据
      await this.initializeSystem();

      // 启动自动检测
      if (this.config.autoDetection) {
        this.startAutoDetection();
      }

      this.isRunning = true;

      this.logger.info('异常检测系统启动成功');
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleAnomalyDetectionSystem');
      throw error;
    }
  }

  /**
   * 停止异常检测系统
   */
  async stop(): Promise<void> {
    try {
      if (!this.isRunning) {
        this.logger.warn('异常检测系统未运行');
        return;
      }

      this.logger.info('停止异常检测系统');

      // 停止自动检测
      if (this.detectionTimer) {
        clearInterval(this.detectionTimer);
        this.detectionTimer = null;
      }

      this.isRunning = false;

      this.logger.info('异常检测系统已停止');
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleAnomalyDetectionSystem');
      throw error;
    }
  }

  /**
   * 执行异常检测
   * @param targetCodes 目标代码数组
   * @param detectionDate 检测日期
   * @returns 检测结果
   */
  async detectAnomalies(
    targetCodes: string[],
    detectionDate: string = new Date().toISOString().split('T')[0]
  ): Promise<any[]> {
    const startTime = Date.now();

    try {
      this.logger.info('开始执行异常检测', {
        targetCodes,
        detectionDate
      });

      const results = [];
      const batchSize = this.config.batchSize;

      // 分批处理
      for (let i = 0; i < targetCodes.length; i += batchSize) {
        const batch = targetCodes.slice(i, i + batchSize);
        const batchResults = await this.processBatch(batch, detectionDate);
        results.push(...batchResults);
      }

      // 更新统计信息
      const processingTime = Date.now() - startTime;
      this.updateStats(results, processingTime);

      // 记录核心监控指标
      this.monitor.recordMetric('anomaly_detection_count', results.length);
      this.monitor.recordMetric('anomaly_detection_processing_time', processingTime);
      this.monitor.recordMetric('anomaly_detection_anomaly_count', results.filter(r => r.isAnomaly).length);

      this.logger.info('异常检测完成', {
        totalTargets: targetCodes.length,
        successCount: results.length,
        anomalyCount: results.filter(r => r.isAnomaly).length,
        processingTime
      });

      return results;
    } catch (error) {
      this.stats.errorCount++;
      BaseErrorHandler.handle(error, 'SimpleAnomalyDetectionSystem');
      throw error;
    }
  }

  /**
   * 执行相对强度分析
   * @param childCode 子级代码
   * @param parentCode 父级代码
   * @param analysisDate 分析日期
   * @returns 相对强度分析结果
   */
  async analyzeRelativeStrength(
    childCode: string,
    parentCode: string,
    analysisDate: string = new Date().toISOString().split('T')[0]
  ): Promise<any> {
    try {
      this.logger.info('开始相对强度分析', {
        childCode,
        parentCode,
        analysisDate
      });

      const config: RelativeStrengthConfig = {
        childCode,
        parentCode,
        childType: 'index',
        parentType: 'index',
        childLayerLevel: 2,
        parentLayerLevel: 1,
        analysisDate
      };

      const result = await this.relativeStrengthAnalyzer.analyzeRelativeStrength(config);

      // 记录核心监控指标
      this.monitor.recordMetric('anomaly_detection_count', 1);
      this.monitor.recordMetric('anomaly_detection_anomaly_count', result.isAnomaly ? 1 : 0);

      this.logger.info('相对强度分析完成', {
        childCode,
        parentCode,
        isAnomaly: result.isAnomaly,
        zScore: result.zScore
      });

      return result;
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleAnomalyDetectionSystem');
      throw error;
    }
  }

  /**
   * 获取系统状态
   * @returns 系统状态
   */
  getSystemStatus(): SystemStatus {
    const averageProcessingTime = this.stats.totalDetections > 0
      ? this.stats.totalProcessingTime / this.stats.totalDetections
      : 0;

    return {
      isRunning: this.isRunning,
      lastDetectionTime: this.getLastDetectionTime(),
      totalDetections: this.stats.totalDetections,
      anomalyCount: this.stats.anomalyCount,
      errorCount: this.stats.errorCount,
      averageProcessingTime
    };
  }

  /**
   * 更新配置
   * @param newConfig 新配置
   */
  updateConfig(newConfig: Partial<AnomalyDetectionSystemConfig>): void {
    this.config = { ...this.config, ...newConfig };

    this.logger.info('异常检测系统配置已更新', {
      newConfig
    });

    // 如果系统正在运行且自动检测设置发生变化，重新启动自动检测
    if (this.isRunning && newConfig.autoDetection !== undefined) {
      if (this.detectionTimer) {
        clearInterval(this.detectionTimer);
        this.detectionTimer = null;
      }

      if (this.config.autoDetection) {
        this.startAutoDetection();
      }
    }
  }

  /**
   * 获取四层映射数据
   * @param layerLevel 层级
   * @returns 映射数据
   */
  async getLayerMappings(layerLevel?: number): Promise<any> {
    if (layerLevel) {
      return await this.dataCollector.getLayerData(layerLevel);
    } else {
      return await this.dataCollector.getLayerHierarchy();
    }
  }

  /**
   * 添加四层映射数据
   * @param mappingConfig 映射配置
   * @returns 映射数据
   */
  async addMapping(mappingConfig: FourLayerMappingConfig): Promise<any> {
    return await this.dataCollector.addMapping(mappingConfig);
  }

  /**
   * 获取异常检测结果
   * @param filters 过滤条件
   * @returns 检测结果
   */
  async getAnomalyResults(filters: any = {}): Promise<any> {
    let query = `
      SELECT * FROM anomaly_detection_results
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.targetCode) {
      query += ` AND target_code = ?`;
      params.push(filters.targetCode);
    }

    if (filters.startDate) {
      query += ` AND detection_date >= ?`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND detection_date <= ?`;
      params.push(filters.endDate);
    }

    if (filters.isAnomaly !== undefined) {
      query += ` AND is_anomaly = ?`;
      params.push(filters.isAnomaly);
    }

    query += ` ORDER BY detection_date DESC, created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT ?`;
      params.push(filters.limit);
    }

    return await this.db.all(query, params);
  }

  /**
   * 初始化系统
   */
  private async initializeSystem(): Promise<void> {
    try {
      // 检查四层映射数据是否存在
      const stats = await this.dataCollector.getDataCollectionStats();

      if (stats.totalMappings === 0) {
        this.logger.info('初始化默认四层映射数据');
        await this.dataCollector.initializeDefaultMappings();
      }

      this.logger.info('异常检测系统初始化完成', {
        totalMappings: stats.totalMappings
      });
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleAnomalyDetectionSystem');
      throw error;
    }
  }

  /**
   * 启动自动检测
   */
  private startAutoDetection(): void {
    if (this.detectionTimer) {
      clearInterval(this.detectionTimer);
    }

    this.detectionTimer = setInterval(async () => {
      try {
        await this.performAutoDetection();
      } catch (error) {
        this.logger.error('自动异常检测失败', {
          error: error instanceof Error ? error.message : String(error)
        });
        this.stats.errorCount++;
      }
    }, this.config.detectionInterval);

    this.logger.info('自动异常检测已启动', {
      interval: this.config.detectionInterval
    });
  }

  /**
   * 执行自动检测
   */
  private async performAutoDetection(): Promise<void> {
    try {
      // 获取所有激活的映射数据
      const hierarchy = await this.dataCollector.getLayerHierarchy();
      const allMappings = [
        ...hierarchy.layer1,
        ...hierarchy.layer2,
        ...hierarchy.layer3,
        ...hierarchy.layer4
      ].filter(mapping => mapping.isActive);

      const targetCodes = allMappings.map(mapping => mapping.code);

      if (targetCodes.length === 0) {
        this.logger.warn('没有可检测的目标');
        return;
      }

      // 执行异常检测
      await this.detectAnomalies(targetCodes);
    } catch (error) {
      this.logger.error('自动异常检测执行失败', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 处理批次
   * @param batch 批次数据
   * @param detectionDate 检测日期
   * @returns 批次结果
   */
  private async processBatch(batch: string[], detectionDate: string): Promise<any[]> {
    const results = [];

    for (const targetCode of batch) {
      try {
        const mapping = await this.dataCollector.getMappingByCode(targetCode);
        if (!mapping) {
          this.logger.warn('目标代码未找到', { targetCode });
          continue;
        }

        // 获取父级代码
        let parentCode: string | undefined;
        if (mapping.parentId) {
          const parent = await this.dataCollector.getMappingById(mapping.parentId);
          parentCode = parent?.code;
        }

        // 构建检测配置
        const config: AnomalyDetectionConfig = {
          targetCode: mapping.code,
          targetName: mapping.name,
          targetType: mapping.type as 'index' | 'stock',
          layerLevel: mapping.layerLevel,
          parentCode,
          detectionDate,
          priceWindowSize: this.config.defaultWindowSizes.price,
          volumeWindowSize: this.config.defaultWindowSizes.volume,
          zScoreThreshold: this.config.defaultThresholds.zScore,
          percentileThreshold: this.config.defaultThresholds.percentile
        };

        // 执行异常检测
        const result = await this.anomalyEngine.detectAnomaly(config);
        results.push(result);

      } catch (error) {
        this.logger.error('单个目标异常检测失败', {
          targetCode,
          error: error instanceof Error ? error.message : String(error)
        });
        this.stats.errorCount++;
      }
    }

    return results;
  }

  /**
   * 更新统计信息
   * @param results 检测结果
   * @param processingTime 处理时间
   */
  private updateStats(results: any[], processingTime: number): void {
    this.stats.totalDetections += results.length;
    this.stats.anomalyCount += results.filter(r => r.isAnomaly).length;
    this.stats.totalProcessingTime += processingTime;
  }

  /**
   * 获取最后检测时间
   * @returns 最后检测时间
   */
  private getLastDetectionTime(): string | null {
    // 从数据库获取最后检测时间
    // 这里简化实现，实际应该查询数据库
    return new Date().toISOString();
  }
}

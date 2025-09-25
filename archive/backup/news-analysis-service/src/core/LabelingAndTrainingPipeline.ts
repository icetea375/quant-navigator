/**
 * LabelingAndTrainingPipeline - 统一的标签化和训练管道基类
 * 消除历史归因分析和新闻重要性评分训练系统的重复代码
 */

import { DatabaseConnection } from '../database/connection';
import { Redis } from 'ioredis';
import { BaseService, BaseServiceConfig } from './BaseService';
import { logger } from '../utils/logger';

export interface LabelingAndTrainingConfig extends BaseServiceConfig {
  llm: {
    enabled: boolean;
    providers: string[];
    maxRetries: number;
    timeout: number;
  };
  dataProcessing: {
    batchSize: number;
    maxConcurrency: number;
    qualityThreshold: number;
  };
  training: {
    enabled: boolean;
    modelPath: string;
    validationSplit: number;
    testSplit: number;
  };
  storage: {
    samplesTable: string;
    featuresTable: string;
    modelsTable: string;
  };
}

export interface LabelingTask {
  id: string;
  type: 'attribution' | 'importance_scoring' | 'classification';
  inputData: any;
  expectedOutput?: any;
  priority: number;
  createdAt: number;
}

export interface LabelingResult {
  taskId: string;
  success: boolean;
  output?: any;
  confidence?: number;
  error?: string;
  processingTime: number;
}

export interface TrainingSample {
  id: string;
  type: string;
  features: any;
  target: any;
  metadata: any;
  createdAt: number;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  loss: number;
  validationLoss: number;
}

export abstract class LabelingAndTrainingPipeline extends BaseService {
  protected config: LabelingAndTrainingConfig;
  protected taskQueue: LabelingTask[] = [];
  protected activeTasks: Set<string> = new Set();
  protected trainingSamples: TrainingSample[] = [];

  constructor(
    db: DatabaseConnection,
    redis: Redis,
    config: LabelingAndTrainingConfig
  ) {
    super(db, redis, config);
    this.config = config;
  }

  /**
   * 添加标签化任务
   */
  public addLabelingTask(task: Omit<LabelingTask, 'id' | 'createdAt'>): string {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullTask: LabelingTask = {
      ...task,
      id: taskId,
      createdAt: Date.now()
    };
    
    this.taskQueue.push(fullTask);
    this.taskQueue.sort((a, b) => b.priority - a.priority);
    
    logger.info(`Added labeling task: ${taskId} (type: ${task.type})`);
    return taskId;
  }

  /**
   * 处理标签化任务
   */
  public async processLabelingTasks(): Promise<LabelingResult[]> {
    const results: LabelingResult[] = [];
    const batchSize = Math.min(this.config.dataProcessing.batchSize, this.taskQueue.length);
    
    for (let i = 0; i < batchSize; i++) {
      const task = this.taskQueue.shift();
      if (!task) break;
      
      this.activeTasks.add(task.id);
      
      try {
        const result = await this.processLabelingTask(task);
        results.push(result);
      } catch (error) {
        results.push({
          taskId: task.id,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          processingTime: 0
        });
      } finally {
        this.activeTasks.delete(task.id);
      }
    }
    
    return results;
  }

  /**
   * 处理单个标签化任务 - 抽象方法，子类必须实现
   */
  protected abstract processLabelingTask(task: LabelingTask): Promise<LabelingResult>;

  /**
   * 生成训练样本
   */
  public async generateTrainingSamples(
    taskType: string,
    inputData: any[],
    batchSize: number = 100
  ): Promise<TrainingSample[]> {
    const samples: TrainingSample[] = [];
    
    for (let i = 0; i < inputData.length; i += batchSize) {
      const batch = inputData.slice(i, i + batchSize);
      const batchSamples = await this.processBatchForTraining(batch, taskType);
      samples.push(...batchSamples);
    }
    
    // 保存到数据库
    await this.saveTrainingSamples(samples);
    
    this.trainingSamples.push(...samples);
    logger.info(`Generated ${samples.length} training samples for ${taskType}`);
    
    return samples;
  }

  /**
   * 处理批次数据生成训练样本 - 抽象方法，子类必须实现
   */
  protected abstract processBatchForTraining(
    batch: any[],
    taskType: string
  ): Promise<TrainingSample[]>;

  /**
   * 训练模型
   */
  public async trainModel(
    modelType: string,
    samples: TrainingSample[],
    config: any = {}
  ): Promise<ModelMetrics> {
    if (!this.config.training.enabled) {
      throw new Error('Training is disabled in configuration');
    }

    const startTime = Date.now();
    
    try {
      // 数据预处理
      const processedData = await this.preprocessTrainingData(samples);
      
      // 数据分割
      const { trainData, validationData, testData } = this.splitData(
        processedData,
        this.config.training.validationSplit,
        this.config.training.testSplit
      );
      
      // 训练模型
      const model = await this.executeTraining(modelType, trainData, validationData, config);
      
      // 评估模型
      const metrics = await this.evaluateModel(model, testData);
      
      // 保存模型
      await this.saveModel(modelType, model, metrics);
      
      const processingTime = Date.now() - startTime;
      logger.info(`Model training completed in ${processingTime}ms`, { metrics });
      
      return metrics;
    } catch (error) {
      logger.error('Model training failed:', error);
      throw error;
    }
  }

  /**
   * 预处理训练数据 - 抽象方法，子类必须实现
   */
  protected abstract preprocessTrainingData(samples: TrainingSample[]): Promise<any>;

  /**
   * 执行训练 - 抽象方法，子类必须实现
   */
  protected abstract executeTraining(
    modelType: string,
    trainData: any,
    validationData: any,
    config: any
  ): Promise<any>;

  /**
   * 评估模型 - 抽象方法，子类必须实现
   */
  protected abstract evaluateModel(model: any, testData: any): Promise<ModelMetrics>;

  /**
   * 数据分割
   */
  protected splitData(
    data: any[],
    validationSplit: number,
    testSplit: number
  ): { trainData: any[]; validationData: any[]; testData: any[] } {
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    const total = shuffled.length;
    
    const testSize = Math.floor(total * testSplit);
    const validationSize = Math.floor(total * validationSplit);
    const trainSize = total - testSize - validationSize;
    
    return {
      trainData: shuffled.slice(0, trainSize),
      validationData: shuffled.slice(trainSize, trainSize + validationSize),
      testData: shuffled.slice(trainSize + validationSize)
    };
  }

  /**
   * 保存训练样本
   */
  protected async saveTrainingSamples(samples: TrainingSample[]): Promise<void> {
    if (samples.length === 0) return;
    
    const values = samples.map(sample => 
      `('${sample.id}', '${sample.type}', '${JSON.stringify(sample.features)}', '${JSON.stringify(sample.target)}', '${JSON.stringify(sample.metadata)}', ${sample.createdAt})`
    ).join(',');
    
    await this.db.query(`
      INSERT INTO ${this.config.storage.samplesTable} 
      (id, type, features, target, metadata, created_at) 
      VALUES ${values}
      ON CONFLICT (id) DO UPDATE SET
        features = EXCLUDED.features,
        target = EXCLUDED.target,
        metadata = EXCLUDED.metadata
    `);
  }

  /**
   * 保存模型
   */
  protected async saveModel(
    modelType: string,
    model: any,
    metrics: ModelMetrics
  ): Promise<void> {
    const modelId = `model_${modelType}_${Date.now()}`;
    
    await this.db.query(`
      INSERT INTO ${this.config.storage.modelsTable} 
      (id, type, model_data, metrics, created_at) 
      VALUES ($1, $2, $3, $4, $5)
    `, [
      modelId,
      modelType,
      JSON.stringify(model),
      JSON.stringify(metrics),
      new Date()
    ]);
    
    logger.info(`Model saved: ${modelId}`);
  }

  /**
   * 获取管道状态
   */
  public getPipelineStatus(): any {
    return {
      ...this.getStatus(),
      taskQueue: {
        total: this.taskQueue.length,
        active: this.activeTasks.size,
        pending: this.taskQueue.length - this.activeTasks.size
      },
      trainingSamples: {
        total: this.trainingSamples.length,
        types: this.getSampleTypes()
      }
    };
  }

  /**
   * 获取样本类型统计
   */
  private getSampleTypes(): { [key: string]: number } {
    const types: { [key: string]: number } = {};
    for (const sample of this.trainingSamples) {
      types[sample.type] = (types[sample.type] || 0) + 1;
    }
    return types;
  }

  /**
   * 清理过期数据
   */
  public async cleanupExpiredData(olderThanDays: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    // 清理过期的训练样本
    await this.db.query(`
      DELETE FROM ${this.config.storage.samplesTable} 
      WHERE created_at < $1
    `, [cutoffDate]);
    
    // 清理过期的模型
    await this.db.query(`
      DELETE FROM ${this.config.storage.modelsTable} 
      WHERE created_at < $1
    `, [cutoffDate]);
    
    logger.info(`Cleaned up data older than ${olderThanDays} days`);
  }

  /**
   * 抽象方法 - 子类必须实现
   */
  protected abstract onStart(): Promise<void>;
  protected abstract onStop(): Promise<void>;
}

export default LabelingAndTrainingPipeline;

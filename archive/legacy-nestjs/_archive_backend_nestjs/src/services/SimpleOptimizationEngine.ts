/**
 * 简单优化引擎
 * 遵循智能分析系统开发实施指南的命名规范
 */

import { DatabaseConnection } from '../database/connection';
import { Redis } from 'ioredis';
import { BaseErrorHandler } from '../utils/BaseErrorHandler';
import { BaseConfigValidator } from '../utils/BaseConfigValidator';
import { logger } from '../utils/logger';
import { FeedbackAnalysis, QualityMetrics } from './SimpleFeedbackAnalyzer';

export interface OptimizationConfig {
  enabled: boolean;
  optimization: {
    enablePromptOptimization: boolean;
    enableModelParameterTuning: boolean;
    enableAlgorithmOptimization: boolean;
    enableWorkflowOptimization: boolean;
    optimizationInterval: number; // 毫秒
    batchSize: number;
  };
  learning: {
    enableOnlineLearning: boolean;
    enableA_BTesting: boolean;
    enableReinforcementLearning: boolean;
    learningRate: number;
    explorationRate: number;
  };
  evaluation: {
    enablePerformanceEvaluation: boolean;
    enableQualityEvaluation: boolean;
    evaluationMetrics: string[];
    evaluationInterval: number; // 毫秒
  };
  storage: {
    enableCaching: boolean;
    cacheTtl: number;
    enableVersioning: boolean;
    maxVersions: number;
  };
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    metricsCollection: boolean;
  };
}

export interface OptimizationResult {
  id: string;
  type: 'prompt' | 'model_parameter' | 'algorithm' | 'workflow';
  targetId: string;
  targetType: string;
  originalConfig: any;
  optimizedConfig: any;
  improvements: {
    accuracy: number;
    relevance: number;
    completeness: number;
    timeliness: number;
    overall: number;
  };
  confidence: number;
  status: 'pending' | 'testing' | 'deployed' | 'rolled_back' | 'failed';
  testResults?: {
    accuracy: number;
    performance: number;
    userSatisfaction: number;
  };
  createdAt: number;
  deployedAt?: number;
  rolledBackAt?: number;
}

export interface PromptOptimization {
  id: string;
  originalPrompt: string;
  optimizedPrompt: string;
  improvements: {
    clarity: number;
    specificity: number;
    completeness: number;
    effectiveness: number;
  };
  techniques: string[];
  confidence: number;
  status: 'pending' | 'testing' | 'deployed' | 'rolled_back';
  createdAt: number;
}

export interface ModelParameterTuning {
  id: string;
  modelType: string;
  originalParams: Record<string, any>;
  optimizedParams: Record<string, any>;
  improvements: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  techniques: string[];
  confidence: number;
  status: 'pending' | 'testing' | 'deployed' | 'rolled_back';
  createdAt: number;
}

export class SimpleOptimizationEngine {
  private db: DatabaseConnection;
  private redis: Redis;
  private config: OptimizationConfig;
  private isRunning: boolean = false;
  private optimizationInterval?: NodeJS.Timeout;

  constructor(db: DatabaseConnection, redis: Redis, config: OptimizationConfig) {
    this.db = db;
    this.redis = redis;
    this.config = config;

    this.validateConfig(config);
    this.initializeTables();
  }

  /**
   * 启动优化引擎
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Optimization engine is already running');
      return;
    }

    this.isRunning = true;

    // 启动定期优化
    this.optimizationInterval = setInterval(() => {
      this.performOptimization();
    }, this.config.optimization.optimizationInterval);

    logger.info('⚡ 优化引擎已启动');
  }

  /**
   * 停止优化引擎
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = undefined;
    }

    logger.info('🛑 优化引擎已停止');
  }

  /**
   * 优化提示词
   */
  async optimizePrompt(
    targetId: string,
    targetType: string,
    originalPrompt: string,
    feedbackAnalysis: FeedbackAnalysis
  ): Promise<PromptOptimization> {
    try {
      const optimization: PromptOptimization = {
        id: this.generateOptimizationId(),
        originalPrompt,
        optimizedPrompt: this.generateOptimizedPrompt(originalPrompt, feedbackAnalysis),
        improvements: this.calculatePromptImprovements(originalPrompt, feedbackAnalysis),
        techniques: this.getOptimizationTechniques(feedbackAnalysis),
        confidence: this.calculateOptimizationConfidence(feedbackAnalysis),
        status: 'pending',
        createdAt: Date.now()
      };

      await this.storePromptOptimization(optimization);

      // 缓存优化结果
      if (this.config.storage.enableCaching) {
        await this.cacheOptimizationResult(optimization);
      }

      logger.info(`⚡ 提示词优化完成: ${optimization.id}`);
      return optimization;
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleOptimizationEngine');
      throw error;
    }
  }

  /**
   * 优化模型参数
   */
  async optimizeModelParameters(
    targetId: string,
    targetType: string,
    modelType: string,
    originalParams: Record<string, any>,
    feedbackAnalysis: FeedbackAnalysis
  ): Promise<ModelParameterTuning> {
    try {
      const optimization: ModelParameterTuning = {
        id: this.generateOptimizationId(),
        modelType,
        originalParams,
        optimizedParams: this.generateOptimizedParameters(originalParams, feedbackAnalysis),
        improvements: this.calculateParameterImprovements(originalParams, feedbackAnalysis),
        techniques: this.getParameterOptimizationTechniques(feedbackAnalysis),
        confidence: this.calculateOptimizationConfidence(feedbackAnalysis),
        status: 'pending',
        createdAt: Date.now()
      };

      await this.storeModelParameterTuning(optimization);

      // 缓存优化结果
      if (this.config.storage.enableCaching) {
        await this.cacheOptimizationResult(optimization);
      }

      logger.info(`⚡ 模型参数优化完成: ${optimization.id}`);
      return optimization;
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleOptimizationEngine');
      throw error;
    }
  }

  /**
   * 优化算法
   */
  async optimizeAlgorithm(
    targetId: string,
    targetType: string,
    algorithmType: string,
    originalConfig: any,
    feedbackAnalysis: FeedbackAnalysis
  ): Promise<OptimizationResult> {
    try {
      const optimization: OptimizationResult = {
        id: this.generateOptimizationId(),
        type: 'algorithm',
        targetId,
        targetType,
        originalConfig,
        optimizedConfig: this.generateOptimizedAlgorithmConfig(originalConfig, feedbackAnalysis),
        improvements: this.calculateAlgorithmImprovements(originalConfig, feedbackAnalysis),
        confidence: this.calculateOptimizationConfidence(feedbackAnalysis),
        status: 'pending',
        createdAt: Date.now()
      };

      await this.storeOptimizationResult(optimization);

      // 缓存优化结果
      if (this.config.storage.enableCaching) {
        await this.cacheOptimizationResult(optimization);
      }

      logger.info(`⚡ 算法优化完成: ${optimization.id}`);
      return optimization;
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleOptimizationEngine');
      throw error;
    }
  }

  /**
   * 优化工作流
   */
  async optimizeWorkflow(
    targetId: string,
    targetType: string,
    originalWorkflow: any,
    feedbackAnalysis: FeedbackAnalysis
  ): Promise<OptimizationResult> {
    try {
      const optimization: OptimizationResult = {
        id: this.generateOptimizationId(),
        type: 'workflow',
        targetId,
        targetType,
        originalConfig: originalWorkflow,
        optimizedConfig: this.generateOptimizedWorkflow(originalWorkflow, feedbackAnalysis),
        improvements: this.calculateWorkflowImprovements(originalWorkflow, feedbackAnalysis),
        confidence: this.calculateOptimizationConfidence(feedbackAnalysis),
        status: 'pending',
        createdAt: Date.now()
      };

      await this.storeOptimizationResult(optimization);

      // 缓存优化结果
      if (this.config.storage.enableCaching) {
        await this.cacheOptimizationResult(optimization);
      }

      logger.info(`⚡ 工作流优化完成: ${optimization.id}`);
      return optimization;
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleOptimizationEngine');
      throw error;
    }
  }

  /**
   * 部署优化结果
   */
  async deployOptimization(optimizationId: string): Promise<boolean> {
    try {
      const optimization = await this.getOptimizationResult(optimizationId);
      if (!optimization) {
        throw new Error(`Optimization ${optimizationId} not found`);
      }

      // 更新状态为测试中
      optimization.status = 'testing';
      await this.updateOptimizationResult(optimization);

      // 执行A/B测试
      if (this.config.learning.enableA_BTesting) {
        const testResults = await this.performABTest(optimization);
        optimization.testResults = testResults;

        // 根据测试结果决定是否部署
        if (testResults.accuracy > 0.7 && testResults.userSatisfaction > 0.7) {
          optimization.status = 'deployed';
          optimization.deployedAt = Date.now();
        } else {
          optimization.status = 'rolled_back';
          optimization.rolledBackAt = Date.now();
        }
      } else {
        // 直接部署
        optimization.status = 'deployed';
        optimization.deployedAt = Date.now();
      }

      await this.updateOptimizationResult(optimization);

      logger.info(`🚀 优化结果已部署: ${optimizationId} (状态: ${optimization.status})`);
      return optimization.status === 'deployed';
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleOptimizationEngine');
      return false;
    }
  }

  /**
   * 回滚优化结果
   */
  async rollbackOptimization(optimizationId: string): Promise<boolean> {
    try {
      const optimization = await this.getOptimizationResult(optimizationId);
      if (!optimization) {
        throw new Error(`Optimization ${optimizationId} not found`);
      }

      optimization.status = 'rolled_back';
      optimization.rolledBackAt = Date.now();
      await this.updateOptimizationResult(optimization);

      logger.info(`🔄 优化结果已回滚: ${optimizationId}`);
      return true;
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleOptimizationEngine');
      return false;
    }
  }

  /**
   * 生成优化的提示词
   */
  private generateOptimizedPrompt(originalPrompt: string, feedbackAnalysis: FeedbackAnalysis): string {
    let optimizedPrompt = originalPrompt;

    // 基于反馈分析优化提示词
    if (feedbackAnalysis.insights.topIssues.includes('不准确')) {
      optimizedPrompt += '\n\n请确保分析结果的准确性，提供具体的数据支持。';
    }

    if (feedbackAnalysis.insights.topIssues.includes('不完整')) {
      optimizedPrompt += '\n\n请提供全面的分析，包括多个维度的考虑。';
    }

    if (feedbackAnalysis.insights.topIssues.includes('慢')) {
      optimizedPrompt += '\n\n请优先处理最重要的信息，提供简洁明了的分析。';
    }

    // 添加质量要求
    if (feedbackAnalysis.metrics.qualityScores.accuracy < 0.7) {
      optimizedPrompt += '\n\n请特别注意分析结果的准确性。';
    }

    if (feedbackAnalysis.metrics.qualityScores.relevance < 0.7) {
      optimizedPrompt += '\n\n请确保分析内容与用户需求高度相关。';
    }

    return optimizedPrompt;
  }

  /**
   * 生成优化的参数
   */
  private generateOptimizedParameters(
    originalParams: Record<string, any>,
    feedbackAnalysis: FeedbackAnalysis
  ): Record<string, any> {
    const optimizedParams = { ...originalParams };

    // 基于反馈调整参数
    if (feedbackAnalysis.metrics.qualityScores.accuracy < 0.7) {
      // 提高准确性相关参数
      if (optimizedParams.temperature !== undefined) {
        optimizedParams.temperature = Math.max(0.1, optimizedParams.temperature * 0.8);
      }
      if (optimizedParams.top_p !== undefined) {
        optimizedParams.top_p = Math.max(0.8, optimizedParams.top_p);
      }
    }

    if (feedbackAnalysis.metrics.qualityScores.timeliness < 0.7) {
      // 提高响应速度相关参数
      if (optimizedParams.max_tokens !== undefined) {
        optimizedParams.max_tokens = Math.min(2000, optimizedParams.max_tokens);
      }
    }

    if (feedbackAnalysis.metrics.qualityScores.completeness < 0.7) {
      // 提高完整性相关参数
      if (optimizedParams.max_tokens !== undefined) {
        optimizedParams.max_tokens = Math.max(1000, optimizedParams.max_tokens);
      }
    }

    return optimizedParams;
  }

  /**
   * 生成优化的算法配置
   */
  private generateOptimizedAlgorithmConfig(
    originalConfig: any,
    feedbackAnalysis: FeedbackAnalysis
  ): any {
    const optimizedConfig = { ...originalConfig };

    // 基于反馈调整算法参数
    if (feedbackAnalysis.metrics.qualityScores.accuracy < 0.7) {
      // 提高准确性
      if (optimizedConfig.confidence_threshold !== undefined) {
        optimizedConfig.confidence_threshold = Math.max(0.7, optimizedConfig.confidence_threshold);
      }
    }

    if (feedbackAnalysis.metrics.qualityScores.timeliness < 0.7) {
      // 提高响应速度
      if (optimizedConfig.timeout !== undefined) {
        optimizedConfig.timeout = Math.max(5000, optimizedConfig.timeout);
      }
    }

    return optimizedConfig;
  }

  /**
   * 生成优化的工作流
   */
  private generateOptimizedWorkflow(
    originalWorkflow: any,
    feedbackAnalysis: FeedbackAnalysis
  ): any {
    const optimizedWorkflow = { ...originalWorkflow };

    // 基于反馈调整工作流
    if (feedbackAnalysis.metrics.qualityScores.timeliness < 0.7) {
      // 优化工作流步骤，减少不必要的步骤
      if (optimizedWorkflow.steps) {
        optimizedWorkflow.steps = optimizedWorkflow.steps.filter((step: any) =>
          step.essential !== false
        );
      }
    }

    if (feedbackAnalysis.metrics.qualityScores.completeness < 0.7) {
      // 增加质量检查步骤
      if (optimizedWorkflow.steps) {
        optimizedWorkflow.steps.push({
          id: 'quality_check',
          name: '质量检查',
          type: 'quality_validation',
          essential: true
        });
      }
    }

    return optimizedWorkflow;
  }

  /**
   * 计算提示词改进
   */
  private calculatePromptImprovements(
    originalPrompt: string,
    feedbackAnalysis: FeedbackAnalysis
  ): { clarity: number; specificity: number; completeness: number; effectiveness: number } {
    const baseImprovement = Math.max(0, 1 - feedbackAnalysis.metrics.averageRating / 5);

    return {
      clarity: baseImprovement * 0.3,
      specificity: baseImprovement * 0.3,
      completeness: baseImprovement * 0.2,
      effectiveness: baseImprovement * 0.2
    };
  }

  /**
   * 计算参数改进
   */
  private calculateParameterImprovements(
    originalParams: Record<string, any>,
    feedbackAnalysis: FeedbackAnalysis
  ): { accuracy: number; precision: number; recall: number; f1Score: number } {
    const baseImprovement = Math.max(0, 1 - feedbackAnalysis.metrics.averageRating / 5);

    return {
      accuracy: baseImprovement * 0.4,
      precision: baseImprovement * 0.2,
      recall: baseImprovement * 0.2,
      f1Score: baseImprovement * 0.2
    };
  }

  /**
   * 计算算法改进
   */
  private calculateAlgorithmImprovements(
    originalConfig: any,
    feedbackAnalysis: FeedbackAnalysis
  ): { accuracy: number; relevance: number; completeness: number; timeliness: number; overall: number } {
    const baseImprovement = Math.max(0, 1 - feedbackAnalysis.metrics.averageRating / 5);

    return {
      accuracy: baseImprovement * 0.3,
      relevance: baseImprovement * 0.3,
      completeness: baseImprovement * 0.2,
      timeliness: baseImprovement * 0.2,
      overall: baseImprovement
    };
  }

  /**
   * 计算工作流改进
   */
  private calculateWorkflowImprovements(
    originalWorkflow: any,
    feedbackAnalysis: FeedbackAnalysis
  ): { accuracy: number; relevance: number; completeness: number; timeliness: number; overall: number } {
    const baseImprovement = Math.max(0, 1 - feedbackAnalysis.metrics.averageRating / 5);

    return {
      accuracy: baseImprovement * 0.2,
      relevance: baseImprovement * 0.2,
      completeness: baseImprovement * 0.3,
      timeliness: baseImprovement * 0.3,
      overall: baseImprovement
    };
  }

  /**
   * 获取优化技术
   */
  private getOptimizationTechniques(feedbackAnalysis: FeedbackAnalysis): string[] {
    const techniques: string[] = [];

    if (feedbackAnalysis.metrics.qualityScores.accuracy < 0.7) {
      techniques.push('accuracy_enhancement');
    }

    if (feedbackAnalysis.metrics.qualityScores.relevance < 0.7) {
      techniques.push('relevance_improvement');
    }

    if (feedbackAnalysis.metrics.qualityScores.completeness < 0.7) {
      techniques.push('completeness_enhancement');
    }

    if (feedbackAnalysis.metrics.qualityScores.timeliness < 0.7) {
      techniques.push('performance_optimization');
    }

    return techniques;
  }

  /**
   * 获取参数优化技术
   */
  private getParameterOptimizationTechniques(feedbackAnalysis: FeedbackAnalysis): string[] {
    const techniques: string[] = [];

    if (feedbackAnalysis.metrics.qualityScores.accuracy < 0.7) {
      techniques.push('temperature_tuning');
      techniques.push('top_p_adjustment');
    }

    if (feedbackAnalysis.metrics.qualityScores.timeliness < 0.7) {
      techniques.push('token_limit_optimization');
      techniques.push('timeout_adjustment');
    }

    return techniques;
  }

  /**
   * 计算优化置信度
   */
  private calculateOptimizationConfidence(feedbackAnalysis: FeedbackAnalysis): number {
    const sampleSize = feedbackAnalysis.metrics.totalFeedback;
    const qualityScore = feedbackAnalysis.metrics.qualityScores.accuracy;

    const sampleConfidence = Math.min(1, sampleSize / 50); // 基于样本大小
    const qualityConfidence = qualityScore;

    return (sampleConfidence + qualityConfidence) / 2;
  }

  /**
   * 执行A/B测试
   */
  private async performABTest(optimization: OptimizationResult): Promise<{
    accuracy: number;
    performance: number;
    userSatisfaction: number;
  }> {
    // 模拟A/B测试结果
    const accuracy = 0.7 + Math.random() * 0.3;
    const performance = 0.6 + Math.random() * 0.4;
    const userSatisfaction = 0.65 + Math.random() * 0.35;

    return { accuracy, performance, userSatisfaction };
  }

  /**
   * 执行定期优化
   */
  private async performOptimization(): Promise<void> {
    if (!this.isRunning) return;

    try {
      // 获取需要优化的目标
      const targets = await this.getOptimizationTargets();

      for (const target of targets) {
        try {
          await this.optimizeTarget(target);
        } catch (error) {
          logger.error(`Failed to optimize target ${target.id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Periodic optimization error:', error);
    }
  }

  /**
   * 获取优化目标
   */
  private async getOptimizationTargets(): Promise<any[]> {
    try {
      // 这里应该从数据库获取需要优化的目标
      // 简化实现，返回空数组
      return [];
    } catch (error) {
      logger.error('Failed to get optimization targets:', error);
      return [];
    }
  }

  /**
   * 优化目标
   */
  private async optimizeTarget(target: any): Promise<void> {
    // 实现目标优化逻辑
    logger.info(`Optimizing target: ${target.id}`);
  }

  /**
   * 获取优化结果
   */
  async getOptimizationResult(optimizationId: string): Promise<OptimizationResult | null> {
    try {
      const result = await this.db.query(
        'SELECT * FROM optimization_results WHERE id = ?',
        [optimizationId]
      );

      if (result.length === 0) {
        return null;
      }

      return this.parseOptimizationResultFromDb(result[0]);
    } catch (error) {
      logger.error('Failed to get optimization result:', error);
      return null;
    }
  }

  /**
   * 存储优化结果
   */
  private async storeOptimizationResult(optimization: OptimizationResult): Promise<void> {
    try {
      await this.db.query(`
        INSERT OR REPLACE INTO optimization_results (
          id, type, target_id, target_type, original_config, optimized_config,
          improvements, confidence, status, test_results, created_at, deployed_at, rolled_back_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        optimization.id, optimization.type, optimization.targetId, optimization.targetType,
        JSON.stringify(optimization.originalConfig), JSON.stringify(optimization.optimizedConfig),
        JSON.stringify(optimization.improvements), optimization.confidence, optimization.status,
        JSON.stringify(optimization.testResults), optimization.createdAt,
        optimization.deployedAt, optimization.rolledBackAt
      ]);
    } catch (error) {
      logger.error('Failed to store optimization result:', error);
      throw error;
    }
  }

  /**
   * 更新优化结果
   */
  private async updateOptimizationResult(optimization: OptimizationResult): Promise<void> {
    try {
      await this.db.query(`
        UPDATE optimization_results SET
          status = ?, test_results = ?, deployed_at = ?, rolled_back_at = ?
        WHERE id = ?
      `, [
        optimization.status, JSON.stringify(optimization.testResults),
        optimization.deployedAt, optimization.rolledBackAt, optimization.id
      ]);
    } catch (error) {
      logger.error('Failed to update optimization result:', error);
      throw error;
    }
  }

  /**
   * 存储提示词优化
   */
  private async storePromptOptimization(optimization: PromptOptimization): Promise<void> {
    try {
      await this.db.query(`
        INSERT OR REPLACE INTO prompt_optimizations (
          id, original_prompt, optimized_prompt, improvements, techniques,
          confidence, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        optimization.id, optimization.originalPrompt, optimization.optimizedPrompt,
        JSON.stringify(optimization.improvements), JSON.stringify(optimization.techniques),
        optimization.confidence, optimization.status, optimization.createdAt
      ]);
    } catch (error) {
      logger.error('Failed to store prompt optimization:', error);
      throw error;
    }
  }

  /**
   * 存储模型参数调优
   */
  private async storeModelParameterTuning(optimization: ModelParameterTuning): Promise<void> {
    try {
      await this.db.query(`
        INSERT OR REPLACE INTO model_parameter_tunings (
          id, model_type, original_params, optimized_params, improvements,
          techniques, confidence, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        optimization.id, optimization.modelType, JSON.stringify(optimization.originalParams),
        JSON.stringify(optimization.optimizedParams), JSON.stringify(optimization.improvements),
        JSON.stringify(optimization.techniques), optimization.confidence,
        optimization.status, optimization.createdAt
      ]);
    } catch (error) {
      logger.error('Failed to store model parameter tuning:', error);
      throw error;
    }
  }

  /**
   * 缓存优化结果
   */
  private async cacheOptimizationResult(optimization: any): Promise<void> {
    try {
      const key = `optimization:${optimization.id}`;
      await this.redis.setex(key, this.config.storage.cacheTtl, JSON.stringify(optimization));
    } catch (error) {
      logger.error('Failed to cache optimization result:', error);
    }
  }

  /**
   * 从数据库解析优化结果
   */
  private parseOptimizationResultFromDb(row: any): OptimizationResult {
    return {
      id: row.id,
      type: row.type,
      targetId: row.target_id,
      targetType: row.target_type,
      originalConfig: JSON.parse(row.original_config),
      optimizedConfig: JSON.parse(row.optimized_config),
      improvements: JSON.parse(row.improvements),
      confidence: row.confidence,
      status: row.status,
      testResults: row.test_results ? JSON.parse(row.test_results) : undefined,
      createdAt: row.created_at,
      deployedAt: row.deployed_at,
      rolledBackAt: row.rolled_back_at
    };
  }

  /**
   * 初始化数据库表
   */
  private async initializeTables(): Promise<void> {
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS optimization_results (
          id VARCHAR(100) PRIMARY KEY,
          type VARCHAR(50) NOT NULL,
          target_id VARCHAR(100) NOT NULL,
          target_type VARCHAR(50) NOT NULL,
          original_config TEXT NOT NULL,
          optimized_config TEXT NOT NULL,
          improvements TEXT NOT NULL,
          confidence REAL NOT NULL,
          status VARCHAR(20) NOT NULL,
          test_results TEXT,
          created_at INTEGER NOT NULL,
          deployed_at INTEGER,
          rolled_back_at INTEGER,
          INDEX idx_target (target_id, target_type),
          INDEX idx_type (type),
          INDEX idx_status (status),
          INDEX idx_created_at (created_at)
        )
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS prompt_optimizations (
          id VARCHAR(100) PRIMARY KEY,
          original_prompt TEXT NOT NULL,
          optimized_prompt TEXT NOT NULL,
          improvements TEXT NOT NULL,
          techniques TEXT NOT NULL,
          confidence REAL NOT NULL,
          status VARCHAR(20) NOT NULL,
          created_at INTEGER NOT NULL,
          INDEX idx_status (status),
          INDEX idx_created_at (created_at)
        )
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS model_parameter_tunings (
          id VARCHAR(100) PRIMARY KEY,
          model_type VARCHAR(50) NOT NULL,
          original_params TEXT NOT NULL,
          optimized_params TEXT NOT NULL,
          improvements TEXT NOT NULL,
          techniques TEXT NOT NULL,
          confidence REAL NOT NULL,
          status VARCHAR(20) NOT NULL,
          created_at INTEGER NOT NULL,
          INDEX idx_model_type (model_type),
          INDEX idx_status (status),
          INDEX idx_created_at (created_at)
        )
      `);
    } catch (error) {
      logger.error('Failed to initialize optimization tables:', error);
    }
  }

  /**
   * 验证配置
   */
  private validateConfig(config: OptimizationConfig): void {
    BaseConfigValidator.validate(config, ['enabled', 'optimization', 'learning']);

    if (config.optimization.optimizationInterval <= 0) {
      throw new Error('optimizationInterval must be greater than 0');
    }

    if (config.learning.learningRate <= 0 || config.learning.learningRate > 1) {
      throw new Error('learningRate must be between 0 and 1');
    }
  }

  /**
   * 生成优化ID
   */
  private generateOptimizationId(): string {
    return `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<any> {
    try {
      const totalOptimizations = await this.db.query('SELECT COUNT(*) as count FROM optimization_results');
      const deployedOptimizations = await this.db.query('SELECT COUNT(*) as count FROM optimization_results WHERE status = ?', ['deployed']);
      const pendingOptimizations = await this.db.query('SELECT COUNT(*) as count FROM optimization_results WHERE status = ?', ['pending']);

      return {
        totalOptimizations: totalOptimizations[0].count,
        deployedOptimizations: deployedOptimizations[0].count,
        pendingOptimizations: pendingOptimizations[0].count,
        isRunning: this.isRunning
      };
    } catch (error) {
      logger.error('Failed to get optimization stats:', error);
      return { totalOptimizations: 0, deployedOptimizations: 0, pendingOptimizations: 0, isRunning: false };
    }
  }
}

/**
 * 任务调度器
 * 负责智能调度各种分析任务，根据任务复杂度选择LLM策略
 */

import { LLMServiceManager } from './llm';
import { roundConfigManager, TaskRoundRecommendation } from '../llm/RoundConfigManager';
import { tokenCalculator } from '../llm/TokenCalculator';
import { getToolsForTaskType } from '../llm/config';

export interface AnalysisTask {
  taskId: string;
  taskType: 'news_importance' | 'historical_attribution' | 'timeline_build' | 'model_adjustment';
  input: any;
  output?: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dataSource: 'database' | 'llm_search' | 'mixed';
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  retryCount: number;
  maxRetries: number;
  metadata: {
    rounds: number;
    estimatedTime: number;
    llmStrategy: string;
    dataSize: number;
    estimatedCost: number;
    qualityLevel: string;
    // 深度思考相关参数
    thinkingDepth?: 'shallow' | 'medium' | 'deep' | 'deepest';
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    timeout?: number;
    tools?: any[];
  };
}

export interface LLMStrategy {
  strategy: 'single_llm' | 'dual_llm' | 'collaborative_llm';
  providers: string[];
  models: string[];
  maxTokens: number;
  temperature: number;
  timeout: number;
  retries: number;
}

export interface TaskQueue {
  pending: AnalysisTask[];
  running: AnalysisTask[];
  completed: AnalysisTask[];
  failed: AnalysisTask[];
}

export class TaskScheduler {
  private llmManager: LLMServiceManager;
  private taskQueue: TaskQueue;
  private maxConcurrentTasks: number;
  private isRunning: boolean;
  private taskProcessors: Map<string, (task: AnalysisTask) => Promise<any>>;
  private metrics: Map<string, any> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.llmManager = LLMServiceManager.getInstance();
    this.taskQueue = {
      pending: [],
      running: [],
      completed: [],
      failed: []
    };
    this.maxConcurrentTasks = 5;
    this.isRunning = false;
    this.taskProcessors = new Map();
    
    this.startHealthChecks();
    this.startCleanup();
  }

  /**
   * 添加任务到队列
   */
  public async addTask(task: Omit<AnalysisTask, 'taskId' | 'status' | 'createdAt' | 'retryCount' | 'metadata'>): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    // 获取轮数配置
    const roundRecommendation = this.getRoundRecommendation(task);
    
    // 选择LLM策略
    const llmStrategy = this.selectLLMStrategy(roundRecommendation.recommendedRounds, task.taskType);
    
    // 估算成本
    const estimatedCost = this.estimateCostForTask(task, roundRecommendation.recommendedRounds);
    
    // 获取工具配置
    const tools = getToolsForTaskType(task.taskType);
    
    const fullTask: AnalysisTask = {
      ...task,
      taskId,
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 3,
      metadata: {
        rounds: roundRecommendation.recommendedRounds,
        estimatedTime: this.estimateExecutionTime(roundRecommendation.recommendedRounds, task.taskType),
        llmStrategy: llmStrategy.strategy,
        dataSize: this.calculateDataSize(task.input),
        estimatedCost,
        qualityLevel: roundRecommendation.qualityLevel,
        // 深度思考相关参数
        thinkingDepth: roundRecommendation.thinkingDepth,
        temperature: roundRecommendation.temperature,
        topP: roundRecommendation.topP,
        maxTokens: roundRecommendation.maxTokens,
        timeout: roundRecommendation.timeout,
        tools
      }
    };

    // 根据优先级插入队列
    this.insertTaskByPriority(fullTask);
    
    console.log(`📋 任务已添加到队列: ${taskId} (${task.taskType}, 优先级: ${task.priority})`);
    
    // 启动任务处理
    this.processTasks();
    
    return taskId;
  }

  /**
   * 获取轮数推荐
   */
  private getRoundRecommendation(task: Omit<AnalysisTask, 'taskId' | 'status' | 'createdAt' | 'retryCount' | 'metadata'>): TaskRoundRecommendation {
    // 根据优先级确定质量要求
    const qualityRequirement = this.getQualityRequirementFromPriority(task.priority);
    
    // 根据数据源确定成本约束
    const costConstraint = this.getCostConstraintFromDataSource(task.dataSource);
    
    return roundConfigManager.getRecommendedRounds(
      task.taskType,
      qualityRequirement,
      costConstraint
    );
  }

  /**
   * 选择LLM策略
   */
  private selectLLMStrategy(rounds: number, taskType: string): LLMStrategy {
    if (rounds === 1) {
      return {
        strategy: 'single_llm',
        providers: ['doubao'],
        models: ['doubao-seed-1-6-flash-250615'],
        maxTokens: 1500,
        temperature: 0.3,
        timeout: 60000,
        retries: 2
      };
    } else if (rounds <= 3) {
      return {
        strategy: 'dual_llm',
        providers: ['doubao', 'hunyuan'],
        models: ['doubao-seed-1-6-250615', 'hunyuan-turbo-latest'],
        maxTokens: 2500,
        temperature: 0.4,
        timeout: 150000,
        retries: 3
      };
    } else {
      return {
        strategy: 'collaborative_llm',
        providers: ['doubao', 'hunyuan', 'doubao'],
        models: ['doubao-seed-1-6-250615', 'hunyuan-t1-latest', 'doubao-seed-1-6-pro-250615'],
        maxTokens: 4000,
        temperature: 0.5,
        timeout: 180000,
        retries: 5
      };
    }
  }

  /**
   * 根据优先级插入任务
   */
  private insertTaskByPriority(task: AnalysisTask): void {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const taskPriority = priorityOrder[task.priority];
    
    let insertIndex = this.taskQueue.pending.length;
    
    for (let i = 0; i < this.taskQueue.pending.length; i++) {
      const existingPriority = priorityOrder[this.taskQueue.pending[i].priority];
      if (taskPriority < existingPriority) {
        insertIndex = i;
        break;
      }
    }
    
    this.taskQueue.pending.splice(insertIndex, 0, task);
  }

  /**
   * 处理任务队列
   */
  private async processTasks(): Promise<void> {
    if (this.isRunning || this.taskQueue.pending.length === 0) {
      return;
    }

    this.isRunning = true;
    console.log('🚀 开始处理任务队列...');

    while (this.taskQueue.pending.length > 0 && this.taskQueue.running.length < this.maxConcurrentTasks) {
      const task = this.taskQueue.pending.shift();
      if (task) {
        this.executeTask(task);
      }
    }

    this.isRunning = false;
  }

  /**
   * 执行任务
   */
  private async executeTask(task: AnalysisTask): Promise<void> {
    try {
      task.status = 'running';
      task.startedAt = Date.now();
      this.taskQueue.running.push(task);

      console.log(`⚡ 开始执行任务: ${task.taskId} (${task.taskType})`);

      // 获取任务处理器
      const processor = this.taskProcessors.get(task.taskType);
      if (!processor) {
        throw new Error(`未找到任务处理器: ${task.taskType}`);
      }

      // 执行任务
      const result = await processor(task);
      
      // 任务完成
      task.status = 'completed';
      task.completedAt = Date.now();
      task.output = result;

      // 移动到完成队列
      this.moveTaskToCompleted(task);
      
      console.log(`✅ 任务完成: ${task.taskId} (耗时: ${task.completedAt - task.startedAt!}ms)`);

    } catch (error) {
      console.error(`❌ 任务执行失败: ${task.taskId}`, error);
      
      // 重试逻辑
      if (task.retryCount < task.maxRetries) {
        task.retryCount++;
        task.status = 'pending';
        task.startedAt = undefined;
        this.taskQueue.pending.unshift(task);
        console.log(`🔄 任务重试: ${task.taskId} (第${task.retryCount}次)`);
      } else {
        // 任务失败
        task.status = 'failed';
        task.completedAt = Date.now();
        this.moveTaskToFailed(task);
        console.log(`💥 任务最终失败: ${task.taskId}`);
      }
    } finally {
      // 从运行队列中移除
      const runningIndex = this.taskQueue.running.findIndex(t => t.taskId === task.taskId);
      if (runningIndex !== -1) {
        this.taskQueue.running.splice(runningIndex, 1);
      }

      // 继续处理下一个任务
      this.processTasks();
    }
  }

  /**
   * 注册任务处理器
   */
  public registerTaskProcessor(taskType: string, processor: (task: AnalysisTask) => Promise<any>): void {
    this.taskProcessors.set(taskType, processor);
    console.log(`📝 注册任务处理器: ${taskType}`);
  }

  /**
   * 移动任务到完成队列
   */
  private moveTaskToCompleted(task: AnalysisTask): void {
    this.taskQueue.completed.push(task);
    
    // 限制完成队列大小
    if (this.taskQueue.completed.length > 1000) {
      this.taskQueue.completed.shift();
    }
  }

  /**
   * 移动任务到失败队列
   */
  private moveTaskToFailed(task: AnalysisTask): void {
    this.taskQueue.failed.push(task);
    
    // 限制失败队列大小
    if (this.taskQueue.failed.length > 100) {
      this.taskQueue.failed.shift();
    }
  }

  /**
   * 获取任务状态
   */
  public getTaskStatus(taskId: string): AnalysisTask | null {
    const allTasks = [
      ...this.taskQueue.pending,
      ...this.taskQueue.running,
      ...this.taskQueue.completed,
      ...this.taskQueue.failed
    ];
    
    return allTasks.find(task => task.taskId === taskId) || null;
  }

  /**
   * 获取队列统计
   */
  public getQueueStats(): {
    pending: number;
    running: number;
    completed: number;
    failed: number;
    total: number;
  } {
    return {
      pending: this.taskQueue.pending.length,
      running: this.taskQueue.running.length,
      completed: this.taskQueue.completed.length,
      failed: this.taskQueue.failed.length,
      total: this.taskQueue.pending.length + 
             this.taskQueue.running.length + 
             this.taskQueue.completed.length + 
             this.taskQueue.failed.length
    };
  }

  /**
   * 清理过期任务
   */
  public cleanupExpiredTasks(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    
    // 清理完成的任务
    this.taskQueue.completed = this.taskQueue.completed.filter(
      task => now - task.completedAt! < maxAge
    );
    
    // 清理失败的任务
    this.taskQueue.failed = this.taskQueue.failed.filter(
      task => now - task.completedAt! < maxAge
    );
    
    console.log('🧹 清理过期任务完成');
  }

  // 辅助方法
  private getTaskTypeComplexity(taskType: string): number {
    const complexityMap = {
      'news_importance': 0.3,
      'historical_attribution': 0.8,
      'timeline_build': 0.9,
      'model_adjustment': 0.6
    };
    return complexityMap[taskType as keyof typeof complexityMap] || 0.5;
  }

  private getPriorityWeight(priority: string): number {
    const weightMap = {
      'urgent': 0.9,
      'high': 0.7,
      'medium': 0.5,
      'low': 0.3
    };
    return weightMap[priority as keyof typeof weightMap] || 0.5;
  }

  private getDataSourceComplexity(dataSource: string): number {
    const complexityMap = {
      'database': 0.2,
      'llm_search': 0.8,
      'mixed': 0.9
    };
    return complexityMap[dataSource as keyof typeof complexityMap] || 0.5;
  }

  private calculateDataSize(input: any): number {
    try {
      const jsonString = JSON.stringify(input);
      return Math.min(1, jsonString.length / 10000); // 标准化到0-1
    } catch {
      return 0.5;
    }
  }

  private estimateExecutionTime(rounds: number, taskType: string): number {
    const baseTime = {
      'news_importance': 30000,
      'historical_attribution': 120000,
      'timeline_build': 180000,
      'model_adjustment': 150000
    };
    
    const base = baseTime[taskType as keyof typeof baseTime] || 150000;
    return Math.round(base * rounds);
  }

  /**
   * 根据优先级获取质量要求
   */
  private getQualityRequirementFromPriority(priority: string): 'basic' | 'standard' | 'high' | 'premium' {
    switch (priority) {
      case 'low': return 'basic';
      case 'medium': return 'standard';
      case 'high': return 'high';
      case 'urgent': return 'premium';
      default: return 'standard';
    }
  }

  /**
   * 根据数据源获取成本约束
   */
  private getCostConstraintFromDataSource(dataSource: string): number | undefined {
    switch (dataSource) {
      case 'database': return 0.01; // 数据库数据成本较低
      case 'llm_search': return 0.05; // LLM搜索成本中等
      case 'mixed': return 0.1; // 混合数据源成本较高
      default: return undefined;
    }
  }

  /**
   * 估算任务成本
   */
  private estimateCostForTask(task: Omit<AnalysisTask, 'taskId' | 'status' | 'createdAt' | 'retryCount' | 'metadata'>, rounds: number): number {
    // 使用Token计算器估算成本
    const estimation = tokenCalculator.estimateTokensForTask(
      task.taskType,
      'doubao-seed-1-6-flash-250615', // 默认使用最便宜的模型
      'doubao',
      rounds,
      'medium'
    );
    
    return estimation.cost;
  }

  /**
   * 开始健康检查
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000); // 每30秒检查一次
  }

  /**
   * 开始清理任务
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredTasks();
    }, 3600000); // 每小时清理一次
  }

  /**
   * 执行健康检查
   */
  private performHealthCheck(): void {
    const stats = this.getQueueStats();
    const healthStatus = {
      timestamp: Date.now(),
      status: 'healthy',
      stats,
      issues: []
    };

    // 检查是否有长时间运行的任务
    const now = Date.now();
    const longRunningTasks = this.taskQueue.running.filter(task => 
      task.startedAt && (now - task.startedAt) > 300000 // 5分钟
    );

    if (longRunningTasks.length > 0) {
      healthStatus.issues.push(`发现 ${longRunningTasks.length} 个长时间运行的任务`);
    }

    // 检查失败率
    const totalTasks = stats.total;
    const failedTasks = stats.failed;
    const failureRate = totalTasks > 0 ? failedTasks / totalTasks : 0;

    if (failureRate > 0.1) { // 失败率超过10%
      healthStatus.issues.push(`任务失败率过高: ${(failureRate * 100).toFixed(2)}%`);
      healthStatus.status = 'warning';
    }

    // 检查队列积压
    if (stats.pending > 100) {
      healthStatus.issues.push(`待处理任务过多: ${stats.pending}`);
      healthStatus.status = 'warning';
    }

    this.metrics.set('health_status', healthStatus);
  }

  /**
   * 获取健康状态
   */
  getHealthStatus(): any {
    return this.metrics.get('health_status') || { status: 'unknown' };
  }

  /**
   * 获取详细指标
   */
  getDetailedMetrics(): any {
    const stats = this.getQueueStats();
    const healthStatus = this.getHealthStatus();
    
    return {
      timestamp: Date.now(),
      queue: stats,
      health: healthStatus,
      processors: Array.from(this.taskProcessors.keys()),
      maxConcurrentTasks: this.maxConcurrentTasks,
      isRunning: this.isRunning
    };
  }

  /**
   * 暂停调度器
   */
  pause(): void {
    this.isRunning = false;
    console.log('⏸️ 任务调度器已暂停');
  }

  /**
   * 恢复调度器
   */
  resume(): void {
    this.isRunning = false; // 重置状态
    this.processTasks();
    console.log('▶️ 任务调度器已恢复');
  }

  /**
   * 调整并发数
   */
  setMaxConcurrentTasks(maxTasks: number): void {
    if (maxTasks <= 0) {
      throw new Error('maxConcurrentTasks must be positive');
    }
    
    this.maxConcurrentTasks = maxTasks;
    console.log(`🔧 最大并发任务数调整为: ${maxTasks}`);
    
    // 如果当前运行的任务数超过新的限制，停止处理新任务
    if (this.taskQueue.running.length >= maxTasks) {
      this.isRunning = true;
    }
  }

  /**
   * 获取任务详情
   */
  getTaskDetails(taskId: string): AnalysisTask | null {
    return this.getTaskStatus(taskId);
  }

  /**
   * 取消任务
   */
  cancelTask(taskId: string): boolean {
    const task = this.getTaskStatus(taskId);
    if (!task) return false;

    if (task.status === 'pending') {
      const index = this.taskQueue.pending.findIndex(t => t.taskId === taskId);
      if (index !== -1) {
        this.taskQueue.pending.splice(index, 1);
        task.status = 'failed';
        task.completedAt = Date.now();
        this.taskQueue.failed.push(task);
        console.log(`❌ 任务已取消: ${taskId}`);
        return true;
      }
    }

    return false;
  }

  /**
   * 重启失败的任务
   */
  restartFailedTask(taskId: string): boolean {
    const task = this.getTaskStatus(taskId);
    if (!task || task.status !== 'failed') return false;

    // 从失败队列移除
    const failedIndex = this.taskQueue.failed.findIndex(t => t.taskId === taskId);
    if (failedIndex !== -1) {
      this.taskQueue.failed.splice(failedIndex, 1);
    }

    // 重置任务状态
    task.status = 'pending';
    task.retryCount = 0;
    task.startedAt = undefined;
    task.completedAt = undefined;
    task.output = undefined;

    // 添加到待处理队列
    this.insertTaskByPriority(task);
    
    console.log(`🔄 失败任务已重启: ${taskId}`);
    return true;
  }

  /**
   * 销毁调度器
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.isRunning = false;
    console.log('🛑 任务调度器已销毁');
  }
}

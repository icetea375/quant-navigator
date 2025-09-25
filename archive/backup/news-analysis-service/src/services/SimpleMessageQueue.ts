/**
 * SimpleMessageQueue - 消息队列系统
 * 提供任务队列、死信队列、任务依赖管理功能
 */

import { BaseErrorHandler } from '../utils/BaseErrorHandler';
import { BaseConfigValidator } from '../utils/BaseConfigValidator';

export interface MessageQueueConfig {
  enabled: boolean;
  maxConcurrentTasks: number;
  retryCount: number;
  retryDelay: number;
  deadLetterQueue: {
    enabled: boolean;
    maxRetries: number;
    retentionDays: number;
  };
  monitoring: {
    enabled: boolean;
    alertThresholds: {
      queueSize: number;
      processingTime: number;
      errorRate: number;
    };
  };
}

export interface Task {
  id: string;
  type: string;
  payload: any;
  priority: number;
  dependencies: string[];
  retryCount: number;
  maxRetries: number;
  createdAt: number;
  scheduledAt: number;
  startedAt?: number;
  completedAt?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  result?: any;
}

export interface QueueStats {
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  cancelledTasks: number;
  averageProcessingTime: number;
  errorRate: number;
  queueSize: number;
}

export interface DeadLetterItem {
  id: string;
  originalTask: Task;
  reason: string;
  createdAt: number;
  retryCount: number;
}

export class SimpleMessageQueue {
  private config: MessageQueueConfig;
  private queues: Map<string, Task[]> = new Map();
  private runningTasks: Map<string, Task> = new Map();
  private completedTasks: Map<string, Task> = new Map();
  private deadLetterQueue: DeadLetterItem[] = [];
  private isRunning: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private stats: QueueStats = {
    totalTasks: 0,
    pendingTasks: 0,
    runningTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    cancelledTasks: 0,
    averageProcessingTime: 0,
    errorRate: 0,
    queueSize: 0
  };

  constructor(config: MessageQueueConfig) {
    BaseConfigValidator.validate(config, ['enabled', 'maxConcurrentTasks', 'retryCount', 'retryDelay']);
    this.config = config;
  }

  /**
   * 启动消息队列
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    
    if (this.config.enabled) {
      // 启动任务处理循环
      this.processingInterval = setInterval(() => {
        this.processTasks();
      }, 1000); // 每秒处理一次
    }

    console.log('SimpleMessageQueue started');
  }

  /**
   * 停止消息队列
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    console.log('SimpleMessageQueue stopped');
  }

  /**
   * 添加任务到队列
   */
  public async addTask(
    type: string,
    payload: any,
    options: {
      priority?: number;
      dependencies?: string[];
      maxRetries?: number;
      delay?: number;
    } = {}
  ): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const scheduledAt = Date.now() + (options.delay || 0);

    const task: Task = {
      id: taskId,
      type,
      payload,
      priority: options.priority || 0,
      dependencies: options.dependencies || [],
      retryCount: 0,
      maxRetries: options.maxRetries || this.config.retryCount,
      createdAt: Date.now(),
      scheduledAt,
      status: 'pending'
    };

    // 添加到队列
    if (!this.queues.has(type)) {
      this.queues.set(type, []);
    }
    
    this.queues.get(type)!.push(task);
    
    // 按优先级排序
    this.queues.get(type)!.sort((a, b) => b.priority - a.priority);

    this.updateStats();
    console.log(`Task ${taskId} added to queue ${type}`);

    return taskId;
  }

  /**
   * 处理任务
   */
  private async processTasks(): Promise<void> {
    if (this.runningTasks.size >= this.config.maxConcurrentTasks) {
      return;
    }

    // 遍历所有队列
    for (const [queueType, tasks] of this.queues.entries()) {
      if (this.runningTasks.size >= this.config.maxConcurrentTasks) {
        break;
      }

      // 找到可执行的任务
      const executableTask = this.findExecutableTask(tasks);
      if (executableTask) {
        await this.executeTask(executableTask, queueType);
      }
    }
  }

  /**
   * 查找可执行的任务
   */
  private findExecutableTask(tasks: Task[]): Task | null {
    const now = Date.now();
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      
      // 检查任务是否已调度
      if (task.scheduledAt > now) {
        continue;
      }

      // 检查依赖是否满足
      if (task.dependencies.length > 0) {
        const allDependenciesCompleted = task.dependencies.every(depId => {
          const depTask = this.completedTasks.get(depId);
          return depTask && depTask.status === 'completed';
        });

        if (!allDependenciesCompleted) {
          continue;
        }
      }

      // 找到可执行的任务
      return tasks.splice(i, 1)[0];
    }

    return null;
  }

  /**
   * 执行任务
   */
  private async executeTask(task: Task, queueType: string): Promise<void> {
    task.status = 'running';
    task.startedAt = Date.now();
    this.runningTasks.set(task.id, task);

    try {
      // 执行任务处理函数
      const result = await this.processTask(task);
      
      // 任务成功完成
      task.status = 'completed';
      task.completedAt = Date.now();
      task.result = result;
      
      this.completedTasks.set(task.id, task);
      this.runningTasks.delete(task.id);

      console.log(`Task ${task.id} completed successfully`);

    } catch (error) {
      // 任务执行失败
      task.error = error instanceof Error ? error.message : String(error);
      task.retryCount++;

      if (task.retryCount < task.maxRetries) {
        // 重试任务
        task.status = 'pending';
        task.scheduledAt = Date.now() + this.config.retryDelay * Math.pow(2, task.retryCount - 1); // 指数退避
        this.queues.get(queueType)!.push(task);
        this.runningTasks.delete(task.id);
        
        console.log(`Task ${task.id} failed, retrying (${task.retryCount}/${task.maxRetries})`);
      } else {
        // 任务失败，移到死信队列
        task.status = 'failed';
        task.completedAt = Date.now();
        
        this.completedTasks.set(task.id, task);
        this.runningTasks.delete(task.id);

        if (this.config.deadLetterQueue.enabled) {
          this.addToDeadLetterQueue(task, error instanceof Error ? error.message : String(error));
        }

        console.log(`Task ${task.id} failed permanently, moved to dead letter queue`);
      }
    }

    this.updateStats();
  }

  /**
   * 处理任务（需要子类实现）
   */
  private async processTask(task: Task): Promise<any> {
    // 这里需要根据任务类型调用相应的处理函数
    // 简化实现，返回成功
    return { success: true, taskId: task.id };
  }

  /**
   * 添加到死信队列
   */
  private addToDeadLetterQueue(task: Task, reason: string): void {
    const deadLetterItem: DeadLetterItem = {
      id: `dlq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalTask: task,
      reason,
      createdAt: Date.now(),
      retryCount: task.retryCount
    };

    this.deadLetterQueue.push(deadLetterItem);

    // 清理过期的死信队列项目
    if (this.config.deadLetterQueue.retentionDays > 0) {
      const cutoffTime = Date.now() - (this.config.deadLetterQueue.retentionDays * 24 * 60 * 60 * 1000);
      this.deadLetterQueue = this.deadLetterQueue.filter(item => item.createdAt > cutoffTime);
    }
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    let totalTasks = 0;
    let pendingTasks = 0;
    let runningTasks = this.runningTasks.size;
    let completedTasks = 0;
    let failedTasks = 0;
    let cancelledTasks = 0;
    let totalProcessingTime = 0;
    let completedCount = 0;

    // 统计队列中的任务
    for (const tasks of this.queues.values()) {
      totalTasks += tasks.length;
      pendingTasks += tasks.length;
    }

    // 统计已完成的任务
    for (const task of this.completedTasks.values()) {
      totalTasks++;
      completedTasks++;
      
      if (task.status === 'failed') {
        failedTasks++;
      } else if (task.status === 'cancelled') {
        cancelledTasks++;
      } else if (task.status === 'completed' && task.startedAt && task.completedAt) {
        totalProcessingTime += task.completedAt - task.startedAt;
        completedCount++;
      }
    }

    this.stats = {
      totalTasks,
      pendingTasks,
      runningTasks,
      completedTasks,
      failedTasks,
      cancelledTasks,
      averageProcessingTime: completedCount > 0 ? totalProcessingTime / completedCount : 0,
      errorRate: totalTasks > 0 ? (failedTasks / totalTasks) * 100 : 0,
      queueSize: pendingTasks
    };
  }

  /**
   * 获取队列统计信息
   */
  public getStats(): QueueStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * 获取特定队列的任务
   */
  public getQueueTasks(queueType: string): Task[] {
    return this.queues.get(queueType) || [];
  }

  /**
   * 获取运行中的任务
   */
  public getRunningTasks(): Task[] {
    return Array.from(this.runningTasks.values());
  }

  /**
   * 获取已完成的任务
   */
  public getCompletedTasks(): Task[] {
    return Array.from(this.completedTasks.values());
  }

  /**
   * 获取死信队列
   */
  public getDeadLetterQueue(): DeadLetterItem[] {
    return [...this.deadLetterQueue];
  }

  /**
   * 取消任务
   */
  public cancelTask(taskId: string): boolean {
    // 检查运行中的任务
    const runningTask = this.runningTasks.get(taskId);
    if (runningTask) {
      runningTask.status = 'cancelled';
      runningTask.completedAt = Date.now();
      this.completedTasks.set(taskId, runningTask);
      this.runningTasks.delete(taskId);
      this.updateStats();
      return true;
    }

    // 检查队列中的任务
    for (const tasks of this.queues.values()) {
      const taskIndex = tasks.findIndex(task => task.id === taskId);
      if (taskIndex !== -1) {
        const task = tasks.splice(taskIndex, 1)[0];
        task.status = 'cancelled';
        task.completedAt = Date.now();
        this.completedTasks.set(taskId, task);
        this.updateStats();
        return true;
      }
    }

    return false;
  }

  /**
   * 重新处理死信队列中的任务
   */
  public retryDeadLetterTask(deadLetterId: string): boolean {
    const deadLetterIndex = this.deadLetterQueue.findIndex(item => item.id === deadLetterId);
    if (deadLetterIndex === -1) {
      return false;
    }

    const deadLetterItem = this.deadLetterQueue[deadLetterIndex];
    const originalTask = deadLetterItem.originalTask;

    // 重置任务状态
    originalTask.status = 'pending';
    originalTask.retryCount = 0;
    originalTask.error = undefined;
    originalTask.scheduledAt = Date.now();

    // 重新添加到队列
    if (!this.queues.has(originalTask.type)) {
      this.queues.set(originalTask.type, []);
    }
    this.queues.get(originalTask.type)!.push(originalTask);

    // 从死信队列中移除
    this.deadLetterQueue.splice(deadLetterIndex, 1);

    this.updateStats();
    console.log(`Dead letter task ${originalTask.id} retried`);

    return true;
  }

  /**
   * 清理已完成的任务
   */
  public cleanupCompletedTasks(olderThanDays: number = 7): number {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [taskId, task] of this.completedTasks.entries()) {
      if (task.completedAt && task.completedAt < cutoffTime) {
        this.completedTasks.delete(taskId);
        cleanedCount++;
      }
    }

    this.updateStats();
    console.log(`Cleaned up ${cleanedCount} completed tasks`);

    return cleanedCount;
  }

  /**
   * 获取配置信息
   */
  public getConfig(): MessageQueueConfig {
    return { ...this.config };
  }
}

// 导出默认配置
export const defaultMessageQueueConfig: MessageQueueConfig = {
  enabled: true,
  maxConcurrentTasks: 5,
  retryCount: 3,
  retryDelay: 5000,
  deadLetterQueue: {
    enabled: true,
    maxRetries: 3,
    retentionDays: 30
  },
  monitoring: {
    enabled: true,
    alertThresholds: {
      queueSize: 100,
      processingTime: 300000, // 5分钟
      errorRate: 10 // 10%
    }
  }
};

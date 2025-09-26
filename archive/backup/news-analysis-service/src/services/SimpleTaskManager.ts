/**
 * 简化任务管理器
 * 遵循智能分析系统开发实施指南的命名规范
 */

import { DatabaseConnection } from '../database/connection';
import { Redis } from 'ioredis';
import { BaseErrorHandler } from '../utils/BaseErrorHandler';
import { BaseConfigValidator } from '../utils/BaseConfigValidator';

export interface Task {
  id: string;
  name: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  data: any;
  result?: any;
  errorMessage?: string;
  dependencies?: string[];
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  scheduledAt?: Date;
  timeout?: number;
  metadata?: Record<string, any>;
}

export interface TaskConfig {
  enabled: boolean;
  maxConcurrent: number;
  retryDelay: number;
  maxRetries: number;
  defaultTimeout: number;
  enablePersistence: boolean;
  enableDependencies: boolean;
  enablePriority: boolean;
}

export interface TaskStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
  retries: number;
  averageExecutionTime: number;
  successRate: number;
}

export type TaskProcessor = (task: Task) => Promise<any>;

export class SimpleTaskManager {
  private db: DatabaseConnection;
  private redis: Redis;
  private taskQueue: Map<string, Task> = new Map();
  private dependencies: Map<string, string[]> = new Map();
  private processors: Map<string, TaskProcessor> = new Map();
  private stats: TaskStats;
  private config: TaskConfig;
  private isRunning: boolean = false;
  private runningTasks: Set<string> = new Set();
  private processingInterval?: NodeJS.Timeout;

  constructor(db: DatabaseConnection, redis: Redis, config: TaskConfig) {
    this.db = db;
    this.redis = redis;
    this.config = config;
    this.stats = {
      total: 0,
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      retries: 0,
      averageExecutionTime: 0,
      successRate: 0
    };

    this.validateConfig(config);
    this.initializeTables();
    this.loadPersistedTasks();
  }

  /**
   * 启动任务管理器
   */
  start(): void {
    if (this.isRunning) {
      console.warn('Task manager is already running');
      return;
    }

    this.isRunning = true;
    this.processingInterval = setInterval(() => {
      this.processTasks();
    }, 1000);

    console.log('🚀 任务调度系统已启动');
  }

  /**
   * 停止任务管理器
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }

    console.log('🛑 任务调度系统已停止');
  }

  /**
   * 添加任务
   */
  async addTask(taskData: Partial<Task>): Promise<string> {
    try {
      const taskId = this.generateTaskId();
      const task: Task = {
        id: taskId,
        name: taskData.name || `task_${taskId}`,
        type: taskData.type || 'default',
        priority: taskData.priority || 'medium',
        status: 'pending',
        data: taskData.data || {},
        retryCount: 0,
        maxRetries: taskData.maxRetries || this.config.maxRetries,
        createdAt: new Date(),
        updatedAt: new Date(),
        scheduledAt: taskData.scheduledAt,
        timeout: taskData.timeout || this.config.defaultTimeout,
        metadata: taskData.metadata || {},
        dependencies: taskData.dependencies || []
      };

      this.taskQueue.set(taskId, task);

      if (this.config.enablePersistence) {
        await this.storeTask(task);
      }

      this.stats.total++;
      this.stats.pending++;

      console.log(`📝 任务已添加: ${taskId} (${task.name})`);
      return taskId;

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleTaskManager');
      throw error;
    }
  }

  /**
   * 注册任务处理器
   */
  registerProcessor(taskType: string, processor: TaskProcessor): void {
    this.processors.set(taskType, processor);
    console.log(`🔧 任务处理器已注册: ${taskType}`);
  }

  /**
   * 执行任务
   */
  async executeTask(taskId: string): Promise<void> {
    const task = this.taskQueue.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (this.runningTasks.has(taskId)) {
      console.warn(`Task ${taskId} is already running`);
      return;
    }

    try {
      // 检查依赖
      if (task.dependencies && task.dependencies.length > 0) {
        await this.checkDependencies(task);
      }

      // 更新任务状态
      task.status = 'running';
      task.startedAt = new Date();
      task.updatedAt = new Date();
      this.runningTasks.add(taskId);
      this.stats.pending--;
      this.stats.running++;

      if (this.config.enablePersistence) {
        await this.updateTask(task);
      }

      console.log(`⚡ 开始执行任务: ${taskId} (${task.name})`);

      // 获取处理器
      const processor = this.processors.get(task.type);
      if (!processor) {
        throw new Error(`No processor found for task type: ${task.type}`);
      }

      // 设置超时
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Task timeout')), task.timeout || this.config.defaultTimeout);
      });

      // 执行任务
      const result = await Promise.race([
        processor(task),
        timeoutPromise
      ]);

      // 任务完成
      task.status = 'completed';
      task.result = result;
      task.completedAt = new Date();
      task.updatedAt = new Date();
      this.stats.running--;
      this.stats.completed++;

      this.updateSuccessRate();
      this.updateAverageExecutionTime(task);

      if (this.config.enablePersistence) {
        await this.updateTask(task);
      }

      console.log(`✅ 任务完成: ${taskId} (耗时: ${task.completedAt.getTime() - task.startedAt!.getTime()}ms)`);

    } catch (error) {
      console.error(`❌ 任务执行失败: ${taskId}`, error);

      // 重试逻辑
      if (task.retryCount < task.maxRetries) {
        task.retryCount++;
        task.status = 'pending';
        task.startedAt = undefined;
        task.updatedAt = new Date();
        this.stats.running--;
        this.stats.pending++;
        this.stats.retries++;

        // 延迟重试
        setTimeout(() => {
          this.executeTask(taskId);
        }, this.config.retryDelay);

        console.log(`🔄 任务重试: ${taskId} (第${task.retryCount}次)`);
      } else {
        // 任务最终失败
        task.status = 'failed';
        task.errorMessage = error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error';
        task.completedAt = new Date();
        task.updatedAt = new Date();
        this.stats.running--;
        this.stats.failed++;

        if (this.config.enablePersistence) {
          await this.updateTask(task);
        }

        console.log(`💥 任务最终失败: ${taskId}`);
      }
    } finally {
      this.runningTasks.delete(taskId);
    }
  }

  /**
   * 检查任务依赖
   */
  private async checkDependencies(task: Task): Promise<void> {
    if (!task.dependencies || task.dependencies.length === 0) return;

    for (const depId of task.dependencies) {
      const depTask = this.taskQueue.get(depId);
      if (!depTask) {
        throw new Error(`Dependency task ${depId} not found`);
      }

      if (depTask.status !== 'completed') {
        throw new Error(`Dependency ${depId} not completed (status: ${depTask.status})`);
      }
    }
  }

  /**
   * 处理任务队列
   */
  private async processTasks(): Promise<void> {
    if (!this.isRunning) return;

    const availableSlots = this.config.maxConcurrent - this.runningTasks.size;
    if (availableSlots <= 0) return;

    // 按优先级排序待处理任务
    const pendingTasks = Array.from(this.taskQueue.values())
      .filter(task => task.status === 'pending')
      .sort((a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority))
      .slice(0, availableSlots);

    for (const task of pendingTasks) {
      // 检查是否到了执行时间
      if (task.scheduledAt && task.scheduledAt > new Date()) {
        continue;
      }

      // 异步执行任务
      this.executeTask(task.id).catch(error => {
        console.error(`Failed to execute task ${task.id}:`, error);
      });
    }
  }

  /**
   * 获取优先级数值
   */
  private getPriorityValue(priority: string): number {
    const priorityMap = {
      'urgent': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };
    return priorityMap[priority as keyof typeof priorityMap] || 2;
  }

  /**
   * 更新成功率
   */
  private updateSuccessRate(): void {
    const total = this.stats.completed + this.stats.failed;
    this.stats.successRate = total > 0 ? this.stats.completed / total : 0;
  }

  /**
   * 更新平均执行时间
   */
  private updateAverageExecutionTime(task: Task): void {
    if (task.startedAt && task.completedAt) {
      const executionTime = task.completedAt.getTime() - task.startedAt.getTime();
      const totalExecutions = this.stats.completed + this.stats.failed;

      if (totalExecutions === 1) {
        this.stats.averageExecutionTime = executionTime;
      } else {
        this.stats.averageExecutionTime =
          (this.stats.averageExecutionTime * (totalExecutions - 1) + executionTime) / totalExecutions;
      }
    }
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 验证配置
   */
  private validateConfig(config: TaskConfig): void {
    BaseConfigValidator.validate(config, ['enabled', 'maxConcurrent', 'retryDelay', 'maxRetries']);

    if (config.maxConcurrent <= 0) {
      throw new Error('maxConcurrent must be positive');
    }
    if (config.retryDelay < 0) {
      throw new Error('retryDelay must be non-negative');
    }
    if (config.maxRetries < 0) {
      throw new Error('maxRetries must be non-negative');
    }
  }

  /**
   * 初始化数据库表
   */
  private async initializeTables(): Promise<void> {
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          priority VARCHAR(20) NOT NULL,
          status VARCHAR(20) NOT NULL,
          data TEXT,
          result TEXT,
          error_message TEXT,
          dependencies TEXT,
          retry_count INTEGER DEFAULT 0,
          max_retries INTEGER DEFAULT 3,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          started_at TIMESTAMP,
          completed_at TIMESTAMP,
          scheduled_at TIMESTAMP,
          timeout INTEGER,
          metadata TEXT
        )
      `);

    } catch (error) {
      console.error('Failed to initialize task tables:', error);
    }
  }

  /**
   * 存储任务
   */
  private async storeTask(task: Task): Promise<void> {
    try {
      await this.db.query(`
        INSERT OR REPLACE INTO tasks (
          id, name, type, priority, status, data, result, error_message,
          dependencies, retry_count, max_retries, created_at, updated_at,
          started_at, completed_at, scheduled_at, timeout, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        task.id, task.name, task.type, task.priority, task.status,
        JSON.stringify(task.data), JSON.stringify(task.result), task.errorMessage,
        JSON.stringify(task.dependencies), task.retryCount, task.maxRetries,
        task.createdAt, task.updatedAt, task.startedAt, task.completedAt,
        task.scheduledAt, task.timeout, JSON.stringify(task.metadata)
      ]);
    } catch (error) {
      console.error('Failed to store task:', error);
    }
  }

  /**
   * 更新任务
   */
  private async updateTask(task: Task): Promise<void> {
    try {
      await this.db.query(`
        UPDATE tasks SET
          status = ?, data = ?, result = ?, error_message = ?,
          retry_count = ?, updated_at = ?, started_at = ?,
          completed_at = ?, metadata = ?
        WHERE id = ?
      `, [
        task.status, JSON.stringify(task.data), JSON.stringify(task.result),
        task.errorMessage, task.retryCount, task.updatedAt, task.startedAt,
        task.completedAt, JSON.stringify(task.metadata), task.id
      ]);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  }

  /**
   * 加载持久化任务
   */
  private async loadPersistedTasks(): Promise<void> {
    if (!this.config.enablePersistence) return;

    try {
      const tasks = await this.db.query('SELECT * FROM tasks WHERE status IN (?, ?)', ['pending', 'running']);

      for (const row of tasks) {
        const task: Task = {
          id: row.id,
          name: row.name,
          type: row.type,
          priority: row.priority,
          status: row.status,
          data: JSON.parse(row.data || '{}'),
          result: row.result ? JSON.parse(row.result) : undefined,
          errorMessage: row.error_message,
          dependencies: JSON.parse(row.dependencies || '[]'),
          retryCount: row.retry_count,
          maxRetries: row.max_retries,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
          startedAt: row.started_at ? new Date(row.started_at) : undefined,
          completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
          scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : undefined,
          timeout: row.timeout,
          metadata: JSON.parse(row.metadata || '{}')
        };

        this.taskQueue.set(task.id, task);
        this.updateStatsFromTask(task);
      }

      console.log(`📋 已加载 ${tasks.length} 个持久化任务`);
    } catch (error) {
      console.error('Failed to load persisted tasks:', error);
    }
  }

  /**
   * 从任务更新统计
   */
  private updateStatsFromTask(task: Task): void {
    this.stats.total++;

    switch (task.status) {
      case 'pending':
        this.stats.pending++;
        break;
      case 'running':
        this.stats.running++;
        break;
      case 'completed':
        this.stats.completed++;
        break;
      case 'failed':
        this.stats.failed++;
        break;
      case 'cancelled':
        this.stats.cancelled++;
        break;
    }
  }

  /**
   * 获取任务
   */
  getTask(taskId: string): Task | undefined {
    return this.taskQueue.get(taskId);
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): Task[] {
    return Array.from(this.taskQueue.values());
  }

  /**
   * 获取统计信息
   */
  getStats(): TaskStats {
    return { ...this.stats };
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.taskQueue.get(taskId);
    if (!task) {
      return false;
    }

    if (task.status === 'running') {
      // 正在运行的任务无法取消
      return false;
    }

    task.status = 'cancelled';
    task.updatedAt = new Date();
    this.stats.pending--;
    this.stats.cancelled++;

    if (this.config.enablePersistence) {
      await this.updateTask(task);
    }

    console.log(`🚫 任务已取消: ${taskId}`);
    return true;
  }

  /**
   * 清理已完成的任务
   */
  async cleanupCompletedTasks(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let cleanedCount = 0;
    const tasksToRemove: string[] = [];

    for (const [taskId, task] of this.taskQueue) {
      if ((task.status === 'completed' || task.status === 'failed') &&
          task.completedAt && task.completedAt < cutoffDate) {
        tasksToRemove.push(taskId);
      }
    }

    for (const taskId of tasksToRemove) {
      this.taskQueue.delete(taskId);
      cleanedCount++;
    }

    if (this.config.enablePersistence && cleanedCount > 0) {
      try {
        await this.db.query(
          'DELETE FROM tasks WHERE status IN (?, ?) AND completed_at < ?',
          ['completed', 'failed', cutoffDate]
        );
      } catch (error) {
        console.error('Failed to cleanup completed tasks:', error);
      }
    }

    console.log(`🧹 清理了 ${cleanedCount} 个已完成的任务`);
    return cleanedCount;
  }
}

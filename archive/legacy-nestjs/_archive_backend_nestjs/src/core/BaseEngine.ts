/**
 * BaseEngine - 基础引擎类
 * 消除所有引擎中的重复代码，提供统一的引擎模式
 */

import { DatabaseConnection } from '../database/connection';
import { Redis } from 'ioredis';
import { BaseService, BaseServiceConfig } from './BaseService';
import { logger } from '../utils/logger';

export interface BaseEngineConfig extends BaseServiceConfig {
  processing: {
    maxConcurrentTasks: number;
    taskTimeout: number;
    retryAttempts: number;
  };
  output: {
    format: 'json' | 'text' | 'both';
    includeMetadata: boolean;
  };
}

export interface EngineStats extends BaseServiceStats {
  processedTasks: number;
  successfulTasks: number;
  failedTasks: number;
  averageProcessingTime: number;
  queueSize: number;
}

export abstract class BaseEngine extends BaseService {
  protected engineStats: EngineStats = {
    ...this.stats,
    processedTasks: 0,
    successfulTasks: 0,
    failedTasks: 0,
    averageProcessingTime: 0,
    queueSize: 0
  };
  protected taskQueue: Array<{ id: string; task: () => Promise<any>; priority: number }> = [];
  protected activeTasks: Set<string> = new Set();

  constructor(
    db: DatabaseConnection,
    redis: Redis,
    config: BaseEngineConfig
  ) {
    super(db, redis, config);
  }

  /**
   * 处理任务 - 统一任务处理逻辑
   */
  protected async processTask<T>(
    taskId: string,
    task: () => Promise<T>,
    priority: number = 1
  ): Promise<T> {
    return await this.executeTask(`process_${taskId}`, async () => {
      this.engineStats.processedTasks++;
      this.engineStats.queueSize = this.taskQueue.length;

      const startTime = Date.now();
      try {
        const result = await task();
        this.engineStats.successfulTasks++;
        this.updateEngineStats(true, Date.now() - startTime);
        return result;
      } catch (error) {
        this.engineStats.failedTasks++;
        this.updateEngineStats(false, Date.now() - startTime, error.message);
        throw error;
      }
    });
  }

  /**
   * 添加任务到队列
   */
  protected addTask(taskId: string, task: () => Promise<any>, priority: number = 1): void {
    this.taskQueue.push({ id: taskId, task, priority });
    this.taskQueue.sort((a, b) => b.priority - a.priority); // 高优先级在前
    this.engineStats.queueSize = this.taskQueue.length;
  }

  /**
   * 处理队列中的任务
   */
  protected async processQueue(): Promise<void> {
    while (this.taskQueue.length > 0 && this.activeTasks.size < this.config.processing.maxConcurrentTasks) {
      const { id, task } = this.taskQueue.shift()!;
      this.activeTasks.add(id);

      this.processTask(id, task).finally(() => {
        this.activeTasks.delete(id);
      });
    }
  }

  /**
   * 更新引擎统计信息
   */
  private updateEngineStats(success: boolean, processingTime: number, error?: string): void {
    this.engineStats.averageProcessingTime =
      (this.engineStats.averageProcessingTime * (this.engineStats.processedTasks - 1) + processingTime) /
      this.engineStats.processedTasks;

    if (error) {
      this.engineStats.lastError = error;
    }
  }

  /**
   * 获取引擎状态
   */
  getEngineStatus(): any {
    return {
      ...this.getStatus(),
      engineStats: this.engineStats,
      activeTasks: Array.from(this.activeTasks),
      queueSize: this.taskQueue.length
    };
  }

  /**
   * 抽象方法 - 子类必须实现
   */
  protected abstract onStart(): Promise<void>;
  protected abstract onStop(): Promise<void>;
}

export default BaseEngine;

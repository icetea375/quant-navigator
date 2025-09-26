/**
 * BaseService - 基础服务类
 * 消除所有服务中的重复代码，提供统一的配置、统计、错误处理模式
 */

import { DatabaseConnection } from '../database/connection';
import { Redis } from 'ioredis';
import { BaseConfigValidator } from '../utils/BaseConfigValidator';
import { logger } from '../utils/logger';

export interface BaseServiceConfig {
  enabled: boolean;
  timeout: number;
  retries: number;
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    metricsCollection: boolean;
  };
}

export interface BaseServiceStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastRun: string;
  lastError?: string;
}

export abstract class BaseService {
  protected db: DatabaseConnection;
  protected redis: Redis;
  protected config: BaseServiceConfig;
  protected isRunning: boolean = false;
  protected stats: BaseServiceStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    lastRun: new Date().toISOString()
  };

  constructor(
    db: DatabaseConnection,
    redis: Redis,
    config: BaseServiceConfig
  ) {
    this.db = db;
    this.redis = redis;
    this.config = config;

    this.validateConfig(config);
  }

  /**
   * 验证配置 - 统一配置验证逻辑
   */
  protected validateConfig(config: BaseServiceConfig): void {
    BaseConfigValidator.validate(config, ['enabled', 'timeout', 'retries', 'monitoring']);
  }

  /**
   * 启动服务 - 统一启动逻辑
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn(`${this.constructor.name} is already running`);
      return;
    }

    try {
      logger.info(`Starting ${this.constructor.name}...`);
      await this.onStart();
      this.isRunning = true;
      logger.info(`${this.constructor.name} started successfully`);
    } catch (error) {
      logger.error(`Failed to start ${this.constructor.name}:`, error);
      throw error;
    }
  }

  /**
   * 停止服务 - 统一停止逻辑
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      logger.info(`Stopping ${this.constructor.name}...`);
      await this.onStop();
      this.isRunning = false;
      logger.info(`${this.constructor.name} stopped successfully`);
    } catch (error) {
      logger.error(`Failed to stop ${this.constructor.name}:`, error);
      throw error;
    }
  }

  /**
   * 执行任务 - 统一错误处理和统计
   */
  protected async executeTask<T>(
    taskName: string,
    task: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      const result = await task();
      this.updateStats(true, Date.now() - startTime);
      logger.debug(`${this.constructor.name} ${taskName} completed successfully`);
      return result;
    } catch (error) {
      this.updateStats(false, Date.now() - startTime, error.message);
      logger.error(`${this.constructor.name} ${taskName} failed:`, error);
      throw error;
    }
  }

  /**
   * 更新统计信息 - 统一统计逻辑
   */
  protected updateStats(success: boolean, responseTime: number, error?: string): void {
    if (success) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
      this.stats.lastError = error;
    }

    this.stats.lastRun = new Date().toISOString();
    this.stats.averageResponseTime =
      (this.stats.averageResponseTime * (this.stats.totalRequests - 1) + responseTime) /
      this.stats.totalRequests;
  }

  /**
   * 获取服务状态 - 统一状态格式
   */
  getStatus(): any {
    return {
      isRunning: this.isRunning,
      config: this.config,
      stats: this.stats,
      serviceName: this.constructor.name
    };
  }

  /**
   * 健康检查 - 统一健康检查逻辑
   */
  async healthCheck(): Promise<{ status: string; timestamp: string; details: any }> {
    return {
      status: this.isRunning ? 'healthy' : 'stopped',
      timestamp: new Date().toISOString(),
      details: {
        serviceName: this.constructor.name,
        stats: this.stats,
        config: {
          enabled: this.config.enabled,
          monitoring: this.config.monitoring.enabled
        }
      }
    };
  }

  /**
   * 抽象方法 - 子类必须实现
   */
  protected abstract onStart(): Promise<void>;
  protected abstract onStop(): Promise<void>;
}

export default BaseService;

/**
 * 简单日志收集器
 * 提供基础的日志记录功能
 * 
 * @author AI Assistant
 * @created 2025-01-17
 * @version 2.0.0
 */

import { DatabaseConnection } from '../database/connection';
import { BaseErrorHandler } from '../utils/BaseErrorHandler';
import { BaseConfigValidator } from '../utils/BaseConfigValidator';

export interface LogEntry {
  id?: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  meta?: any;
  timestamp: number;
  service: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  tags?: string[];
}

export interface LogConfig {
  enableDatabase: boolean;
  enableConsole: boolean;
  enableFile: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxFileSize: number;
  maxFiles: number;
  retentionDays: number;
  enableMetrics: boolean;
}

export interface LogMetrics {
  totalLogs: number;
  logsByLevel: Record<string, number>;
  logsByService: Record<string, number>;
  errorRate: number;
  averageLogSize: number;
  lastLogTime: number;
}

export class SimpleLogCollector {
  private db: DatabaseConnection;
  private config: LogConfig;
  private metrics: LogMetrics;
  private logBuffer: LogEntry[] = [];
  private bufferSize: number = 100;
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(db: DatabaseConnection, config: LogConfig) {
    this.db = db;
    this.config = config;
    this.metrics = {
      totalLogs: 0,
      logsByLevel: {},
      logsByService: {},
      errorRate: 0,
      averageLogSize: 0,
      lastLogTime: 0
    };
    
    this.validateConfig(config);
    this.startBufferFlush();
  }

  /**
   * 记录信息日志
   * @param message 日志消息
   * @param meta 元数据
   * @param options 日志选项
   */
  info(message: string, meta?: any, options?: Partial<LogEntry>): void {
    this.log('info', message, meta, options);
  }

  /**
   * 记录警告日志
   * @param message 日志消息
   * @param meta 元数据
   * @param options 日志选项
   */
  warn(message: string, meta?: any, options?: Partial<LogEntry>): void {
    this.log('warn', message, meta, options);
  }

  /**
   * 记录错误日志
   * @param message 日志消息
   * @param meta 元数据
   * @param options 日志选项
   */
  error(message: string, meta?: any, options?: Partial<LogEntry>): void {
    this.log('error', message, meta, options);
  }

  /**
   * 记录调试日志
   * @param message 日志消息
   * @param meta 元数据
   * @param options 日志选项
   */
  debug(message: string, meta?: any, options?: Partial<LogEntry>): void {
    this.log('debug', message, meta, options);
  }

  /**
   * 通用日志记录方法
   * @param level 日志级别
   * @param message 日志消息
   * @param meta 元数据
   * @param options 日志选项
   */
  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, meta?: any, options?: Partial<LogEntry>): void {
    try {
      // 检查日志级别
      if (!this.shouldLog(level)) {
        return;
      }

      const logEntry: LogEntry = {
        id: this.generateLogId(),
        level,
        message,
        meta,
        timestamp: Date.now(),
        service: options?.service || 'default',
        requestId: options?.requestId,
        userId: options?.userId,
        sessionId: options?.sessionId,
        tags: options?.tags || []
      };

      // 控制台输出
      if (this.config.enableConsole) {
        this.logToConsole(logEntry);
      }

      // 添加到缓冲区
      this.logBuffer.push(logEntry);

      // 更新指标
      this.updateMetrics(logEntry);

      // 检查是否需要刷新缓冲区
      if (this.logBuffer.length >= this.bufferSize) {
        this.flushBuffer();
      }

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleLogCollector');
    }
  }

  /**
   * 检查是否应该记录日志
   */
  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const logLevelIndex = levels.indexOf(level);
    return logLevelIndex >= currentLevelIndex;
  }

  /**
   * 控制台输出
   */
  private logToConsole(logEntry: LogEntry): void {
    const timestamp = new Date(logEntry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${logEntry.level.toUpperCase()}] [${logEntry.service}]`;
    const metaStr = logEntry.meta ? JSON.stringify(logEntry.meta, null, 2) : '';
    
    switch (logEntry.level) {
      case 'info':
        console.log(`${prefix} ${logEntry.message}`, metaStr);
        break;
      case 'warn':
        console.warn(`${prefix} ${logEntry.message}`, metaStr);
        break;
      case 'error':
        console.error(`${prefix} ${logEntry.message}`, metaStr);
        break;
      case 'debug':
        console.debug(`${prefix} ${logEntry.message}`, metaStr);
        break;
    }
  }

  /**
   * 生成日志ID
   */
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 更新指标
   */
  private updateMetrics(logEntry: LogEntry): void {
    this.metrics.totalLogs++;
    this.metrics.lastLogTime = logEntry.timestamp;
    
    // 按级别统计
    this.metrics.logsByLevel[logEntry.level] = (this.metrics.logsByLevel[logEntry.level] || 0) + 1;
    
    // 按服务统计
    this.metrics.logsByService[logEntry.service] = (this.metrics.logsByService[logEntry.service] || 0) + 1;
    
    // 计算错误率
    const totalLogs = this.metrics.totalLogs;
    const errorLogs = this.metrics.logsByLevel.error || 0;
    this.metrics.errorRate = totalLogs > 0 ? errorLogs / totalLogs : 0;
    
    // 计算平均日志大小
    const logSize = JSON.stringify(logEntry).length;
    this.metrics.averageLogSize = (this.metrics.averageLogSize * (totalLogs - 1) + logSize) / totalLogs;
  }

  /**
   * 开始缓冲区刷新
   */
  private startBufferFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushBuffer();
    }, 5000); // 每5秒刷新一次
  }

  /**
   * 刷新缓冲区
   */
  private async flushBuffer(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // 数据库存储
      if (this.config.enableDatabase) {
        await this.saveLogsToDatabase(logsToFlush);
      }

      // 文件存储
      if (this.config.enableFile) {
        await this.saveLogsToFile(logsToFlush);
      }

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleLogCollector');
    }
  }

  /**
   * 保存日志到数据库
   */
  private async saveLogsToDatabase(logs: LogEntry[]): Promise<void> {
    try {
      // 这里应该实现数据库保存逻辑
      // 由于DatabaseConnection的具体实现未知，这里简化处理
      console.log(`保存 ${logs.length} 条日志到数据库`);
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleLogCollector');
    }
  }

  /**
   * 保存日志到文件
   */
  private async saveLogsToFile(logs: LogEntry[]): Promise<void> {
    try {
      // 这里应该实现文件保存逻辑
      console.log(`保存 ${logs.length} 条日志到文件`);
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleLogCollector');
    }
  }

  /**
   * 验证配置
   */
  private validateConfig(config: LogConfig): void {
    BaseConfigValidator.validateRequired(config, ['logLevel', 'enableDatabase', 'enableConsole']);
    
    if (config.maxFileSize <= 0) {
      throw new Error('maxFileSize must be positive');
    }
    
    if (config.maxFiles <= 0) {
      throw new Error('maxFiles must be positive');
    }
    
    if (config.retentionDays <= 0) {
      throw new Error('retentionDays must be positive');
    }
  }

  /**
   * 获取指标
   */
  getMetrics(): LogMetrics {
    return { ...this.metrics };
  }

  /**
   * 查询日志
   */
  async queryLogs(filters: {
    level?: string;
    service?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
    offset?: number;
  }): Promise<LogEntry[]> {
    try {
      // 这里应该实现数据库查询逻辑
      // 由于DatabaseConnection的具体实现未知，这里简化处理
      return [];
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleLogCollector');
      return [];
    }
  }

  /**
   * 清理过期日志
   */
  async cleanupExpiredLogs(): Promise<void> {
    try {
      const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
      // 这里应该实现数据库清理逻辑
      console.log(`清理 ${cutoffTime} 之前的日志`);
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleLogCollector');
    }
  }

  /**
   * 销毁日志收集器
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    // 刷新剩余的日志
    this.flushBuffer();
  }
}

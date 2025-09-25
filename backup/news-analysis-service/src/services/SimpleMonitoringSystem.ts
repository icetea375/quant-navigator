/**
 * 简单监控系统集成器
 * 遵循智能分析系统开发实施指南的命名规范
 */

import { DatabaseConnection } from '../database/connection';
import { Redis } from 'ioredis';
import { SimpleAlertManager, AlertRule, NotificationChannel } from './SimpleAlertManager';
import { SimpleServiceRegistry, ServiceInfo } from './SimpleServiceRegistry';
import { SimpleDistributedLockManager } from './SimpleDistributedLockManager';
import { BaseErrorHandler } from '../utils/BaseErrorHandler';
import { BaseConfigValidator } from '../utils/BaseConfigValidator';
import { logger } from '../utils/logger';

export interface MonitoringConfig {
  enabled: boolean;
  alertManager: {
    enabled: boolean;
    checkInterval: number;
    retentionDays: number;
    defaultCooldownPeriod: number;
  };
  serviceRegistry: {
    enabled: boolean;
    heartbeatInterval: number;
    healthCheckInterval: number;
    serviceTimeout: number;
  };
  distributedLock: {
    enabled: boolean;
    defaultTtl: number;
    maxTtl: number;
    retryDelay: number;
    maxRetries: number;
    enableDeadlockDetection: boolean;
  };
  systemMetrics: {
    enabled: boolean;
    collectionInterval: number;
    retentionDays: number;
  };
}

export class SimpleMonitoringSystem {
  private db: DatabaseConnection;
  private redis: Redis;
  private config: MonitoringConfig;
  private alertManager: SimpleAlertManager | null = null;
  private serviceRegistry: SimpleServiceRegistry | null = null;
  private lockManager: SimpleDistributedLockManager | null = null;
  private isRunning: boolean = false;
  private metricsCollectionInterval?: NodeJS.Timeout;

  constructor(db: DatabaseConnection, redis: Redis, config: MonitoringConfig) {
    this.db = db;
    this.redis = redis;
    this.config = config;
    
    this.validateConfig(config);
    this.initializeComponents();
  }

  /**
   * 启动监控系统
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Monitoring system is already running');
      return;
    }

    try {
      logger.info('🚀 启动监控系统...');

      // 启动告警管理器
      if (this.alertManager && this.config.alertManager.enabled) {
        this.alertManager.start();
        logger.info('✅ 告警管理器已启动');
      }

      // 启动服务注册中心
      if (this.serviceRegistry && this.config.serviceRegistry.enabled) {
        this.serviceRegistry.start();
        logger.info('✅ 服务注册中心已启动');
      }

      // 启动分布式锁管理器
      if (this.lockManager && this.config.distributedLock.enabled) {
        this.lockManager.start();
        logger.info('✅ 分布式锁管理器已启动');
      }

      // 启动系统指标收集
      if (this.config.systemMetrics.enabled) {
        this.startMetricsCollection();
        logger.info('✅ 系统指标收集已启动');
      }

      this.isRunning = true;
      logger.info('🎉 监控系统启动完成');

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleMonitoringSystem');
      throw error;
    }
  }

  /**
   * 停止监控系统
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    try {
      logger.info('🛑 停止监控系统...');

      // 停止系统指标收集
      if (this.metricsCollectionInterval) {
        clearInterval(this.metricsCollectionInterval);
        this.metricsCollectionInterval = undefined;
      }

      // 停止各个组件
      if (this.alertManager) {
        this.alertManager.stop();
      }

      if (this.serviceRegistry) {
        this.serviceRegistry.stop();
      }

      if (this.lockManager) {
        this.lockManager.stop();
      }

      this.isRunning = false;
      logger.info('✅ 监控系统已停止');

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleMonitoringSystem');
    }
  }

  /**
   * 记录指标
   */
  async recordMetric(metric: string, value: number, tags?: Record<string, string>): Promise<void> {
    try {
      if (this.alertManager) {
        await this.alertManager.recordMetric(metric, value, tags);
      }

      // 存储到Redis用于快速查询
      const key = `metric:${metric}:${Date.now()}`;
      await this.redis.setex(key, 3600, JSON.stringify({ 
        value, 
        tags: tags || {}, 
        timestamp: Date.now() 
      }));

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleMonitoringSystem');
    }
  }

  /**
   * 注册服务
   */
  async registerService(service: ServiceInfo): Promise<void> {
    try {
      if (this.serviceRegistry) {
        await this.serviceRegistry.registerService(service);
      }
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleMonitoringSystem');
      throw error;
    }
  }

  /**
   * 注销服务
   */
  async unregisterService(serviceId: string): Promise<void> {
    try {
      if (this.serviceRegistry) {
        await this.serviceRegistry.unregisterService(serviceId);
      }
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleMonitoringSystem');
      throw error;
    }
  }

  /**
   * 发现服务
   */
  async discoverServices(serviceName?: string, tags?: string[]): Promise<ServiceInfo[]> {
    try {
      if (this.serviceRegistry) {
        return await this.serviceRegistry.discoverServices(serviceName, tags);
      }
      return [];
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleMonitoringSystem');
      return [];
    }
  }

  /**
   * 获取锁
   */
  async acquireLock(key: string, ttl?: number, retries?: number): Promise<boolean> {
    try {
      if (this.lockManager) {
        return await this.lockManager.acquireLock(key, ttl, retries);
      }
      return false;
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleMonitoringSystem');
      return false;
    }
  }

  /**
   * 释放锁
   */
  async releaseLock(key: string): Promise<boolean> {
    try {
      if (this.lockManager) {
        return await this.lockManager.releaseLock(key);
      }
      return false;
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleMonitoringSystem');
      return false;
    }
  }

  /**
   * 添加告警规则
   */
  async addAlertRule(rule: AlertRule): Promise<void> {
    try {
      if (this.alertManager) {
        await this.alertManager.addRule(rule);
      }
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleMonitoringSystem');
      throw error;
    }
  }

  /**
   * 添加通知渠道
   */
  async addNotificationChannel(channel: NotificationChannel): Promise<void> {
    try {
      if (this.alertManager) {
        await this.alertManager.addChannel(channel);
      }
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleMonitoringSystem');
      throw error;
    }
  }

  /**
   * 获取系统状态
   */
  async getSystemStatus(): Promise<any> {
    try {
      const status = {
        running: this.isRunning,
        timestamp: new Date().toISOString(),
        components: {
          alertManager: this.alertManager ? 'running' : 'disabled',
          serviceRegistry: this.serviceRegistry ? 'running' : 'disabled',
          lockManager: this.lockManager ? 'running' : 'disabled'
        },
        metrics: await this.getSystemMetrics(),
        alerts: this.alertManager ? await this.alertManager.getAlertStats() : null,
        services: this.serviceRegistry ? await this.serviceRegistry.getServiceStats() : null,
        locks: this.lockManager ? this.lockManager.getLockStats() : null
      };

      return status;
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleMonitoringSystem');
      return { running: false, error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) };
    }
  }

  /**
   * 获取系统指标
   */
  private async getSystemMetrics(): Promise<any> {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      return {
        memory: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        uptime: process.uptime(),
        pid: process.pid,
        platform: process.platform,
        nodeVersion: process.version
      };
    } catch (error) {
      logger.error('Failed to get system metrics:', error);
      return {};
    }
  }

  /**
   * 启动指标收集
   */
  private startMetricsCollection(): void {
    this.metricsCollectionInterval = setInterval(async () => {
      try {
        await this.collectSystemMetrics();
      } catch (error) {
        logger.error('Metrics collection failed:', error);
      }
    }, this.config.systemMetrics.collectionInterval);
  }

  /**
   * 收集系统指标
   */
  private async collectSystemMetrics(): Promise<void> {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      // 记录内存使用率
      const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      await this.recordMetric('system.memory.usage_percent', memoryUsagePercent, {
        type: 'heap'
      });

      // 记录内存使用量（MB）
      await this.recordMetric('system.memory.heap_used_mb', memUsage.heapUsed / 1024 / 1024, {
        type: 'heap'
      });

      // 记录RSS内存（MB）
      await this.recordMetric('system.memory.rss_mb', memUsage.rss / 1024 / 1024, {
        type: 'rss'
      });

      // 记录CPU使用时间
      await this.recordMetric('system.cpu.user_time', cpuUsage.user, {
        type: 'user'
      });

      await this.recordMetric('system.cpu.system_time', cpuUsage.system, {
        type: 'system'
      });

      // 记录进程运行时间
      await this.recordMetric('system.uptime_seconds', process.uptime(), {
        type: 'process'
      });

      // 记录活跃连接数（如果有的话）
      if (this.serviceRegistry) {
        const serviceStats = await this.serviceRegistry.getServiceStats();
        await this.recordMetric('system.services.total', serviceStats.total, {
          type: 'service'
        });
        await this.recordMetric('system.services.healthy', serviceStats.healthy, {
          type: 'service'
        });
      }

      // 记录活跃锁数量
      if (this.lockManager) {
        const lockStats = this.lockManager.getLockStats();
        await this.recordMetric('system.locks.active', lockStats.active, {
          type: 'lock'
        });
      }

    } catch (error) {
      logger.error('Failed to collect system metrics:', error);
    }
  }

  /**
   * 初始化组件
   */
  private initializeComponents(): void {
    try {
      // 初始化告警管理器
      if (this.config.alertManager.enabled) {
        this.alertManager = new SimpleAlertManager(this.db, this.redis, {
          enabled: this.config.alertManager.enabled,
          checkInterval: this.config.alertManager.checkInterval,
          retentionDays: this.config.alertManager.retentionDays,
          defaultCooldownPeriod: this.config.alertManager.defaultCooldownPeriod,
          maxAlertsPerRule: 100,
          enableSuppression: true,
          enableEscalation: true
        });
      }

      // 初始化服务注册中心
      if (this.config.serviceRegistry.enabled) {
        this.serviceRegistry = new SimpleServiceRegistry(this.db, this.redis, {
          enabled: this.config.serviceRegistry.enabled,
          heartbeatInterval: this.config.serviceRegistry.heartbeatInterval,
          healthCheckInterval: this.config.serviceRegistry.healthCheckInterval,
          serviceTimeout: this.config.serviceRegistry.serviceTimeout,
          maxRetries: 3,
          enableHealthCheck: true,
          enableLoadBalancing: true
        });
      }

      // 初始化分布式锁管理器
      if (this.config.distributedLock.enabled) {
        this.lockManager = new SimpleDistributedLockManager(this.redis, {
          enabled: this.config.distributedLock.enabled,
          defaultTtl: this.config.distributedLock.defaultTtl,
          maxTtl: this.config.distributedLock.maxTtl,
          retryDelay: this.config.distributedLock.retryDelay,
          maxRetries: this.config.distributedLock.maxRetries,
          enableDeadlockDetection: this.config.distributedLock.enableDeadlockDetection,
          deadlockDetectionInterval: 30000,
          lockPrefix: 'monitoring:lock'
        });
      }

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleMonitoringSystem');
    }
  }

  /**
   * 验证配置
   */
  private validateConfig(config: MonitoringConfig): void {
    BaseConfigValidator.validate(config, ['enabled', 'alertManager', 'serviceRegistry', 'distributedLock']);
    
    if (config.alertManager.checkInterval <= 0) {
      throw new Error('alertManager.checkInterval must be positive');
    }
    if (config.serviceRegistry.heartbeatInterval <= 0) {
      throw new Error('serviceRegistry.heartbeatInterval must be positive');
    }
    if (config.distributedLock.defaultTtl <= 0) {
      throw new Error('distributedLock.defaultTtl must be positive');
    }
  }

  /**
   * 获取告警管理器
   */
  getAlertManager(): SimpleAlertManager | null {
    return this.alertManager;
  }

  /**
   * 获取服务注册中心
   */
  getServiceRegistry(): SimpleServiceRegistry | null {
    return this.serviceRegistry;
  }

  /**
   * 获取分布式锁管理器
   */
  getLockManager(): SimpleDistributedLockManager | null {
    return this.lockManager;
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<any> {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        components: {
          database: await this.checkDatabaseHealth(),
          redis: await this.checkRedisHealth(),
          alertManager: this.alertManager ? 'healthy' : 'disabled',
          serviceRegistry: this.serviceRegistry ? 'healthy' : 'disabled',
          lockManager: this.lockManager ? 'healthy' : 'disabled'
        }
      };

      // 检查是否有不健康的组件
      const unhealthyComponents = Object.values(health.components).filter(status => status !== 'healthy' && status !== 'disabled');
      if (unhealthyComponents.length > 0) {
        health.status = 'unhealthy';
      }

      return health;
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
      };
    }
  }

  /**
   * 检查数据库健康状态
   */
  private async checkDatabaseHealth(): Promise<string> {
    try {
      await this.db.query('SELECT 1');
      return 'healthy';
    } catch (error) {
      return 'unhealthy';
    }
  }

  /**
   * 检查Redis健康状态
   */
  private async checkRedisHealth(): Promise<string> {
    try {
      await this.redis.ping();
      return 'healthy';
    } catch (error) {
      return 'unhealthy';
    }
  }
}

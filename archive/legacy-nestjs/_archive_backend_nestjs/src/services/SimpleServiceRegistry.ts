/**
 * 简单服务注册中心
 * 遵循智能分析系统开发实施指南的命名规范
 */

import { DatabaseConnection } from '../database/connection';
import { Redis } from 'ioredis';
import { BaseErrorHandler } from '../utils/BaseErrorHandler';
import { BaseConfigValidator } from '../utils/BaseConfigValidator';
import { logger } from '../utils/logger';

export interface ServiceInfo {
  id: string;
  name: string;
  version: string;
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'tcp' | 'udp';
  status: 'healthy' | 'unhealthy' | 'unknown';
  tags: string[];
  metadata: Record<string, any>;
  lastHeartbeat: number;
  registeredAt: number;
  healthCheckUrl?: string;
  weight?: number;
}

export interface ServiceRegistryConfig {
  enabled: boolean;
  heartbeatInterval: number;
  healthCheckInterval: number;
  serviceTimeout: number;
  maxRetries: number;
  enableHealthCheck: boolean;
  enableLoadBalancing: boolean;
}

export class SimpleServiceRegistry {
  private db: DatabaseConnection;
  private redis: Redis;
  private config: ServiceRegistryConfig;
  private services: Map<string, ServiceInfo> = new Map();
  private heartbeatInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;
  private isRunning: boolean = false;
  private registeredServices: Set<string> = new Set();

  constructor(db: DatabaseConnection, redis: Redis, config: ServiceRegistryConfig) {
    this.db = db;
    this.redis = redis;
    this.config = config;

    this.validateConfig(config);
    this.initializeTables();
    this.loadServices();
  }

  /**
   * 启动服务注册中心
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Service registry is already running');
      return;
    }

    this.isRunning = true;

    // 启动心跳检查
    this.heartbeatInterval = setInterval(() => {
      this.checkHeartbeats();
    }, this.config.heartbeatInterval);

    // 启动健康检查
    if (this.config.enableHealthCheck) {
      this.healthCheckInterval = setInterval(() => {
        this.performHealthChecks();
      }, this.config.healthCheckInterval);
    }

    logger.info('🔍 服务注册中心已启动');
  }

  /**
   * 停止服务注册中心
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    logger.info('🛑 服务注册中心已停止');
  }

  /**
   * 注册服务
   */
  async registerService(service: ServiceInfo): Promise<void> {
    try {
      this.validateService(service);

      service.registeredAt = Date.now();
      service.lastHeartbeat = Date.now();
      service.status = 'unknown';

      this.services.set(service.id, service);
      this.registeredServices.add(service.id);

      await this.storeService(service);
      await this.updateRedisService(service);

      logger.info(`📝 服务已注册: ${service.name}@${service.host}:${service.port}`);
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleServiceRegistry');
      throw error;
    }
  }

  /**
   * 注销服务
   */
  async unregisterService(serviceId: string): Promise<void> {
    try {
      const service = this.services.get(serviceId);
      if (!service) {
        throw new Error(`Service ${serviceId} not found`);
      }

      this.services.delete(serviceId);
      this.registeredServices.delete(serviceId);

      await this.removeServiceFromDb(serviceId);
      await this.removeServiceFromRedis(serviceId);

      logger.info(`🗑️ 服务已注销: ${serviceId}`);
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleServiceRegistry');
      throw error;
    }
  }

  /**
   * 更新服务心跳
   */
  async updateHeartbeat(serviceId: string): Promise<void> {
    try {
      const service = this.services.get(serviceId);
      if (!service) {
        throw new Error(`Service ${serviceId} not found`);
      }

      service.lastHeartbeat = Date.now();
      service.status = 'healthy';

      await this.updateServiceInDb(service);
      await this.updateRedisService(service);

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleServiceRegistry');
    }
  }

  /**
   * 发现服务
   */
  async discoverServices(serviceName?: string, tags?: string[]): Promise<ServiceInfo[]> {
    try {
      let services = Array.from(this.services.values());

      // 按服务名过滤
      if (serviceName) {
        services = services.filter(service => service.name === serviceName);
      }

      // 按标签过滤
      if (tags && tags.length > 0) {
        services = services.filter(service =>
          tags.every(tag => service.tags.includes(tag))
        );
      }

      // 只返回健康的服务
      services = services.filter(service => service.status === 'healthy');

      // 按权重排序（如果有的话）
      if (this.config.enableLoadBalancing) {
        services.sort((a, b) => (b.weight || 1) - (a.weight || 1));
      }

      return services;
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleServiceRegistry');
      return [];
    }
  }

  /**
   * 获取服务信息
   */
  getService(serviceId: string): ServiceInfo | undefined {
    return this.services.get(serviceId);
  }

  /**
   * 获取所有服务
   */
  getAllServices(): ServiceInfo[] {
    return Array.from(this.services.values());
  }

  /**
   * 检查心跳
   */
  private async checkHeartbeats(): Promise<void> {
    if (!this.isRunning) return;

    const now = Date.now();
    const timeout = this.config.serviceTimeout;

    for (const [serviceId, service] of this.services) {
      if (now - service.lastHeartbeat > timeout) {
        if (service.status !== 'unhealthy') {
          service.status = 'unhealthy';
          await this.updateServiceInDb(service);
          await this.updateRedisService(service);

          logger.warn(`💔 服务心跳超时: ${service.name}@${service.host}:${service.port}`);
        }
      }
    }
  }

  /**
   * 执行健康检查
   */
  private async performHealthChecks(): Promise<void> {
    if (!this.isRunning || !this.config.enableHealthCheck) return;

    for (const [serviceId, service] of this.services) {
      if (service.healthCheckUrl) {
        try {
          const isHealthy = await this.checkServiceHealth(service);
          if (service.status !== (isHealthy ? 'healthy' : 'unhealthy')) {
            service.status = isHealthy ? 'healthy' : 'unhealthy';
            await this.updateServiceInDb(service);
            await this.updateRedisService(service);

            if (isHealthy) {
              logger.info(`✅ 服务健康检查通过: ${service.name}`);
            } else {
              logger.warn(`❌ 服务健康检查失败: ${service.name}`);
            }
          }
        } catch (error) {
          logger.error(`Health check failed for ${service.name}:`, error);
        }
      }
    }
  }

  /**
   * 检查服务健康状态
   */
  private async checkServiceHealth(service: ServiceInfo): Promise<boolean> {
    try {
      if (!service.healthCheckUrl) return true;

      const http = require('http');
      const https = require('https');
      const url = require('url');

      const serviceUrl = new url.URL(service.healthCheckUrl);
      const isHttps = serviceUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      return new Promise((resolve) => {
        const req = client.request({
          hostname: serviceUrl.hostname,
          port: serviceUrl.port || (isHttps ? 443 : 80),
          path: serviceUrl.pathname + serviceUrl.search,
          method: 'GET',
          timeout: 5000
        }, (res: any) => {
          resolve(res.statusCode >= 200 && res.statusCode < 300);
        });

        req.on('error', () => resolve(false));
        req.on('timeout', () => resolve(false));
        req.end();
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * 验证服务信息
   */
  private validateService(service: ServiceInfo): void {
    if (!service.id || !service.name || !service.host || !service.port) {
      throw new Error('Service must have id, name, host, and port');
    }

    if (service.port < 1 || service.port > 65535) {
      throw new Error('Port must be between 1 and 65535');
    }

    if (!['http', 'https', 'tcp', 'udp'].includes(service.protocol)) {
      throw new Error('Invalid protocol');
    }

    if (!['healthy', 'unhealthy', 'unknown'].includes(service.status)) {
      throw new Error('Invalid status');
    }
  }

  /**
   * 验证配置
   */
  private validateConfig(config: ServiceRegistryConfig): void {
    BaseConfigValidator.validate(config, ['enabled', 'heartbeatInterval', 'healthCheckInterval']);

    if (config.heartbeatInterval <= 0) {
      throw new Error('heartbeatInterval must be positive');
    }
    if (config.healthCheckInterval <= 0) {
      throw new Error('healthCheckInterval must be positive');
    }
    if (config.serviceTimeout <= 0) {
      throw new Error('serviceTimeout must be positive');
    }
  }

  /**
   * 初始化数据库表
   */
  private async initializeTables(): Promise<void> {
    try {
      await this.db.executeQuery(`
        CREATE TABLE IF NOT EXISTS services (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          version VARCHAR(20) NOT NULL,
          host VARCHAR(255) NOT NULL,
          port INTEGER NOT NULL,
          protocol VARCHAR(10) NOT NULL,
          status VARCHAR(20) NOT NULL,
          tags TEXT,
          metadata TEXT,
          last_heartbeat INTEGER NOT NULL,
          registered_at INTEGER NOT NULL,
          health_check_url VARCHAR(500),
          weight INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 创建索引
      await this.db.query('CREATE INDEX IF NOT EXISTS idx_services_name ON services(name)');
      await this.db.query('CREATE INDEX IF NOT EXISTS idx_services_status ON services(status)');
      await this.db.query('CREATE INDEX IF NOT EXISTS idx_services_last_heartbeat ON services(last_heartbeat)');

    } catch (error) {
      logger.error('Failed to initialize service registry tables:', error);
    }
  }

  /**
   * 加载服务
   */
  private async loadServices(): Promise<void> {
    try {
      const services = await this.db.query('SELECT * FROM services');

      for (const row of services) {
        const service: ServiceInfo = {
          id: row.id,
          name: row.name,
          version: row.version,
          host: row.host,
          port: row.port,
          protocol: row.protocol,
          status: row.status,
          tags: JSON.parse(row.tags || '[]'),
          metadata: JSON.parse(row.metadata || '{}'),
          lastHeartbeat: row.last_heartbeat,
          registeredAt: row.registered_at,
          healthCheckUrl: row.health_check_url,
          weight: row.weight
        };

        this.services.set(service.id, service);
      }

      logger.info(`📋 已加载 ${services.length} 个服务`);
    } catch (error) {
      logger.error('Failed to load services:', error);
    }
  }

  /**
   * 存储服务
   */
  private async storeService(service: ServiceInfo): Promise<void> {
    try {
      await this.db.query(`
        INSERT OR REPLACE INTO services (
          id, name, version, host, port, protocol, status, tags,
          metadata, last_heartbeat, registered_at, health_check_url, weight
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        service.id, service.name, service.version, service.host, service.port,
        service.protocol, service.status, JSON.stringify(service.tags),
        JSON.stringify(service.metadata), service.lastHeartbeat, service.registeredAt,
        service.healthCheckUrl, service.weight || 1
      ]);
    } catch (error) {
      logger.error('Failed to store service:', error);
    }
  }

  /**
   * 更新服务
   */
  private async updateServiceInDb(service: ServiceInfo): Promise<void> {
    try {
      await this.db.query(`
        UPDATE services SET
          status = ?, last_heartbeat = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [service.status, service.lastHeartbeat, service.id]);
    } catch (error) {
      logger.error('Failed to update service:', error);
    }
  }

  /**
   * 从数据库删除服务
   */
  private async removeServiceFromDb(serviceId: string): Promise<void> {
    try {
      await this.db.query('DELETE FROM services WHERE id = ?', [serviceId]);
    } catch (error) {
      logger.error('Failed to remove service from database:', error);
    }
  }

  /**
   * 更新Redis中的服务信息
   */
  private async updateRedisService(service: ServiceInfo): Promise<void> {
    try {
      const key = `service:${service.id}`;
      const data = JSON.stringify(service);
      await this.redis.setex(key, 3600, data); // 1小时过期
    } catch (error) {
      logger.error('Failed to update service in Redis:', error);
    }
  }

  /**
   * 从Redis删除服务
   */
  private async removeServiceFromRedis(serviceId: string): Promise<void> {
    try {
      const key = `service:${serviceId}`;
      await this.redis.del(key);
    } catch (error) {
      logger.error('Failed to remove service from Redis:', error);
    }
  }

  /**
   * 获取服务统计
   */
  async getServiceStats(): Promise<any> {
    try {
      const totalServices = this.services.size;
      const healthyServices = Array.from(this.services.values()).filter(s => s.status === 'healthy').length;
      const unhealthyServices = Array.from(this.services.values()).filter(s => s.status === 'unhealthy').length;

      return {
        total: totalServices,
        healthy: healthyServices,
        unhealthy: unhealthyServices,
        registered: this.registeredServices.size
      };
    } catch (error) {
      logger.error('Failed to get service stats:', error);
      return { total: 0, healthy: 0, unhealthy: 0, registered: 0 };
    }
  }

  /**
   * 清理过期服务
   */
  async cleanupExpiredServices(): Promise<number> {
    try {
      const now = Date.now();
      const timeout = this.config.serviceTimeout * 2; // 2倍超时时间
      let cleanedCount = 0;

      const expiredServices: string[] = [];
      for (const [serviceId, service] of this.services) {
        if (now - service.lastHeartbeat > timeout) {
          expiredServices.push(serviceId);
        }
      }

      for (const serviceId of expiredServices) {
        await this.unregisterService(serviceId);
        cleanedCount++;
      }

      if (cleanedCount > 0) {
        logger.info(`🧹 清理了 ${cleanedCount} 个过期服务`);
      }

      return cleanedCount;
    } catch (error) {
      logger.error('Failed to cleanup expired services:', error);
      return 0;
    }
  }
}

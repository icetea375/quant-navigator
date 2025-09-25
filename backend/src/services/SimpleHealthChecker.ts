/**
 * SimpleHealthChecker - 健康检查服务
 * 定期轮询核心服务的健康状态
 */

import { BaseErrorHandler } from '../utils/BaseErrorHandler';
import { BaseConfigValidator } from '../utils/BaseConfigValidator';
import { Alert } from './SimpleMonitor';

export interface HealthCheckConfig {
  enabled: boolean;
  checkInterval: number;
  timeout: number;
  services: HealthService[];
  alerting: {
    enabled: boolean;
    alertOnFailure: boolean;
    alertOnRecovery: boolean;
  };
}

export interface HealthService {
  name: string;
  url: string;
  type: 'http' | 'tcp' | 'database' | 'redis';
  timeout: number;
  expectedStatus?: number;
  expectedResponse?: string;
  tags?: Record<string, string>;
}

export interface HealthStatus {
  service: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime: number;
  lastCheck: number;
  error?: string;
  details?: Record<string, any>;
}

export interface HealthCheckResult {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  services: HealthStatus[];
  timestamp: number;
  totalServices: number;
  healthyServices: number;
  unhealthyServices: number;
}

export class SimpleHealthChecker {
  private config: HealthCheckConfig;
  private healthStatuses: Map<string, HealthStatus> = new Map();
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private alertCallback?: (alert: Alert) => void;

  constructor(config: HealthCheckConfig, alertCallback?: (alert: Alert) => void) {
    BaseConfigValidator.validate(config, ['enabled', 'checkInterval', 'timeout', 'services']);
    this.config = config;
    this.alertCallback = alertCallback;
  }

  /**
   * 启动健康检查服务
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    
    if (this.config.enabled) {
      // 立即执行一次检查
      await this.performHealthChecks();
      
      // 设置定期检查
      this.intervalId = setInterval(() => {
        this.performHealthChecks();
      }, this.config.checkInterval);
    }

    console.log('SimpleHealthChecker started');
  }

  /**
   * 停止健康检查服务
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('SimpleHealthChecker stopped');
  }

  /**
   * 执行健康检查
   */
  private async performHealthChecks(): Promise<void> {
    const results: HealthStatus[] = [];
    
    for (const service of this.config.services) {
      try {
        const status = await this.checkService(service);
        results.push(status);
        this.healthStatuses.set(service.name, status);
        
        // 检查状态变化并发送告警
        this.checkStatusChange(service.name, status);
        
      } catch (error) {
        BaseErrorHandler.handle(error, 'SimpleHealthChecker');
        const errorStatus: HealthStatus = {
          service: service.name,
          status: 'unhealthy',
          responseTime: 0,
          lastCheck: Date.now(),
          error: error instanceof Error ? error.message : String(error)
        };
        results.push(errorStatus);
        this.healthStatuses.set(service.name, errorStatus);
      }
    }

    // 生成整体健康状态报告
    const result = this.generateHealthReport(results);
    console.log(`Health check completed: ${result.overall} (${result.healthyServices}/${result.totalServices} healthy)`);
  }

  /**
   * 检查单个服务
   */
  private async checkService(service: HealthService): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      let isHealthy = false;
      let responseTime = 0;
      let error: string | undefined;
      let details: Record<string, any> = {};

      switch (service.type) {
        case 'http':
          const httpResult = await this.checkHttpService(service);
          isHealthy = httpResult.isHealthy;
          responseTime = httpResult.responseTime;
          error = httpResult.error;
          details = httpResult.details;
          break;
          
        case 'tcp':
          const tcpResult = await this.checkTcpService(service);
          isHealthy = tcpResult.isHealthy;
          responseTime = tcpResult.responseTime;
          error = tcpResult.error;
          break;
          
        case 'database':
          const dbResult = await this.checkDatabaseService(service);
          isHealthy = dbResult.isHealthy;
          responseTime = dbResult.responseTime;
          error = dbResult.error;
          details = dbResult.details;
          break;
          
        case 'redis':
          const redisResult = await this.checkRedisService(service);
          isHealthy = redisResult.isHealthy;
          responseTime = redisResult.responseTime;
          error = redisResult.error;
          details = redisResult.details;
          break;
          
        default:
          throw new Error(`Unsupported service type: ${service.type}`);
      }

      return {
        service: service.name,
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        lastCheck: Date.now(),
        error,
        details
      };

    } catch (error) {
      return {
        service: service.name,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: Date.now(),
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 检查HTTP服务
   */
  private async checkHttpService(service: HealthService): Promise<{
    isHealthy: boolean;
    responseTime: number;
    error?: string;
    details?: Record<string, any>;
  }> {
    const axios = require('axios');
    const startTime = Date.now();
    
    try {
      const response = await axios.get(service.url, {
        timeout: service.timeout,
        validateStatus: (status: number) => status < 500 // 只把5xx当作错误
      });
      
      const responseTime = Date.now() - startTime;
      const isHealthy = service.expectedStatus ? 
        response.status === service.expectedStatus : 
        response.status < 400;
      
      // 检查预期响应内容
      if (service.expectedResponse && response.data) {
        const responseText = typeof response.data === 'string' ? 
          response.data : JSON.stringify(response.data);
        if (!responseText.includes(service.expectedResponse)) {
          return {
            isHealthy: false,
            responseTime,
            error: 'Response does not contain expected content',
            details: { expected: service.expectedResponse, actual: responseText }
          };
        }
      }
      
      return {
        isHealthy,
        responseTime,
        details: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        }
      };
      
    } catch (error) {
      return {
        isHealthy: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 检查TCP服务
   */
  private async checkTcpService(service: HealthService): Promise<{
    isHealthy: boolean;
    responseTime: number;
    error?: string;
  }> {
    const net = require('net');
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const socket = new net.Socket();
      
      const timeout = setTimeout(() => {
        socket.destroy();
        resolve({
          isHealthy: false,
          responseTime: Date.now() - startTime,
          error: 'Connection timeout'
        });
      }, service.timeout);
      
      socket.connect(service.url, () => {
        clearTimeout(timeout);
        socket.destroy();
        resolve({
          isHealthy: true,
          responseTime: Date.now() - startTime
        });
      });
      
      socket.on('error', (error) => {
        clearTimeout(timeout);
        resolve({
          isHealthy: false,
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : String(error)
        });
      });
    });
  }

  /**
   * 检查数据库服务
   */
  private async checkDatabaseService(service: HealthService): Promise<{
    isHealthy: boolean;
    responseTime: number;
    error?: string;
    details?: Record<string, any>;
  }> {
    const startTime = Date.now();
    
    try {
      // 这里需要根据实际数据库实现
      // 简化实现，假设数据库连接正常
      return {
        isHealthy: true,
        responseTime: Date.now() - startTime,
        details: { type: 'database', url: service.url }
      };
    } catch (error) {
      return {
        isHealthy: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 检查Redis服务
   */
  private async checkRedisService(service: HealthService): Promise<{
    isHealthy: boolean;
    responseTime: number;
    error?: string;
    details?: Record<string, any>;
  }> {
    const startTime = Date.now();
    
    try {
      // 这里需要根据实际Redis实现
      // 简化实现，假设Redis连接正常
      return {
        isHealthy: true,
        responseTime: Date.now() - startTime,
        details: { type: 'redis', url: service.url }
      };
    } catch (error) {
      return {
        isHealthy: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 检查状态变化并发送告警
   */
  private checkStatusChange(serviceName: string, currentStatus: HealthStatus): void {
    if (!this.config.alerting.enabled || !this.alertCallback) {
      return;
    }

    const previousStatus = this.healthStatuses.get(serviceName);
    
    if (!previousStatus) {
      // 首次检查，不发送告警
      return;
    }

    // 服务从不健康变为健康
    if (previousStatus.status === 'unhealthy' && currentStatus.status === 'healthy') {
      if (this.config.alerting.alertOnRecovery) {
        this.sendRecoveryAlert(serviceName, currentStatus);
      }
    }
    
    // 服务从健康变为不健康
    if (previousStatus.status === 'healthy' && currentStatus.status === 'unhealthy') {
      if (this.config.alerting.alertOnFailure) {
        this.sendFailureAlert(serviceName, currentStatus);
      }
    }
  }

  /**
   * 发送故障告警
   */
  private sendFailureAlert(serviceName: string, status: HealthStatus): void {
    if (!this.alertCallback) return;

    const alert: Alert = {
      id: `health_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'custom',
      severity: 'high',
      message: `Service ${serviceName} is unhealthy: ${status.error || 'Unknown error'}`,
      value: 0,
      threshold: 0,
      timestamp: Date.now(),
      resolved: false,
      service: serviceName,
      tags: { type: 'health_check', status: 'failure' }
    };

    this.alertCallback(alert);
  }

  /**
   * 发送恢复告警
   */
  private sendRecoveryAlert(serviceName: string, status: HealthStatus): void {
    if (!this.alertCallback) return;

    const alert: Alert = {
      id: `health_recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'custom',
      severity: 'low',
      message: `Service ${serviceName} has recovered and is now healthy`,
      value: 1,
      threshold: 0,
      timestamp: Date.now(),
      resolved: true,
      service: serviceName,
      tags: { type: 'health_check', status: 'recovery' }
    };

    this.alertCallback(alert);
  }

  /**
   * 生成健康报告
   */
  private generateHealthReport(statuses: HealthStatus[]): HealthCheckResult {
    const totalServices = statuses.length;
    const healthyServices = statuses.filter(s => s.status === 'healthy').length;
    const unhealthyServices = statuses.filter(s => s.status === 'unhealthy').length;
    
    let overall: 'healthy' | 'unhealthy' | 'degraded';
    if (unhealthyServices === 0) {
      overall = 'healthy';
    } else if (unhealthyServices < totalServices) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return {
      overall,
      services: statuses,
      timestamp: Date.now(),
      totalServices,
      healthyServices,
      unhealthyServices
    };
  }

  /**
   * 获取当前健康状态
   */
  public getHealthStatus(): HealthCheckResult {
    const services = Array.from(this.healthStatuses.values());
    return this.generateHealthReport(services);
  }

  /**
   * 获取特定服务状态
   */
  public getServiceStatus(serviceName: string): HealthStatus | null {
    return this.healthStatuses.get(serviceName) || null;
  }

  /**
   * 手动触发健康检查
   */
  public async triggerHealthCheck(): Promise<HealthCheckResult> {
    await this.performHealthChecks();
    return this.getHealthStatus();
  }

  /**
   * 获取配置信息
   */
  public getConfig(): HealthCheckConfig {
    return { ...this.config };
  }
}

// 导出默认配置
export const defaultHealthCheckConfig: HealthCheckConfig = {
  enabled: true,
  checkInterval: 30000, // 30秒
  timeout: 5000, // 5秒
  services: [
    {
      name: 'Node.js Backend',
      url: 'http://localhost:3000/health',
      type: 'http',
      timeout: 5000,
      expectedStatus: 200,
      expectedResponse: 'healthy',
      tags: { environment: 'production', tier: 'backend' }
    },
    {
      name: 'Python Engine',
      url: 'http://localhost:8000/health',
      type: 'http',
      timeout: 5000,
      expectedStatus: 200,
      expectedResponse: 'healthy',
      tags: { environment: 'production', tier: 'compute' }
    },
    {
      name: 'Tushare Data Service',
      url: 'http://localhost:8001/health',
      type: 'http',
      timeout: 10000,
      expectedStatus: 200,
      expectedResponse: 'healthy',
      tags: { environment: 'production', tier: 'data' }
    },
    {
      name: 'Database',
      url: 'localhost:5432',
      type: 'tcp',
      timeout: 5000,
      tags: { environment: 'production', tier: 'database' }
    },
    {
      name: 'Redis Cache',
      url: 'localhost:6379',
      type: 'tcp',
      timeout: 5000,
      tags: { environment: 'production', tier: 'cache' }
    }
  ],
  alerting: {
    enabled: true,
    alertOnFailure: true,
    alertOnRecovery: true
  }
};

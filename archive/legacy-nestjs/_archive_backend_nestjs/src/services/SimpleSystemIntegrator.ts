/**
 * 简单系统集成器
 * 遵循智能分析系统开发实施指南的命名规范
 */

import { DatabaseConnection } from '../database/connection';
import { Redis } from 'ioredis';
import { BaseErrorHandler } from '../utils/BaseErrorHandler';
import { BaseConfigValidator } from '../utils/BaseConfigValidator';
import { logger } from '../utils/logger';
import { SimpleCache } from './SimpleCache';
import { SimpleTaskManager } from './SimpleTaskManager';
import { SimpleRouter } from './SimpleRouter';
import { SimpleAlertManager } from './SimpleAlertManager';
import { SimpleServiceRegistry } from './SimpleServiceRegistry';
import { SimpleDistributedLockManager } from './SimpleDistributedLockManager';
import { SimpleMonitoringSystem } from './SimpleMonitoringSystem';
import { SimpleAlgorithmTrainingSystem } from './SimpleAlgorithmTrainingSystem';
import { SimpleDualLLMCollaborationSystem } from './SimpleDualLLMCollaborationSystem';
import { SimpleFeedbackOptimizationSystem } from './SimpleFeedbackOptimizationSystem';
import { SimpleHistoricalAttributionService } from './SimpleHistoricalAttributionService';
import { SimpleDailyNewsProcessingService } from './SimpleDailyNewsProcessingService';
import { SimpleTimelineConstructionService } from './SimpleTimelineConstructionService';
import { SimpleHistoricalNewsAPI } from './SimpleHistoricalNewsAPI';

export interface SystemIntegratorConfig {
  enabled: boolean;
  services: {
    enableInfrastructure: boolean;
    enableBusiness: boolean;
    enableAPI: boolean;
    enableMonitoring: boolean;
    enableOptimization: boolean;
  };
  startup: {
    enableSequentialStartup: boolean;
    enableHealthChecks: boolean;
    startupTimeout: number; // 毫秒
    retryCount: number;
    retryDelay: number; // 毫秒
  };
  shutdown: {
    enableGracefulShutdown: boolean;
    shutdownTimeout: number; // 毫秒
    forceShutdownTimeout: number; // 毫秒
  };
  monitoring: {
    enableSystemMetrics: boolean;
    enableServiceHealth: boolean;
    enablePerformanceMonitoring: boolean;
    metricsInterval: number; // 毫秒
  };
  optimization: {
    enableCaching: boolean;
    enableCompression: boolean;
    enableConnectionPooling: boolean;
    enableLoadBalancing: boolean;
  };
  security: {
    enableAuthentication: boolean;
    enableAuthorization: boolean;
    enableRateLimiting: boolean;
    enableInputValidation: boolean;
  };
}

export interface ServiceStatus {
  name: string;
  status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
  health: 'healthy' | 'unhealthy' | 'unknown';
  uptime: number; // 毫秒
  lastError?: string;
  metrics?: any;
}

export interface SystemMetrics {
  totalServices: number;
  runningServices: number;
  healthyServices: number;
  systemUptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: number;
  activeConnections: number;
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
}

export class SimpleSystemIntegrator {
  private db: DatabaseConnection;
  private redis: Redis;
  private config: SystemIntegratorConfig;
  private services: Map<string, any> = new Map();
  private serviceStatuses: Map<string, ServiceStatus> = new Map();
  private isRunning: boolean = false;
  private startTime: Date = new Date();
  private metrics: SystemMetrics;
  private healthCheckInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;

  constructor(db: DatabaseConnection, redis: Redis, config: SystemIntegratorConfig) {
    this.db = db;
    this.redis = redis;
    this.config = config;
    this.metrics = this.initializeMetrics();

    this.validateConfig(config);
    this.initializeServices();
  }

  /**
   * 启动整个系统
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('System is already running');
      return;
    }

    try {
      logger.info('🚀 开始启动智能分析系统...');
      this.startTime = new Date();

      // 1. 启动基础设施服务
      if (this.config.services.enableInfrastructure) {
        await this.startInfrastructureServices();
      }

      // 2. 启动业务服务
      if (this.config.services.enableBusiness) {
        await this.startBusinessServices();
      }

      // 3. 启动API服务
      if (this.config.services.enableAPI) {
        await this.startAPIServices();
      }

      // 4. 启动监控服务
      if (this.config.services.enableMonitoring) {
        await this.startMonitoringServices();
      }

      // 5. 启动优化服务
      if (this.config.services.enableOptimization) {
        await this.startOptimizationServices();
      }

      // 6. 验证系统完整性
      if (this.config.startup.enableHealthChecks) {
        await this.validateSystemHealth();
      }

      // 7. 启动监控
      this.startSystemMonitoring();

      this.isRunning = true;
      logger.info('✅ 智能分析系统启动完成');

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleSystemIntegrator');
      await this.emergencyShutdown();
      throw error;
    }
  }

  /**
   * 停止整个系统
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('System is not running');
      return;
    }

    try {
      logger.info('🛑 开始停止智能分析系统...');

      // 停止监控
      this.stopSystemMonitoring();

      // 优雅关闭服务
      if (this.config.shutdown.enableGracefulShutdown) {
        await this.gracefulShutdown();
      } else {
        await this.forceShutdown();
      }

      this.isRunning = false;
      logger.info('✅ 智能分析系统已停止');

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleSystemIntegrator');
      await this.forceShutdown();
      throw error;
    }
  }

  /**
   * 启动基础设施服务
   */
  private async startInfrastructureServices(): Promise<void> {
    logger.info('🔧 启动基础设施服务...');

    const services = [
      { name: 'cache', service: new SimpleCache(true) },
      { name: 'taskManager', service: new SimpleTaskManager({
        enabled: true,
        maxConcurrentTasks: 10,
        taskTimeout: 300000,
        retryCount: 3,
        retryDelay: 5000
      })},
      { name: 'serviceRegistry', service: new SimpleServiceRegistry({
        enabled: true,
        registry: { host: 'localhost', port: 8500 },
        heartbeat: { interval: 30000, timeout: 10000 },
        discovery: { timeout: 5000, retryCount: 3 }
      })},
      { name: 'distributedLockManager', service: new SimpleDistributedLockManager({
        enabled: true,
        redis: { host: 'localhost', port: 6379 },
        lock: { ttl: 30000, retryCount: 3, retryDelay: 1000 }
      })}
    ];

    for (const { name, service } of services) {
      await this.startService(name, service);
    }

    logger.info('✅ 基础设施服务启动完成');
  }

  /**
   * 启动业务服务
   */
  private async startBusinessServices(): Promise<void> {
    logger.info('💼 启动业务服务...');

    // 初始化双LLM系统
    const dualLLMConfig = {
      enabled: true,
      doubao: {
        apiKey: process.env.DOUBAO_API_KEY || 'your-doubao-key',
        model: 'doubao-lite',
        timeout: 30000
      },
      hunyuan: {
        apiKey: process.env.HUNYUAN_API_KEY || 'your-hunyuan-key',
        model: 'hunyuan-lite',
        timeout: 30000
      }
    };

    const dualLLMSystem = new SimpleDualLLMCollaborationSystem(dualLLMConfig);
    this.services.set('dualLLMSystem', dualLLMSystem);

    // 启动算法训练系统
    const algorithmTrainingSystem = new SimpleAlgorithmTrainingSystem(
      this.db, this.redis, {
        enabled: true,
        training: { enableAutoTraining: true, trainingInterval: 3600000 },
        models: { enableTabPFN: true, enableSmolVLM: true, enableLLaMA: true },
        data: { enableAutoLabeling: true, enableDataValidation: true },
        storage: { enableDatabase: true, enableCaching: true }
      }
    );
    await this.startService('algorithmTrainingSystem', algorithmTrainingSystem);

    // 启动反馈优化系统
    const feedbackOptimizationSystem = new SimpleFeedbackOptimizationSystem({
      enabled: true,
      feedbackCollectorConfig: { enabled: true, storage: { enableDatabase: true } },
      feedbackAnalyzerConfig: { enabled: true, minFeedbackCountForAnalysis: 10 },
      optimizationEngineConfig: { enabled: true, optimizationStrategy: 'hybrid' },
      autoOptimizeIntervalSeconds: 3600
    });
    await this.startService('feedbackOptimizationSystem', feedbackOptimizationSystem);

    // 启动历史归因分析服务
    const historicalAttributionService = new SimpleHistoricalAttributionService(
      {
        enabled: true,
        minFeatureCountForAnalysis: 5,
        llmAttributionPromptTemplate: 'Analyze the attribution of this event: {eventContent}',
        impactThresholds: { low: 0.3, medium: 0.6, high: 0.8 }
      },
      new SimpleEventFeatureExtractor({
        enabled: true,
        cacheEnabled: true,
        cacheTTL: 3600,
        textAnalysisServiceUrl: 'http://localhost:8001',
        marketDataServiceUrl: 'http://localhost:8002'
      }),
      dualLLMSystem
    );
    await this.startService('historicalAttributionService', historicalAttributionService);

    // 启动日常新闻处理服务
    const dailyNewsProcessingService = new SimpleDailyNewsProcessingService(
      this.db, this.redis, {
        enabled: true,
        processing: { enableRealTimeProcessing: true, enableBatchProcessing: true, batchSize: 50 },
        features: { enableTextAnalysis: true, enableSentimentAnalysis: true },
        scoring: { enableImportanceScoring: true, scoringModel: 'ensemble' },
        storage: { enableDatabase: true, enableCaching: true }
      },
      dualLLMSystem
    );
    await this.startService('dailyNewsProcessingService', dailyNewsProcessingService);

    // 启动时间线构建服务
    const timelineConstructionService = new SimpleTimelineConstructionService(
      this.db, this.redis, {
        enabled: true,
        construction: { enableEventSequencing: true, enableRelationMining: true },
        analysis: { enableSemanticAnalysis: true, enableSentimentAnalysis: true },
        output: { enableNarrativeGeneration: true, enableSummaryGeneration: true },
        storage: { enableDatabase: true, enableCaching: true }
      },
      dualLLMSystem
    );
    await this.startService('timelineConstructionService', timelineConstructionService);

    // 启动历史归因新闻API
    const historicalNewsAPI = new SimpleHistoricalNewsAPI(
      this.db, this.redis, {
        enabled: true,
        search: { enableGoogleNews: true, enableHunyuanSearch: true },
        processing: { enableDeduplication: true, enableQualityFilter: true },
        storage: { enableDatabase: true, enableCaching: true }
      },
      dualLLMSystem
    );
    await this.startService('historicalNewsAPI', historicalNewsAPI);

    logger.info('✅ 业务服务启动完成');
  }

  /**
   * 启动API服务
   */
  private async startAPIServices(): Promise<void> {
    logger.info('🌐 启动API服务...');

    // 启动API网关
    const router = new SimpleRouter({
      enabled: true,
      port: 3000,
      host: '0.0.0.0',
      loadBalancing: { enabled: true, strategy: 'round_robin' },
      rateLimiting: { enabled: true, windowMs: 60000, maxRequests: 100 },
      authentication: { enabled: true, jwtSecret: process.env.JWT_SECRET || 'your-secret' }
    });
    await this.startService('router', router);

    logger.info('✅ API服务启动完成');
  }

  /**
   * 启动监控服务
   */
  private async startMonitoringServices(): Promise<void> {
    logger.info('📊 启动监控服务...');

    // 启动告警管理器
    const alertManager = new SimpleAlertManager({
      enabled: true,
      channels: { console: true, email: true, webhook: true },
      rules: { enableAutoRules: true, customRules: [] },
      suppression: { enabled: true, duration: 300000 }
    });
    await this.startService('alertManager', alertManager);

    // 启动监控系统
    const monitoringSystem = new SimpleMonitoringSystem({
      enabled: true,
      metrics: { enableSystemMetrics: true, enableBusinessMetrics: true },
      healthChecks: { enabled: true, interval: 30000 },
      alerting: { enabled: true, alertManager }
    });
    await this.startService('monitoringSystem', monitoringSystem);

    logger.info('✅ 监控服务启动完成');
  }

  /**
   * 启动优化服务
   */
  private async startOptimizationServices(): Promise<void> {
    logger.info('⚡ 启动优化服务...');

    // 这里可以添加各种优化服务
    // 如缓存预热、连接池优化、性能调优等

    logger.info('✅ 优化服务启动完成');
  }

  /**
   * 启动单个服务
   */
  private async startService(name: string, service: any): Promise<void> {
    try {
      this.updateServiceStatus(name, 'starting');

      if (typeof service.start === 'function') {
        await service.start();
      }

      this.services.set(name, service);
      this.updateServiceStatus(name, 'running');
      logger.info(`✅ 服务 ${name} 启动成功`);

    } catch (error) {
      this.updateServiceStatus(name, 'error', error instanceof Error ? error.message : String(error));
      logger.error(`❌ 服务 ${name} 启动失败:`, error);
      throw error;
    }
  }

  /**
   * 更新服务状态
   */
  private updateServiceStatus(name: string, status: ServiceStatus['status'], error?: string): void {
    const currentStatus = this.serviceStatuses.get(name) || {
      name,
      status: 'stopped',
      health: 'unknown',
      uptime: 0
    };

    this.serviceStatuses.set(name, {
      ...currentStatus,
      status,
      health: status === 'running' ? 'healthy' : (status === 'error' ? 'unhealthy' : 'unknown'),
      lastError: error,
      uptime: status === 'running' ? Date.now() - this.startTime.getTime() : currentStatus.uptime
    });
  }

  /**
   * 验证系统健康状态
   */
  private async validateSystemHealth(): Promise<void> {
    logger.info('🔍 验证系统健康状态...');

    const unhealthyServices = Array.from(this.serviceStatuses.values())
      .filter(service => service.health !== 'healthy');

    if (unhealthyServices.length > 0) {
      const serviceNames = unhealthyServices.map(s => s.name).join(', ');
      throw new Error(`以下服务不健康: ${serviceNames}`);
    }

    logger.info('✅ 系统健康状态验证通过');
  }

  /**
   * 启动系统监控
   */
  private startSystemMonitoring(): void {
    if (this.config.monitoring.enableSystemMetrics) {
      this.metricsInterval = setInterval(() => {
        this.updateSystemMetrics();
      }, this.config.monitoring.metricsInterval);
    }

    if (this.config.monitoring.enableServiceHealth) {
      this.healthCheckInterval = setInterval(() => {
        this.checkServiceHealth();
      }, 30000);
    }
  }

  /**
   * 停止系统监控
   */
  private stopSystemMonitoring(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * 更新系统指标
   */
  private updateSystemMetrics(): void {
    const runningServices = Array.from(this.serviceStatuses.values())
      .filter(service => service.status === 'running');

    const healthyServices = runningServices.filter(service => service.health === 'healthy');

    this.metrics = {
      totalServices: this.serviceStatuses.size,
      runningServices: runningServices.length,
      healthyServices: healthyServices.length,
      systemUptime: Date.now() - this.startTime.getTime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage().user / 1000000, // 转换为秒
      activeConnections: 0, // 需要从具体服务获取
      requestCount: 0, // 需要从具体服务获取
      errorCount: Array.from(this.serviceStatuses.values())
        .filter(service => service.status === 'error').length,
      averageResponseTime: 0 // 需要从具体服务获取
    };
  }

  /**
   * 检查服务健康状态
   */
  private async checkServiceHealth(): Promise<void> {
    for (const [name, service] of this.services) {
      try {
        if (typeof service.getHealth === 'function') {
          const health = await service.getHealth();
          this.updateServiceStatus(name, health.status, health.error);
        }
      } catch (error) {
        this.updateServiceStatus(name, 'error', error instanceof Error ? error.message : String(error));
      }
    }
  }

  /**
   * 优雅关闭
   */
  private async gracefulShutdown(): Promise<void> {
    const shutdownTimeout = setTimeout(() => {
      logger.warn('优雅关闭超时，强制关闭');
      this.forceShutdown();
    }, this.config.shutdown.shutdownTimeout);

    try {
      // 按相反顺序关闭服务
      const serviceNames = Array.from(this.services.keys()).reverse();

      for (const name of serviceNames) {
        const service = this.services.get(name);
        if (service && typeof service.stop === 'function') {
          this.updateServiceStatus(name, 'stopping');
          await service.stop();
          this.updateServiceStatus(name, 'stopped');
          logger.info(`✅ 服务 ${name} 已停止`);
        }
      }

      clearTimeout(shutdownTimeout);
    } catch (error) {
      clearTimeout(shutdownTimeout);
      throw error;
    }
  }

  /**
   * 强制关闭
   */
  private async forceShutdown(): Promise<void> {
    logger.warn('执行强制关闭');

    for (const [name, service] of this.services) {
      try {
        if (typeof service.stop === 'function') {
          await service.stop();
        }
        this.updateServiceStatus(name, 'stopped');
      } catch (error) {
        logger.error(`强制关闭服务 ${name} 失败:`, error);
      }
    }
  }

  /**
   * 紧急关闭
   */
  private async emergencyShutdown(): Promise<void> {
    logger.error('执行紧急关闭');
    await this.forceShutdown();
  }

  /**
   * 初始化指标
   */
  private initializeMetrics(): SystemMetrics {
    return {
      totalServices: 0,
      runningServices: 0,
      healthyServices: 0,
      systemUptime: 0,
      memoryUsage: process.memoryUsage(),
      cpuUsage: 0,
      activeConnections: 0,
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0
    };
  }

  /**
   * 验证配置
   */
  private validateConfig(config: SystemIntegratorConfig): void {
    BaseConfigValidator.validate(config, ['enabled', 'services', 'startup', 'shutdown']);

    if (config.startup.startupTimeout <= 0) {
      throw new Error('startupTimeout must be greater than 0');
    }

    if (config.shutdown.shutdownTimeout <= 0) {
      throw new Error('shutdownTimeout must be greater than 0');
    }
  }

  /**
   * 获取服务状态
   */
  getServiceStatus(name: string): ServiceStatus | undefined {
    return this.serviceStatuses.get(name);
  }

  /**
   * 获取所有服务状态
   */
  getAllServiceStatuses(): ServiceStatus[] {
    return Array.from(this.serviceStatuses.values());
  }

  /**
   * 获取系统指标
   */
  getSystemMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  /**
   * 获取系统状态
   */
  getSystemStatus(): any {
    return {
      isRunning: this.isRunning,
      startTime: this.startTime,
      uptime: Date.now() - this.startTime.getTime(),
      services: this.getAllServiceStatuses(),
      metrics: this.getSystemMetrics()
    };
  }

  /**
   * 重启服务
   */
  async restartService(name: string): Promise<void> {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }

    try {
      if (typeof service.stop === 'function') {
        await service.stop();
      }

      if (typeof service.start === 'function') {
        await service.start();
      }

      this.updateServiceStatus(name, 'running');
      logger.info(`✅ 服务 ${name} 重启成功`);

    } catch (error) {
      this.updateServiceStatus(name, 'error', error instanceof Error ? error.message : String(error));
      logger.error(`❌ 服务 ${name} 重启失败:`, error);
      throw error;
    }
  }

  /**
   * 获取服务
   */
  getService(name: string): any {
    return this.services.get(name);
  }
}

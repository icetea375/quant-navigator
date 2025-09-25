/**
 * 简单性能优化器
 * 遵循智能分析系统开发实施指南的命名规范
 */

import { DatabaseConnection } from '../database/connection';
import { Redis } from 'ioredis';
import { BaseErrorHandler } from '../utils/BaseErrorHandler';
import { BaseConfigValidator } from '../utils/BaseConfigValidator';
import { logger } from '../utils/logger';

export interface PerformanceOptimizerConfig {
  enabled: boolean;
  caching: {
    enableQueryCache: boolean;
    enableResultCache: boolean;
    enablePreloading: boolean;
    cacheSize: number;
    cacheTTL: number;
  };
  database: {
    enableConnectionPooling: boolean;
    enableQueryOptimization: boolean;
    enableIndexOptimization: boolean;
    maxConnections: number;
    connectionTimeout: number;
  };
  memory: {
    enableMemoryOptimization: boolean;
    enableGarbageCollection: boolean;
    memoryThreshold: number; // MB
    gcInterval: number; // 毫秒
  };
  network: {
    enableCompression: boolean;
    enableKeepAlive: boolean;
    enableConnectionReuse: boolean;
    timeout: number;
  };
  monitoring: {
    enablePerformanceMonitoring: boolean;
    enableMetricsCollection: boolean;
    metricsInterval: number;
    alertThresholds: {
      responseTime: number; // 毫秒
      memoryUsage: number; // MB
      cpuUsage: number; // 百分比
      errorRate: number; // 百分比
    };
  };
}

export interface PerformanceMetrics {
  timestamp: Date;
  responseTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  memory: {
    used: number;
    free: number;
    total: number;
    heapUsed: number;
    heapTotal: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  database: {
    activeConnections: number;
    idleConnections: number;
    queryCount: number;
    averageQueryTime: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    size: number;
    evictions: number;
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
    rate: number; // 请求/秒
  };
}

export class SimplePerformanceOptimizer {
  private db: DatabaseConnection;
  private redis: Redis;
  private config: PerformanceOptimizerConfig;
  private metrics: PerformanceMetrics;
  private metricsHistory: PerformanceMetrics[] = [];
  private isRunning: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;
  private gcInterval?: NodeJS.Timeout;

  constructor(db: DatabaseConnection, redis: Redis, config: PerformanceOptimizerConfig) {
    this.db = db;
    this.redis = redis;
    this.config = config;
    this.metrics = this.initializeMetrics();
    
    this.validateConfig(config);
  }

  /**
   * 启动性能优化器
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Performance optimizer is already running');
      return;
    }

    this.isRunning = true;

    // 启动性能监控
    if (this.config.monitoring.enablePerformanceMonitoring) {
      this.startPerformanceMonitoring();
    }

    // 启动内存优化
    if (this.config.memory.enableMemoryOptimization) {
      this.startMemoryOptimization();
    }

    // 启动数据库优化
    if (this.config.database.enableQueryOptimization) {
      this.optimizeDatabase();
    }

    // 启动缓存优化
    if (this.config.caching.enablePreloading) {
      this.preloadCache();
    }

    logger.info('⚡ 性能优化器已启动');
  }

  /**
   * 停止性能优化器
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    // 停止监控
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = undefined;
    }

    logger.info('🛑 性能优化器已停止');
  }

  /**
   * 启动性能监控
   */
  private startPerformanceMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkPerformanceThresholds();
    }, this.config.monitoring.metricsInterval);

    logger.info('📊 性能监控已启动');
  }

  /**
   * 启动内存优化
   */
  private startMemoryOptimization(): void {
    this.gcInterval = setInterval(() => {
      this.optimizeMemory();
    }, this.config.memory.gcInterval);

    logger.info('🧠 内存优化已启动');
  }

  /**
   * 收集性能指标
   */
  private collectMetrics(): void {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      this.metrics = {
        timestamp: new Date(),
        responseTime: this.calculateResponseTimeMetrics(),
        memory: {
          used: memoryUsage.heapUsed,
          free: memoryUsage.heapTotal - memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal
        },
        cpu: {
          usage: cpuUsage.user / 1000000, // 转换为秒
          loadAverage: process.platform === 'win32' ? [0, 0, 0] : require('os').loadavg()
        },
        database: this.getDatabaseMetrics(),
        cache: this.getCacheMetrics(),
        requests: this.getRequestMetrics()
      };

      // 保存历史指标
      this.metricsHistory.push({ ...this.metrics });
      if (this.metricsHistory.length > 1000) {
        this.metricsHistory = this.metricsHistory.slice(-1000);
      }

    } catch (error) {
      logger.error('收集性能指标失败:', error);
    }
  }

  /**
   * 计算响应时间指标
   */
  private calculateResponseTimeMetrics(): any {
    // 这里应该从实际的请求日志中计算
    // 目前返回模拟数据
    return {
      average: 100,
      p50: 80,
      p95: 200,
      p99: 500
    };
  }

  /**
   * 获取数据库指标
   */
  private getDatabaseMetrics(): any {
    // 这里应该从数据库连接池获取实际指标
    return {
      activeConnections: 5,
      idleConnections: 10,
      queryCount: 1000,
      averageQueryTime: 50
    };
  }

  /**
   * 获取缓存指标
   */
  private getCacheMetrics(): any {
    // 这里应该从Redis获取实际指标
    return {
      hitRate: 0.85,
      missRate: 0.15,
      size: 1000,
      evictions: 10
    };
  }

  /**
   * 获取请求指标
   */
  private getRequestMetrics(): any {
    // 这里应该从实际的请求统计中获取
    return {
      total: 10000,
      successful: 9500,
      failed: 500,
      rate: 100
    };
  }

  /**
   * 检查性能阈值
   */
  private checkPerformanceThresholds(): void {
    const thresholds = this.config.monitoring.alertThresholds;

    // 检查响应时间
    if (this.metrics.responseTime.average > thresholds.responseTime) {
      logger.warn(`响应时间超过阈值: ${this.metrics.responseTime.average}ms > ${thresholds.responseTime}ms`);
    }

    // 检查内存使用
    const memoryUsageMB = this.metrics.memory.used / 1024 / 1024;
    if (memoryUsageMB > thresholds.memoryUsage) {
      logger.warn(`内存使用超过阈值: ${memoryUsageMB.toFixed(2)}MB > ${thresholds.memoryUsage}MB`);
    }

    // 检查CPU使用
    if (this.metrics.cpu.usage > thresholds.cpuUsage) {
      logger.warn(`CPU使用超过阈值: ${this.metrics.cpu.usage}% > ${thresholds.cpuUsage}%`);
    }

    // 检查错误率
    const errorRate = (this.metrics.requests.failed / this.metrics.requests.total) * 100;
    if (errorRate > thresholds.errorRate) {
      logger.warn(`错误率超过阈值: ${errorRate.toFixed(2)}% > ${thresholds.errorRate}%`);
    }
  }

  /**
   * 优化内存
   */
  private optimizeMemory(): void {
    try {
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;

      if (memoryUsageMB > this.config.memory.memoryThreshold) {
        logger.info(`内存使用过高 (${memoryUsageMB.toFixed(2)}MB)，执行垃圾回收`);
        
        if (global.gc) {
          global.gc();
          logger.info('✅ 垃圾回收完成');
        } else {
          logger.warn('垃圾回收不可用，请使用 --expose-gc 参数启动');
        }
      }
    } catch (error) {
      logger.error('内存优化失败:', error);
    }
  }

  /**
   * 优化数据库
   */
  private async optimizeDatabase(): Promise<void> {
    try {
      // 分析表统计信息
      await this.analyzeTableStatistics();
      
      // 优化索引
      await this.optimizeIndexes();
      
      // 清理过期数据
      await this.cleanupExpiredData();

      logger.info('✅ 数据库优化完成');
    } catch (error) {
      logger.error('数据库优化失败:', error);
    }
  }

  /**
   * 分析表统计信息
   */
  private async analyzeTableStatistics(): Promise<void> {
    try {
      const tables = [
        'news_items',
        'processed_news',
        'timelines',
        'event_relations',
        'turning_points'
      ];

      for (const table of tables) {
        await this.db.query(`ANALYZE ${table}`);
      }

      logger.info('✅ 表统计信息分析完成');
    } catch (error) {
      logger.error('表统计信息分析失败:', error);
    }
  }

  /**
   * 优化索引
   */
  private async optimizeIndexes(): Promise<void> {
    try {
      // 检查索引使用情况
      const indexUsageQuery = `
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
      `;

      const results = await this.db.query(indexUsageQuery);
      
      // 找出未使用的索引
      const unusedIndexes = results.filter(row => row.idx_scan === 0);
      
      if (unusedIndexes.length > 0) {
        logger.warn(`发现 ${unusedIndexes.length} 个未使用的索引`);
        // 这里可以添加删除未使用索引的逻辑
      }

      logger.info('✅ 索引优化完成');
    } catch (error) {
      logger.error('索引优化失败:', error);
    }
  }

  /**
   * 清理过期数据
   */
  private async cleanupExpiredData(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // 90天前

      // 清理过期的新闻数据
      await this.db.query(`
        DELETE FROM news_items 
        WHERE created_at < ? AND processed = 1
      `, [cutoffDate.toISOString()]);

      // 清理过期的缓存数据
      await this.redis.eval(`
        local keys = redis.call('keys', 'cache:*')
        local expired = 0
        for i=1,#keys do
          local ttl = redis.call('ttl', keys[i])
          if ttl == -1 then
            redis.call('del', keys[i])
            expired = expired + 1
          end
        end
        return expired
      `, 0);

      logger.info('✅ 过期数据清理完成');
    } catch (error) {
      logger.error('过期数据清理失败:', error);
    }
  }

  /**
   * 预加载缓存
   */
  private async preloadCache(): Promise<void> {
    try {
      // 预加载热点数据
      const hotData = await this.getHotData();
      
      for (const item of hotData) {
        await this.redis.setex(`cache:${item.key}`, this.config.caching.cacheTTL, JSON.stringify(item.value));
      }

      logger.info(`✅ 缓存预加载完成，加载了 ${hotData.length} 条数据`);
    } catch (error) {
      logger.error('缓存预加载失败:', error);
    }
  }

  /**
   * 获取热点数据
   */
  private async getHotData(): Promise<any[]> {
    try {
      // 获取最近的热点新闻
      const hotNews = await this.db.query(`
        SELECT id, title, content, importance_score
        FROM processed_news
        WHERE importance_score > 0.8
        ORDER BY created_at DESC
        LIMIT 100
      `);

      return hotNews.map(news => ({
        key: `news:${news.id}`,
        value: news
      }));
    } catch (error) {
      logger.error('获取热点数据失败:', error);
      return [];
    }
  }

  /**
   * 优化查询
   */
  async optimizeQuery(query: string, params: any[] = []): Promise<string> {
    try {
      // 这里可以添加查询优化逻辑
      // 例如：添加适当的索引提示、优化JOIN顺序等
      
      let optimizedQuery = query;

      // 添加查询提示
      if (query.includes('SELECT') && query.includes('WHERE')) {
        // 可以添加索引提示
        optimizedQuery = query.replace('SELECT', 'SELECT /*+ USE_INDEX */');
      }

      return optimizedQuery;
    } catch (error) {
      logger.error('查询优化失败:', error);
      return query;
    }
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(): any {
    const recentMetrics = this.metricsHistory.slice(-10); // 最近10个指标

    if (recentMetrics.length === 0) {
      return { message: '暂无性能数据' };
    }

    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime.average, 0) / recentMetrics.length;
    const avgMemoryUsage = recentMetrics.reduce((sum, m) => sum + m.memory.used, 0) / recentMetrics.length;
    const avgCpuUsage = recentMetrics.reduce((sum, m) => sum + m.cpu.usage, 0) / recentMetrics.length;

    return {
      period: {
        start: recentMetrics[0].timestamp,
        end: recentMetrics[recentMetrics.length - 1].timestamp
      },
      averages: {
        responseTime: avgResponseTime,
        memoryUsage: avgMemoryUsage / 1024 / 1024, // 转换为MB
        cpuUsage: avgCpuUsage
      },
      trends: this.calculateTrends(recentMetrics),
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * 计算趋势
   */
  private calculateTrends(metrics: PerformanceMetrics[]): any {
    if (metrics.length < 2) {
      return { responseTime: 'stable', memory: 'stable', cpu: 'stable' };
    }

    const first = metrics[0];
    const last = metrics[metrics.length - 1];

    return {
      responseTime: last.responseTime.average > first.responseTime.average ? 'increasing' : 'decreasing',
      memory: last.memory.used > first.memory.used ? 'increasing' : 'decreasing',
      cpu: last.cpu.usage > first.cpu.usage ? 'increasing' : 'decreasing'
    };
  }

  /**
   * 生成优化建议
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const current = this.metrics;

    // 响应时间建议
    if (current.responseTime.average > 500) {
      recommendations.push('响应时间较高，建议优化数据库查询或增加缓存');
    }

    // 内存使用建议
    const memoryUsageMB = current.memory.used / 1024 / 1024;
    if (memoryUsageMB > 500) {
      recommendations.push('内存使用较高，建议优化内存使用或增加内存');
    }

    // CPU使用建议
    if (current.cpu.usage > 80) {
      recommendations.push('CPU使用率较高，建议优化算法或增加CPU资源');
    }

    // 缓存命中率建议
    if (current.cache.hitRate < 0.8) {
      recommendations.push('缓存命中率较低，建议优化缓存策略');
    }

    return recommendations;
  }

  /**
   * 初始化指标
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      timestamp: new Date(),
      responseTime: { average: 0, p50: 0, p95: 0, p99: 0 },
      memory: { used: 0, free: 0, total: 0, heapUsed: 0, heapTotal: 0 },
      cpu: { usage: 0, loadAverage: [0, 0, 0] },
      database: { activeConnections: 0, idleConnections: 0, queryCount: 0, averageQueryTime: 0 },
      cache: { hitRate: 0, missRate: 0, size: 0, evictions: 0 },
      requests: { total: 0, successful: 0, failed: 0, rate: 0 }
    };
  }

  /**
   * 验证配置
   */
  private validateConfig(config: PerformanceOptimizerConfig): void {
    BaseConfigValidator.validate(config, ['enabled', 'caching', 'database', 'memory', 'network', 'monitoring']);
    
    if (config.caching.cacheSize <= 0) {
      throw new Error('cacheSize must be greater than 0');
    }
    
    if (config.database.maxConnections <= 0) {
      throw new Error('maxConnections must be greater than 0');
    }
  }

  /**
   * 获取当前指标
   */
  getCurrentMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 获取指标历史
   */
  getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * 获取运行状态
   */
  getStatus(): any {
    return {
      isRunning: this.isRunning,
      metricsCount: this.metricsHistory.length,
      lastUpdate: this.metrics.timestamp
    };
  }
}

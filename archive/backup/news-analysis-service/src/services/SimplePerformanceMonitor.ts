/**
 * 性能监控服务
 * 监控系统性能指标和资源使用情况
 * 
 * 作者: AI Assistant
 * 创建时间: 2025-01-17
 * 版本: 1.0
 */

import { DatabaseConnection } from '../database/connection';
import { BaseErrorHandler } from '../utils/BaseErrorHandler';
import { SimpleMonitor } from './SimpleMonitor';

// 类型定义
interface PerformanceMetrics {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  memoryTotal: number;
  diskUsage: number;
  diskTotal: number;
  networkIn: number;
  networkOut: number;
  activeConnections: number;
  queryCount: number;
  averageQueryTime: number;
  errorRate: number;
  cacheHitRate: number;
  indexEfficiency: number;
}

interface QueryMetrics {
  query: string;
  executionTime: number;
  rowsExamined: number;
  rowsReturned: number;
  indexUsed: string | null;
  timestamp: Date;
  success: boolean;
  error?: string;
}

interface SystemAlert {
  id: string;
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'database' | 'cache';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

interface PerformanceReport {
  period: {
    start: Date;
    end: Date;
  };
  metrics: PerformanceMetrics;
  trends: {
    cpuTrend: 'up' | 'down' | 'stable';
    memoryTrend: 'up' | 'down' | 'stable';
    queryTrend: 'up' | 'down' | 'stable';
    errorTrend: 'up' | 'down' | 'stable';
  };
  alerts: SystemAlert[];
  recommendations: string[];
  healthScore: number;
}

export class SimplePerformanceMonitor {
  private db: DatabaseConnection;
  private monitor: SimpleMonitor;
  private metricsHistory: PerformanceMetrics[] = [];
  private queryMetrics: QueryMetrics[] = [];
  private alerts: SystemAlert[] = [];
  private collectionInterval: NodeJS.Timeout | null = null;
  private isCollecting: boolean = false;

  // 性能阈值配置
  private thresholds = {
    cpu: { warning: 70, critical: 90 },
    memory: { warning: 80, critical: 95 },
    disk: { warning: 85, critical: 95 },
    network: { warning: 80, critical: 95 },
    queryTime: { warning: 1000, critical: 5000 },
    errorRate: { warning: 5, critical: 10 },
    cacheHitRate: { warning: 70, critical: 50 }
  };

  constructor(db: DatabaseConnection, monitor: SimpleMonitor) {
    this.db = db;
    this.monitor = monitor;
  }

  /**
   * 开始性能监控
   */
  start(intervalMs: number = 30000): void {
    if (this.isCollecting) {
      console.log('Performance monitoring is already running');
      return;
    }

    console.log(`Starting performance monitoring with ${intervalMs}ms interval`);
    this.isCollecting = true;

    // 立即收集一次指标
    this.collectMetrics();

    // 设置定时收集
    this.collectionInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    this.monitor.recordMetric('performance_monitoring_started', 1);
  }

  /**
   * 停止性能监控
   */
  stop(): void {
    if (!this.isCollecting) {
      console.log('Performance monitoring is not running');
      return;
    }

    console.log('Stopping performance monitoring');
    this.isCollecting = false;

    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }

    this.monitor.recordMetric('performance_monitoring_stopped', 1);
  }

  /**
   * 收集性能指标
   */
  private async collectMetrics(): Promise<void> {
    try {
      const metrics: PerformanceMetrics = {
        timestamp: new Date(),
        cpuUsage: await this.getCpuUsage(),
        memoryUsage: await this.getMemoryUsage(),
        memoryTotal: await this.getTotalMemory(),
        diskUsage: await this.getDiskUsage(),
        diskTotal: await this.getTotalDisk(),
        networkIn: await this.getNetworkIn(),
        networkOut: await this.getNetworkOut(),
        activeConnections: await this.getActiveConnections(),
        queryCount: await this.getQueryCount(),
        averageQueryTime: await this.getAverageQueryTime(),
        errorRate: await this.getErrorRate(),
        cacheHitRate: await this.getCacheHitRate(),
        indexEfficiency: await this.getIndexEfficiency()
      };

      // 添加到历史记录
      this.metricsHistory.push(metrics);

      // 保持历史记录在合理范围内
      if (this.metricsHistory.length > 1000) {
        this.metricsHistory = this.metricsHistory.slice(-500);
      }

      // 检查告警
      await this.checkAlerts(metrics);

      // 记录指标到监控系统
      this.recordMetrics(metrics);

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimplePerformanceMonitor.collectMetrics');
      this.monitor.recordMetric('performance_collection_error', 1);
    }
  }

  /**
   * 获取CPU使用率
   */
  private async getCpuUsage(): Promise<number> {
    try {
      // 在实际环境中，这里会使用系统API获取真实的CPU使用率
      // 这里返回模拟数据
      return Math.random() * 100;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 获取内存使用量（MB）
   */
  private async getMemoryUsage(): Promise<number> {
    try {
      const memUsage = process.memoryUsage();
      return Math.round(memUsage.heapUsed / 1024 / 1024);
    } catch (error) {
      return 0;
    }
  }

  /**
   * 获取总内存量（MB）
   */
  private async getTotalMemory(): Promise<number> {
    try {
      const memUsage = process.memoryUsage();
      return Math.round(memUsage.heapTotal / 1024 / 1024);
    } catch (error) {
      return 0;
    }
  }

  /**
   * 获取磁盘使用量（MB）
   */
  private async getDiskUsage(): Promise<number> {
    try {
      // 在实际环境中，这里会使用系统API获取真实的磁盘使用量
      // 这里返回模拟数据
      return Math.random() * 1000;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 获取总磁盘容量（MB）
   */
  private async getTotalDisk(): Promise<number> {
    try {
      // 在实际环境中，这里会使用系统API获取真实的磁盘容量
      // 这里返回模拟数据
      return 10000;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 获取网络入流量（MB）
   */
  private async getNetworkIn(): Promise<number> {
    try {
      // 在实际环境中，这里会使用系统API获取真实的网络流量
      // 这里返回模拟数据
      return Math.random() * 100;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 获取网络出流量（MB）
   */
  private async getNetworkOut(): Promise<number> {
    try {
      // 在实际环境中，这里会使用系统API获取真实的网络流量
      // 这里返回模拟数据
      return Math.random() * 100;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 获取活跃连接数
   */
  private async getActiveConnections(): Promise<number> {
    try {
      // 在实际环境中，这里会查询数据库连接池状态
      // 这里返回模拟数据
      return Math.floor(Math.random() * 50) + 10;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 获取查询数量
   */
  private async getQueryCount(): Promise<number> {
    try {
      // 在实际环境中，这里会统计数据库查询数量
      // 这里返回模拟数据
      return Math.floor(Math.random() * 1000) + 100;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 获取平均查询时间（ms）
   */
  private async getAverageQueryTime(): Promise<number> {
    try {
      if (this.queryMetrics.length === 0) return 0;
      
      const totalTime = this.queryMetrics.reduce((sum, qm) => sum + qm.executionTime, 0);
      return totalTime / this.queryMetrics.length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 获取错误率（%）
   */
  private async getErrorRate(): Promise<number> {
    try {
      if (this.queryMetrics.length === 0) return 0;
      
      const errorCount = this.queryMetrics.filter(qm => !qm.success).length;
      return (errorCount / this.queryMetrics.length) * 100;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 获取缓存命中率（%）
   */
  private async getCacheHitRate(): Promise<number> {
    try {
      // 在实际环境中，这里会查询缓存统计信息
      // 这里返回模拟数据
      return Math.random() * 100;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 获取索引效率（%）
   */
  private async getIndexEfficiency(): Promise<number> {
    try {
      // 在实际环境中，这里会分析索引使用情况
      // 这里返回模拟数据
      return Math.random() * 100;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 记录查询指标
   */
  recordQueryMetrics(query: string, executionTime: number, rowsExamined: number, rowsReturned: number, indexUsed: string | null, success: boolean, error?: string): void {
    const queryMetric: QueryMetrics = {
      query: query.substring(0, 200), // 限制长度
      executionTime,
      rowsExamined,
      rowsReturned,
      indexUsed,
      timestamp: new Date(),
      success,
      error
    };

    this.queryMetrics.push(queryMetric);

    // 保持查询指标在合理范围内
    if (this.queryMetrics.length > 10000) {
      this.queryMetrics = this.queryMetrics.slice(-5000);
    }

    // 记录到监控系统
    this.monitor.recordMetric('query_execution_time', executionTime, {
      success: success.toString(),
      has_index: indexUsed ? 'true' : 'false'
    });

    if (!success) {
      this.monitor.recordMetric('query_execution_error', 1);
    }
  }

  /**
   * 检查告警
   */
  private async checkAlerts(metrics: PerformanceMetrics): Promise<void> {
    const alerts: SystemAlert[] = [];

    // CPU告警
    if (metrics.cpuUsage >= this.thresholds.cpu.critical) {
      alerts.push(this.createAlert('cpu', 'critical', `CPU使用率过高: ${metrics.cpuUsage.toFixed(1)}%`, metrics.cpuUsage, this.thresholds.cpu.critical));
    } else if (metrics.cpuUsage >= this.thresholds.cpu.warning) {
      alerts.push(this.createAlert('cpu', 'high', `CPU使用率较高: ${metrics.cpuUsage.toFixed(1)}%`, metrics.cpuUsage, this.thresholds.cpu.warning));
    }

    // 内存告警
    const memoryUsagePercent = (metrics.memoryUsage / metrics.memoryTotal) * 100;
    if (memoryUsagePercent >= this.thresholds.memory.critical) {
      alerts.push(this.createAlert('memory', 'critical', `内存使用率过高: ${memoryUsagePercent.toFixed(1)}%`, memoryUsagePercent, this.thresholds.memory.critical));
    } else if (memoryUsagePercent >= this.thresholds.memory.warning) {
      alerts.push(this.createAlert('memory', 'high', `内存使用率较高: ${memoryUsagePercent.toFixed(1)}%`, memoryUsagePercent, this.thresholds.memory.warning));
    }

    // 磁盘告警
    const diskUsagePercent = (metrics.diskUsage / metrics.diskTotal) * 100;
    if (diskUsagePercent >= this.thresholds.disk.critical) {
      alerts.push(this.createAlert('disk', 'critical', `磁盘使用率过高: ${diskUsagePercent.toFixed(1)}%`, diskUsagePercent, this.thresholds.disk.critical));
    } else if (diskUsagePercent >= this.thresholds.disk.warning) {
      alerts.push(this.createAlert('disk', 'high', `磁盘使用率较高: ${diskUsagePercent.toFixed(1)}%`, diskUsagePercent, this.thresholds.disk.warning));
    }

    // 查询时间告警
    if (metrics.averageQueryTime >= this.thresholds.queryTime.critical) {
      alerts.push(this.createAlert('database', 'critical', `平均查询时间过长: ${metrics.averageQueryTime.toFixed(1)}ms`, metrics.averageQueryTime, this.thresholds.queryTime.critical));
    } else if (metrics.averageQueryTime >= this.thresholds.queryTime.warning) {
      alerts.push(this.createAlert('database', 'high', `平均查询时间较长: ${metrics.averageQueryTime.toFixed(1)}ms`, metrics.averageQueryTime, this.thresholds.queryTime.warning));
    }

    // 错误率告警
    if (metrics.errorRate >= this.thresholds.errorRate.critical) {
      alerts.push(this.createAlert('database', 'critical', `错误率过高: ${metrics.errorRate.toFixed(1)}%`, metrics.errorRate, this.thresholds.errorRate.critical));
    } else if (metrics.errorRate >= this.thresholds.errorRate.warning) {
      alerts.push(this.createAlert('database', 'high', `错误率较高: ${metrics.errorRate.toFixed(1)}%`, metrics.errorRate, this.thresholds.errorRate.warning));
    }

    // 缓存命中率告警
    if (metrics.cacheHitRate <= this.thresholds.cacheHitRate.critical) {
      alerts.push(this.createAlert('cache', 'critical', `缓存命中率过低: ${metrics.cacheHitRate.toFixed(1)}%`, metrics.cacheHitRate, this.thresholds.cacheHitRate.critical));
    } else if (metrics.cacheHitRate <= this.thresholds.cacheHitRate.warning) {
      alerts.push(this.createAlert('cache', 'high', `缓存命中率较低: ${metrics.cacheHitRate.toFixed(1)}%`, metrics.cacheHitRate, this.thresholds.cacheHitRate.warning));
    }

    // 添加新告警
    for (const alert of alerts) {
      this.alerts.push(alert);
      this.monitor.recordMetric('system_alert', 1, {
        type: alert.type,
        severity: alert.severity
      });
    }

    // 保持告警历史在合理范围内
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-500);
    }
  }

  /**
   * 创建告警
   */
  private createAlert(type: string, severity: string, message: string, value: number, threshold: number): SystemAlert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type as any,
      severity: severity as any,
      message,
      value,
      threshold,
      timestamp: new Date(),
      resolved: false
    };
  }

  /**
   * 记录指标到监控系统
   */
  private recordMetrics(metrics: PerformanceMetrics): void {
    this.monitor.recordMetric('cpu_usage', metrics.cpuUsage);
    this.monitor.recordMetric('memory_usage', metrics.memoryUsage);
    this.monitor.recordMetric('disk_usage', metrics.diskUsage);
    this.monitor.recordMetric('network_in', metrics.networkIn);
    this.monitor.recordMetric('network_out', metrics.networkOut);
    this.monitor.recordMetric('active_connections', metrics.activeConnections);
    this.monitor.recordMetric('query_count', metrics.queryCount);
    this.monitor.recordMetric('average_query_time', metrics.averageQueryTime);
    this.monitor.recordMetric('error_rate', metrics.errorRate);
    this.monitor.recordMetric('cache_hit_rate', metrics.cacheHitRate);
    this.monitor.recordMetric('index_efficiency', metrics.indexEfficiency);
  }

  /**
   * 获取性能报告
   */
  async getPerformanceReport(hours: number = 24): Promise<PerformanceReport> {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);
      
      // 过滤指定时间范围内的指标
      const recentMetrics = this.metricsHistory.filter(m => m.timestamp >= startTime && m.timestamp <= endTime);
      
      if (recentMetrics.length === 0) {
        throw new Error('No metrics available for the specified period');
      }

      // 计算最新指标
      const latestMetrics = recentMetrics[recentMetrics.length - 1];

      // 计算趋势
      const trends = this.calculateTrends(recentMetrics);

      // 获取未解决的告警
      const activeAlerts = this.alerts.filter(alert => !alert.resolved);

      // 生成建议
      const recommendations = this.generateRecommendations(latestMetrics, trends, activeAlerts);

      // 计算健康分数
      const healthScore = this.calculateHealthScore(latestMetrics, activeAlerts);

      return {
        period: { start: startTime, end: endTime },
        metrics: latestMetrics,
        trends,
        alerts: activeAlerts,
        recommendations,
        healthScore
      };

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimplePerformanceMonitor.getPerformanceReport');
      throw error;
    }
  }

  /**
   * 计算趋势
   */
  private calculateTrends(metrics: PerformanceMetrics[]): any {
    if (metrics.length < 2) {
      return {
        cpuTrend: 'stable',
        memoryTrend: 'stable',
        queryTrend: 'stable',
        errorTrend: 'stable'
      };
    }

    const first = metrics[0];
    const last = metrics[metrics.length - 1];

    return {
      cpuTrend: this.calculateTrend(first.cpuUsage, last.cpuUsage),
      memoryTrend: this.calculateTrend(first.memoryUsage, last.memoryUsage),
      queryTrend: this.calculateTrend(first.averageQueryTime, last.averageQueryTime),
      errorTrend: this.calculateTrend(first.errorRate, last.errorRate)
    };
  }

  /**
   * 计算单个趋势
   */
  private calculateTrend(first: number, last: number): 'up' | 'down' | 'stable' {
    const change = last - first;
    const threshold = first * 0.1; // 10%变化阈值

    if (change > threshold) return 'up';
    if (change < -threshold) return 'down';
    return 'stable';
  }

  /**
   * 生成建议
   */
  private generateRecommendations(metrics: PerformanceMetrics, trends: any, alerts: SystemAlert[]): string[] {
    const recommendations: string[] = [];

    // CPU相关建议
    if (metrics.cpuUsage > 80) {
      recommendations.push('CPU使用率过高，建议优化查询或增加服务器资源');
    }

    // 内存相关建议
    const memoryUsagePercent = (metrics.memoryUsage / metrics.memoryTotal) * 100;
    if (memoryUsagePercent > 80) {
      recommendations.push('内存使用率过高，建议优化内存使用或增加内存容量');
    }

    // 查询性能建议
    if (metrics.averageQueryTime > 1000) {
      recommendations.push('查询性能较差，建议优化查询语句或添加索引');
    }

    // 缓存建议
    if (metrics.cacheHitRate < 70) {
      recommendations.push('缓存命中率较低，建议优化缓存策略或增加缓存容量');
    }

    // 索引建议
    if (metrics.indexEfficiency < 80) {
      recommendations.push('索引效率较低，建议优化索引设计');
    }

    return recommendations;
  }

  /**
   * 计算健康分数
   */
  private calculateHealthScore(metrics: PerformanceMetrics, alerts: SystemAlert[]): number {
    let score = 100;

    // 根据指标扣分
    if (metrics.cpuUsage > 90) score -= 20;
    else if (metrics.cpuUsage > 70) score -= 10;

    const memoryUsagePercent = (metrics.memoryUsage / metrics.memoryTotal) * 100;
    if (memoryUsagePercent > 95) score -= 20;
    else if (memoryUsagePercent > 80) score -= 10;

    if (metrics.averageQueryTime > 5000) score -= 15;
    else if (metrics.averageQueryTime > 1000) score -= 5;

    if (metrics.errorRate > 10) score -= 20;
    else if (metrics.errorRate > 5) score -= 10;

    if (metrics.cacheHitRate < 50) score -= 15;
    else if (metrics.cacheHitRate < 70) score -= 5;

    // 根据告警扣分
    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical').length;
    const highAlerts = alerts.filter(alert => alert.severity === 'high').length;

    score -= criticalAlerts * 10;
    score -= highAlerts * 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 获取当前指标
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metricsHistory.length > 0 ? this.metricsHistory[this.metricsHistory.length - 1] : null;
  }

  /**
   * 获取告警列表
   */
  getAlerts(resolved: boolean = false): SystemAlert[] {
    return this.alerts.filter(alert => alert.resolved === resolved);
  }

  /**
   * 解决告警
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * 清理历史数据
   */
  cleanupHistory(daysToKeep: number = 7): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    this.metricsHistory = this.metricsHistory.filter(m => m.timestamp > cutoffDate);
    this.queryMetrics = this.queryMetrics.filter(q => q.timestamp > cutoffDate);
    this.alerts = this.alerts.filter(a => a.timestamp > cutoffDate);

    console.log(`Cleaned up performance history older than ${daysToKeep} days`);
  }
}

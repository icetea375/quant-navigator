/**
 * MonitoringSystem - 统一监控和指标收集系统
 * 消除监控代码重复，提供统一的监控机制
 */

import { DatabaseConnection } from '../database/connection';
import { Redis } from 'ioredis';
import { logger } from '../utils/logger';

export interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags: { [key: string]: string };
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
}

export interface ServiceHealth {
  serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  metrics: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
  details: {
    lastError?: string;
    dependencies: { [key: string]: 'up' | 'down' };
  };
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldown: number; // 秒
  lastTriggered?: number;
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  serviceName: string;
  resolved: boolean;
  resolvedAt?: number;
}

export class MonitoringSystem {
  private static instance: MonitoringSystem;
  private db: DatabaseConnection;
  private redis: Redis;
  private metrics: Map<string, MetricData[]> = new Map();
  private healthChecks: Map<string, ServiceHealth> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private isRunning: boolean = false;

  private constructor(db: DatabaseConnection, redis: Redis) {
    this.db = db;
    this.redis = redis;
  }

  public static getInstance(db: DatabaseConnection, redis: Redis): MonitoringSystem {
    if (!MonitoringSystem.instance) {
      MonitoringSystem.instance = new MonitoringSystem(db, redis);
    }
    return MonitoringSystem.instance;
  }

  /**
   * 启动监控系统
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    try {
      logger.info('Starting monitoring system...');

      // 初始化数据库表
      await this.initializeDatabase();

      // 加载告警规则
      await this.loadAlertRules();

      // 启动定期任务
      this.startPeriodicTasks();

      this.isRunning = true;
      logger.info('Monitoring system started successfully');
    } catch (error) {
      logger.error('Failed to start monitoring system:', error);
      throw error;
    }
  }

  /**
   * 停止监控系统
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      logger.info('Stopping monitoring system...');
      this.isRunning = false;
      logger.info('Monitoring system stopped');
    } catch (error) {
      logger.error('Failed to stop monitoring system:', error);
      throw error;
    }
  }

  /**
   * 记录指标
   */
  public recordMetric(metric: MetricData): void {
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }

    this.metrics.get(metric.name)!.push(metric);

    // 检查告警规则
    this.checkAlertRules(metric);

    logger.debug(`Metric recorded: ${metric.name} = ${metric.value}`);
  }

  /**
   * 记录计数器指标
   */
  public incrementCounter(name: string, value: number = 1, tags: { [key: string]: string } = {}): void {
    this.recordMetric({
      name,
      value,
      timestamp: Date.now(),
      tags,
      type: 'counter'
    });
  }

  /**
   * 记录仪表盘指标
   */
  public setGauge(name: string, value: number, tags: { [key: string]: string } = {}): void {
    this.recordMetric({
      name,
      value,
      timestamp: Date.now(),
      tags,
      type: 'gauge'
    });
  }

  /**
   * 记录直方图指标
   */
  public recordHistogram(name: string, value: number, tags: { [key: string]: string } = {}): void {
    this.recordMetric({
      name,
      value,
      timestamp: Date.now(),
      tags,
      type: 'histogram'
    });
  }

  /**
   * 更新服务健康状态
   */
  public updateServiceHealth(serviceName: string, health: ServiceHealth): void {
    this.healthChecks.set(serviceName, health);

    // 记录健康指标
    this.setGauge('service_health', health.status === 'healthy' ? 1 : 0, { service: serviceName });
    this.setGauge('service_response_time', health.metrics.responseTime, { service: serviceName });
    this.setGauge('service_error_rate', health.metrics.errorRate, { service: serviceName });
    this.setGauge('service_throughput', health.metrics.throughput, { service: serviceName });
  }

  /**
   * 获取服务健康状态
   */
  public getServiceHealth(serviceName: string): ServiceHealth | undefined {
    return this.healthChecks.get(serviceName);
  }

  /**
   * 获取所有服务健康状态
   */
  public getAllServiceHealth(): ServiceHealth[] {
    return Array.from(this.healthChecks.values());
  }

  /**
   * 获取指标数据
   */
  public getMetrics(name?: string, timeRange?: { start: number; end: number }): MetricData[] {
    if (name) {
      const metrics = this.metrics.get(name) || [];
      return timeRange ?
        metrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end) :
        metrics;
    }

    const allMetrics: MetricData[] = [];
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics);
    }

    return timeRange ?
      allMetrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end) :
      allMetrics;
  }

  /**
   * 添加告警规则
   */
  public addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    logger.info(`Alert rule added: ${rule.name}`);
  }

  /**
   * 检查告警规则
   */
  private checkAlertRules(metric: MetricData): void {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      // 检查冷却期
      if (rule.lastTriggered && Date.now() - rule.lastTriggered < rule.cooldown * 1000) {
        continue;
      }

      // 检查条件
      if (this.evaluateCondition(rule.condition, metric)) {
        this.triggerAlert(rule, metric);
      }
    }
  }

  /**
   * 评估告警条件
   */
  private evaluateCondition(condition: string, metric: MetricData): boolean {
    // 简单的条件评估，实际项目中可以使用更复杂的表达式引擎
    const conditions = condition.split(' ');
    if (conditions.length !== 3) return false;

    const [field, operator, threshold] = conditions;
    const value = field === 'value' ? metric.value : metric.tags[field];

    if (value === undefined) return false;

    const numValue = parseFloat(value);
    const numThreshold = parseFloat(threshold);

    switch (operator) {
      case '>': return numValue > numThreshold;
      case '>=': return numValue >= numThreshold;
      case '<': return numValue < numThreshold;
      case '<=': return numValue <= numThreshold;
      case '==': return numValue === numThreshold;
      case '!=': return numValue !== numThreshold;
      default: return false;
    }
  }

  /**
   * 触发告警
   */
  private triggerAlert(rule: AlertRule, metric: MetricData): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      severity: rule.severity,
      message: `Alert triggered: ${rule.name} - ${metric.name} = ${metric.value}`,
      timestamp: Date.now(),
      serviceName: metric.tags.service || 'unknown',
      resolved: false
    };

    this.alerts.set(alert.id, alert);
    rule.lastTriggered = Date.now();

    logger.warn(`Alert triggered: ${alert.message}`);

    // 这里可以添加告警通知逻辑，如发送邮件、短信等
  }

  /**
   * 获取告警列表
   */
  public getAlerts(resolved?: boolean): Alert[] {
    const alerts = Array.from(this.alerts.values());
    return resolved !== undefined ? alerts.filter(a => a.resolved === resolved) : alerts;
  }

  /**
   * 解决告警
   */
  public resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      logger.info(`Alert resolved: ${alertId}`);
    }
  }

  /**
   * 初始化数据库
   */
  private async initializeDatabase(): Promise<void> {
    // 创建指标表
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS metrics (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        value DECIMAL(20,6) NOT NULL,
        timestamp BIGINT NOT NULL,
        tags JSONB,
        type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建告警表
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id VARCHAR(255) PRIMARY KEY,
        rule_id VARCHAR(255) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        timestamp BIGINT NOT NULL,
        service_name VARCHAR(255) NOT NULL,
        resolved BOOLEAN DEFAULT FALSE,
        resolved_at BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  /**
   * 加载告警规则
   */
  private async loadAlertRules(): Promise<void> {
    // 默认告警规则
    const defaultRules: AlertRule[] = [
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: 'value > 0.1',
        threshold: 0.1,
        severity: 'high',
        enabled: true,
        cooldown: 300
      },
      {
        id: 'high_response_time',
        name: 'High Response Time',
        condition: 'value > 5000',
        threshold: 5000,
        severity: 'medium',
        enabled: true,
        cooldown: 600
      }
    ];

    for (const rule of defaultRules) {
      this.alertRules.set(rule.id, rule);
    }
  }

  /**
   * 启动定期任务
   */
  private startPeriodicTasks(): void {
    // 每5分钟保存指标到数据库
    setInterval(async () => {
      await this.saveMetricsToDatabase();
    }, 5 * 60 * 1000);

    // 每1分钟检查服务健康状态
    setInterval(async () => {
      await this.checkServiceHealth();
    }, 60 * 1000);
  }

  /**
   * 保存指标到数据库
   */
  private async saveMetricsToDatabase(): Promise<void> {
    try {
      const allMetrics = this.getMetrics();
      if (allMetrics.length === 0) return;

      const values = allMetrics.map(metric =>
        `('${metric.name}', ${metric.value}, ${metric.timestamp}, '${JSON.stringify(metric.tags)}', '${metric.type}')`
      ).join(',');

      await this.db.query(`
        INSERT INTO metrics (name, value, timestamp, tags, type)
        VALUES ${values}
      `);

      // 清空内存中的指标
      this.metrics.clear();

      logger.debug(`Saved ${allMetrics.length} metrics to database`);
    } catch (error) {
      logger.error('Failed to save metrics to database:', error);
    }
  }

  /**
   * 检查服务健康状态
   */
  private async checkServiceHealth(): Promise<void> {
    // 这里可以添加具体的健康检查逻辑
    logger.debug('Checking service health...');
  }
}

export default MonitoringSystem;

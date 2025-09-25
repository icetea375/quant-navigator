/**
 * 成本控制管理器
 * 实现成本控制和预算管理机制
 */

import { tokenCalculator } from './TokenCalculator';
import { roundConfigManager } from './RoundConfigManager';
import { qualityAssessmentManager } from './QualityAssessmentManager';

export interface BudgetConfig {
  dailyLimit: number; // 每日成本限制（元）
  monthlyLimit: number; // 每月成本限制（元）
  taskTypeLimits: Record<string, number>; // 各任务类型成本限制
  alertThreshold: number; // 告警阈值（0-1）
  emergencyThreshold: number; // 紧急阈值（0-1）
}

export interface CostRecord {
  taskId: string;
  taskType: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  timestamp: number;
  qualityScore?: number;
}

export interface CostStatistics {
  period: 'daily' | 'weekly' | 'monthly';
  totalCost: number;
  totalTasks: number;
  avgCostPerTask: number;
  costByTaskType: Record<string, number>;
  costByModel: Record<string, number>;
  costByProvider: Record<string, number>;
  peakHour: number;
  avgCostPerHour: number;
}

export interface CostAlert {
  type: 'warning' | 'critical' | 'emergency';
  message: string;
  currentCost: number;
  limit: number;
  percentage: number;
  timestamp: number;
}

export interface CostOptimization {
  strategy: 'model_selection' | 'round_reduction' | 'batch_processing' | 'quality_adjustment';
  description: string;
  potentialSavings: number;
  impact: 'low' | 'medium' | 'high';
  implementation: string[];
}

/**
 * 成本控制管理器类
 */
export class CostControlManager {
  private budgetConfig: BudgetConfig;
  private costRecords: CostRecord[] = [];
  private alerts: CostAlert[] = [];
  private dailyCosts: Map<string, number> = new Map(); // 日期 -> 成本
  private monthlyCosts: Map<string, number> = new Map(); // 年月 -> 成本

  constructor() {
    this.budgetConfig = this.initializeBudgetConfig();
  }

  /**
   * 初始化预算配置
   */
  private initializeBudgetConfig(): BudgetConfig {
    return {
      dailyLimit: 10.0, // 每日10元
      monthlyLimit: 300.0, // 每月300元
      taskTypeLimits: {
        'news_importance': 2.0,
        'timeline_build': 5.0,
        'historical_attribution': 8.0,
        'model_adjustment': 3.0
      },
      alertThreshold: 0.8, // 80%时告警
      emergencyThreshold: 0.95 // 95%时紧急告警
    };
  }

  /**
   * 记录成本
   */
  recordCost(
    taskId: string,
    taskType: string,
    model: string,
    provider: string,
    inputTokens: number,
    outputTokens: number,
    qualityScore?: number
  ): void {
    const totalTokens = inputTokens + outputTokens;
    const cost = tokenCalculator.estimateTokensForTask(
      taskType,
      model,
      provider,
      1, // 默认1轮
      'medium'
    ).cost;

    const record: CostRecord = {
      taskId,
      taskType,
      model,
      provider,
      inputTokens,
      outputTokens,
      totalTokens,
      cost,
      timestamp: Date.now(),
      qualityScore
    };

    this.costRecords.push(record);
    this.updateDailyCosts(record);
    this.checkBudgetLimits();
  }

  /**
   * 更新每日成本
   */
  private updateDailyCosts(record: CostRecord): void {
    const date = new Date(record.timestamp).toISOString().split('T')[0];
    const currentCost = this.dailyCosts.get(date) || 0;
    this.dailyCosts.set(date, currentCost + record.cost);

    // 更新每月成本
    const monthKey = date.substring(0, 7); // YYYY-MM
    const currentMonthCost = this.monthlyCosts.get(monthKey) || 0;
    this.monthlyCosts.set(monthKey, currentMonthCost + record.cost);
  }

  /**
   * 检查预算限制
   */
  private checkBudgetLimits(): void {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7);
    
    const dailyCost = this.dailyCosts.get(today) || 0;
    const monthlyCost = this.monthlyCosts.get(currentMonth) || 0;

    // 检查每日限制
    this.checkDailyLimit(dailyCost);
    
    // 检查每月限制
    this.checkMonthlyLimit(monthlyCost);
    
    // 检查任务类型限制
    this.checkTaskTypeLimits();
  }

  /**
   * 检查每日限制
   */
  private checkDailyLimit(dailyCost: number): void {
    const percentage = dailyCost / this.budgetConfig.dailyLimit;
    
    if (percentage >= this.budgetConfig.emergencyThreshold) {
      this.addAlert({
        type: 'emergency',
        message: `每日成本已达到紧急阈值！当前: ${dailyCost.toFixed(4)}元, 限制: ${this.budgetConfig.dailyLimit}元`,
        currentCost: dailyCost,
        limit: this.budgetConfig.dailyLimit,
        percentage,
        timestamp: Date.now()
      });
    } else if (percentage >= this.budgetConfig.alertThreshold) {
      this.addAlert({
        type: 'warning',
        message: `每日成本接近限制！当前: ${dailyCost.toFixed(4)}元, 限制: ${this.budgetConfig.dailyLimit}元`,
        currentCost: dailyCost,
        limit: this.budgetConfig.dailyLimit,
        percentage,
        timestamp: Date.now()
      });
    }
  }

  /**
   * 检查每月限制
   */
  private checkMonthlyLimit(monthlyCost: number): void {
    const percentage = monthlyCost / this.budgetConfig.monthlyLimit;
    
    if (percentage >= this.budgetConfig.emergencyThreshold) {
      this.addAlert({
        type: 'emergency',
        message: `每月成本已达到紧急阈值！当前: ${monthlyCost.toFixed(4)}元, 限制: ${this.budgetConfig.monthlyLimit}元`,
        currentCost: monthlyCost,
        limit: this.budgetConfig.monthlyLimit,
        percentage,
        timestamp: Date.now()
      });
    } else if (percentage >= this.budgetConfig.alertThreshold) {
      this.addAlert({
        type: 'warning',
        message: `每月成本接近限制！当前: ${monthlyCost.toFixed(4)}元, 限制: ${this.budgetConfig.monthlyLimit}元`,
        currentCost: monthlyCost,
        limit: this.budgetConfig.monthlyLimit,
        percentage,
        timestamp: Date.now()
      });
    }
  }

  /**
   * 检查任务类型限制
   */
  private checkTaskTypeLimits(): void {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = this.costRecords.filter(r => 
      new Date(r.timestamp).toISOString().split('T')[0] === today
    );

    const costByTaskType: Record<string, number> = {};
    todayRecords.forEach(record => {
      costByTaskType[record.taskType] = (costByTaskType[record.taskType] || 0) + record.cost;
    });

    Object.entries(costByTaskType).forEach(([taskType, cost]) => {
      const limit = this.budgetConfig.taskTypeLimits[taskType];
      if (limit && cost >= limit) {
        this.addAlert({
          type: 'critical',
          message: `${taskType} 任务类型成本已超限！当前: ${cost.toFixed(4)}元, 限制: ${limit}元`,
          currentCost: cost,
          limit,
          percentage: cost / limit,
          timestamp: Date.now()
        });
      }
    });
  }

  /**
   * 添加告警
   */
  private addAlert(alert: CostAlert): void {
    this.alerts.push(alert);
    console.warn(`🚨 成本告警: ${alert.message}`);
  }

  /**
   * 获取成本统计
   */
  getCostStatistics(period: 'daily' | 'weekly' | 'monthly'): CostStatistics {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
    }

    const records = this.costRecords.filter(r => {
      const recordDate = new Date(r.timestamp);
      return recordDate >= startDate && recordDate < endDate;
    });

    const totalCost = records.reduce((sum, r) => sum + r.cost, 0);
    const totalTasks = records.length;
    const avgCostPerTask = totalTasks > 0 ? totalCost / totalTasks : 0;

    // 按任务类型统计
    const costByTaskType: Record<string, number> = {};
    records.forEach(r => {
      costByTaskType[r.taskType] = (costByTaskType[r.taskType] || 0) + r.cost;
    });

    // 按模型统计
    const costByModel: Record<string, number> = {};
    records.forEach(r => {
      const modelKey = `${r.provider}/${r.model}`;
      costByModel[modelKey] = (costByModel[modelKey] || 0) + r.cost;
    });

    // 按提供商统计
    const costByProvider: Record<string, number> = {};
    records.forEach(r => {
      costByProvider[r.provider] = (costByProvider[r.provider] || 0) + r.cost;
    });

    // 计算峰值小时
    const hourlyCosts: Record<number, number> = {};
    records.forEach(r => {
      const hour = new Date(r.timestamp).getHours();
      hourlyCosts[hour] = (hourlyCosts[hour] || 0) + r.cost;
    });
    const peakHour = Object.entries(hourlyCosts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '0';

    const avgCostPerHour = totalCost / (period === 'daily' ? 24 : period === 'weekly' ? 168 : 720);

    return {
      period,
      totalCost,
      totalTasks,
      avgCostPerTask,
      costByTaskType,
      costByModel,
      costByProvider,
      peakHour: parseInt(peakHour),
      avgCostPerHour
    };
  }

  /**
   * 获取成本优化建议
   */
  getCostOptimizationSuggestions(): CostOptimization[] {
    const suggestions: CostOptimization[] = [];
    const dailyStats = this.getCostStatistics('daily');
    const monthlyStats = this.getCostStatistics('monthly');

    // 模型选择优化
    const expensiveModels = Object.entries(dailyStats.costByModel)
      .filter(([, cost]) => cost > dailyStats.avgCostPerTask * 2)
      .sort(([,a], [,b]) => b - a);

    if (expensiveModels.length > 0) {
      suggestions.push({
        strategy: 'model_selection',
        description: '发现使用昂贵模型的任务，建议切换到更经济的模型',
        potentialSavings: expensiveModels.reduce((sum, [, cost]) => sum + cost * 0.3, 0),
        impact: 'high',
        implementation: [
          '分析当前模型使用情况',
          '识别可替换的昂贵模型',
          '实施模型选择策略',
          '监控成本变化'
        ]
      });
    }

    // 轮数减少优化
    const highRoundTasks = this.costRecords.filter(r => 
      r.totalTokens > 5000 && r.qualityScore && r.qualityScore > 0.8
    );

    if (highRoundTasks.length > 0) {
      suggestions.push({
        strategy: 'round_reduction',
        description: '发现高质量但高轮数的任务，可适当减少轮数',
        potentialSavings: highRoundTasks.reduce((sum, r) => sum + r.cost * 0.2, 0),
        impact: 'medium',
        implementation: [
          '分析任务质量与轮数的关系',
          '调整轮数配置',
          '实施动态轮数调整',
          '监控质量变化'
        ]
      });
    }

    // 批量处理优化
    const similarTasks = this.groupSimilarTasks();
    if (similarTasks.length > 0) {
      suggestions.push({
        strategy: 'batch_processing',
        description: '发现相似任务，可进行批量处理以降低成本',
        potentialSavings: similarTasks.reduce((sum, group) => sum + group.reduce((s, r) => s + r.cost, 0) * 0.4, 0),
        impact: 'high',
        implementation: [
          '识别相似任务模式',
          '设计批量处理策略',
          '实施批量处理机制',
          '优化资源利用'
        ]
      });
    }

    // 质量调整优化
    const lowQualityTasks = this.costRecords.filter(r => 
      r.qualityScore && r.qualityScore < 0.6
    );

    if (lowQualityTasks.length > 0) {
      suggestions.push({
        strategy: 'quality_adjustment',
        description: '发现低质量任务，建议调整质量要求以平衡成本',
        potentialSavings: lowQualityTasks.reduce((sum, r) => sum + r.cost * 0.3, 0),
        impact: 'low',
        implementation: [
          '分析质量与成本的关系',
          '调整质量评估策略',
          '实施分层质量要求',
          '优化资源配置'
        ]
      });
    }

    return suggestions;
  }

  /**
   * 分组相似任务
   */
  private groupSimilarTasks(): CostRecord[][] {
    const groups: CostRecord[][] = [];
    const processed = new Set<string>();

    this.costRecords.forEach(record => {
      if (processed.has(record.taskId)) return;

      const similar = this.costRecords.filter(r => 
        r.taskType === record.taskType &&
        r.provider === record.provider &&
        r.model === record.model &&
        Math.abs(r.totalTokens - record.totalTokens) < 1000 &&
        !processed.has(r.taskId)
      );

      if (similar.length > 1) {
        groups.push(similar);
        similar.forEach(r => processed.add(r.taskId));
      }
    });

    return groups;
  }

  /**
   * 更新预算配置
   */
  updateBudgetConfig(updates: Partial<BudgetConfig>): void {
    this.budgetConfig = { ...this.budgetConfig, ...updates };
  }

  /**
   * 获取当前预算状态
   */
  getBudgetStatus(): {
    daily: { current: number; limit: number; percentage: number };
    monthly: { current: number; limit: number; percentage: number };
    taskTypes: Record<string, { current: number; limit: number; percentage: number }>;
  } {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7);
    
    const dailyCost = this.dailyCosts.get(today) || 0;
    const monthlyCost = this.monthlyCosts.get(currentMonth) || 0;

    const taskTypeStatus: Record<string, { current: number; limit: number; percentage: number }> = {};
    Object.keys(this.budgetConfig.taskTypeLimits).forEach(taskType => {
      const todayRecords = this.costRecords.filter(r => 
        r.taskType === taskType && 
        new Date(r.timestamp).toISOString().split('T')[0] === today
      );
      const current = todayRecords.reduce((sum, r) => sum + r.cost, 0);
      const limit = this.budgetConfig.taskTypeLimits[taskType];
      taskTypeStatus[taskType] = {
        current,
        limit,
        percentage: limit > 0 ? current / limit : 0
      };
    });

    return {
      daily: {
        current: dailyCost,
        limit: this.budgetConfig.dailyLimit,
        percentage: dailyCost / this.budgetConfig.dailyLimit
      },
      monthly: {
        current: monthlyCost,
        limit: this.budgetConfig.monthlyLimit,
        percentage: monthlyCost / this.budgetConfig.monthlyLimit
      },
      taskTypes: taskTypeStatus
    };
  }

  /**
   * 获取告警列表
   */
  getAlerts(limit: number = 50): CostAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * 生成成本报告
   */
  generateCostReport(): string {
    const dailyStats = this.getCostStatistics('daily');
    const monthlyStats = this.getCostStatistics('monthly');
    const budgetStatus = this.getBudgetStatus();
    const suggestions = this.getCostOptimizationSuggestions();

    let report = '# 成本控制报告\n\n';
    report += `**生成时间**: ${new Date().toLocaleString()}\n\n`;

    report += '## 预算状态\n\n';
    report += `### 每日预算\n`;
    report += `- 当前成本: ${budgetStatus.daily.current.toFixed(4)}元\n`;
    report += `- 预算限制: ${budgetStatus.daily.limit}元\n`;
    report += `- 使用率: ${(budgetStatus.daily.percentage * 100).toFixed(1)}%\n\n`;

    report += `### 每月预算\n`;
    report += `- 当前成本: ${budgetStatus.monthly.current.toFixed(4)}元\n`;
    report += `- 预算限制: ${budgetStatus.monthly.limit}元\n`;
    report += `- 使用率: ${(budgetStatus.monthly.percentage * 100).toFixed(1)}%\n\n`;

    report += '## 成本统计\n\n';
    report += '### 每日统计\n';
    report += `- 总成本: ${dailyStats.totalCost.toFixed(4)}元\n`;
    report += `- 总任务数: ${dailyStats.totalTasks}\n`;
    report += `- 平均成本/任务: ${dailyStats.avgCostPerTask.toFixed(4)}元\n`;
    report += `- 峰值小时: ${dailyStats.peakHour}点\n\n`;

    report += '### 按任务类型统计\n';
    report += '| 任务类型 | 成本(元) | 占比 |\n';
    report += '|----------|----------|------|\n';
    Object.entries(dailyStats.costByTaskType).forEach(([taskType, cost]) => {
      const percentage = (cost / dailyStats.totalCost * 100).toFixed(1);
      report += `| ${taskType} | ${cost.toFixed(4)} | ${percentage}% |\n`;
    });

    report += '\n### 按模型统计\n';
    report += '| 模型 | 成本(元) | 占比 |\n';
    report += '|------|----------|------|\n';
    Object.entries(dailyStats.costByModel).forEach(([model, cost]) => {
      const percentage = (cost / dailyStats.totalCost * 100).toFixed(1);
      report += `| ${model} | ${cost.toFixed(4)} | ${percentage}% |\n`;
    });

    report += '\n## 优化建议\n\n';
    suggestions.forEach((suggestion, index) => {
      report += `### ${index + 1}. ${suggestion.description}\n`;
      report += `- 策略: ${suggestion.strategy}\n`;
      report += `- 潜在节省: ${suggestion.potentialSavings.toFixed(4)}元\n`;
      report += `- 影响程度: ${suggestion.impact}\n`;
      report += `- 实施步骤:\n`;
      suggestion.implementation.forEach(step => {
        report += `  - ${step}\n`;
      });
      report += '\n';
    });

    return report;
  }
}

// 导出单例实例
export const costControlManager = new CostControlManager();

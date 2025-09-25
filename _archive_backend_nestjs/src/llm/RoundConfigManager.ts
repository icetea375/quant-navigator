/**
 * 轮数配置管理器
 * 替换复杂度估计，直接使用轮数配置
 */

export interface RoundConfig {
  taskType: string;
  minRounds: number;
  maxRounds: number;
  defaultRounds: number;
  qualityThreshold: number;
  costLimit: number; // 元
  description: string;
  // 深度思考相关参数
  thinkingDepth?: 'shallow' | 'medium' | 'deep' | 'deepest';
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface TaskRoundRecommendation {
  taskType: string;
  recommendedRounds: number;
  reason: string;
  estimatedCost: number;
  qualityLevel: 'basic' | 'standard' | 'high' | 'premium';
  // 深度思考相关参数
  thinkingDepth?: 'shallow' | 'medium' | 'deep' | 'deepest';
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  timeout?: number;
}

/**
 * 轮数配置管理器类
 */
export class RoundConfigManager {
  private configs: Map<string, RoundConfig> = new Map();
  private historicalData: Map<string, { rounds: number; quality: number; cost: number }[]> = new Map();

  constructor() {
    this.initializeDefaultConfigs();
  }

  /**
   * 初始化默认配置
   */
  private initializeDefaultConfigs(): void {
    const defaultConfigs: RoundConfig[] = [
      {
        taskType: 'news_importance',
        minRounds: 1,
        maxRounds: 2,
        defaultRounds: 1,
        qualityThreshold: 0.7,
        costLimit: 0.01,
        description: '新闻重要性评估，快速筛选重要新闻',
        thinkingDepth: 'medium',
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 2000,
        timeout: 60000
      },
      {
        taskType: 'timeline_build',
        minRounds: 2,
        maxRounds: 4,
        defaultRounds: 3,
        qualityThreshold: 0.8,
        costLimit: 0.05,
        description: '时间线构建，需要多轮分析确保准确性',
        thinkingDepth: 'deep',
        temperature: 0.6,
        topP: 0.8,
        maxTokens: 3000,
        timeout: 90000
      },
      {
        taskType: 'historical_attribution',
        minRounds: 2,
        maxRounds: 5,
        defaultRounds: 3,
        qualityThreshold: 0.85,
        costLimit: 0.1,
        description: '历史归因分析，复杂任务需要多轮深度分析',
        thinkingDepth: 'deepest',
        temperature: 0.5,
        topP: 0.7,
        maxTokens: 4000,
        timeout: 120000
      },
      {
        taskType: 'model_adjustment',
        minRounds: 2,
        maxRounds: 3,
        defaultRounds: 2,
        qualityThreshold: 0.8,
        costLimit: 0.03,
        description: '模型调整，需要平衡效果和成本',
        thinkingDepth: 'deep',
        temperature: 0.8,
        topP: 0.9,
        maxTokens: 3000,
        timeout: 60000
      }
    ];

    defaultConfigs.forEach(config => {
      this.configs.set(config.taskType, config);
    });
  }

  /**
   * 获取任务类型的轮数配置
   */
  getRoundConfig(taskType: string): RoundConfig | null {
    return this.configs.get(taskType) || null;
  }

  /**
   * 获取推荐的轮数
   */
  getRecommendedRounds(
    taskType: string,
    qualityRequirement: 'basic' | 'standard' | 'high' | 'premium' = 'standard',
    costConstraint?: number
  ): TaskRoundRecommendation {
    const config = this.getRoundConfig(taskType);
    if (!config) {
      throw new Error(`未找到任务类型 ${taskType} 的配置`);
    }

    let recommendedRounds = config.defaultRounds;
    let reason = '使用默认配置';
    let qualityLevel: 'basic' | 'standard' | 'high' | 'premium' = 'standard';

    // 根据质量要求调整轮数
    switch (qualityRequirement) {
      case 'basic':
        recommendedRounds = config.minRounds;
        reason = '基础质量要求，使用最少轮数';
        qualityLevel = 'basic';
        break;
      case 'standard':
        recommendedRounds = config.defaultRounds;
        reason = '标准质量要求，使用默认轮数';
        qualityLevel = 'standard';
        break;
      case 'high':
        recommendedRounds = Math.min(config.maxRounds, config.defaultRounds + 1);
        reason = '高质量要求，增加轮数';
        qualityLevel = 'high';
        break;
      case 'premium':
        recommendedRounds = config.maxRounds;
        reason = '最高质量要求，使用最大轮数';
        qualityLevel = 'premium';
        break;
    }

    // 根据成本约束调整轮数
    if (costConstraint && costConstraint < config.costLimit) {
      const costPerRound = config.costLimit / config.defaultRounds;
      const maxRoundsByCost = Math.floor(costConstraint / costPerRound);
      if (maxRoundsByCost < recommendedRounds) {
        recommendedRounds = Math.max(config.minRounds, maxRoundsByCost);
        reason = `成本约束，调整为 ${recommendedRounds} 轮`;
      }
    }

    // 基于历史数据调整
    const historicalAdjustment = this.getHistoricalAdjustment(taskType, recommendedRounds);
    if (historicalAdjustment) {
      recommendedRounds = historicalAdjustment.recommendedRounds;
      reason = historicalAdjustment.reason;
    }

    // 估算成本（这里需要集成Token计算器）
    const estimatedCost = this.estimateCostForRounds(taskType, recommendedRounds);

    return {
      taskType,
      recommendedRounds,
      reason,
      estimatedCost,
      qualityLevel,
      thinkingDepth: config.thinkingDepth,
      temperature: config.temperature,
      topP: config.topP,
      maxTokens: config.maxTokens,
      timeout: config.timeout
    };
  }

  /**
   * 记录任务执行结果
   */
  recordTaskResult(
    taskType: string,
    rounds: number,
    quality: number,
    cost: number
  ): void {
    if (!this.historicalData.has(taskType)) {
      this.historicalData.set(taskType, []);
    }

    const data = this.historicalData.get(taskType)!;
    data.push({ rounds, quality, cost });

    // 保持最近100条记录
    if (data.length > 100) {
      data.splice(0, data.length - 100);
    }
  }

  /**
   * 更新轮数配置
   */
  updateRoundConfig(
    taskType: string,
    updates: Partial<RoundConfig>
  ): void {
    const existing = this.configs.get(taskType);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.configs.set(taskType, updated);
    } else {
      throw new Error(`任务类型 ${taskType} 不存在`);
    }
  }

  /**
   * 获取所有配置
   */
  getAllConfigs(): RoundConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * 获取历史数据统计
   */
  getHistoricalStats(taskType: string): {
    totalTasks: number;
    avgRounds: number;
    avgQuality: number;
    avgCost: number;
    roundsDistribution: Record<number, number>;
  } | null {
    const data = this.historicalData.get(taskType);
    if (!data || data.length === 0) {
      return null;
    }

    const totalTasks = data.length;
    const avgRounds = data.reduce((sum, d) => sum + d.rounds, 0) / totalTasks;
    const avgQuality = data.reduce((sum, d) => sum + d.quality, 0) / totalTasks;
    const avgCost = data.reduce((sum, d) => sum + d.cost, 0) / totalTasks;

    const roundsDistribution: Record<number, number> = {};
    data.forEach(d => {
      roundsDistribution[d.rounds] = (roundsDistribution[d.rounds] || 0) + 1;
    });

    return {
      totalTasks,
      avgRounds,
      avgQuality,
      avgCost,
      roundsDistribution
    };
  }

  /**
   * 基于历史数据调整轮数建议
   */
  private getHistoricalAdjustment(
    taskType: string,
    currentRounds: number
  ): { recommendedRounds: number; reason: string } | null {
    const stats = this.getHistoricalStats(taskType);
    if (!stats || stats.totalTasks < 10) {
      return null;
    }

    // 如果平均质量低于阈值，建议增加轮数
    const config = this.getRoundConfig(taskType);
    if (config && stats.avgQuality < config.qualityThreshold) {
      const recommendedRounds = Math.min(config.maxRounds, currentRounds + 1);
      return {
        recommendedRounds,
        reason: `历史质量较低(${(stats.avgQuality * 100).toFixed(1)}%)，建议增加轮数`
      };
    }

    // 如果质量很好但轮数较多，建议减少轮数
    if (stats.avgQuality > config!.qualityThreshold + 0.1 && currentRounds > config!.minRounds) {
      const recommendedRounds = Math.max(config!.minRounds, currentRounds - 1);
      return {
        recommendedRounds,
        reason: `历史质量较高(${(stats.avgQuality * 100).toFixed(1)}%)，可以减少轮数`
      };
    }

    return null;
  }

  /**
   * 估算指定轮数的成本
   */
  private estimateCostForRounds(taskType: string, rounds: number): number {
    // 这里需要集成Token计算器
    // 暂时使用简单的估算
    const baseCosts: Record<string, number> = {
      'news_importance': 0.001,
      'timeline_build': 0.005,
      'historical_attribution': 0.01,
      'model_adjustment': 0.003
    };

    const baseCost = baseCosts[taskType] || 0.005;
    return baseCost * rounds;
  }

  /**
   * 获取深度思考配置
   */
  getThinkingDepthConfig(taskType: string): {
    thinkingDepth: 'shallow' | 'medium' | 'deep' | 'deepest';
    temperature: number;
    topP: number;
    maxTokens: number;
    timeout: number;
  } | null {
    const config = this.getRoundConfig(taskType);
    if (!config) {
      return null;
    }

    return {
      thinkingDepth: config.thinkingDepth || 'medium',
      temperature: config.temperature || 0.7,
      topP: config.topP || 0.8,
      maxTokens: config.maxTokens || 2000,
      timeout: config.timeout || 60000
    };
  }

  /**
   * 根据深度思考等级调整参数
   */
  adjustParametersForThinkingDepth(
    baseConfig: RoundConfig,
    thinkingDepth: 'shallow' | 'medium' | 'deep' | 'deepest'
  ): RoundConfig {
    const adjustments = {
      shallow: { temperature: 0.3, topP: 0.7, maxTokens: 1000, timeout: 30000 },
      medium: { temperature: 0.7, topP: 0.8, maxTokens: 2000, timeout: 60000 },
      deep: { temperature: 0.8, topP: 0.9, maxTokens: 3000, timeout: 90000 },
      deepest: { temperature: 0.9, topP: 0.95, maxTokens: 4000, timeout: 120000 }
    };

    const adjustment = adjustments[thinkingDepth];
    return {
      ...baseConfig,
      thinkingDepth,
      temperature: adjustment.temperature,
      topP: adjustment.topP,
      maxTokens: adjustment.maxTokens,
      timeout: adjustment.timeout
    };
  }

  /**
   * 生成轮数配置报告
   */
  generateConfigReport(): string {
    let report = '# 轮数配置报告\n\n';
    report += `**生成时间**: ${new Date().toLocaleString()}\n\n`;

    report += '## 当前配置\n\n';
    report += '| 任务类型 | 最小轮数 | 最大轮数 | 默认轮数 | 质量阈值 | 成本限制 | 描述 |\n';
    report += '|----------|----------|----------|----------|----------|----------|------|\n';

    this.getAllConfigs().forEach(config => {
      report += `| ${config.taskType} | ${config.minRounds} | ${config.maxRounds} | ${config.defaultRounds} | ${(config.qualityThreshold * 100).toFixed(1)}% | ${config.costLimit}元 | ${config.description} |\n`;
    });

    report += '\n## 历史数据统计\n\n';
    this.configs.forEach((config, taskType) => {
      const stats = this.getHistoricalStats(taskType);
      if (stats) {
        report += `### ${taskType}\n`;
        report += `- 总任务数: ${stats.totalTasks}\n`;
        report += `- 平均轮数: ${stats.avgRounds.toFixed(1)}\n`;
        report += `- 平均质量: ${(stats.avgQuality * 100).toFixed(1)}%\n`;
        report += `- 平均成本: ${stats.avgCost.toFixed(4)}元\n`;
        report += `- 轮数分布: ${JSON.stringify(stats.roundsDistribution)}\n\n`;
      }
    });

    return report;
  }
}

// 导出单例实例
export const roundConfigManager = new RoundConfigManager();

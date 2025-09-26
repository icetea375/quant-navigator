/**
 * 质量评估管理器
 * 实现分层质量评估策略
 */

import { tokenCalculator } from './TokenCalculator';
import { roundConfigManager } from './RoundConfigManager';

export interface QualityAssessmentResult {
  score: number; // 0-1
  level: 'poor' | 'fair' | 'good' | 'excellent';
  issues: string[];
  recommendations: string[];
  cost: number;
  method: string;
  timestamp: number;
}

export interface QualityAssessmentConfig {
  method: 'rule_based' | 'simple_llm' | 'single_llm' | 'dual_llm';
  model?: string;
  provider?: string;
  cost: number;
  accuracy: number;
  criteria: string[];
  description: string;
  // 深度思考相关参数
  thinkingDepth?: 'shallow' | 'medium' | 'deep' | 'deepest';
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface TaskQualityProfile {
  taskType: string;
  totalAssessments: number;
  avgScore: number;
  qualityDistribution: Record<string, number>;
  costPerAssessment: number;
  totalCost: number;
  lastUpdated: string;
}

/**
 * 质量评估管理器类
 */
export class QualityAssessmentManager {
  private configs: Map<string, QualityAssessmentConfig[]> = new Map();
  private assessmentHistory: QualityAssessmentResult[] = [];
  private taskProfiles: Map<string, TaskQualityProfile> = new Map();

  constructor() {
    this.initializeQualityConfigs();
  }

  /**
   * 初始化质量评估配置
   */
  private initializeQualityConfigs(): void {
    // 轻量级评估配置（80%任务）
    const lightweightConfigs: QualityAssessmentConfig[] = [
      {
        method: 'rule_based',
        cost: 0,
        accuracy: 0.6,
        criteria: [
          '输出长度是否合理',
          '是否包含关键词',
          '格式是否正确',
          '是否有明显错误'
        ],
        description: '基于规则的快速质量检查',
        thinkingDepth: 'shallow',
        temperature: 0.3,
        topP: 0.7,
        maxTokens: 1000,
        timeout: 30000
      },
      {
        method: 'simple_llm',
        model: 'doubao-seed-1-6-flash-250615',
        provider: 'doubao',
        cost: 0.001,
        accuracy: 0.75,
        criteria: [
          '内容相关性',
          '逻辑一致性',
          '语言质量',
          '完整性'
        ],
        description: '使用快速模型进行简单质量评估',
        thinkingDepth: 'shallow',
        temperature: 0.3,
        topP: 0.7,
        maxTokens: 1000,
        timeout: 30000
      }
    ];

    // 中等评估配置（15%任务）
    const mediumConfigs: QualityAssessmentConfig[] = [
      {
        method: 'single_llm',
        model: 'doubao-seed-1-6-250615',
        provider: 'doubao',
        cost: 0.005,
        accuracy: 0.85,
        criteria: [
          '内容准确性',
          '逻辑严密性',
          '语言表达',
          '结构完整性',
          '创新性'
        ],
        description: '使用标准模型进行中等质量评估',
        thinkingDepth: 'medium',
        temperature: 0.7,
        topP: 0.8,
        maxTokens: 2000,
        timeout: 60000
      }
    ];

    // 深度评估配置（5%任务）
    const deepConfigs: QualityAssessmentConfig[] = [
      {
        method: 'dual_llm',
        model: 'doubao-seed-1-6-pro-250615',
        provider: 'doubao',
        cost: 0.02,
        accuracy: 0.95,
        criteria: [
          '内容深度',
          '逻辑严密性',
          '语言表达',
          '结构完整性',
          '创新性',
          '专业性',
          '实用性'
        ],
        description: '使用双LLM进行深度质量评估',
        thinkingDepth: 'deepest',
        temperature: 0.9,
        topP: 0.95,
        maxTokens: 4000,
        timeout: 120000
      }
    ];

    // 为每种任务类型配置评估策略
    const taskTypes = ['news_importance', 'timeline_build', 'historical_attribution', 'model_adjustment'];

    taskTypes.forEach(taskType => {
      this.configs.set(taskType, [
        ...lightweightConfigs,
        ...mediumConfigs,
        ...deepConfigs
      ]);
    });
  }

  /**
   * 执行质量评估
   */
  async assessQuality(
    taskType: string,
    input: string,
    output: string,
    rounds: number,
    qualityLevel: 'basic' | 'standard' | 'high' | 'premium' = 'standard'
  ): Promise<QualityAssessmentResult> {
    const config = this.selectAssessmentConfig(taskType, qualityLevel);

    let result: QualityAssessmentResult;

    switch (config.method) {
      case 'rule_based':
        result = await this.performRuleBasedAssessment(input, output, config);
        break;
      case 'simple_llm':
      case 'single_llm':
        result = await this.performLLMAssessment(input, output, config);
        break;
      case 'dual_llm':
        result = await this.performDualLLMAssessment(input, output, config);
        break;
      default:
        throw new Error(`未知的评估方法: ${config.method}`);
    }

    // 记录评估结果
    this.recordAssessmentResult(taskType, result);

    return result;
  }

  /**
   * 选择评估配置
   */
  private selectAssessmentConfig(
    taskType: string,
    qualityLevel: 'basic' | 'standard' | 'high' | 'premium'
  ): QualityAssessmentConfig {
    const configs = this.configs.get(taskType) || [];

    // 根据质量等级选择配置
    switch (qualityLevel) {
      case 'basic':
        return configs.find(c => c.method === 'rule_based') || configs[0];
      case 'standard':
        return configs.find(c => c.method === 'simple_llm') || configs[1];
      case 'high':
        return configs.find(c => c.method === 'single_llm') || configs[2];
      case 'premium':
        return configs.find(c => c.method === 'dual_llm') || configs[configs.length - 1];
      default:
        return configs[1]; // 默认使用中等评估
    }
  }

  /**
   * 基于规则的评估
   */
  private async performRuleBasedAssessment(
    input: string,
    output: string,
    config: QualityAssessmentConfig
  ): Promise<QualityAssessmentResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

    // 检查输出长度
    if (output.length < input.length * 0.1) {
      issues.push('输出过短');
      score -= 0.2;
    } else if (output.length > input.length * 3) {
      issues.push('输出过长');
      score -= 0.1;
    }

    // 检查关键词
    const keywords = this.extractKeywords(input);
    const keywordMatches = keywords.filter(keyword =>
      output.toLowerCase().includes(keyword.toLowerCase())
    );

    if (keywordMatches.length < keywords.length * 0.3) {
      issues.push('关键词覆盖率低');
      score -= 0.2;
    }

    // 检查格式
    if (!output.includes('。') && !output.includes('.')) {
      issues.push('缺少句号结尾');
      score -= 0.1;
    }

    // 检查明显错误
    if (output.includes('错误') || output.includes('无法') || output.includes('失败')) {
      issues.push('包含错误信息');
      score -= 0.3;
    }

    // 生成建议
    if (score < 0.7) {
      recommendations.push('建议增加内容深度');
    }
    if (keywordMatches.length < keywords.length * 0.5) {
      recommendations.push('建议提高关键词覆盖率');
    }

    const level = this.getQualityLevel(score);

    return {
      score: Math.max(0, Math.min(1, score)),
      level,
      issues,
      recommendations,
      cost: config.cost,
      method: config.method,
      timestamp: Date.now()
    };
  }

  /**
   * 单LLM评估
   */
  private async performLLMAssessment(
    input: string,
    output: string,
    config: QualityAssessmentConfig
  ): Promise<QualityAssessmentResult> {
    // 模拟LLM评估（实际实现中需要调用真实的LLM）
    const prompt = this.buildAssessmentPrompt(input, output, config.criteria);

    // 模拟处理时间
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 模拟评估结果
    const score = 0.7 + Math.random() * 0.3; // 0.7-1.0
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (score < 0.8) {
      issues.push('内容深度不足');
      recommendations.push('建议增加分析深度');
    }
    if (score < 0.9) {
      issues.push('语言表达可以改进');
      recommendations.push('建议优化语言表达');
    }

    const level = this.getQualityLevel(score);

    return {
      score,
      level,
      issues,
      recommendations,
      cost: config.cost,
      method: config.method,
      timestamp: Date.now()
    };
  }

  /**
   * 双LLM评估
   */
  private async performDualLLMAssessment(
    input: string,
    output: string,
    config: QualityAssessmentConfig
  ): Promise<QualityAssessmentResult> {
    // 模拟双LLM评估
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 双LLM评估通常更准确
    const score = 0.8 + Math.random() * 0.2; // 0.8-1.0
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (score < 0.9) {
      issues.push('某些方面可以进一步优化');
      recommendations.push('建议进行细节优化');
    }

    const level = this.getQualityLevel(score);

    return {
      score,
      level,
      issues,
      recommendations,
      cost: config.cost,
      method: config.method,
      timestamp: Date.now()
    };
  }

  /**
   * 构建评估提示词
   */
  private buildAssessmentPrompt(input: string, output: string, criteria: string[]): string {
    return `请评估以下输出内容的质量：

输入：${input}

输出：${output}

评估标准：
${criteria.map(c => `- ${c}`).join('\n')}

请给出0-1的评分，并指出问题和改进建议。`;
  }

  /**
   * 提取关键词
   */
  private extractKeywords(text: string): string[] {
    // 简单的关键词提取（实际实现中可以使用更复杂的方法）
    const words = text.split(/[\s，。！？；：""''（）【】]/);
    return words
      .filter(word => word.length > 1)
      .filter(word => !/^[0-9]+$/.test(word))
      .slice(0, 10); // 取前10个词作为关键词
  }

  /**
   * 获取质量等级
   */
  private getQualityLevel(score: number): 'poor' | 'fair' | 'good' | 'excellent' {
    if (score >= 0.9) return 'excellent';
    if (score >= 0.8) return 'good';
    if (score >= 0.6) return 'fair';
    return 'poor';
  }

  /**
   * 记录评估结果
   */
  private recordAssessmentResult(taskType: string, result: QualityAssessmentResult): void {
    this.assessmentHistory.push(result);

    // 更新任务质量档案
    if (!this.taskProfiles.has(taskType)) {
      this.taskProfiles.set(taskType, {
        taskType,
        totalAssessments: 0,
        avgScore: 0,
        qualityDistribution: {},
        costPerAssessment: 0,
        totalCost: 0,
        lastUpdated: new Date().toISOString()
      });
    }

    const profile = this.taskProfiles.get(taskType)!;
    profile.totalAssessments++;
    profile.avgScore = (profile.avgScore * (profile.totalAssessments - 1) + result.score) / profile.totalAssessments;
    profile.totalCost += result.cost;
    profile.costPerAssessment = profile.totalCost / profile.totalAssessments;
    profile.lastUpdated = new Date().toISOString();

    // 更新质量分布
    profile.qualityDistribution[result.level] = (profile.qualityDistribution[result.level] || 0) + 1;
  }

  /**
   * 获取任务质量档案
   */
  getTaskQualityProfile(taskType: string): TaskQualityProfile | null {
    return this.taskProfiles.get(taskType) || null;
  }

  /**
   * 获取所有质量档案
   */
  getAllQualityProfiles(): TaskQualityProfile[] {
    return Array.from(this.taskProfiles.values());
  }

  /**
   * 获取评估历史
   */
  getAssessmentHistory(limit: number = 100): QualityAssessmentResult[] {
    return this.assessmentHistory.slice(-limit);
  }

  /**
   * 获取深度思考配置
   */
  getThinkingDepthConfig(
    taskType: string,
    qualityLevel: 'basic' | 'standard' | 'high' | 'premium'
  ): {
    thinkingDepth: 'shallow' | 'medium' | 'deep' | 'deepest';
    temperature: number;
    topP: number;
    maxTokens: number;
    timeout: number;
  } | null {
    const config = this.selectAssessmentConfig(taskType, qualityLevel);
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
   * 根据深度思考等级调整评估参数
   */
  adjustAssessmentForThinkingDepth(
    baseConfig: QualityAssessmentConfig,
    thinkingDepth: 'shallow' | 'medium' | 'deep' | 'deepest'
  ): QualityAssessmentConfig {
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
   * 生成质量评估报告
   */
  generateQualityReport(): string {
    let report = '# 质量评估报告\n\n';
    report += `**生成时间**: ${new Date().toLocaleString()}\n`;
    report += `**总评估数**: ${this.assessmentHistory.length}\n\n`;

    report += '## 任务质量档案\n\n';
    report += '| 任务类型 | 评估次数 | 平均分数 | 总成本(元) | 平均成本(元) | 最后更新 |\n';
    report += '|----------|----------|----------|------------|--------------|----------|\n';

    this.getAllQualityProfiles().forEach(profile => {
      report += `| ${profile.taskType} | ${profile.totalAssessments} | ${profile.avgScore.toFixed(3)} | ${profile.totalCost.toFixed(4)} | ${profile.costPerAssessment.toFixed(4)} | ${profile.lastUpdated} |\n`;
    });

    report += '\n## 质量分布\n\n';
    this.getAllQualityProfiles().forEach(profile => {
      report += `### ${profile.taskType}\n`;
      report += `- 优秀: ${profile.qualityDistribution.excellent || 0}\n`;
      report += `- 良好: ${profile.qualityDistribution.good || 0}\n`;
      report += `- 一般: ${profile.qualityDistribution.fair || 0}\n`;
      report += `- 较差: ${profile.qualityDistribution.poor || 0}\n\n`;
    });

    return report;
  }
}

// 导出单例实例
export const qualityAssessmentManager = new QualityAssessmentManager();

/**
 * SignalTranslationEngine - 信号翻译引擎
 * 将冰冷的量化数据"翻译"成人类可读的标签
 * 原 AnalysisPipeline 的核心组件
 */

import { DatabaseConnection } from '../database/connection';
import { BaseConfigValidator } from '../utils/BaseConfigValidator';
import { logger } from '../utils/logger';

export interface SignalTranslationConfig {
  enabled: boolean;
  translationRules: TranslationRule[];
  outputFormat: 'json' | 'text';
  thresholds: {
    zScore: {
      extreme: number;      // 极强信号阈值
      strong: number;       // 强信号阈值
      moderate: number;     // 中等信号阈值
      weak: number;         // 弱信号阈值
    };
    correlation: {
      high: number;         // 高相关性阈值
      medium: number;       // 中等相关性阈值
      low: number;          // 低相关性阈值
    };
  };
  templates: {
    marketState: string;
    sectorRotation: string;
    riskAppetite: string;
    anomalyDescription: string;
  };
}

export interface TranslationRule {
  id: string;
  name: string;
  condition: {
    signalType: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    threshold: number;
  };
  translation: {
    label: string;
    description: string;
    strength: 'extreme' | 'strong' | 'moderate' | 'weak';
    color: string;
  };
  priority: number;
}

export interface SignalInput {
  zScore: number;
  anomalyType: 'price' | 'volume' | 'volatility' | 'correlation';
  context: {
    marketState: string;
    sectorPerformance: number;
    newsCount: number;
    sentiment: number;
  };
  additionalSignals?: {
    [key: string]: number;
  };
}

export interface TranslatedSignal {
  signalType: string;
  label: string;
  description: string;
  strength: 'extreme' | 'strong' | 'moderate' | 'weak';
  confidence: number;
  color: string;
  marketContext: {
    overallState: string;
    sectorRotation: string;
    riskAppetite: string;
  };
  recommendations: string[];
}

export class SignalTranslationEngine {
  private db: DatabaseConnection;
  private config: SignalTranslationConfig;
  private isRunning: boolean = false;

  constructor(
    db: DatabaseConnection,
    config: SignalTranslationConfig
  ) {
    this.db = db;
    this.config = config;

    this.validateConfig(config);
  }

  /**
   * 验证配置
   */
  private validateConfig(config: SignalTranslationConfig): void {
    BaseConfigValidator.validate(config, [
      'enabled', 'translationRules', 'outputFormat', 'thresholds', 'templates'
    ]);
  }

  /**
   * 启动信号翻译引擎
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('SignalTranslationEngine is already running');
      return;
    }

    try {
      logger.info('Starting SignalTranslationEngine...');
      this.isRunning = true;
      logger.info('SignalTranslationEngine started successfully');
    } catch (error) {
      logger.error('Failed to start SignalTranslationEngine:', error);
      throw error;
    }
  }

  /**
   * 停止信号翻译引擎
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      logger.info('Stopping SignalTranslationEngine...');
      this.isRunning = false;
      logger.info('SignalTranslationEngine stopped successfully');
    } catch (error) {
      logger.error('Failed to stop SignalTranslationEngine:', error);
      throw error;
    }
  }

  /**
   * 翻译信号 - 核心功能
   */
  async translateSignals(input: SignalInput): Promise<TranslatedSignal> {
    try {
      logger.debug(`Translating signals for anomaly type: ${input.anomalyType}`);

      // 1. 分析主要信号
      const primarySignal = this.analyzePrimarySignal(input);

      // 2. 分析市场上下文
      const marketContext = this.analyzeMarketContext(input);

      // 3. 生成推荐
      const recommendations = this.generateRecommendations(input, primarySignal);

      const result: TranslatedSignal = {
        signalType: primarySignal.signalType,
        label: primarySignal.label,
        description: primarySignal.description,
        strength: primarySignal.strength,
        confidence: primarySignal.confidence,
        color: primarySignal.color,
        marketContext,
        recommendations
      };

      logger.debug(`Signal translation completed: ${result.label}`);
      return result;

    } catch (error) {
      logger.error('Failed to translate signals:', error);
      throw error;
    }
  }

  /**
   * 分析主要信号
   */
  private analyzePrimarySignal(input: SignalInput): any {
    const { zScore, anomalyType } = input;

    // 确定信号强度
    const strength = this.determineSignalStrength(Math.abs(zScore));

    // 根据异常类型和Z分数选择翻译规则
    const rule = this.findMatchingRule(anomalyType, zScore);

    if (!rule) {
      // 使用默认规则
      return this.createDefaultSignal(anomalyType, zScore, strength);
    }

    return {
      signalType: rule.translation.label,
      label: rule.translation.label,
      description: this.formatDescription(rule.translation.description, {
        zScore: zScore.toFixed(2),
        anomalyType,
        strength: this.getStrengthText(strength)
      }),
      strength: rule.translation.strength,
      confidence: this.calculateConfidence(zScore, strength),
      color: rule.translation.color
    };
  }

  /**
   * 分析市场上下文
   */
  private analyzeMarketContext(input: SignalInput): any {
    const { context } = input;

    return {
      overallState: this.analyzeOverallMarketState(context),
      sectorRotation: this.analyzeSectorRotation(context),
      riskAppetite: this.analyzeRiskAppetite(context)
    };
  }

  /**
   * 分析整体市场状态
   */
  private analyzeOverallMarketState(context: any): string {
    const { sentiment, newsCount } = context;

    if (sentiment > 0.7 && newsCount > 10) {
      return '市场情绪高涨，消息面活跃';
    } else if (sentiment > 0.3 && newsCount > 5) {
      return '市场情绪偏乐观，消息面正常';
    } else if (sentiment < -0.3 && newsCount > 5) {
      return '市场情绪偏悲观，消息面活跃';
    } else if (sentiment < -0.7 && newsCount > 10) {
      return '市场情绪极度悲观，消息面异常活跃';
    } else {
      return '市场情绪中性，消息面平静';
    }
  }

  /**
   * 分析板块轮动
   */
  private analyzeSectorRotation(context: any): string {
    const { sectorPerformance } = context;

    if (sectorPerformance > 0.05) {
      return '板块表现强势，资金流入明显';
    } else if (sectorPerformance > 0.02) {
      return '板块表现良好，资金小幅流入';
    } else if (sectorPerformance < -0.05) {
      return '板块表现疲弱，资金流出明显';
    } else if (sectorPerformance < -0.02) {
      return '板块表现一般，资金小幅流出';
    } else {
      return '板块表现平稳，资金流向均衡';
    }
  }

  /**
   * 分析风险偏好
   */
  private analyzeRiskAppetite(context: any): string {
    const { sentiment, sectorPerformance } = context;

    const riskScore = (sentiment + sectorPerformance) / 2;

    if (riskScore > 0.5) {
      return '风险偏好高涨，投资者情绪乐观';
    } else if (riskScore > 0.2) {
      return '风险偏好适中，投资者情绪稳定';
    } else if (riskScore < -0.5) {
      return '风险偏好极低，投资者情绪恐慌';
    } else if (riskScore < -0.2) {
      return '风险偏好较低，投资者情绪谨慎';
    } else {
      return '风险偏好中性，投资者情绪平稳';
    }
  }

  /**
   * 生成推荐
   */
  private generateRecommendations(input: SignalInput, primarySignal: any): string[] {
    const recommendations: string[] = [];
    const { anomalyType, zScore } = input;
    const { strength } = primarySignal;

    // 基于信号强度的推荐
    if (strength === 'extreme') {
      recommendations.push('信号极强，建议重点关注');
      recommendations.push('考虑调整仓位配置');
    } else if (strength === 'strong') {
      recommendations.push('信号较强，建议密切观察');
      recommendations.push('可考虑适度调整策略');
    } else if (strength === 'moderate') {
      recommendations.push('信号中等，保持关注');
      recommendations.push('维持当前策略不变');
    } else {
      recommendations.push('信号较弱，正常监控');
    }

    // 基于异常类型的推荐
    switch (anomalyType) {
      case 'price':
        if (zScore > 0) {
          recommendations.push('价格上涨异常，关注基本面变化');
        } else {
          recommendations.push('价格下跌异常，关注风险因素');
        }
        break;
      case 'volume':
        recommendations.push('成交量异常，关注资金流向');
        break;
      case 'volatility':
        recommendations.push('波动率异常，关注市场情绪');
        break;
      case 'correlation':
        recommendations.push('相关性异常，关注板块轮动');
        break;
    }

    return recommendations;
  }

  /**
   * 确定信号强度
   */
  private determineSignalStrength(absZScore: number): 'extreme' | 'strong' | 'moderate' | 'weak' {
    const { zScore } = this.config.thresholds;

    if (absZScore >= zScore.extreme) {
      return 'extreme';
    } else if (absZScore >= zScore.strong) {
      return 'strong';
    } else if (absZScore >= zScore.moderate) {
      return 'moderate';
    } else {
      return 'weak';
    }
  }

  /**
   * 查找匹配的翻译规则
   */
  private findMatchingRule(anomalyType: string, zScore: number): TranslationRule | null {
    return this.config.translationRules.find(rule => {
      const { condition } = rule;
      return condition.signalType === anomalyType &&
             this.evaluateCondition(zScore, condition.operator, condition.threshold);
    }) || null;
  }

  /**
   * 评估条件
   */
  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '==': return value === threshold;
      case '!=': return value !== threshold;
      default: return false;
    }
  }

  /**
   * 创建默认信号
   */
  private createDefaultSignal(anomalyType: string, zScore: number, strength: string): any {
    const signalTypes = {
      price: '价格异动信号',
      volume: '成交量异动信号',
      volatility: '波动率异动信号',
      correlation: '相关性异动信号'
    };

    return {
      signalType: signalTypes[anomalyType] || '未知信号',
      label: signalTypes[anomalyType] || '未知信号',
      description: `${signalTypes[anomalyType] || '未知信号'}，Z分数为${zScore.toFixed(2)}，强度为${this.getStrengthText(strength)}`,
      strength,
      confidence: this.calculateConfidence(zScore, strength),
      color: this.getStrengthColor(strength)
    };
  }

  /**
   * 格式化描述
   */
  private formatDescription(template: string, variables: any): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  /**
   * 获取强度文本
   */
  private getStrengthText(strength: string): string {
    const strengthMap = {
      extreme: '极强',
      strong: '强',
      moderate: '中等',
      weak: '弱'
    };
    return strengthMap[strength] || '未知';
  }

  /**
   * 获取强度颜色
   */
  private getStrengthColor(strength: string): string {
    const colorMap = {
      extreme: '#ff4444',
      strong: '#ff8800',
      moderate: '#ffaa00',
      weak: '#88aa00'
    };
    return colorMap[strength] || '#888888';
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(zScore: number, strength: string): number {
    const absZScore = Math.abs(zScore);
    const strengthMultiplier = {
      extreme: 0.95,
      strong: 0.85,
      moderate: 0.70,
      weak: 0.50
    };

    const baseConfidence = Math.min(absZScore / 3, 1); // 基于Z分数的置信度
    const strengthBonus = strengthMultiplier[strength] || 0.5;

    return Math.min(baseConfidence * strengthBonus, 0.95);
  }

  /**
   * 获取引擎状态
   */
  getStatus(): any {
    return {
      isRunning: this.isRunning,
      config: this.config,
      rulesCount: this.config.translationRules.length
    };
  }
}

export default SignalTranslationEngine;

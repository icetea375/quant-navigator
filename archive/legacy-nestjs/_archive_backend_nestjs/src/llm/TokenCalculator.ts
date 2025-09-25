/**
 * Token计算模型
 * 基于实际测试数据建立准确的Token消耗计算
 */

import { getModelPricing, calculateLLMCost } from './config';

export interface TokenCalculation {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  model: string;
  provider: string;
  timestamp: number;
}

export interface TaskTokenBenchmark {
  taskType: string;
  model: string;
  provider: string;
  rounds: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  avgTotalTokens: number;
  avgCost: number;
  stdDev: number;
  minTokens: number;
  maxTokens: number;
  sampleSize: number;
  confidence: number;
  lastUpdated: string;
}

export interface TokenTestResult {
  taskType: string;
  model: string;
  provider: string;
  rounds: number;
  inputContent: string;
  outputContent: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  processingTime: number;
  quality: number;
  timestamp: number;
}

/**
 * Token计算器类
 */
export class TokenCalculator {
  private benchmarks: Map<string, TaskTokenBenchmark> = new Map();
  private testResults: TokenTestResult[] = [];

  /**
   * 基于内容长度计算Token数量
   */
  calculateTokensFromContent(
    inputContent: string,
    outputContent: string,
    model: string,
    provider: string
  ): TokenCalculation {
    // 中文1字符≈2tokens，英文1字符≈1token
    const inputTokens = this.estimateTokens(inputContent);
    const outputTokens = this.estimateTokens(outputContent);
    const totalTokens = inputTokens + outputTokens;
    
    const cost = calculateLLMCost(provider, model, inputTokens, outputTokens);
    
    return {
      inputTokens,
      outputTokens,
      totalTokens,
      cost,
      model,
      provider,
      timestamp: Date.now()
    };
  }

  /**
   * 基于任务类型和轮数预估Token消耗
   */
  estimateTokensForTask(
    taskType: string,
    model: string,
    provider: string,
    rounds: number,
    inputSize: 'small' | 'medium' | 'large' = 'medium'
  ): TokenCalculation {
    const benchmark = this.getBenchmark(taskType, model, provider, rounds);
    
    if (benchmark) {
      // 基于基准数据预估
      const sizeMultiplier = this.getSizeMultiplier(inputSize);
      const inputTokens = Math.round(benchmark.avgInputTokens * sizeMultiplier);
      const outputTokens = Math.round(benchmark.avgOutputTokens * sizeMultiplier);
      const totalTokens = inputTokens + outputTokens;
      const cost = calculateLLMCost(provider, model, inputTokens, outputTokens);
      
      return {
        inputTokens,
        outputTokens,
        totalTokens,
        cost,
        model,
        provider,
        timestamp: Date.now()
      };
    } else {
      // 基于任务类型默认值预估
      const defaultTokens = this.getDefaultTokensForTask(taskType, rounds, inputSize);
      const cost = calculateLLMCost(provider, model, defaultTokens.input, defaultTokens.output);
      
      return {
        inputTokens: defaultTokens.input,
        outputTokens: defaultTokens.output,
        totalTokens: defaultTokens.input + defaultTokens.output,
        cost,
        model,
        provider,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 记录实际Token消耗数据
   */
  recordTokenUsage(
    taskType: string,
    model: string,
    provider: string,
    rounds: number,
    inputContent: string,
    outputContent: string,
    processingTime: number,
    quality: number = 0.8
  ): TokenTestResult {
    const calculation = this.calculateTokensFromContent(inputContent, outputContent, model, provider);
    
    const result: TokenTestResult = {
      taskType,
      model,
      provider,
      rounds,
      inputContent,
      outputContent,
      inputTokens: calculation.inputTokens,
      outputTokens: calculation.outputTokens,
      totalTokens: calculation.totalTokens,
      cost: calculation.cost,
      processingTime,
      quality,
      timestamp: Date.now()
    };
    
    this.testResults.push(result);
    this.updateBenchmark(result);
    
    return result;
  }

  /**
   * 获取任务类型的Token消耗基准
   */
  getBenchmark(
    taskType: string,
    model: string,
    provider: string,
    rounds: number
  ): TaskTokenBenchmark | null {
    const key = `${taskType}_${provider}_${model}_${rounds}`;
    return this.benchmarks.get(key) || null;
  }

  /**
   * 获取所有基准数据
   */
  getAllBenchmarks(): TaskTokenBenchmark[] {
    return Array.from(this.benchmarks.values());
  }

  /**
   * 获取测试结果统计
   */
  getTestResultsSummary(): {
    totalTests: number;
    totalTokens: number;
    totalCost: number;
    avgQuality: number;
    byTaskType: Record<string, any>;
    byModel: Record<string, any>;
  } {
    const totalTests = this.testResults.length;
    const totalTokens = this.testResults.reduce((sum, r) => sum + r.totalTokens, 0);
    const totalCost = this.testResults.reduce((sum, r) => sum + r.cost, 0);
    const avgQuality = this.testResults.reduce((sum, r) => sum + r.quality, 0) / totalTests;

    const byTaskType: Record<string, any> = {};
    const byModel: Record<string, any> = {};

    this.testResults.forEach(result => {
      // 按任务类型统计
      if (!byTaskType[result.taskType]) {
        byTaskType[result.taskType] = {
          count: 0,
          totalTokens: 0,
          totalCost: 0,
          avgQuality: 0
        };
      }
      byTaskType[result.taskType].count++;
      byTaskType[result.taskType].totalTokens += result.totalTokens;
      byTaskType[result.taskType].totalCost += result.cost;
      byTaskType[result.taskType].avgQuality += result.quality;

      // 按模型统计
      const modelKey = `${result.provider}_${result.model}`;
      if (!byModel[modelKey]) {
        byModel[modelKey] = {
          count: 0,
          totalTokens: 0,
          totalCost: 0,
          avgQuality: 0
        };
      }
      byModel[modelKey].count++;
      byModel[modelKey].totalTokens += result.totalTokens;
      byModel[modelKey].totalCost += result.cost;
      byModel[modelKey].avgQuality += result.quality;
    });

    // 计算平均值
    Object.keys(byTaskType).forEach(taskType => {
      byTaskType[taskType].avgQuality /= byTaskType[taskType].count;
    });
    Object.keys(byModel).forEach(model => {
      byModel[model].avgQuality /= byModel[model].count;
    });

    return {
      totalTests,
      totalTokens,
      totalCost,
      avgQuality,
      byTaskType,
      byModel
    };
  }

  /**
   * 估算文本的Token数量
   */
  private estimateTokens(text: string): number {
    if (!text) return 0;
    
    // 简单估算：中文1字符≈2tokens，英文1字符≈1token
    let tokens = 0;
    for (const char of text) {
      if (char.match(/[\u4e00-\u9fff]/)) {
        // 中文字符
        tokens += 2;
      } else if (char.match(/[a-zA-Z0-9]/)) {
        // 英文字符和数字
        tokens += 1;
      } else {
        // 其他字符（标点符号等）
        tokens += 1;
      }
    }
    
    return Math.ceil(tokens);
  }

  /**
   * 获取不同输入大小的倍数
   */
  private getSizeMultiplier(size: 'small' | 'medium' | 'large'): number {
    switch (size) {
      case 'small': return 0.5;
      case 'medium': return 1.0;
      case 'large': return 2.0;
      default: return 1.0;
    }
  }

  /**
   * 获取任务类型的默认Token消耗
   */
  private getDefaultTokensForTask(
    taskType: string,
    rounds: number,
    inputSize: 'small' | 'medium' | 'large'
  ): { input: number; output: number } {
    const sizeMultiplier = this.getSizeMultiplier(inputSize);
    
    const defaults: Record<string, { input: number; output: number }> = {
      'news_importance': {
        input: 1500,
        output: 800
      },
      'timeline_build': {
        input: 8000,
        output: 4000
      },
      'historical_attribution': {
        input: 3000,
        output: 8000
      },
      'model_adjustment': {
        input: 2000,
        output: 1500
      }
    };

    const base = defaults[taskType] || { input: 2000, output: 2000 };
    const roundMultiplier = Math.max(1, rounds * 0.8); // 轮数影响输出长度
    
    return {
      input: Math.round(base.input * sizeMultiplier),
      output: Math.round(base.output * sizeMultiplier * roundMultiplier)
    };
  }

  /**
   * 更新基准数据
   */
  private updateBenchmark(result: TokenTestResult): void {
    const key = `${result.taskType}_${result.provider}_${result.model}_${result.rounds}`;
    
    if (!this.benchmarks.has(key)) {
      // 创建新的基准数据
      this.benchmarks.set(key, {
        taskType: result.taskType,
        model: result.model,
        provider: result.provider,
        rounds: result.rounds,
        avgInputTokens: result.inputTokens,
        avgOutputTokens: result.outputTokens,
        avgTotalTokens: result.totalTokens,
        avgCost: result.cost,
        stdDev: 0,
        minTokens: result.totalTokens,
        maxTokens: result.totalTokens,
        sampleSize: 1,
        confidence: 0.5,
        lastUpdated: new Date().toISOString()
      });
    } else {
      // 更新现有基准数据
      const benchmark = this.benchmarks.get(key)!;
      const oldSampleSize = benchmark.sampleSize;
      const newSampleSize = oldSampleSize + 1;
      
      // 更新平均值
      benchmark.avgInputTokens = (benchmark.avgInputTokens * oldSampleSize + result.inputTokens) / newSampleSize;
      benchmark.avgOutputTokens = (benchmark.avgOutputTokens * oldSampleSize + result.outputTokens) / newSampleSize;
      benchmark.avgTotalTokens = (benchmark.avgTotalTokens * oldSampleSize + result.totalTokens) / newSampleSize;
      benchmark.avgCost = (benchmark.avgCost * oldSampleSize + result.cost) / newSampleSize;
      
      // 更新范围
      benchmark.minTokens = Math.min(benchmark.minTokens, result.totalTokens);
      benchmark.maxTokens = Math.max(benchmark.maxTokens, result.totalTokens);
      
      // 更新样本大小和置信度
      benchmark.sampleSize = newSampleSize;
      benchmark.confidence = Math.min(0.95, 0.5 + (newSampleSize - 1) * 0.05);
      benchmark.lastUpdated = new Date().toISOString();
      
      // 计算标准差（简化版本）
      const results = this.testResults.filter(r => 
        r.taskType === result.taskType && 
        r.provider === result.provider && 
        r.model === result.model && 
        r.rounds === result.rounds
      );
      if (results.length > 1) {
        const mean = benchmark.avgTotalTokens;
        const variance = results.reduce((sum, r) => sum + Math.pow(r.totalTokens - mean, 2), 0) / results.length;
        benchmark.stdDev = Math.sqrt(variance);
      }
    }
  }
}

// 导出单例实例
export const tokenCalculator = new TokenCalculator();

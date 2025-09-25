/**
 * Token测试工具
 * 用于收集实际Token消耗数据，建立基准
 */

import { TokenCalculator, TokenTestResult } from './TokenCalculator';
import { getAvailableProviders } from './config';

export interface TestConfig {
  taskType: string;
  model: string;
  provider: string;
  rounds: number;
  sampleSize: number;
  inputSizes: ('small' | 'medium' | 'large')[];
}

export interface TestSuite {
  name: string;
  description: string;
  tests: TestConfig[];
}

/**
 * Token测试器类
 */
export class TokenTester {
  private calculator: TokenCalculator;
  private testSuites: TestSuite[] = [];

  constructor() {
    this.calculator = new TokenCalculator();
    this.initializeTestSuites();
  }

  /**
   * 初始化测试套件
   */
  private initializeTestSuites(): void {
    this.testSuites = [
      {
        name: '基础功能测试',
        description: '测试各种任务类型的基础Token消耗',
        tests: [
          {
            taskType: 'news_importance',
            model: 'doubao-seed-1-6-flash-250615',
            provider: 'doubao',
            rounds: 1,
            sampleSize: 10,
            inputSizes: ['small', 'medium']
          },
          {
            taskType: 'timeline_build',
            model: 'hunyuan-standard',
            provider: 'hunyuan',
            rounds: 3,
            sampleSize: 5,
            inputSizes: ['medium', 'large']
          },
          {
            taskType: 'historical_attribution',
            model: 'doubao-seed-1-6-250615',
            provider: 'doubao',
            rounds: 4,
            sampleSize: 5,
            inputSizes: ['medium']
          }
        ]
      },
      {
        name: '轮数影响测试',
        description: '测试不同轮数对Token消耗的影响',
        tests: [
          {
            taskType: 'historical_attribution',
            model: 'doubao-seed-1-6-250615',
            provider: 'doubao',
            rounds: 1,
            sampleSize: 3,
            inputSizes: ['medium']
          },
          {
            taskType: 'historical_attribution',
            model: 'doubao-seed-1-6-250615',
            provider: 'doubao',
            rounds: 2,
            sampleSize: 3,
            inputSizes: ['medium']
          },
          {
            taskType: 'historical_attribution',
            model: 'doubao-seed-1-6-250615',
            provider: 'doubao',
            rounds: 3,
            sampleSize: 3,
            inputSizes: ['medium']
          },
          {
            taskType: 'historical_attribution',
            model: 'doubao-seed-1-6-250615',
            provider: 'doubao',
            rounds: 4,
            sampleSize: 3,
            inputSizes: ['medium']
          }
        ]
      },
      {
        name: '模型对比测试',
        description: '测试不同模型的Token消耗差异',
        tests: [
          {
            taskType: 'news_importance',
            model: 'doubao-seed-1-6-flash-250615',
            provider: 'doubao',
            rounds: 1,
            sampleSize: 5,
            inputSizes: ['medium']
          },
          {
            taskType: 'news_importance',
            model: 'hunyuan-standard',
            provider: 'hunyuan',
            rounds: 1,
            sampleSize: 5,
            inputSizes: ['medium']
          },
          {
            taskType: 'news_importance',
            model: 'gemini-2.5-flash',
            provider: 'gemini',
            rounds: 1,
            sampleSize: 5,
            inputSizes: ['medium']
          }
        ]
      }
    ];
  }

  /**
   * 生成测试数据
   */
  generateTestData(taskType: string, inputSize: 'small' | 'medium' | 'large'): {
    input: string;
    expectedOutput: string;
  } {
    const testData: Record<string, Record<string, { input: string; expectedOutput: string }>> = {
      'news_importance': {
        small: {
          input: '央行宣布降准0.5个百分点，释放流动性约1万亿元。',
          expectedOutput: '这是一条重要的货币政策新闻，对市场流动性有显著影响，重要性评分：8.5/10。'
        },
        medium: {
          input: '央行宣布降准0.5个百分点，释放流动性约1万亿元。此次降准是今年以来第三次降准，旨在支持实体经济发展，缓解企业融资难问题。市场普遍认为此次降准符合预期，预计将推动股市上涨。',
          expectedOutput: '这是一条重要的货币政策新闻，对市场流动性有显著影响。降准释放的流动性将直接利好股市，特别是银行、地产等板块。重要性评分：9.0/10，影响范围：宏观经济、股市、债市。'
        },
        large: {
          input: '央行宣布降准0.5个百分点，释放流动性约1万亿元。此次降准是今年以来第三次降准，旨在支持实体经济发展，缓解企业融资难问题。市场普遍认为此次降准符合预期，预计将推动股市上涨。同时，此次降准也体现了央行货币政策的灵活性和前瞻性，为经济复苏提供了有力支撑。专家分析认为，此次降准将有效降低企业融资成本，促进投资和消费，推动经济高质量发展。',
          expectedOutput: '这是一条重要的货币政策新闻，对市场流动性有显著影响。降准释放的流动性将直接利好股市，特别是银行、地产等板块。此次降准体现了央行货币政策的灵活性和前瞻性，为经济复苏提供了有力支撑。重要性评分：9.2/10，影响范围：宏观经济、股市、债市、实体经济。'
        }
      },
      'timeline_build': {
        small: {
          input: '2024年1月：公司发布新产品\n2024年2月：产品获得市场认可\n2024年3月：股价上涨20%',
          expectedOutput: '时间线分析：\n1. 2024年1月：新产品发布，为后续发展奠定基础\n2. 2024年2月：市场认可度提升，品牌影响力增强\n3. 2024年3月：股价上涨20%，反映市场对公司前景的乐观预期'
        },
        medium: {
          input: '2024年1月：公司发布新产品，投入研发资金5000万元\n2024年2月：产品获得市场认可，订单量增长30%\n2024年3月：股价上涨20%，市值突破100亿元\n2024年4月：与多家企业达成合作协议\n2024年5月：产品出口海外，国际化战略启动',
          expectedOutput: '时间线分析：\n1. 2024年1月：新产品发布，投入研发资金5000万元，为后续发展奠定基础\n2. 2024年2月：产品获得市场认可，订单量增长30%，市场反响积极\n3. 2024年3月：股价上涨20%，市值突破100亿元，投资者信心增强\n4. 2024年4月：与多家企业达成合作协议，业务拓展加速\n5. 2024年5月：产品出口海外，国际化战略启动，发展进入新阶段'
        },
        large: {
          input: '2024年1月：公司发布新产品，投入研发资金5000万元，预计年收入增长50%\n2024年2月：产品获得市场认可，订单量增长30%，客户满意度达95%\n2024年3月：股价上涨20%，市值突破100亿元，成为行业龙头\n2024年4月：与多家企业达成合作协议，业务覆盖全国主要城市\n2024年5月：产品出口海外，国际化战略启动，目标市场包括欧美、东南亚\n2024年6月：获得多项国际认证，产品质量达到国际先进水平',
          expectedOutput: '时间线分析：\n1. 2024年1月：新产品发布，投入研发资金5000万元，预计年收入增长50%，战略布局清晰\n2. 2024年2月：产品获得市场认可，订单量增长30%，客户满意度达95%，市场反响积极\n3. 2024年3月：股价上涨20%，市值突破100亿元，成为行业龙头，投资者信心增强\n4. 2024年4月：与多家企业达成合作协议，业务覆盖全国主要城市，市场拓展加速\n5. 2024年5月：产品出口海外，国际化战略启动，目标市场包括欧美、东南亚，全球化布局\n6. 2024年6月：获得多项国际认证，产品质量达到国际先进水平，竞争力显著提升'
        }
      },
      'historical_attribution': {
        small: {
          input: '事件：央行降准0.5个百分点\n时间：2024年1月15日\n影响：银行股上涨5%',
          expectedOutput: '归因分析：\n1. 直接原因：央行降准释放流动性，降低银行资金成本\n2. 影响机制：降准→银行资金成本下降→净息差改善→盈利能力提升\n3. 归因权重：0.85\n4. 置信度：0.90'
        },
        medium: {
          input: '事件：央行降准0.5个百分点，释放流动性约1万亿元\n时间：2024年1月15日\n影响：银行股上涨5%，地产股上涨3%，科技股上涨2%\n市场背景：经济复苏缓慢，企业融资难问题突出',
          expectedOutput: '归因分析：\n1. 直接原因：央行降准释放流动性，降低银行资金成本\n2. 影响机制：降准→银行资金成本下降→净息差改善→盈利能力提升→股价上涨\n3. 间接影响：流动性增加→地产融资成本下降→地产股受益\n4. 归因权重：0.85\n5. 置信度：0.90\n6. 时间滞后：1-2个交易日'
        },
        large: {
          input: '事件：央行降准0.5个百分点，释放流动性约1万亿元\n时间：2024年1月15日\n影响：银行股上涨5%，地产股上涨3%，科技股上涨2%，上证指数上涨2.5%\n市场背景：经济复苏缓慢，企业融资难问题突出，通胀压力缓解\n政策背景：支持实体经济发展，缓解企业融资难问题',
          expectedOutput: '归因分析：\n1. 直接原因：央行降准释放流动性，降低银行资金成本\n2. 影响机制：降准→银行资金成本下降→净息差改善→盈利能力提升→股价上涨\n3. 间接影响：流动性增加→地产融资成本下降→地产股受益\n4. 市场影响：流动性增加→风险偏好提升→科技股受益\n5. 归因权重：0.85\n6. 置信度：0.90\n7. 时间滞后：1-2个交易日\n8. 影响范围：银行、地产、科技、整体市场'
        }
      }
    };

    return testData[taskType]?.[inputSize] || {
      input: '测试输入内容',
      expectedOutput: '测试输出内容'
    };
  }

  /**
   * 模拟LLM调用
   */
  async simulateLLMCall(
    input: string,
    model: string,
    provider: string,
    rounds: number
  ): Promise<{ output: string; processingTime: number; quality: number }> {
    // 模拟处理时间（基于轮数和模型复杂度）
    const baseTime = this.getBaseProcessingTime(model, provider);
    const processingTime = baseTime * rounds + Math.random() * 1000; // 添加随机延迟
    
    // 模拟输出内容（基于输入长度和轮数）
    const outputLength = Math.round(input.length * 0.8 * rounds); // 输出长度约为输入的80%乘以轮数
    const output = this.generateMockOutput(input, outputLength);
    
    // 模拟质量评分（基于轮数，轮数越多质量越高）
    const quality = Math.min(0.95, 0.7 + (rounds - 1) * 0.1);
    
    return {
      output,
      processingTime,
      quality
    };
  }

  /**
   * 执行单个测试
   */
  async runSingleTest(config: TestConfig): Promise<TokenTestResult[]> {
    const results: TokenTestResult[] = [];
    
    console.log(`🧪 执行测试: ${config.taskType} - ${config.provider}/${config.model} - ${config.rounds}轮`);
    
    for (let i = 0; i < config.sampleSize; i++) {
      for (const inputSize of config.inputSizes) {
        const testData = this.generateTestData(config.taskType, inputSize);
        
        try {
          const { output, processingTime, quality } = await this.simulateLLMCall(
            testData.input,
            config.model,
            config.provider,
            config.rounds
          );
          
          const result = this.calculator.recordTokenUsage(
            config.taskType,
            config.model,
            config.provider,
            config.rounds,
            testData.input,
            output,
            processingTime,
            quality
          );
          
          results.push(result);
          
          console.log(`  ✅ 样本 ${i + 1}/${config.sampleSize} (${inputSize}): ${result.totalTokens} tokens, ${result.cost.toFixed(4)}元`);
          
          // 添加延迟避免过快执行
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`  ❌ 样本 ${i + 1} 失败:`, error);
        }
      }
    }
    
    return results;
  }

  /**
   * 执行测试套件
   */
  async runTestSuite(suiteName: string): Promise<TokenTestResult[]> {
    const suite = this.testSuites.find(s => s.name === suiteName);
    if (!suite) {
      throw new Error(`测试套件 ${suiteName} 不存在`);
    }
    
    console.log(`🚀 开始执行测试套件: ${suite.name}`);
    console.log(`📝 描述: ${suite.description}`);
    console.log(`📊 测试数量: ${suite.tests.length}`);
    
    const allResults: TokenTestResult[] = [];
    
    for (const test of suite.tests) {
      const results = await this.runSingleTest(test);
      allResults.push(...results);
    }
    
    console.log(`✅ 测试套件 ${suite.name} 完成，共收集 ${allResults.length} 个样本`);
    
    return allResults;
  }

  /**
   * 执行所有测试套件
   */
  async runAllTests(): Promise<TokenTestResult[]> {
    console.log('🚀 开始执行所有测试套件');
    
    const allResults: TokenTestResult[] = [];
    
    for (const suite of this.testSuites) {
      const results = await this.runTestSuite(suite.name);
      allResults.push(...results);
    }
    
    console.log(`✅ 所有测试完成，共收集 ${allResults.length} 个样本`);
    
    return allResults;
  }

  /**
   * 生成测试报告
   */
  generateTestReport(): string {
    const summary = this.calculator.getTestResultsSummary();
    const benchmarks = this.calculator.getAllBenchmarks();
    
    let report = '# Token消耗测试报告\n\n';
    report += `**测试时间**: ${new Date().toLocaleString()}\n`;
    report += `**总测试数**: ${summary.totalTests}\n`;
    report += `**总Token消耗**: ${summary.totalTokens.toLocaleString()}\n`;
    report += `**总成本**: ${summary.totalCost.toFixed(4)}元\n`;
    report += `**平均质量**: ${(summary.avgQuality * 100).toFixed(1)}%\n\n`;
    
    report += '## 按任务类型统计\n\n';
    report += '| 任务类型 | 测试数 | 总Tokens | 总成本(元) | 平均质量 |\n';
    report += '|----------|--------|----------|------------|----------|\n';
    
    Object.entries(summary.byTaskType).forEach(([taskType, stats]) => {
      report += `| ${taskType} | ${stats.count} | ${stats.totalTokens.toLocaleString()} | ${stats.totalCost.toFixed(4)} | ${(stats.avgQuality * 100).toFixed(1)}% |\n`;
    });
    
    report += '\n## 按模型统计\n\n';
    report += '| 模型 | 测试数 | 总Tokens | 总成本(元) | 平均质量 |\n';
    report += '|------|--------|----------|------------|----------|\n';
    
    Object.entries(summary.byModel).forEach(([model, stats]) => {
      report += `| ${model} | ${stats.count} | ${stats.totalTokens.toLocaleString()} | ${stats.totalCost.toFixed(4)} | ${(stats.avgQuality * 100).toFixed(1)}% |\n`;
    });
    
    report += '\n## 基准数据\n\n';
    report += '| 任务类型 | 模型 | 轮数 | 平均输入Tokens | 平均输出Tokens | 平均总Tokens | 平均成本(元) | 样本数 | 置信度 |\n';
    report += '|----------|------|------|----------------|----------------|--------------|-------------|--------|--------|\n';
    
    benchmarks.forEach(benchmark => {
      report += `| ${benchmark.taskType} | ${benchmark.provider}/${benchmark.model} | ${benchmark.rounds} | ${benchmark.avgInputTokens.toFixed(0)} | ${benchmark.avgOutputTokens.toFixed(0)} | ${benchmark.avgTotalTokens.toFixed(0)} | ${benchmark.avgCost.toFixed(4)} | ${benchmark.sampleSize} | ${(benchmark.confidence * 100).toFixed(1)}% |\n`;
    });
    
    return report;
  }

  /**
   * 获取基础处理时间
   */
  private getBaseProcessingTime(model: string, provider: string): number {
    const baseTimes: Record<string, number> = {
      'doubao-seed-1-6-flash-250615': 1000,
      'doubao-seed-1-6-250615': 2000,
      'doubao-seed-1-6-pro-250615': 3000,
      'hunyuan-standard': 1500,
      'hunyuan-t1-latest': 2000,
      'hunyuan-turbo-latest': 2500,
      'gemini-2.5-flash': 800,
      'gemini-2.5-pro': 2000
    };
    
    return baseTimes[model] || 1500;
  }

  /**
   * 生成模拟输出
   */
  private generateMockOutput(input: string, targetLength: number): string {
    const words = input.split(' ');
    const outputWords = [];
    let currentLength = 0;
    
    while (currentLength < targetLength && outputWords.length < words.length * 2) {
      const randomWord = words[Math.floor(Math.random() * words.length)];
      outputWords.push(randomWord);
      currentLength += randomWord.length;
    }
    
    return outputWords.join(' ') + '。';
  }
}

// 导出单例实例
export const tokenTester = new TokenTester();

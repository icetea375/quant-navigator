/**
 * 统一LLM配置
 * 定义项目中所有LLM服务的统一配置格式
 */

export interface LLMProvider {
  name: string;
  type: 'openai_compatible' | 'tencent' | 'volc' | 'google' | 'anthropic' | 'qwen';
  apiKey: string;
  baseUrl: string;
  models: string[];
  priority: number;
  timeout: number;
  maxRetries: number;
  enabled: boolean;
  pricing?: {
    inputTokensPerYuan: number;  // 每元可购买的输入token数
    outputTokensPerYuan: number; // 每元可购买的输出token数
    description: string;         // 价格描述
  };
  modelPricing?: {
    [modelName: string]: {
      inputTokensPerYuan: number;
      outputTokensPerYuan: number;
      description: string;
    };
  };
  apiConfig?: {
    modelType: string;
    version: string;
    supportedFeatures: string[];
    maxTokens: number;
    temperature: { min: number; max: number; default: number };
    topP: { min: number; max: number; default: number };
    frequencyPenalty: { min: number; max: number; default: number };
    presencePenalty: { min: number; max: number; default: number };
    stopSequences: boolean;
    streaming: boolean;
    rateLimit: {
      requestsPerMinute: number;
      tokensPerMinute: number;
    };
  };
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  timeout?: number;
  retries?: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
  finishReason: string;
  responseTime: number;
  timestamp: number;
}

export interface HealthStatus {
  provider: string;
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
  lastCheck: number;
  responseTime?: number;
  errorCount: number;
  successCount: number;
}

/**
 * 统一LLM配置
 * 支持多种LLM提供商，统一配置格式
 */
export const UNIFIED_LLM_CONFIG: Record<string, LLMProvider> = {
  // 豆包（字节跳动）
  doubao: {
    name: '豆包',
    type: 'openai_compatible',
    apiKey: process.env.DOUBAO_API_KEY || '',
    baseUrl: process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
    models: [
      'doubao-seed-1-6-250615',
      'doubao-seed-1-6-flash-250615',
      'doubao-seed-1-6-pro-250615'
    ],
    priority: 1,
    timeout: parseInt(process.env.LLM_TIMEOUT || '30000'),
    maxRetries: parseInt(process.env.LLM_MAX_RETRIES || '3'),
    enabled: !!process.env.DOUBAO_API_KEY,
    pricing: {
      inputTokensPerYuan: 5000000,  // 约0.2元/百万tokens
      outputTokensPerYuan: 2500000, // 约0.4元/百万tokens
      description: '字节跳动豆包，中文能力强，价格适中'
    },
    modelPricing: {
      'doubao-seed-1-6-250615': {
        inputTokensPerYuan: 1666667,  // 0.6元/百万tokens
        outputTokensPerYuan: 454545,  // 2.2元/百万tokens
        description: '豆包标准版，平衡性能与成本'
      },
      'doubao-seed-1-6-flash-250615': {
        inputTokensPerYuan: 3333333,  // 0.3元/百万tokens
        outputTokensPerYuan: 909091,  // 1.1元/百万tokens
        description: '豆包Flash版，快速版（最经济）'
      },
      'doubao-seed-1-6-pro-250615': {
        inputTokensPerYuan: 833333,   // 1.2元/百万tokens
        outputTokensPerYuan: 227273,  // 4.4元/百万tokens
        description: '豆包Pro版，专业版（高质量）'
      }
    }
  },

  // 腾讯混元
  hunyuan: {
    name: '腾讯混元',
    type: 'openai_compatible',
    apiKey: process.env.HUNYUAN_API_KEY || '',
    baseUrl: process.env.HUNYUAN_API_BASE || 'https://api.hunyuan.cloud.tencent.com/v1',
    models: [
      'hunyuan-t1-latest',
      'hunyuan-turbo-latest',
      'hunyuan-functioncall'
    ],
    priority: 2,
    timeout: parseInt(process.env.LLM_TIMEOUT || '30000'),
    maxRetries: parseInt(process.env.LLM_MAX_RETRIES || '3'),
    enabled: !!process.env.HUNYUAN_API_KEY,
    pricing: {
      inputTokensPerYuan: 3333333,  // 约0.3元/百万tokens
      outputTokensPerYuan: 1666667, // 约0.6元/百万tokens
      description: '腾讯混元，企业级服务，稳定性好'
    },
    modelPricing: {
      'hunyuan-t1-latest': {
        inputTokensPerYuan: 1000000,  // 1.0元/百万tokens
        outputTokensPerYuan: 250000,  // 4.0元/百万tokens
        description: '混元T1，标准版'
      },
      'hunyuan-turbo-latest': {
        inputTokensPerYuan: 416667,   // 2.4元/百万tokens
        outputTokensPerYuan: 104167,  // 9.6元/百万tokens
        description: '混元Turbo，加速版'
      },
      'hunyuan-functioncall': {
        inputTokensPerYuan: 250000,   // 4.0元/百万tokens
        outputTokensPerYuan: 125000,  // 8.0元/百万tokens
        description: '混元Function Call，函数调用版'
      }
    }
  },

  // Google Gemini
  gemini: {
    name: 'Google Gemini',
    type: 'google',
    apiKey: process.env.GOOGLE_API_KEY || '',
    baseUrl: process.env.GOOGLE_API_BASE || 'https://generativelanguage.googleapis.com/v1beta',
    models: [
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-image-preview'
    ],
    priority: 3,
    timeout: parseInt(process.env.LLM_TIMEOUT || '30000'),
    maxRetries: parseInt(process.env.LLM_MAX_RETRIES || '3'),
    enabled: !!process.env.GOOGLE_API_KEY,
    pricing: {
      inputTokensPerYuan: 2000000,  // 约0.5元/百万tokens
      outputTokensPerYuan: 1000000, // 约1元/百万tokens
      description: 'Google Gemini，国际领先，多模态能力强'
    },
    modelPricing: {
      'gemini-2.5-pro': {
        inputTokensPerYuan: 111111,   // 9.0元/百万tokens
        outputTokensPerYuan: 13889,   // 72.0元/百万tokens
        description: 'Gemini 2.5 Pro，专业版（高质量）'
      },
      'gemini-2.5-flash': {
        inputTokensPerYuan: 462963,   // 2.16元/百万tokens
        outputTokensPerYuan: 55556,   // 18.0元/百万tokens
        description: 'Gemini 2.5 Flash，快速版'
      },
      'gemini-2.5-flash-image-preview': {
        inputTokensPerYuan: 462963,   // 2.16元/百万tokens
        outputTokensPerYuan: 55556,   // 18.0元/百万tokens
        description: 'Gemini 2.5 Flash图像版，图像预览版'
      }
    }
  },

  // 通义千问 - 阿里云大模型服务
  qwen: {
    name: '通义千问',
    type: 'qwen',
    apiKey: process.env.QWEN_API_KEY || 'sk-f8972859c3fc4226bc3a4c17f9b91ffe',
    baseUrl: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1',
    models: [
      'qwen3-max',     // 适合复杂任务，能力最强
      'qwen3-plus',    // 效果、速度、成本均衡
      'qwen3-flash'    // 适合简单任务，速度快、成本低
    ],
    priority: 4,
    timeout: parseInt(process.env.LLM_TIMEOUT || '30000'),
    maxRetries: parseInt(process.env.LLM_MAX_RETRIES || '3'),
    enabled: !!process.env.QWEN_API_KEY,
    pricing: {
      inputTokensPerYuan: 4000000,  // 约0.25元/百万tokens (平均)
      outputTokensPerYuan: 2000000, // 约0.5元/百万tokens (平均)
      description: '通义千问系列模型，支持多种任务类型'
    },
    modelPricing: {
      'qwen3-max': {
        inputTokensPerYuan: 166667,   // 6.0元/百万tokens
        outputTokensPerYuan: 41667,   // 24.0元/百万tokens
        description: '通义千问3 Max，旗舰版'
      },
      'qwen3-plus': {
        inputTokensPerYuan: 1250000,  // 0.8元/百万tokens
        outputTokensPerYuan: 1250000, // 0.8元/百万tokens
        description: '通义千问3 Plus，均衡版'
      },
      'qwen3-flash': {
        inputTokensPerYuan: 6666667,  // 0.15元/百万tokens
        outputTokensPerYuan: 6666667, // 0.15元/百万tokens
        description: '通义千问3 Flash，快速版'
      }
    },
    // API配置中心记录的关键参数
    apiConfig: {
      modelType: 'qwen',
      version: 'v1',
      supportedFeatures: ['chat', 'completion', 'function_call'],
      maxTokens: 8000,
      temperature: { min: 0, max: 2, default: 0.7 },
      topP: { min: 0, max: 1, default: 0.9 },
      frequencyPenalty: { min: -2, max: 2, default: 0 },
      presencePenalty: { min: -2, max: 2, default: 0 },
      stopSequences: true,
      streaming: true,
      rateLimit: {
        requestsPerMinute: 60,
        tokensPerMinute: 40000
      }
    }
  },

};

/**
 * 获取可用的LLM提供商
 */
export function getAvailableProviders(): LLMProvider[] {
  return Object.values(UNIFIED_LLM_CONFIG).filter(provider => provider.enabled);
}

/**
 * 根据优先级获取LLM提供商
 */
export function getProvidersByPriority(): LLMProvider[] {
  return getAvailableProviders().sort((a, b) => a.priority - b.priority);
}

/**
 * AI军团三梯队定义
 */
export const AI_FORCE_STRUCTURE = {
  // 第一梯队：战略决胜部队 (Strategic Force)
  STRATEGIC_FORCE: {
    models: ['gemini-2.5-pro', 'doubao-seed-1-6-pro-250615'],
    characteristics: '能力最强，成本最高昂',
    principle: '非必要，不动用',
    usage: '只用于对系统最终输出质量有决定性影响的极少数核心任务'
  },

  // 第二梯队：战术核心部队 (Tactical Force)
  TACTICAL_FORCE: {
    models: ['qwen3-plus', 'doubao-seed-1-6-250615', 'hunyuan-t1-latest'],
    characteristics: '能力与成本的甜点，性价比极高',
    principle: '主力军',
    usage: '承担系统中绝大部分的常规分析和内容生成任务'
  },

  // 第三梯队：快速反应部队 (Rapid-Response Force)
  RAPID_RESPONSE_FORCE: {
    models: ['qwen3-flash', 'doubao-seed-1-6-flash-250615', 'hunyuan-turbo-latest'],
    characteristics: '速度极快，成本极低，但深度思考能力有限',
    principle: '炮灰或侦察兵',
    usage: '用于处理海量的、简单的、结构化的预处理任务'
  }
};

/**
 * 任务-模型映射的作战计划表
 */
export const TASK_MODEL_MAPPING = {
  // MD&A结构化 - 死板的"表格填充员"
  'mda_extraction': {
    description: 'MD&A结构化提取，中等复杂度，长文本',
    primary: { model: 'qwen3-plus', reason: '价格优势碾压性(¥0.8 vs ¥2.2)，支持Batch模式' },
    fallback: { model: 'doubao-seed-1-6-250615', reason: '备用选择' },
    force: 'TACTICAL_FORCE',
    enableBatch: true,
    qualityLevels: {
      normal: 'qwen3-plus',
      high: 'doubao-seed-1-6-250615'
    }
  },

  // 事件链构建 - 严谨的"历史学家"
  'event_chain_building': {
    description: '事件链构建，中等偏高复杂度',
    primary: { model: 'qwen3-plus', reason: '信息整理范畴，性价比最佳' },
    fallback: { model: 'hunyuan-t1-latest', reason: '联网能力，处理复杂跨事件逻辑' },
    force: 'TACTICAL_FORCE',
    enableBatch: false,
    qualityLevels: {
      normal: 'qwen3-plus',
      high: 'hunyuan-t1-latest'
    }
  },

  // 新闻重要性评分(第一层) - 快速的"标签员"
  'news_classification': {
    description: '新闻重要性评分第一层标签分类，低复杂度，海量',
    primary: { model: 'qwen3-flash', reason: '海量简单分类任务，¥0.15成本极低' },
    fallback: { model: 'doubao-seed-1-6-flash-250615', reason: '备用快速模型' },
    force: 'RAPID_RESPONSE_FORCE',
    enableBatch: true,
    qualityLevels: {
      normal: 'qwen3-flash',
      high: 'doubao-seed-1-6-flash-250615'
    }
  },

  // 新闻重要性评分(第二层) - 需要市场知识的"分析师"
  'news_importance_analysis': {
    description: '新闻重要性评分第二层预期差分析，高复杂度',
    primary: { model: 'doubao-seed-1-6-250615', reason: '多模态和推理能力均衡，擅长捕捉预期差' },
    fallback: { model: 'qwen3-plus', reason: '成本更低的备选' },
    force: 'TACTICAL_FORCE',
    enableBatch: false,
    qualityLevels: {
      normal: 'doubao-seed-1-6-250615',
      high: 'hunyuan-t1-latest'
    }
  },

  // 归因-学习闭环诊断 - 能自我反思的"AI模型诊断专家"
  'attribution_diagnosis': {
    description: '归因-学习闭环诊断，高复杂度，需要联网',
    primary: { model: 'hunyuan-t1-latest', reason: '联网能力提供更全面的诊断视角' },
    fallback: { model: 'doubao-seed-1-6-pro-250615', reason: '高质量备选' },
    force: 'TACTICAL_FORCE',
    enableBatch: false,
    qualityLevels: {
      normal: 'hunyuan-t1-latest',
      high: 'doubao-seed-1-6-pro-250615'
    }
  },

  // 红队AI挑战者 - 富有想象力的"怀疑论者"
  'red_team_challenger': {
    description: '红队AI挑战者，高复杂度，需要联网',
    primary: { model: 'hunyuan-t1-latest', reason: '联网能力是挑战者模式的关键' },
    fallback: { model: 'doubao-seed-1-6-pro-250615', reason: '高质量备选' },
    force: 'TACTICAL_FORCE',
    enableBatch: false,
    qualityLevels: {
      normal: 'hunyuan-t1-latest',
      high: 'doubao-seed-1-6-pro-250615'
    }
  },

  // 最终预测(CIO) - 权衡多种可能的"首席决策官"
  'final_prediction': {
    description: '最终预测CIO决策，最高复杂度',
    primary: { model: 'doubao-seed-1-6-pro-250615', reason: '价值中枢，不应以性价比为首要考量' },
    fallback: { model: 'gemini-2.5-pro', reason: '无与伦比的数学和推理能力，战略预备队' },
    force: 'STRATEGIC_FORCE',
    enableBatch: true,
    qualityLevels: {
      normal: 'doubao-seed-1-6-pro-250615',
      high: 'gemini-2.5-pro'
    }
  }
};

/**
 * 智能成本感知的模型选择器
 */
export function selectModelForTask(
  taskType: keyof typeof TASK_MODEL_MAPPING,
  qualityLevel: 'normal' | 'high' = 'normal',
  enableBatch: boolean = false
): { model: string; provider: string; costLevel: 'low' | 'medium' | 'high'; enableBatch: boolean } | null {
  const taskConfig = TASK_MODEL_MAPPING[taskType];
  if (!taskConfig) {
    return null;
  }

  const selectedModel = qualityLevel === 'high' ? taskConfig.qualityLevels.high : taskConfig.qualityLevels.normal;

  // 查找模型对应的提供商
  let provider = '';
  for (const [providerKey, providerConfig] of Object.entries(UNIFIED_LLM_CONFIG)) {
    if (providerConfig.models.includes(selectedModel)) {
      provider = providerKey;
      break;
    }
  }

  // 确定成本等级
  let costLevel: 'low' | 'medium' | 'high' = 'medium';
  if (taskConfig.force === 'RAPID_RESPONSE_FORCE') costLevel = 'low';
  else if (taskConfig.force === 'STRATEGIC_FORCE') costLevel = 'high';

  return {
    model: selectedModel,
    provider,
    costLevel,
    enableBatch: enableBatch && taskConfig.enableBatch
  };
}

/**
 * 获取默认配置
 */
export function getDefaultOptions(): LLMOptions {
  return {
    temperature: 0.7,
    maxTokens: 2000,
    timeout: 30000,
    retries: 3,
    priority: 'normal'
  };
}

/**
 * 验证配置
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查是否有可用的提供商
  const availableProviders = getAvailableProviders();
  if (availableProviders.length === 0) {
    errors.push('没有可用的LLM提供商，请检查环境变量配置');
  }

  // 检查每个提供商的配置
  Object.entries(UNIFIED_LLM_CONFIG).forEach(([key, provider]) => {
    if (provider.enabled) {
      if (!provider.apiKey) {
        errors.push(`${provider.name} API密钥未设置`);
      }
      if (!provider.baseUrl) {
        errors.push(`${provider.name} API端点未设置`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 获取配置摘要
 */
export function getConfigSummary(): {
  totalProviders: number;
  availableProviders: number;
  providers: Array<{
    name: string;
    enabled: boolean;
    models: string[];
    priority: number;
    pricing?: {
      inputTokensPerYuan: number;
      outputTokensPerYuan: number;
      description: string;
    };
  }>;
} {
  const providers = Object.values(UNIFIED_LLM_CONFIG);
  const availableProviders = providers.filter(p => p.enabled);

  return {
    totalProviders: providers.length,
    availableProviders: availableProviders.length,
    providers: providers.map(p => ({
      name: p.name,
      enabled: p.enabled,
      models: p.models,
      priority: p.priority,
      pricing: p.pricing
    }))
  };
}

/**
 * 计算LLM使用成本
 */
export function calculateCost(
  provider: string,
  inputTokens: number,
  outputTokens: number
): { cost: number; breakdown: { inputCost: number; outputCost: number } } {
  const config = UNIFIED_LLM_CONFIG[provider];
  if (!config || !config.pricing) {
    return { cost: 0, breakdown: { inputCost: 0, outputCost: 0 } };
  }

  const inputCost = inputTokens / config.pricing.inputTokensPerYuan;
  const outputCost = outputTokens / config.pricing.outputTokensPerYuan;
  const totalCost = inputCost + outputCost;

  return {
    cost: totalCost,
    breakdown: {
      inputCost,
      outputCost
    }
  };
}

/**
 * 获取所有提供商的价格对比
 */
export function getPricingComparison(): Array<{
  name: string;
  enabled: boolean;
  pricing: {
    inputTokensPerYuan: number;
    outputTokensPerYuan: number;
    description: string;
  };
  costPer1MInput: number;
  costPer1MOutput: number;
}> {
  return Object.values(UNIFIED_LLM_CONFIG)
    .filter(p => p.pricing)
    .map(p => ({
      name: p.name,
      enabled: p.enabled,
      pricing: p.pricing!,
      costPer1MInput: 1000000 / p.pricing!.inputTokensPerYuan,
      costPer1MOutput: 1000000 / p.pricing!.outputTokensPerYuan
    }))
    .sort((a, b) => a.costPer1MInput - b.costPer1MInput);
}

/**
 * 获取所有模型的详细价格对比
 */
export function getModelPricingComparison(): Array<{
  provider: string;
  model: string;
  enabled: boolean;
  inputPrice: number;
  outputPrice: number;
  description: string;
  costLevel: 'high' | 'medium' | 'low';
}> {
  const modelPricing: Array<{
    provider: string;
    model: string;
    enabled: boolean;
    inputPrice: number;
    outputPrice: number;
    description: string;
    costLevel: 'high' | 'medium' | 'low';
  }> = [];

  Object.entries(UNIFIED_LLM_CONFIG).forEach(([providerKey, provider]) => {
    if (provider.modelPricing) {
      Object.entries(provider.modelPricing).forEach(([model, pricing]) => {
        const inputPrice = 1000000 / pricing.inputTokensPerYuan;
        const outputPrice = 1000000 / pricing.outputTokensPerYuan;

        let costLevel: 'high' | 'medium' | 'low' = 'medium';
        if (inputPrice <= 0.2) costLevel = 'low';
        else if (inputPrice >= 0.5) costLevel = 'high';

        modelPricing.push({
          provider: provider.name,
          model,
          enabled: provider.enabled,
          inputPrice,
          outputPrice,
          description: pricing.description,
          costLevel
        });
      });
    }
  });

  return modelPricing.sort((a, b) => a.inputPrice - b.inputPrice);
}

/**
 * 根据模型名称获取价格信息
 */
export function getModelPricing(provider: string, model: string): {
  inputPrice: number;
  outputPrice: number;
  description: string;
} | null {
  const config = UNIFIED_LLM_CONFIG[provider];
  if (!config || !config.modelPricing || !config.modelPricing[model]) {
    return null;
  }

  const pricing = config.modelPricing[model];
  return {
    inputPrice: 1000000 / pricing.inputTokensPerYuan,
    outputPrice: 1000000 / pricing.outputTokensPerYuan,
    description: pricing.description
  };
}

/**
 * Batch模式成本优化机制
 */
export interface BatchRequest {
  id: string;
  taskType: keyof typeof TASK_MODEL_MAPPING;
  prompt: string;
  qualityLevel: 'normal' | 'high';
  timestamp: number;
  priority: number;
}

export interface BatchQueue {
  [model: string]: BatchRequest[];
}

export class BatchOptimizer {
  private queues: BatchQueue = {};
  private batchSize: number = 10; // 批处理大小
  private batchTimeout: number = 5000; // 5秒超时
  private timers: { [model: string]: NodeJS.Timeout } = {};

  /**
   * 添加请求到批处理队列
   */
  addToBatch(request: BatchRequest): Promise<string> {
    const taskConfig = TASK_MODEL_MAPPING[request.taskType];
    if (!taskConfig || !taskConfig.enableBatch) {
      // 不支持批处理，立即执行
      return this.executeImmediate(request);
    }

    const selectedModel = request.qualityLevel === 'high'
      ? taskConfig.qualityLevels.high
      : taskConfig.qualityLevels.normal;

    if (!this.queues[selectedModel]) {
      this.queues[selectedModel] = [];
    }

    this.queues[selectedModel].push(request);

    // 检查是否达到批处理大小
    if (this.queues[selectedModel].length >= this.batchSize) {
      this.processBatch(selectedModel);
    }

    // 设置超时定时器
    if (!this.timers[selectedModel]) {
      this.timers[selectedModel] = setTimeout(() => {
        this.processBatch(selectedModel);
      }, this.batchTimeout);
    }

    return Promise.resolve(request.id);
  }

  /**
   * 处理批处理队列
   */
  private async processBatch(model: string): Promise<string[]> {
    const requests = this.queues[model] || [];
    if (requests.length === 0) return [];

    // 清空队列
    this.queues[model] = [];

    // 清除定时器
    if (this.timers[model]) {
      clearTimeout(this.timers[model]);
      delete this.timers[model];
    }

    // 按优先级排序
    requests.sort((a, b) => b.priority - a.priority);

    // 执行批处理请求
    const results = await this.executeBatch(model, requests);

    return results;
  }

  /**
   * 执行批处理请求
   */
  private async executeBatch(model: string, requests: BatchRequest[]): Promise<string[]> {
    // 这里应该调用实际的批处理API
    // 对于支持Batch的提供商（千问、Gemini），使用50%的价格
    console.log(`🚀 执行批处理: ${model}, 请求数量: ${requests.length}, 成本优化: 50%`);

    // 模拟批处理执行
    const results = requests.map(req => req.id);

    // 记录成本节省
    this.logCostSavings(model, requests.length);

    return results;
  }

  /**
   * 立即执行请求（非批处理）
   */
  private async executeImmediate(request: BatchRequest): Promise<string> {
    console.log(`⚡ 立即执行: ${request.taskType}, 质量等级: ${request.qualityLevel}`);
    return request.id;
  }

  /**
   * 记录成本节省
   */
  private logCostSavings(model: string, requestCount: number): void {
    // 计算批处理节省的成本
    const savings = requestCount * 0.5; // 50%节省
    console.log(`💰 批处理成本节省: ${model} 节省 ${savings} 个请求的成本`);
  }

  /**
   * 获取批处理统计
   */
  getBatchStats(): { [model: string]: { queueSize: number; totalProcessed: number } } {
    const stats: { [model: string]: { queueSize: number; totalProcessed: number } } = {};

    Object.keys(this.queues).forEach(model => {
      stats[model] = {
        queueSize: this.queues[model].length,
        totalProcessed: 0 // 这里应该从实际统计中获取
      };
    });

    return stats;
  }
}

// 全局批处理优化器实例
export const batchOptimizer = new BatchOptimizer();

/**
 * 获取API配置中心的关键参数
 */
export function getApiConfig(provider: string): any {
  const config = UNIFIED_LLM_CONFIG[provider];
  return config?.apiConfig || null;
}

/**
 * 获取通义千问模型的API配置参数
 */
export function getQwenApiConfig(): {
  modelType: string;
  version: string;
  supportedFeatures: string[];
  maxTokens: number;
  temperature: { min: number; max: number; default: number };
  topP: { min: number; max: number; default: number };
  frequencyPenalty: { min: number; max: number; default: number };
  presencePenalty: { min: number; max: number; default: number };
  stopSequences: boolean;
  streaming: boolean;
  rateLimit: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
} | null {
  return getApiConfig('qwen');
}

/**
 * 验证API参数是否在允许范围内
 */
export function validateApiParams(
  provider: string,
  params: {
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    maxTokens?: number;
  }
): { valid: boolean; errors: string[] } {
  const apiConfig = getApiConfig(provider);
  if (!apiConfig) {
    return { valid: false, errors: ['提供商不支持API配置验证'] };
  }

  const errors: string[] = [];

  if (params.temperature !== undefined) {
    if (params.temperature < apiConfig.temperature.min || params.temperature > apiConfig.temperature.max) {
      errors.push(`temperature必须在${apiConfig.temperature.min}-${apiConfig.temperature.max}之间`);
    }
  }

  if (params.topP !== undefined) {
    if (params.topP < apiConfig.topP.min || params.topP > apiConfig.topP.max) {
      errors.push(`topP必须在${apiConfig.topP.min}-${apiConfig.topP.max}之间`);
    }
  }

  if (params.frequencyPenalty !== undefined) {
    if (params.frequencyPenalty < apiConfig.frequencyPenalty.min || params.frequencyPenalty > apiConfig.frequencyPenalty.max) {
      errors.push(`frequencyPenalty必须在${apiConfig.frequencyPenalty.min}-${apiConfig.frequencyPenalty.max}之间`);
    }
  }

  if (params.presencePenalty !== undefined) {
    if (params.presencePenalty < apiConfig.presencePenalty.min || params.presencePenalty > apiConfig.presencePenalty.max) {
      errors.push(`presencePenalty必须在${apiConfig.presencePenalty.min}-${apiConfig.presencePenalty.max}之间`);
    }
  }

  if (params.maxTokens !== undefined) {
    if (params.maxTokens > apiConfig.maxTokens) {
      errors.push(`maxTokens不能超过${apiConfig.maxTokens}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

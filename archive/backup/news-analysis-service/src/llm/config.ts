/**
 * 统一LLM配置
 * 定义项目中所有LLM服务的统一配置格式
 */

export interface ModelPricing {
  inputPricePerMillion: number;  // 每百万输入tokens价格（元）
  outputPricePerMillion: number; // 每百万输出tokens价格（元）
}

export interface LLMTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: object;
  };
}

export interface LLMProvider {
  name: string;
  type: 'openai_compatible' | 'tencent' | 'volc' | 'google' | 'anthropic';
  apiKey: string;
  baseUrl: string;
  models: string[];
  priority: number;
  timeout: number;
  maxRetries: number;
  enabled: boolean;
  modelPricing: Record<string, ModelPricing>; // 每个模型的具体价格
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  timeout?: number;
  retries?: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  tools?: LLMTool[];
  toolChoice?: string | object;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  presencePenalty?: number;
  frequencyPenalty?: number;
  user?: string;
  responseFormat?: {
    type: 'json_object' | 'text';
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
  systemInstruction?: {
    parts: Array<{
      text: string;
    }>;
  };
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
    apiKey: process.env.ARK_API_KEY || '',
    baseUrl: process.env.ARK_API_BASE || 'https://ark.cn-beijing.volces.com/api/v3',
    models: [
      'doubao-seed-1-6-250615',
      'doubao-seed-1-6-flash-250615',
      'doubao-seed-1-6-pro-250615'
    ],
    priority: 1,
    timeout: parseInt(process.env.LLM_TIMEOUT || '30000'),
    maxRetries: parseInt(process.env.LLM_MAX_RETRIES || '3'),
    enabled: !!process.env.ARK_API_KEY,
    modelPricing: {
      'doubao-seed-1-6-250615': {
        inputPricePerMillion: 0.6,
        outputPricePerMillion: 2.2
      },
      'doubao-seed-1-6-flash-250615': {
        inputPricePerMillion: 0.3,
        outputPricePerMillion: 1.1
      },
      'doubao-seed-1-6-pro-250615': {
        inputPricePerMillion: 1.2,
        outputPricePerMillion: 4.4
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
    modelPricing: {
      'hunyuan-t1-latest': {
        inputPricePerMillion: 1.0,
        outputPricePerMillion: 4.0
      },
      'hunyuan-turbo-latest': {
        inputPricePerMillion: 2.4,
        outputPricePerMillion: 9.6
      },
      'hunyuan-functioncall': {
        inputPricePerMillion: 4.0,
        outputPricePerMillion: 8.0
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
    modelPricing: {
      'gemini-2.5-pro': {
        inputPricePerMillion: 9.0,  // $1.25 * 7.2 = 9.0元/百万tokens
        outputPricePerMillion: 72.0  // $10.00 * 7.2 = 72.0元/百万tokens
      },
      'gemini-2.5-flash': {
        inputPricePerMillion: 2.16,  // $0.30 * 7.2 = 2.16元/百万tokens
        outputPricePerMillion: 18.0  // $2.50 * 7.2 = 18.0元/百万tokens
      },
      'gemini-2.5-flash-image-preview': {
        inputPricePerMillion: 2.16,  // $0.30 * 7.2 = 2.16元/百万tokens
        outputPricePerMillion: 18.0  // $2.50 * 7.2 = 18.0元/百万tokens
      },
      'gemini-1.5-pro': {
        inputPricePerMillion: 9.0,   // $1.25 * 7.2 = 9.0元/百万tokens
        outputPricePerMillion: 36.0  // $5.00 * 7.2 = 36.0元/百万tokens
      },
      'gemini-1.5-flash': {
        inputPricePerMillion: 0.54,  // $0.075 * 7.2 = 0.54元/百万tokens
        outputPricePerMillion: 2.16  // $0.30 * 7.2 = 2.16元/百万tokens
      },
      'gemini-1.5-flash-8b': {
        inputPricePerMillion: 0.27,  // $0.0375 * 7.2 = 0.27元/百万tokens
        outputPricePerMillion: 1.08  // $0.15 * 7.2 = 1.08元/百万tokens
      }
    }
  }
};

/**
 * 获取可用的LLM提供商
 */
export function getAvailableProviders(): LLMProvider[] {
  // 重新构建配置，确保环境变量已加载
  const config = buildUnifiedConfig();
  return Object.values(config).filter(provider => provider.enabled);
}

/**
 * 构建统一配置
 */
function buildUnifiedConfig(): Record<string, LLMProvider> {
  return {
    // 豆包（字节跳动）
    doubao: {
      name: '豆包',
      type: 'openai_compatible',
      apiKey: process.env.ARK_API_KEY || '',
      baseUrl: process.env.ARK_API_BASE || 'https://ark.cn-beijing.volces.com/api/v3',
      models: [
        'doubao-seed-1-6-250615',
        'doubao-seed-1-6-flash-250615',
        'doubao-seed-1-6-pro-250615'
      ],
      priority: 1,
      timeout: parseInt(process.env.LLM_TIMEOUT || '30000'),
      maxRetries: parseInt(process.env.LLM_MAX_RETRIES || '3'),
      enabled: !!process.env.ARK_API_KEY,
      modelPricing: {
        'doubao-seed-1-6-250615': {
          inputPricePerMillion: 0.6,
          outputPricePerMillion: 2.2
        },
        'doubao-seed-1-6-flash-250615': {
          inputPricePerMillion: 0.3,
          outputPricePerMillion: 1.1
        },
        'doubao-seed-1-6-pro-250615': {
          inputPricePerMillion: 1.2,
          outputPricePerMillion: 4.4
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
      modelPricing: {
        'hunyuan-t1-latest': {
          inputPricePerMillion: 1.0,
          outputPricePerMillion: 4.0
        },
        'hunyuan-turbo-latest': {
          inputPricePerMillion: 2.4,
          outputPricePerMillion: 9.6
        },
        'hunyuan-functioncall': {
          inputPricePerMillion: 4.0,
          outputPricePerMillion: 8.0
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
      modelPricing: {
        'gemini-2.5-pro': {
          inputPricePerMillion: 9.0,  // $1.25 * 7.2 = 9.0元/百万tokens
          outputPricePerMillion: 72.0  // $10.00 * 7.2 = 72.0元/百万tokens
        },
        'gemini-2.5-flash': {
          inputPricePerMillion: 2.16,  // $0.30 * 7.2 = 2.16元/百万tokens
          outputPricePerMillion: 18.0  // $2.50 * 7.2 = 18.0元/百万tokens
        },
        'gemini-2.5-flash-image-preview': {
          inputPricePerMillion: 2.16,  // $0.30 * 7.2 = 2.16元/百万tokens
          outputPricePerMillion: 18.0  // $2.50 * 7.2 = 18.0元/百万tokens
        },
        'gemini-1.5-pro': {
          inputPricePerMillion: 9.0,   // $1.25 * 7.2 = 9.0元/百万tokens
          outputPricePerMillion: 36.0  // $5.00 * 7.2 = 36.0元/百万tokens
        },
        'gemini-1.5-flash': {
          inputPricePerMillion: 0.54,  // $0.075 * 7.2 = 0.54元/百万tokens
          outputPricePerMillion: 2.16  // $0.30 * 7.2 = 2.16元/百万tokens
        },
        'gemini-1.5-flash-8b': {
          inputPricePerMillion: 0.27,  // $0.0375 * 7.2 = 0.27元/百万tokens
          outputPricePerMillion: 1.08  // $0.15 * 7.2 = 1.08元/百万tokens
        }
      }
    }
  };
}

/**
 * 根据优先级获取LLM提供商
 */
export function getProvidersByPriority(): LLMProvider[] {
  return getAvailableProviders().sort((a, b) => a.priority - b.priority);
}

/**
 * 根据任务类型选择最佳提供商
 */
export function selectProviderForTask(
  taskType: 'content_extraction' | 'data_analysis' | 'chinese_processing' | 'fast_processing' | 'general' | 'etf_analysis'
): LLMProvider | null {
  const providers = getProvidersByPriority();
  
  if (providers.length === 0) {
    return null;
  }

  // 根据任务类型选择最佳提供商
  switch (taskType) {
    case 'content_extraction':
    case 'fast_processing':
      // 优先使用豆包Flash，响应速度快
      return providers.find(p => p.name === '豆包' && p.models.includes('doubao-seed-1-6-flash-250615')) || providers[0];
    
    case 'chinese_processing':
      // 优先使用中文能力强的模型
      return providers.find(p => p.name === '豆包') || providers.find(p => p.name === '腾讯混元') || providers[0];
    
    case 'data_analysis':
    case 'etf_analysis':
      // 优先使用分析能力强的模型
      return providers.find(p => p.name === '豆包' && p.models.includes('doubao-seed-1-6-250615')) || providers[0];
    
    case 'general':
    default:
      return providers[0];
  }
}

/**
 * 获取默认配置
 */
export function getDefaultOptions(): LLMOptions {
  return {
    temperature: 0.7,
    maxTokens: 2000,
    timeout: 60000,
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
 * 获取模型价格
 */
export function getModelPricing(provider: string, model: string): ModelPricing | null {
  const config = buildUnifiedConfig();
  const providerConfig = config[provider];
  
  if (!providerConfig || !providerConfig.modelPricing[model]) {
    return null;
  }
  
  return providerConfig.modelPricing[model];
}

/**
 * 计算LLM调用成本
 */
export function calculateLLMCost(
  provider: string, 
  model: string, 
  inputTokens: number, 
  outputTokens: number
): number {
  const pricing = getModelPricing(provider, model);
  
  if (!pricing) {
    return 0;
  }
  
  const inputCost = (inputTokens / 1000000) * pricing.inputPricePerMillion;
  const outputCost = (outputTokens / 1000000) * pricing.outputPricePerMillion;
  
  return inputCost + outputCost;
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
      priority: p.priority
    }))
  };
}

/**
 * 预定义的工具配置
 */
export const PREDEFINED_TOOLS: Record<string, LLMTool> = {
  // 搜索工具
  search_related_news: {
    type: 'function',
    function: {
      name: 'search_related_news',
      description: '搜索相关新闻和历史数据',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '搜索关键词' },
          time_range: { type: 'string', description: '时间范围' },
          limit: { type: 'number', description: '结果数量限制' }
        },
        required: ['query']
      }
    }
  },

  // 市场数据工具
  get_market_data: {
    type: 'function',
    function: {
      name: 'get_market_data',
      description: '获取市场数据和指标',
      parameters: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: '股票代码' },
          indicators: { type: 'array', description: '技术指标列表' },
          period: { type: 'string', description: '时间周期' }
        },
        required: ['symbol']
      }
    }
  },

  // 分析工具
  analyze_news_impact: {
    type: 'function',
    function: {
      name: 'analyze_news_impact',
      description: '分析新闻对市场的影响',
      parameters: {
        type: 'object',
        properties: {
          news_content: { type: 'string', description: '新闻内容' },
          market_context: { type: 'object', description: '市场背景' },
          analysis_depth: { type: 'string', description: '分析深度' }
        },
        required: ['news_content']
      }
    }
  },

  // 时间线构建工具
  build_timeline: {
    type: 'function',
    function: {
      name: 'build_timeline',
      description: '构建事件时间线',
      parameters: {
        type: 'object',
        properties: {
          events: { type: 'array', description: '事件列表' },
          time_range: { type: 'string', description: '时间范围' },
          granularity: { type: 'string', description: '时间粒度' }
        },
        required: ['events']
      }
    }
  },

  // 事件关联工具
  analyze_event_relations: {
    type: 'function',
    function: {
      name: 'analyze_event_relations',
      description: '分析事件之间的关联性',
      parameters: {
        type: 'object',
        properties: {
          events: { type: 'array', description: '事件列表' },
          relation_type: { type: 'string', description: '关联类型' },
          confidence_threshold: { type: 'number', description: '置信度阈值' }
        },
        required: ['events']
      }
    }
  },

  // 历史数据查询工具
  query_historical_data: {
    type: 'function',
    function: {
      name: 'query_historical_data',
      description: '查询历史数据和事件',
      parameters: {
        type: 'object',
        properties: {
          time_range: { type: 'string', description: '时间范围' },
          data_type: { type: 'string', description: '数据类型' },
          filters: { type: 'object', description: '过滤条件' }
        },
        required: ['time_range', 'data_type']
      }
    }
  },

  // 归因分析工具
  analyze_attribution: {
    type: 'function',
    function: {
      name: 'analyze_attribution',
      description: '分析历史事件的归因关系',
      parameters: {
        type: 'object',
        properties: {
          target_event: { type: 'object', description: '目标事件' },
          candidate_events: { type: 'array', description: '候选事件列表' },
          analysis_method: { type: 'string', description: '分析方法' }
        },
        required: ['target_event', 'candidate_events']
      }
    }
  }
};

/**
 * 获取任务类型的工具配置
 */
export function getToolsForTaskType(taskType: string): LLMTool[] {
  const toolMappings: Record<string, string[]> = {
    'news_importance': ['search_related_news', 'get_market_data', 'analyze_news_impact'],
    'timeline_build': ['search_related_news', 'analyze_news_impact', 'build_timeline', 'analyze_event_relations'],
    'historical_attribution': ['query_historical_data', 'analyze_attribution'],
    'model_adjustment': ['analyze_news_impact', 'get_market_data']
  };

  const toolNames = toolMappings[taskType] || [];
  return toolNames.map(name => PREDEFINED_TOOLS[name]).filter(Boolean);
}

/**
 * 性能基准配置
 */
export const PERFORMANCE_BENCHMARKS = {
  // 响应时间基准 (毫秒)
  response_time: {
    'doubao-seed-1-6-flash-250615': 2000,    // 2秒
    'hunyuan-t1-latest': 3000,               // 3秒
    'doubao-seed-1-6-pro-250615': 4000,     // 4秒
    'gemini-2.5-pro': 8000                   // 8秒
  },
  
  // 成功率基准
  success_rate: {
    'doubao-seed-1-6-flash-250615': 0.95,   // 95%
    'hunyuan-t1-latest': 0.92,              // 92%
    'doubao-seed-1-6-pro-250615': 0.90,    // 90%
    'gemini-2.5-pro': 0.88                  // 88%
  },
  
  // 质量分数基准
  quality_score: {
    'doubao-seed-1-6-flash-250615': 0.75,   // 75%
    'hunyuan-t1-latest': 0.85,              // 85%
    'doubao-seed-1-6-pro-250615': 0.88,    // 88%
    'gemini-2.5-pro': 0.92                  // 92%
  }
};

/**
 * 监控配置
 */
export const MONITORING_CONFIG = {
  // 监控指标
  metrics: {
    response_time: { threshold: 10000, alert: true },    // 10秒阈值
    success_rate: { threshold: 0.9, alert: true },       // 90%阈值
    quality_score: { threshold: 0.8, alert: true },      // 80%阈值
    cost_per_task: { threshold: 0.01, alert: true }      // 0.01元阈值
  },
  
  // 告警配置
  alerts: {
    email: ['admin@example.com'],
    webhook: 'https://hooks.slack.com/...',
    threshold: 3  // 连续3次超阈值才告警
  },
  
  // 自动调优
  auto_tuning: {
    enabled: true,
    adjustment_interval: 3600000,  // 1小时调整一次
    max_adjustment: 0.1            // 最大调整幅度10%
  }
};
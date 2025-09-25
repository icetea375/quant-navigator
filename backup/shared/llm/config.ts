/**
 * 统一LLM配置
 * 定义项目中所有LLM服务的统一配置格式
 */

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
    enabled: !!process.env.ARK_API_KEY
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
    enabled: !!process.env.HUNYUAN_API_KEY
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
    enabled: !!process.env.GOOGLE_API_KEY
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

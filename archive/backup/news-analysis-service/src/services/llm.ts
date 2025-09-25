import axios, { AxiosResponse } from 'axios';
import { DatabaseConnection } from '../database/connection';
import { WebSocketService } from './websocket';
import { 
  UNIFIED_LLM_CONFIG, 
  LLMProvider, 
  LLMOptions as SharedLLMOptions,
  LLMResponse as SharedLLMResponse,
  getAvailableProviders,
  selectProviderForTask,
  getDefaultOptions
} from '../llm/config';

// 使用统一的LLM配置

export interface LLMService {
  name: string;
  apiKey: string;
  baseUrl: string;
  maxTokens: number;
  timeout: number;
  retryCount: number;
}

export interface LLMRequirements {
  maxTokens?: number;
  temperature?: number;
  model?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface LLMOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
  systemPrompt?: string;
  timeout?: number;
  analysisType?: 'quick' | 'standard' | 'deep';
}

export interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
}

export interface LLMServiceStatus {
  serviceName: string;
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
  lastCheck: number;
  responseTime?: number;
  errorCount: number;
  successCount: number;
}

export class LLMServiceManager {
  private static instance: LLMServiceManager | null = null;
  private services: Map<string, LLMService> = new Map();
  private healthStatus: Map<string, boolean> = new Map();
  private db: DatabaseConnection;
  private initialized: boolean = false;
  private wsService: WebSocketService;

  private constructor() {
    this.db = DatabaseConnection.getInstance();
    this.wsService = WebSocketService.getInstance();
  }

  public static getInstance(): LLMServiceManager {
    if (!LLMServiceManager.instance) {
      LLMServiceManager.instance = new LLMServiceManager();
    }
    return LLMServiceManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    await this.initializeServices();
    this.initialized = true;
  }

  private initializeServices(): void {
    try {
      console.log('🔧 开始初始化LLM服务（统一化配置）...');
      
      // 重新获取配置，确保环境变量已加载
      const availableProviders = getAvailableProviders();
      console.log('🔍 获取到的提供商数量:', availableProviders.length);
      console.log('🔍 提供商列表:', availableProviders.map(p => p.name));
      
      // 如果没有可用的提供商，尝试重新加载配置
      if (availableProviders.length === 0) {
        console.log('⚠️ 没有可用的提供商，尝试重新加载配置...');
        // 这里可以添加重新加载配置的逻辑
        console.log('🔍 环境变量检查:');
        console.log('ARK_API_KEY:', process.env.ARK_API_KEY ? '已设置' : '未设置');
        console.log('HUNYUAN_API_KEY:', process.env.HUNYUAN_API_KEY ? '已设置' : '未设置');
        console.log('GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? '已设置' : '未设置');
      }
      
      availableProviders.forEach(provider => {
        console.log(`🚀 初始化${provider.name}服务...`);
        
        try {
          // 使用英文名称作为服务名，便于后续调用
          const serviceName = this.getServiceNameFromProvider(provider);
          this.addService({
            name: serviceName,
            apiKey: provider.apiKey,
            baseUrl: provider.baseUrl,
            maxTokens: 4000,
            timeout: provider.timeout,
            retryCount: provider.maxRetries
          });
          console.log(`✅ ${provider.name}服务初始化成功 (${serviceName})`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error instanceof Error ? error.message : String(error) : '未知错误';
          console.log(`❌ ${provider.name}服务初始化失败:`, errorMessage);
        }
      });
      
      console.log(`🔧 LLM服务初始化完成，总服务数: ${this.services.size}`);
      
      // 输出服务状态摘要
      const availableServices = this.getAvailableServices();
      console.log('📊 可用服务摘要:', {
        total: this.services.size,
        available: availableServices.length,
        services: availableServices.map(s => s.name)
      });
      
    } catch (error) {
      console.error('❌ 初始化LLM服务失败:', error);
    }
  }

  public addService(service: LLMService): void {
    this.services.set(service.name, service);
    this.healthStatus.set(service.name, true);
  }

  public getAvailableServices(): LLMService[] {
    return Array.from(this.services.values())
      .filter(service => this.healthStatus.get(service.name));
  }

  public selectBestService(requirements: LLMRequirements): LLMService | null {
    const availableServices = this.getAvailableServices();
    
    if (availableServices.length === 0) return null;
    
    // 根据任务类型选择最佳提供商
    const taskType = this.getTaskTypeFromRequirements(requirements);
    const selectedProvider = selectProviderForTask(taskType);
    
    if (selectedProvider) {
      // 查找对应的服务
      const service = availableServices.find(s => 
        s.name.toLowerCase() === selectedProvider.name.toLowerCase()
      );
      if (service) return service;
    }
    
    // 回退到原有逻辑
    const rankedServices = this.rankServices(availableServices, requirements);
    return rankedServices.length > 0 ? rankedServices[0] || null : null;
  }

  private getServiceNameFromProvider(provider: LLMProvider): string {
    // 根据提供商名称映射到服务名称
    switch (provider.name) {
      case '豆包': return 'doubao';
      case '腾讯混元': return 'hunyuan';
      case 'Google Gemini': return 'gemini';
      case 'OpenAI': return 'openai';
      case 'Anthropic Claude': return 'claude';
      case 'DeepSeek': return 'deepseek';
      default: return provider.name.toLowerCase();
    }
  }

  private getTaskTypeFromRequirements(requirements: LLMRequirements): 'content_extraction' | 'data_analysis' | 'chinese_processing' | 'fast_processing' | 'general' | 'etf_analysis' {
    // 根据需求特征推断任务类型
    if (requirements.priority === 'urgent' || requirements.priority === 'high') {
      return 'fast_processing';
    }
    
    if (requirements.maxTokens && requirements.maxTokens > 3000) {
      return 'data_analysis';
    }
    
    // 默认为通用任务
    return 'general';
  }

  private rankServices(services: LLMService[], requirements: LLMRequirements): LLMService[] {
    return services.sort((a, b) => {
      // 优先级排序
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
      const aPriority = priorityOrder[requirements.priority || 'normal'] || 2;
      const bPriority = priorityOrder[requirements.priority || 'normal'] || 2;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // 根据最大token数排序
      if (requirements.maxTokens) {
        const aTokens = Math.min(a.maxTokens, requirements.maxTokens);
        const bTokens = Math.min(b.maxTokens, requirements.maxTokens);
        return bTokens - aTokens;
      }
      
      return 0;
    });
  }

  public async checkHealth(serviceName: string): Promise<boolean> {
    try {
      const service = this.services.get(serviceName);
      if (!service) return false;
      
      const startTime = Date.now();
      const response = await axios.get(`${service.baseUrl}/health`, {
        timeout: service.timeout,
        headers: {
          'Authorization': `Bearer ${service.apiKey}`
        }
      });
      
      const responseTime = Date.now() - startTime;
      const isHealthy = response.status === 200;
      
      this.healthStatus.set(serviceName, isHealthy);
      await this.updateServiceStatus(serviceName, isHealthy, responseTime);
      
      return isHealthy;
    } catch (error) {
      this.healthStatus.set(serviceName, false);
      await this.updateServiceStatus(serviceName, false, undefined);
      return false;
    }
  }

  private async updateServiceStatus(
    serviceName: string, 
    isHealthy: boolean, 
    responseTime?: number
  ): Promise<void> {
    const db = this.db.getConnection();
    const now = Date.now();
    
    const status = isHealthy ? 'healthy' : 'unhealthy';
    
    db.prepare(`
      INSERT OR REPLACE INTO llm_service_status 
      (service_name, status, last_check, response_time, error_count, success_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      serviceName,
      status,
      now,
      responseTime || null,
      isHealthy ? 0 : 1,
      isHealthy ? 1 : 0,
      now,
      now
    );
  }

  /**
   * 生成火山引擎API签名
   */
  private generateSignature(stringToSign: string, secretKey: string): string {
    // 使用简单的HMAC-SHA256签名（实际应该使用火山引擎的签名算法）
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(stringToSign);
    return hmac.digest('hex');
  }

  public async callLLM(
    serviceName: string, 
    prompt: string, 
    options: LLMOptions = {}
  ): Promise<LLMResponse> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`LLM服务 ${serviceName} 不存在`);
    }

    console.log(`🔍 开始调用LLM服务: ${serviceName}`);
    console.log(`📝 提示词长度: ${prompt.length} 字符`);
    console.log(`⚙️ 选项:`, JSON.stringify(options, null, 2));
    console.log(`🔧 服务配置:`, {
      baseUrl: service.baseUrl,
      maxTokens: service.maxTokens,
      timeout: service.timeout,
      retryCount: service.retryCount
    });

    let lastError: Error | null = null;
    
    // 减少重试次数，加快调试
    const maxAttempts = 1; // 只尝试1次，加快调试
    
    // 首先尝试指定的服务
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🤖 调用${serviceName}服务 (第${attempt}次尝试)...`);
        console.log(`🌐 请求URL: ${service.baseUrl}/chat/completions`);
        
        const response = await this.makeRequest(service, prompt, options);
        await this.updateServiceStatus(serviceName, true);
        
        console.log(`✅ ${serviceName}服务调用成功`);
        console.log(`📊 响应统计:`, {
          contentLength: response.content?.length || 0,
          totalTokens: response.usage?.totalTokens || 0,
          promptTokens: response.usage?.promptTokens || 0,
          completionTokens: response.usage?.completionTokens || 0
        });
        
        return response;
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ ${serviceName}服务第${attempt}次调用失败:`);
        console.error(`   错误类型: ${error instanceof Error ? error.constructor.name : typeof error}`);
        console.error(`   错误消息: ${error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)}`);
        
        // 如果是HTTP错误，显示更多详情
        if (error && typeof error === 'object' && 'response' in error) {
          const httpError = error as any;
          console.error(`   HTTP状态码: ${httpError.response?.status}`);
          console.error(`   HTTP状态文本: ${httpError.response?.statusText}`);
          console.error(`   响应头:`, httpError.response?.headers);
          console.error(`   响应数据:`, httpError.response?.data);
        }
        
        if (error instanceof Error && error.stack) {
          console.error(`   错误堆栈: ${error.stack}`);
        }
        
        if (attempt < maxAttempts) {
          // 固定1秒延迟，加快调试
          const delay = 1000;
          console.log(`🔄 ${delay}ms后重试...`);
          await this.delay(delay);
        }
      }
    }
    
    // 如果指定服务失败，尝试使用备份服务
    console.log(`🔄 ${serviceName}服务调用失败，尝试使用备份服务...`);
    return await this.callBackupLLM(prompt, options, lastError);
  }

  /**
   * 使用统一配置调用LLM
   */
  public async callLLMWithUnifiedConfig(
    prompt: string,
    taskType: 'content_extraction' | 'data_analysis' | 'chinese_processing' | 'fast_processing' | 'general' | 'etf_analysis' = 'general',
    options: SharedLLMOptions = {}
  ): Promise<SharedLLMResponse> {
    const selectedProvider = selectProviderForTask(taskType);
    if (!selectedProvider) {
      throw new Error('没有可用的LLM提供商');
    }

    const serviceName = selectedProvider.name.toLowerCase();
    const mergedOptions = { ...getDefaultOptions(), ...options };
    
    try {
      const response = await this.callLLM(serviceName, prompt, {
        maxTokens: mergedOptions.maxTokens,
        temperature: mergedOptions.temperature,
        systemPrompt: mergedOptions.systemPrompt,
        timeout: mergedOptions.timeout
      });

      return {
        content: response.content,
        usage: response.usage,
        model: response.model,
        provider: selectedProvider.name,
        finishReason: response.finishReason,
        responseTime: 0, // TODO: 计算实际响应时间
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`统一配置LLM调用失败: ${selectedProvider.name}`, error);
      throw error;
    }
  }

  /**
   * 调用备份LLM服务
   */
  private async callBackupLLM(
    prompt: string, 
    options: LLMOptions, 
    originalError: Error | null
  ): Promise<LLMResponse> {
    // 定义备份服务优先级：腾讯混元 > 其他可用服务
    const backupServices = ['hunyuan'];
    const availableServices = this.getAvailableServices();
    
    // 过滤出可用的备份服务
    const healthyBackupServices = backupServices.filter(name => 
      availableServices.some(service => service.name === name && this.healthStatus.get(name))
    );
    
    if (healthyBackupServices.length === 0) {
      // 如果没有健康的备份服务，尝试任何可用的服务
      const fallbackServices = availableServices.filter(service => 
        this.healthStatus.get(service.name)
      );
      
      if (fallbackServices.length === 0) {
        const errorMessage = originalError instanceof Error ? originalError.message : '未知错误';
        throw new Error(`所有LLM服务都不可用，原始错误: ${errorMessage}`);
      }
      
      const fallbackService = fallbackServices[0];
      if (fallbackService) {
        console.log(`🔄 使用备用服务: ${fallbackService.name}`);
        return await this.makeRequest(fallbackService, prompt, options);
      }
    }
    
    // 尝试备份服务
    for (const backupServiceName of healthyBackupServices) {
      try {
        const backupService = this.services.get(backupServiceName);
        if (!backupService) continue;
        
        console.log(`🔄 尝试备份服务: ${backupServiceName}`);
        const response = await this.makeRequest(backupService, prompt, options);
        await this.updateServiceStatus(backupServiceName, true);
        console.log(`✅ 备份服务 ${backupServiceName} 调用成功`);
        return response;
        
      } catch (error) {
        console.log(`❌ 备份服务 ${backupServiceName} 调用失败:`, error instanceof Error ? error instanceof Error ? error.message : String(error) : '未知错误');
        await this.updateServiceStatus(backupServiceName, false, undefined);
        continue;
      }
    }
    
    // 如果所有备份服务都失败，抛出错误
    const errorMessage = originalError instanceof Error ? originalError.message : '未知错误';
    throw new Error(`所有LLM服务都失败，原始错误: ${errorMessage}`);
  }

  private async makeRequest(service: LLMService, prompt: string, options: LLMOptions): Promise<LLMResponse> {
    const controller = new AbortController();
    // 使用传入的timeout选项，如果没有则使用服务的默认timeout
    const timeout = options.timeout || service.timeout;
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    console.log(`🔧 准备发送请求到 ${service.name}:`);
    console.log(`   URL: ${service.baseUrl}/chat/completions`);
    console.log(`   超时时间: ${timeout}ms`);
    console.log(`   最大令牌数: ${options.maxTokens || service.maxTokens}`);
    console.log(`   温度: ${options.temperature || 0.3}`);
    
    try {
      let response: AxiosResponse;
      
      switch (service.name) {
        case 'hunyuan':
          console.log(`🔄 调用混元API...`);
          response = await this.callHunyuan(service, prompt, options, controller);
          break;
        case 'doubao':
          console.log(`🔄 调用豆包API...`);
          response = await this.callDoubao(service, prompt, options, controller);
          break;
        case 'gemini':
        case 'openai':
        case 'claude':
        case 'deepseek':
          console.log(`⚠️ ${service.name} API 暂未实现，跳过...`);
          throw new Error(`${service.name} API 暂未实现`);

        default:
          throw new Error(`不支持的LLM服务: ${service.name}`);
      }
      
      clearTimeout(timeoutId);
      
      console.log(`📡 收到响应:`, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        dataKeys: Object.keys(response.data || {})
      });
      
      if (response.status !== 200) {
        console.error(`❌ API返回错误状态码: ${response.status}`);
        console.error(`   状态文本: ${response.statusText}`);
        console.error(`   响应数据:`, response.data);
        throw new Error(`LLM API错误: ${response.status} ${response.statusText}`);
      }
      
      const parsedResponse = this.parseResponse(service.name, response.data);
      console.log(`✅ 响应解析成功:`, {
        contentLength: parsedResponse.content?.length || 0,
        model: parsedResponse.model,
        finishReason: parsedResponse.finishReason
      });
      
      return parsedResponse;
    } catch (error) {
      console.error(`❌ makeRequest 失败:`, error);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async callDoubao(service: LLMService, prompt: string, options: LLMOptions, controller: AbortController): Promise<AxiosResponse> {
    // 豆包API使用火山引擎签名认证方式，启用搜索功能
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Math.random().toString(36).substring(2);
    
    // 构建请求体，启用深度思考模式
    const requestBody = {
      model: 'doubao-seed-1-6-250615', // 使用可用的模型，通过reasoning参数启用深度思考
      messages: [
        { role: 'system', content: options.systemPrompt || '你是一个专业的新闻分析师，可以搜索最新的新闻信息进行分析' },
        { role: 'user', content: prompt }
      ],
      max_tokens: options.maxTokens || service.maxTokens,
      temperature: options.temperature || 0.7,
      // 启用深度思考模式（豆包的搜索功能）
      reasoning_effort: "high", // 启用深度思考
      reasoning_mode: "auto"    // 自动推理模式
    };
    
    // 构建签名字符串
    const stringToSign = [
      'POST',
      '/api/v1/chat/completions',
      timestamp.toString(),
      nonce,
      JSON.stringify(requestBody)
    ].join('\n');
    
    // 使用API Key作为签名密钥（简化处理）
    const signature = this.generateSignature(stringToSign, service.apiKey);
    
    return axios.post(`${service.baseUrl}/chat/completions`, requestBody, {
      headers: {
        'Authorization': `Bearer ${service.apiKey}`,
        'Content-Type': 'application/json',
        'X-Volc-Timestamp': timestamp.toString(),
        'X-Volc-Nonce': nonce,
        'X-Volc-Signature': signature
      },
      signal: controller.signal
    });
  }

  private async callHunyuan(service: LLMService, prompt: string, options: LLMOptions, controller: AbortController): Promise<AxiosResponse> {
    // 使用腾讯混元OpenAI兼容接口格式
    return axios.post(`${service.baseUrl}/chat/completions`, {
      model: 'hunyuan-t1-latest',
      messages: [
        { role: 'system', content: options.systemPrompt || '你是一个专业的新闻分析师' },
        { role: 'user', content: prompt }
      ],
      max_tokens: options.maxTokens || service.maxTokens,
      temperature: options.temperature || 0.7
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${service.apiKey}`
      },
      signal: controller.signal
    });
  }





  private parseResponse(serviceName: string, data: any): LLMResponse {
    console.log(`🔍 解析${serviceName}响应:`, JSON.stringify(data, null, 2));
    
    try {
      switch (serviceName) {
        case 'doubao':
          if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error(`豆包1.6响应格式错误: ${JSON.stringify(data)}`);
          }
          return {
            content: data.choices[0].message.content,
            usage: {
              promptTokens: data.usage?.prompt_tokens || 0,
              completionTokens: data.usage?.completion_tokens || 0,
              totalTokens: data.usage?.total_tokens || 0
            },
            model: data.model || 'doubao-seed-1-6-250615',
            finishReason: data.choices[0].finish_reason || 'stop'
          };
        case 'hunyuan':
          // 腾讯混元使用OpenAI兼容响应格式
          if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error(`腾讯混元响应格式错误: ${JSON.stringify(data)}`);
          }
          
          const message = data.choices[0].message;
          // 混元API可能返回reasoning_content而不是content
          let content = message.content;
          if (!content && message.reasoning_content) {
            content = message.reasoning_content;
            console.log('⚠️ 混元API返回reasoning_content而不是content，使用reasoning_content');
          }
          
          if (!content) {
            console.warn('⚠️ 混元API返回的content和reasoning_content都为空');
            content = '无法生成内容';
          }
          
          return {
            content: content,
            usage: {
              promptTokens: data.usage?.prompt_tokens || 0,
              completionTokens: data.usage?.completion_tokens || 0,
              totalTokens: data.usage?.total_tokens || 0
            },
            model: data.model || 'hunyuan-t1-latest',
            finishReason: data.choices[0].finish_reason || 'stop'
          };

        default:
          throw new Error(`不支持的LLM服务: ${serviceName}`);
      }
    } catch (error) {
      console.error(`❌ 解析${serviceName}响应失败:`, error);
      console.error(`原始响应数据:`, data);
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async getServiceStatus(): Promise<LLMServiceStatus[]> {
    const db = this.db.getConnection();
    const rows = db.prepare('SELECT * FROM llm_service_status ORDER BY updated_at DESC').all();
    
    return rows.map((row: any) => ({
      serviceName: row.service_name,
      status: row.status as 'healthy' | 'unhealthy' | 'degraded' | 'unknown',
      lastCheck: row.last_check,
      responseTime: row.response_time || undefined,
      errorCount: row.error_count,
      successCount: row.success_count
    }));
  }

  // 🚧 临时添加：直接分析新闻的方法
  // TODO: 生产环境需要更完善的错误处理和重试机制
  public async analyzeNews(data: any): Promise<any> {
    const analysisId = data.analysisId;
    const analysisType = data.analysisType || 'standard';
    
    try {
      // 根据分析类型设置智能超时
      const timeoutConfig = this.getTimeoutConfig(analysisType);
      
      // 推送初始进度
      this.wsService.sendProgress(analysisId, {
        analysisId,
        status: 'processing',
        progress: 0,
        currentStep: '开始分析',
        estimatedTime: timeoutConfig.totalTimeout / 1000
      });

      // 构建用户提示词
      const userPrompt = this.buildUserPrompt(data, analysisType);
      
      // 推送进度更新
      this.wsService.sendProgress(analysisId, {
        analysisId,
        status: 'processing',
        progress: 20,
        currentStep: '构建分析策略',
        estimatedTime: timeoutConfig.totalTimeout / 1000
      });

      // 调用LLM服务
      const response = await this.callLLM('doubao', userPrompt, {
        systemPrompt: this.getSystemPrompt(analysisType),
        maxTokens: this.getMaxTokens(analysisType),
        temperature: 0.7
      });

      // 推送进度更新
      this.wsService.sendProgress(analysisId, {
        analysisId,
        status: 'processing',
        progress: 80,
        currentStep: '生成分析结果',
        estimatedTime: timeoutConfig.totalTimeout / 1000
      });

      // 构建分析结果
      const result = this.buildAnalysisResult(data, response, analysisType);
      
      // 推送完成进度
      this.wsService.sendProgress(analysisId, {
        analysisId,
        status: 'processing',
        progress: 100,
        currentStep: '分析完成',
        estimatedTime: 0
      });

      // 推送最终结果
      this.wsService.sendResult(analysisId, {
        analysisId,
        status: 'completed',
        result
      });

      return result;
    } catch (error) {
      console.error(`❌ 分析执行失败: ${analysisId}`, error);
      
      // 推送错误结果
      this.wsService.sendResult(analysisId, {
        analysisId,
        status: 'failed',
        error: error instanceof Error ? error instanceof Error ? error.message : String(error) : '未知错误'
      });
      
      throw error;
    }
  }

  private getTimeoutConfig(analysisType: string): {
    llmTimeout: number;
    totalTimeout: number;
  } {
    switch (analysisType) {
      case 'quick':
        return { llmTimeout: 30000, totalTimeout: 45000 }; // 30秒LLM + 15秒处理
      case 'standard':
        return { llmTimeout: 150000, totalTimeout: 180000 }; // 150秒LLM + 30秒处理
      case 'deep':
        return { llmTimeout: 120000, totalTimeout: 180000 }; // 120秒LLM + 60秒处理
      default:
        return { llmTimeout: 150000, totalTimeout: 180000 };
    }
  }

  private getSystemPrompt(analysisType: string): string {
    switch (analysisType) {
      case 'quick':
        return '你是一个专业的新闻分析师，擅长快速分析新闻要点。请提供简洁的核心观点和关键信息。';
      case 'standard':
        return '你是一个专业的新闻分析师，擅长分析业绩类新闻。请根据新闻内容进行分析，提供专业的解读和见解。';
      case 'deep':
        return '你是一个资深的新闻分析师，擅长深度分析复杂新闻。请提供全面的分析、背景解读、影响评估和趋势预测。';
      default:
        return '你是一个专业的新闻分析师，请根据新闻内容进行分析。';
    }
  }

  private getMaxTokens(analysisType: string): number {
    switch (analysisType) {
      case 'quick':
        return 2000;
      case 'standard':
        return 4000;
      case 'deep':
        return 6000;
      default:
        return 4000;
    }
  }

  private buildUserPrompt(data: any, analysisType: string): string {
    const basePrompt = `请分析以下新闻：

标题：${data.newsTitle}
内容：${data.newsContent}
分析类型：${analysisType}`;

    switch (analysisType) {
      case 'quick':
        return `${basePrompt}

请提供：
1. 核心要点总结
2. 关键数据提取
3. 简要影响分析

请用中文回答，结构清晰，内容简洁。`;
      
      case 'standard':
        return `${basePrompt}

请提供：
1. 核心要点总结
2. 影响分析
3. 相关背景
4. 未来趋势预测

请用中文回答，结构清晰，内容专业。`;
      
      case 'deep':
        return `${basePrompt}

请提供：
1. 详细背景分析
2. 多维度影响评估
3. 行业对比分析
4. 风险与机遇分析
5. 长期趋势预测
6. 投资建议参考

请用中文回答，结构清晰，内容深入专业。`;
      
      default:
        return `${basePrompt}

请提供专业的新闻分析。`;
    }
  }

  private buildAnalysisResult(data: any, response: LLMResponse, analysisType: string): any {
    return {
      id: data.analysisId,
      newsId: data.newsId,
      userId: data.userId || 'dev-user-123',
      newsType: '业绩类', // 简化处理，直接使用固定类型
      analysisType,
      status: 'completed',
      strategy: {
        approach: this.getStrategyApproach(analysisType),
        keyPoints: this.extractKeyPoints(response.content),
        focusAreas: this.getFocusAreas(analysisType)
      },
      rounds: [
        {
          round: 1,
          response: response.content,
          timestamp: Date.now()
        }
      ],
      summary: this.generateSummary(response.content),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      completedAt: Date.now()
    };
  }

  private getStrategyApproach(analysisType: string): string {
    switch (analysisType) {
      case 'quick': return '快速要点提取';
      case 'standard': return '标准深度分析';
      case 'deep': return '全面深度分析';
      default: return '标准分析';
    }
  }

  private extractKeyPoints(content: string): string[] {
    // 简单的关键点提取逻辑
    const lines = content.split('\n').filter(line => line.trim());
    return lines.slice(0, 5).map(line => line.replace(/^[•\-\*]\s*/, '').trim());
  }

  private getFocusAreas(analysisType: string): string[] {
    switch (analysisType) {
      case 'quick': return ['核心数据', '关键信息', '简要影响'];
      case 'standard': return ['数据解读', '影响分析', '趋势预测'];
      case 'deep': return ['背景分析', '多维度影响', '风险机遇', '长期趋势'];
      default: return ['数据分析', '影响评估'];
    }
  }

  private generateSummary(content: string): string {
    // 生成摘要，取前200个字符
    return content.length > 200 ? content.substring(0, 200) + '...' : content;
  }

}

/**
 * 统一LLM服务接口
 * 定义项目中所有LLM服务的统一调用接口
 */

import { LLMProvider, LLMOptions, LLMResponse, HealthStatus } from './config';

export interface LLMService {
  /**
   * 调用LLM服务
   * @param prompt 提示词
   * @param options 调用选项
   * @returns LLM响应
   */
  invoke(prompt: string, options?: LLMOptions): Promise<LLMResponse>;

  /**
   * 异步调用LLM服务
   * @param prompt 提示词
   * @param options 调用选项
   * @returns LLM响应
   */
  ainvoke(prompt: string, options?: LLMOptions): Promise<LLMResponse>;

  /**
   * 健康检查
   * @returns 健康状态
   */
  healthCheck(): Promise<boolean>;

  /**
   * 获取提供商信息
   * @returns 提供商名称
   */
  getProvider(): string;

  /**
   * 获取可用模型列表
   * @returns 模型列表
   */
  getAvailableModels(): string[];

  /**
   * 获取服务状态
   * @returns 服务状态
   */
  getStatus(): HealthStatus;
}

export interface LLMServiceManager {
  /**
   * 获取LLM服务实例
   * @param provider 提供商名称
   * @returns LLM服务实例
   */
  getService(provider: string): LLMService | null;

  /**
   * 获取所有可用服务
   * @returns 服务列表
   */
  getAvailableServices(): LLMService[];

  /**
   * 根据任务类型选择最佳服务
   * @param taskType 任务类型
   * @returns 最佳服务实例
   */
  selectBestService(taskType: string): LLMService | null;

  /**
   * 调用LLM服务（自动选择最佳服务）
   * @param prompt 提示词
   * @param options 调用选项
   * @returns LLM响应
   */
  callLLM(prompt: string, options?: LLMOptions): Promise<LLMResponse>;

  /**
   * 健康检查所有服务
   * @returns 健康状态列表
   */
  healthCheckAll(): Promise<HealthStatus[]>;

  /**
   * 获取服务状态摘要
   * @returns 状态摘要
   */
  getStatusSummary(): {
    totalServices: number;
    healthyServices: number;
    unhealthyServices: number;
    services: HealthStatus[];
  };
}

/**
 * 统一错误处理类
 */
export class LLMErrorHandler {
  /**
   * 带重试的操作执行
   * @param operation 操作函数
   * @param maxRetries 最大重试次数
   * @param backoffMs 退避时间（毫秒）
   * @returns 操作结果
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    backoffMs: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const delay = backoffMs * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('操作失败');
  }

  /**
   * 处理LLM错误
   * @param error 错误对象
   * @param context 上下文信息
   * @returns 处理后的错误响应
   */
  static handleError(error: Error, context: string): LLMResponse {
    const errorMessage = `LLM调用失败 (${context}): ${error instanceof Error ? error.message : String(error)}`;
    
    return {
      content: `抱歉，AI服务暂时不可用，请稍后重试。错误信息: ${errorMessage}`,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      },
      model: 'error',
      provider: 'error',
      finishReason: 'error',
      responseTime: 0,
      timestamp: Date.now()
    };
  }

  /**
   * 检查错误是否可重试
   * @param error 错误对象
   * @returns 是否可重试
   */
  static isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'timeout',
      'network',
      'rate limit',
      'server error',
      'temporary'
    ];
    
    const errorMessage = error instanceof Error ? error.message : String(error).toLowerCase();
    return retryableErrors.some(keyword => errorMessage.includes(keyword));
  }
}

/**
 * 统一日志记录类
 */
export class LLMLogger {
  private static logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info';

  /**
   * 设置日志级别
   * @param level 日志级别
   */
  static setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.logLevel = level;
  }

  /**
   * 记录LLM调用
   * @param provider 提供商
   * @param prompt 提示词
   * @param response 响应
   * @param responseTime 响应时间
   */
  static logCall(
    provider: string,
    prompt: string,
    response: LLMResponse,
    responseTime: number
  ): void {
    if (this.shouldLog('info')) {
      console.log(`[LLM] ${provider} 调用成功:`, {
        provider,
        promptLength: prompt.length,
        responseLength: response.content.length,
        responseTime,
        model: response.model,
        usage: response.usage
      });
    }
  }

  /**
   * 记录错误
   * @param provider 提供商
   * @param error 错误对象
   * @param context 上下文
   */
  static logError(provider: string, error: Error, context: string): void {
    if (this.shouldLog('error')) {
      console.error(`[LLM] ${provider} 调用失败:`, {
        provider,
        error: error instanceof Error ? error.message : String(error),
        context,
        stack: error.stack
      });
    }
  }

  /**
   * 记录性能指标
   * @param provider 提供商
   * @param metrics 性能指标
   */
  static logPerformance(provider: string, metrics: {
    responseTime: number;
    tokenCount: number;
    cost?: number;
  }): void {
    if (this.shouldLog('debug')) {
      console.log(`[LLM] ${provider} 性能指标:`, {
        provider,
        ...metrics
      });
    }
  }

  /**
   * 检查是否应该记录日志
   * @param level 日志级别
   * @returns 是否应该记录
   */
  private static shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.logLevel];
  }
}

/**
 * 统一健康检查类
 */
export class LLMHealthChecker {
  private static healthCache: Map<string, HealthStatus> = new Map();
  private static cacheTimeout = 60000; // 1分钟缓存

  /**
   * 检查所有提供商健康状态
   * @param services 服务列表
   * @returns 健康状态列表
   */
  static async checkAllProviders(services: LLMService[]): Promise<HealthStatus[]> {
    const results = await Promise.allSettled(
      services.map(service => this.checkProvider(service))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          provider: services[index].getProvider(),
          status: 'unhealthy',
          lastCheck: Date.now(),
          errorCount: 1,
          successCount: 0
        };
      }
    });
  }

  /**
   * 检查单个提供商健康状态
   * @param service 服务实例
   * @returns 健康状态
   */
  static async checkProvider(service: LLMService): Promise<HealthStatus> {
    const provider = service.getProvider();
    const now = Date.now();
    
    // 检查缓存
    const cached = this.healthCache.get(provider);
    if (cached && (now - cached.lastCheck) < this.cacheTimeout) {
      return cached;
    }

    const startTime = Date.now();
    let status: HealthStatus;

    try {
      const isHealthy = await service.healthCheck();
      const responseTime = Date.now() - startTime;
      
      status = {
        provider,
        status: isHealthy ? 'healthy' : 'unhealthy',
        lastCheck: now,
        responseTime,
        errorCount: isHealthy ? 0 : 1,
        successCount: isHealthy ? 1 : 0
      };
    } catch (error) {
      status = {
        provider,
        status: 'unhealthy',
        lastCheck: now,
        errorCount: 1,
        successCount: 0
      };
    }

    // 更新缓存
    this.healthCache.set(provider, status);
    return status;
  }

  /**
   * 获取健康指标
   * @param services 服务列表
   * @returns 健康指标
   */
  static async getHealthMetrics(services: LLMService[]): Promise<{
    totalServices: number;
    healthyServices: number;
    unhealthyServices: number;
    averageResponseTime: number;
    uptime: number;
  }> {
    const healthStatuses = await this.checkAllProviders(services);
    
    const healthyServices = healthStatuses.filter(s => s.status === 'healthy').length;
    const unhealthyServices = healthStatuses.length - healthyServices;
    
    const responseTimes = healthStatuses
      .filter(s => s.responseTime !== undefined)
      .map(s => s.responseTime!);
    
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    return {
      totalServices: healthStatuses.length,
      healthyServices,
      unhealthyServices,
      averageResponseTime,
      uptime: healthyServices / healthStatuses.length
    };
  }
}

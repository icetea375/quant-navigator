/**
 * 通用错误处理类
 * 遵循智能分析系统开发实施指南的命名规范
 */

export class BaseErrorHandler {
  /**
   * 统一错误处理方法
   * @param error 错误对象
   * @param context 错误上下文
   */
  static handle(error: unknown, context: string): void {
    // 将unknown类型转换为Error类型
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    console.error(`[${context}] Error:`, errorObj.message);
    
    // 根据错误类型进行不同处理
    if (errorObj.message.includes('timeout')) {
      // 超时错误处理
      console.warn(`[${context}] Timeout occurred, retrying...`);
    } else if (errorObj.message.includes('connection')) {
      // 连接错误处理
      console.error(`[${context}] Connection error, service may be down`);
      throw errorObj;
    } else if (errorObj.message.includes('validation')) {
      // 验证错误处理
      console.warn(`[${context}] Validation error:`, errorObj.message);
    } else if (errorObj.message.includes('permission')) {
      // 权限错误处理
      console.error(`[${context}] Permission denied:`, errorObj.message);
      throw errorObj;
    } else if (errorObj.message.includes('not found')) {
      // 资源未找到错误处理
      console.warn(`[${context}] Resource not found:`, errorObj.message);
    } else {
      // 其他未知错误
      console.error(`[${context}] Unknown error:`, errorObj.message);
      if (errorObj.stack) {
        console.error(`[${context}] Stack trace:`, errorObj.stack);
      }
    }
  }

  /**
   * 创建自定义错误
   * @param message 错误消息
   * @param code 错误代码
   * @param context 错误上下文
   */
  static createError(message: string, code?: string, context?: string): Error {
    const error = new Error(message);
    if (code) {
      (error as any).code = code;
    }
    if (context) {
      (error as any).context = context;
    }
    return error;
  }

  /**
   * 包装异步操作，自动处理错误
   * @param operation 异步操作
   * @param context 错误上下文
   * @param defaultValue 默认返回值
   */
  static async wrapAsync<T>(
    operation: () => Promise<T>,
    context: string,
    defaultValue?: T
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      this.handle(error as Error, context);
      return defaultValue;
    }
  }

  /**
   * 包装同步操作，自动处理错误
   * @param operation 同步操作
   * @param context 错误上下文
   * @param defaultValue 默认返回值
   */
  static wrapSync<T>(
    operation: () => T,
    context: string,
    defaultValue?: T
  ): T | undefined {
    try {
      return operation();
    } catch (error) {
      this.handle(error as Error, context);
      return defaultValue;
    }
  }

  /**
   * 检查是否为特定类型的错误
   * @param error 错误对象
   * @param type 错误类型
   */
  static isErrorType(error: any, type: string): boolean {
    return error instanceof Error && error instanceof Error ? error.message : String(error).includes(type);
  }

  /**
   * 获取错误代码
   * @param error 错误对象
   */
  static getErrorCode(error: any): string | undefined {
    return (error as any)?.code;
  }

  /**
   * 获取错误上下文
   * @param error 错误对象
   */
  static getErrorContext(error: any): string | undefined {
    return (error as any)?.context;
  }
}

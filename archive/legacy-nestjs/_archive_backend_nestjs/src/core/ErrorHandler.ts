/**
 * ErrorHandler - 统一错误处理中间件
 * 消除错误处理重复，提供统一的错误处理机制
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export interface AppError extends Error {
  type: ErrorType;
  statusCode: number;
  isOperational: boolean;
  context?: any;
  timestamp: string;
}

export class CustomError extends Error implements AppError {
  public type: ErrorType;
  public statusCode: number;
  public isOperational: boolean;
  public context?: any;
  public timestamp: string;

  constructor(
    message: string,
    type: ErrorType,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: any
  ) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 创建错误
   */
  public createError(
    message: string,
    type: ErrorType,
    statusCode: number = 500,
    context?: any
  ): CustomError {
    return new CustomError(message, type, statusCode, true, context);
  }

  /**
   * 处理同步错误
   */
  public handleSyncError(error: Error, context?: any): AppError {
    if (error instanceof CustomError) {
      return error;
    }

    // 根据错误类型分类
    if (error.name === 'ValidationError') {
      return this.createError(
        error.message,
        ErrorType.VALIDATION_ERROR,
        400,
        context
      );
    }

    if (error.name === 'UnauthorizedError') {
      return this.createError(
        'Authentication required',
        ErrorType.AUTHENTICATION_ERROR,
        401,
        context
      );
    }

    if (error.name === 'ForbiddenError') {
      return this.createError(
        'Insufficient permissions',
        ErrorType.AUTHORIZATION_ERROR,
        403,
        context
      );
    }

    if (error.name === 'NotFoundError') {
      return this.createError(
        'Resource not found',
        ErrorType.NOT_FOUND_ERROR,
        404,
        context
      );
    }

    if (error.name === 'TimeoutError') {
      return this.createError(
        'Request timeout',
        ErrorType.TIMEOUT_ERROR,
        408,
        context
      );
    }

    // 默认内部错误
    return this.createError(
      'Internal server error',
      ErrorType.INTERNAL_ERROR,
      500,
      { originalError: error.message, ...context }
    );
  }

  /**
   * 处理异步错误
   */
  public async handleAsyncError<T>(
    asyncFn: () => Promise<T>,
    context?: any
  ): Promise<T> {
    try {
      return await asyncFn();
    } catch (error) {
      const appError = this.handleSyncError(error as Error, context);
      throw appError;
    }
  }

  /**
   * Express错误处理中间件
   */
  public expressErrorHandler() {
    return (error: AppError, req: Request, res: Response, next: NextFunction) => {
      // 记录错误
      this.logError(error, req);

      // 发送错误响应
      const errorResponse = this.formatErrorResponse(error, req);
      res.status(error.statusCode).json(errorResponse);
    };
  }

  /**
   * 记录错误
   */
  private logError(error: AppError, req: Request): void {
    const errorInfo = {
      type: error.type,
      message: error.message,
      statusCode: error.statusCode,
      timestamp: error.timestamp,
      context: error.context,
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params
      },
      stack: error.stack
    };

    if (error.statusCode >= 500) {
      logger.error('Server error:', errorInfo);
    } else {
      logger.warn('Client error:', errorInfo);
    }
  }

  /**
   * 格式化错误响应
   */
  private formatErrorResponse(error: AppError, req: Request): any {
    const isDevelopment = process.env.NODE_ENV === 'development';

    const response: any = {
      success: false,
      error: {
        type: error.type,
        message: error.message,
        statusCode: error.statusCode,
        timestamp: error.timestamp
      }
    };

    // 开发环境显示详细信息
    if (isDevelopment) {
      response.error.stack = error.stack;
      response.error.context = error.context;
    }

    // 添加请求ID（如果存在）
    if (req.headers['x-request-id']) {
      response.requestId = req.headers['x-request-id'];
    }

    return response;
  }

  /**
   * 全局未捕获异常处理
   */
  public setupGlobalHandlers(): void {
    // 未捕获的异常
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // 未处理的Promise拒绝
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }
}

// 便捷的错误创建函数
export const createError = ErrorHandler.getInstance().createError.bind(ErrorHandler.getInstance());
export const handleAsyncError = ErrorHandler.getInstance().handleAsyncError.bind(ErrorHandler.getInstance());

export default ErrorHandler;

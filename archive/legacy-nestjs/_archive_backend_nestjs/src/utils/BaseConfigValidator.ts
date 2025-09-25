/**
 * 通用配置验证类
 * 遵循智能分析系统开发实施指南的命名规范
 */

export interface BaseConfig {
  enabled: boolean;
  timeout?: number;
  retries?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  [key: string]: any;
}

export class BaseConfigValidator {
  /**
   * 验证配置对象
   * @param config 配置对象
   * @param requiredFields 必需字段列表
   */
  static validate(config: BaseConfig, requiredFields: string[]): void {
    // 检查必需字段
    for (const field of requiredFields) {
      if (!(field in config)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // 验证字段类型和值
    this.validateFieldTypes(config);
    this.validateFieldValues(config);
  }

  /**
   * 验证字段类型
   * @param config 配置对象
   */
  private static validateFieldTypes(config: BaseConfig): void {
    if (config.timeout !== undefined && typeof config.timeout !== 'number') {
      throw new Error('timeout must be a number');
    }
    
    if (config.retries !== undefined && typeof config.retries !== 'number') {
      throw new Error('retries must be a number');
    }
    
    if (config.logLevel !== undefined && !['debug', 'info', 'warn', 'error'].includes(config.logLevel)) {
      throw new Error('logLevel must be one of: debug, info, warn, error');
    }
    
    if (typeof config.enabled !== 'boolean') {
      throw new Error('enabled must be a boolean');
    }
  }

  /**
   * 验证字段值
   * @param config 配置对象
   */
  private static validateFieldValues(config: BaseConfig): void {
    if (config.timeout !== undefined && config.timeout <= 0) {
      throw new Error('timeout must be positive');
    }
    
    if (config.retries !== undefined && config.retries < 0) {
      throw new Error('retries must be non-negative');
    }
  }

  /**
   * 验证端口号
   * @param port 端口号
   * @param fieldName 字段名
   */
  static validatePort(port: any, fieldName: string = 'port'): void {
    if (typeof port !== 'number' || !Number.isInteger(port)) {
      throw new Error(`${fieldName} must be an integer`);
    }
    
    if (port < 1 || port > 65535) {
      throw new Error(`${fieldName} must be between 1 and 65535`);
    }
  }

  /**
   * 验证URL
   * @param url URL字符串
   * @param fieldName 字段名
   */
  static validateUrl(url: any, fieldName: string = 'url'): void {
    if (typeof url !== 'string') {
      throw new Error(`${fieldName} must be a string`);
    }
    
    try {
      new URL(url);
    } catch {
      throw new Error(`${fieldName} must be a valid URL`);
    }
  }

  /**
   * 验证字符串非空
   * @param value 字符串值
   * @param fieldName 字段名
   */
  static validateNonEmptyString(value: any, fieldName: string): void {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`${fieldName} must be a non-empty string`);
    }
  }

  /**
   * 验证数字范围
   * @param value 数值
   * @param min 最小值
   * @param max 最大值
   * @param fieldName 字段名
   */
  static validateNumberRange(value: any, min: number, max: number, fieldName: string): void {
    if (typeof value !== 'number') {
      throw new Error(`${fieldName} must be a number`);
    }
    
    if (value < min || value > max) {
      throw new Error(`${fieldName} must be between ${min} and ${max}`);
    }
  }

  /**
   * 验证数组
   * @param value 数组值
   * @param fieldName 字段名
   * @param minLength 最小长度
   */
  static validateArray(value: any, fieldName: string, minLength: number = 0): void {
    if (!Array.isArray(value)) {
      throw new Error(`${fieldName} must be an array`);
    }
    
    if (value.length < minLength) {
      throw new Error(`${fieldName} must have at least ${minLength} items`);
    }
  }

  /**
   * 验证对象
   * @param value 对象值
   * @param fieldName 字段名
   * @param requiredKeys 必需的键
   */
  static validateObject(value: any, fieldName: string, requiredKeys?: string[]): void {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(`${fieldName} must be an object`);
    }
    
    if (requiredKeys) {
      for (const key of requiredKeys) {
        if (!(key in value)) {
          throw new Error(`${fieldName} must have required key: ${key}`);
        }
      }
    }
  }

  /**
   * 验证布尔值
   * @param value 布尔值
   * @param fieldName 字段名
   */
  static validateBoolean(value: any, fieldName: string): void {
    if (typeof value !== 'boolean') {
      throw new Error(`${fieldName} must be a boolean`);
    }
  }

  /**
   * 验证枚举值
   * @param value 值
   * @param allowedValues 允许的值列表
   * @param fieldName 字段名
   */
  static validateEnum(value: any, allowedValues: any[], fieldName: string): void {
    if (!allowedValues.includes(value)) {
      throw new Error(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
    }
  }

  /**
   * 验证配置并返回默认值
   * @param config 配置对象
   * @param defaults 默认配置
   * @param requiredFields 必需字段
   */
  static validateWithDefaults<T extends BaseConfig>(
    config: Partial<T>,
    defaults: T,
    requiredFields: string[] = []
  ): T {
    // 合并默认配置
    const mergedConfig = { ...defaults, ...config };
    
    // 验证必需字段
    this.validate(mergedConfig, requiredFields);
    
    return mergedConfig;
  }

  /**
   * 安全获取配置值
   * @param config 配置对象
   * @param key 配置键
   * @param defaultValue 默认值
   */
  static getConfigValue<T>(config: any, key: string, defaultValue: T): T {
    return config && key in config ? config[key] : defaultValue;
  }
}

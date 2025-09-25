/**
 * ConfigManager - 统一配置管理系统
 * 消除配置分散问题，提供统一的配置管理
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger';

export interface SystemConfig {
  // 数据库配置
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl: boolean;
    pool: {
      min: number;
      max: number;
    };
  };
  
  // Redis配置
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
    retryDelayOnFailover: number;
    maxRetriesPerRequest: number;
  };
  
  // 服务配置
  services: {
    dataPipeline: {
      enabled: boolean;
      updateInterval: number;
      fetchers: {
        [key: string]: {
          enabled: boolean;
          updateInterval: number;
          timeout: number;
        };
      };
    };
    attributionEngine: {
      enabled: boolean;
      anomalyDetection: {
        enabled: boolean;
        zScoreThreshold: number;
      };
    };
    predictionEngine: {
      enabled: boolean;
      modelPath: string;
      retrainInterval: number;
    };
  };
  
  // 外部API配置
  apis: {
    tushare: {
      token: string;
      baseUrl: string;
      timeout: number;
      rateLimit: number;
    };
    llm: {
      providers: {
        [key: string]: {
          enabled: boolean;
          apiKey: string;
          baseUrl: string;
          timeout: number;
          priority: number;
        };
      };
    };
  };
  
  // 监控配置
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    metricsCollection: boolean;
    alerting: {
      enabled: boolean;
      webhook: string;
    };
  };
  
  // 缓存配置
  caching: {
    enabled: boolean;
    defaultTTL: number;
    maxSize: number;
    cleanupInterval: number;
  };
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: SystemConfig;
  private configPath: string;

  private constructor() {
    this.configPath = process.env.CONFIG_PATH || join(process.cwd(), 'config', 'system.json');
    this.config = this.loadConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * 加载配置文件
   */
  private loadConfig(): SystemConfig {
    try {
      if (existsSync(this.configPath)) {
        const configData = readFileSync(this.configPath, 'utf8');
        const config = JSON.parse(configData);
        logger.info(`Configuration loaded from ${this.configPath}`);
        return this.mergeWithDefaults(config);
      } else {
        logger.warn(`Config file not found at ${this.configPath}, using defaults`);
        return this.getDefaultConfig();
      }
    } catch (error) {
      logger.error('Failed to load configuration:', error);
      return this.getDefaultConfig();
    }
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): SystemConfig {
    return {
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_DATABASE || 'news_analysis',
        ssl: process.env.DB_SSL === 'true',
        pool: {
          min: 2,
          max: 10
        }
      },
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3
      },
      services: {
        dataPipeline: {
          enabled: true,
          updateInterval: 5,
          fetchers: {
            tushare: {
              enabled: true,
              updateInterval: 5,
              timeout: 30000
            },
            news: {
              enabled: true,
              updateInterval: 10,
              timeout: 15000
            }
          }
        },
        attributionEngine: {
          enabled: true,
          anomalyDetection: {
            enabled: true,
            zScoreThreshold: 2.0
          }
        },
        predictionEngine: {
          enabled: true,
          modelPath: './models',
          retrainInterval: 24
        }
      },
      apis: {
        tushare: {
          token: process.env.TUSHARE_TOKEN || '',
          baseUrl: 'http://api.tushare.pro',
          timeout: 30000,
          rateLimit: 200
        },
        llm: {
          providers: {
            doubao: {
              enabled: true,
              apiKey: process.env.DOUBAO_API_KEY || '',
              baseUrl: process.env.DOUBAO_BASE_URL || '',
              timeout: 30000,
              priority: 1
            },
            hunyuan: {
              enabled: true,
              apiKey: process.env.HUNYUAN_API_KEY || '',
              baseUrl: process.env.HUNYUAN_BASE_URL || '',
              timeout: 30000,
              priority: 2
            }
          }
        }
      },
      monitoring: {
        enabled: true,
        logLevel: (process.env.LOG_LEVEL as any) || 'info',
        metricsCollection: true,
        alerting: {
          enabled: false,
          webhook: ''
        }
      },
      caching: {
        enabled: true,
        defaultTTL: 300,
        maxSize: 1000,
        cleanupInterval: 3600
      }
    };
  }

  /**
   * 合并配置与默认值
   */
  private mergeWithDefaults(userConfig: Partial<SystemConfig>): SystemConfig {
    const defaultConfig = this.getDefaultConfig();
    return this.deepMerge(defaultConfig, userConfig);
  }

  /**
   * 深度合并对象
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * 获取配置
   */
  public getConfig(): SystemConfig {
    return this.config;
  }

  /**
   * 获取特定服务配置
   */
  public getServiceConfig<T>(serviceName: string): T {
    return this.config.services[serviceName] as T;
  }

  /**
   * 获取API配置
   */
  public getApiConfig<T>(apiName: string): T {
    return this.config.apis[apiName] as T;
  }

  /**
   * 重新加载配置
   */
  public reloadConfig(): void {
    this.config = this.loadConfig();
    logger.info('Configuration reloaded');
  }

  /**
   * 验证配置
   */
  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 验证数据库配置
    if (!this.config.database.host) {
      errors.push('Database host is required');
    }
    if (!this.config.database.username) {
      errors.push('Database username is required');
    }

    // 验证Redis配置
    if (!this.config.redis.host) {
      errors.push('Redis host is required');
    }

    // 验证API配置
    if (!this.config.apis.tushare.token) {
      errors.push('Tushare token is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default ConfigManager;

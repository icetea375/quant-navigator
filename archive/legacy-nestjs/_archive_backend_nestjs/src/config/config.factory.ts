import { ConfigService } from '@nestjs/config';
import { AppConfig } from './config.module';

/**
 * 配置工厂 - 提供类型安全的配置获取方法
 * 
 * 职责：
 * 1. 封装ConfigService的复杂调用
 * 2. 提供类型安全的配置访问
 * 3. 处理配置默认值和验证
 */
export class ConfigFactory {
  constructor(private readonly configService: ConfigService) {}

  /**
   * 获取数据库配置
   */
  getDatabaseConfig(): AppConfig['database'] {
    return {
      host: this.configService.get<string>('database.host', 'localhost'),
      port: this.configService.get<number>('database.port', 5432),
      username: this.configService.get<string>('database.username', 'postgres'),
      password: this.configService.get<string>('database.password', 'password'),
      database: this.configService.get<string>('database.database', 'quant_navigator'),
      ssl: this.configService.get<boolean>('database.ssl', false),
      pool: {
        min: this.configService.get<number>('database.pool.min', 2),
        max: this.configService.get<number>('database.pool.max', 10),
      },
    };
  }

  /**
   * 获取Redis配置
   */
  getRedisConfig(): AppConfig['redis'] {
    return {
      host: this.configService.get<string>('redis.host', 'localhost'),
      port: this.configService.get<number>('redis.port', 6379),
      password: this.configService.get<string>('redis.password'),
      db: this.configService.get<number>('redis.db', 0),
    };
  }

  /**
   * 获取LLM配置
   */
  getLLMConfig(): AppConfig['llm'] {
    return {
      providers: this.configService.get('llm.providers', {}),
      default_provider: this.configService.get<string>('llm.default_provider', 'qwen_plus'),
      timeout: this.configService.get<number>('llm.timeout', 30),
      max_retries: this.configService.get<number>('llm.max_retries', 3),
    };
  }

  /**
   * 获取分析服务配置
   */
  getAnalysisConfig(): AppConfig['analysis'] {
    return {
      taskScheduler: {
        maxConcurrent: this.configService.get<number>('analysis.taskScheduler.maxConcurrent', 5),
        retryAttempts: this.configService.get<number>('analysis.taskScheduler.retryAttempts', 3),
        retryDelay: this.configService.get<number>('analysis.taskScheduler.retryDelay', 5000),
        cleanupInterval: this.configService.get<number>('analysis.taskScheduler.cleanupInterval', 300000),
      },
      newsClassifier: {
        categories: this.configService.get<string[]>('analysis.newsClassifier.categories', ['AI', '医药', '宏观', '科技', '金融']),
        confidenceThreshold: this.configService.get<number>('analysis.newsClassifier.confidenceThreshold', 0.6),
        batchSize: this.configService.get<number>('analysis.newsClassifier.batchSize', 100),
      },
    };
  }

  /**
   * 获取应用配置
   */
  getAppConfig(): AppConfig['app'] {
    return {
      name: this.configService.get<string>('app.name', '量化导航仪'),
      version: this.configService.get<string>('app.version', '1.0.0'),
      description: this.configService.get<string>('app.description', '智能投资分析平台'),
      debug: this.configService.get<boolean>('app.debug', false),
      logLevel: this.configService.get<string>('app.logLevel', 'info'),
    };
  }

  /**
   * 获取完整配置
   */
  getAllConfig(): AppConfig {
    return {
      database: this.getDatabaseConfig(),
      redis: this.getRedisConfig(),
      llm: this.getLLMConfig(),
      analysis: this.getAnalysisConfig(),
      app: this.getAppConfig(),
    };
  }
}

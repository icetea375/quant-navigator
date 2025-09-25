import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 统一配置管理模块 - 系统唯一的配置入口
 * 
 * 架构原则：
 * 1. 单一事实来源 - 所有配置通过此模块加载
 * 2. 确定性优先级 - 代码定义的加载顺序
 * 3. 环境感知 - 自动加载对应环境配置
 * 4. 类型安全 - 强类型配置接口
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 全局可用，避免重复导入
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      load: [
        // 按优先级顺序加载配置文件
        () => require('../../../config/default.json'),           // 1. 默认配置
        () => require('../../../config/llm.service.json'),        // 2. LLM服务配置
        () => require('../../../config/mda_verifier.service.json'), // 3. MD&A Verifier服务配置
      ],
      validationSchema: undefined, // TODO: 添加Joi验证schema
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
      expandVariables: true, // 支持环境变量展开
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class AppConfigModule {}

/**
 * 配置接口定义 - 强类型配置
 */
export interface AppConfig {
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
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  llm: {
    providers: {
      [key: string]: {
        api_key: string;
        base_url: string;
        model: string;
        description?: string;
      };
    };
    default_provider: string;
    timeout: number;
    max_retries: number;
  };
  analysis: {
    taskScheduler: {
      maxConcurrent: number;
      retryAttempts: number;
      retryDelay: number;
      cleanupInterval: number;
    };
    newsClassifier: {
      categories: string[];
      confidenceThreshold: number;
      batchSize: number;
    };
  };
  app: {
    name: string;
    version: string;
    description: string;
    debug: boolean;
    logLevel: string;
  };
}

/**
 * 测试环境设置
 * 基于全流程测试计划v1.0
 */

import { Logger } from '@nestjs/common';

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/quant_navigator_test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/1';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

// 全局测试配置
const globalTestConfig = {
  // 测试超时时间
  testTimeout: 30000,
  
  // 数据库配置
  database: {
    host: 'localhost',
    port: 5432,
    username: 'test',
    password: 'test',
    database: 'quant_navigator_test'
  },
  
  // Redis配置
  redis: {
    host: 'localhost',
    port: 6379,
    db: 1
  },
  
  // 测试数据配置
  testData: {
    historicalDataStart: '2021-01-01',
    historicalDataEnd: '2024-12-31',
    testSymbols: ['000001.SZ', '000002.SZ', '000858.SZ', '600000.SH', '600036.SH']
  }
};

// 设置全局测试配置
(global as any).testConfig = globalTestConfig;

// 使用NestJS Logger
const logger = new Logger('TestSetup');
logger.log('测试环境初始化完成');
logger.log(`数据库: ${globalTestConfig.database.host}:${globalTestConfig.database.port}/${globalTestConfig.database.database}`);
logger.log(`Redis: ${globalTestConfig.redis.host}:${globalTestConfig.redis.port}`);

// 导出配置供测试使用
export { globalTestConfig };


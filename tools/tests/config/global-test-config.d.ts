/**
 * 全局测试配置类型声明
 * 遵循测试宪法第4条：类型安全铁律
 */

declare global {
  var testConfig: {
    testTimeout: number;
    database: {
      host: string;
      port: number;
      username: string;
      password: string;
      database: string;
    };
    redis: {
      host: string;
      port: number;
      db: number;
    };
    testData: {
      historicalDataStart: string;
      historicalDataEnd: string;
      testSymbols: string[];
    };
  };
}

export {};






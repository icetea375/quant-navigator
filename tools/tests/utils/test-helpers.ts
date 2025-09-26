/**
 * 测试辅助工具
 * 基于全流程测试计划v1.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

export class TestHelpers {
  /**
   * 创建测试模块
   */
  static async createTestingModule(providers: any[], controllers: any[] = []): Promise<TestingModule> {
    return await Test.createTestingModule({
      controllers,
      providers,
    }).compile();
  }

  /**
   * 创建HTTP测试客户端
   */
  static createHttpClient(app: INestApplication): request.SuperTest<request.Test> {
    return request(app.getHttpServer());
  }

  /**
   * 等待指定时间
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 生成测试数据
   */
  static generateTestData(type: string, count: number = 10): any[] {
    switch (type) {
      case 'stock_prices':
        return this.generateStockPriceData(count);
      case 'news':
        return this.generateNewsData(count);
      case 'configs':
        return this.generateConfigData(count);
      default:
        return [];
    }
  }

  /**
   * 验证API响应格式
   */
  static validateApiResponse(response: any, expectedFields: string[]): boolean {
    if (!response.body) return false;

    return expectedFields.every(field =>
      response.body.hasOwnProperty(field)
    );
  }

  /**
   * 验证错误响应
   */
  static validateErrorResponse(response: any): boolean {
    return response.status >= 400 &&
           response.body &&
           (response.body.error || response.body.message);
  }

  /**
   * 生成股票价格测试数据
   */
  private static generateStockPriceData(count: number): any[] {
    const data = [];
    const symbols = ['000001.SZ', '000002.SZ', '600000.SH', '600036.SH'];

    for (let i = 0; i < count; i++) {
      const symbol = symbols[i % symbols.length];
      const basePrice = 10 + Math.random() * 90;

      data.push({
        ts_code: symbol,
        trade_date: this.generateRandomDate(),
        open: basePrice,
        high: basePrice * (1 + Math.random() * 0.1),
        low: basePrice * (1 - Math.random() * 0.1),
        close: basePrice * (1 + (Math.random() - 0.5) * 0.2),
        vol: Math.floor(Math.random() * 1000000),
        amount: Math.floor(Math.random() * 10000000)
      });
    }

    return data;
  }

  /**
   * 生成新闻测试数据
   */
  private static generateNewsData(count: number): any[] {
    const data = [];
    const titles = [
      '公司发布重大公告',
      '行业政策利好',
      '市场波动加剧',
      '技术突破创新',
      '合作项目签约'
    ];

    for (let i = 0; i < count; i++) {
      data.push({
        id: i + 1,
        title: titles[i % titles.length],
        content: `这是第${i + 1}条测试新闻内容...`,
        publish_time: new Date().toISOString(),
        source: '测试来源',
        sentiment: Math.random() > 0.5 ? 'positive' : 'negative'
      });
    }

    return data;
  }

  /**
   * 生成配置测试数据
   */
  private static generateConfigData(count: number): any[] {
    const data = [];
    const types = ['database', 'api', 'cache', 'logging'];
    const keys = ['host', 'port', 'timeout', 'retry_count'];

    for (let i = 0; i < count; i++) {
      data.push({
        id: i + 1,
        configType: types[i % types.length],
        configKey: keys[i % keys.length],
        configValue: `test_value_${i + 1}`,
        description: `测试配置项 ${i + 1}`,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return data;
  }

  /**
   * 生成随机日期
   */
  private static generateRandomDate(): string {
    const start = new Date('2024-01-01');
    const end = new Date('2024-12-31');
    const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    return new Date(randomTime).toISOString().split('T')[0].replace(/-/g, '');
  }

  /**
   * 模拟数据库操作
   */
  static createMockDatabase() {
    return {
      query: jest.fn(),
      transaction: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn()
    };
  }

  /**
   * 模拟Redis操作
   */
  static createMockRedis() {
    return {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      expire: jest.fn()
    };
  }

  /**
   * 模拟外部API调用
   */
  static createMockHttpService() {
    return {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    };
  }
}

// Jest测试设置文件
import 'reflect-metadata';

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_URL = 'redis://localhost:6379/1';

// 全局测试超时
jest.setTimeout(10000);

// 模拟console方法以避免测试输出干扰
global.console = {
  ...console,
  // 在测试中静默console.log
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// 全局测试工具函数
global.testUtils = {
  // 创建测试数据
  createTestData: (type: string, overrides: any = {}) => {
    const baseData = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        ...overrides
      },
      stock: {
        code: '000001',
        name: '平安银行',
        market: 'SZ',
        ...overrides
      },
      report: {
        id: 'test-report-id',
        stock_code: '000001',
        date: '2025-01-17',
        content: 'Test report content',
        ...overrides
      }
    };

    return baseData[type] || overrides;
  },

  // 等待异步操作
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // 创建Mock函数
  createMock: (implementation?: any) => jest.fn(implementation),

  // 创建Mock对象
  createMockObject: (methods: string[]) => {
    const mockObj: any = {};
    methods.forEach(method => {
      mockObj[method] = jest.fn();
    });
    return mockObj;
  }
};

// 测试数据库清理
beforeEach(async () => {
  // 清理测试数据库
  // 这里可以添加数据库清理逻辑
});

afterEach(async () => {
  // 清理测试数据
  // 这里可以添加测试数据清理逻辑
});

// 全局测试后清理
afterAll(async () => {
  // 关闭数据库连接
  // 这里可以添加全局清理逻辑
});

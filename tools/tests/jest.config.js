module.exports = {
  // 测试环境
  testEnvironment: 'node',

   // 根目录
   rootDir: '.',

  // 测试文件匹配模式
  testMatch: [
    '<rootDir>/**/*.test.ts',
    '<rootDir>/**/*.spec.ts',
    '<rootDir>/**/*.test.tsx',
    '<rootDir>/**/*.spec.tsx'
  ],

  // 排除Playwright E2E测试
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
    '/playwright/',
    '.*\\.e2e\\.spec\\.ts$'
  ],

  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // 转换器
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },

   // 模块路径映射
   moduleNameMapper: {
     '^@/(.*)$': '<rootDir>/../backend/src/$1',
     '^@aigc/(.*)$': '<rootDir>/../aigc/backend/src/$1',
     '^@tests/(.*)$': '<rootDir>/$1',
     '^@config/(.*)$': '<rootDir>/../config/$1'
   },

  // 覆盖率配置
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}'
  ],

  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

   // 测试设置文件
   setupFilesAfterEnv: ['<rootDir>/config/test-setup.ts'],

  // 测试超时
  testTimeout: 10000,

  // 清理模拟
  clearMocks: true,
  restoreMocks: true,

  // 详细输出
  verbose: true,

  // 并行执行
  maxWorkers: '50%',

  // 缓存
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest'
};

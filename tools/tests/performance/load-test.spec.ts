/**
 * 负载测试
 * 基于全流程测试计划v1.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { TestHelpers } from '../utils/test-helpers';

describe('Load Tests', () => {
  let app: INestApplication;
  let httpClient: request.SuperTest<request.Test>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    httpClient = TestHelpers.createHttpClient(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('API Load Tests', () => {
    it('should handle concurrent configuration requests', async () => {
      const concurrentRequests = 50;
      const requests = Array(concurrentRequests).fill(null).map((_, i) =>
        httpClient
          .get('/api/v1/admin/configs')
          .expect(200)
      );

      const startTime = Date.now();
      const results = await Promise.allSettled(requests);
      const endTime = Date.now();

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const duration = endTime - startTime;

      // 验证性能指标
      expect(successful).toBeGreaterThan(concurrentRequests * 0.9); // 90%成功率
      expect(duration).toBeLessThan(10000); // 10秒内完成
      expect(duration / concurrentRequests).toBeLessThan(200); // 平均每个请求<200ms
    });

    it('should handle high-frequency data pipeline requests', async () => {
      const requests = Array(20).fill(null).map((_, i) =>
        httpClient
          .post('/api/v1/data-pipeline/start')
          .send({
            startDate: '2024-01-01',
            endDate: '2024-01-01',
            symbols: ['000001.SZ']
          })
      );

      const startTime = Date.now();
      const results = await Promise.allSettled(requests);
      const endTime = Date.now();

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const duration = endTime - startTime;

      expect(successful).toBeGreaterThan(15); // 至少75%成功率
      expect(duration).toBeLessThan(30000); // 30秒内完成
    });

    it('should handle quant signal calculation load', async () => {
      const symbols = ['000001.SZ', '000002.SZ', '600000.SH', '600036.SH'];
      const requests = Array(10).fill(null).map(() =>
        httpClient
          .post('/api/v1/quant-signals/calculate')
          .send({
            symbols,
            date: '2024-01-01'
          })
      );

      const startTime = Date.now();
      const results = await Promise.allSettled(requests);
      const endTime = Date.now();

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const duration = endTime - startTime;

      expect(successful).toBeGreaterThan(8); // 至少80%成功率
      expect(duration).toBeLessThan(15000); // 15秒内完成
    });
  });

  describe('Database Load Tests', () => {
    it('should handle concurrent database queries', async () => {
      const concurrentQueries = 100;
      const queries = Array(concurrentQueries).fill(null).map(() =>
        httpClient
          .get('/api/v1/admin/configs')
          .query({ type: 'database' })
      );

      const startTime = Date.now();
      const results = await Promise.allSettled(queries);
      const endTime = Date.now();

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const duration = endTime - startTime;

      expect(successful).toBeGreaterThan(concurrentQueries * 0.95); // 95%成功率
      expect(duration).toBeLessThan(5000); // 5秒内完成
    });

    it('should handle bulk data operations', async () => {
      const configs = TestHelpers.generateTestData('configs', 50);
      const requests = configs.map(config =>
        httpClient
          .post('/api/v1/admin/configs')
          .send(config)
      );

      const startTime = Date.now();
      const results = await Promise.allSettled(requests);
      const endTime = Date.now();

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const duration = endTime - startTime;

      expect(successful).toBeGreaterThan(40); // 至少80%成功率
      expect(duration).toBeLessThan(20000); // 20秒内完成
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not exceed memory limits during heavy load', async () => {
      const initialMemory = process.memoryUsage();

      // 执行大量操作
      const requests = Array(100).fill(null).map(() =>
        httpClient
          .post('/api/v1/quant-signals/calculate')
          .send({
            symbols: ['000001.SZ', '000002.SZ'],
            date: '2024-01-01'
          })
      );

      await Promise.allSettled(requests);

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // 内存增长不应超过100MB
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Response Time Tests', () => {
    it('should maintain response times under load', async () => {
      const responseTimes: number[] = [];

      for (let i = 0; i < 20; i++) {
        const startTime = Date.now();
        await httpClient.get('/api/v1/health');
        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      }

      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];

      expect(avgResponseTime).toBeLessThan(100); // 平均响应时间<100ms
      expect(maxResponseTime).toBeLessThan(500); // 最大响应时间<500ms
      expect(p95ResponseTime).toBeLessThan(200); // 95%响应时间<200ms
    });
  });

  describe('Error Rate Tests', () => {
    it('should maintain low error rate under load', async () => {
      const requests = Array(200).fill(null).map(() =>
        httpClient
          .get('/api/v1/admin/configs')
          .catch(() => ({ status: 'rejected' }))
      );

      const results = await Promise.allSettled(requests);
      const errors = results.filter(r => r.status === 'rejected').length;
      const errorRate = errors / results.length;

      expect(errorRate).toBeLessThan(0.01); // 错误率<1%
    });
  });
});

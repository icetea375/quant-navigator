/**
 * 压力测试
 * 基于全流程测试计划v1.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { TestHelpers } from '../utils/test-helpers';

describe('Stress Tests', () => {
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

  describe('Peak Load Stress Test', () => {
    it('should handle peak concurrent users', async () => {
      const peakUsers = 500;
      const requests = Array(peakUsers).fill(null).map((_, i) =>
        httpClient
          .get('/api/v1/health')
          .timeout(10000)
      );

      const startTime = Date.now();
      const results = await Promise.allSettled(requests);
      const endTime = Date.now();

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const duration = endTime - startTime;

      // 验证峰值负载处理能力
      expect(successful).toBeGreaterThan(peakUsers * 0.8); // 80%成功率
      expect(duration).toBeLessThan(30000); // 30秒内完成
    });

    it('should handle burst traffic', async () => {
      // 模拟突发流量：短时间内大量请求
      const burstSize = 100;
      const burstRequests = Array(burstSize).fill(null).map(() =>
        httpClient
          .post('/api/v1/quant-signals/calculate')
          .send({
            symbols: ['000001.SZ'],
            date: '2024-01-01'
          })
          .timeout(15000)
      );

      const startTime = Date.now();
      const results = await Promise.allSettled(burstRequests);
      const endTime = Date.now();

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const duration = endTime - startTime;

      expect(successful).toBeGreaterThan(burstSize * 0.7); // 70%成功率
      expect(duration).toBeLessThan(20000); // 20秒内完成
    });
  });

  describe('Data Volume Stress Test', () => {
    it('should handle large dataset processing', async () => {
      const largeSymbols = Array(100).fill(null).map((_, i) => `00000${i + 1}.SZ`);

      const startTime = Date.now();
      const response = await httpClient
        .post('/api/v1/quant-signals/calculate')
        .send({
          symbols: largeSymbols,
          date: '2024-01-01'
        })
        .timeout(60000); // 60秒超时
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.signals).toHaveLength(largeSymbols.length);
      expect(endTime - startTime).toBeLessThan(60000); // 60秒内完成
    });

    it('should handle bulk configuration operations', async () => {
      const bulkConfigs = TestHelpers.generateTestData('configs', 200);

      const startTime = Date.now();
      const requests = bulkConfigs.map(config =>
        httpClient
          .post('/api/v1/admin/configs')
          .send(config)
          .timeout(10000)
      );

      const results = await Promise.allSettled(requests);
      const endTime = Date.now();

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const duration = endTime - startTime;

      expect(successful).toBeGreaterThan(bulkConfigs.length * 0.8); // 80%成功率
      expect(duration).toBeLessThan(30000); // 30秒内完成
    });
  });

  describe('Memory Stress Test', () => {
    it('should handle memory-intensive operations', async () => {
      const initialMemory = process.memoryUsage();

      // 执行内存密集型操作
      const memoryIntensiveRequests = Array(50).fill(null).map(() =>
        httpClient
          .post('/api/v1/data-pipeline/start')
          .send({
            startDate: '2023-01-01',
            endDate: '2023-12-31',
            symbols: Array(50).fill(null).map((_, i) => `00000${i + 1}.SZ`)
          })
          .timeout(30000)
      );

      const results = await Promise.allSettled(memoryIntensiveRequests);
      const finalMemory = process.memoryUsage();

      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const successful = results.filter(r => r.status === 'fulfilled').length;

      // 验证内存使用和成功率
      expect(memoryIncrease).toBeLessThan(500 * 1024 * 1024); // 内存增长<500MB
      expect(successful).toBeGreaterThan(25); // 至少50%成功率
    });

    it('should recover from memory pressure', async () => {
      // 强制垃圾回收
      if (global.gc) {
        global.gc();
      }

      const memoryBefore = process.memoryUsage();

      // 执行大量操作
      const requests = Array(100).fill(null).map(() =>
        httpClient
          .get('/api/v1/admin/configs')
          .timeout(5000)
      );

      await Promise.allSettled(requests);

      // 等待垃圾回收
      await TestHelpers.wait(2000);
      if (global.gc) {
        global.gc();
      }

      const memoryAfter = process.memoryUsage();
      const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed;

      // 内存应该能够回收
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024); // 内存增长<200MB
    });
  });

  describe('CPU Stress Test', () => {
    it('should handle CPU-intensive calculations', async () => {
      const cpuIntensiveRequests = Array(20).fill(null).map(() =>
        httpClient
          .post('/api/v1/predictions/train')
          .send({
            startDate: '2023-01-01',
            endDate: '2023-06-30',
            symbols: ['000001.SZ', '000002.SZ', '600000.SH', '600036.SH']
          })
          .timeout(120000) // 2分钟超时
      );

      const startTime = Date.now();
      const results = await Promise.allSettled(cpuIntensiveRequests);
      const endTime = Date.now();

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const duration = endTime - startTime;

      expect(successful).toBeGreaterThan(10); // 至少50%成功率
      expect(duration).toBeLessThan(180000); // 3分钟内完成
    });
  });

  describe('Network Stress Test', () => {
    it('should handle network latency and timeouts', async () => {
      const requests = Array(100).fill(null).map(() =>
        httpClient
          .get('/api/v1/health')
          .timeout(2000) // 2秒超时
      );

      const startTime = Date.now();
      const results = await Promise.allSettled(requests);
      const endTime = Date.now();

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const timedOut = results.filter(r =>
        r.status === 'rejected' && r.reason?.code === 'ECONNABORTED'
      ).length;

      expect(successful).toBeGreaterThan(80); // 至少80%成功
      expect(timedOut).toBeLessThan(20); // 超时<20%
    });
  });

  describe('System Recovery Test', () => {
    it('should recover from system overload', async () => {
      // 1. 先进行高负载测试
      const overloadRequests = Array(200).fill(null).map(() =>
        httpClient
          .post('/api/v1/quant-signals/calculate')
          .send({
            symbols: ['000001.SZ', '000002.SZ'],
            date: '2024-01-01'
          })
          .timeout(10000)
      );

      await Promise.allSettled(overloadRequests);

      // 2. 等待系统恢复
      await TestHelpers.wait(5000);

      // 3. 验证系统恢复
      const recoveryResponse = await httpClient
        .get('/api/v1/health')
        .timeout(5000);

      expect(recoveryResponse.status).toBe(200);
      expect(recoveryResponse.body.status).toBe('healthy');
    });
  });

  describe('Resource Exhaustion Test', () => {
    it('should handle resource exhaustion gracefully', async () => {
      // 模拟资源耗尽的情况
      const resourceExhaustingRequests = Array(1000).fill(null).map(() =>
        httpClient
          .post('/api/v1/data-pipeline/start')
          .send({
            startDate: '2024-01-01',
            endDate: '2024-01-31',
            symbols: Array(100).fill(null).map((_, i) => `00000${i + 1}.SZ`)
          })
          .timeout(5000)
      );

      const results = await Promise.allSettled(resourceExhaustingRequests);

      // 系统应该优雅地处理资源耗尽
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const rejected = results.filter(r => r.status === 'rejected').length;

      // 应该有合理的成功和拒绝比例
      expect(successful + rejected).toBe(1000);
      expect(successful).toBeGreaterThan(0); // 至少有一些成功
    });
  });
});

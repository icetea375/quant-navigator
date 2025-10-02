/**
 * 工作流端到端测试
 * 基于全流程测试计划v1.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { TestHelpers } from '../utils/test-helpers';

describe('Workflow E2E Tests', () => {
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

  describe('Configuration Management Workflow', () => {
    it('should complete full configuration lifecycle', async () => {
      // 1. 创建配置
      const createConfigRequest = {
        configType: 'database',
        configKey: 'test_host',
        configValue: 'localhost',
        description: 'Test database host'
      };

      const createResponse = await httpClient
        .post('/api/v1/admin/configs')
        .send(createConfigRequest)
        .expect(201);

      expect(TestHelpers.validateApiResponse(createResponse, ['id', 'configType', 'configKey', 'configValue']));
      const configId = createResponse.body.id;

      // 2. 获取配置
      const getResponse = await httpClient
        .get(`/api/v1/admin/configs/${configId}`)
        .expect(200);

      expect(getResponse.body.configKey).toBe(createConfigRequest.configKey);

      // 3. 更新配置
      const updateRequest = {
        configValue: '127.0.0.1',
        description: 'Updated test database host'
      };

      const updateResponse = await httpClient
        .put(`/api/v1/admin/configs/${configId}`)
        .send(updateRequest)
        .expect(200);

      expect(updateResponse.body.configValue).toBe(updateRequest.configValue);

      // 4. 发布配置
      await httpClient
        .post(`/api/v1/admin/configs/${configId}/publish`)
        .expect(200);

      // 5. 获取配置历史
      const historyResponse = await httpClient
        .get(`/api/v1/admin/configs/${configId}/history`)
        .expect(200);

      expect(Array.isArray(historyResponse.body)).toBe(true);

      // 6. 删除配置
      await httpClient
        .delete(`/api/v1/admin/configs/${configId}`)
        .expect(200);
    });

    it('should handle configuration errors gracefully', async () => {
      // 测试无效配置创建
      const invalidConfig = {
        configType: '', // 无效类型
        configKey: 'test_key',
        configValue: 'test_value'
      };

      await httpClient
        .post('/api/v1/admin/configs')
        .send(invalidConfig)
        .expect(400);

      // 测试获取不存在的配置
      await httpClient
        .get('/api/v1/admin/configs/99999')
        .expect(404);
    });
  });

  describe('Data Pipeline Workflow', () => {
    it('should process data pipeline end-to-end', async () => {
      // 1. 启动数据管道
      const startResponse = await httpClient
        .post('/api/v1/data-pipeline/start')
        .send({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          symbols: ['000001.SZ', '000002.SZ']
        })
        .expect(200);

      expect(startResponse.body.success).toBe(true);
      const pipelineId = startResponse.body.pipelineId;

      // 2. 检查管道状态
      const statusResponse = await httpClient
        .get(`/api/v1/data-pipeline/${pipelineId}/status`)
        .expect(200);

      expect(['running', 'completed', 'failed']).toContain(statusResponse.body.status);

      // 3. 等待管道完成（在实际测试中可能需要更长时间）
      await TestHelpers.wait(2000);

      // 4. 获取管道结果
      const resultResponse = await httpClient
        .get(`/api/v1/data-pipeline/${pipelineId}/results`)
        .expect(200);

      expect(resultResponse.body).toHaveProperty('data');
      expect(resultResponse.body).toHaveProperty('metadata');
    });
  });

  describe('Quant Signal Engine Workflow', () => {
    it('should calculate and return quant signals', async () => {
      // 1. 请求信号计算
      const signalResponse = await httpClient
        .post('/api/v1/quant-signals/calculate')
        .send({
          symbols: ['000001.SZ', '000002.SZ'],
          date: '2024-01-01'
        })
        .expect(200);

      expect(signalResponse.body.success).toBe(true);
      expect(signalResponse.body.signals).toBeDefined();
      expect(Array.isArray(signalResponse.body.signals)).toBe(true);

      // 2. 验证信号格式
      const signals = signalResponse.body.signals;
      signals.forEach((signal: { symbol: string; zScore: number; status: string }) => {
        expect(signal).toHaveProperty('symbol');
        expect(signal).toHaveProperty('zScore');
        expect(signal).toHaveProperty('status');
        expect(typeof signal.zScore).toBe('number');
      });
    });
  });

  describe('Prediction Engine Workflow', () => {
    it('should generate predictions end-to-end', async () => {
      // 1. 训练模型
      const trainResponse = await httpClient
        .post('/api/v1/predictions/train')
        .send({
          startDate: '2023-01-01',
          endDate: '2023-12-31',
          symbols: ['000001.SZ', '000002.SZ']
        })
        .expect(200);

      expect(trainResponse.body.success).toBe(true);
      expect(trainResponse.body.modelVersion).toBeDefined();

      // 2. 生成预测
      const predictResponse = await httpClient
        .post('/api/v1/predictions/predict')
        .send({
          symbols: ['000001.SZ', '000002.SZ'],
          date: '2024-01-01'
        })
        .expect(200);

      expect(predictResponse.body.success).toBe(true);
      expect(predictResponse.body.predictions).toBeDefined();
      expect(Array.isArray(predictResponse.body.predictions)).toBe(true);

      // 3. 验证预测格式
      const predictions = predictResponse.body.predictions;
      predictions.forEach((prediction: { symbol: string; predictedReturn: number; confidence: number }) => {
        expect(prediction).toHaveProperty('symbol');
        expect(prediction).toHaveProperty('predictedReturn');
        expect(prediction).toHaveProperty('confidence');
        expect(typeof prediction.predictedReturn).toBe('number');
        expect(typeof prediction.confidence).toBe('number');
        expect(prediction.confidence).toBeGreaterThan(0);
        expect(prediction.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Attribution Engine Workflow', () => {
    it('should perform attribution analysis end-to-end', async () => {
      // 1. 创建异常事件
      const anomalyEvent = {
        symbol: '000001.SZ',
        timestamp: '2024-01-01T09:30:00Z',
        type: 'price_anomaly',
        severity: 'high',
        data: {
          price_change: 0.15,
          volume_spike: 2.5
        }
      };

      const attributionResponse = await httpClient
        .post('/api/v1/attribution/analyze')
        .send(anomalyEvent)
        .expect(200);

      expect(attributionResponse.body.success).toBe(true);
      expect(attributionResponse.body.attribution).toBeDefined();
      expect(attributionResponse.body.attribution.primaryReason).toBeDefined();
      expect(attributionResponse.body.attribution.confidence).toBeDefined();
      expect(attributionResponse.body.attribution.causalChain).toBeDefined();
    });
  });

  describe('System Health and Monitoring', () => {
    it('should provide system health status', async () => {
      const healthResponse = await httpClient
        .get('/api/v1/health')
        .expect(200);

      expect(healthResponse.body.status).toBe('healthy');
      expect(healthResponse.body.timestamp).toBeDefined();
      expect(healthResponse.body.services).toBeDefined();
    });

    it('should provide system metrics', async () => {
      const metricsResponse = await httpClient
        .get('/api/v1/metrics')
        .expect(200);

      expect(metricsResponse.body).toHaveProperty('cpu');
      expect(metricsResponse.body).toHaveProperty('memory');
      expect(metricsResponse.body).toHaveProperty('database');
      expect(metricsResponse.body).toHaveProperty('redis');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle service unavailability gracefully', async () => {
      // 模拟服务不可用的情况
      const response = await httpClient
        .get('/api/v1/nonexistent-endpoint')
        .expect(404);

      expect(TestHelpers.validateErrorResponse(response)).toBe(true);
    });

    it('should validate request parameters', async () => {
      // 测试无效参数
      await httpClient
        .post('/api/v1/quant-signals/calculate')
        .send({
          symbols: [], // 空数组
          date: 'invalid-date' // 无效日期
        })
        .expect(400);
    });
  });
});

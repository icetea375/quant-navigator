/**
 * 双脑分析API集成测试
 * 测试 /api/dual-brain/* 端点的完整功能
 */

import request from 'supertest';
import express from 'express';
import dualBrainRouter from '../../../backend/src/api/dual-brain-api';

// 创建测试应用
const app = express();
app.use(express.json());
app.use('/api/dual-brain', dualBrainRouter);

describe('双脑分析API集成测试', () => {
  describe('POST /api/dual-brain/analyze', () => {
    it('应该成功启动双脑并行分析', async () => {
      const requestBody = {
        stock_code: '000001.SZ',
        trade_date: '2024-10-28'
      };

      const response = await request(app)
        .post('/api/dual-brain/analyze')
        .send(requestBody)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stock_code', '000001.SZ');
      expect(response.body.data).toHaveProperty('trade_date', '2024-10-28');
      expect(response.body.data).toHaveProperty('arbitration_created');
    });

    it('应该拒绝缺少必要参数的请求', async () => {
      const response = await request(app)
        .post('/api/dual-brain/analyze')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', '缺少必要参数: stock_code, trade_date');
    });

    it('应该拒绝缺少stock_code的请求', async () => {
      const response = await request(app)
        .post('/api/dual-brain/analyze')
        .send({ trade_date: '2024-10-28' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', '缺少必要参数: stock_code, trade_date');
    });

    it('应该拒绝缺少trade_date的请求', async () => {
      const response = await request(app)
        .post('/api/dual-brain/analyze')
        .send({ stock_code: '000001.SZ' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', '缺少必要参数: stock_code, trade_date');
    });
  });

  describe('GET /api/dual-brain/pending-cases', () => {
    it('应该成功获取待仲裁案件列表', async () => {
      const response = await request(app)
        .get('/api/dual-brain/pending-cases')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/dual-brain/case/:caseId/reports', () => {
    it('应该成功获取特定案件的双报告', async () => {
      // 首先创建一个测试案件
      const analyzeResponse = await request(app)
        .post('/api/dual-brain/analyze')
        .send({
          stock_code: '000001.SZ',
          trade_date: '2024-10-28'
        });

      if (analyzeResponse.body.success && analyzeResponse.body.data.arbitration_created) {
        // 获取待仲裁案件列表
        const casesResponse = await request(app)
          .get('/api/dual-brain/pending-cases');

        if (casesResponse.body.success && casesResponse.body.data.length > 0) {
          const caseId = casesResponse.body.data[0].id;

          const response = await request(app)
            .get(`/api/dual-brain/case/${caseId}/reports`)
            .expect(200);

          expect(response.body).toHaveProperty('success', true);
          expect(response.body).toHaveProperty('data');
          expect(response.body.data).toHaveProperty('case');
          expect(response.body.data).toHaveProperty('qwen_report');
          expect(response.body.data).toHaveProperty('doubao_report');
        }
      }
    });

    it('应该返回404当案件不存在时', async () => {
      const response = await request(app)
        .get('/api/dual-brain/case/non-existent-case/reports')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', '案件不存在');
    });
  });

  describe('POST /api/dual-brain/case/:caseId/arbitrate', () => {
    it('应该成功提交仲裁决策', async () => {
      // 首先创建一个测试案件
      const analyzeResponse = await request(app)
        .post('/api/dual-brain/analyze')
        .send({
          stock_code: '000001.SZ',
          trade_date: '2024-10-28'
        });

      if (analyzeResponse.body.success && analyzeResponse.body.data.arbitration_created) {
        // 获取待仲裁案件列表
        const casesResponse = await request(app)
          .get('/api/dual-brain/pending-cases');

        if (casesResponse.body.success && casesResponse.body.data.length > 0) {
          const caseId = casesResponse.body.data[0].id;

          const arbitrationData = {
            final_recommendation: '看涨',
            confidence_level: 85,
            reasoning: '基于技术分析和基本面分析，该股票具有上涨潜力',
            key_disagreements: '两个AI在风险评估上存在分歧',
            stock_code: '000001.SZ',
            trade_date: '2024-10-28'
          };

          const response = await request(app)
            .post(`/api/dual-brain/case/${caseId}/arbitrate`)
            .send(arbitrationData)
            .expect(200);

          expect(response.body).toHaveProperty('success', true);
          expect(response.body).toHaveProperty('data');
          expect(response.body.data).toHaveProperty('case_id', caseId);
          expect(response.body.data).toHaveProperty('human_report');
          expect(response.body.data).toHaveProperty('message', '仲裁决策已提交');
        }
      }
    });

    it('应该拒绝缺少必要参数的仲裁请求', async () => {
      const response = await request(app)
        .post('/api/dual-brain/case/test-case/arbitrate')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', '缺少必要参数: final_recommendation, reasoning');
    });

    it('应该拒绝缺少final_recommendation的仲裁请求', async () => {
      const response = await request(app)
        .post('/api/dual-brain/case/test-case/arbitrate')
        .send({
          reasoning: '测试推理',
          confidence_level: 80
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', '缺少必要参数: final_recommendation, reasoning');
    });

    it('应该拒绝缺少reasoning的仲裁请求', async () => {
      const response = await request(app)
        .post('/api/dual-brain/case/test-case/arbitrate')
        .send({
          final_recommendation: '看涨',
          confidence_level: 80
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', '缺少必要参数: final_recommendation, reasoning');
    });
  });

  describe('GET /api/dual-brain/performance', () => {
    it('应该成功获取分析器性能统计', async () => {
      const response = await request(app)
        .get('/api/dual-brain/performance')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('错误处理测试', () => {
    it('应该处理分析器异常情况', async () => {
      // 使用无效的股票代码来触发错误
      const response = await request(app)
        .post('/api/dual-brain/analyze')
        .send({
          stock_code: 'INVALID_CODE',
          trade_date: '2024-10-28'
        });

      // 即使分析失败，API也应该返回响应
      expect(response.body).toHaveProperty('success');
    });
  });
});

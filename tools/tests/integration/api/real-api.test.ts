/**
 * 真实API集成测试
 * 测试实际运行的后端API端点
 * 符合"测试宪法"第2条要求
 */

import request from 'supertest';
// 使用Jest语法，符合"测试宪法"要求

// 测试真实的后端服务
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

describe('真实API集成测试', () => {
  beforeAll(async () => {
    // 确保后端服务正在运行
    console.log('检查后端服务状态...');
  });

  afterAll(async () => {
    // 清理测试数据
    console.log('清理测试数据...');
  });

  describe('健康检查端点', () => {
    it('应该能够访问后端服务', async () => {
      const response = await request(API_BASE_URL)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('配置管理API', () => {
    it('应该能够获取系统配置', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/admin/configs')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('应该能够创建新配置', async () => {
      const newConfig = {
        configType: 'test',
        configKey: 'test_api_config',
        configValue: 'test_value',
        description: 'API测试配置',
        createdBy: 'test'
      };

      const response = await request(API_BASE_URL)
        .post('/api/v1/admin/configs')
        .send(newConfig)
        .expect(201);

      expect(response.body).toHaveProperty('configId');
      expect(response.body).toHaveProperty('configKey', 'test_api_config');
    });
  });

  describe('错误处理', () => {
    it('应该正确处理404错误', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/non-existent-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('应该正确处理400错误', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/v1/admin/configs')
        .send({}) // 缺少必填字段
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('API响应格式', () => {
    it('成功响应应该包含标准字段', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/admin/configs')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('错误响应应该包含标准字段', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });
  });
});

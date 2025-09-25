/**
 * 配置管理API集成测试
 * 测试 /api/v1/admin/configs/* 端点的完整功能
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConfigController } from '../../../backend/src/admin/ConfigController';
import { ConfigService } from '../../../backend/src/admin/ConfigService';
import { AdminModule } from '../../../backend/src/admin/admin.module';

describe('配置管理API集成测试', () => {
  let app: INestApplication;
  let configService: ConfigService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AdminModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configService = moduleFixture.get<ConfigService>(ConfigService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/admin/configs', () => {
    it('应该成功获取所有配置', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/configs')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('应该根据类型过滤配置', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/configs?type=system')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/v1/admin/configs/:configId', () => {
    let testConfigId: number;

    beforeAll(async () => {
      // 创建一个测试配置
      const testConfig = {
        configType: 'test',
        configKey: 'test_config_key',
        configValue: 'test_config_value',
        description: '测试配置项',
        createdBy: 'test'
      };
      
      const createdConfig = await configService.createConfig(testConfig);
      testConfigId = createdConfig.configId;
    });

    afterAll(async () => {
      // 清理测试配置
      if (testConfigId) {
        await configService.deleteConfig(testConfigId);
      }
    });

    it('应该成功获取单个配置', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/admin/configs/${testConfigId}`)
        .expect(200);

      expect(response.body).toHaveProperty('configId', testConfigId);
      expect(response.body).toHaveProperty('configKey', 'test_config_key');
      expect(response.body).toHaveProperty('configValue', 'test_config_value');
    });

    it('应该返回404当配置不存在时', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/configs/99999')
        .expect(404);
    });
  });

  describe('POST /api/v1/admin/configs', () => {
    it('应该成功创建新配置', async () => {
      const newConfig = {
        configType: 'test',
        configKey: 'new_test_config',
        configValue: 'new_test_value',
        description: '新测试配置项',
        createdBy: 'test'
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/configs')
        .send(newConfig)
        .expect(201);

      expect(response.body).toHaveProperty('configId');
      expect(response.body).toHaveProperty('configKey', 'new_test_config');
      expect(response.body).toHaveProperty('configValue', 'new_test_value');
      expect(response.body).toHaveProperty('configType', 'test');

      // 清理创建的配置
      await configService.deleteConfig(response.body.configId);
    });

    it('应该拒绝缺少必要字段的配置创建请求', async () => {
      const invalidConfig = {
        value: 'test_value',
        type: 'test'
        // 缺少 key 字段
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/configs')
        .send(invalidConfig)
        .expect(400);
    });

    it('应该拒绝重复的配置键', async () => {
      const config1 = {
        configType: 'test',
        configKey: 'duplicate_test_key',
        configValue: 'value1',
        description: '第一个配置',
        createdBy: 'test'
      };

      const config2 = {
        configType: 'test',
        configKey: 'duplicate_test_key',
        configValue: 'value2',
        description: '第二个配置',
        createdBy: 'test'
      };

      // 创建第一个配置
      const response1 = await request(app.getHttpServer())
        .post('/api/v1/admin/configs')
        .send(config1)
        .expect(201);

      // 尝试创建重复键的配置
      const response2 = await request(app.getHttpServer())
        .post('/api/v1/admin/configs')
        .send(config2)
        .expect(409); // 冲突状态码

      // 清理
      await configService.deleteConfig(response1.body.configId);
    });
  });

  describe('PUT /api/v1/admin/configs/:configId', () => {
    let testConfigId: number;

    beforeAll(async () => {
      // 创建一个测试配置
      const testConfig = {
        configType: 'test',
        configKey: 'update_test_config',
        configValue: 'original_value',
        description: '用于更新的测试配置',
        createdBy: 'test'
      };
      
      const createdConfig = await configService.createConfig(testConfig);
      testConfigId = createdConfig.configId;
    });

    afterAll(async () => {
      // 清理测试配置
      if (testConfigId) {
        await configService.deleteConfig(testConfigId);
      }
    });

    it('应该成功更新配置', async () => {
      const updateData = {
        value: 'updated_value',
        description: '更新后的描述',
        isActive: false
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/admin/configs/${testConfigId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('id', testConfigId);
      expect(response.body).toHaveProperty('value', 'updated_value');
      expect(response.body).toHaveProperty('description', '更新后的描述');
      expect(response.body).toHaveProperty('isActive', false);
    });

    it('应该返回404当更新不存在的配置时', async () => {
      const updateData = {
        value: 'updated_value'
      };

      await request(app.getHttpServer())
        .put('/api/v1/admin/configs/99999')
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /api/v1/admin/configs/:configId', () => {
    it('应该成功删除配置', async () => {
      // 创建一个用于删除的测试配置
      const testConfig = {
        key: 'delete_test_config',
        value: 'delete_test_value',
        type: 'test',
        description: '用于删除的测试配置',
        isActive: true
      };
      
      const createdConfig = await configService.createConfig(testConfig);
      const configId = createdConfig.id;

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/admin/configs/${configId}`)
        .expect(200);

      // 验证配置已被删除
      await request(app.getHttpServer())
        .get(`/api/v1/admin/configs/${configId}`)
        .expect(404);
    });

    it('应该返回404当删除不存在的配置时', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/admin/configs/99999')
        .expect(404);
    });
  });

  describe('POST /api/v1/admin/configs/:configId/publish', () => {
    let testConfigId: number;

    beforeAll(async () => {
      // 创建一个测试配置
      const testConfig = {
        key: 'publish_test_config',
        value: 'publish_test_value',
        type: 'test',
        description: '用于发布的测试配置',
        isActive: false
      };
      
      const createdConfig = await configService.createConfig(testConfig);
      testConfigId = createdConfig.id;
    });

    afterAll(async () => {
      // 清理测试配置
      if (testConfigId) {
        await configService.deleteConfig(testConfigId);
      }
    });

    it('应该成功发布配置', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/admin/configs/${testConfigId}/publish`)
        .expect(200);

      expect(response.body).toHaveProperty('message', '配置发布成功');
    });

    it('应该返回404当发布不存在的配置时', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/configs/99999/publish')
        .expect(404);
    });
  });

  describe('POST /api/v1/admin/configs/:configId/rollback', () => {
    let testConfigId: number;

    beforeAll(async () => {
      // 创建一个测试配置
      const testConfig = {
        key: 'rollback_test_config',
        value: 'rollback_test_value',
        type: 'test',
        description: '用于回滚的测试配置',
        isActive: true
      };
      
      const createdConfig = await configService.createConfig(testConfig);
      testConfigId = createdConfig.id;
    });

    afterAll(async () => {
      // 清理测试配置
      if (testConfigId) {
        await configService.deleteConfig(testConfigId);
      }
    });

    it('应该成功回滚配置', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/admin/configs/${testConfigId}/rollback`)
        .expect(200);

      expect(response.body).toHaveProperty('message', '配置回滚成功');
    });

    it('应该返回404当回滚不存在的配置时', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/configs/99999/rollback')
        .expect(404);
    });
  });

  describe('GET /api/v1/admin/configs/export', () => {
    it('应该成功导出配置', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/configs/export')
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body).toHaveProperty('configs');
      expect(Array.isArray(response.body.configs)).toBe(true);
    });

    it('应该根据类型导出配置', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/configs/export?type=system')
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body).toHaveProperty('configs');
      expect(Array.isArray(response.body.configs)).toBe(true);
    });
  });

  describe('POST /api/v1/admin/configs/import', () => {
    it('应该成功导入配置', async () => {
      const importData = {
        configs: [
          {
            key: 'imported_config_1',
            value: 'imported_value_1',
            type: 'test',
            description: '导入的配置1',
            isActive: true
          },
          {
            key: 'imported_config_2',
            value: 'imported_value_2',
            type: 'test',
            description: '导入的配置2',
            isActive: false
          }
        ]
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/configs/import')
        .send(importData)
        .expect(200);

      expect(response.body).toHaveProperty('message', '配置导入成功');
      expect(response.body).toHaveProperty('importedCount', 2);

      // 清理导入的配置
      const configs = await configService.getAllConfigs('test');
      for (const config of configs) {
        if (config.key.startsWith('imported_config_')) {
          await configService.deleteConfig(config.id);
        }
      }
    });

    it('应该拒绝无效的导入数据', async () => {
      const invalidImportData = {
        configs: [
          {
            value: 'invalid_value'
            // 缺少必要的 key 字段
          }
        ]
      };

      await request(app.getHttpServer())
        .post('/api/v1/admin/configs/import')
        .send(invalidImportData)
        .expect(400);
    });
  });
});

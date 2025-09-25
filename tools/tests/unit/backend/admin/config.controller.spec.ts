/**
 * ConfigController 单元测试
 * 严格遵循TDD铁律 - 先写测试，再写代码
 * 基于开发文档第0章TDD流程准则
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigController } from '@/admin/ConfigController';
import { ConfigService } from '@/admin/ConfigService';

// 定义测试接口 - 先定义接口，再实现
interface ConfigItem {
  configId: string;
  configType: string;
  configKey: string;
  configValue: string;
  description: string;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateConfigRequest {
  configType: string;
  configKey: string;
  configValue: string;
  description: string;
  isActive?: boolean;
}

interface UpdateConfigRequest {
  configValue?: string;
  description?: string;
  isActive?: boolean;
}

// Mock Guards - 先定义接口，再实现
class MockJwtAuthGuard {
  canActivate() {
    return true;
  }
}

class MockRolesGuard {
  canActivate() {
    return true;
  }
}

describe('ConfigController', () => {
  let controller: ConfigController;
  let service: ConfigService;

  beforeEach(async () => {
    // Arrange - 准备测试数据
    const mockConfigService = {
      getAllConfigs: jest.fn(),
      getConfigById: jest.fn(),
      getConfigsByType: jest.fn(),
      createConfig: jest.fn(),
      updateConfig: jest.fn(),
      deleteConfig: jest.fn(),
      toggleConfigStatus: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigController],
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ],
    })
    .overrideGuard(MockJwtAuthGuard)
    .useValue(new MockJwtAuthGuard())
    .overrideGuard(MockRolesGuard)
    .useValue(new MockRolesGuard())
    .compile();

    controller = module.get<ConfigController>(ConfigController);
    service = module.get<ConfigService>(ConfigService);
  });

  describe('GET /configs', () => {
    it('should return all configurations when no filters applied', async () => {
      // Arrange
      const mockConfigs: ConfigItem[] = [
        {
          configId: '1',
          configType: 'system',
          configKey: 'max_retries',
          configValue: '3',
          description: 'Maximum retry attempts',
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          configId: '2',
          configType: 'user',
          configKey: 'session_timeout',
          configValue: '3600',
          description: 'User session timeout in seconds',
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      jest.spyOn(service, 'getAllConfigs').mockResolvedValue(mockConfigs);

      // Act
      const result = await controller.getAllConfigs();

      // Assert
      expect(result).toEqual(mockConfigs);
      expect(service.getAllConfigs).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should return filtered configurations when type filter applied', async () => {
      // Arrange
      const configType = 'system';
      const mockSystemConfigs: ConfigItem[] = [
        {
          configId: '1',
          configType: 'system',
          configKey: 'max_retries',
          configValue: '3',
          description: 'Maximum retry attempts',
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      jest.spyOn(service, 'getConfigsByType').mockResolvedValue(mockSystemConfigs);

      // Act
      const result = await controller.getConfigsByType(configType);

      // Assert
      expect(result).toEqual(mockSystemConfigs);
      expect(service.getConfigsByType).toHaveBeenCalledWith(configType);
      expect(result.every(config => config.configType === configType)).toBe(true);
    });
  });

  describe('GET /configs/:id', () => {
    it('should return specific configuration by ID', async () => {
      // Arrange
      const configId = '1';
      const mockConfig: ConfigItem = {
        configId: '1',
        configType: 'system',
        configKey: 'max_retries',
        configValue: '3',
        description: 'Maximum retry attempts',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(service, 'getConfigById').mockResolvedValue(mockConfig);

      // Act
      const result = await controller.getConfigById(configId);

      // Assert
      expect(result).toEqual(mockConfig);
      expect(service.getConfigById).toHaveBeenCalledWith(configId);
    });

    it('should throw NotFoundException when configuration not found', async () => {
      // Arrange
      const configId = 'nonexistent';
      jest.spyOn(service, 'getConfigById').mockResolvedValue(null);

      // Act & Assert
      await expect(controller.getConfigById(configId)).rejects.toThrow();
    });
  });

  describe('POST /configs', () => {
    it('should create new configuration successfully', async () => {
      // Arrange
      const createRequest: CreateConfigRequest = {
        configType: 'system',
        configKey: 'new_setting',
        configValue: 'test_value',
        description: 'Test configuration',
        isActive: true
      };

      const createdConfig: ConfigItem = {
        configId: '3',
        configType: 'system',
        configKey: 'new_setting',
        configValue: 'test_value',
        description: 'Test configuration',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(service, 'createConfig').mockResolvedValue(createdConfig);

      // Act
      const result = await controller.createConfig(createRequest);

      // Assert
      expect(result).toEqual(createdConfig);
      expect(service.createConfig).toHaveBeenCalledWith(createRequest);
      expect(result.configKey).toBe(createRequest.configKey);
      expect(result.configValue).toBe(createRequest.configValue);
    });

    it('should throw BadRequestException when required fields are missing', async () => {
      // Arrange
      const invalidRequest = {
        configType: 'system',
        // Missing required fields
      } as CreateConfigRequest;

      jest.spyOn(service, 'createConfig').mockRejectedValue(new Error('Required fields missing'));

      // Act & Assert
      await expect(controller.createConfig(invalidRequest)).rejects.toThrow();
    });
  });

  describe('PUT /configs/:id', () => {
    it('should update existing configuration successfully', async () => {
      // Arrange
      const configId = '1';
      const updateRequest: UpdateConfigRequest = {
        configValue: 'updated_value',
        description: 'Updated description',
        isActive: false
      };

      const updatedConfig: ConfigItem = {
        configId: '1',
        configType: 'system',
        configKey: 'max_retries',
        configValue: 'updated_value',
        description: 'Updated description',
        isActive: false,
        version: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(service, 'updateConfig').mockResolvedValue(updatedConfig);

      // Act
      const result = await controller.updateConfig(configId, updateRequest);

      // Assert
      expect(result).toEqual(updatedConfig);
      expect(service.updateConfig).toHaveBeenCalledWith(configId, updateRequest);
      expect(result.configValue).toBe(updateRequest.configValue);
      expect(result.isActive).toBe(updateRequest.isActive);
    });

    it('should throw NotFoundException when updating non-existent configuration', async () => {
      // Arrange
      const configId = 'nonexistent';
      const updateRequest: UpdateConfigRequest = {
        configValue: 'new_value'
      };

      jest.spyOn(service, 'updateConfig').mockRejectedValue(new Error('Configuration not found'));

      // Act & Assert
      await expect(controller.updateConfig(configId, updateRequest)).rejects.toThrow();
    });
  });

  describe('DELETE /configs/:id', () => {
    it('should delete configuration successfully', async () => {
      // Arrange
      const configId = '1';
      jest.spyOn(service, 'deleteConfig').mockResolvedValue(true);

      // Act
      const result = await controller.deleteConfig(configId);

      // Assert
      expect(result).toBe(true);
      expect(service.deleteConfig).toHaveBeenCalledWith(configId);
    });

    it('should throw NotFoundException when deleting non-existent configuration', async () => {
      // Arrange
      const configId = 'nonexistent';
      jest.spyOn(service, 'deleteConfig').mockResolvedValue(false);

      // Act & Assert
      await expect(controller.deleteConfig(configId)).rejects.toThrow();
    });
  });

  describe('PATCH /configs/:id/toggle', () => {
    it('should toggle configuration status successfully', async () => {
      // Arrange
      const configId = '1';
      const toggledConfig: ConfigItem = {
        configId: '1',
        configType: 'system',
        configKey: 'max_retries',
        configValue: '3',
        description: 'Maximum retry attempts',
        isActive: false, // Toggled from true to false
        version: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(service, 'toggleConfigStatus').mockResolvedValue(toggledConfig);

      // Act
      const result = await controller.toggleConfigStatus(configId);

      // Assert
      expect(result).toEqual(toggledConfig);
      expect(service.toggleConfigStatus).toHaveBeenCalledWith(configId);
      expect(result.isActive).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle service errors gracefully', async () => {
      // Arrange
      const configId = '1';
      jest.spyOn(service, 'getConfigById').mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(controller.getConfigById(configId)).rejects.toThrow('Database connection failed');
    });

    it('should validate input parameters', async () => {
      // Arrange
      const invalidConfigId = '';
      const invalidRequest = {
        configType: '',
        configKey: '',
        configValue: ''
      } as CreateConfigRequest;

      // Act & Assert
      await expect(controller.getConfigById(invalidConfigId)).rejects.toThrow();
      await expect(controller.createConfig(invalidRequest)).rejects.toThrow();
    });
  });
});

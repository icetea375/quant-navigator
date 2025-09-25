/**
 * ConfigController 单元测试
 * 基于全流程测试计划v1.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigController } from '@/admin/ConfigController';
import { ConfigService } from '@/admin/ConfigService';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { RolesGuard } from '@/guards/roles.guard';
import { TestHelpers } from '../../utils/test-helpers';

describe('ConfigController', () => {
  let controller: ConfigController;
  let service: ConfigService;

  // Mock数据
  const mockConfigs = TestHelpers.generateTestData('configs', 3);
  const mockConfig = mockConfigs[0];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            getAllConfigs: jest.fn(),
            getConfig: jest.fn(),
            createConfig: jest.fn(),
            updateConfig: jest.fn(),
            deleteConfig: jest.fn(),
            publishConfig: jest.fn(),
            getConfigHistory: jest.fn(),
            rollbackToVersion: jest.fn(),
            refreshCache: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ConfigController>(ConfigController);
    service = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getConfigs', () => {
    it('should return all configs when no type filter', async () => {
      // Arrange
      jest.spyOn(service, 'getAllConfigs').mockResolvedValue(mockConfigs);

      // Act
      const result = await controller.getConfigs();

      // Assert
      expect(result).toEqual(mockConfigs);
      expect(service.getAllConfigs).toHaveBeenCalledWith(undefined);
    });

    it('should return configs filtered by type', async () => {
      // Arrange
      const type = 'database';
      const filteredConfigs = mockConfigs.filter(c => c.configType === type);
      jest.spyOn(service, 'getAllConfigs').mockResolvedValue(filteredConfigs);

      // Act
      const result = await controller.getConfigs(type);

      // Assert
      expect(result).toEqual(filteredConfigs);
      expect(service.getAllConfigs).toHaveBeenCalledWith(type);
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      jest.spyOn(service, 'getAllConfigs').mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getConfigs()).rejects.toThrow('Database connection failed');
    });
  });

  describe('getConfig', () => {
    it('should return config by ID', async () => {
      // Arrange
      const configId = 1;
      jest.spyOn(service, 'getConfig').mockResolvedValue(mockConfig);

      // Act
      const result = await controller.getConfig(configId);

      // Assert
      expect(result).toEqual(mockConfig);
    });

    it('should handle config not found', async () => {
      // Arrange
      const configId = 999;
      jest.spyOn(service, 'getConfig').mockRejectedValue(new Error('Config not found'));

      // Act & Assert
      await expect(controller.getConfig(configId)).rejects.toThrow('Config not found');
    });
  });

  describe('getConfigByTypeAndKey', () => {
    it('should return config by type and key', async () => {
      // Arrange
      const configType = 'database';
      const configKey = 'host';
      jest.spyOn(service, 'getConfig').mockResolvedValue(mockConfig);

      // Act
      const result = await controller.getConfigByTypeAndKey(configType, configKey);

      // Assert
      expect(result).toEqual(mockConfig);
      expect(service.getConfig).toHaveBeenCalledWith(configType, configKey);
    });
  });

  describe('createConfig', () => {
    it('should create new config', async () => {
      // Arrange
      const createRequest = {
        configType: 'database',
        configKey: 'port',
        configValue: '5432',
        description: 'Database port'
      };
      const createdConfig = { ...createRequest, id: 1, isActive: true };
      jest.spyOn(service, 'createConfig').mockResolvedValue(createdConfig);

      // Act
      const result = await controller.createConfig(createRequest);

      // Assert
      expect(result).toEqual(createdConfig);
      expect(service.createConfig).toHaveBeenCalledWith(createRequest);
    });

    it('should handle creation errors', async () => {
      // Arrange
      const createRequest = {
        configType: 'database',
        configKey: 'port',
        configValue: '5432',
        description: 'Database port'
      };
      jest.spyOn(service, 'createConfig').mockRejectedValue(new Error('Duplicate key'));

      // Act & Assert
      await expect(controller.createConfig(createRequest)).rejects.toThrow('Duplicate key');
    });
  });

  describe('updateConfig', () => {
    it('should update existing config', async () => {
      // Arrange
      const configId = 1;
      const updateRequest = {
        configValue: '3306',
        description: 'Updated database port'
      };
      const updatedConfig = { ...mockConfig, ...updateRequest };
      jest.spyOn(service, 'updateConfig').mockResolvedValue(updatedConfig);

      // Act
      const result = await controller.updateConfig(configId, updateRequest);

      // Assert
      expect(result).toEqual(updatedConfig);
      expect(service.updateConfig).toHaveBeenCalledWith(configId, updateRequest);
    });
  });

  describe('deleteConfig', () => {
    it('should delete config', async () => {
      // Arrange
      const configId = 1;
      jest.spyOn(service, 'deleteConfig').mockResolvedValue(undefined);

      // Act
      await controller.deleteConfig(configId);

      // Assert
      expect(service.deleteConfig).toHaveBeenCalledWith(configId);
    });
  });

  describe('publishConfig', () => {
    it('should publish config', async () => {
      // Arrange
      const configId = 1;
      jest.spyOn(service, 'publishConfig').mockResolvedValue(undefined);

      // Act
      await controller.publishConfig(configId);

      // Assert
      expect(service.publishConfig).toHaveBeenCalledWith(configId);
    });
  });

  describe('getConfigHistory', () => {
    it('should return config history', async () => {
      // Arrange
      const configId = 1;
      const history = [
        { version: 1, configValue: '5432', updatedAt: new Date() },
        { version: 2, configValue: '3306', updatedAt: new Date() }
      ];
      jest.spyOn(service, 'getConfigHistory').mockResolvedValue(history);

      // Act
      const result = await controller.getConfigHistory(configId);

      // Assert
      expect(result).toEqual(history);
      expect(service.getConfigHistory).toHaveBeenCalledWith(configId);
    });
  });

  describe('rollbackConfig', () => {
    it('should rollback config to specific version', async () => {
      // Arrange
      const configId = 1;
      const version = 1;
      const rolledBackConfig = { ...mockConfig, version };
      jest.spyOn(service, 'rollbackToVersion').mockResolvedValue(rolledBackConfig);

      // Act
      const result = await controller.rollbackConfig(configId, version);

      // Assert
      expect(result).toEqual(rolledBackConfig);
      expect(service.rollbackToVersion).toHaveBeenCalledWith(configId, version);
    });
  });

  describe('refreshCache', () => {
    it('should refresh config cache', async () => {
      // Arrange
      jest.spyOn(service, 'refreshCache').mockResolvedValue(undefined);

      // Act
      await controller.refreshCache();

      // Assert
      expect(service.refreshCache).toHaveBeenCalled();
    });
  });

  describe('getConfigStats', () => {
    it('should return config statistics', async () => {
      // Arrange
      jest.spyOn(service, 'getAllConfigs').mockResolvedValue(mockConfigs);

      // Act
      const result = await controller.getConfigStats();

      // Assert
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('byType');
      expect(result).toHaveProperty('byStatus');
      expect(result.total).toBe(mockConfigs.length);
    });
  });
});


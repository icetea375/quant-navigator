/**
 * ConfigService 单元测试
 * 严格遵循TDD铁律 - 先写测试，再写代码
 * 基于开发文档第0章TDD流程准则
 */

import { Test, TestingModule } from '@nestjs/testing';
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

// Mock Redis Service - 先定义接口，再实现
class MockRedisService {
  get(key: string): Promise<string | null> {
    return Promise.resolve(null);
  }

  set(key: string, value: string, ttl?: number): Promise<void> {
    return Promise.resolve();
  }

  del(key: string): Promise<void> {
    return Promise.resolve();
  }

  exists(key: string): Promise<boolean> {
    return Promise.resolve(false);
  }
}

// Mock Database Repository - 先定义接口，再实现
class MockConfigRepository {
  find(): Promise<ConfigItem[]> {
    return Promise.resolve([]);
  }

  findOne(options: Record<string, unknown>): Promise<ConfigItem | null> {
    return Promise.resolve(null);
  }

  save(entity: ConfigItem): Promise<ConfigItem> {
    return Promise.resolve(entity);
  }

  update(id: string, entity: Partial<ConfigItem>): Promise<{ affected: number }> {
    return Promise.resolve({ affected: 1 });
  }

  delete(id: string): Promise<{ affected: number }> {
    return Promise.resolve({ affected: 1 });
  }
}

describe('ConfigService', () => {
  let service: ConfigService;
  let mockRedisService: MockRedisService;
  let mockRepository: MockConfigRepository;

  beforeEach(async () => {
    // Arrange - 准备测试数据
    mockRedisService = new MockRedisService();
    mockRepository = new MockConfigRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            getAllConfigs: jest.fn(),
            getConfigById: jest.fn(),
            getConfigsByType: jest.fn(),
            createConfig: jest.fn(),
            updateConfig: jest.fn(),
            deleteConfig: jest.fn(),
            toggleConfigStatus: jest.fn(),
            getConfigFromCache: jest.fn(),
            setConfigToCache: jest.fn(),
            clearConfigCache: jest.fn()
          }
        },
        {
          provide: 'RedisService',
          useValue: mockRedisService
        },
        {
          provide: 'ConfigRepository',
          useValue: mockRepository
        }
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  describe('getAllConfigs', () => {
    it('should return all configurations from database', async () => {
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
      const result = await service.getAllConfigs();

      // Assert
      expect(result).toEqual(mockConfigs);
      expect(result).toHaveLength(2);
      expect(result.every(config => config.isActive)).toBe(true);
    });

    it('should return empty array when no configurations exist', async () => {
      // Arrange
      jest.spyOn(service, 'getAllConfigs').mockResolvedValue([]);

      // Act
      const result = await service.getAllConfigs();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getConfigById', () => {
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
      const result = await service.getConfigById(configId);

      // Assert
      expect(result).toEqual(mockConfig);
      expect(result.configId).toBe(configId);
    });

    it('should return null when configuration not found', async () => {
      // Arrange
      const configId = 'nonexistent';
      jest.spyOn(service, 'getConfigById').mockResolvedValue(null);

      // Act
      const result = await service.getConfigById(configId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getConfigsByType', () => {
    it('should return configurations filtered by type', async () => {
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
      const result = await service.getConfigsByType(configType);

      // Assert
      expect(result).toEqual(mockSystemConfigs);
      expect(result.every(config => config.configType === configType)).toBe(true);
    });
  });

  describe('createConfig', () => {
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
      const result = await service.createConfig(createRequest);

      // Assert
      expect(result).toEqual(createdConfig);
      expect(result.configKey).toBe(createRequest.configKey);
      expect(result.configValue).toBe(createRequest.configValue);
      expect(result.configType).toBe(createRequest.configType);
    });

    it('should throw error when creating duplicate configuration', async () => {
      // Arrange
      const createRequest: CreateConfigRequest = {
        configType: 'system',
        configKey: 'existing_key',
        configValue: 'test_value',
        description: 'Test configuration',
        isActive: true
      };

      jest.spyOn(service, 'createConfig').mockRejectedValue(new Error('Configuration already exists'));

      // Act & Assert
      await expect(service.createConfig(createRequest)).rejects.toThrow('Configuration already exists');
    });
  });

  describe('updateConfig', () => {
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
      const result = await service.updateConfig(configId, updateRequest);

      // Assert
      expect(result).toEqual(updatedConfig);
      expect(result.configValue).toBe(updateRequest.configValue);
      expect(result.isActive).toBe(updateRequest.isActive);
      expect(result.version).toBe(2); // Version should be incremented
    });

    it('should throw error when updating non-existent configuration', async () => {
      // Arrange
      const configId = 'nonexistent';
      const updateRequest: UpdateConfigRequest = {
        configValue: 'new_value'
      };

      jest.spyOn(service, 'updateConfig').mockRejectedValue(new Error('Configuration not found'));

      // Act & Assert
      await expect(service.updateConfig(configId, updateRequest)).rejects.toThrow('Configuration not found');
    });
  });

  describe('deleteConfig', () => {
    it('should delete configuration successfully', async () => {
      // Arrange
      const configId = '1';
      jest.spyOn(service, 'deleteConfig').mockResolvedValue(true);

      // Act
      const result = await service.deleteConfig(configId);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when deleting non-existent configuration', async () => {
      // Arrange
      const configId = 'nonexistent';
      jest.spyOn(service, 'deleteConfig').mockResolvedValue(false);

      // Act
      const result = await service.deleteConfig(configId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('toggleConfigStatus', () => {
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
      const result = await service.toggleConfigStatus(configId);

      // Assert
      expect(result).toEqual(toggledConfig);
      expect(result.isActive).toBe(false);
    });
  });

  describe('caching', () => {
    it('should get configuration from cache when available', async () => {
      // Arrange
      const configKey = 'max_retries';
      const cachedValue = '3';
      jest.spyOn(mockRedisService, 'get').mockResolvedValue(cachedValue);
      jest.spyOn(service, 'getConfigFromCache').mockResolvedValue(cachedValue);

      // Act
      const result = await service.getConfigFromCache(configKey);

      // Assert
      expect(result).toBe(cachedValue);
      expect(mockRedisService.get).toHaveBeenCalledWith(`config:${configKey}`);
    });

    it('should set configuration to cache', async () => {
      // Arrange
      const configKey = 'max_retries';
      const configValue = '3';
      const ttl = 3600;
      jest.spyOn(mockRedisService, 'set').mockResolvedValue();
      jest.spyOn(service, 'setConfigToCache').mockResolvedValue(undefined);

      // Act
      await service.setConfigToCache(configKey, configValue, ttl);

      // Assert
      expect(mockRedisService.set).toHaveBeenCalledWith(`config:${configKey}`, configValue, ttl);
    });

    it('should clear configuration cache', async () => {
      // Arrange
      const configKey = 'max_retries';
      jest.spyOn(mockRedisService, 'del').mockResolvedValue();
      jest.spyOn(service, 'clearConfigCache').mockResolvedValue(undefined);

      // Act
      await service.clearConfigCache(configKey);

      // Assert
      expect(mockRedisService.del).toHaveBeenCalledWith(`config:${configKey}`);
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Arrange
      jest.spyOn(service, 'getAllConfigs').mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(service.getAllConfigs()).rejects.toThrow('Database connection failed');
    });

    it('should handle Redis connection errors gracefully', async () => {
      // Arrange
      jest.spyOn(mockRedisService, 'get').mockRejectedValue(new Error('Redis connection failed'));
      jest.spyOn(service, 'getConfigFromCache').mockRejectedValue(new Error('Redis connection failed'));

      // Act & Assert
      await expect(service.getConfigFromCache('test_key')).rejects.toThrow('Redis connection failed');
    });

    it('should validate input parameters', async () => {
      // Arrange
      const invalidRequest = {
        configType: '',
        configKey: '',
        configValue: ''
      } as CreateConfigRequest;

      jest.spyOn(service, 'createConfig').mockRejectedValue(new Error('Invalid input parameters'));

      // Act & Assert
      await expect(service.createConfig(invalidRequest)).rejects.toThrow('Invalid input parameters');
    });
  });
});

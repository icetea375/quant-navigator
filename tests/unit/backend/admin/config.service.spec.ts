/**
 * ConfigService 单元测试
 * 基于全流程测试计划v1.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@/admin/ConfigService';
import { TestHelpers } from '../../utils/test-helpers';

describe('ConfigService', () => {
  let service: ConfigService;
  let mockDatabase: any;

  // Mock数据
  const mockConfigs = TestHelpers.generateTestData('configs', 5);
  const mockConfig = mockConfigs[0];

  beforeEach(async () => {
    // 创建Mock数据库
    mockDatabase = TestHelpers.createMockDatabase();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        {
          provide: 'Database',
          useValue: mockDatabase,
        },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllConfigs', () => {
    it('should return all configs', async () => {
      // Arrange
      mockDatabase.query.mockResolvedValue({ rows: mockConfigs });

      // Act
      const result = await service.getAllConfigs();

      // Assert
      expect(result).toEqual(mockConfigs);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.any(Array)
      );
    });

    it('should return configs filtered by type', async () => {
      // Arrange
      const type = 'database';
      const filteredConfigs = mockConfigs.filter(c => c.configType === type);
      mockDatabase.query.mockResolvedValue({ rows: filteredConfigs });

      // Act
      const result = await service.getAllConfigs(type);

      // Assert
      expect(result).toEqual(filteredConfigs);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE config_type = $1'),
        [type]
      );
    });

    it('should handle database errors', async () => {
      // Arrange
      mockDatabase.query.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(service.getAllConfigs()).rejects.toThrow('Database connection failed');
    });
  });

  describe('getConfig', () => {
    it('should return config by type and key', async () => {
      // Arrange
      const configType = 'database';
      const configKey = 'host';
      mockDatabase.query.mockResolvedValue({ rows: [mockConfig] });

      // Act
      const result = await service.getConfig(configType, configKey);

      // Assert
      expect(result).toEqual(mockConfig);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE config_type = $1 AND config_key = $2'),
        [configType, configKey]
      );
    });

    it('should throw error when config not found', async () => {
      // Arrange
      const configType = 'database';
      const configKey = 'nonexistent';
      mockDatabase.query.mockResolvedValue({ rows: [] });

      // Act & Assert
      await expect(service.getConfig(configType, configKey)).rejects.toThrow('Config not found');
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
      mockDatabase.query.mockResolvedValue({ rows: [createdConfig] });

      // Act
      const result = await service.createConfig(createRequest);

      // Assert
      expect(result).toEqual(createdConfig);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO'),
        expect.arrayContaining([
          createRequest.configType,
          createRequest.configKey,
          createRequest.configValue,
          createRequest.description
        ])
      );
    });

    it('should handle duplicate key error', async () => {
      // Arrange
      const createRequest = {
        configType: 'database',
        configKey: 'host',
        configValue: 'localhost',
        description: 'Database host'
      };
      mockDatabase.query.mockRejectedValue(new Error('duplicate key value violates unique constraint'));

      // Act & Assert
      await expect(service.createConfig(createRequest)).rejects.toThrow('duplicate key value violates unique constraint');
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
      mockDatabase.query.mockResolvedValue({ rows: [updatedConfig] });

      // Act
      const result = await service.updateConfig(configId, updateRequest);

      // Assert
      expect(result).toEqual(updatedConfig);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining([configId])
      );
    });

    it('should throw error when config not found for update', async () => {
      // Arrange
      const configId = 999;
      const updateRequest = { configValue: '3306' };
      mockDatabase.query.mockResolvedValue({ rows: [] });

      // Act & Assert
      await expect(service.updateConfig(configId, updateRequest)).rejects.toThrow('Config not found');
    });
  });

  describe('deleteConfig', () => {
    it('should delete config', async () => {
      // Arrange
      const configId = 1;
      mockDatabase.query.mockResolvedValue({ rowCount: 1 });

      // Act
      await service.deleteConfig(configId);

      // Assert
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM'),
        [configId]
      );
    });

    it('should throw error when config not found for deletion', async () => {
      // Arrange
      const configId = 999;
      mockDatabase.query.mockResolvedValue({ rowCount: 0 });

      // Act & Assert
      await expect(service.deleteConfig(configId)).rejects.toThrow('Config not found');
    });
  });

  describe('publishConfig', () => {
    it('should publish config', async () => {
      // Arrange
      const configId = 1;
      mockDatabase.query.mockResolvedValue({ rowCount: 1 });

      // Act
      await service.publishConfig(configId);

      // Assert
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining([configId])
      );
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
      mockDatabase.query.mockResolvedValue({ rows: history });

      // Act
      const result = await service.getConfigHistory(configId);

      // Assert
      expect(result).toEqual(history);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [configId]
      );
    });
  });

  describe('rollbackToVersion', () => {
    it('should rollback config to specific version', async () => {
      // Arrange
      const configId = 1;
      const version = 1;
      const rolledBackConfig = { ...mockConfig, version };
      mockDatabase.query.mockResolvedValue({ rows: [rolledBackConfig] });

      // Act
      const result = await service.rollbackToVersion(configId, version);

      // Assert
      expect(result).toEqual(rolledBackConfig);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining([configId, version])
      );
    });
  });

  describe('refreshCache', () => {
    it('should refresh config cache', async () => {
      // Arrange
      mockDatabase.query.mockResolvedValue({ rows: mockConfigs });

      // Act
      await service.refreshCache();

      // Assert
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.any(Array)
      );
    });
  });
});


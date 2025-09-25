import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigItem, CreateConfigRequest, UpdateConfigRequest, ConfigVersion } from './interfaces/config.interface';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);

  constructor(
    @InjectRepository(ConfigItem)
    private configRepository: Repository<ConfigItem>,
    private redisService: RedisService,
  ) {}

  /**
   * 获取单个配置
   */
  async getConfig(configType: string, configKey: string): Promise<ConfigItem> {
    try {
      // 优先从缓存获取
      const cachedConfig = await this.getCachedConfig(configType, configKey);
      if (cachedConfig) {
        return cachedConfig;
      }

      // 从数据库获取
      const config = await this.configRepository.findOne({
        where: { configType, configKey, isActive: true }
      });

      if (config) {
        // 更新缓存
        await this.redisService.set(`config:${configType}:${configKey}`, config, 3600);
      }

      return config;
    } catch (error) {
      this.logger.error(`Failed to get config ${configType}:${configKey}`, error);
      throw error;
    }
  }

  /**
   * 获取所有配置
   */
  async getAllConfigs(configType?: string): Promise<ConfigItem[]> {
    try {
      const whereCondition = { isActive: true };
      if (configType) {
        whereCondition['configType'] = configType;
      }

      const configs = await this.configRepository.find({
        where: whereCondition,
        order: { configType: 'ASC', configKey: 'ASC' }
      });

      return configs;
    } catch (error) {
      this.logger.error('Failed to get all configs', error);
      throw error;
    }
  }

  /**
   * 创建配置
   */
  async createConfig(config: CreateConfigRequest): Promise<ConfigItem> {
    try {
      // 检查是否已存在
      const existingConfig = await this.configRepository.findOne({
        where: { configType: config.configType, configKey: config.configKey }
      });

      if (existingConfig) {
        throw new Error(`Config ${config.configType}:${config.configKey} already exists`);
      }

      // 创建新配置
      const newConfig = this.configRepository.create({
        ...config,
        version: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedConfig = await this.configRepository.save(newConfig);

      // 更新缓存
      await this.redisService.set(`config:${savedConfig.configType}:${savedConfig.configKey}`, savedConfig, 3600);

      this.logger.log(`Created config ${savedConfig.configType}:${savedConfig.configKey}`);
      return savedConfig;
    } catch (error) {
      this.logger.error(`Failed to create config ${config.configType}:${config.configKey}`, error);
      throw error;
    }
  }

  /**
   * 更新配置
   */
  async updateConfig(configId: number, config: UpdateConfigRequest): Promise<ConfigItem> {
    try {
      const existingConfig = await this.configRepository.findOne({
        where: { configId }
      });

      if (!existingConfig) {
        throw new Error(`Config with ID ${configId} not found`);
      }

      // 更新配置
      const updatedConfig = await this.configRepository.save({
        ...existingConfig,
        ...config,
        version: existingConfig.version + 1,
        updatedAt: new Date()
      });

      // 更新缓存
      await this.redisService.set(`config:${updatedConfig.configType}:${updatedConfig.configKey}`, updatedConfig, 3600);

      this.logger.log(`Updated config ${updatedConfig.configType}:${updatedConfig.configKey}`);
      return updatedConfig;
    } catch (error) {
      this.logger.error(`Failed to update config ${configId}`, error);
      throw error;
    }
  }

  /**
   * 删除配置（逻辑删除）
   */
  async deleteConfig(configId: number): Promise<void> {
    try {
      const config = await this.configRepository.findOne({
        where: { configId }
      });

      if (!config) {
        throw new Error(`Config with ID ${configId} not found`);
      }

      // 逻辑删除
      await this.configRepository.update(configId, {
        isActive: false,
        updatedAt: new Date()
      });

      // 从缓存中删除
      await this.redisService.del(`config:${config.configType}:${config.configKey}`);

      this.logger.log(`Deleted config ${config.configType}:${config.configKey}`);
    } catch (error) {
      this.logger.error(`Failed to delete config ${configId}`, error);
      throw error;
    }
  }

  /**
   * 刷新缓存
   */
  async refreshCache(): Promise<void> {
    try {
      // 清除所有配置缓存
      const keys = await this.redisService.keys('config:*');
      if (keys.length > 0) {
        await this.redisService.del(...keys);
      }

      // 重新加载所有活跃配置
      const configs = await this.getAllConfigs();
      for (const config of configs) {
        await this.redisService.set(`config:${config.configType}:${config.configKey}`, config, 3600);
      }

      this.logger.log(`Refreshed cache with ${configs.length} configs`);
    } catch (error) {
      this.logger.error('Failed to refresh cache', error);
      throw error;
    }
  }

  /**
   * 从缓存获取配置
   */
  async getCachedConfig(configType: string, configKey: string): Promise<ConfigItem | null> {
    try {
      const cached = await this.redisService.get(`config:${configType}:${configKey}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      this.logger.warn(`Failed to get cached config ${configType}:${configKey}`, error);
      return null;
    }
  }

  /**
   * 获取配置历史
   */
  async getConfigHistory(configId: number): Promise<ConfigVersion[]> {
    try {
      // 这里需要实现配置历史表
      // 暂时返回空数组
      return [];
    } catch (error) {
      this.logger.error(`Failed to get config history ${configId}`, error);
      throw error;
    }
  }

  /**
   * 回滚到指定版本
   */
  async rollbackToVersion(configId: number, version: number): Promise<ConfigItem> {
    try {
      // 这里需要实现版本回滚逻辑
      // 暂时抛出未实现错误
      throw new Error('Version rollback not implemented yet');
    } catch (error) {
      this.logger.error(`Failed to rollback config ${configId} to version ${version}`, error);
      throw error;
    }
  }

  /**
   * 发布配置
   */
  async publishConfig(configId: number): Promise<void> {
    try {
      const config = await this.configRepository.findOne({
        where: { configId }
      });

      if (!config) {
        throw new Error(`Config with ID ${configId} not found`);
      }

      // 更新缓存
      await this.redisService.set(`config:${config.configType}:${config.configKey}`, config, 3600);

      this.logger.log(`Published config ${config.configType}:${config.configKey}`);
    } catch (error) {
      this.logger.error(`Failed to publish config ${configId}`, error);
      throw error;
    }
  }

  /**
   * 通知配置变更
   */
  async notifyConfigChange(configType: string, configKey: string): Promise<void> {
    try {
      // 这里可以实现配置变更通知机制
      // 例如：通过消息队列通知其他服务
      this.logger.log(`Notified config change: ${configType}:${configKey}`);
    } catch (error) {
      this.logger.error(`Failed to notify config change ${configType}:${configKey}`, error);
      throw error;
    }
  }
}

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { ConfigService } from './ConfigService';
import { ConfigItem, CreateConfigRequest, UpdateConfigRequest } from './interfaces/config.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('api/v1/admin/configs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'CONFIG_MANAGER')
export class ConfigController {
  private readonly logger = new Logger(ConfigController.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * 获取配置列表
   */
  @Get()
  async getConfigs(@Query('type') type?: string): Promise<ConfigItem[]> {
    try {
      this.logger.log(`Getting configs with type: ${type || 'all'}`);
      return await this.configService.getAllConfigs(type);
    } catch (error) {
      this.logger.error('Failed to get configs', error);
      throw error;
    }
  }

  /**
   * 获取单个配置
   */
  @Get(':configId')
  async getConfig(@Param('configId') configId: number): Promise<ConfigItem> {
    try {
      this.logger.log(`Getting config ${configId}`);
      // 这里需要根据configId获取配置，暂时返回null
      // 实际实现需要根据configId查询数据库
      throw new Error('Get config by ID not implemented yet');
    } catch (error) {
      this.logger.error(`Failed to get config ${configId}`, error);
      throw error;
    }
  }

  /**
   * 根据类型和键获取配置
   */
  @Get('type/:configType/key/:configKey')
  async getConfigByTypeAndKey(
    @Param('configType') configType: string,
    @Param('configKey') configKey: string
  ): Promise<ConfigItem> {
    try {
      this.logger.log(`Getting config ${configType}:${configKey}`);
      return await this.configService.getConfig(configType, configKey);
    } catch (error) {
      this.logger.error(`Failed to get config ${configType}:${configKey}`, error);
      throw error;
    }
  }

  /**
   * 创建配置
   */
  @Post()
  async createConfig(@Body() config: CreateConfigRequest): Promise<ConfigItem> {
    try {
      this.logger.log(`Creating config ${config.configType}:${config.configKey}`);
      return await this.configService.createConfig(config);
    } catch (error) {
      this.logger.error(`Failed to create config ${config.configType}:${config.configKey}`, error);
      throw error;
    }
  }

  /**
   * 更新配置
   */
  @Put(':configId')
  async updateConfig(
    @Param('configId') configId: number,
    @Body() config: UpdateConfigRequest
  ): Promise<ConfigItem> {
    try {
      this.logger.log(`Updating config ${configId}`);
      return await this.configService.updateConfig(configId, config);
    } catch (error) {
      this.logger.error(`Failed to update config ${configId}`, error);
      throw error;
    }
  }

  /**
   * 删除配置
   */
  @Delete(':configId')
  async deleteConfig(@Param('configId') configId: number): Promise<void> {
    try {
      this.logger.log(`Deleting config ${configId}`);
      await this.configService.deleteConfig(configId);
    } catch (error) {
      this.logger.error(`Failed to delete config ${configId}`, error);
      throw error;
    }
  }

  /**
   * 发布配置
   */
  @Post(':configId/publish')
  async publishConfig(@Param('configId') configId: number): Promise<void> {
    try {
      this.logger.log(`Publishing config ${configId}`);
      await this.configService.publishConfig(configId);
    } catch (error) {
      this.logger.error(`Failed to publish config ${configId}`, error);
      throw error;
    }
  }

  /**
   * 获取配置历史
   */
  @Get(':configId/history')
  async getConfigHistory(@Param('configId') configId: number): Promise<any[]> {
    try {
      this.logger.log(`Getting config history ${configId}`);
      return await this.configService.getConfigHistory(configId);
    } catch (error) {
      this.logger.error(`Failed to get config history ${configId}`, error);
      throw error;
    }
  }

  /**
   * 回滚配置
   */
  @Post(':configId/rollback/:version')
  async rollbackConfig(
    @Param('configId') configId: number,
    @Param('version') version: number
  ): Promise<ConfigItem> {
    try {
      this.logger.log(`Rolling back config ${configId} to version ${version}`);
      return await this.configService.rollbackToVersion(configId, version);
    } catch (error) {
      this.logger.error(`Failed to rollback config ${configId} to version ${version}`, error);
      throw error;
    }
  }

  /**
   * 刷新缓存
   */
  @Post('cache/refresh')
  async refreshCache(): Promise<void> {
    try {
      this.logger.log('Refreshing config cache');
      await this.configService.refreshCache();
    } catch (error) {
      this.logger.error('Failed to refresh cache', error);
      throw error;
    }
  }

  /**
   * 获取配置统计信息
   */
  @Get('stats/summary')
  async getConfigStats(): Promise<any> {
    try {
      this.logger.log('Getting config statistics');
      const configs = await this.configService.getAllConfigs();
      
      const stats = {
        total: configs.length,
        byType: {},
        byStatus: {
          active: configs.filter(c => c.isActive).length,
          inactive: configs.filter(c => !c.isActive).length
        }
      };

      // 按类型统计
      configs.forEach(config => {
        if (!stats.byType[config.configType]) {
          stats.byType[config.configType] = 0;
        }
        stats.byType[config.configType]++;
      });

      return stats;
    } catch (error) {
      this.logger.error('Failed to get config statistics', error);
      throw error;
    }
  }
}

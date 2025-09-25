import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { ConfigChangeEvent } from './interfaces/config.interface';
import { ConfigService } from './ConfigService';

@Injectable()
export class ConfigHotReloadService {
  private readonly logger = new Logger(ConfigHotReloadService.name);
  private readonly configChangeSubject = new Subject<ConfigChangeEvent>();

  constructor(private readonly configService: ConfigService) {}

  /**
   * 更新配置并通知变更
   */
  async updateConfig(configId: number, newConfig: any): Promise<void> {
    try {
      // 1. 更新数据库
      await this.configService.updateConfig(configId, newConfig);

      // 2. 通知配置变更
      this.configChangeSubject.next({
        type: 'UPDATE',
        configType: newConfig.configType,
        configKey: newConfig.configKey,
        newConfig
      });

      this.logger.log(`Updated and notified config change: ${newConfig.configType}:${newConfig.configKey}`);
    } catch (error) {
      this.logger.error(`Failed to update config ${configId}`, error);
      throw error;
    }
  }

  /**
   * 创建配置并通知变更
   */
  async createConfig(newConfig: any): Promise<void> {
    try {
      // 1. 创建配置
      const createdConfig = await this.configService.createConfig(newConfig);

      // 2. 通知配置变更
      this.configChangeSubject.next({
        type: 'CREATE',
        configType: createdConfig.configType,
        configKey: createdConfig.configKey,
        newConfig: createdConfig
      });

      this.logger.log(`Created and notified config change: ${createdConfig.configType}:${createdConfig.configKey}`);
    } catch (error) {
      this.logger.error(`Failed to create config`, error);
      throw error;
    }
  }

  /**
   * 删除配置并通知变更
   */
  async deleteConfig(configId: number, configType: string, configKey: string): Promise<void> {
    try {
      // 1. 删除配置
      await this.configService.deleteConfig(configId);

      // 2. 通知配置变更
      this.configChangeSubject.next({
        type: 'DELETE',
        configType,
        configKey
      });

      this.logger.log(`Deleted and notified config change: ${configType}:${configKey}`);
    } catch (error) {
      this.logger.error(`Failed to delete config ${configId}`, error);
      throw error;
    }
  }

  /**
   * 发布配置并通知变更
   */
  async publishConfig(configId: number, configType: string, configKey: string): Promise<void> {
    try {
      // 1. 发布配置
      await this.configService.publishConfig(configId);

      // 2. 通知配置变更
      this.configChangeSubject.next({
        type: 'PUBLISH',
        configType,
        configKey
      });

      this.logger.log(`Published and notified config change: ${configType}:${configKey}`);
    } catch (error) {
      this.logger.error(`Failed to publish config ${configId}`, error);
      throw error;
    }
  }

  /**
   * 订阅配置变更
   */
  onConfigChange(): Observable<ConfigChangeEvent> {
    return this.configChangeSubject.asObservable();
  }

  /**
   * 通知配置变更
   */
  async notifyConfigChange(configType: string, configKey: string): Promise<void> {
    try {
      this.configChangeSubject.next({
        type: 'UPDATE',
        configType,
        configKey
      });

      this.logger.log(`Notified config change: ${configType}:${configKey}`);
    } catch (error) {
      this.logger.error(`Failed to notify config change ${configType}:${configKey}`, error);
      throw error;
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from './ConfigService';
import { ConfigMigrationResult } from './interfaces/config.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ConfigMigrationService {
  private readonly logger = new Logger(ConfigMigrationService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * 从文件迁移配置到数据库
   */
  async migrateFromFiles(): Promise<ConfigMigrationResult> {
    const result: ConfigMigrationResult = {
      success: true,
      migratedCount: 0,
      errors: []
    };

    try {
      this.logger.log('Starting configuration migration from files');

      // 迁移归因规则
      await this.migrateAttributionRules(result);

      // 迁移事件标签
      await this.migrateEventTags(result);

      // 迁移Prompt模板
      await this.migratePromptTemplates(result);

      // 迁移股票宇宙规则
      await this.migrateUniverseRules(result);

      // 迁移预测特征
      await this.migratePredictionFeatures(result);

      this.logger.log(`Configuration migration completed. Migrated ${result.migratedCount} configs`);
    } catch (error) {
      this.logger.error('Configuration migration failed', error);
      result.success = false;
      result.errors.push(error.message);
    }

    return result;
  }

  /**
   * 迁移归因规则
   */
  private async migrateAttributionRules(result: ConfigMigrationResult): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), 'config', 'attribution_rules.json');

      if (!fs.existsSync(filePath)) {
        this.logger.warn('attribution_rules.json not found, skipping migration');
        return;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const rules = JSON.parse(content);

      if (rules.rules && Array.isArray(rules.rules)) {
        for (const rule of rules.rules) {
          try {
            await this.configService.createConfig({
              configType: 'ATTRIBUTION_RULE',
              configKey: rule.rule_id,
              configValue: rule,
              description: rule.description,
              createdBy: 'migration'
            });
            result.migratedCount++;
          } catch (error) {
            result.errors.push(`Failed to migrate attribution rule ${rule.rule_id}: ${error.message}`);
          }
        }
      }

      this.logger.log(`Migrated ${rules.rules?.length || 0} attribution rules`);
    } catch (error) {
      result.errors.push(`Failed to migrate attribution rules: ${error.message}`);
    }
  }

  /**
   * 迁移事件标签
   */
  private async migrateEventTags(result: ConfigMigrationResult): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), 'config', 'event_tags.json');

      if (!fs.existsSync(filePath)) {
        this.logger.warn('event_tags.json not found, skipping migration');
        return;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const tags = JSON.parse(content);

      if (tags.tags && Array.isArray(tags.tags)) {
        for (const tag of tags.tags) {
          try {
            await this.configService.createConfig({
              configType: 'EVENT_TAG',
              configKey: tag.tag_id,
              configValue: tag,
              description: tag.description,
              createdBy: 'migration'
            });
            result.migratedCount++;
          } catch (error) {
            result.errors.push(`Failed to migrate event tag ${tag.tag_id}: ${error.message}`);
          }
        }
      }

      this.logger.log(`Migrated ${tags.tags?.length || 0} event tags`);
    } catch (error) {
      result.errors.push(`Failed to migrate event tags: ${error.message}`);
    }
  }

  /**
   * 迁移Prompt模板
   */
  private async migratePromptTemplates(result: ConfigMigrationResult): Promise<void> {
    try {
      // 这里可以扫描prompt模板文件目录
      const promptDir = path.join(process.cwd(), 'config', 'prompts');

      if (!fs.existsSync(promptDir)) {
        this.logger.warn('prompts directory not found, skipping migration');
        return;
      }

      const files = fs.readdirSync(promptDir);
      const promptFiles = files.filter(file => file.endsWith('.txt') || file.endsWith('.md'));

      for (const file of promptFiles) {
        try {
          const filePath = path.join(promptDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const templateName = path.basename(file, path.extname(file));

          await this.configService.createConfig({
            configType: 'PROMPT_TEMPLATE',
            configKey: templateName,
            configValue: {
              template_id: templateName,
              template_name: templateName,
              content: content,
              version: '1.0'
            },
            description: `Prompt template: ${templateName}`,
            createdBy: 'migration'
          });
          result.migratedCount++;
        } catch (error) {
          result.errors.push(`Failed to migrate prompt template ${file}: ${error.message}`);
        }
      }

      this.logger.log(`Migrated ${promptFiles.length} prompt templates`);
    } catch (error) {
      result.errors.push(`Failed to migrate prompt templates: ${error.message}`);
    }
  }

  /**
   * 迁移股票宇宙规则
   */
  private async migrateUniverseRules(result: ConfigMigrationResult): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), 'config', 'universe_rules.json');

      if (!fs.existsSync(filePath)) {
        this.logger.warn('universe_rules.json not found, skipping migration');
        return;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const rules = JSON.parse(content);

      if (rules.rules && Array.isArray(rules.rules)) {
        for (const rule of rules.rules) {
          try {
            await this.configService.createConfig({
              configType: 'UNIVERSE_RULE',
              configKey: rule.rule_id,
              configValue: rule,
              description: rule.description,
              createdBy: 'migration'
            });
            result.migratedCount++;
          } catch (error) {
            result.errors.push(`Failed to migrate universe rule ${rule.rule_id}: ${error.message}`);
          }
        }
      }

      this.logger.log(`Migrated ${rules.rules?.length || 0} universe rules`);
    } catch (error) {
      result.errors.push(`Failed to migrate universe rules: ${error.message}`);
    }
  }

  /**
   * 迁移预测特征
   */
  private async migratePredictionFeatures(result: ConfigMigrationResult): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), 'config', 'prediction_features.json');

      if (!fs.existsSync(filePath)) {
        this.logger.warn('prediction_features.json not found, skipping migration');
        return;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const features = JSON.parse(content);

      await this.configService.createConfig({
        configType: 'FEATURE',
        configKey: 'prediction_features_v1',
        configValue: features,
        description: '预测引擎特征列表v1.0',
        createdBy: 'migration'
      });
      result.migratedCount++;

      this.logger.log('Migrated prediction features');
    } catch (error) {
      result.errors.push(`Failed to migrate prediction features: ${error.message}`);
    }
  }

  /**
   * 验证迁移结果
   */
  async validateMigration(): Promise<boolean> {
    try {
      const configs = await this.configService.getAllConfigs();

      // 检查是否有配置被迁移
      if (configs.length === 0) {
        this.logger.warn('No configs found after migration');
        return false;
      }

      // 检查配置类型分布
      const typeCounts = {};
      configs.forEach(config => {
        typeCounts[config.configType] = (typeCounts[config.configType] || 0) + 1;
      });

      this.logger.log('Migration validation results:', typeCounts);
      return true;
    } catch (error) {
      this.logger.error('Migration validation failed', error);
      return false;
    }
  }
}

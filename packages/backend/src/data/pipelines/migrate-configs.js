#!/usr/bin/env node

/**
 * 配置迁移脚本
 * 将现有的JSON/TXT配置文件迁移到数据库
 */

import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库路径
const dbPath = path.join(__dirname, '../data/analysis.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath);

async function connectDatabase() {
  return new Promise((resolve, reject) => {
    db.get('SELECT 1', (err) => {
      if (err) {
        console.error('❌ 数据库连接失败:', err.message);
        reject(err);
      } else {
        console.log('✅ 数据库连接成功');
        resolve();
      }
    });
  });
}

async function migrateAttributionRules() {
  console.log('📋 迁移归因规则...');
  
  const filePath = path.join(__dirname, '..', 'config', 'attribution_rules.json');
  
  if (!fs.existsSync(filePath)) {
    console.log('⚠️  attribution_rules.json 不存在，跳过迁移');
    return 0;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    if (!data.rules || !Array.isArray(data.rules)) {
      console.log('⚠️  归因规则格式不正确，跳过迁移');
      return 0;
    }

    let migratedCount = 0;
    
    for (const rule of data.rules) {
      try {
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT OR IGNORE INTO system_configs (config_type, config_key, config_value, description, created_by)
            VALUES (?, ?, ?, ?, ?)
          `, [
            'ATTRIBUTION_RULE',
            rule.rule_id,
            JSON.stringify(rule),
            rule.description || '',
            'migration'
          ], function(err) {
            if (err) reject(err);
            else resolve();
          });
        });
        
        migratedCount++;
        console.log(`  ✅ 迁移规则: ${rule.rule_id}`);
      } catch (error) {
        console.error(`  ❌ 迁移规则失败 ${rule.rule_id}:`, error.message);
      }
    }

    console.log(`✅ 归因规则迁移完成，共迁移 ${migratedCount} 条规则`);
    return migratedCount;
  } catch (error) {
    console.error('❌ 归因规则迁移失败:', error.message);
    return 0;
  }
}

async function migrateEventTags() {
  console.log('🏷️  迁移事件标签...');
  
  const filePath = path.join(__dirname, '..', 'config', 'event_tags.json');
  
  if (!fs.existsSync(filePath)) {
    console.log('⚠️  event_tags.json 不存在，跳过迁移');
    return 0;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    if (!data.tags || !Array.isArray(data.tags)) {
      console.log('⚠️  事件标签格式不正确，跳过迁移');
      return 0;
    }

    let migratedCount = 0;
    
    for (const tag of data.tags) {
      try {
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT OR IGNORE INTO system_configs (config_type, config_key, config_value, description, created_by)
            VALUES (?, ?, ?, ?, ?)
          `, [
            'EVENT_TAG',
            tag.tag_id,
            JSON.stringify(tag),
            tag.description || '',
            'migration'
          ], function(err) {
            if (err) reject(err);
            else resolve();
          });
        });
        
        migratedCount++;
        console.log(`  ✅ 迁移标签: ${tag.tag_id}`);
      } catch (error) {
        console.error(`  ❌ 迁移标签失败 ${tag.tag_id}:`, error.message);
      }
    }

    console.log(`✅ 事件标签迁移完成，共迁移 ${migratedCount} 条标签`);
    return migratedCount;
  } catch (error) {
    console.error('❌ 事件标签迁移失败:', error.message);
    return 0;
  }
}

async function migratePromptTemplates() {
  console.log('📝 迁移Prompt模板...');
  
  const promptDir = path.join(__dirname, '..', 'config', 'prompts');
  
  if (!fs.existsSync(promptDir)) {
    console.log('⚠️  prompts 目录不存在，跳过迁移');
    return 0;
  }

  try {
    const files = fs.readdirSync(promptDir);
    const promptFiles = files.filter(file => 
      file.endsWith('.txt') || file.endsWith('.md')
    );

    let migratedCount = 0;
    
    for (const file of promptFiles) {
      try {
        const filePath = path.join(promptDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const templateName = path.basename(file, path.extname(file));

        const templateData = {
          template_id: templateName,
          template_name: templateName,
          content: content,
          version: '1.0'
        };

        await new Promise((resolve, reject) => {
          db.run(`
            INSERT OR IGNORE INTO system_configs (config_type, config_key, config_value, description, created_by)
            VALUES (?, ?, ?, ?, ?)
          `, [
            'PROMPT_TEMPLATE',
            templateName,
            JSON.stringify(templateData),
            `Prompt模板: ${templateName}`,
            'migration'
          ], function(err) {
            if (err) reject(err);
            else resolve();
          });
        });
        
        migratedCount++;
        console.log(`  ✅ 迁移模板: ${templateName}`);
      } catch (error) {
        console.error(`  ❌ 迁移模板失败 ${file}:`, error.message);
      }
    }

    console.log(`✅ Prompt模板迁移完成，共迁移 ${migratedCount} 个模板`);
    return migratedCount;
  } catch (error) {
    console.error('❌ Prompt模板迁移失败:', error.message);
    return 0;
  }
}

async function migrateUniverseRules() {
  console.log('🌌 迁移股票宇宙规则...');
  
  const filePath = path.join(__dirname, '..', 'config', 'universe_rules.json');
  
  if (!fs.existsSync(filePath)) {
    console.log('⚠️  universe_rules.json 不存在，跳过迁移');
    return 0;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    if (!data.rules || !Array.isArray(data.rules)) {
      console.log('⚠️  股票宇宙规则格式不正确，跳过迁移');
      return 0;
    }

    let migratedCount = 0;
    
    for (const rule of data.rules) {
      try {
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT OR IGNORE INTO system_configs (config_type, config_key, config_value, description, created_by)
            VALUES (?, ?, ?, ?, ?)
          `, [
            'UNIVERSE_RULE',
            rule.rule_id,
            JSON.stringify(rule),
            rule.description || '',
            'migration'
          ], function(err) {
            if (err) reject(err);
            else resolve();
          });
        });
        
        migratedCount++;
        console.log(`  ✅ 迁移规则: ${rule.rule_id}`);
      } catch (error) {
        console.error(`  ❌ 迁移规则失败 ${rule.rule_id}:`, error.message);
      }
    }

    console.log(`✅ 股票宇宙规则迁移完成，共迁移 ${migratedCount} 条规则`);
    return migratedCount;
  } catch (error) {
    console.error('❌ 股票宇宙规则迁移失败:', error.message);
    return 0;
  }
}

async function migratePredictionFeatures() {
  console.log('🔮 迁移预测特征...');
  
  const filePath = path.join(__dirname, '..', 'config', 'prediction_features.json');
  
  if (!fs.existsSync(filePath)) {
    console.log('⚠️  prediction_features.json 不存在，跳过迁移');
    return 0;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR IGNORE INTO system_configs (config_type, config_key, config_value, description, created_by)
        VALUES (?, ?, ?, ?, ?)
      `, [
        'FEATURE',
        'prediction_features_v1',
        JSON.stringify(data),
        '预测引擎特征列表v1.0',
        'migration'
      ], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('✅ 预测特征迁移完成');
    return 1;
  } catch (error) {
    console.error('❌ 预测特征迁移失败:', error.message);
    return 0;
  }
}

async function validateMigration() {
  console.log('🔍 验证迁移结果...');
  
  try {
    const rows = await new Promise((resolve, reject) => {
      db.all(`
        SELECT config_type, COUNT(*) as count
        FROM system_configs
        WHERE is_active = 1
        GROUP BY config_type
        ORDER BY config_type
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log('📊 迁移结果统计:');
    rows.forEach(row => {
      console.log(`  ${row.config_type}: ${row.count} 条配置`);
    });

    const totalCount = rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    console.log(`✅ 总计: ${totalCount} 条配置迁移成功`);

    return true;
  } catch (error) {
    console.error('❌ 迁移验证失败:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 开始配置迁移...');
  
  try {
    await connectDatabase();
    
    let totalMigrated = 0;
    
    totalMigrated += await migrateAttributionRules();
    totalMigrated += await migrateEventTags();
    totalMigrated += await migratePromptTemplates();
    totalMigrated += await migrateUniverseRules();
    totalMigrated += await migratePredictionFeatures();
    
    await validateMigration();
    
    console.log(`🎉 配置迁移完成！共迁移 ${totalMigrated} 条配置`);
    
  } catch (error) {
    console.error('❌ 配置迁移失败:', error.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

// 运行迁移
main();
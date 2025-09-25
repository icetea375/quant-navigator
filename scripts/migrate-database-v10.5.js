#!/usr/bin/env node

/**
 * 数据库迁移脚本执行器 - v10.5双脑分治架构
 * 自动执行数据库schema升级
 */

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'quantnav',
  multipleStatements: true
};

class DatabaseMigrator {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      this.connection = await mysql.createConnection(dbConfig);
      console.log('✅ 数据库连接成功');
    } catch (error) {
      console.error('❌ 数据库连接失败:', error.message);
      process.exit(1);
    }
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end();
      console.log('✅ 数据库连接已关闭');
    }
  }

  async executeMigration() {
    try {
      console.log('🚀 开始执行v10.5数据库迁移...');
      
      // 读取迁移脚本
      const migrationPath = path.join(__dirname, '../database/migrations/026_add_source_fields_to_reports.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // 分割SQL语句
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`📝 找到 ${statements.length} 个SQL语句`);
      
      // 执行每个SQL语句
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
          try {
            console.log(`⏳ 执行语句 ${i + 1}/${statements.length}...`);
            await this.connection.execute(statement);
            console.log(`✅ 语句 ${i + 1} 执行成功`);
          } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_TABLE_EXISTS') {
              console.log(`⚠️ 语句 ${i + 1} 跳过 (字段/表已存在)`);
            } else {
              console.error(`❌ 语句 ${i + 1} 执行失败:`, error.message);
              throw error;
            }
          }
        }
      }
      
      console.log('🎉 v10.5数据库迁移完成！');
      
      // 验证迁移结果
      await this.verifyMigration();
      
    } catch (error) {
      console.error('❌ 数据库迁移失败:', error.message);
      throw error;
    }
  }

  async verifyMigration() {
    try {
      console.log('🔍 验证迁移结果...');
      
      // 检查generated_reports表的新字段
      const [columns] = await this.connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'generated_reports' 
        AND TABLE_SCHEMA = '${dbConfig.database}'
        AND COLUMN_NAME IN ('source', 'pair_report_id', 'analyzer_type', 'confidence_score', 'analysis_quality')
      `);
      
      console.log('📊 generated_reports表新增字段:');
      columns.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? '可空' : '非空'})`);
      });
      
      // 检查新表
      const [tables] = await this.connection.execute(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = '${dbConfig.database}' 
        AND TABLE_NAME IN ('arbitration_cases', 'report_comparisons', 'analyzer_performance')
      `);
      
      console.log('📋 新增表:');
      tables.forEach(table => {
        console.log(`  - ${table.TABLE_NAME}`);
      });
      
      // 检查视图
      const [views] = await this.connection.execute(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.VIEWS 
        WHERE TABLE_SCHEMA = '${dbConfig.database}' 
        AND TABLE_NAME IN ('v_pending_arbitration', 'v_analyzer_performance')
      `);
      
      console.log('👁️ 新增视图:');
      views.forEach(view => {
        console.log(`  - ${view.TABLE_NAME}`);
      });
      
      console.log('✅ 迁移验证完成');
      
    } catch (error) {
      console.error('❌ 迁移验证失败:', error.message);
      throw error;
    }
  }

  async rollbackMigration() {
    try {
      console.log('🔄 开始回滚v10.5迁移...');
      
      // 删除新增的字段
      const rollbackStatements = [
        'ALTER TABLE generated_reports DROP COLUMN IF EXISTS source',
        'ALTER TABLE generated_reports DROP COLUMN IF EXISTS pair_report_id',
        'ALTER TABLE generated_reports DROP COLUMN IF EXISTS analyzer_type',
        'ALTER TABLE generated_reports DROP COLUMN IF EXISTS confidence_score',
        'ALTER TABLE generated_reports DROP COLUMN IF EXISTS analysis_quality',
        'DROP TABLE IF EXISTS report_comparisons',
        'DROP TABLE IF EXISTS analyzer_performance',
        'DROP TABLE IF EXISTS arbitration_cases',
        'DROP VIEW IF EXISTS v_pending_arbitration',
        'DROP VIEW IF EXISTS v_analyzer_performance'
      ];
      
      for (const statement of rollbackStatements) {
        try {
          await this.connection.execute(statement);
          console.log(`✅ 回滚: ${statement}`);
        } catch (error) {
          console.log(`⚠️ 跳过: ${statement} (${error.message})`);
        }
      }
      
      console.log('🎉 v10.5迁移回滚完成！');
      
    } catch (error) {
      console.error('❌ 迁移回滚失败:', error.message);
      throw error;
    }
  }
}

// 主函数
async function main() {
  const migrator = new DatabaseMigrator();
  
  try {
    await migrator.connect();
    
    const command = process.argv[2];
    
    switch (command) {
      case 'migrate':
        await migrator.executeMigration();
        break;
      case 'rollback':
        await migrator.rollbackMigration();
        break;
      case 'verify':
        await migrator.verifyMigration();
        break;
      default:
        console.log('使用方法:');
        console.log('  node migrate-database-v10.5.js migrate   # 执行迁移');
        console.log('  node migrate-database-v10.5.js rollback  # 回滚迁移');
        console.log('  node migrate-database-v10.5.js verify    # 验证迁移');
        process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ 操作失败:', error.message);
    process.exit(1);
  } finally {
    await migrator.disconnect();
  }
}

// 执行主函数
main();

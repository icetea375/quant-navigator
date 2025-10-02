#!/usr/bin/env node

/**
 * 数据库迁移执行脚本
 * 将SQLite数据迁移到PostgreSQL
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 检查环境变量
const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD'
];

console.log('🚀 开始数据库迁移...');

// 检查必需的环境变量
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ 缺少必需的环境变量:', missingVars.join(', '));
  console.error('请设置以下环境变量:');
  missingVars.forEach(varName => {
    console.error(`  export ${varName}=your_value`);
  });
  process.exit(1);
}

// 检查源数据库文件
const sourceDbPath = process.env.SOURCE_DB_PATH || './data/analysis.db';
if (!fs.existsSync(sourceDbPath)) {
  console.error(`❌ 源数据库文件不存在: ${sourceDbPath}`);
  console.error('请确保SQLite数据库文件存在');
  process.exit(1);
}

console.log('✅ 环境检查通过');
console.log(`📁 源数据库: ${sourceDbPath}`);
console.log(`🎯 目标数据库: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);

// 执行迁移
const migrationScript = path.join(__dirname, '../news-analysis-service/src/database/migrate-to-postgres.ts');

const child = spawn('npx', ['ts-node', migrationScript], {
  stdio: 'inherit',
  env: {
    ...process.env,
    SOURCE_DB_PATH: sourceDbPath
  }
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('🎉 数据库迁移完成！');
    console.log('');
    console.log('📋 后续步骤:');
    console.log('1. 更新环境变量 DB_TYPE=postgresql');
    console.log('2. 重启应用程序');
    console.log('3. 验证数据完整性');
  } else {
    console.error(`💥 迁移失败，退出码: ${code}`);
    process.exit(code);
  }
});

child.on('error', (error) => {
  console.error('💥 执行迁移脚本时出错:', error);
  process.exit(1);
});

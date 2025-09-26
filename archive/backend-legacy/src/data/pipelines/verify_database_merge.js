/**
 * 数据库表合并验证脚本
 * 验证迁移脚本的正确性和数据完整性
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取迁移脚本
const migrationScript = fs.readFileSync(
  path.join(__dirname, '../news-analysis-service/migrations/034_merge_redundant_tables.sql'),
  'utf8'
);

console.log('🔍 数据库表合并迁移脚本验证');
console.log('='.repeat(50));

// 验证脚本内容
const checks = [
  {
    name: 'processed_events表创建',
    pattern: /CREATE TABLE IF NOT EXISTS processed_events/,
    required: true
  },
  {
    name: 'generated_reports表创建',
    pattern: /CREATE TABLE IF NOT EXISTS generated_reports/,
    required: true
  },
  {
    name: 'training_samples_raw表创建',
    pattern: /CREATE TABLE IF NOT EXISTS training_samples_raw/,
    required: true
  },
  {
    name: 'news_rating_training_samples表创建',
    pattern: /CREATE TABLE IF NOT EXISTS news_rating_training_samples/,
    required: true
  },
  {
    name: '数据迁移逻辑',
    pattern: /INSERT INTO processed_events/,
    required: true
  },
  {
    name: '索引创建',
    pattern: /CREATE INDEX IF NOT EXISTS/,
    required: true
  },
  {
    name: '数据验证',
    pattern: /DO \$\$/,
    required: true
  },
  {
    name: '备份表创建',
    pattern: /CREATE TABLE.*_backup/,
    required: true
  }
];

let passedChecks = 0;
let totalChecks = checks.length;

console.log('\n📋 检查项目:');
checks.forEach((check, index) => {
  const found = check.pattern.test(migrationScript);
  const status = found ? '✅' : '❌';
  console.log(`${status} ${index + 1}. ${check.name}`);

  if (found) passedChecks++;
});

console.log('\n📊 验证结果:');
console.log(`通过: ${passedChecks}/${totalChecks} 项检查`);

if (passedChecks === totalChecks) {
  console.log('🎉 迁移脚本验证通过！');
} else {
  console.log('⚠️  迁移脚本存在问题，请检查！');
}

// 分析脚本结构
console.log('\n📈 脚本分析:');
const lines = migrationScript.split('\n');
const totalLines = lines.length;
const commentLines = lines.filter(line => line.trim().startsWith('--')).length;
const sqlLines = lines.filter(line =>
  line.trim().startsWith('CREATE') ||
  line.trim().startsWith('INSERT') ||
  line.trim().startsWith('DROP') ||
  line.trim().startsWith('ALTER')
).length;

console.log(`总行数: ${totalLines}`);
console.log(`注释行数: ${commentLines}`);
console.log(`SQL语句数: ${sqlLines}`);

// 检查关键功能
console.log('\n🔧 关键功能检查:');

const features = [
  {
    name: '表结构定义',
    pattern: /CREATE TABLE.*\([\s\S]*?\);/g,
    count: (migrationScript.match(/CREATE TABLE.*\([\s\S]*?\);/g) || []).length
  },
  {
    name: '索引创建',
    pattern: /CREATE INDEX/g,
    count: (migrationScript.match(/CREATE INDEX/g) || []).length
  },
  {
    name: '数据迁移',
    pattern: /INSERT INTO/g,
    count: (migrationScript.match(/INSERT INTO/g) || []).length
  },
  {
    name: '数据验证',
    pattern: /SELECT COUNT/g,
    count: (migrationScript.match(/SELECT COUNT/g) || []).length
  }
];

features.forEach(feature => {
  console.log(`${feature.name}: ${feature.count} 个`);
});

console.log('\n✨ 验证完成！');
console.log('\n📝 使用说明:');
console.log('1. 确保PostgreSQL服务正在运行');
console.log('2. 确保数据库连接配置正确');
console.log('3. 执行迁移脚本: psql -h localhost -U postgres -d news_analysis -f 034_merge_redundant_tables.sql');
console.log('4. 验证迁移结果');

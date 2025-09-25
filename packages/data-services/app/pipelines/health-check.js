#!/usr/bin/env node

// 新闻-ETF系统健康检查脚本
// 版本: v2.0
// 功能: 检查系统各组件运行状态

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 连接数据库
const dbPath = path.join(__dirname, '..', 'data', 'analysis.db');
const db = new Database(dbPath);

console.log('🏥 新闻-ETF系统健康检查');
console.log('=====================================');

const checks = [];
let overallStatus = 'healthy';

// 1. 数据库连接检查
try {
  const result = db.prepare('SELECT 1 as test').get();
  checks.push({
    name: '数据库连接',
    status: 'healthy',
    message: '数据库连接正常',
    details: 'SQLite数据库响应正常'
  });
} catch (error) {
  checks.push({
    name: '数据库连接',
    status: 'unhealthy',
    message: '数据库连接失败',
    details: error.message
  });
  overallStatus = 'unhealthy';
}

// 2. 数据库表结构检查
try {
  const tables = ['etfs', 'sectors', 'news_items', 'news_etf_relations', 'etf_historical_data'];
  const missingTables = [];
  
  tables.forEach(table => {
    try {
      db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
    } catch (error) {
      missingTables.push(table);
    }
  });
  
  if (missingTables.length === 0) {
    checks.push({
      name: '数据库表结构',
      status: 'healthy',
      message: '所有必需表存在',
      details: `检查了 ${tables.length} 个表`
    });
  } else {
    checks.push({
      name: '数据库表结构',
      status: 'unhealthy',
      message: '缺少必需表',
      details: `缺少表: ${missingTables.join(', ')}`
    });
    overallStatus = 'unhealthy';
  }
} catch (error) {
  checks.push({
    name: '数据库表结构',
    status: 'unhealthy',
    message: '表结构检查失败',
    details: error.message
  });
  overallStatus = 'unhealthy';
}

// 3. 数据完整性检查
try {
  const integrityChecks = [
    {
      name: 'ETF数据',
      query: 'SELECT COUNT(*) as count FROM etfs WHERE etf_code IS NULL OR etf_name IS NULL',
      expected: 0
    },
    {
      name: '新闻数据',
      query: 'SELECT COUNT(*) as count FROM news_items WHERE title IS NULL OR source_id IS NULL',
      expected: 0
    },
    {
      name: '板块数据',
      query: 'SELECT COUNT(*) as count FROM sectors WHERE sector_name IS NULL OR sector_code IS NULL',
      expected: 0
    }
  ];
  
  let integrityIssues = 0;
  integrityChecks.forEach(check => {
    const result = db.prepare(check.query).get();
    if (result.count > check.expected) {
      integrityIssues++;
    }
  });
  
  if (integrityIssues === 0) {
    checks.push({
      name: '数据完整性',
      status: 'healthy',
      message: '数据完整性检查通过',
      details: '所有数据表数据完整'
    });
  } else {
    checks.push({
      name: '数据完整性',
      status: 'warning',
      message: '发现数据完整性问题',
      details: `${integrityIssues} 个表存在数据完整性问题`
    });
    if (overallStatus === 'healthy') overallStatus = 'warning';
  }
} catch (error) {
  checks.push({
    name: '数据完整性',
    status: 'unhealthy',
    message: '数据完整性检查失败',
    details: error.message
  });
  overallStatus = 'unhealthy';
}

// 4. 数据量检查
try {
  const dataCounts = {
    etfs: db.prepare('SELECT COUNT(*) as count FROM etfs').get().count,
    sectors: db.prepare('SELECT COUNT(*) as count FROM sectors').get().count,
    news: db.prepare('SELECT COUNT(*) as count FROM news_items').get().count,
    relations: db.prepare('SELECT COUNT(*) as count FROM news_etf_relations').get().count
  };
  
  const dataStatus = dataCounts.etfs > 0 && dataCounts.sectors > 0 && dataCounts.news > 0 ? 'healthy' : 'warning';
  
  checks.push({
    name: '数据量',
    status: dataStatus,
    message: dataStatus === 'healthy' ? '数据量充足' : '数据量不足',
    details: `ETF: ${dataCounts.etfs}, 板块: ${dataCounts.sectors}, 新闻: ${dataCounts.news}, 关联: ${dataCounts.relations}`
  });
  
  if (dataStatus === 'warning' && overallStatus === 'healthy') overallStatus = 'warning';
} catch (error) {
  checks.push({
    name: '数据量',
    status: 'unhealthy',
    message: '数据量检查失败',
    details: error.message
  });
  overallStatus = 'unhealthy';
}

// 5. 性能检查
try {
  const startTime = Date.now();
  
  // 执行复杂查询测试性能
  const complexQuery = db.prepare(`
    SELECT 
      n.title,
      e.etf_name,
      ner.confidence_score
    FROM news_items n
    LEFT JOIN news_etf_relations ner ON n.id = ner.news_id
    LEFT JOIN etfs e ON ner.etf_code = e.etf_code
    WHERE n.influence_score > 0.1
    ORDER BY n.influence_score DESC
    LIMIT 100
  `);
  
  const results = complexQuery.all();
  const queryTime = Date.now() - startTime;
  
  const performanceStatus = queryTime < 1000 ? 'healthy' : queryTime < 3000 ? 'warning' : 'unhealthy';
  
  checks.push({
    name: '查询性能',
    status: performanceStatus,
    message: performanceStatus === 'healthy' ? '查询性能良好' : 
             performanceStatus === 'warning' ? '查询性能一般' : '查询性能较差',
    details: `复杂查询耗时: ${queryTime}ms, 返回 ${results.length} 条记录`
  });
  
  if (performanceStatus === 'unhealthy') overallStatus = 'unhealthy';
  else if (performanceStatus === 'warning' && overallStatus === 'healthy') overallStatus = 'warning';
} catch (error) {
  checks.push({
    name: '查询性能',
    status: 'unhealthy',
    message: '性能检查失败',
    details: error.message
  });
  overallStatus = 'unhealthy';
}

// 6. 系统监控数据检查
try {
  const monitoringData = db.prepare(`
    SELECT metric_name, metric_value, timestamp
    FROM system_monitoring
    WHERE metric_name IN ('database_version', 'last_migration')
    ORDER BY timestamp DESC
  `).all();
  
  if (monitoringData.length > 0) {
    const latestMigration = monitoringData.find(m => m.metric_name === 'last_migration');
    const migrationTime = latestMigration ? new Date(parseInt(latestMigration.metric_value) * 1000) : null;
    const timeSinceMigration = migrationTime ? Date.now() - migrationTime.getTime() : null;
    
    const migrationStatus = timeSinceMigration && timeSinceMigration < 24 * 60 * 60 * 1000 ? 'healthy' : 'warning';
    
    checks.push({
      name: '系统监控',
      status: migrationStatus,
      message: migrationStatus === 'healthy' ? '系统监控正常' : '系统监控数据较旧',
      details: `最后迁移: ${migrationTime ? migrationTime.toLocaleString() : '未知'}`
    });
    
    if (migrationStatus === 'warning' && overallStatus === 'healthy') overallStatus = 'warning';
  } else {
    checks.push({
      name: '系统监控',
      status: 'warning',
      message: '缺少系统监控数据',
      details: '建议运行数据同步'
    });
    if (overallStatus === 'healthy') overallStatus = 'warning';
  }
} catch (error) {
  checks.push({
    name: '系统监控',
    status: 'unhealthy',
    message: '系统监控检查失败',
    details: error.message
  });
  overallStatus = 'unhealthy';
}

// 输出检查结果
console.log('\n📊 健康检查结果:');
console.log('=====================================');

checks.forEach(check => {
  const statusIcon = check.status === 'healthy' ? '✅' : 
                    check.status === 'warning' ? '⚠️' : '❌';
  const statusColor = check.status === 'healthy' ? '\x1b[32m' : 
                     check.status === 'warning' ? '\x1b[33m' : '\x1b[31m';
  const resetColor = '\x1b[0m';
  
  console.log(`${statusIcon} ${check.name}: ${statusColor}${check.message}${resetColor}`);
  console.log(`   详情: ${check.details}`);
  console.log('');
});

// 输出总体状态
const overallIcon = overallStatus === 'healthy' ? '✅' : 
                   overallStatus === 'warning' ? '⚠️' : '❌';
const overallColor = overallStatus === 'healthy' ? '\x1b[32m' : 
                    overallStatus === 'warning' ? '\x1b[33m' : '\x1b[31m';
const resetColor = '\x1b[0m';

console.log('=====================================');
console.log(`${overallIcon} 总体状态: ${overallColor}${overallStatus.toUpperCase()}${resetColor}`);

// 输出建议
console.log('\n💡 建议:');
if (overallStatus === 'unhealthy') {
  console.log('  - 检查数据库连接和表结构');
  console.log('  - 运行数据迁移脚本');
  console.log('  - 检查系统日志');
} else if (overallStatus === 'warning') {
  console.log('  - 考虑运行数据同步');
  console.log('  - 监控系统性能');
  console.log('  - 检查数据完整性');
} else {
  console.log('  - 系统运行正常');
  console.log('  - 定期运行健康检查');
  console.log('  - 监控系统性能');
}

console.log('\n🕐 检查时间:', new Date().toLocaleString());
console.log('=====================================');

db.close();

// 根据状态设置退出码
process.exit(overallStatus === 'healthy' ? 0 : overallStatus === 'warning' ? 1 : 2);

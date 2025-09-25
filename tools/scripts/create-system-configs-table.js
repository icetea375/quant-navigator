#!/usr/bin/env node

/**
 * 创建system_configs表的简单脚本
 * 使用SQLite数据库
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库路径
const dbPath = path.join(__dirname, '../data/analysis.db');

console.log('🚀 开始创建system_configs表...');
console.log(`📁 数据库路径: ${dbPath}`);

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
    process.exit(1);
  }
  console.log('✅ 数据库连接成功');
});

// 创建system_configs表
const createTableSQL = `
CREATE TABLE IF NOT EXISTS system_configs (
  config_id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_type VARCHAR(50) NOT NULL,
  config_key VARCHAR(100) NOT NULL,
  config_value TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT 1,
  description TEXT,
  created_by VARCHAR(100),
  updated_by VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(config_type, config_key)
);
`;

// 创建索引
const createIndexesSQL = [
  'CREATE INDEX IF NOT EXISTS idx_system_configs_type ON system_configs(config_type);',
  'CREATE INDEX IF NOT EXISTS idx_system_configs_key ON system_configs(config_key);',
  'CREATE INDEX IF NOT EXISTS idx_system_configs_active ON system_configs(is_active);',
  'CREATE INDEX IF NOT EXISTS idx_system_configs_updated_at ON system_configs(updated_at);'
];

// 插入示例数据
const insertSampleDataSQL = `
INSERT OR IGNORE INTO system_configs (config_type, config_key, config_value, description, created_by) VALUES
('ATTRIBUTION_RULE', 'ANNC_EARNINGS_POSITIVE', 
 '{"rule_id": "ANNC_EARNINGS_POSITIVE", "description": "业绩预告 - 预增/扭亏", "data_source": "tushare", "api_name": "announcement", "target_field": "title", "keywords": ["业绩预增", "扭亏为盈", "业绩快报", "业绩预告", "同比增长", "净利润增长"], "keyword_logic": "ANY", "exclusion_keywords": ["下降", "减少", "亏损"], "attribution_label": "业绩超预期", "priority": 1, "cost_tier": 1}',
 '业绩预告 - 预增/扭亏规则', 'system'),

('EVENT_TAG', 'E001', 
 '{"tag_id": "E001", "tag_name": "业绩超预期", "category": "基本面", "description": "公司业绩超出市场预期", "keywords": ["业绩预增", "扭亏为盈", "超预期"], "priority": 1}',
 '业绩超预期事件标签', 'system'),

('PROMPT_TEMPLATE', 'stock_attribution', 
 '{"template_id": "stock_attribution", "template_name": "股票异动归因分析", "content": "请分析以下股票异动的原因：\\n股票代码：{stock_code}\\n股票名称：{stock_name}\\n异动时间：{anomaly_time}\\nZ分数：{z_score}\\n相关新闻：{news_content}\\n\\n请从基本面、技术面、消息面等角度进行综合分析，并给出置信度评估。", "variables": ["stock_code", "stock_name", "anomaly_time", "z_score", "news_content"], "version": "1.0"}',
 '股票异动归因分析Prompt模板', 'system'),

('UNIVERSE_RULE', 'core_universe_liquidity_threshold', 
 '{"rule_id": "core_universe_liquidity_threshold", "rule_name": "核心宇宙流动性阈值", "threshold_type": "daily_turnover", "threshold_value": 500000000, "unit": "CNY", "description": "日均成交额低于5亿元的股票将被移出核心宇宙", "update_frequency": "monthly"}',
 '核心宇宙流动性阈值规则', 'system'),

('FEATURE', 'prediction_features_v1', 
 '{"feature_list": ["z_score_price", "z_score_relative", "volume_percentile", "rsi_14", "macd_signal", "bollinger_position", "news_sentiment", "sector_momentum", "market_volatility", "earnings_quality"], "version": "1.0", "description": "预测引擎特征列表v1.0"}',
 '预测引擎特征列表v1.0', 'system');
`;

// 执行创建表
db.run(createTableSQL, (err) => {
  if (err) {
    console.error('❌ 创建表失败:', err.message);
    process.exit(1);
  }
  console.log('✅ system_configs表创建成功');
  
  // 表创建成功后，创建索引
  createIndexes();
});

// 创建索引
function createIndexes() {
  let indexCount = 0;
  createIndexesSQL.forEach((sql, index) => {
    db.run(sql, (err) => {
      if (err) {
        console.error(`❌ 创建索引${index + 1}失败:`, err.message);
      } else {
        console.log(`✅ 索引${index + 1}创建成功`);
      }
      indexCount++;
      if (indexCount === createIndexesSQL.length) {
        // 所有索引创建完成后，插入示例数据
        insertSampleData();
      }
    });
  });
}

// 插入示例数据
function insertSampleData() {
  db.run(insertSampleDataSQL, (err) => {
    if (err) {
      console.error('❌ 插入示例数据失败:', err.message);
    } else {
      console.log('✅ 示例数据插入成功');
    }
    
    // 验证数据
    db.all('SELECT config_type, config_key, description FROM system_configs', (err, rows) => {
      if (err) {
        console.error('❌ 查询数据失败:', err.message);
      } else {
        console.log('📊 插入的配置数据:');
        rows.forEach(row => {
          console.log(`  ${row.config_type}: ${row.config_key} - ${row.description}`);
        });
        console.log(`✅ 共插入 ${rows.length} 条配置数据`);
      }
      
      // 关闭数据库连接
      db.close((err) => {
        if (err) {
          console.error('❌ 关闭数据库失败:', err.message);
        } else {
          console.log('🎉 system_configs表创建完成！');
        }
      });
    });
  });
}
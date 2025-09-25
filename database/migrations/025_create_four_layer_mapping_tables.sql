-- 四层映射架构与自适应异常发现系统数据库表
-- 创建时间: 2025-01-17
-- 版本: 025
-- 描述: 创建四层映射架构和异常检测相关表

-- 四层映射关系表
CREATE TABLE IF NOT EXISTS four_layer_mapping (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  layer_level INTEGER NOT NULL CHECK (layer_level BETWEEN 1 AND 4), -- 1-4层
  parent_id INTEGER, -- 父级ID
  code VARCHAR(20) NOT NULL, -- 代码
  name VARCHAR(100) NOT NULL, -- 名称
  type VARCHAR(20) NOT NULL CHECK (type IN ('index', 'stock')), -- 类型：index/stock
  market VARCHAR(10) NOT NULL DEFAULT 'CN', -- 市场：CN/US/HK等
  sector VARCHAR(50), -- 行业分类
  weight DECIMAL(10,4), -- 权重
  is_active BOOLEAN DEFAULT 1, -- 是否激活
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES four_layer_mapping(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_four_layer_mapping_level ON four_layer_mapping(layer_level);
CREATE INDEX IF NOT EXISTS idx_four_layer_mapping_code ON four_layer_mapping(code);
CREATE INDEX IF NOT EXISTS idx_four_layer_mapping_parent ON four_layer_mapping(parent_id);
CREATE INDEX IF NOT EXISTS idx_four_layer_mapping_type ON four_layer_mapping(type);

-- 异常检测结果表
CREATE TABLE IF NOT EXISTS anomaly_detection_results (
  result_id VARCHAR(64) PRIMARY KEY,
  target_code VARCHAR(20) NOT NULL,
  target_name VARCHAR(100) NOT NULL,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('index', 'stock')),
  layer_level INTEGER NOT NULL CHECK (layer_level BETWEEN 1 AND 4),
  detection_date DATE NOT NULL,
  anomaly_type VARCHAR(50) NOT NULL CHECK (anomaly_type IN ('individual', 'relative', 'combined', 'volume_breakout', 'counter_trend')),
  z_score DECIMAL(10,4), -- Z分数
  percentile_score DECIMAL(10,4), -- 百分位分数
  relative_strength DECIMAL(10,4), -- 相对强度
  signal_strength DECIMAL(10,4), -- 信号强度
  is_anomaly BOOLEAN NOT NULL,
  confidence DECIMAL(4,2) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  threshold_used DECIMAL(10,4), -- 使用的阈值
  window_size INTEGER, -- 窗口大小
  calculation_time_ms INTEGER, -- 计算耗时
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_anomaly_detection_target ON anomaly_detection_results(target_code);
CREATE INDEX IF NOT EXISTS idx_anomaly_detection_date ON anomaly_detection_results(detection_date);
CREATE INDEX IF NOT EXISTS idx_anomaly_detection_type ON anomaly_detection_results(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_anomaly_detection_anomaly ON anomaly_detection_results(is_anomaly);

-- 滚动统计数据表
CREATE TABLE IF NOT EXISTS rolling_statistics (
  stat_id VARCHAR(64) PRIMARY KEY,
  target_code VARCHAR(20) NOT NULL,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('index', 'stock')),
  layer_level INTEGER NOT NULL CHECK (layer_level BETWEEN 1 AND 4),
  calculation_date DATE NOT NULL,
  window_size INTEGER NOT NULL,
  stat_type VARCHAR(20) NOT NULL CHECK (stat_type IN ('price', 'volume', 'relative_strength')),
  mean_value DECIMAL(10,4), -- 均值
  std_deviation DECIMAL(10,4), -- 标准差
  percentile_95 DECIMAL(10,4), -- 95分位点
  percentile_99 DECIMAL(10,4), -- 99分位点
  min_value DECIMAL(10,4), -- 最小值
  max_value DECIMAL(10,4), -- 最大值
  data_points INTEGER NOT NULL, -- 数据点数量
  calculation_time_ms INTEGER, -- 计算耗时
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_rolling_statistics_target ON rolling_statistics(target_code);
CREATE INDEX IF NOT EXISTS idx_rolling_statistics_date ON rolling_statistics(calculation_date);
CREATE INDEX IF NOT EXISTS idx_rolling_statistics_type ON rolling_statistics(stat_type);
CREATE INDEX IF NOT EXISTS idx_rolling_statistics_window ON rolling_statistics(window_size);

-- 异常检测配置表
CREATE TABLE IF NOT EXISTS anomaly_detection_config (
  config_id VARCHAR(64) PRIMARY KEY,
  config_name VARCHAR(100) NOT NULL,
  layer_level INTEGER NOT NULL CHECK (layer_level BETWEEN 1 AND 4),
  stat_type VARCHAR(20) NOT NULL CHECK (stat_type IN ('price', 'volume', 'relative_strength')),
  window_size INTEGER NOT NULL,
  z_score_threshold DECIMAL(10,4) NOT NULL DEFAULT 2.5,
  percentile_threshold DECIMAL(10,4) NOT NULL DEFAULT 95.0,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_anomaly_config_level ON anomaly_detection_config(layer_level);
CREATE INDEX IF NOT EXISTS idx_anomaly_config_type ON anomaly_detection_config(stat_type);
CREATE INDEX IF NOT EXISTS idx_anomaly_config_active ON anomaly_detection_config(is_active);

-- 异常检测历史数据表
CREATE TABLE IF NOT EXISTS anomaly_detection_history (
  history_id VARCHAR(64) PRIMARY KEY,
  target_code VARCHAR(20) NOT NULL,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('index', 'stock')),
  layer_level INTEGER NOT NULL CHECK (layer_level BETWEEN 1 AND 4),
  data_date DATE NOT NULL,
  price_change DECIMAL(10,4), -- 涨跌幅
  volume DECIMAL(15,2), -- 成交量
  volume_ratio DECIMAL(10,4), -- 量比
  relative_strength DECIMAL(10,4), -- 相对强度
  z_score DECIMAL(10,4), -- Z分数
  percentile_rank DECIMAL(10,4), -- 百分位排名
  is_anomaly BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_anomaly_history_target ON anomaly_detection_history(target_code);
CREATE INDEX IF NOT EXISTS idx_anomaly_history_date ON anomaly_detection_history(data_date);
CREATE INDEX IF NOT EXISTS idx_anomaly_history_anomaly ON anomaly_detection_history(is_anomaly);

-- 插入默认配置数据
INSERT INTO anomaly_detection_config (config_id, config_name, layer_level, stat_type, window_size, z_score_threshold, percentile_threshold) VALUES
('config_1_price', '宽基指数价格异常检测', 1, 'price', 90, 2.5, 95.0),
('config_1_volume', '宽基指数成交量异常检测', 1, 'volume', 120, 2.5, 95.0),
('config_2_price', '一级指数价格异常检测', 2, 'price', 90, 2.5, 95.0),
('config_2_volume', '一级指数成交量异常检测', 2, 'volume', 120, 2.5, 95.0),
('config_3_price', '二级指数价格异常检测', 3, 'price', 90, 2.5, 95.0),
('config_3_volume', '二级指数成交量异常检测', 3, 'volume', 120, 2.5, 95.0),
('config_4_price', '龙头股价格异常检测', 4, 'price', 90, 2.5, 95.0),
('config_4_volume', '龙头股成交量异常检测', 4, 'volume', 120, 2.5, 95.0),
('config_relative', '相对强度异常检测', 0, 'relative_strength', 90, 2.5, 95.0);

-- 更新数据库版本
PRAGMA user_version = 25;

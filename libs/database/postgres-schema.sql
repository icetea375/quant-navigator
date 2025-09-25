-- 智能分析系统PostgreSQL数据库表结构
-- 基于SQLite表结构迁移到PostgreSQL

-- 创建数据库（如果不存在）
-- CREATE DATABASE news_analysis;

-- 使用数据库
-- \c news_analysis;

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 新闻处理结果表
CREATE TABLE IF NOT EXISTS news_processing_results (
    id SERIAL PRIMARY KEY,
    news_id VARCHAR(255) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    source VARCHAR(100),
    url TEXT,
    published_at TIMESTAMP,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    analysis_status VARCHAR(50) DEFAULT 'pending',
    analysis_result JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_news_processing_results_news_id ON news_processing_results(news_id);
CREATE INDEX IF NOT EXISTS idx_news_processing_results_published_at ON news_processing_results(published_at);
CREATE INDEX IF NOT EXISTS idx_news_processing_results_analysis_status ON news_processing_results(analysis_status);
CREATE INDEX IF NOT EXISTS idx_news_processing_results_created_at ON news_processing_results(created_at);

-- 四级监控体系表
CREATE TABLE IF NOT EXISTS four_level_monitoring (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL, -- broad, primary, secondary, leading
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    current_price DECIMAL(10, 4),
    price_change DECIMAL(10, 4),
    price_change_pct DECIMAL(8, 4),
    volume BIGINT,
    volume_change DECIMAL(10, 4),
    volume_change_pct DECIMAL(8, 4),
    volatility DECIMAL(8, 4),
    z_score DECIMAL(8, 4),
    is_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_reason TEXT,
    monitored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_four_level_monitoring_level ON four_level_monitoring(level);
CREATE INDEX IF NOT EXISTS idx_four_level_monitoring_code ON four_level_monitoring(code);
CREATE INDEX IF NOT EXISTS idx_four_level_monitoring_is_anomaly ON four_level_monitoring(is_anomaly);
CREATE INDEX IF NOT EXISTS idx_four_level_monitoring_monitored_at ON four_level_monitoring(monitored_at);

-- 量化信号表
CREATE TABLE IF NOT EXISTS quant_signals (
    id SERIAL PRIMARY KEY,
    signal_type VARCHAR(50) NOT NULL, -- macro_risk, market_style, quant_fingerprint
    signal_name VARCHAR(100) NOT NULL,
    signal_value DECIMAL(10, 6),
    z_score DECIMAL(8, 4),
    is_anomaly BOOLEAN DEFAULT FALSE,
    signal_data JSONB,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_quant_signals_signal_type ON quant_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_quant_signals_signal_name ON quant_signals(signal_name);
CREATE INDEX IF NOT EXISTS idx_quant_signals_is_anomaly ON quant_signals(is_anomaly);
CREATE INDEX IF NOT EXISTS idx_quant_signals_calculated_at ON quant_signals(calculated_at);

-- 异常检测结果表
CREATE TABLE IF NOT EXISTS anomaly_detection_results (
    id SERIAL PRIMARY KEY,
    target_type VARCHAR(20) NOT NULL, -- broad, primary, secondary, leading
    target_code VARCHAR(20) NOT NULL,
    target_name VARCHAR(100) NOT NULL,
    anomaly_type VARCHAR(50) NOT NULL, -- price_change, volume_change, volatility
    anomaly_value DECIMAL(10, 6),
    threshold_value DECIMAL(10, 6),
    severity VARCHAR(20) NOT NULL, -- low, medium, high, critical
    description TEXT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_anomaly_detection_results_target_type ON anomaly_detection_results(target_type);
CREATE INDEX IF NOT EXISTS idx_anomaly_detection_results_target_code ON anomaly_detection_results(target_code);
CREATE INDEX IF NOT EXISTS idx_anomaly_detection_results_severity ON anomaly_detection_results(severity);
CREATE INDEX IF NOT EXISTS idx_anomaly_detection_results_detected_at ON anomaly_detection_results(detected_at);
CREATE INDEX IF NOT EXISTS idx_anomaly_detection_results_status ON anomaly_detection_results(status);

-- 每日市场快报表
CREATE TABLE IF NOT EXISTS daily_market_briefing (
    id SERIAL PRIMARY KEY,
    briefing_date DATE NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    key_points JSONB,
    market_summary JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_daily_market_briefing_date ON daily_market_briefing(briefing_date);
CREATE INDEX IF NOT EXISTS idx_daily_market_briefing_generated_at ON daily_market_briefing(generated_at);

-- 异动归因快照表
CREATE TABLE IF NOT EXISTS anomaly_attribution_snapshot (
    id SERIAL PRIMARY KEY,
    anomaly_id INTEGER REFERENCES anomaly_detection_results(id),
    target_code VARCHAR(20) NOT NULL,
    target_name VARCHAR(100) NOT NULL,
    attribution_type VARCHAR(50) NOT NULL, -- news_driven, technical, fundamental
    attribution_reason TEXT NOT NULL,
    confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
    supporting_evidence JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_anomaly_attribution_snapshot_anomaly_id ON anomaly_attribution_snapshot(anomaly_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_attribution_snapshot_target_code ON anomaly_attribution_snapshot(target_code);
CREATE INDEX IF NOT EXISTS idx_anomaly_attribution_snapshot_attribution_type ON anomaly_attribution_snapshot(attribution_type);
CREATE INDEX IF NOT EXISTS idx_anomaly_attribution_snapshot_generated_at ON anomaly_attribution_snapshot(generated_at);

-- 用户股票池表
CREATE TABLE IF NOT EXISTS user_stock_pools (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    pool_name VARCHAR(100) NOT NULL,
    stock_codes TEXT[] NOT NULL, -- PostgreSQL数组类型
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_stock_pools_user_id ON user_stock_pools(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stock_pools_is_active ON user_stock_pools(is_active);

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    config_type VARCHAR(50) DEFAULT 'string', -- string, number, boolean, json
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_system_config_config_key ON system_config(config_key);
CREATE INDEX IF NOT EXISTS idx_system_config_is_active ON system_config(is_active);

-- 任务队列表
CREATE TABLE IF NOT EXISTS task_queue (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(100) UNIQUE NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    task_data JSONB,
    priority INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- pending, running, completed, failed
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_task_queue_task_id ON task_queue(task_id);
CREATE INDEX IF NOT EXISTS idx_task_queue_task_type ON task_queue(task_type);
CREATE INDEX IF NOT EXISTS idx_task_queue_status ON task_queue(status);
CREATE INDEX IF NOT EXISTS idx_task_queue_priority ON task_queue(priority);
CREATE INDEX IF NOT EXISTS idx_task_queue_scheduled_at ON task_queue(scheduled_at);

-- 系统监控指标表
CREATE TABLE IF NOT EXISTS system_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15, 6),
    metric_unit VARCHAR(20),
    tags JSONB,
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_system_metrics_metric_name ON system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_collected_at ON system_metrics(collected_at);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要自动更新updated_at的表创建触发器
CREATE TRIGGER update_news_processing_results_updated_at BEFORE UPDATE ON news_processing_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_four_level_monitoring_updated_at BEFORE UPDATE ON four_level_monitoring FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quant_signals_updated_at BEFORE UPDATE ON quant_signals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_anomaly_detection_results_updated_at BEFORE UPDATE ON anomaly_detection_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_market_briefing_updated_at BEFORE UPDATE ON daily_market_briefing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_anomaly_attribution_snapshot_updated_at BEFORE UPDATE ON anomaly_attribution_snapshot FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_stock_pools_updated_at BEFORE UPDATE ON user_stock_pools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_queue_updated_at BEFORE UPDATE ON task_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入初始配置数据
INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('database_type', 'postgresql', 'string', '当前数据库类型'),
('monitoring_enabled', 'true', 'boolean', '是否启用监控'),
('anomaly_threshold', '2.5', 'number', '异常检测阈值'),
('max_retry_count', '3', 'number', '最大重试次数'),
('task_cleanup_days', '30', 'number', '任务清理天数')
ON CONFLICT (config_key) DO NOTHING;

-- 创建视图：监控概览
CREATE OR REPLACE VIEW monitoring_overview AS
SELECT 
    level,
    COUNT(*) as total_count,
    COUNT(CASE WHEN is_anomaly = true THEN 1 END) as anomaly_count,
    ROUND(COUNT(CASE WHEN is_anomaly = true THEN 1 END)::DECIMAL / COUNT(*) * 100, 2) as anomaly_rate,
    MAX(monitored_at) as last_monitored
FROM four_level_monitoring
GROUP BY level;

-- 创建视图：异常统计
CREATE OR REPLACE VIEW anomaly_statistics AS
SELECT 
    target_type,
    anomaly_type,
    severity,
    COUNT(*) as count,
    AVG(anomaly_value) as avg_value,
    MAX(detected_at) as last_detected
FROM anomaly_detection_results
WHERE detected_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY target_type, anomaly_type, severity
ORDER BY count DESC;

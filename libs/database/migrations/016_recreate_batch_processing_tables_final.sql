-- 重新创建批次处理表支持业务处理需求（最终版）
-- 迁移版本: 016
-- 创建时间: 2025-01-17
-- 描述: 删除旧表并重新创建批次处理相关表

-- 1. 删除旧视图和表（如果存在）
DROP VIEW IF EXISTS v_batch_processing_errors;
DROP VIEW IF EXISTS v_batch_processing_performance;
DROP VIEW IF EXISTS v_batch_processing_summary;
DROP TABLE IF EXISTS batch_processing_stats;
DROP TABLE IF EXISTS batch_processing_logs;
DROP TABLE IF EXISTS batch_processing_items;
DROP TABLE IF EXISTS batch_processing;

-- 2. 创建批次处理主表
CREATE TABLE batch_processing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id VARCHAR(50) NOT NULL UNIQUE,
    batch_type VARCHAR(20) NOT NULL CHECK (batch_type IN ('daily', 'historical', 'realtime', 'verification')),
    batch_size INTEGER NOT NULL,
    processed_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    
    -- 状态管理
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 1, -- 优先级 1-5，1最高
    
    -- 时间管理
    scheduled_at TIMESTAMP, -- 计划执行时间
    started_at TIMESTAMP, -- 开始时间
    completed_at TIMESTAMP, -- 完成时间
    estimated_duration INTEGER, -- 预估持续时间（秒）
    actual_duration INTEGER, -- 实际持续时间（秒）
    
    -- 配置和参数
    config_data TEXT, -- JSON格式存储批次配置
    processing_params TEXT, -- JSON格式存储处理参数
    
    -- 错误和重试
    error_message TEXT, -- 错误信息
    retry_count INTEGER DEFAULT 0, -- 重试次数
    max_retries INTEGER DEFAULT 3, -- 最大重试次数
    last_retry_at TIMESTAMP, -- 最后重试时间
    
    -- 并发控制
    concurrent_limit INTEGER DEFAULT 1, -- 并发限制
    current_concurrent INTEGER DEFAULT 0, -- 当前并发数
    
    -- 通用字段
    is_deleted BOOLEAN DEFAULT 0,
    deleted_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) DEFAULT 'system',
    updated_by VARCHAR(50) DEFAULT 'system'
);

-- 3. 创建批次处理项目表
CREATE TABLE batch_processing_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id VARCHAR(50) NOT NULL,
    item_id VARCHAR(100) NOT NULL, -- 处理项目ID（如news_id）
    item_type VARCHAR(20) NOT NULL, -- 项目类型：news, analysis, verification
    item_data TEXT, -- JSON格式存储项目数据
    
    -- 处理状态
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
    processing_order INTEGER, -- 处理顺序
    
    -- 时间管理
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    processing_duration INTEGER, -- 处理持续时间（毫秒）
    
    -- 结果和错误
    result_data TEXT, -- JSON格式存储处理结果
    error_message TEXT, -- 错误信息
    retry_count INTEGER DEFAULT 0, -- 重试次数
    
    -- 依赖关系
    depends_on TEXT, -- JSON数组：依赖的其他项目ID
    blocks TEXT, -- JSON数组：被阻塞的项目ID
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (batch_id) REFERENCES batch_processing(batch_id) ON DELETE CASCADE
);

-- 4. 创建批次处理日志表
CREATE TABLE batch_processing_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id VARCHAR(50) NOT NULL,
    log_level VARCHAR(10) NOT NULL CHECK (log_level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')),
    log_message TEXT NOT NULL,
    log_data TEXT, -- JSON格式存储日志数据
    
    -- 上下文信息
    item_id VARCHAR(100), -- 关联的处理项目ID
    step_name VARCHAR(50), -- 处理步骤名称
    execution_time INTEGER, -- 执行时间（毫秒）
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (batch_id) REFERENCES batch_processing(batch_id) ON DELETE CASCADE
);

-- 5. 创建批次处理统计表
CREATE TABLE batch_processing_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id VARCHAR(50) NOT NULL,
    stat_name VARCHAR(50) NOT NULL, -- 统计指标名称
    stat_value REAL NOT NULL, -- 统计值
    stat_unit VARCHAR(20), -- 统计单位
    stat_category VARCHAR(20), -- 统计分类：performance, quality, error
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (batch_id) REFERENCES batch_processing(batch_id) ON DELETE CASCADE
);

-- 6. 创建索引
-- 批次处理主表索引
CREATE INDEX idx_batch_processing_type ON batch_processing(batch_type);
CREATE INDEX idx_batch_processing_status ON batch_processing(status);
CREATE INDEX idx_batch_processing_priority ON batch_processing(priority);
CREATE INDEX idx_batch_processing_scheduled ON batch_processing(scheduled_at);
CREATE INDEX idx_batch_processing_active ON batch_processing(is_deleted) WHERE is_deleted = 0;

-- 批次处理项目表索引
CREATE INDEX idx_batch_items_batch ON batch_processing_items(batch_id);
CREATE INDEX idx_batch_items_status ON batch_processing_items(status);
CREATE INDEX idx_batch_items_type ON batch_processing_items(item_type);
CREATE INDEX idx_batch_items_order ON batch_processing_items(processing_order);

-- 批次处理日志表索引
CREATE INDEX idx_batch_logs_batch ON batch_processing_logs(batch_id);
CREATE INDEX idx_batch_logs_level ON batch_processing_logs(log_level);
CREATE INDEX idx_batch_logs_created ON batch_processing_logs(created_at DESC);

-- 批次处理统计表索引
CREATE INDEX idx_batch_stats_batch ON batch_processing_stats(batch_id);
CREATE INDEX idx_batch_stats_name ON batch_processing_stats(stat_name);
CREATE INDEX idx_batch_stats_category ON batch_processing_stats(stat_category);

-- 7. 创建复合索引
CREATE INDEX idx_batch_processing_type_status ON batch_processing(batch_type, status);
CREATE INDEX idx_batch_processing_priority_status ON batch_processing(priority, status);
CREATE INDEX idx_batch_items_batch_status ON batch_processing_items(batch_id, status);

-- 8. 创建触发器
-- 更新批次处理统计
CREATE TRIGGER trg_batch_items_status_update 
AFTER UPDATE ON batch_processing_items
WHEN NEW.status != OLD.status
BEGIN
    UPDATE batch_processing 
    SET 
        processed_count = (
            SELECT COUNT(*) FROM batch_processing_items 
            WHERE batch_id = NEW.batch_id AND status IN ('completed', 'failed')
        ),
        success_count = (
            SELECT COUNT(*) FROM batch_processing_items 
            WHERE batch_id = NEW.batch_id AND status = 'completed'
        ),
        failed_count = (
            SELECT COUNT(*) FROM batch_processing_items 
            WHERE batch_id = NEW.batch_id AND status = 'failed'
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE batch_id = NEW.batch_id;
END;

-- 自动完成批次处理
CREATE TRIGGER trg_batch_auto_complete 
AFTER UPDATE ON batch_processing_items
WHEN NEW.status IN ('completed', 'failed') AND 
     (SELECT COUNT(*) FROM batch_processing_items WHERE batch_id = NEW.batch_id AND status = 'pending') = 0
BEGIN
    UPDATE batch_processing 
    SET 
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP,
        actual_duration = (strftime('%s', 'now') - strftime('%s', started_at)),
        updated_at = CURRENT_TIMESTAMP
    WHERE batch_id = NEW.batch_id AND status = 'processing';
END;

-- 9. 创建监控视图
CREATE VIEW v_batch_processing_summary AS
SELECT 
    batch_type,
    status,
    COUNT(*) as batch_count,
    AVG(batch_size) as avg_batch_size,
    AVG(actual_duration) as avg_duration,
    SUM(processed_count) as total_processed,
    SUM(success_count) as total_success,
    SUM(failed_count) as total_failed,
    ROUND(SUM(success_count) * 100.0 / SUM(processed_count), 2) as success_rate
FROM batch_processing
WHERE is_deleted = 0
GROUP BY batch_type, status;

CREATE VIEW v_batch_processing_performance AS
SELECT 
    batch_type,
    DATE(created_at) as processing_date,
    COUNT(*) as batch_count,
    AVG(actual_duration) as avg_duration,
    MAX(actual_duration) as max_duration,
    MIN(actual_duration) as min_duration,
    SUM(processed_count) as total_items,
    AVG(processed_count * 1.0 / actual_duration) as items_per_second
FROM batch_processing
WHERE is_deleted = 0 
    AND status = 'completed' 
    AND actual_duration IS NOT NULL
GROUP BY batch_type, DATE(created_at)
ORDER BY processing_date DESC;

CREATE VIEW v_batch_processing_errors AS
SELECT 
    batch_id,
    batch_type,
    error_message,
    retry_count,
    created_at,
    completed_at
FROM batch_processing
WHERE is_deleted = 0 
    AND status = 'failed'
ORDER BY created_at DESC;

-- 10. 插入默认配置数据
INSERT INTO batch_processing (
    batch_id, batch_type, batch_size, status, priority, 
    config_data, processing_params, concurrent_limit
) VALUES 
('daily_news_analysis', 'daily', 2000, 'pending', 1, 
 '{"max_batch_size": 2000, "processing_interval": 1800, "retry_attempts": 3}',
 '{"analysis_type": "daily", "llm_model": "doubao", "quality_threshold": 0.7}',
 3),
('historical_analysis', 'historical', 10000, 'pending', 2,
 '{"max_batch_size": 10000, "processing_interval": 3600, "retry_attempts": 5}',
 '{"analysis_type": "historical", "llm_model": "doubao", "time_range": "3_years"}',
 2),
('realtime_analysis', 'realtime', 50, 'pending', 1,
 '{"max_batch_size": 50, "processing_interval": 300, "retry_attempts": 2}',
 '{"analysis_type": "realtime", "llm_model": "doubao", "response_time": "fast"}',
 5);

-- 11. 更新数据库版本
PRAGMA user_version = 16;


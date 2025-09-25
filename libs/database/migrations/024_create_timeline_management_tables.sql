-- 创建时间线管理相关表
-- 迁移版本: 024
-- 创建时间: 2025-01-17
-- 描述: 创建时间线管理相关表，实现容量限制和自动归档功能

-- 1. 创建时间线归档表
CREATE TABLE IF NOT EXISTS timeline_events_archive (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_timeline_id INTEGER NOT NULL,
    timeline_category VARCHAR(20) NOT NULL,
    event_date TEXT NOT NULL,
    event_title TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_summary TEXT,
    impact_analysis TEXT,
    related_news_ids TEXT, -- JSON数组
    importance_level TEXT NOT NULL,
    archived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    archive_reason VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 创建时间线容量监控表
CREATE TABLE IF NOT EXISTS timeline_capacity_monitor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    category_type VARCHAR(20) NOT NULL,
    current_count INTEGER NOT NULL,
    max_capacity INTEGER NOT NULL,
    usage_percentage DECIMAL(5,2) NOT NULL,
    last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    needs_archive BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES timeline_categories(id)
);

-- 3. 创建时间线归档日志表
CREATE TABLE IF NOT EXISTS timeline_archive_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    archive_type VARCHAR(20) NOT NULL CHECK (archive_type IN ('auto', 'manual', 'bulk')),
    events_archived INTEGER NOT NULL,
    archive_reason TEXT,
    archived_by VARCHAR(50) DEFAULT 'system',
    archive_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES timeline_categories(id)
);

-- 4. 创建索引
-- 时间线归档表索引
CREATE INDEX idx_timeline_archive_category ON timeline_events_archive(timeline_category);
CREATE INDEX idx_timeline_archive_date ON timeline_events_archive(event_date);
CREATE INDEX idx_timeline_archive_archived ON timeline_events_archive(archived_at);

-- 时间线容量监控表索引
CREATE INDEX idx_timeline_capacity_category ON timeline_capacity_monitor(category_id);
CREATE INDEX idx_timeline_capacity_usage ON timeline_capacity_monitor(usage_percentage);
CREATE INDEX idx_timeline_capacity_needs_archive ON timeline_capacity_monitor(needs_archive) WHERE needs_archive = 1;

-- 时间线归档日志表索引
CREATE INDEX idx_timeline_archive_logs_category ON timeline_archive_logs(category_id);
CREATE INDEX idx_timeline_archive_logs_date ON timeline_archive_logs(archive_date);

-- 5. 创建监控视图
CREATE VIEW v_timeline_capacity_status AS
SELECT 
    tc.id,
    tc.category_name,
    tc.category_type,
    tc.current_events_count,
    tc.max_events,
    tc.archive_threshold,
    ROUND(tc.current_events_count * 100.0 / tc.max_events, 2) as usage_percentage,
    CASE 
        WHEN tc.current_events_count > tc.max_events THEN 'over_capacity'
        WHEN tc.current_events_count > tc.archive_threshold THEN 'near_capacity'
        ELSE 'normal'
    END as capacity_status,
    tc.auto_archive,
    tc.last_archive_date
FROM timeline_categories tc;

CREATE VIEW v_timeline_archive_summary AS
SELECT 
    timeline_category,
    COUNT(*) as total_archived,
    MIN(archived_at) as first_archive,
    MAX(archived_at) as last_archive,
    COUNT(DISTINCT DATE(archived_at)) as archive_days
FROM timeline_events_archive
GROUP BY timeline_category;

CREATE VIEW v_timeline_events_by_category AS
SELECT 
    timeline_category,
    COUNT(*) as total_events,
    SUM(CASE WHEN is_archived = 0 THEN 1 ELSE 0 END) as active_events,
    SUM(CASE WHEN is_archived = 1 THEN 1 ELSE 0 END) as archived_events,
    MIN(event_date) as earliest_event,
    MAX(event_date) as latest_event
FROM timeline_events
GROUP BY timeline_category;

-- 6. 初始化容量监控数据
INSERT OR IGNORE INTO timeline_capacity_monitor (category_id, category_name, category_type, current_count, max_capacity, usage_percentage)
SELECT 
    id,
    category_name,
    category_type,
    current_events_count,
    max_events,
    ROUND(current_events_count * 100.0 / max_events, 2)
FROM timeline_categories;

-- 7. 更新数据库版本
PRAGMA user_version = 24;


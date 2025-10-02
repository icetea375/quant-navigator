-- 创建重要性分析表支持LLM结构化数据存储
-- 迁移版本: 012
-- 创建时间: 2025-01-17
-- 描述: 创建专门的重要性分析表，支持LLM输出的结构化数据存储和查询

-- 1. 创建重要性分析主表
CREATE TABLE IF NOT EXISTS importance_analysis_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    news_id INTEGER NOT NULL,
    analysis_date TIMESTAMP NOT NULL,
    importance_score DECIMAL(5,2) NOT NULL CHECK (importance_score >= 0 AND importance_score <= 10),

    -- 结构化数据字段（JSON格式）
    impact_scope TEXT NOT NULL, -- JSON格式存储影响范围
    market_indicators TEXT NOT NULL, -- JSON格式存储市场指标
    market_expectation TEXT NOT NULL, -- JSON格式存储市场预期
    related_stocks TEXT, -- JSON格式存储相关股票
    related_etfs TEXT, -- JSON格式存储相关ETF

    -- 分析元数据
    reasoning TEXT NOT NULL, -- 分析推理过程
    confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    llm_model_used VARCHAR(50),
    analysis_version VARCHAR(20) DEFAULT '1.0',
    analysis_batch_id VARCHAR(50),
    analysis_type VARCHAR(20) DEFAULT 'daily' CHECK (analysis_type IN ('daily', 'batch', 'realtime', 'historical')),

    -- 验证和状态字段
    validation_status VARCHAR(20) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'rejected', 'expired')),
    validation_score DECIMAL(5,2), -- 验证后的准确性评分
    validation_notes TEXT, -- 验证备注

    -- 预测相关字段
    prediction_horizon INTEGER DEFAULT 3, -- 预测时间范围（天）
    predicted_impact REAL, -- 预测影响程度
    actual_impact REAL, -- 实际影响程度
    accuracy_score REAL, -- 预测准确性评分

    -- 通用字段
    is_deleted BOOLEAN DEFAULT 0,
    deleted_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) DEFAULT 'system',
    updated_by VARCHAR(50) DEFAULT 'system',

    FOREIGN KEY (news_id) REFERENCES news_items(id) ON DELETE CASCADE
);

-- 2. 创建重要性分析详情表（存储结构化数据的详细字段）
CREATE TABLE IF NOT EXISTS importance_analysis_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id INTEGER NOT NULL,

    -- 影响范围详情
    market_level VARCHAR(50), -- 全市场、板块、个股
    sector_names TEXT, -- JSON数组：影响的板块
    stock_codes TEXT, -- JSON数组：影响的股票代码

    -- 市场指标详情
    index_names TEXT, -- JSON数组：相关指数
    sector_indicators TEXT, -- JSON数组：板块指标
    stock_indicators TEXT, -- JSON数组：个股指标

    -- 市场预期详情
    current_expectation TEXT, -- 当前市场预期
    news_impact TEXT, -- 新闻影响描述
    expectation_gap INTEGER, -- 预期差距（百分比）
    expectation_confidence INTEGER, -- 预期置信度

    -- 相关股票详情
    stock_name VARCHAR(100),
    stock_code VARCHAR(20),
    relation_reason TEXT, -- 关联原因
    relation_confidence VARCHAR(20), -- 关联置信度：high, medium, low
    impact_direction VARCHAR(10), -- 影响方向：positive, negative, neutral

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (analysis_id) REFERENCES importance_analysis_new(id) ON DELETE CASCADE
);

-- 3. 创建索引
-- 主表索引
CREATE INDEX IF NOT EXISTS idx_importance_analysis_new_news ON importance_analysis_new(news_id);
CREATE INDEX IF NOT EXISTS idx_importance_analysis_new_date ON importance_analysis_new(analysis_date DESC);
CREATE INDEX IF NOT EXISTS idx_importance_analysis_new_score ON importance_analysis_new(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_importance_analysis_new_batch ON importance_analysis_new(analysis_batch_id);
CREATE INDEX IF NOT EXISTS idx_importance_analysis_new_type ON importance_analysis_new(analysis_type);
CREATE INDEX IF NOT EXISTS idx_importance_analysis_new_status ON importance_analysis_new(validation_status);
CREATE INDEX IF NOT EXISTS idx_importance_analysis_new_active ON importance_analysis_new(is_deleted) WHERE is_deleted = 0;

-- 详情表索引
CREATE INDEX IF NOT EXISTS idx_importance_analysis_details_analysis ON importance_analysis_details(analysis_id);
CREATE INDEX IF NOT EXISTS idx_importance_analysis_details_market_level ON importance_analysis_details(market_level);
CREATE INDEX IF NOT EXISTS idx_importance_analysis_details_stock_code ON importance_analysis_details(stock_code);

-- 4. 创建复合索引
CREATE INDEX IF NOT EXISTS idx_importance_analysis_date_score ON importance_analysis_new(analysis_date DESC, importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_importance_analysis_type_status ON importance_analysis_new(analysis_type, validation_status);
CREATE INDEX IF NOT EXISTS idx_importance_analysis_batch_type ON importance_analysis_new(analysis_batch_id, analysis_type);

-- 5. 创建触发器保持updated_at字段更新
CREATE TRIGGER IF NOT EXISTS trg_importance_analysis_new_update
AFTER UPDATE ON importance_analysis_new
BEGIN
    UPDATE importance_analysis_new
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- 6. 创建数据验证触发器
CREATE TRIGGER IF NOT EXISTS trg_importance_analysis_validation
BEFORE INSERT ON importance_analysis_new
BEGIN
    SELECT CASE
        WHEN NEW.importance_score < 0 OR NEW.importance_score > 10
        THEN RAISE(ABORT, 'Invalid importance_score: must be between 0 and 10')
        WHEN NEW.confidence < 0 OR NEW.confidence > 1
        THEN RAISE(ABORT, 'Invalid confidence: must be between 0 and 1')
        WHEN NEW.analysis_type NOT IN ('daily', 'batch', 'realtime', 'historical')
        THEN RAISE(ABORT, 'Invalid analysis_type: must be one of daily, batch, realtime, historical')
        WHEN NEW.validation_status NOT IN ('pending', 'validated', 'rejected', 'expired')
        THEN RAISE(ABORT, 'Invalid validation_status: must be one of pending, validated, rejected, expired')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_importance_analysis_validation_update
BEFORE UPDATE ON importance_analysis_new
BEGIN
    SELECT CASE
        WHEN NEW.importance_score < 0 OR NEW.importance_score > 10
        THEN RAISE(ABORT, 'Invalid importance_score: must be between 0 and 10')
        WHEN NEW.confidence < 0 OR NEW.confidence > 1
        THEN RAISE(ABORT, 'Invalid confidence: must be between 0 and 1')
        WHEN NEW.analysis_type NOT IN ('daily', 'batch', 'realtime', 'historical')
        THEN RAISE(ABORT, 'Invalid analysis_type: must be one of daily, batch, realtime, historical')
        WHEN NEW.validation_status NOT IN ('pending', 'validated', 'rejected', 'expired')
        THEN RAISE(ABORT, 'Invalid validation_status: must be one of pending, validated, rejected, expired')
    END;
END;

-- 7. 创建数据质量监控视图
CREATE VIEW IF NOT EXISTS v_importance_analysis_quality AS
SELECT
    analysis_type,
    validation_status,
    COUNT(*) as total_count,
    AVG(importance_score) as avg_importance_score,
    AVG(confidence) as avg_confidence,
    SUM(CASE WHEN validation_status = 'validated' THEN 1 ELSE 0 END) as validated_count,
    SUM(CASE WHEN validation_status = 'pending' THEN 1 ELSE 0 END) as pending_count,
    SUM(CASE WHEN validation_status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
FROM importance_analysis_new
WHERE is_deleted = 0
GROUP BY analysis_type, validation_status;

-- 8. 创建预测准确性分析视图
CREATE VIEW IF NOT EXISTS v_prediction_accuracy AS
SELECT
    analysis_type,
    AVG(accuracy_score) as avg_accuracy,
    AVG(ABS(predicted_impact - actual_impact)) as avg_impact_error,
    COUNT(*) as total_predictions,
    SUM(CASE WHEN accuracy_score > 0.8 THEN 1 ELSE 0 END) as high_accuracy_count
FROM importance_analysis_new
WHERE is_deleted = 0
    AND predicted_impact IS NOT NULL
    AND actual_impact IS NOT NULL
    AND accuracy_score IS NOT NULL
GROUP BY analysis_type;

-- 9. 更新数据库版本
PRAGMA user_version = 12;

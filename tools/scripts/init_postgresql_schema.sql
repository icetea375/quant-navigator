-- PostgreSQL数据库初始化脚本 - Sprint 1
-- 创建仲裁系统所需的基础表结构

-- 创建数据库（如果不存在）
-- CREATE DATABASE quant_navigator;

-- 连接到数据库
-- \c quant_navigator;

-- 1. 创建generated_reports表
CREATE TABLE IF NOT EXISTS generated_reports (
    id BIGSERIAL PRIMARY KEY,
    stock_code VARCHAR(20) NOT NULL,
    trade_date DATE NOT NULL,
    analyzer_type VARCHAR(50) NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'legacy_analysis',
    analysis_text TEXT,
    confidence_score DECIMAL(5,4) DEFAULT 0.0,
    sentiment_score DECIMAL(5,4) DEFAULT NULL,
    keywords JSON DEFAULT NULL,
    entities JSON DEFAULT NULL,
    summary TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 创建arbitration_cases表
CREATE TABLE IF NOT EXISTS arbitration_cases (
    id BIGSERIAL PRIMARY KEY,
    case_id VARCHAR(100) NOT NULL UNIQUE,
    stock_code VARCHAR(20) NOT NULL,
    trade_date DATE NOT NULL,
    qwen_report_id BIGINT NOT NULL,
    doubao_report_id BIGINT NOT NULL,

    -- 分歧度分析结果
    divergence_score DECIMAL(5,4) NOT NULL,
    sentiment_diff DECIMAL(5,4) NOT NULL,
    keyword_overlap DECIMAL(5,4) NOT NULL,
    entity_diff DECIMAL(5,4) NOT NULL,

    -- AI总结结果
    consensus_summary TEXT NOT NULL,
    conflict_summary TEXT NOT NULL,

    -- 优先级计算
    priority_score DECIMAL(5,4) NOT NULL,
    company_importance DECIMAL(5,4) NOT NULL,
    event_importance DECIMAL(5,4) NOT NULL,

    -- 状态管理
    status VARCHAR(20) DEFAULT 'PENDING_HUMAN',

    -- 人类仲裁结果（可选）
    human_arbitrator_id VARCHAR(50) DEFAULT NULL,
    human_decision TEXT DEFAULT NULL,
    final_recommendation VARCHAR(20) DEFAULT NULL,
    final_confidence DECIMAL(3,2) DEFAULT NULL,

    -- 分析元数据
    analysis_metadata JSON DEFAULT NULL,

    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL DEFAULT NULL,

    -- 外键约束
    FOREIGN KEY (qwen_report_id) REFERENCES generated_reports(id) ON DELETE CASCADE,
    FOREIGN KEY (doubao_report_id) REFERENCES generated_reports(id) ON DELETE CASCADE
);

-- 3. 创建human_arbitrator_feedback表
CREATE TABLE IF NOT EXISTS human_arbitrator_feedback (
    id BIGSERIAL PRIMARY KEY,
    arbitration_case_id BIGINT NOT NULL,
    arbitrator_id VARCHAR(50) NOT NULL,

    -- 反馈评分
    ai_summary_quality INTEGER NOT NULL,
    priority_accuracy INTEGER NOT NULL,
    divergence_analysis_quality INTEGER NOT NULL,
    overall_satisfaction INTEGER NOT NULL,

    -- 文本反馈
    feedback_text TEXT DEFAULT NULL,
    suggestions TEXT DEFAULT NULL,

    -- 决策信息
    decision_time_minutes INTEGER DEFAULT NULL,
    decision_factors JSON DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (arbitration_case_id) REFERENCES arbitration_cases(id) ON DELETE CASCADE
);

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_generated_reports_stock_date ON generated_reports(stock_code, trade_date);
CREATE INDEX IF NOT EXISTS idx_generated_reports_source ON generated_reports(source);
CREATE INDEX IF NOT EXISTS idx_arbitration_cases_case_id ON arbitration_cases(case_id);
CREATE INDEX IF NOT EXISTS idx_arbitration_cases_stock_date ON arbitration_cases(stock_code, trade_date);
CREATE INDEX IF NOT EXISTS idx_arbitration_cases_status ON arbitration_cases(status);
CREATE INDEX IF NOT EXISTS idx_arbitration_cases_priority ON arbitration_cases(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_arbitration_cases_divergence ON arbitration_cases(divergence_score DESC);
CREATE INDEX IF NOT EXISTS idx_arbitration_cases_created_at ON arbitration_cases(created_at);
CREATE INDEX IF NOT EXISTS idx_human_feedback_case ON human_arbitrator_feedback(arbitration_case_id);
CREATE INDEX IF NOT EXISTS idx_human_feedback_arbitrator ON human_arbitrator_feedback(arbitrator_id);

-- 5. 插入示例数据
INSERT INTO generated_reports (
    stock_code, trade_date, analyzer_type, source, analysis_text,
    confidence_score, sentiment_score, keywords, entities, summary
) VALUES
(
    '000001', CURRENT_DATE, 'qwen_fact_analyzer', 'qwen_fact_based',
    '基于财务数据分析，该股票基本面表现稳定：营收增长15%，利润率维持在35%以上，现金流为正。建议持有观望。',
    0.85, 0.3, '["营收增长", "利润率", "现金流", "基本面"]', '["财务数据", "市场地位"]',
    '基本面稳定，建议持有'
),
(
    '000001', CURRENT_DATE, 'doubao_sentiment_analyzer', 'doubao_sentiment_based',
    '基于市场情绪分析：投资者情绪偏向谨慎，媒体关注度中等，技术面在关键支撑位震荡。建议等待明确信号。',
    0.75, -0.2, '["市场情绪", "技术面", "投资者"]', '["投资者", "媒体"]',
    '市场情绪谨慎，建议观望'
);

-- 6. 插入仲裁案件
INSERT INTO arbitration_cases (
    case_id, stock_code, trade_date, qwen_report_id, doubao_report_id,
    divergence_score, sentiment_diff, keyword_overlap, entity_diff,
    consensus_summary, conflict_summary,
    priority_score, company_importance, event_importance,
    status, analysis_metadata
) VALUES (
    'ARB_000001_' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD'),
    '000001', CURRENT_DATE, 1, 2,
    0.65, 0.5, 0.4, 0.3,
    '两家AI都认为该股票基本面稳定，建议持有观望，但关注点不同。',
    '主要分歧在于风险评估角度：Qwen基于财务数据，豆包基于市场情绪。',
    0.72, 0.8, 0.6,
    'PENDING_HUMAN',
    '{"sentiment_diff": 0.5, "keyword_overlap": 0.4, "entity_diff": 0.3}'
);

-- 7. 创建视图
CREATE OR REPLACE VIEW v_high_priority_cases AS
SELECT
    ac.id,
    ac.case_id,
    ac.stock_code,
    ac.trade_date,
    ac.divergence_score,
    ac.priority_score,
    ac.consensus_summary,
    ac.conflict_summary,
    ac.status,
    ac.created_at,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - ac.created_at)) as days_pending
FROM arbitration_cases ac
WHERE ac.priority_score >= 0.7
    AND ac.status = 'PENDING_HUMAN'
ORDER BY ac.priority_score DESC, ac.created_at ASC;

-- 完成
SELECT 'Database schema initialized successfully!' as status;

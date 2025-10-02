-- 数据库迁移脚本: v11.9架构升级 - 仲裁预处理模块
-- 版本: v11.9
-- 创建时间: 2025-01-17
-- 描述: 降级AI仲裁，强化AI总结，为人类仲裁官提供高质量案情摘要

-- ============================================
-- 1. 修改arbitration_cases表结构
-- ============================================

-- 删除现有的arbitration_cases表（如果存在）
DROP TABLE IF EXISTS arbitration_cases;

-- 重新创建arbitration_cases表，符合v11.9架构需求
CREATE TABLE arbitration_cases (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    case_id VARCHAR(100) NOT NULL UNIQUE COMMENT '案件ID: ARB_{stock_code}_{date}',
    stock_code VARCHAR(20) NOT NULL COMMENT '股票代码',
    trade_date DATE NOT NULL COMMENT '交易日期',
    qwen_report_id BIGINT NOT NULL COMMENT 'Qwen事实归因报告ID',
    doubao_report_id BIGINT NOT NULL COMMENT '豆包舆情感知报告ID',

    -- 分歧度分析结果
    divergence_score DECIMAL(5,4) NOT NULL COMMENT '分歧度分数(0-1)',
    sentiment_diff DECIMAL(5,4) NOT NULL COMMENT '情感差异分数(0-1)',
    keyword_overlap DECIMAL(5,4) NOT NULL COMMENT '关键词重合度(0-1)',
    entity_diff DECIMAL(5,4) NOT NULL COMMENT '核心实体差异(0-1)',

    -- AI总结结果
    consensus_summary TEXT NOT NULL COMMENT 'AI共识点摘要',
    conflict_summary TEXT NOT NULL COMMENT '核心争议点摘要',

    -- 优先级计算
    priority_score DECIMAL(5,4) NOT NULL COMMENT '仲裁优先级分数(0-1)',
    company_importance DECIMAL(5,4) NOT NULL COMMENT '公司重要性分数(0-1)',
    event_importance DECIMAL(5,4) NOT NULL COMMENT '事件重要性分数(0-1)',

    -- 状态管理
    status ENUM('PENDING_HUMAN', 'IN_PROGRESS', 'COMPLETED', 'IGNORED', 'CANCELLED')
        DEFAULT 'PENDING_HUMAN' COMMENT '案件状态',

    -- 人类仲裁结果（可选）
    human_arbitrator_id VARCHAR(50) DEFAULT NULL COMMENT '人类仲裁员ID',
    human_decision TEXT DEFAULT NULL COMMENT '人类仲裁决策',
    final_recommendation ENUM('BUY', 'HOLD', 'SELL', 'IGNORE') DEFAULT NULL COMMENT '最终建议',
    final_confidence DECIMAL(3,2) DEFAULT NULL COMMENT '最终置信度(0-1)',

    -- 分析元数据
    analysis_metadata JSON DEFAULT NULL COMMENT '分析元数据(JSON格式)',

    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    completed_at TIMESTAMP NULL DEFAULT NULL COMMENT '完成时间',

    -- 索引
    INDEX idx_case_id (case_id),
    INDEX idx_stock_date (stock_code, trade_date),
    INDEX idx_status (status),
    INDEX idx_priority_score (priority_score DESC),
    INDEX idx_divergence_score (divergence_score DESC),
    INDEX idx_created_at (created_at),
    INDEX idx_trade_date (trade_date),

    -- 外键约束
    FOREIGN KEY (qwen_report_id) REFERENCES generated_reports(id) ON DELETE CASCADE,
    FOREIGN KEY (doubao_report_id) REFERENCES generated_reports(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='仲裁案件表 - v11.9架构升级，支持AI预处理和人类仲裁';

-- ============================================
-- 2. 修改generated_reports表结构
-- ============================================

-- 移除pair_report_id字段（不再需要，由arbitration_cases统一管理）
ALTER TABLE generated_reports DROP COLUMN IF EXISTS pair_report_id;

-- 确保source字段存在且符合v11.9要求
ALTER TABLE generated_reports
MODIFY COLUMN source ENUM('qwen_fact_based', 'doubao_sentiment_based', 'human_arbitrated', 'legacy_analysis')
NOT NULL DEFAULT 'legacy_analysis' COMMENT '报告来源';

-- 添加sentiment_score字段（如果不存在）
ALTER TABLE generated_reports
ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(5,4) DEFAULT NULL COMMENT '情感分数(-1到1)';

-- 添加keywords字段（如果不存在）
ALTER TABLE generated_reports
ADD COLUMN IF NOT EXISTS keywords JSON DEFAULT NULL COMMENT '关键词列表(JSON格式)';

-- 添加entities字段（如果不存在）
ALTER TABLE generated_reports
ADD COLUMN IF NOT EXISTS entities JSON DEFAULT NULL COMMENT '核心实体列表(JSON格式)';

-- 添加summary字段（如果不存在）
ALTER TABLE generated_reports
ADD COLUMN IF NOT EXISTS summary TEXT DEFAULT NULL COMMENT '报告摘要';

-- 更新source字段约束
ALTER TABLE generated_reports
DROP CONSTRAINT IF EXISTS chk_source;

ALTER TABLE generated_reports
ADD CONSTRAINT chk_source_v11_9 CHECK (source IN ('qwen_fact_based', 'doubao_sentiment_based', 'human_arbitrated', 'legacy_analysis'));

-- ============================================
-- 3. 创建仲裁案件分析统计表
-- ============================================

CREATE TABLE arbitration_analysis_stats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    trade_date DATE NOT NULL COMMENT '统计日期',
    total_cases INT NOT NULL DEFAULT 0 COMMENT '总案件数',
    pending_cases INT NOT NULL DEFAULT 0 COMMENT '待处理案件数',
    completed_cases INT NOT NULL DEFAULT 0 COMMENT '已完成案件数',
    ignored_cases INT NOT NULL DEFAULT 0 COMMENT '已忽略案件数',

    -- 分歧度统计
    avg_divergence_score DECIMAL(5,4) DEFAULT NULL COMMENT '平均分歧度',
    max_divergence_score DECIMAL(5,4) DEFAULT NULL COMMENT '最大分歧度',
    min_divergence_score DECIMAL(5,4) DEFAULT NULL COMMENT '最小分歧度',

    -- 优先级统计
    avg_priority_score DECIMAL(5,4) DEFAULT NULL COMMENT '平均优先级',
    high_priority_cases INT NOT NULL DEFAULT 0 COMMENT '高优先级案件数(>0.7)',
    medium_priority_cases INT NOT NULL DEFAULT 0 COMMENT '中优先级案件数(0.3-0.7)',
    low_priority_cases INT NOT NULL DEFAULT 0 COMMENT '低优先级案件数(<0.3)',

    -- 处理时间统计
    avg_processing_time_minutes DECIMAL(10,2) DEFAULT NULL COMMENT '平均处理时间(分钟)',
    max_processing_time_minutes DECIMAL(10,2) DEFAULT NULL COMMENT '最大处理时间(分钟)',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    UNIQUE KEY uk_trade_date (trade_date),
    INDEX idx_trade_date (trade_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='仲裁案件分析统计表 - 每日统计汇总';

-- ============================================
-- 4. 创建人类仲裁员反馈表
-- ============================================

CREATE TABLE human_arbitrator_feedback (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    arbitration_case_id BIGINT NOT NULL COMMENT '仲裁案件ID',
    arbitrator_id VARCHAR(50) NOT NULL COMMENT '仲裁员ID',

    -- 反馈评分
    ai_summary_quality INT NOT NULL COMMENT 'AI摘要质量评分(1-5)',
    priority_accuracy INT NOT NULL COMMENT '优先级准确性评分(1-5)',
    divergence_analysis_quality INT NOT NULL COMMENT '分歧度分析质量评分(1-5)',
    overall_satisfaction INT NOT NULL COMMENT '整体满意度评分(1-5)',

    -- 文本反馈
    feedback_text TEXT DEFAULT NULL COMMENT '详细反馈文本',
    suggestions TEXT DEFAULT NULL COMMENT '改进建议',

    -- 决策信息
    decision_time_minutes INT DEFAULT NULL COMMENT '决策用时(分钟)',
    decision_factors JSON DEFAULT NULL COMMENT '决策因素(JSON格式)',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

    INDEX idx_arbitration_case (arbitration_case_id),
    INDEX idx_arbitrator (arbitrator_id),
    INDEX idx_created_at (created_at),

    FOREIGN KEY (arbitration_case_id) REFERENCES arbitration_cases(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='人类仲裁员反馈表 - 收集仲裁员对AI预处理质量的反馈';

-- ============================================
-- 5. 创建视图和存储过程
-- ============================================

-- 创建高优先级案件视图
CREATE VIEW v_high_priority_cases AS
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
    DATEDIFF(NOW(), ac.created_at) as days_pending
FROM arbitration_cases ac
WHERE ac.priority_score >= 0.7
    AND ac.status = 'PENDING_HUMAN'
ORDER BY ac.priority_score DESC, ac.created_at ASC;

-- 创建仲裁案件概览视图
CREATE VIEW v_arbitration_cases_overview AS
SELECT
    ac.id,
    ac.case_id,
    ac.stock_code,
    ac.trade_date,
    ac.divergence_score,
    ac.priority_score,
    ac.status,
    ac.created_at,
    ac.completed_at,
    qr.analyzer_type as qwen_analyzer,
    dr.analyzer_type as doubao_analyzer,
    qr.confidence_score as qwen_confidence,
    dr.confidence_score as doubao_confidence,
    CASE
        WHEN ac.priority_score >= 0.7 THEN 'HIGH'
        WHEN ac.priority_score >= 0.3 THEN 'MEDIUM'
        ELSE 'LOW'
    END as priority_level,
    DATEDIFF(NOW(), ac.created_at) as days_pending
FROM arbitration_cases ac
LEFT JOIN generated_reports qr ON ac.qwen_report_id = qr.id
LEFT JOIN generated_reports dr ON ac.doubao_report_id = dr.id
ORDER BY ac.priority_score DESC, ac.created_at ASC;

-- 创建每日统计更新存储过程
DELIMITER //
CREATE PROCEDURE UpdateArbitrationDailyStats(IN target_date DATE)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- 删除当日统计（如果存在）
    DELETE FROM arbitration_analysis_stats WHERE trade_date = target_date;

    -- 插入新的统计
    INSERT INTO arbitration_analysis_stats (
        trade_date,
        total_cases,
        pending_cases,
        completed_cases,
        ignored_cases,
        avg_divergence_score,
        max_divergence_score,
        min_divergence_score,
        avg_priority_score,
        high_priority_cases,
        medium_priority_cases,
        low_priority_cases
    )
    SELECT
        target_date,
        COUNT(*) as total_cases,
        SUM(CASE WHEN status = 'PENDING_HUMAN' THEN 1 ELSE 0 END) as pending_cases,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_cases,
        SUM(CASE WHEN status = 'IGNORED' THEN 1 ELSE 0 END) as ignored_cases,
        AVG(divergence_score) as avg_divergence_score,
        MAX(divergence_score) as max_divergence_score,
        MIN(divergence_score) as min_divergence_score,
        AVG(priority_score) as avg_priority_score,
        SUM(CASE WHEN priority_score >= 0.7 THEN 1 ELSE 0 END) as high_priority_cases,
        SUM(CASE WHEN priority_score >= 0.3 AND priority_score < 0.7 THEN 1 ELSE 0 END) as medium_priority_cases,
        SUM(CASE WHEN priority_score < 0.3 THEN 1 ELSE 0 END) as low_priority_cases
    FROM arbitration_cases
    WHERE trade_date = target_date;

    COMMIT;

    SELECT CONCAT('Updated arbitration stats for ', target_date) as result;
END //
DELIMITER ;

-- ============================================
-- 6. 插入示例数据
-- ============================================

-- 插入示例仲裁案件
INSERT INTO arbitration_cases (
    case_id, stock_code, trade_date, qwen_report_id, doubao_report_id,
    divergence_score, sentiment_diff, keyword_overlap, entity_diff,
    consensus_summary, conflict_summary,
    priority_score, company_importance, event_importance,
    status, analysis_metadata
) VALUES (
    'ARB_000001_20250117', '000001', '2025-01-17', 1, 2,
    0.7500, 0.8000, 0.3000, 0.6000,
    '两家AI都认为该股票基本面良好，技术面存在突破机会，建议关注业绩增长和行业趋势。',
    '主要分歧在于风险评估：Qwen更关注基本面风险，豆包更关注市场情绪风险。',
    0.7800, 0.8000, 0.7000,
    'PENDING_HUMAN',
    '{"sentiment_diff": 0.8, "keyword_overlap": 0.3, "entity_diff": 0.6, "analysis_timestamp": "2025-01-17T10:00:00"}'
);

-- ============================================
-- 7. 创建索引优化
-- ============================================

-- 为generated_reports表添加复合索引
CREATE INDEX idx_source_trade_date ON generated_reports(source, created_at);
CREATE INDEX idx_stock_source ON generated_reports(stock_code, source);

-- 为arbitration_cases表添加复合索引
CREATE INDEX idx_status_priority ON arbitration_cases(status, priority_score DESC);
CREATE INDEX idx_trade_date_status ON arbitration_cases(trade_date, status);

COMMIT;

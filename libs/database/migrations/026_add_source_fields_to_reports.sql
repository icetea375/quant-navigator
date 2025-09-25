-- 数据库迁移脚本: 为报告表添加source字段支持双脑分治架构
-- 版本: v10.5
-- 创建时间: 2025-01-17
-- 描述: 支持Qwen事实归因流和豆包舆情感知流的双报告对比仲裁

-- 为generated_reports表添加source字段
ALTER TABLE generated_reports
ADD COLUMN source VARCHAR(50) DEFAULT 'unknown' COMMENT '报告来源: qwen_fact_based, doubao_sentiment_based, human_arbitrated';

-- 为generated_reports表添加pair_report_id字段，用于关联两个AI报告
ALTER TABLE generated_reports
ADD COLUMN pair_report_id INT DEFAULT NULL COMMENT '关联的配对报告ID';

-- 为generated_reports表添加analyzer_type字段
ALTER TABLE generated_reports
ADD COLUMN analyzer_type VARCHAR(50) DEFAULT NULL COMMENT '分析器类型';

-- 为generated_reports表添加置信度字段
ALTER TABLE generated_reports
ADD COLUMN confidence_score DECIMAL(3,2) DEFAULT 0.5 COMMENT '置信度评分(0-1)';

-- 为generated_reports表添加分析质量字段
ALTER TABLE generated_reports
ADD COLUMN analysis_quality VARCHAR(20) DEFAULT 'medium' COMMENT '分析质量: low, medium, high';

-- 创建仲裁案件表
CREATE TABLE IF NOT EXISTS arbitration_cases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    stock_code VARCHAR(20) NOT NULL COMMENT '股票代码',
    trade_date DATE NOT NULL COMMENT '交易日期',
    qwen_report_id VARCHAR(50) NOT NULL COMMENT 'Qwen报告ID',
    doubao_report_id VARCHAR(50) NOT NULL COMMENT '豆包报告ID',
    status ENUM('pending_arbitration', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending_arbitration' COMMENT '仲裁状态',
    human_arbitrator_id VARCHAR(50) DEFAULT NULL COMMENT '人类仲裁员ID',
    arbitration_decision TEXT DEFAULT NULL COMMENT '仲裁决策',
    final_recommendation VARCHAR(20) DEFAULT NULL COMMENT '最终建议: BUY, HOLD, SELL',
    confidence_level DECIMAL(3,2) DEFAULT NULL COMMENT '最终置信度',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    completed_at TIMESTAMP NULL DEFAULT NULL COMMENT '完成时间',
    
    INDEX idx_stock_date (stock_code, trade_date),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (qwen_report_id) REFERENCES generated_reports(id),
    FOREIGN KEY (doubao_report_id) REFERENCES generated_reports(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='仲裁案件表';

-- 创建报告对比分析表
CREATE TABLE IF NOT EXISTS report_comparisons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    arbitration_case_id INT NOT NULL COMMENT '仲裁案件ID',
    comparison_type VARCHAR(50) NOT NULL COMMENT '对比类型: sentiment, risk, recommendation',
    qwen_value TEXT DEFAULT NULL COMMENT 'Qwen分析值',
    doubao_value TEXT DEFAULT NULL COMMENT '豆包分析值',
    similarity_score DECIMAL(3,2) DEFAULT NULL COMMENT '相似度评分(0-1)',
    conflict_level ENUM('low', 'medium', 'high') DEFAULT 'low' COMMENT '冲突等级',
    human_override TEXT DEFAULT NULL COMMENT '人类覆盖决策',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    INDEX idx_arbitration_case (arbitration_case_id),
    INDEX idx_comparison_type (comparison_type),
    INDEX idx_conflict_level (conflict_level),
    
    FOREIGN KEY (arbitration_case_id) REFERENCES arbitration_cases(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='报告对比分析表';

-- 创建分析器性能统计表
CREATE TABLE IF NOT EXISTS analyzer_performance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    analyzer_type VARCHAR(50) NOT NULL COMMENT '分析器类型',
    stock_code VARCHAR(20) NOT NULL COMMENT '股票代码',
    trade_date DATE NOT NULL COMMENT '交易日期',
    processing_time_ms INT DEFAULT NULL COMMENT '处理时间(毫秒)',
    accuracy_score DECIMAL(3,2) DEFAULT NULL COMMENT '准确度评分(0-1)',
    confidence_score DECIMAL(3,2) DEFAULT NULL COMMENT '置信度评分(0-1)',
    human_rating INT DEFAULT NULL COMMENT '人类评分(1-5)',
    error_message TEXT DEFAULT NULL COMMENT '错误信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    INDEX idx_analyzer_type (analyzer_type),
    INDEX idx_stock_date (stock_code, trade_date),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分析器性能统计表';

-- 更新现有数据的source字段
UPDATE generated_reports 
SET source = 'legacy_analysis' 
WHERE source = 'unknown' OR source IS NULL;

-- 为source字段添加索引
CREATE INDEX idx_source ON generated_reports(source);
CREATE INDEX idx_analyzer_type ON generated_reports(analyzer_type);
CREATE INDEX idx_pair_report_id ON generated_reports(pair_report_id);

-- 添加约束
ALTER TABLE generated_reports
ADD CONSTRAINT chk_source CHECK (source IN ('qwen_fact_based', 'doubao_sentiment_based', 'human_arbitrated', 'legacy_analysis'));

ALTER TABLE generated_reports
ADD CONSTRAINT chk_confidence_score CHECK (confidence_score >= 0 AND confidence_score <= 1);

ALTER TABLE generated_reports
ADD CONSTRAINT chk_analysis_quality CHECK (analysis_quality IN ('low', 'medium', 'high'));

-- 插入示例数据
INSERT INTO arbitration_cases (stock_code, trade_date, qwen_report_id, doubao_report_id, status) 
VALUES ('000001', '2025-01-17', 'qwen_001', 'doubao_001', 'pending_arbitration');

-- 创建视图：待仲裁案件概览
CREATE VIEW v_pending_arbitration AS
SELECT 
    ac.id,
    ac.stock_code,
    ac.trade_date,
    ac.status,
    ac.created_at,
    qr.analyzer_type as qwen_analyzer,
    dr.analyzer_type as doubao_analyzer,
    qr.confidence_score as qwen_confidence,
    dr.confidence_score as doubao_confidence,
    DATEDIFF(NOW(), ac.created_at) as days_pending
FROM arbitration_cases ac
LEFT JOIN generated_reports qr ON ac.qwen_report_id = qr.id
LEFT JOIN generated_reports dr ON ac.doubao_report_id = dr.id
WHERE ac.status = 'pending_arbitration'
ORDER BY ac.created_at DESC;

-- 创建视图：分析器性能统计
CREATE VIEW v_analyzer_performance AS
SELECT 
    analyzer_type,
    COUNT(*) as total_analyses,
    AVG(processing_time_ms) as avg_processing_time,
    AVG(accuracy_score) as avg_accuracy,
    AVG(confidence_score) as avg_confidence,
    AVG(human_rating) as avg_human_rating,
    COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) as error_count
FROM analyzer_performance
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY analyzer_type;

COMMIT;

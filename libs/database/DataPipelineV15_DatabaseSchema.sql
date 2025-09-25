-- DataPipeline v1.5 数据库升级方案
-- "骨架+神经"双重分析体系数据库设计
-- 创建时间: 2025-09-22

-- ============================================
-- 骨架数据表 (Skeleton) - 稳定结构
-- ============================================

-- 1. 行业分类表 (存储"骨架"的层级结构)
CREATE TABLE industry_classification (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    industry_code VARCHAR(20) NOT NULL UNIQUE COMMENT '行业代码 (e.g., 801010)',
    industry_name VARCHAR(100) NOT NULL COMMENT '行业名称',
    level ENUM('L1', 'L2', 'L3') NOT NULL COMMENT '层级',
    parent_code VARCHAR(20) COMMENT '父级行业代码',
    source ENUM('Shenwan', 'Citic') NOT NULL COMMENT '数据源',
    update_date DATE NOT NULL COMMENT '更新日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_industry_code (industry_code),
    INDEX idx_level (level),
    INDEX idx_source (source),
    INDEX idx_parent_code (parent_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='行业分类表 - 存储申万/中信行业层级结构';

-- 2. 行业成分股表 (存储"骨架"的成分)
CREATE TABLE industry_members (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    industry_code VARCHAR(20) NOT NULL COMMENT '行业代码',
    stock_code VARCHAR(20) NOT NULL COMMENT '股票代码',
    stock_name VARCHAR(100) NOT NULL COMMENT '股票名称',
    in_date DATE NOT NULL COMMENT '纳入日期',
    out_date DATE NULL COMMENT '剔除日期',
    is_current BOOLEAN DEFAULT TRUE COMMENT '是否当前成分',
    weight DECIMAL(10,6) NULL COMMENT '权重',
    source ENUM('Shenwan', 'Citic') NOT NULL COMMENT '数据源',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_industry_code (industry_code),
    INDEX idx_stock_code (stock_code),
    INDEX idx_is_current (is_current),
    INDEX idx_source (source),
    INDEX idx_in_date (in_date),
    UNIQUE KEY uk_industry_stock (industry_code, stock_code, in_date),
    
    FOREIGN KEY (industry_code) REFERENCES industry_classification(industry_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='行业成分股表 - 存储股票与申万/中信行业的映射关系';

-- ============================================
-- 神经数据表 (Nervous System) - 敏锐触角
-- ============================================

-- 3. 每日概念板块表 (存储"神经"的快照)
CREATE TABLE daily_concepts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    trade_date DATE NOT NULL COMMENT '交易日期',
    concept_code VARCHAR(50) NOT NULL COMMENT '概念代码 (e.g., BK1184.DC)',
    concept_name VARCHAR(100) NOT NULL COMMENT '概念名称',
    source ENUM('THS', 'DC') NOT NULL COMMENT '数据源',
    hot_rank INT NULL COMMENT '热度排名',
    hot_score DECIMAL(10,4) NULL COMMENT '热度评分',
    member_count INT DEFAULT 0 COMMENT '成分股数量',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_trade_date (trade_date),
    INDEX idx_concept_code (concept_code),
    INDEX idx_source (source),
    INDEX idx_hot_rank (hot_rank),
    UNIQUE KEY uk_date_concept (trade_date, concept_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='每日概念板块表 - 存储每日活跃的同花顺/东方财富概念列表';

-- 4. 每日概念成分股表 (存储"神经"的连接)
CREATE TABLE daily_concept_members (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    trade_date DATE NOT NULL COMMENT '交易日期',
    concept_code VARCHAR(50) NOT NULL COMMENT '概念代码',
    stock_code VARCHAR(20) NOT NULL COMMENT '股票代码',
    stock_name VARCHAR(100) NOT NULL COMMENT '股票名称',
    weight DECIMAL(10,6) NULL COMMENT '权重',
    hot_rank INT NULL COMMENT '热度排名',
    source ENUM('THS', 'DC') NOT NULL COMMENT '数据源',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_trade_date (trade_date),
    INDEX idx_concept_code (concept_code),
    INDEX idx_stock_code (stock_code),
    INDEX idx_source (source),
    INDEX idx_hot_rank (hot_rank),
    UNIQUE KEY uk_date_concept_stock (trade_date, concept_code, stock_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='每日概念成分股表 - 存储每日的概念板块与其成分股的快照';

-- ============================================
-- 宏观数据表 (Market Structure)
-- ============================================

-- 5. 大盘指数每日指标表
CREATE TABLE index_daily_metrics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ts_code VARCHAR(20) NOT NULL COMMENT '指数代码',
    trade_date DATE NOT NULL COMMENT '交易日期',
    close DECIMAL(15,4) NOT NULL COMMENT '收盘价',
    pct_chg DECIMAL(10,4) NOT NULL COMMENT '涨跌幅',
    vol BIGINT NOT NULL COMMENT '成交量',
    amount DECIMAL(20,4) NOT NULL COMMENT '成交额',
    pe DECIMAL(10,4) NULL COMMENT '市盈率',
    pb DECIMAL(10,4) NULL COMMENT '市净率',
    turnover_rate DECIMAL(10,4) NULL COMMENT '换手率',
    market_cap DECIMAL(20,4) NULL COMMENT '总市值',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_ts_code (ts_code),
    INDEX idx_trade_date (trade_date),
    UNIQUE KEY uk_code_date (ts_code, trade_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='大盘指数每日指标表';

-- 6. 沪深市场每日交易统计表
CREATE TABLE market_daily_stats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    trade_date DATE NOT NULL UNIQUE COMMENT '交易日期',
    total_market_cap DECIMAL(20,4) NOT NULL COMMENT '总市值',
    circ_market_cap DECIMAL(20,4) NOT NULL COMMENT '流通市值',
    total_vol BIGINT NOT NULL COMMENT '总成交量',
    total_amount DECIMAL(20,4) NOT NULL COMMENT '总成交额',
    avg_pe DECIMAL(10,4) NULL COMMENT '平均市盈率',
    avg_pb DECIMAL(10,4) NULL COMMENT '平均市净率',
    up_count INT DEFAULT 0 COMMENT '上涨家数',
    down_count INT DEFAULT 0 COMMENT '下跌家数',
    flat_count INT DEFAULT 0 COMMENT '平盘家数',
    limit_up_count INT DEFAULT 0 COMMENT '涨停家数',
    limit_down_count INT DEFAULT 0 COMMENT '跌停家数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_trade_date (trade_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='沪深市场每日交易统计表';

-- 7. 指数成分和权重表
CREATE TABLE index_components (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ts_code VARCHAR(20) NOT NULL COMMENT '指数代码',
    stock_code VARCHAR(20) NOT NULL COMMENT '成分股代码',
    stock_name VARCHAR(100) NOT NULL COMMENT '成分股名称',
    weight DECIMAL(10,6) NOT NULL COMMENT '权重',
    trade_date DATE NOT NULL COMMENT '交易日期',
    is_new BOOLEAN DEFAULT FALSE COMMENT '是否新纳入',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_ts_code (ts_code),
    INDEX idx_stock_code (stock_code),
    INDEX idx_trade_date (trade_date),
    UNIQUE KEY uk_code_stock_date (ts_code, stock_code, trade_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='指数成分和权重表';

-- ============================================
-- 深度文本数据表 (Textual Intelligence)
-- ============================================

-- 8. 长篇新闻表
CREATE TABLE long_form_news (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    news_id VARCHAR(50) NOT NULL UNIQUE COMMENT '新闻ID',
    title TEXT NOT NULL COMMENT '标题',
    content LONGTEXT NOT NULL COMMENT '内容',
    summary TEXT NULL COMMENT '摘要',
    publish_time DATETIME NOT NULL COMMENT '发布时间',
    source VARCHAR(50) NOT NULL COMMENT '来源',
    category VARCHAR(50) NULL COMMENT '分类',
    importance_score DECIMAL(5,2) DEFAULT 0 COMMENT '重要性评分',
    sentiment_score DECIMAL(5,2) DEFAULT 0 COMMENT '情感评分',
    related_stocks JSON NULL COMMENT '相关股票',
    related_concepts JSON NULL COMMENT '相关概念',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_news_id (news_id),
    INDEX idx_publish_time (publish_time),
    INDEX idx_source (source),
    INDEX idx_category (category),
    INDEX idx_importance_score (importance_score),
    INDEX idx_sentiment_score (sentiment_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='长篇新闻表';

-- 9. 新闻联播表
CREATE TABLE news_broadcast (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    broadcast_id VARCHAR(50) NOT NULL UNIQUE COMMENT '联播ID',
    date DATE NOT NULL COMMENT '日期',
    title TEXT NOT NULL COMMENT '标题',
    content LONGTEXT NOT NULL COMMENT '内容',
    summary TEXT NULL COMMENT '摘要',
    duration INT NULL COMMENT '时长(秒)',
    importance_score DECIMAL(5,2) DEFAULT 0 COMMENT '重要性评分',
    related_stocks JSON NULL COMMENT '相关股票',
    related_concepts JSON NULL COMMENT '相关概念',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_broadcast_id (broadcast_id),
    INDEX idx_date (date),
    INDEX idx_importance_score (importance_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='新闻联播表';

-- 10. e互动问答表
CREATE TABLE e_interaction (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    interaction_id VARCHAR(50) NOT NULL UNIQUE COMMENT '问答ID',
    stock_code VARCHAR(20) NOT NULL COMMENT '股票代码',
    stock_name VARCHAR(100) NOT NULL COMMENT '股票名称',
    question TEXT NOT NULL COMMENT '问题',
    answer LONGTEXT NOT NULL COMMENT '回答',
    question_time DATETIME NOT NULL COMMENT '提问时间',
    answer_time DATETIME NOT NULL COMMENT '回答时间',
    questioner VARCHAR(100) NULL COMMENT '提问者',
    responder VARCHAR(100) NULL COMMENT '回答者',
    importance_score DECIMAL(5,2) DEFAULT 0 COMMENT '重要性评分',
    sentiment_score DECIMAL(5,2) DEFAULT 0 COMMENT '情感评分',
    related_concepts JSON NULL COMMENT '相关概念',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_interaction_id (interaction_id),
    INDEX idx_stock_code (stock_code),
    INDEX idx_question_time (question_time),
    INDEX idx_answer_time (answer_time),
    INDEX idx_importance_score (importance_score),
    INDEX idx_sentiment_score (sentiment_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='e互动问答表';

-- ============================================
-- 分区和索引优化
-- ============================================

-- 为大数据量表创建分区 (按日期分区)
-- 注意：MySQL 8.0+ 支持，需要根据实际版本调整

-- daily_concept_members 表按日期分区
-- ALTER TABLE daily_concept_members 
-- PARTITION BY RANGE (TO_DAYS(trade_date)) (
--     PARTITION p202501 VALUES LESS THAN (TO_DAYS('2025-02-01')),
--     PARTITION p202502 VALUES LESS THAN (TO_DAYS('2025-03-01')),
--     -- 继续添加分区...
--     PARTITION p_future VALUES LESS THAN MAXVALUE
-- );

-- ============================================
-- 视图定义 (智能引擎数据源)
-- ============================================

-- QuantSignalEngine 数据源视图 (骨架)
CREATE VIEW v_quant_signal_data AS
SELECT 
    ic.industry_code,
    ic.industry_name,
    ic.level,
    ic.parent_code,
    ic.source,
    im.stock_code,
    im.stock_name,
    im.weight,
    im.is_current
FROM industry_classification ic
LEFT JOIN industry_members im ON ic.industry_code = im.industry_code
WHERE im.is_current = TRUE;

-- HotspotIntelligenceEngine 数据源视图 (神经)
CREATE VIEW v_hotspot_intelligence_data AS
SELECT 
    dc.trade_date,
    dc.concept_code,
    dc.concept_name,
    dc.source,
    dc.hot_rank,
    dc.hot_score,
    dcm.stock_code,
    dcm.stock_name,
    dcm.weight,
    dcm.hot_rank as member_hot_rank
FROM daily_concepts dc
LEFT JOIN daily_concept_members dcm ON dc.concept_code = dcm.concept_code 
    AND dc.trade_date = dcm.trade_date
WHERE dc.trade_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY); -- 最近7天数据

-- AI_Attribution_Core 数据源视图 (双重融合)
CREATE VIEW v_attribution_data AS
SELECT 
    -- 骨架数据
    ic.industry_code,
    ic.industry_name as industry_name,
    ic.level,
    im.stock_code,
    im.stock_name,
    im.weight as industry_weight,
    
    -- 神经数据
    dc.concept_code,
    dc.concept_name,
    dc.hot_rank as concept_hot_rank,
    dc.hot_score as concept_hot_score,
    dcm.weight as concept_weight,
    
    -- 文本数据
    lfn.title as news_title,
    lfn.importance_score as news_importance,
    lfn.sentiment_score as news_sentiment,
    lfn.related_concepts as news_concepts,
    
    -- 市场数据
    mds.total_market_cap,
    mds.avg_pe,
    mds.limit_up_count,
    mds.limit_down_count
    
FROM industry_members im
LEFT JOIN industry_classification ic ON im.industry_code = ic.industry_code
LEFT JOIN daily_concept_members dcm ON im.stock_code = dcm.stock_code 
    AND dcm.trade_date = CURDATE()
LEFT JOIN daily_concepts dc ON dcm.concept_code = dc.concept_code 
    AND dcm.trade_date = dc.trade_date
LEFT JOIN long_form_news lfn ON lfn.related_stocks LIKE CONCAT('%"', im.stock_code, '"%')
    AND DATE(lfn.publish_time) = CURDATE()
LEFT JOIN market_daily_stats mds ON mds.trade_date = CURDATE()
WHERE im.is_current = TRUE;

-- ============================================
-- 存储过程 (数据维护)
-- ============================================

-- 清理过期概念数据 (保留最近30天)
DELIMITER //
CREATE PROCEDURE CleanExpiredConceptData()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- 删除30天前的概念数据
    DELETE FROM daily_concepts 
    WHERE trade_date < DATE_SUB(CURDATE(), INTERVAL 30 DAY);
    
    DELETE FROM daily_concept_members 
    WHERE trade_date < DATE_SUB(CURDATE(), INTERVAL 30 DAY);
    
    COMMIT;
    
    SELECT CONCAT('Cleaned concept data older than ', DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as result;
END //
DELIMITER ;

-- 更新行业成分股状态
DELIMITER //
CREATE PROCEDURE UpdateIndustryMemberStatus()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- 更新有剔除日期的成分股状态
    UPDATE industry_members 
    SET is_current = FALSE 
    WHERE out_date IS NOT NULL AND out_date <= CURDATE();
    
    COMMIT;
    
    SELECT CONCAT('Updated industry member status at ', NOW()) as result;
END //
DELIMITER ;

-- ============================================
-- 触发器 (数据一致性)
-- ============================================

-- 更新概念成分股数量
DELIMITER //
CREATE TRIGGER tr_update_concept_member_count
AFTER INSERT ON daily_concept_members
FOR EACH ROW
BEGIN
    UPDATE daily_concepts 
    SET member_count = (
        SELECT COUNT(*) 
        FROM daily_concept_members 
        WHERE concept_code = NEW.concept_code 
        AND trade_date = NEW.trade_date
    )
    WHERE concept_code = NEW.concept_code 
    AND trade_date = NEW.trade_date;
END //
DELIMITER ;

-- ============================================
-- 权限设置
-- ============================================

-- 创建只读用户用于智能引擎
-- CREATE USER 'quant_signal_engine'@'%' IDENTIFIED BY 'secure_password';
-- GRANT SELECT ON v_quant_signal_data TO 'quant_signal_engine'@'%';

-- CREATE USER 'hotspot_intelligence_engine'@'%' IDENTIFIED BY 'secure_password';
-- GRANT SELECT ON v_hotspot_intelligence_data TO 'hotspot_intelligence_engine'@'%';

-- CREATE USER 'ai_attribution_core'@'%' IDENTIFIED BY 'secure_password';
-- GRANT SELECT ON v_attribution_data TO 'ai_attribution_core'@'%';

-- ============================================
-- 数据迁移脚本
-- ============================================

-- 从现有表迁移数据到新表结构
-- INSERT INTO industry_classification (industry_code, industry_name, level, parent_code, source, update_date)
-- SELECT DISTINCT 
--     industry_code,
--     industry_name,
--     'L2' as level,
--     '' as parent_code,
--     'Shenwan' as source,
--     CURDATE() as update_date
-- FROM existing_industry_table;

-- ============================================
-- 性能优化建议
-- ============================================

-- 1. 定期分析表统计信息
-- ANALYZE TABLE industry_classification, industry_members, daily_concepts, daily_concept_members;

-- 2. 定期优化表
-- OPTIMIZE TABLE daily_concept_members, daily_concepts;

-- 3. 监控慢查询
-- SET GLOBAL slow_query_log = 'ON';
-- SET GLOBAL long_query_time = 2;

-- 4. 设置合适的缓冲池大小
-- SET GLOBAL innodb_buffer_pool_size = 2G; -- 根据服务器内存调整

-- ============================================
-- 备份策略
-- ============================================

-- 1. 骨架数据 (低频备份)
-- mysqldump --single-transaction --routines --triggers datapipeline_v15 industry_classification industry_members > skeleton_backup.sql

-- 2. 神经数据 (高频备份，可考虑增量备份)
-- mysqldump --single-transaction --where="trade_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)" datapipeline_v15 daily_concepts daily_concept_members > concept_data_backup.sql

-- 3. 文本数据 (按需备份)
-- mysqldump --single-transaction --where="publish_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)" datapipeline_v15 long_form_news news_broadcast e_interaction > textual_data_backup.sql

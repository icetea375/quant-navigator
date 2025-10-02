-- 创建财务因子相关表的迁移脚本
-- 版本: 001
-- 创建时间: 2025-01-17
-- 描述: 创建财务因子表和超级财务因子表

-- 创建财务因子表
CREATE TABLE IF NOT EXISTS financial_factors (
    id VARCHAR(255) PRIMARY KEY,
    stock_code VARCHAR(20) NOT NULL,
    trade_date VARCHAR(8) NOT NULL,
    
    -- 估值指标
    pe_ratio DECIMAL(10,4),
    pb_ratio DECIMAL(10,4),
    ps_ratio DECIMAL(10,4),
    dividend_yield DECIMAL(10,4),
    
    -- 市场数据
    market_cap DECIMAL(20,2),
    turnover_rate DECIMAL(10,4),
    volume_ratio DECIMAL(10,4),
    float_market_cap DECIMAL(20,2),
    
    -- 股本数据
    total_shares DECIMAL(20,4),
    float_shares DECIMAL(20,4),
    free_shares DECIMAL(20,4),
    
    -- 价格数据
    open_price DECIMAL(10,4),
    high_price DECIMAL(10,4),
    low_price DECIMAL(10,4),
    close_price DECIMAL(10,4),
    pre_close DECIMAL(10,4),
    price_change DECIMAL(10,4),
    price_change_pct DECIMAL(10,4),
    
    -- 交易数据
    volume DECIMAL(20,4),
    amount DECIMAL(20,2),
    
    -- 元数据
    source VARCHAR(100) NOT NULL DEFAULT 'tushare',
    metadata_json JSONB,
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 唯一约束
    UNIQUE(stock_code, trade_date)
);

-- 创建超级财务因子表
CREATE TABLE IF NOT EXISTS super_financial_factors (
    id VARCHAR(255) PRIMARY KEY,
    stock_code VARCHAR(20) NOT NULL,
    trade_date VARCHAR(8) NOT NULL,
    
    -- 基础财务因子（继承自financial_factors）
    pe_ratio DECIMAL(10,4),
    pb_ratio DECIMAL(10,4),
    ps_ratio DECIMAL(10,4),
    dividend_yield DECIMAL(10,4),
    market_cap DECIMAL(20,2),
    turnover_rate DECIMAL(10,4),
    volume_ratio DECIMAL(10,4),
    float_market_cap DECIMAL(20,2),
    total_shares DECIMAL(20,4),
    float_shares DECIMAL(20,4),
    free_shares DECIMAL(20,4),
    open_price DECIMAL(10,4),
    high_price DECIMAL(10,4),
    low_price DECIMAL(10,4),
    close_price DECIMAL(10,4),
    pre_close DECIMAL(10,4),
    price_change DECIMAL(10,4),
    price_change_pct DECIMAL(10,4),
    volume DECIMAL(20,4),
    amount DECIMAL(20,2),
    
    -- 超级财务因子评分
    value_score FLOAT NOT NULL,
    growth_score FLOAT NOT NULL,
    profitability_score FLOAT NOT NULL,
    financial_health_score FLOAT NOT NULL,
    overall_score FLOAT NOT NULL,
    
    -- 计算信息
    calculated_at TIMESTAMP NOT NULL,
    model_version VARCHAR(50) NOT NULL DEFAULT 'v1.0',
    calculation_params_json JSONB,
    
    -- 元数据
    source VARCHAR(100) NOT NULL DEFAULT 'tushare',
    metadata_json JSONB,
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 唯一约束
    UNIQUE(stock_code, trade_date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_financial_factors_stock_code ON financial_factors(stock_code);
CREATE INDEX IF NOT EXISTS idx_financial_factors_trade_date ON financial_factors(trade_date);
CREATE INDEX IF NOT EXISTS idx_financial_factors_stock_date ON financial_factors(stock_code, trade_date);
CREATE INDEX IF NOT EXISTS idx_financial_factors_created_at ON financial_factors(created_at);

CREATE INDEX IF NOT EXISTS idx_super_financial_factors_stock_code ON super_financial_factors(stock_code);
CREATE INDEX IF NOT EXISTS idx_super_financial_factors_trade_date ON super_financial_factors(trade_date);
CREATE INDEX IF NOT EXISTS idx_super_financial_factors_stock_date ON super_financial_factors(stock_code, trade_date);
CREATE INDEX IF NOT EXISTS idx_super_financial_factors_overall_score ON super_financial_factors(overall_score);
CREATE INDEX IF NOT EXISTS idx_super_financial_factors_calculated_at ON super_financial_factors(calculated_at);

-- 添加约束
ALTER TABLE financial_factors ADD CONSTRAINT check_pe_ratio_positive CHECK (pe_ratio >= 0);
ALTER TABLE financial_factors ADD CONSTRAINT check_pb_ratio_positive CHECK (pb_ratio >= 0);
ALTER TABLE financial_factors ADD CONSTRAINT check_ps_ratio_positive CHECK (ps_ratio >= 0);
ALTER TABLE financial_factors ADD CONSTRAINT check_dividend_yield_positive CHECK (dividend_yield >= 0);
ALTER TABLE financial_factors ADD CONSTRAINT check_market_cap_positive CHECK (market_cap >= 0);
ALTER TABLE financial_factors ADD CONSTRAINT check_turnover_rate_positive CHECK (turnover_rate >= 0);
ALTER TABLE financial_factors ADD CONSTRAINT check_volume_ratio_positive CHECK (volume_ratio >= 0);
ALTER TABLE financial_factors ADD CONSTRAINT check_float_market_cap_positive CHECK (float_market_cap >= 0);
ALTER TABLE financial_factors ADD CONSTRAINT check_total_shares_positive CHECK (total_shares >= 0);
ALTER TABLE financial_factors ADD CONSTRAINT check_float_shares_positive CHECK (float_shares >= 0);
ALTER TABLE financial_factors ADD CONSTRAINT check_free_shares_positive CHECK (free_shares >= 0);
ALTER TABLE financial_factors ADD CONSTRAINT check_open_price_positive CHECK (open_price > 0);
ALTER TABLE financial_factors ADD CONSTRAINT check_high_price_positive CHECK (high_price > 0);
ALTER TABLE financial_factors ADD CONSTRAINT check_low_price_positive CHECK (low_price > 0);
ALTER TABLE financial_factors ADD CONSTRAINT check_close_price_positive CHECK (close_price > 0);
ALTER TABLE financial_factors ADD CONSTRAINT check_pre_close_positive CHECK (pre_close > 0);
ALTER TABLE financial_factors ADD CONSTRAINT check_volume_positive CHECK (volume >= 0);
ALTER TABLE financial_factors ADD CONSTRAINT check_amount_positive CHECK (amount >= 0);

ALTER TABLE super_financial_factors ADD CONSTRAINT check_value_score_range CHECK (value_score >= 0 AND value_score <= 100);
ALTER TABLE super_financial_factors ADD CONSTRAINT check_growth_score_range CHECK (growth_score >= 0 AND growth_score <= 100);
ALTER TABLE super_financial_factors ADD CONSTRAINT check_profitability_score_range CHECK (profitability_score >= 0 AND profitability_score <= 100);
ALTER TABLE super_financial_factors ADD CONSTRAINT check_financial_health_score_range CHECK (financial_health_score >= 0 AND financial_health_score <= 100);
ALTER TABLE super_financial_factors ADD CONSTRAINT check_overall_score_range CHECK (overall_score >= 0 AND overall_score <= 100);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为两个表创建更新时间触发器
CREATE TRIGGER update_financial_factors_updated_at 
    BEFORE UPDATE ON financial_factors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_super_financial_factors_updated_at 
    BEFORE UPDATE ON super_financial_factors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入迁移记录
INSERT INTO schema_migrations (version, applied_at) 
VALUES ('001_create_financial_factor_tables', CURRENT_TIMESTAMP)
ON CONFLICT (version) DO NOTHING;

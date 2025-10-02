-- 测试数据库初始化脚本
-- 遵循测试宪法第10条环境一致性铁律

-- 创建测试数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS test_quant_navigator;

-- 使用测试数据库
\c test_quant_navigator;

-- 创建测试表
CREATE TABLE IF NOT EXISTS test_arbitration_cases (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    target_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_reports (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    report_type VARCHAR(50) NOT NULL DEFAULT 'analysis',
    target_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_quant_signals (
    signal_id VARCHAR(50) PRIMARY KEY,
    target_code VARCHAR(20) NOT NULL,
    signal_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    confidence DECIMAL(5,2),
    direction VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_arbitration_cases_status ON test_arbitration_cases(status);
CREATE INDEX IF NOT EXISTS idx_arbitration_cases_target_code ON test_arbitration_cases(target_code);
CREATE INDEX IF NOT EXISTS idx_reports_type ON test_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_target_code ON test_reports(target_code);
CREATE INDEX IF NOT EXISTS idx_quant_signals_target_code ON test_quant_signals(target_code);
CREATE INDEX IF NOT EXISTS idx_quant_signals_status ON test_quant_signals(status);

-- 插入测试数据
INSERT INTO test_arbitration_cases (id, title, status, priority, target_code) VALUES
('case_001', '测试案件1', 'pending', 'high', '000001.SZ'),
('case_002', '测试案件2', 'processing', 'medium', '000002.SZ'),
('case_003', '测试案件3', 'completed', 'low', '000003.SZ')
ON CONFLICT (id) DO NOTHING;

INSERT INTO test_reports (id, title, content, report_type, target_code) VALUES
('report_001', '测试报告1', '这是测试报告1的内容', 'analysis', '000001.SZ'),
('report_002', '测试报告2', '这是测试报告2的内容', 'summary', '000002.SZ'),
('report_003', '测试报告3', '这是测试报告3的内容', 'analysis', '000003.SZ')
ON CONFLICT (id) DO NOTHING;

INSERT INTO test_quant_signals (signal_id, target_code, signal_type, status, confidence, direction) VALUES
('signal_001', '000001.SZ', 'INDIVIDUAL', 'ACTIVE', 0.85, 'BUY'),
('signal_002', '000002.SZ', 'INDIVIDUAL', 'ACTIVE', 0.72, 'SELL'),
('signal_003', '000003.SZ', 'INDIVIDUAL', 'INACTIVE', 0.65, 'HOLD')
ON CONFLICT (signal_id) DO NOTHING;

-- 创建清理函数
CREATE OR REPLACE FUNCTION cleanup_test_data()
RETURNS void AS $$
BEGIN
    DELETE FROM test_arbitration_cases WHERE id LIKE 'test_%';
    DELETE FROM test_reports WHERE id LIKE 'test_%';
    DELETE FROM test_quant_signals WHERE signal_id LIKE 'test_%';
END;
$$ LANGUAGE plpgsql;

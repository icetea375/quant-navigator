-- 示例数据种子脚本
-- 创建用于演示和测试的示例案例数据

-- 插入示例股票基础信息
INSERT INTO stocks (stock_code, stock_name, industry_code, market_cap, created_at, updated_at) VALUES
('000001.SZ', '平安银行', '801780', 250000000000, NOW(), NOW()),
('000002.SZ', '万科A', '801180', 180000000000, NOW(), NOW()),
('600519.SH', '贵州茅台', '801120', 2000000000000, NOW(), NOW()),
('000858.SZ', '五粮液', '801120', 800000000000, NOW(), NOW()),
('002415.SZ', '海康威视', '801080', 300000000000, NOW(), NOW())
ON CONFLICT (stock_code) DO NOTHING;

-- 插入示例处理事件
INSERT INTO processed_events (id, stock_code, event_type, title, content, source, published_at, importance_score, sentiment_score, created_at) VALUES
(1, '000001.SZ', 'announcement', '平安银行2024年第三季度业绩预告', '平安银行预计2024年第三季度归属于上市公司股东的净利润同比增长15%-20%，主要受益于资产质量改善和净息差稳定。', 'tushare', '2024-10-15 09:00:00', 8.5, 0.7, NOW()),
(2, '000002.SZ', 'announcement', '万科A重大资产重组预案', '万科A拟通过发行股份方式收购某地产公司100%股权，交易金额预计不超过50亿元。', 'tushare', '2024-10-16 10:30:00', 9.2, 0.6, NOW()),
(3, '600519.SH', 'news', '贵州茅台产品提价消息', '据市场消息，贵州茅台计划对部分产品进行价格调整，预计平均涨幅5-8%。', 'financial_news', '2024-10-17 14:20:00', 9.0, 0.8, NOW()),
(4, '000858.SZ', 'announcement', '五粮液股份回购计划', '五粮液拟使用自有资金回购公司股份，回购金额不超过10亿元，回购价格不超过200元/股。', 'tushare', '2024-10-18 11:15:00', 7.8, 0.9, NOW()),
(5, '002415.SZ', 'announcement', '海康威视收到监管问询函', '海康威视收到深交所关注函，要求说明近期股价异动原因及是否存在应披露而未披露的重大信息。', 'tushare', '2024-10-19 16:45:00', 8.0, -0.3, NOW())
ON CONFLICT (id) DO NOTHING;

-- 插入示例生成报告
INSERT INTO generated_reports (id, stock_code, report_date, report_type, conclusion, confidence, reasoning, ai_disagreement_score, risk_level, created_at) VALUES
(1, '000001.SZ', '2024-10-15', 'earnings_analysis', '平安银行三季度业绩超预期，资产质量持续改善，建议增持。', 0.85, '基于业绩预告数据，结合行业趋势分析，平安银行基本面持续向好。', 0.2, 'LOW', NOW()),
(2, '000002.SZ', '2024-10-16', 'reorganization_analysis', '万科A重大资产重组存在不确定性，建议谨慎观望。', 0.65, '重组方案尚需监管部门审批，存在一定不确定性。', 0.6, 'MEDIUM', NOW()),
(3, '600519.SH', '2024-10-17', 'price_analysis', '贵州茅台提价预期强烈，短期有望获得超额收益。', 0.90, '提价消息对白酒行业形成利好，茅台作为龙头受益明显。', 0.1, 'LOW', NOW()),
(4, '000858.SZ', '2024-10-18', 'buyback_analysis', '五粮液回购计划体现管理层信心，但需关注执行情况。', 0.75, '回购计划规模适中，但需要关注实际执行进度。', 0.3, 'LOW', NOW()),
(5, '002415.SZ', '2024-10-19', 'regulatory_analysis', '海康威视监管问询影响有限，长期投资价值不变。', 0.70, '监管问询属于常规程序，不影响公司长期基本面。', 0.4, 'MEDIUM', NOW())
ON CONFLICT (id) DO NOTHING;

-- 插入示例人工反馈循环
INSERT INTO human_feedback_loop (id, stock_code, report_id, feedback_type, feedback_score, feedback_comment, arbitrator_id, created_at) VALUES
(1, '000001.SZ', 1, 'AGREE', 0.9, '同意AI分析结论，平安银行基本面确实持续改善，建议增持。', 1, NOW()),
(2, '000002.SZ', 2, 'DISAGREE', 0.3, 'AI过于谨慎，万科A重组方案通过概率较高，建议适度乐观。', 1, NOW()),
(3, '600519.SH', 3, 'AGREE', 0.95, '完全同意AI判断，茅台提价对股价有显著正面影响。', 1, NOW()),
(4, '000858.SZ', 4, 'PARTIAL_AGREE', 0.7, '基本同意AI分析，但需要更关注回购执行的具体时间表。', 2, NOW()),
(5, '002415.SZ', 5, 'DISAGREE', 0.4, 'AI低估了监管问询的负面影响，建议降低评级。', 2, NOW())
ON CONFLICT (id) DO NOTHING;

-- 插入示例量化信号
INSERT INTO quant_signals (id, stock_code, signal_date, signal_type, return_z_score, volume_z_score, momentum_score, volatility_score, created_at) VALUES
(1, '000001.SZ', '2024-10-15', 'stock', 2.3, 1.8, 0.75, 0.45, NOW()),
(2, '000002.SZ', '2024-10-16', 'stock', -1.2, 2.1, -0.3, 0.65, NOW()),
(3, '600519.SH', '2024-10-17', 'stock', 3.1, 2.5, 0.85, 0.35, NOW()),
(4, '000858.SZ', '2024-10-18', 'stock', 1.8, 1.5, 0.6, 0.4, NOW()),
(5, '002415.SZ', '2024-10-19', 'stock', -2.1, 1.9, -0.5, 0.7, NOW())
ON CONFLICT (id) DO NOTHING;

-- 插入示例财务数据
INSERT INTO financial_reports (id, stock_code, report_date, quarter, revenue, revenue_growth, net_profit, net_profit_growth, gross_margin, net_margin, operating_cash_flow, r_d_ratio, created_at) VALUES
(1, '000001.SZ', '2024-09-30', '2024Q3', 15000000000, 0.12, 3000000000, 0.18, 0.35, 0.20, 5000000000, 0.02, NOW()),
(2, '000002.SZ', '2024-09-30', '2024Q3', 8000000000, 0.08, 1200000000, 0.05, 0.25, 0.15, 2000000000, 0.01, NOW()),
(3, '600519.SH', '2024-09-30', '2024Q3', 12000000000, 0.15, 6000000000, 0.20, 0.90, 0.50, 8000000000, 0.005, NOW()),
(4, '000858.SZ', '2024-09-30', '2024Q3', 6000000000, 0.10, 1800000000, 0.12, 0.80, 0.30, 3000000000, 0.01, NOW()),
(5, '002415.SZ', '2024-09-30', '2024Q3', 20000000000, 0.05, 4000000000, 0.08, 0.45, 0.20, 6000000000, 0.08, NOW())
ON CONFLICT (id) DO NOTHING;

-- 测试仲裁案件数据
-- 生成时间: 2025-09-25T18:08:03.696734


INSERT INTO arbitration_cases (
    case_id, report_date, stock_code, qwen_report_id, doubao_report_id,
    divergence_score, consensus_summary, conflict_summary, priority_score,
    status, analysis_metadata, human_decision, created_at, updated_at
) VALUES (
    'ARB_000001_20250918',
    '2025-09-18',
    '000001',
    '0c52c87c-dccb-49fb-ada9-f1f2fe3d43a1',
    '27243eea-c249-417a-835e-d88d52ca5975',
    0.8702,
    '两只AI在股票000001的分析中，都认为该股票具有稳定的财务状况，但在市场情绪方面存在不同看法。',
    '主要分歧点在于估值方法。Qwen更关注行业趋势, 而豆包更重视市场情绪。',
    0.7071,
    'IGNORED',
    '{"sentiment_diff": 0.3579, "keyword_overlap": 0.3622, "entity_diff": 0.2535, "company_importance": 0.6371, "event_importance": 0.2362, "analysis_timestamp": "2025-09-25T18:08:03.695025"}',
    NULL,
    '2025-09-25T18:08:03.695030',
    '2025-09-25T18:08:03.695032'
);

INSERT INTO arbitration_cases (
    case_id, report_date, stock_code, qwen_report_id, doubao_report_id,
    divergence_score, consensus_summary, conflict_summary, priority_score,
    status, analysis_metadata, human_decision, created_at, updated_at
) VALUES (
    'ARB_000002_20250919',
    '2025-09-19',
    '000002',
    'e8b814a2-bcbe-494c-ac2b-f57e04362c39',
    'f64223c5-135a-4cbe-86df-a6d67a2f1128',
    0.4826,
    '两只AI在股票000002的分析中，都认为该股票具有稳定的财务状况，但在估值水平方面存在不同看法。',
    '主要分歧点在于投资时机。Qwen更关注财务指标, 而豆包更重视实时事件。',
    0.4934,
    'PENDING_HUMAN',
    '{"sentiment_diff": 0.3343, "keyword_overlap": 0.6469, "entity_diff": 0.3107, "company_importance": 0.6165, "event_importance": 0.3999, "analysis_timestamp": "2025-09-25T18:08:03.695069"}',
    NULL,
    '2025-09-25T18:08:03.695072',
    '2025-09-25T18:08:03.695073'
);

INSERT INTO arbitration_cases (
    case_id, report_date, stock_code, qwen_report_id, doubao_report_id,
    divergence_score, consensus_summary, conflict_summary, priority_score,
    status, analysis_metadata, human_decision, created_at, updated_at
) VALUES (
    'ARB_000858_20250920',
    '2025-09-20',
    '000858',
    'c7f526fd-cb0a-4b6e-ac9f-e2f813a45b25',
    '64a645e1-f757-49b8-aae4-6dd1ace3c744',
    0.8848,
    '两只AI在股票000858的分析中，都认为该股票具有稳定的财务状况，但在市场情绪方面存在不同看法。',
    '主要分歧点在于风险评估。Qwen更关注财务指标, 而豆包更重视实时事件。',
    0.526,
    'IGNORED',
    '{"sentiment_diff": 0.3245, "keyword_overlap": 0.6669, "entity_diff": 0.2329, "company_importance": 0.5021, "event_importance": 0.6452, "analysis_timestamp": "2025-09-25T18:08:03.695100"}',
    NULL,
    '2025-09-25T18:08:03.695102',
    '2025-09-25T18:08:03.695104'
);

INSERT INTO arbitration_cases (
    case_id, report_date, stock_code, qwen_report_id, doubao_report_id,
    divergence_score, consensus_summary, conflict_summary, priority_score,
    status, analysis_metadata, human_decision, created_at, updated_at
) VALUES (
    'ARB_002415_20250921',
    '2025-09-21',
    '002415',
    '1b193c6a-c65d-4810-986a-ca07575c8d54',
    '25236212-221c-4d69-b97f-43e92ed39b82',
    0.4474,
    '两只AI在股票002415的分析中，都认为该股票具有稳定的财务状况，但在估值水平方面存在不同看法。',
    '主要分歧点在于估值方法。Qwen更关注行业趋势, 而豆包更重视市场情绪。',
    0.5408,
    'IGNORED',
    '{"sentiment_diff": 0.7935, "keyword_overlap": 0.5013, "entity_diff": 0.3945, "company_importance": 0.4778, "event_importance": 0.2631, "analysis_timestamp": "2025-09-25T18:08:03.695128"}',
    NULL,
    '2025-09-25T18:08:03.695130',
    '2025-09-25T18:08:03.695131'
);

INSERT INTO arbitration_cases (
    case_id, report_date, stock_code, qwen_report_id, doubao_report_id,
    divergence_score, consensus_summary, conflict_summary, priority_score,
    status, analysis_metadata, human_decision, created_at, updated_at
) VALUES (
    'ARB_300059_20250922',
    '2025-09-22',
    '300059',
    '3b482848-4aed-40ab-b1ef-b598eb25d7ba',
    'd49ef9f3-60bb-4a00-8bc2-a6eafcbee83f',
    0.5314,
    '两只AI在股票300059的分析中，都认为该股票具有稳定的财务状况，但在市场情绪方面存在不同看法。',
    '主要分歧点在于风险评估。Qwen更关注基本面数据, 而豆包更重视市场情绪。',
    0.5045,
    'PENDING_HUMAN',
    '{"sentiment_diff": 0.2552, "keyword_overlap": 0.4776, "entity_diff": 0.5008, "company_importance": 0.7149, "event_importance": 0.7918, "analysis_timestamp": "2025-09-25T18:08:03.695168"}',
    NULL,
    '2025-09-25T18:08:03.695170',
    '2025-09-25T18:08:03.695172'
);

INSERT INTO arbitration_cases (
    case_id, report_date, stock_code, qwen_report_id, doubao_report_id,
    divergence_score, consensus_summary, conflict_summary, priority_score,
    status, analysis_metadata, human_decision, created_at, updated_at
) VALUES (
    'ARB_600036_20250923',
    '2025-09-23',
    '600036',
    '7c70c60b-faf0-41f8-8510-02d2961f7dbf',
    'a7863368-1d1c-41cd-91a3-9fc7158d71e6',
    0.3951,
    '两只AI在股票600036的分析中，都认为该股票具有稳定的财务状况，但在短期波动性方面存在不同看法。',
    '主要分歧点在于投资时机。Qwen更关注基本面数据, 而豆包更重视市场情绪。',
    0.4537,
    'PENDING_HUMAN',
    '{"sentiment_diff": 0.5091, "keyword_overlap": 0.476, "entity_diff": 0.3872, "company_importance": 0.3966, "event_importance": 0.6869, "analysis_timestamp": "2025-09-25T18:08:03.695196"}',
    NULL,
    '2025-09-25T18:08:03.695198',
    '2025-09-25T18:08:03.695199'
);

INSERT INTO arbitration_cases (
    case_id, report_date, stock_code, qwen_report_id, doubao_report_id,
    divergence_score, consensus_summary, conflict_summary, priority_score,
    status, analysis_metadata, human_decision, created_at, updated_at
) VALUES (
    'ARB_600519_20250924',
    '2025-09-24',
    '600519',
    '95500a64-b6dd-4bf5-bb25-ec67c55678fb',
    '25d31c3e-cf4d-4eee-b75b-5d3e156c3a2d',
    0.6833,
    '两只AI在股票600519的分析中，都认为该股票具有良好的基本面，但在短期波动性方面存在不同看法。',
    '主要分歧点在于投资时机。Qwen更关注基本面数据, 而豆包更重视市场情绪。',
    0.8739,
    'PENDING_HUMAN',
    '{"sentiment_diff": 0.4791, "keyword_overlap": 0.3344, "entity_diff": 0.5315, "company_importance": 0.6876, "event_importance": 0.7619, "analysis_timestamp": "2025-09-25T18:08:03.695222"}',
    NULL,
    '2025-09-25T18:08:03.695224',
    '2025-09-25T18:08:03.695225'
);

INSERT INTO arbitration_cases (
    case_id, report_date, stock_code, qwen_report_id, doubao_report_id,
    divergence_score, consensus_summary, conflict_summary, priority_score,
    status, analysis_metadata, human_decision, created_at, updated_at
) VALUES (
    'ARB_000858_20250918',
    '2025-09-18',
    '000858',
    'ba2d6b58-b30a-4bba-a9c6-3e75dc3791ef',
    '461712a3-52a0-4dd2-95f7-a37e4250808c',
    0.6832,
    '两只AI在股票000858的分析中，都认为该股票具有良好的基本面，但在估值水平方面存在不同看法。',
    '主要分歧点在于估值方法。Qwen更关注基本面数据, 而豆包更重视市场情绪。',
    0.7798,
    'PENDING_HUMAN',
    '{"sentiment_diff": 0.3213, "keyword_overlap": 0.4271, "entity_diff": 0.4465, "company_importance": 0.6125, "event_importance": 0.3829, "analysis_timestamp": "2025-09-25T18:08:03.695256"}',
    NULL,
    '2025-09-25T18:08:03.695258',
    '2025-09-25T18:08:03.695259'
);

INSERT INTO arbitration_cases (
    case_id, report_date, stock_code, qwen_report_id, doubao_report_id,
    divergence_score, consensus_summary, conflict_summary, priority_score,
    status, analysis_metadata, human_decision, created_at, updated_at
) VALUES (
    'ARB_000001_20250919',
    '2025-09-19',
    '000001',
    '6e7d179f-8531-4a6d-ab02-84cfe691b0a0',
    '93542b3e-69fb-4612-962e-a1fc37b3036e',
    0.8598,
    '两只AI在股票000001的分析中，都认为该股票具有良好的基本面，但在市场情绪方面存在不同看法。',
    '主要分歧点在于估值方法。Qwen更关注基本面数据, 而豆包更重视市场情绪。',
    0.8828,
    'PENDING_HUMAN',
    '{"sentiment_diff": 0.2555, "keyword_overlap": 0.4321, "entity_diff": 0.593, "company_importance": 0.7564, "event_importance": 0.6039, "analysis_timestamp": "2025-09-25T18:08:03.695283"}',
    NULL,
    '2025-09-25T18:08:03.695285',
    '2025-09-25T18:08:03.695286'
);

INSERT INTO arbitration_cases (
    case_id, report_date, stock_code, qwen_report_id, doubao_report_id,
    divergence_score, consensus_summary, conflict_summary, priority_score,
    status, analysis_metadata, human_decision, created_at, updated_at
) VALUES (
    'ARB_000002_20250920',
    '2025-09-20',
    '000002',
    '010f2d0f-6099-453d-8837-02023bdb0c86',
    '58ed133e-a8a6-4b03-81b6-c68b067cd91f',
    0.8001,
    '两只AI在股票000002的分析中，都认为该股票具有稳定的财务状况，但在短期波动性方面存在不同看法。',
    '主要分歧点在于估值方法。Qwen更关注行业趋势, 而豆包更重视投资者行为。',
    0.7473,
    'ARBITRATED',
    '{"sentiment_diff": 0.249, "keyword_overlap": 0.5389, "entity_diff": 0.2121, "company_importance": 0.5198, "event_importance": 0.2945, "analysis_timestamp": "2025-09-25T18:08:03.695310"}',
    '{"finalRecommendation": "HOLD", "confidenceLevel": 72, "reasoning": "\u57fa\u4e8e\u53cc\u8111\u5206\u6790\u7684\u7efc\u5408\u5224\u65ad\uff0c\u8003\u8651\u5230\u5e02\u573a\u60c5\u7eea\u79ef\u6781\u7b49\u56e0\u7d20\uff0c\u505a\u51fa\u6b64\u51b3\u7b56\u3002", "keyDisagreements": "\u4e3b\u8981\u5206\u6b67\u5728\u4e8e\u4f30\u503c\u65b9\u6cd5\uff0c\u6700\u7ec8\u9009\u62e9\u5e73\u8861\u7684\u7b56\u7565\u3002", "arbitratorId": "arbitrator_5"}',
    '2025-09-25T18:08:03.695311',
    '2025-09-25T18:08:03.695313'
);

INSERT INTO arbitration_cases (
    case_id, report_date, stock_code, qwen_report_id, doubao_report_id,
    divergence_score, consensus_summary, conflict_summary, priority_score,
    status, analysis_metadata, human_decision, created_at, updated_at
) VALUES (
    'ARB_000858_20250921',
    '2025-09-21',
    '000858',
    '8eabd230-b992-4ee2-b3df-98e7faa8f541',
    'dd91fbd4-33d4-4d5c-aa47-77f5e49ba5af',
    0.7916,
    '两只AI在股票000858的分析中，都认为该股票具有良好的基本面，但在市场情绪方面存在不同看法。',
    '主要分歧点在于估值方法。Qwen更关注财务指标, 而豆包更重视市场情绪。',
    0.6589,
    'PENDING_HUMAN',
    '{"sentiment_diff": 0.2414, "keyword_overlap": 0.524, "entity_diff": 0.1868, "company_importance": 0.6013, "event_importance": 0.6323, "analysis_timestamp": "2025-09-25T18:08:03.695346"}',
    NULL,
    '2025-09-25T18:08:03.695348',
    '2025-09-25T18:08:03.695349'
);

INSERT INTO arbitration_cases (
    case_id, report_date, stock_code, qwen_report_id, doubao_report_id,
    divergence_score, consensus_summary, conflict_summary, priority_score,
    status, analysis_metadata, human_decision, created_at, updated_at
) VALUES (
    'ARB_002415_20250922',
    '2025-09-22',
    '002415',
    '451371b0-4e82-4937-a91b-951b3fc0806d',
    'bc722541-17a3-458b-81fd-f02a4bac88aa',
    0.6209,
    '两只AI在股票002415的分析中，都认为该股票具有强劲的增长潜力，但在短期波动性方面存在不同看法。',
    '主要分歧点在于估值方法。Qwen更关注财务指标, 而豆包更重视投资者行为。',
    0.8781,
    'PENDING_HUMAN',
    '{"sentiment_diff": 0.2057, "keyword_overlap": 0.4261, "entity_diff": 0.2319, "company_importance": 0.4293, "event_importance": 0.5757, "analysis_timestamp": "2025-09-25T18:08:03.695373"}',
    NULL,
    '2025-09-25T18:08:03.695375',
    '2025-09-25T18:08:03.695376'
);

INSERT INTO arbitration_cases (
    case_id, report_date, stock_code, qwen_report_id, doubao_report_id,
    divergence_score, consensus_summary, conflict_summary, priority_score,
    status, analysis_metadata, human_decision, created_at, updated_at
) VALUES (
    'ARB_300059_20250923',
    '2025-09-23',
    '300059',
    'ceac9927-8e1d-4b31-996d-76a5cfcc790e',
    '8af3f495-9118-41ad-81cb-e1cc52a57f78',
    0.4863,
    '两只AI在股票300059的分析中，都认为该股票具有良好的基本面，但在估值水平方面存在不同看法。',
    '主要分歧点在于估值方法。Qwen更关注基本面数据, 而豆包更重视市场情绪。',
    0.6637,
    'IGNORED',
    '{"sentiment_diff": 0.5463, "keyword_overlap": 0.574, "entity_diff": 0.2833, "company_importance": 0.3901, "event_importance": 0.4856, "analysis_timestamp": "2025-09-25T18:08:03.695442"}',
    NULL,
    '2025-09-25T18:08:03.695448',
    '2025-09-25T18:08:03.695449'
);

INSERT INTO arbitration_cases (
    case_id, report_date, stock_code, qwen_report_id, doubao_report_id,
    divergence_score, consensus_summary, conflict_summary, priority_score,
    status, analysis_metadata, human_decision, created_at, updated_at
) VALUES (
    'ARB_600036_20250924',
    '2025-09-24',
    '600036',
    'f1b25f73-7fe1-4a23-af17-7cb70b4f01a2',
    '69e544a0-5e80-4fa1-a175-11e01697920f',
    0.4428,
    '两只AI在股票600036的分析中，都认为该股票具有良好的基本面，但在估值水平方面存在不同看法。',
    '主要分歧点在于投资时机。Qwen更关注财务指标, 而豆包更重视实时事件。',
    0.4272,
    'PENDING_HUMAN',
    '{"sentiment_diff": 0.5791, "keyword_overlap": 0.532, "entity_diff": 0.2084, "company_importance": 0.6114, "event_importance": 0.7373, "analysis_timestamp": "2025-09-25T18:08:03.695485"}',
    NULL,
    '2025-09-25T18:08:03.695487',
    '2025-09-25T18:08:03.695488'
);

INSERT INTO arbitration_cases (
    case_id, report_date, stock_code, qwen_report_id, doubao_report_id,
    divergence_score, consensus_summary, conflict_summary, priority_score,
    status, analysis_metadata, human_decision, created_at, updated_at
) VALUES (
    'ARB_600519_20250918',
    '2025-09-18',
    '600519',
    '5681ee76-6c1a-4d97-9d14-8ba2bf11a082',
    '385d113d-4a85-427b-bd93-dff29c0b32c2',
    0.5564,
    '两只AI在股票600519的分析中，都认为该股票具有强劲的增长潜力，但在短期波动性方面存在不同看法。',
    '主要分歧点在于风险评估。Qwen更关注行业趋势, 而豆包更重视市场情绪。',
    0.7642,
    'ARBITRATED',
    '{"sentiment_diff": 0.5064, "keyword_overlap": 0.3666, "entity_diff": 0.358, "company_importance": 0.8636, "event_importance": 0.7541, "analysis_timestamp": "2025-09-25T18:08:03.695507"}',
    '{"finalRecommendation": "HOLD", "confidenceLevel": 73, "reasoning": "\u57fa\u4e8e\u53cc\u8111\u5206\u6790\u7684\u7efc\u5408\u5224\u65ad\uff0c\u8003\u8651\u5230\u57fa\u672c\u9762\u7a33\u5065\u7b49\u56e0\u7d20\uff0c\u505a\u51fa\u6b64\u51b3\u7b56\u3002", "keyDisagreements": "\u4e3b\u8981\u5206\u6b67\u5728\u4e8e\u4f30\u503c\u65b9\u6cd5\uff0c\u6700\u7ec8\u9009\u62e9\u5e73\u8861\u7684\u7b56\u7565\u3002", "arbitratorId": "arbitrator_1"}',
    '2025-09-25T18:08:03.695508',
    '2025-09-25T18:08:03.695509'
);

INSERT INTO arbitration_cases (
    case_id, report_date, stock_code, qwen_report_id, doubao_report_id,
    divergence_score, consensus_summary, conflict_summary, priority_score,
    status, analysis_metadata, human_decision, created_at, updated_at
) VALUES (
    'ARB_000858_20250919',
    '2025-09-19',
    '000858',
    '4d2aff9c-a5d6-440e-aa08-dc693317fb56',
    'aac5c061-d1e0-457a-aa2b-03400521faca',
    0.7333,
    '两只AI在股票000858的分析中，都认为该股票具有强劲的增长潜力，但在短期波动性方面存在不同看法。',
    '主要分歧点在于投资时机。Qwen更关注基本面数据, 而豆包更重视市场情绪。',
    0.4375,
    'PENDING_HUMAN',
    '{"sentiment_diff": 0.4349, "keyword_overlap": 0.3767, "entity_diff": 0.4595, "company_importance": 0.4318, "event_importance": 0.2262, "analysis_timestamp": "2025-09-25T18:08:03.695532"}',
    NULL,
    '2025-09-25T18:08:03.695533',
    '2025-09-25T18:08:03.695534'
);

INSERT INTO arbitration_cases (
    case_id, report_date, stock_code, qwen_report_id, doubao_report_id,
    divergence_score, consensus_summary, conflict_summary, priority_score,
    status, analysis_metadata, human_decision, created_at, updated_at
) VALUES (
    'ARB_000001_20250920',
    '2025-09-20',
    '000001',
    '74e07f06-50d0-4690-a246-db35b0da1091',
    'caa41408-9003-47a5-8193-012fd55d896e',
    0.3446,
    '两只AI在股票000001的分析中，都认为该股票具有稳定的财务状况，但在市场情绪方面存在不同看法。',
    '主要分歧点在于风险评估。Qwen更关注财务指标, 而豆包更重视市场情绪。',
    0.7587,
    'ARBITRATED',
    '{"sentiment_diff": 0.4276, "keyword_overlap": 0.1199, "entity_diff": 0.2439, "company_importance": 0.4021, "event_importance": 0.2666, "analysis_timestamp": "2025-09-25T18:08:03.695550"}',
    '{"finalRecommendation": "BUY", "confidenceLevel": 80, "reasoning": "\u57fa\u4e8e\u53cc\u8111\u5206\u6790\u7684\u7efc\u5408\u5224\u65ad\uff0c\u8003\u8651\u5230\u57fa\u672c\u9762\u7a33\u5065\u7b49\u56e0\u7d20\uff0c\u505a\u51fa\u6b64\u51b3\u7b56\u3002", "keyDisagreements": "\u4e3b\u8981\u5206\u6b67\u5728\u4e8e\u4f30\u503c\u65b9\u6cd5\uff0c\u6700\u7ec8\u9009\u62e9\u66f4\u6fc0\u8fdb\u7684\u7b56\u7565\u3002", "arbitratorId": "arbitrator_5"}',
    '2025-09-25T18:08:03.695551',
    '2025-09-25T18:08:03.695552'
);

INSERT INTO arbitration_cases (
    case_id, report_date, stock_code, qwen_report_id, doubao_report_id,
    divergence_score, consensus_summary, conflict_summary, priority_score,
    status, analysis_metadata, human_decision, created_at, updated_at
) VALUES (
    'ARB_000002_20250921',
    '2025-09-21',
    '000002',
    'aab82296-bd44-4e6d-a555-7e5d68c39ff6',
    'f6f65f7c-0549-4dad-a270-3e449a4e6f45',
    0.3461,
    '两只AI在股票000002的分析中，都认为该股票具有强劲的增长潜力，但在短期波动性方面存在不同看法。',
    '主要分歧点在于风险评估。Qwen更关注财务指标, 而豆包更重视实时事件。',
    0.4682,
    'PENDING_HUMAN',
    '{"sentiment_diff": 0.3831, "keyword_overlap": 0.6468, "entity_diff": 0.5782, "company_importance": 0.4951, "event_importance": 0.5203, "analysis_timestamp": "2025-09-25T18:08:03.695571"}',
    NULL,
    '2025-09-25T18:08:03.695573',
    '2025-09-25T18:08:03.695573'
);

INSERT INTO arbitration_cases (
    case_id, report_date, stock_code, qwen_report_id, doubao_report_id,
    divergence_score, consensus_summary, conflict_summary, priority_score,
    status, analysis_metadata, human_decision, created_at, updated_at
) VALUES (
    'ARB_000858_20250922',
    '2025-09-22',
    '000858',
    '39d898ab-e21a-43dc-a432-07752dcbd29a',
    '0e39ec49-8586-4648-b124-c597fe874cb6',
    0.8443,
    '两只AI在股票000858的分析中，都认为该股票具有稳定的财务状况，但在市场情绪方面存在不同看法。',
    '主要分歧点在于风险评估。Qwen更关注行业趋势, 而豆包更重视实时事件。',
    0.5967,
    'IGNORED',
    '{"sentiment_diff": 0.3326, "keyword_overlap": 0.203, "entity_diff": 0.1749, "company_importance": 0.4602, "event_importance": 0.6216, "analysis_timestamp": "2025-09-25T18:08:03.695589"}',
    NULL,
    '2025-09-25T18:08:03.695592',
    '2025-09-25T18:08:03.695593'
);

INSERT INTO arbitration_cases (
    case_id, report_date, stock_code, qwen_report_id, doubao_report_id,
    divergence_score, consensus_summary, conflict_summary, priority_score,
    status, analysis_metadata, human_decision, created_at, updated_at
) VALUES (
    'ARB_002415_20250923',
    '2025-09-23',
    '002415',
    '4f83b795-03b2-4dcd-b2fa-f376aca68e22',
    '791ab2bc-6714-41e3-98dc-0cb007e9ecbb',
    0.8871,
    '两只AI在股票002415的分析中，都认为该股票具有稳定的财务状况，但在估值水平方面存在不同看法。',
    '主要分歧点在于估值方法。Qwen更关注基本面数据, 而豆包更重视投资者行为。',
    0.4145,
    'ARBITRATED',
    '{"sentiment_diff": 0.7312, "keyword_overlap": 0.44, "entity_diff": 0.2739, "company_importance": 0.3666, "event_importance": 0.7441, "analysis_timestamp": "2025-09-25T18:08:03.695610"}',
    '{"finalRecommendation": "HOLD", "confidenceLevel": 92, "reasoning": "\u57fa\u4e8e\u53cc\u8111\u5206\u6790\u7684\u7efc\u5408\u5224\u65ad\uff0c\u8003\u8651\u5230\u57fa\u672c\u9762\u7a33\u5065\u7b49\u56e0\u7d20\uff0c\u505a\u51fa\u6b64\u51b3\u7b56\u3002", "keyDisagreements": "\u4e3b\u8981\u5206\u6b67\u5728\u4e8e\u98ce\u9669\u504f\u597d\uff0c\u6700\u7ec8\u9009\u62e9\u5e73\u8861\u7684\u7b56\u7565\u3002", "arbitratorId": "arbitrator_4"}',
    '2025-09-25T18:08:03.695611',
    '2025-09-25T18:08:03.695612'
);

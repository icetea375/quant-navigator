#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
创建测试仲裁案件数据
用于测试v11.9架构升级的仲裁预处理功能

作者: AI Assistant
创建时间: 2025-01-17
版本: v11.9
"""

import json
import uuid
from datetime import datetime, date, timedelta
import random


def create_test_arbitration_cases():
    """创建测试仲裁案件数据"""

    # 测试案件数据
    test_cases = []

    # 生成过去7天的测试数据
    base_date = date.today() - timedelta(days=7)

    stock_codes = [
        "000001",
        "000002",
        "000858",
        "002415",
        "300059",
        "600036",
        "600519",
        "000858",
    ]

    for i in range(20):  # 创建20个测试案件
        case_date = base_date + timedelta(days=i % 7)

        case = {
            "case_id": f"ARB_{stock_codes[i % len(stock_codes)]}_{case_date.strftime('%Y%m%d')}",
            "report_date": case_date.strftime("%Y-%m-%d"),
            "stock_code": stock_codes[i % len(stock_codes)],
            "qwen_report_id": str(uuid.uuid4()),
            "doubao_report_id": str(uuid.uuid4()),
            "divergence_score": round(random.uniform(0.3, 0.9), 4),
            "consensus_summary": f"两只AI在股票{stock_codes[i % len(stock_codes)]}的分析中，都认为该股票具有{random.choice(['良好的基本面', '稳定的财务状况', '强劲的增长潜力'])}，但在{random.choice(['短期波动性', '估值水平', '市场情绪'])}方面存在不同看法。",
            "conflict_summary": f"主要分歧点在于{random.choice(['投资时机', '风险评估', '估值方法'])}。Qwen更关注{random.choice(['基本面数据', '财务指标', '行业趋势'])}, 而豆包更重视{random.choice(['市场情绪', '投资者行为', '实时事件'])}。",
            "priority_score": round(random.uniform(0.4, 0.95), 4),
            "status": random.choice(
                ["PENDING_HUMAN", "PENDING_HUMAN", "PENDING_HUMAN", "IGNORED"]
            ),  # 大部分是待处理
            "analysis_metadata": {
                "sentiment_diff": round(random.uniform(0.2, 0.8), 4),
                "keyword_overlap": round(random.uniform(0.1, 0.7), 4),
                "entity_diff": round(random.uniform(0.1, 0.6), 4),
                "company_importance": round(random.uniform(0.3, 0.9), 4),
                "event_importance": round(random.uniform(0.2, 0.8), 4),
                "analysis_timestamp": datetime.now().isoformat(),
            },
            "human_decision": None,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }

        # 如果是已仲裁的案件，添加人类决策
        if random.random() < 0.2:  # 20%的概率是已仲裁
            case["status"] = "ARBITRATED"
            case["human_decision"] = {
                "finalRecommendation": random.choice(["BUY", "HOLD", "SELL"]),
                "confidenceLevel": random.randint(60, 95),
                "reasoning": f"基于双脑分析的综合判断，考虑到{random.choice(['基本面稳健', '市场情绪积极', '技术面突破'])}等因素，做出此决策。",
                "keyDisagreements": f"主要分歧在于{random.choice(['估值方法', '风险偏好', '时间框架'])}，最终选择{random.choice(['更保守', '更激进', '平衡'])}的策略。",
                "arbitratorId": f"arbitrator_{random.randint(1, 5)}",
            }

        test_cases.append(case)

    return test_cases


def create_sql_insert_statements(cases):
    """生成SQL插入语句"""

    sql_statements = []

    for case in cases:
        sql = f"""
INSERT INTO arbitration_cases (
    case_id, report_date, stock_code, qwen_report_id, doubao_report_id,
    divergence_score, consensus_summary, conflict_summary, priority_score,
    status, analysis_metadata, human_decision, created_at, updated_at
) VALUES (
    '{case['case_id']}',
    '{case['report_date']}',
    '{case['stock_code']}',
    '{case['qwen_report_id']}',
    '{case['doubao_report_id']}',
    {case['divergence_score']},
    '{case['consensus_summary']}',
    '{case['conflict_summary']}',
    {case['priority_score']},
    '{case['status']}',
    '{json.dumps(case['analysis_metadata'])}',
    {f"'{json.dumps(case['human_decision'])}'" if case['human_decision'] else 'NULL'},
    '{case['created_at']}',
    '{case['updated_at']}'
);"""
        sql_statements.append(sql)

    return sql_statements


def main():
    """主函数"""
    print("创建测试仲裁案件数据...")

    # 生成测试数据
    test_cases = create_test_arbitration_cases()

    # 保存为JSON文件
    with open(
        "/Users/pengcheng/Documents/papa/database/test_data/arbitration_cases_test_data.json",
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(test_cases, f, ensure_ascii=False, indent=2)

    print(f"已生成 {len(test_cases)} 个测试案件")
    print("JSON数据已保存到: database/test_data/arbitration_cases_test_data.json")

    # 生成SQL插入语句
    sql_statements = create_sql_insert_statements(test_cases)

    with open(
        "/Users/pengcheng/Documents/papa/database/test_data/arbitration_cases_test_data.sql",
        "w",
        encoding="utf-8",
    ) as f:
        f.write("-- 测试仲裁案件数据\n")
        f.write("-- 生成时间: " + datetime.now().isoformat() + "\n\n")
        for sql in sql_statements:
            f.write(sql + "\n")

    print("SQL插入语句已保存到: database/test_data/arbitration_cases_test_data.sql")

    # 显示统计信息
    status_counts = {}
    for case in test_cases:
        status = case["status"]
        status_counts[status] = status_counts.get(status, 0) + 1

    print("\n案件状态统计:")
    for status, count in status_counts.items():
        print(f"  {status}: {count} 个")

    print("\n测试数据创建完成！")


if __name__ == "__main__":
    main()

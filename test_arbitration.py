#!/usr/bin/env python3
"""
测试仲裁服务数据库连接
"""

import asyncio
import asyncpg
import sys
import os

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), "packages/backend/src"))


async def test_database_connection():
    """测试数据库连接"""
    try:
        # 连接数据库
        conn = await asyncpg.connect(
            "postgresql://postgres:password@localhost:5432/quant_navigator"
        )
        print("✅ 数据库连接成功")

        # 查询仲裁案件
        rows = await conn.fetch(
            "SELECT case_id, stock_code, status FROM arbitration_cases LIMIT 5"
        )
        print(f"📊 找到 {len(rows)} 个仲裁案件:")
        for row in rows:
            print(f"  - {row['case_id']}: {row['stock_code']} ({row['status']})")

        # 查询特定案件
        case_id = "ARB_000001_20250925"
        row = await conn.fetchrow(
            """
            SELECT
                ac.id, ac.case_id, ac.stock_code, ac.trade_date,
                ac.divergence_score, ac.priority_score, ac.consensus_summary,
                qr.analysis_text as qwen_analysis, qr.confidence_score as qwen_confidence,
                dr.analysis_text as doubao_analysis, dr.confidence_score as doubao_confidence
            FROM arbitration_cases ac
            LEFT JOIN generated_reports qr ON ac.qwen_report_id = qr.id
            LEFT JOIN generated_reports dr ON ac.doubao_report_id = dr.id
            WHERE ac.case_id = $1
        """,
            case_id,
        )

        if row:
            print(f"\n✅ 找到案件 {case_id}:")
            print(f"  股票代码: {row['stock_code']}")
            print(f"  分歧度: {row['divergence_score']}")
            print(f"  优先级: {row['priority_score']}")
            print(f"  Qwen分析: {row['qwen_analysis'][:100]}...")
            print(f"  豆包分析: {row['doubao_analysis'][:100]}...")
        else:
            print(f"❌ 未找到案件 {case_id}")

        await conn.close()
        print("🔌 数据库连接已关闭")

    except Exception as e:
        print(f"❌ 数据库连接失败: {e}")


if __name__ == "__main__":
    asyncio.run(test_database_connection())

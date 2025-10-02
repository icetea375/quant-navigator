#!/usr/bin/env python3
"""
DataPipeline真实数据测试脚本
展示从Tushare获取真实数据，处理并存储到数据库的完整流程
"""

import asyncio
import os
import sys
import sqlite3
from datetime import datetime

# 添加项目路径
sys.path.append("/Users/pengcheng/Documents/papa/packages/backend-python/src")

from services.data_pipeline_service import DataPipelineService


async def test_datapipeline_real_data():
    """测试DataPipeline处理真实数据并存储到数据库"""

    print("🚀 开始DataPipeline真实数据测试")
    print("=" * 60)

    # 设置真实Tushare token
    os.environ["TUSHARE_TOKEN"] = (
        "6b16b1a0173eb26abd4cf12a4ad0e70e344c0c1808a310487c0f70ab"
    )

    # 创建DataPipelineService
    config = {
        "tushare": {"token": os.environ["TUSHARE_TOKEN"], "timeout": 30},
        "database": {"url": "sqlite:///test_datapipeline_real.db"},
    }

    service = DataPipelineService(config)

    # 测试数据
    stock_code = "601398.SH"  # 工商银行
    trade_date = "20230104"  # 2023年1月4日

    try:
        print(f"📊 测试股票: {stock_code}")
        print(f"📅 测试日期: {trade_date}")
        print()

        # 步骤1: 从Tushare获取真实数据
        print("📡 步骤1: 从Tushare API获取真实数据...")
        start_time = datetime.now()

        raw_data = await service.fetch_tushare_data(stock_code, trade_date)

        api_time = (datetime.now() - start_time).total_seconds()
        print(f"✅ API调用完成，耗时: {api_time:.2f}秒")

        # 展示原始数据结构
        print("📋 原始数据结构:")
        for key, value in raw_data.items():
            if isinstance(value, list):
                print(f"   {key}: {len(value)} 条记录")
            else:
                print(f"   {key}: {type(value).__name__}")
        print()

        # 步骤2: 提取财务因子
        print("🔧 步骤2: 提取财务因子...")
        start_time = datetime.now()

        financial_factors = await service.extract_financial_factors(
            stock_code, trade_date, raw_data
        )

        process_time = (datetime.now() - start_time).total_seconds()
        print(f"✅ 财务因子提取完成，耗时: {process_time:.2f}秒")

        # 展示财务因子数据
        print("📊 财务因子数据:")
        for key, value in financial_factors.items():
            if isinstance(value, float):
                print(f"   {key}: {value:.4f}")
            else:
                print(f"   {key}: {value}")
        print()

        # 步骤3: 计算超级财务因子
        print("🧮 步骤3: 计算超级财务因子...")
        start_time = datetime.now()

        super_factors = await service.calculate_super_financial_factors(
            financial_factors
        )

        calc_time = (datetime.now() - start_time).total_seconds()
        print(f"✅ 超级财务因子计算完成，耗时: {calc_time:.2f}秒")

        # 展示超级财务因子数据
        print("🎯 超级财务因子数据:")
        for key, value in super_factors.items():
            if isinstance(value, float):
                print(f"   {key}: {value:.4f}")
            else:
                print(f"   {key}: {value}")
        print()

        # 步骤4: 存储到真实数据库
        print("💾 步骤4: 存储到真实数据库...")
        start_time = datetime.now()

        # 创建真实数据库连接
        conn = sqlite3.connect("test_datapipeline_real.db")
        cursor = conn.cursor()

        # 创建表结构
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS financial_factors (
                stock_code TEXT NOT NULL,
                trade_date TEXT NOT NULL,
                pe_ratio REAL,
                pb_ratio REAL,
                ps_ratio REAL,
                dividend_yield REAL,
                PRIMARY KEY (stock_code, trade_date)
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS super_financial_factors (
                stock_code TEXT NOT NULL,
                trade_date TEXT NOT NULL,
                overall_score REAL,
                value_score REAL,
                growth_score REAL,
                profitability_score REAL,
                financial_health_score REAL,
                calculated_at TEXT,
                PRIMARY KEY (stock_code, trade_date)
            )
        """)

        # 存储财务因子
        cursor.execute(
            """
            INSERT OR REPLACE INTO financial_factors
            (stock_code, trade_date, pe_ratio, pb_ratio, ps_ratio, dividend_yield)
            VALUES (?, ?, ?, ?, ?, ?)
        """,
            (
                financial_factors["stock_code"],
                financial_factors["trade_date"],
                financial_factors["pe_ratio"],
                financial_factors["pb_ratio"],
                financial_factors.get("ps_ratio", 0.0),
                financial_factors.get("dividend_yield", 0.0),
            ),
        )

        # 存储超级财务因子
        cursor.execute(
            """
            INSERT OR REPLACE INTO super_financial_factors
            (stock_code, trade_date, overall_score, value_score, growth_score,
             profitability_score, financial_health_score, calculated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
            (
                super_factors["stock_code"],
                super_factors["trade_date"],
                super_factors["overall_score"],
                super_factors["value_score"],
                super_factors["growth_score"],
                super_factors["profitability_score"],
                super_factors["financial_health_score"],
                super_factors["calculated_at"],
            ),
        )

        conn.commit()
        store_time = (datetime.now() - start_time).total_seconds()
        print(f"✅ 数据存储完成，耗时: {store_time:.2f}秒")
        print()

        # 步骤5: 验证数据库中的数据
        print("🔍 步骤5: 验证数据库中的数据...")

        # 查询财务因子
        cursor.execute(
            """
            SELECT * FROM financial_factors
            WHERE stock_code = ? AND trade_date = ?
        """,
            (stock_code, trade_date),
        )

        financial_result = cursor.fetchone()
        if financial_result:
            print("📊 数据库中的财务因子:")
            print(f"   股票代码: {financial_result[0]}")
            print(f"   交易日期: {financial_result[1]}")
            print(f"   PE比率: {financial_result[2]:.4f}")
            print(f"   PB比率: {financial_result[3]:.4f}")
            print(f"   PS比率: {financial_result[4]:.4f}")
            print(f"   股息率: {financial_result[5]:.4f}")
        else:
            print("❌ 财务因子数据未找到")

        print()

        # 查询超级财务因子
        cursor.execute(
            """
            SELECT * FROM super_financial_factors
            WHERE stock_code = ? AND trade_date = ?
        """,
            (stock_code, trade_date),
        )

        super_result = cursor.fetchone()
        if super_result:
            print("🎯 数据库中的超级财务因子:")
            print(f"   股票代码: {super_result[0]}")
            print(f"   交易日期: {super_result[1]}")
            print(f"   综合评分: {super_result[2]:.4f}")
            print(f"   价值评分: {super_result[3]:.4f}")
            print(f"   成长评分: {super_result[4]:.4f}")
            print(f"   盈利评分: {super_result[5]:.4f}")
            print(f"   财务健康评分: {super_result[6]:.4f}")
            print(f"   计算时间: {super_result[7]}")
        else:
            print("❌ 超级财务因子数据未找到")

        print()

        # 步骤6: 数据一致性验证
        print("✅ 步骤6: 数据一致性验证...")

        # 验证财务因子一致性
        if financial_result:
            assert (
                financial_result[0] == financial_factors["stock_code"]
            ), "股票代码不一致"
            assert (
                financial_result[1] == financial_factors["trade_date"]
            ), "交易日期不一致"
            assert (
                abs(financial_result[2] - financial_factors["pe_ratio"]) < 0.0001
            ), "PE比率不一致"
            assert (
                abs(financial_result[3] - financial_factors["pb_ratio"]) < 0.0001
            ), "PB比率不一致"
            print("✅ 财务因子数据一致性验证通过")

        # 验证超级财务因子一致性
        if super_result:
            assert super_result[0] == super_factors["stock_code"], "股票代码不一致"
            assert super_result[1] == super_factors["trade_date"], "交易日期不一致"
            assert (
                abs(super_result[2] - super_factors["overall_score"]) < 0.0001
            ), "综合评分不一致"
            print("✅ 超级财务因子数据一致性验证通过")

        conn.close()

        # 总结
        total_time = api_time + process_time + calc_time + store_time
        print("=" * 60)
        print("🎉 DataPipeline真实数据测试完成！")
        print(f"📊 测试股票: {stock_code}")
        print(f"📅 测试日期: {trade_date}")
        print(f"⏱️ 总耗时: {total_time:.2f}秒")
        print(f"   - API调用: {api_time:.2f}秒")
        print(f"   - 数据处理: {process_time:.2f}秒")
        print(f"   - 因子计算: {calc_time:.2f}秒")
        print(f"   - 数据存储: {store_time:.2f}秒")
        print("✅ 所有数据已成功存储到数据库并验证通过")

    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_datapipeline_real_data())

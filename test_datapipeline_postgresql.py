#!/usr/bin/env python3
"""
DataPipeline PostgreSQL真实数据库测试脚本
展示从Tushare获取真实数据，处理并存储到PostgreSQL数据库的完整流程
"""

import asyncio
import os
import sys
import psycopg2
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# 添加项目路径
sys.path.append('/Users/pengcheng/Documents/papa/packages/backend-python/src')

from services.data_pipeline_service import DataPipelineService

async def test_datapipeline_postgresql():
    """测试DataPipeline处理真实数据并存储到PostgreSQL数据库"""

    print("🚀 开始DataPipeline PostgreSQL真实数据库测试")
    print("=" * 70)

    # 设置真实Tushare token
    os.environ['TUSHARE_TOKEN'] = '6b16b1a0173eb26abd4cf12a4ad0e70e344c0c1808a310487c0f70ab'

    # PostgreSQL数据库配置
    DATABASE_URL = "postgresql://postgres:password@localhost:5432/quant_navigator"

    # 创建DataPipelineService
    config = {
        "tushare": {
            "token": os.environ['TUSHARE_TOKEN'],
            "timeout": 30
        },
        "database": {
            "url": DATABASE_URL
        }
    }

    service = DataPipelineService(config)

    # 测试数据
    stock_code = "601398.SH"  # 工商银行
    trade_date = "20230104"   # 2023年1月4日

    try:
        print(f"📊 测试股票: {stock_code}")
        print(f"📅 测试日期: {trade_date}")
        print(f"🗄️ 数据库: PostgreSQL")
        print()

        # 步骤1: 从Tushare获取真实数据
        print("📡 步骤1: 从Tushare API获取真实数据...")
        start_time = datetime.now()

        raw_data = await service.fetch_tushare_data(stock_code, trade_date)

        api_time = (datetime.now() - start_time).total_seconds()
        print(f"✅ API调用完成，耗时: {api_time:.2f}秒")

        # 展示原始数据结构
        print(f"📋 原始数据结构:")
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
        print(f"📊 财务因子数据:")
        for key, value in financial_factors.items():
            if isinstance(value, float):
                print(f"   {key}: {value:.4f}")
            else:
                print(f"   {key}: {value}")
        print()

        # 步骤3: 计算超级财务因子
        print("🧮 步骤3: 计算超级财务因子...")
        start_time = datetime.now()

        super_factors = await service.calculate_super_financial_factors(financial_factors)

        calc_time = (datetime.now() - start_time).total_seconds()
        print(f"✅ 超级财务因子计算完成，耗时: {calc_time:.2f}秒")

        # 展示超级财务因子数据
        print(f"🎯 超级财务因子数据:")
        for key, value in super_factors.items():
            if isinstance(value, float):
                print(f"   {key}: {value:.4f}")
            else:
                print(f"   {key}: {value}")
        print()

        # 步骤4: 连接PostgreSQL数据库
        print("🗄️ 步骤4: 连接PostgreSQL数据库...")
        start_time = datetime.now()

        try:
            # 创建PostgreSQL连接
            engine = create_engine(DATABASE_URL, echo=False)
            Session = sessionmaker(bind=engine)
            session = Session()

            # 创建表结构
            session.execute(text('''
                CREATE TABLE IF NOT EXISTS financial_factors (
                    stock_code VARCHAR(20) NOT NULL,
                    trade_date VARCHAR(8) NOT NULL,
                    pe_ratio DECIMAL(10,4),
                    pb_ratio DECIMAL(10,4),
                    ps_ratio DECIMAL(10,4),
                    dividend_yield DECIMAL(10,4),
                    market_cap DECIMAL(20,4),
                    turnover_rate DECIMAL(10,4),
                    volume_ratio DECIMAL(10,4),
                    float_market_cap DECIMAL(20,4),
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
                    amount DECIMAL(20,4),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (stock_code, trade_date)
                )
            '''))

            session.execute(text('''
                CREATE TABLE IF NOT EXISTS super_financial_factors (
                    stock_code VARCHAR(20) NOT NULL,
                    trade_date VARCHAR(8) NOT NULL,
                    pe_ratio DECIMAL(10,4),
                    pb_ratio DECIMAL(10,4),
                    ps_ratio DECIMAL(10,4),
                    dividend_yield DECIMAL(10,4),
                    market_cap DECIMAL(20,4),
                    turnover_rate DECIMAL(10,4),
                    volume_ratio DECIMAL(10,4),
                    float_market_cap DECIMAL(20,4),
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
                    amount DECIMAL(20,4),
                    value_score DECIMAL(10,4),
                    growth_score DECIMAL(10,4),
                    profitability_score DECIMAL(10,4),
                    financial_health_score DECIMAL(10,4),
                    overall_score DECIMAL(10,4),
                    calculated_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (stock_code, trade_date)
                )
            '''))

            session.commit()
            print("✅ PostgreSQL数据库连接成功，表结构创建完成")

        except Exception as e:
            print(f"❌ PostgreSQL数据库连接失败: {e}")
            print("💡 请确保PostgreSQL服务正在运行，并且数据库配置正确")
            return

        # 步骤5: 存储财务因子到PostgreSQL
        print("💾 步骤5: 存储财务因子到PostgreSQL...")
        start_time = datetime.now()

        # 存储财务因子
        session.execute(text('''
            INSERT INTO financial_factors
            (stock_code, trade_date, pe_ratio, pb_ratio, ps_ratio, dividend_yield,
             market_cap, turnover_rate, volume_ratio, float_market_cap, total_shares,
             float_shares, free_shares, open_price, high_price, low_price, close_price,
             pre_close, price_change, price_change_pct, volume, amount)
            VALUES
            (:stock_code, :trade_date, :pe_ratio, :pb_ratio, :ps_ratio, :dividend_yield,
             :market_cap, :turnover_rate, :volume_ratio, :float_market_cap, :total_shares,
             :float_shares, :free_shares, :open_price, :high_price, :low_price, :close_price,
             :pre_close, :price_change, :price_change_pct, :volume, :amount)
            ON CONFLICT (stock_code, trade_date) DO UPDATE SET
                pe_ratio = EXCLUDED.pe_ratio,
                pb_ratio = EXCLUDED.pb_ratio,
                ps_ratio = EXCLUDED.ps_ratio,
                dividend_yield = EXCLUDED.dividend_yield,
                market_cap = EXCLUDED.market_cap,
                turnover_rate = EXCLUDED.turnover_rate,
                volume_ratio = EXCLUDED.volume_ratio,
                float_market_cap = EXCLUDED.float_market_cap,
                total_shares = EXCLUDED.total_shares,
                float_shares = EXCLUDED.float_shares,
                free_shares = EXCLUDED.free_shares,
                open_price = EXCLUDED.open_price,
                high_price = EXCLUDED.high_price,
                low_price = EXCLUDED.low_price,
                close_price = EXCLUDED.close_price,
                pre_close = EXCLUDED.pre_close,
                price_change = EXCLUDED.price_change,
                price_change_pct = EXCLUDED.price_change_pct,
                volume = EXCLUDED.volume,
                amount = EXCLUDED.amount
        '''), financial_factors)

        # 存储超级财务因子
        session.execute(text('''
            INSERT INTO super_financial_factors
            (stock_code, trade_date, pe_ratio, pb_ratio, ps_ratio, dividend_yield,
             market_cap, turnover_rate, volume_ratio, float_market_cap, total_shares,
             float_shares, free_shares, open_price, high_price, low_price, close_price,
             pre_close, price_change, price_change_pct, volume, amount,
             value_score, growth_score, profitability_score, financial_health_score,
             overall_score, calculated_at)
            VALUES
            (:stock_code, :trade_date, :pe_ratio, :pb_ratio, :ps_ratio, :dividend_yield,
             :market_cap, :turnover_rate, :volume_ratio, :float_market_cap, :total_shares,
             :float_shares, :free_shares, :open_price, :high_price, :low_price, :close_price,
             :pre_close, :price_change, :price_change_pct, :volume, :amount,
             :value_score, :growth_score, :profitability_score, :financial_health_score,
             :overall_score, :calculated_at)
            ON CONFLICT (stock_code, trade_date) DO UPDATE SET
                pe_ratio = EXCLUDED.pe_ratio,
                pb_ratio = EXCLUDED.pb_ratio,
                ps_ratio = EXCLUDED.ps_ratio,
                dividend_yield = EXCLUDED.dividend_yield,
                market_cap = EXCLUDED.market_cap,
                turnover_rate = EXCLUDED.turnover_rate,
                volume_ratio = EXCLUDED.volume_ratio,
                float_market_cap = EXCLUDED.float_market_cap,
                total_shares = EXCLUDED.total_shares,
                float_shares = EXCLUDED.float_shares,
                free_shares = EXCLUDED.free_shares,
                open_price = EXCLUDED.open_price,
                high_price = EXCLUDED.high_price,
                low_price = EXCLUDED.low_price,
                close_price = EXCLUDED.close_price,
                pre_close = EXCLUDED.pre_close,
                price_change = EXCLUDED.price_change,
                price_change_pct = EXCLUDED.price_change_pct,
                volume = EXCLUDED.volume,
                amount = EXCLUDED.amount,
                value_score = EXCLUDED.value_score,
                growth_score = EXCLUDED.growth_score,
                profitability_score = EXCLUDED.profitability_score,
                financial_health_score = EXCLUDED.financial_health_score,
                overall_score = EXCLUDED.overall_score,
                calculated_at = EXCLUDED.calculated_at
        '''), super_factors)

        session.commit()
        store_time = (datetime.now() - start_time).total_seconds()
        print(f"✅ 数据存储到PostgreSQL完成，耗时: {store_time:.2f}秒")
        print()

        # 步骤6: 验证PostgreSQL中的数据
        print("🔍 步骤6: 验证PostgreSQL中的数据...")

        # 查询财务因子
        result = session.execute(text('''
            SELECT stock_code, trade_date, pe_ratio, pb_ratio, ps_ratio, dividend_yield,
                   market_cap, turnover_rate, volume_ratio
            FROM financial_factors
            WHERE stock_code = :stock_code AND trade_date = :trade_date
        '''), {"stock_code": stock_code, "trade_date": trade_date})

        financial_result = result.fetchone()
        if financial_result:
            print(f"📊 PostgreSQL中的财务因子:")
            print(f"   股票代码: {financial_result[0]}")
            print(f"   交易日期: {financial_result[1]}")
            print(f"   PE比率: {financial_result[2]:.4f}")
            print(f"   PB比率: {financial_result[3]:.4f}")
            print(f"   PS比率: {financial_result[4]:.4f}")
            print(f"   股息率: {financial_result[5]:.4f}")
            print(f"   市值: {financial_result[6]:.2f}万元")
            print(f"   换手率: {financial_result[7]:.4f}%")
            print(f"   量比: {financial_result[8]:.4f}")
        else:
            print("❌ 财务因子数据未找到")

        print()

        # 查询超级财务因子
        result = session.execute(text('''
            SELECT stock_code, trade_date, overall_score, value_score, growth_score,
                   profitability_score, financial_health_score, calculated_at
            FROM super_financial_factors
            WHERE stock_code = :stock_code AND trade_date = :trade_date
        '''), {"stock_code": stock_code, "trade_date": trade_date})

        super_result = result.fetchone()
        if super_result:
            print(f"🎯 PostgreSQL中的超级财务因子:")
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

        # 步骤7: 数据一致性验证
        print("✅ 步骤7: 数据一致性验证...")

        # 验证财务因子一致性
        if financial_result:
            assert financial_result[0] == financial_factors['stock_code'], "股票代码不一致"
            assert financial_result[1] == financial_factors['trade_date'], "交易日期不一致"
            assert abs(float(financial_result[2]) - financial_factors['pe_ratio']) < 0.0001, "PE比率不一致"
            assert abs(float(financial_result[3]) - financial_factors['pb_ratio']) < 0.0001, "PB比率不一致"
            print("✅ 财务因子数据一致性验证通过")

        # 验证超级财务因子一致性
        if super_result:
            assert super_result[0] == super_factors['stock_code'], "股票代码不一致"
            assert super_result[1] == super_factors['trade_date'], "交易日期不一致"
            assert abs(float(super_result[2]) - super_factors['overall_score']) < 0.0001, "综合评分不一致"
            print("✅ 超级财务因子数据一致性验证通过")

        session.close()

        # 总结
        total_time = api_time + process_time + calc_time + store_time
        print("=" * 70)
        print("🎉 DataPipeline PostgreSQL真实数据库测试完成！")
        print(f"📊 测试股票: {stock_code}")
        print(f"📅 测试日期: {trade_date}")
        print(f"🗄️ 数据库: PostgreSQL")
        print(f"⏱️ 总耗时: {total_time:.2f}秒")
        print(f"   - API调用: {api_time:.2f}秒")
        print(f"   - 数据处理: {process_time:.2f}秒")
        print(f"   - 因子计算: {calc_time:.2f}秒")
        print(f"   - 数据存储: {store_time:.2f}秒")
        print("✅ 所有数据已成功存储到PostgreSQL数据库并验证通过")

    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_datapipeline_postgresql())

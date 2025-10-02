#!/usr/bin/env python3
"""
DataPipelineService真实数据库操作示例
演示如何使用更新后的DataPipelineService进行真实数据库操作
"""

import asyncio
import os
import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from src.services.data_pipeline_service import DataPipelineService
from support_modules.database_utils import DatabaseManager


async def main():
    """主函数 - 演示DataPipelineService的真实数据库操作"""
    
    print("🚀 DataPipelineService真实数据库操作示例")
    print("=" * 50)
    
    # 1. 配置数据库连接
    config = {
        "database_url": os.getenv(
            "DATABASE_URL", 
            "postgresql://postgres:password@localhost:5432/quant_navigator"
        ),
        "redis_url": os.getenv("REDIS_URL", "redis://localhost:6379"),
        "tushare": {
            "token": os.getenv("TUSHARE_TOKEN", "your_token_here")
        }
    }
    
    print("📋 配置信息:")
    print(f"  数据库URL: {config['database_url']}")
    print(f"  Redis URL: {config['redis_url']}")
    print()
    
    # 2. 初始化服务
    print("🔧 初始化服务...")
    try:
        # 创建数据库管理器
        db_manager = DatabaseManager(config)
        
        # 创建DataPipelineService实例
        data_pipeline = DataPipelineService(config, db_manager)
        
        print("✅ 服务初始化成功")
        print()
        
    except Exception as e:
        print(f"❌ 服务初始化失败: {e}")
        return
    
    # 3. 模拟财务因子数据
    print("📊 准备财务因子数据...")
    financial_factors = {
        "stock_code": "000001.SZ",
        "trade_date": "20240101",
        "pe_ratio": 15.5,
        "pb_ratio": 2.1,
        "ps_ratio": 3.2,
        "dividend_yield": 2.8,
        "market_cap": 1000000000.0,
        "turnover_rate": 0.05,
        "volume_ratio": 1.2,
        "float_market_cap": 800000000.0,
        "total_shares": 1000000000,
        "float_shares": 800000000,
        "free_shares": 600000000,
        "open_price": 10.0,
        "high_price": 10.5,
        "low_price": 9.5,
        "close_price": 10.2,
        "pre_close": 10.0,
        "price_change": 0.2,
        "price_change_pct": 2.0,
        "volume": 1000000,
        "amount": 10000000,
    }
    
    print(f"  股票代码: {financial_factors['stock_code']}")
    print(f"  交易日期: {financial_factors['trade_date']}")
    print(f"  PE比率: {financial_factors['pe_ratio']}")
    print(f"  PB比率: {financial_factors['pb_ratio']}")
    print()
    
    # 4. 保存财务因子到数据库
    print("💾 保存财务因子到数据库...")
    try:
        result = await data_pipeline.save_financial_factors(financial_factors)
        if result:
            print("✅ 财务因子保存成功")
        else:
            print("❌ 财务因子保存失败")
    except Exception as e:
        print(f"❌ 财务因子保存异常: {e}")
        return
    
    # 5. 计算超级财务因子
    print("🧮 计算超级财务因子...")
    try:
        super_factors = await data_pipeline.calculate_super_financial_factors(financial_factors)
        
        print("✅ 超级财务因子计算完成:")
        print(f"  价值评分: {super_factors['value_score']:.2f}")
        print(f"  成长性评分: {super_factors['growth_score']:.2f}")
        print(f"  盈利能力评分: {super_factors['profitability_score']:.2f}")
        print(f"  财务健康度评分: {super_factors['financial_health_score']:.2f}")
        print(f"  综合评分: {super_factors['overall_score']:.2f}")
        print()
        
    except Exception as e:
        print(f"❌ 超级财务因子计算异常: {e}")
        return
    
    # 6. 保存超级财务因子到数据库
    print("💾 保存超级财务因子到数据库...")
    try:
        result = await data_pipeline.save_super_financial_factors(super_factors)
        if result:
            print("✅ 超级财务因子保存成功")
        else:
            print("❌ 超级财务因子保存失败")
    except Exception as e:
        print(f"❌ 超级财务因子保存异常: {e}")
        return
    
    # 7. 验证数据是否已保存
    print("🔍 验证数据保存情况...")
    try:
        with db_manager.get_session() as session:
            # 查询财务因子
            financial_result = session.execute(
                "SELECT COUNT(*) FROM financial_factors WHERE stock_code = :stock_code AND trade_date = :trade_date",
                {"stock_code": "000001.SZ", "trade_date": "20240101"}
            ).fetchone()
            
            # 查询超级财务因子
            super_result = session.execute(
                "SELECT COUNT(*) FROM super_financial_factors WHERE stock_code = :stock_code AND trade_date = :trade_date",
                {"stock_code": "000001.SZ", "trade_date": "20240101"}
            ).fetchone()
            
            print(f"  财务因子记录数: {financial_result[0]}")
            print(f"  超级财务因子记录数: {super_result[0]}")
            
            if financial_result[0] > 0 and super_result[0] > 0:
                print("✅ 数据验证成功，记录已正确保存到数据库")
            else:
                print("❌ 数据验证失败，记录未正确保存")
                
    except Exception as e:
        print(f"❌ 数据验证异常: {e}")
    
    print()
    print("🎉 示例执行完成！")
    print()
    print("📝 使用说明:")
    print("1. 确保PostgreSQL数据库正在运行")
    print("2. 运行数据库迁移脚本: python scripts/run_migration.py")
    print("3. 设置环境变量: TUSHARE_TOKEN, DATABASE_URL")
    print("4. 运行此示例脚本")


if __name__ == "__main__":
    asyncio.run(main())

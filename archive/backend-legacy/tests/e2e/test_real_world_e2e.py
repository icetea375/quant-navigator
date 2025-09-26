"""
真实世界端到端测试 - "有限真实性+人工仲裁"策略

遵循"一个人的军队"哲学：
- 极致精简，不引入复杂工具
- 使用真实API，但严格控制范围
- 接受偶尔的失败，由人类专家仲裁
- 只测试最核心的1-2个黄金路径
"""

import pytest
import os
import time

from src.services.data_sources.tushare_fetcher import TushareFetcher
from src.services.data_pipeline_service import DataPipelineService


class TestRealWorldE2E:
    """真实世界端到端测试类"""

    @pytest.fixture
    def real_config(self):
        """使用真实配置（但使用测试数据库）"""
        return {
            "tushare": {
                "token": os.getenv("TUSHARE_TOKEN", "test_token"),
                "timeout": 30,
            },
            "database": {
                "url": "sqlite:///test_e2e.db"  # 使用独立的测试数据库
            },
        }

    @pytest.fixture
    def stable_test_data(self):
        """使用非常稳定的测试数据 - 几乎不会变化"""
        return {
            "stock_code": "601398.SH",  # 工商银行 - 非常稳定的大盘股
            "trade_date": "20230104",  # 固定的历史日期，数据不会变化（YYYYMMDD格式）
            "expected_pe_range": (3.0, 8.0),  # 银行股PE范围
            "expected_pb_range": (0.5, 1.5),  # 银行股PB范围
        }

    @pytest.fixture
    def real_tushare_fetcher(self, real_config):
        """创建真实的TushareFetcher（使用真实API）"""
        return TushareFetcher(token=real_config["tushare"]["token"])

    @pytest.fixture
    def real_data_pipeline_service(self, real_config):
        """创建真实的DataPipelineService"""
        return DataPipelineService(real_config)

    @pytest.mark.e2e
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_core_data_pipeline_workflow_real_world(
        self, real_tushare_fetcher, real_data_pipeline_service, stable_test_data
    ):
        """
        核心数据管道工作流的真实世界测试

        这是我们的"黄金路径"测试：
        1. 从真实Tushare API获取数据
        2. 通过DataPipelineService处理
        3. 验证数据质量和一致性

        注意：这个测试可能会因为网络或API问题偶尔失败
        如果失败，请人工判断是外部问题还是代码问题
        """
        print(
            f"\n🚀 开始真实世界E2E测试: {stable_test_data['stock_code']} - {stable_test_data['trade_date']}"
        )

        try:
            # 步骤1: 从真实Tushare API获取数据
            print("📡 从真实Tushare API获取数据...")
            start_time = time.time()

            raw_data = await real_data_pipeline_service.fetch_tushare_data(
                stable_test_data["stock_code"], stable_test_data["trade_date"]
            )

            api_time = time.time() - start_time
            print(f"✅ API调用完成，耗时: {api_time:.2f}秒")

            # 验证API返回的数据结构
            assert "stock_basic" in raw_data, "缺少股票基本信息"
            assert "daily_basic" in raw_data, "缺少日度基本面数据"
            assert "daily" in raw_data, "缺少日度行情数据"

            # 验证数据不为空
            assert len(raw_data["stock_basic"]) > 0, "股票基本信息为空"
            assert len(raw_data["daily_basic"]) > 0, "日度基本面数据为空"
            assert len(raw_data["daily"]) > 0, "日度行情数据为空"

            # 步骤2: 提取财务因子
            print("🔧 提取财务因子...")
            financial_factors = (
                await real_data_pipeline_service.extract_financial_factors(
                    stable_test_data["stock_code"],
                    stable_test_data["trade_date"],
                    raw_data,
                )
            )

            # 验证财务因子的合理性（银行股的特征）
            assert financial_factors["stock_code"] == stable_test_data["stock_code"]
            assert financial_factors["trade_date"] == stable_test_data["trade_date"]

            # 验证PE和PB在合理范围内（银行股特征）
            pe_ratio = financial_factors["pe_ratio"]
            pb_ratio = financial_factors["pb_ratio"]

            print(f"📊 财务指标: PE={pe_ratio:.2f}, PB={pb_ratio:.2f}")

            # 银行股的PE和PB通常较低
            assert (
                stable_test_data["expected_pe_range"][0]
                <= pe_ratio
                <= stable_test_data["expected_pe_range"][1]
            ), f"PE比率 {pe_ratio} 超出银行股合理范围 {stable_test_data['expected_pe_range']}"

            assert (
                stable_test_data["expected_pb_range"][0]
                <= pb_ratio
                <= stable_test_data["expected_pb_range"][1]
            ), f"PB比率 {pb_ratio} 超出银行股合理范围 {stable_test_data['expected_pb_range']}"

            # 步骤3: 计算超级财务因子
            print("🧮 计算超级财务因子...")
            super_factors = (
                await real_data_pipeline_service.calculate_super_financial_factors(
                    financial_factors
                )
            )

            # 验证超级财务因子的合理性
            assert "overall_score" in super_factors
            assert "value_score" in super_factors
            assert "calculated_at" in super_factors

            overall_score = super_factors["overall_score"]
            print(f"🎯 综合评分: {overall_score:.2f}")

            # 评分应该在合理范围内
            assert 0 <= overall_score <= 100, f"综合评分 {overall_score} 超出合理范围"

            # 步骤4: 验证数据一致性
            print("🔍 验证数据一致性...")
            assert super_factors["stock_code"] == financial_factors["stock_code"]
            assert super_factors["trade_date"] == financial_factors["trade_date"]
            assert super_factors["pe_ratio"] == financial_factors["pe_ratio"]
            assert super_factors["pb_ratio"] == financial_factors["pb_ratio"]

            total_time = time.time() - start_time
            print(f"🎉 真实世界E2E测试完成！总耗时: {total_time:.2f}秒")

            # 输出关键指标供人工审查
            print("\n📋 关键指标摘要:")
            print(f"   股票代码: {financial_factors['stock_code']}")
            print(f"   交易日期: {financial_factors['trade_date']}")
            print(f"   PE比率: {pe_ratio:.2f}")
            print(f"   PB比率: {pb_ratio:.2f}")
            print(f"   综合评分: {overall_score:.2f}")
            print(f"   总耗时: {total_time:.2f}秒")

        except Exception as e:
            print(f"\n❌ 真实世界E2E测试失败: {e}")
            print("🔍 请人工判断失败原因:")
            print("   1. 网络连接问题？")
            print("   2. Tushare API问题？")
            print("   3. 我们的代码问题？")
            print("   4. 数据格式变化？")
            print("\n如果是外部问题，可以忽略此失败")
            print("如果是代码问题，请立即修复")
            raise

    @pytest.mark.e2e
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_data_pipeline_error_handling_real_world(
        self, real_data_pipeline_service
    ):
        """
        真实世界错误处理测试

        测试我们的系统在遇到真实API错误时的表现
        """
        print("\n🚀 开始真实世界错误处理测试")

        # 测试无效股票代码
        try:
            await real_data_pipeline_service.fetch_tushare_data(
                "INVALID.SH", "20230101"
            )
            assert False, "应该抛出异常"
        except Exception as e:
            print(f"✅ 无效股票代码正确抛出异常: {e}")
            assert "API调用失败" in str(e) or "股票代码" in str(e)

        # 测试无效日期格式
        try:
            await real_data_pipeline_service.fetch_tushare_data(
                "601398.SH", "invalid-date"
            )
            assert False, "应该抛出异常"
        except Exception as e:
            print(f"✅ 无效日期格式正确抛出异常: {e}")
            assert "无效的日期格式" in str(e)

    @pytest.mark.e2e
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_system_performance_real_world(
        self, real_tushare_fetcher, real_data_pipeline_service, stable_test_data
    ):
        """
        真实世界性能测试

        验证系统在真实环境下的性能表现
        """
        print("\n🚀 开始真实世界性能测试")

        start_time = time.time()

        # 执行完整流程
        raw_data = await real_data_pipeline_service.fetch_tushare_data(
            stable_test_data["stock_code"], stable_test_data["trade_date"]
        )

        financial_factors = await real_data_pipeline_service.extract_financial_factors(
            stable_test_data["stock_code"], stable_test_data["trade_date"], raw_data
        )

        super_factors = (
            await real_data_pipeline_service.calculate_super_financial_factors(
                financial_factors
            )
        )

        total_time = time.time() - start_time

        print(f"⏱️ 真实世界性能测试完成，总耗时: {total_time:.2f}秒")

        # 性能要求：整个流程应该在30秒内完成
        assert (
            total_time < 30.0
        ), f"性能测试失败：总耗时 {total_time:.2f}秒 超过30秒限制"

        print(f"✅ 性能测试通过：{total_time:.2f}秒 < 30秒")


# 配置pytest标记
def pytest_configure(config):
    """配置pytest标记"""
    config.addinivalue_line("markers", "e2e: 端到端测试")
    config.addinivalue_line("markers", "slow: 慢速测试")


def pytest_collection_modifyitems(config, items):
    """修改测试收集行为"""
    for item in items:
        if "e2e" in item.nodeid:
            item.add_marker(pytest.mark.slow)

"""
DataPipeline 外部交互强化集成测试
严格遵循测试宪法:风险驱动,测试金字塔,TDD红-绿-重构循环

测试目标:确保与Tushare API和数据库的交互100%可靠和健壮
"""

import os
import sys

# 添加项目根目录到Python路径
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../packages/backend-python'))
sys.path.insert(0, backend_path)

import asyncio
from unittest.mock import patch

import pandas as pd
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.entities.base import Base
from src.services.data_pipeline_service import DataPipelineService


class TestDataPipelineIOIntegration:
    """DataPipeline 外部交互集成测试类"""

    @pytest.fixture
    def test_engine(self):
        """创建测试数据库引擎"""
        engine = create_engine("sqlite:///:memory:", echo=False)
        Base.metadata.create_all(engine)
        return engine

    @pytest.fixture
    def test_session(self, test_engine):
        pass
        """创建测试数据库会话"""
        Session = sessionmaker(bind=test_engine)
        session = Session()
        yield session
        session.close()

    @pytest.fixture
    def service(self, test_engine):
        """创建DataPipelineService实例"""
        config = {
            "tushare": {"token": "test_token"},
            "database": {"url": "sqlite:///:memory:", "echo": False},
        }
        return DataPipelineService(config)

    @pytest.mark.asyncio
    async def test_should_handle_tushare_api_success_response(self, service):
        """测试:Tushare API成功响应的情况"""
        # 模拟Tushare API成功返回数据
        mock_daily_basic = pd.DataFrame(
            [
                {
                    "ts_code": "000001.SZ",
                    "trade_date": "20240117",
                    "close": 12.50,
                    "pe": 15.0,
                    "pb": 2.0,
                    "ps": 3.0,
                    "dv_ratio": 2.5,
                    "turnover_rate": 1.5,
                    "volume_ratio": 1.2,
                    "total_mv": 1000000.0,
                    "circ_mv": 900000.0,
                }
            ]
        )

        mock_daily = pd.DataFrame(
            [
                {
                    "ts_code": "000001.SZ",
                    "trade_date": "20240117",
                    "open": 12.30,
                    "high": 12.80,
                    "low": 12.20,
                    "close": 12.50,
                    "pct_chg": 2.5,
                    "vol": 150000000,
                }
            ]
        )

        mock_stock_basic = pd.DataFrame(
            [
                {
                    "ts_code": "000001.SZ",
                    "symbol": "000001",
                    "name": "平安银行",
                    "area": "深圳",
                    "industry": "银行",
                    "market": "主板",
                    "list_date": "19910403",
                }
            ]
        )

        with (
            patch.object(service.pro, "daily_basic", return_value=mock_daily_basic),
            patch.object(service.pro, "daily", return_value=mock_daily),
            patch.object(service.pro, "stock_basic", return_value=mock_stock_basic),
        ):
            result = await service.fetch_tushare_data("000001.SZ", "20240117")

            # 验证返回数据结构
            assert "daily_basic" in result
            assert "daily" in result
            assert "stock_basic" in result

            # 验证数据内容
            assert len(result["daily_basic"]) == 1
            assert result["daily_basic"][0]["ts_code"] == "000001.SZ"
            assert result["daily_basic"][0]["close"] == 12.50
            assert result["daily_basic"][0]["pe"] == 15.0

    @pytest.mark.asyncio
    async def test_should_handle_tushare_api_null_values(self, service):
        """测试:Tushare API返回预期外null值的情况"""
        # 模拟Tushare API返回包含null值的数据
        mock_daily_basic = pd.DataFrame(
            [
                {
                    "ts_code": "000001.SZ",
                    "trade_date": "20240117",
                    "close": 12.50,
                    "pe": None,  # 关键财务指标为null
                    "pb": None,
                    "ps": None,
                    "dv_ratio": None,
                    "turnover_rate": 1.5,
                    "volume_ratio": 1.2,
                    "total_mv": 1000000.0,
                    "circ_mv": 900000.0,
                }
            ]
        )

        mock_daily = pd.DataFrame(
            [
                {
                    "ts_code": "000001.SZ",
                    "trade_date": "20240117",
                    "open": 12.30,
                    "high": 12.80,
                    "low": 12.20,
                    "close": 12.50,
                    "pct_chg": 2.5,
                    "vol": 150000000,
                }
            ]
        )

        mock_stock_basic = pd.DataFrame(
            [
                {
                    "ts_code": "000001.SZ",
                    "symbol": "000001",
                    "name": "平安银行",
                    "area": "深圳",
                    "industry": "银行",
                    "market": "主板",
                    "list_date": "19910403",
                }
            ]
        )

        with (
            patch.object(service.pro, "daily_basic", return_value=mock_daily_basic),
            patch.object(service.pro, "daily", return_value=mock_daily),
            patch.object(service.pro, "stock_basic", return_value=mock_stock_basic),
        ):
            result = await service.fetch_tushare_data("000001.SZ", "20240117")

            # 验证系统能处理null值
            assert "daily_basic" in result
            assert len(result["daily_basic"]) == 1

            # 验证财务因子提取能处理null值
            financial_factors = await service.extract_financial_factors(
                "000001.SZ", "20240117", result
            )

            # 验证null值被正确处理为0.0或默认值
            assert financial_factors["pe_ratio"] == 0.0
            assert financial_factors["pb_ratio"] == 0.0
            assert financial_factors["ps_ratio"] == 0.0
            assert financial_factors["dividend_yield"] == 0.0

    @pytest.mark.asyncio
    async def test_should_handle_tushare_api_exception(self, service):
        """测试:Tushare API抛出异常的情况"""
        # 模拟Tushare API抛出异常
        with patch.object(
            service.pro, "daily_basic", side_effect=Exception("API调用失败")
        ):
            with pytest.raises(Exception) as exc_info:
                await service.fetch_tushare_data("000001.SZ", "20240117")

            assert "API调用失败" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_should_handle_empty_tushare_response(self, service):
        """测试:Tushare API返回空数据的情况"""
        # 模拟Tushare API返回空DataFrame
        mock_daily_basic = pd.DataFrame()
        mock_daily = pd.DataFrame()
        mock_stock_basic = pd.DataFrame()

        with (
            patch.object(service.pro, "daily_basic", return_value=mock_daily_basic),
            patch.object(service.pro, "daily", return_value=mock_daily),
            patch.object(service.pro, "stock_basic", return_value=mock_stock_basic),
        ):
            result = await service.fetch_tushare_data("000001.SZ", "20240117")

            # 验证返回空数据结构
            assert "daily_basic" in result
            assert "daily" in result
            assert "stock_basic" in result
            assert len(result["daily_basic"]) == 0
            assert len(result["daily"]) == 0
            assert len(result["stock_basic"]) == 0

    @pytest.mark.asyncio
    async def test_should_validate_stock_code_format(self, service):
        """测试:股票代码格式验证"""
        # 测试无效股票代码
        with pytest.raises(ValueError) as exc_info:
            await service.fetch_tushare_data("", "20240117")

        assert "股票代码不能为空" in str(exc_info.value)

        # 测试无效日期格式
        with pytest.raises(ValueError) as exc_info:
            await service.fetch_tushare_data("000001.SZ", "invalid_date")

        assert "无效的日期格式" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_should_extract_financial_factors_with_real_data_structure(
        self, service
    ):
        """测试:使用真实数据结构提取财务因子"""
        # 模拟真实的Tushare数据结构
        raw_data = {
            "daily_basic": [
                {
                    "ts_code": "000001.SZ",
                    "trade_date": "20240117",
                    "close": 12.50,
                    "pe": 15.0,
                    "pb": 2.0,
                    "ps": 3.0,
                    "dv_ratio": 2.5,
                    "turnover_rate": 1.5,
                    "volume_ratio": 1.2,
                    "total_mv": 1000000.0,
                    "circ_mv": 900000.0,
                }
            ],
            "daily": [
                {
                    "ts_code": "000001.SZ",
                    "trade_date": "20240117",
                    "open": 12.30,
                    "high": 12.80,
                    "low": 12.20,
                    "close": 12.50,
                    "pct_chg": 2.5,
                    "vol": 150000000,
                }
            ],
            "stock_basic": [
                {
                    "ts_code": "000001.SZ",
                    "symbol": "000001",
                    "name": "平安银行",
                    "area": "深圳",
                    "industry": "银行",
                    "market": "主板",
                    "list_date": "19910403",
                }
            ],
        }

        result = await service.extract_financial_factors(
            "000001.SZ", "20240117", raw_data
        )

        # 验证财务因子提取结果
        assert result["stock_code"] == "000001.SZ"
        assert result["trade_date"] == "20240117"
        assert result["pe_ratio"] == 15.0
        assert result["pb_ratio"] == 2.0
        assert result["ps_ratio"] == 3.0
        assert result["dividend_yield"] == 2.5
        assert result["close_price"] == 12.50
        assert result["open_price"] == 12.30
        assert result["high_price"] == 12.80
        assert result["low_price"] == 12.20
        assert result["price_change_pct"] == 2.5
        assert result["volume"] == 150000000

    @pytest.mark.asyncio
    async def test_should_calculate_super_financial_factors_with_edge_cases(
        self, service
    ):
        """测试:超级财务因子计算边界情况"""
        # 测试极端值情况
        financial_factors = {
            "pe_ratio": 0.0,  # 极端低值
            "pb_ratio": 100.0,  # 极端高值
            "ps_ratio": 0.0,
            "dividend_yield": 0.0,
        }

        result = await service.calculate_super_financial_factors(financial_factors)

        # 验证边界值处理
        assert "value_score" in result
        assert "growth_score" in result
        assert "profitability_score" in result
        assert "financial_health_score" in result
        assert "overall_score" in result
        assert "calculated_at" in result

        # 验证评分范围
        assert 0 <= result["value_score"] <= 100
        assert 0 <= result["overall_score"] <= 100

    @pytest.mark.asyncio
    async def test_should_handle_database_connection_failure(self, service):
        """测试:数据库连接失败的情况"""
        # 当前DataPipelineService没有直接使用数据库,但为未来扩展预留
        # 这个测试暂时跳过,当DataPipelineService添加数据库功能时再实现
        pytest.skip("DataPipelineService当前不直接使用数据库,待未来扩展时实现此测试")

    @pytest.mark.asyncio
    async def test_should_handle_concurrent_api_calls(self, service):
        """测试:并发API调用的情况"""
        # 模拟多个并发API调用
        mock_daily_basic = pd.DataFrame(
            [
                {
                    "ts_code": "000001.SZ",
                    "trade_date": "20240117",
                    "close": 12.50,
                    "pe": 15.0,
                    "pb": 2.0,
                    "ps": 3.0,
                    "dv_ratio": 2.5,
                    "turnover_rate": 1.5,
                    "volume_ratio": 1.2,
                    "total_mv": 1000000.0,
                    "circ_mv": 900000.0,
                }
            ]
        )

        mock_daily = pd.DataFrame(
            [
                {
                    "ts_code": "000001.SZ",
                    "trade_date": "20240117",
                    "open": 12.30,
                    "high": 12.80,
                    "low": 12.20,
                    "close": 12.50,
                    "pct_chg": 2.5,
                    "vol": 150000000,
                }
            ]
        )

        mock_stock_basic = pd.DataFrame(
            [
                {
                    "ts_code": "000001.SZ",
                    "symbol": "000001",
                    "name": "平安银行",
                    "area": "深圳",
                    "industry": "银行",
                    "market": "主板",
                    "list_date": "19910403",
                }
            ]
        )

        with (
            patch.object(service.pro, "daily_basic", return_value=mock_daily_basic),
            patch.object(service.pro, "daily", return_value=mock_daily),
            patch.object(service.pro, "stock_basic", return_value=mock_stock_basic),
        ):
            # 并发调用多个股票数据
            tasks = [
                service.fetch_tushare_data("000001.SZ", "20240117"),
                service.fetch_tushare_data("000002.SZ", "20240117"),
                service.fetch_tushare_data("000003.SZ", "20240117"),
            ]

            results = await asyncio.gather(*tasks)

            # 验证所有调用都成功完成
            assert len(results) == 3
            for result in results:
                assert "daily_basic" in result
                assert "daily" in result
                assert "stock_basic" in result

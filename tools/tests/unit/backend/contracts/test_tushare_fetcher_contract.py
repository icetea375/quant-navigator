"""
TushareFetcher契约测试 - 验证TushareFetcher是否符合DataSourceInterface契约
遵循YAGNI平衡法则:这是"必要的架构守护",不是"不必要的复杂功能"
"""

import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../packages/backend-python')))

from unittest.mock import Mock, patch

import pandas as pd
import pytest

from src.services.data_sources import TushareFetcher
from . import run_data_source_contract_tests


class TestTushareFetcherContract:
    """TushareFetcher契约测试类"""

    @pytest.fixture
    def tushare_fetcher(self):
        """创建TushareFetcher实例用于测试"""
        with patch("src.services.data_sources.tushare_fetcher.ts") as mock_ts:
            mock_ts.pro_api.return_value = Mock()
            return TushareFetcher(token="test_token")

    @pytest.mark.asyncio
    async def test_green_phase_tushare_fetcher_conforms_to_contract(self, tushare_fetcher):
        """
        测试TushareFetcher是否符合DataSourceInterface契约

        这是核心的契约测试,确保TushareFetcher完全符合接口定义
        """
        # 使用契约测试生成器验证TushareFetcher
        assert await run_data_source_contract_tests(
            tushare_fetcher
        ), "TushareFetcher不符合DataSourceInterface契约"

    @pytest.mark.asyncio
    async def test_get_daily_quotes_contract(self, tushare_fetcher):
        """测试get_daily_quotes方法契约"""
        # Mock Tushare API响应
        mock_df = pd.DataFrame(
            {
                "ts_code": ["000001.SZ"],
                "trade_date": ["20250126"],
                "open": [100.0],
                "high": [105.0],
                "low": [98.0],
                "close": [103.0],
                "vol": [1000000],
                "amount": [103000000],
            }
        )

        with patch.object(tushare_fetcher.pro, "daily", return_value=mock_df):
            result = await tushare_fetcher.get_daily_quotes("000001.SZ", "20250126")

            # 验证返回类型
            assert isinstance(result, pd.DataFrame), "必须返回DataFrame"

            # 验证必需列
            required_columns = [
                "stock_code",
                "trade_date",
                "open",
                "high",
                "low",
                "close",
                "volume",
                "amount",
            ]
            assert set(required_columns).issubset(
                result.columns
            ), f"缺少必需列: {required_columns}"

    @pytest.mark.asyncio
    async def test_get_announcements_contract(self, tushare_fetcher):
        """测试get_announcements方法契约"""
        # Mock Tushare API响应
        mock_df = pd.DataFrame(
            {
                "ann_id": ["ann_001"],
                "ts_code": ["000001.SZ"],
                "title": ["测试公告"],
                "content": ["测试内容"],
                "ann_date": ["20250126"],
                "ann_type": ["业绩预告"],
            }
        )

        with patch.object(tushare_fetcher.pro, "anns", return_value=mock_df):
            result = await tushare_fetcher.get_announcements("000001.SZ", "20250126")

            # 验证返回类型
            assert isinstance(result, list), "必须返回List"

            if result:
                # 验证必需键
                required_keys = [
                    "announcement_id",
                    "stock_code",
                    "title",
                    "content",
                    "publish_date",
                    "announcement_type",
                ]
                assert set(required_keys).issubset(
                    result[0].keys()
                ), f"缺少必需键: {required_keys}"

    @pytest.mark.asyncio
    async def test_get_financial_data_contract(self, tushare_fetcher):
        """测试get_financial_data方法契约"""
        # Mock Tushare API响应
        mock_df = pd.DataFrame(
            {
                "ts_code": ["000001.SZ"],
                "f_ann_date": ["20250126"],
                "revenue": [1000000000],
                "n_income": [100000000],
                "total_assets": [10000000000],
                "total_liab": [5000000000],
                "roe": [0.1],
                "roa": [0.05],
            }
        )

        with patch.object(tushare_fetcher.pro, "income", return_value=mock_df):
            result = await tushare_fetcher.get_financial_data("000001.SZ", "20241231")

            # 验证返回类型
            assert isinstance(result, dict), "必须返回Dict"

            if result:
                # 验证必需键
                required_keys = [
                    "stock_code",
                    "report_date",
                    "revenue",
                    "net_profit",
                    "total_assets",
                    "total_liabilities",
                    "roe",
                    "roa",
                ]
                assert set(required_keys).issubset(
                    result.keys()
                ), f"缺少必需键: {required_keys}"

    @pytest.mark.asyncio
    async def test_health_check_contract(self, tushare_fetcher):
        """测试health_check方法契约"""
        # Mock Tushare API响应
        mock_df = pd.DataFrame({"ts_code": ["000001.SZ"], "name": ["平安银行"]})

        with patch.object(tushare_fetcher.pro, "stock_basic", return_value=mock_df):
            result = await tushare_fetcher.health_check()

            # 验证返回类型
            assert isinstance(result, dict), "必须返回Dict"

            # 验证必需键
            required_keys = [
                "status",
                "response_time",
                "last_success",
                "error_count",
                "rate_limit_remaining",
            ]
            assert set(required_keys).issubset(
                result.keys()
            ), f"缺少必需键: {required_keys}"

            # 验证status值
            assert result["status"] in [
                "healthy",
                "unhealthy",
                "degraded",
            ], f"无效的status值: {result['status']}"

    @pytest.mark.asyncio
    async def test_exception_handling_contract(self, tushare_fetcher):
        """测试异常处理契约"""
        # Mock API调用失败
        with patch.object(
            tushare_fetcher.pro, "daily", side_effect=Exception("API调用失败")
        ):
            from core.interfaces import DataSourceError

            with pytest.raises(DataSourceError):
                await tushare_fetcher.get_daily_quotes("000001.SZ", "20250126")

    @pytest.mark.asyncio
    async def test_empty_data_handling(self, tushare_fetcher):
        """测试空数据处理"""
        # Mock空响应
        empty_df = pd.DataFrame()

        with patch.object(tushare_fetcher.pro, "daily", return_value=empty_df):
            result = await tushare_fetcher.get_daily_quotes("000001.SZ", "20250126")

            # 验证空数据时返回空DataFrame
            assert isinstance(result, pd.DataFrame), "必须返回DataFrame"
            assert result.empty, "空数据时应该返回空DataFrame"

    @pytest.mark.asyncio
    async def test_data_standardization(self, tushare_fetcher):
        """测试数据标准化"""
        # Mock Tushare原始数据
        mock_df = pd.DataFrame(
            {
                "ts_code": ["000001.SZ"],
                "trade_date": ["20250126"],
                "open": [100.0],
                "high": [105.0],
                "low": [98.0],
                "close": [103.0],
                "vol": [1000000],  # Tushare使用'vol'
                "amount": [103000000],
            }
        )

        with patch.object(tushare_fetcher.pro, "daily", return_value=mock_df):
            result = await tushare_fetcher.get_daily_quotes("000001.SZ", "20250126")

            # 验证数据标准化
            assert "volume" in result.columns, "应该将'vol'标准化为'volume'"
            assert "stock_code" in result.columns, "应该添加'stock_code'列"
            assert "trade_date" in result.columns, "应该添加'trade_date'列"

            # 验证数据值
            assert result["volume"].iloc[0] == 1000000, "volume值应该正确"
            assert result["stock_code"].iloc[0] == "000001.SZ", "stock_code应该正确"
            assert result["trade_date"].iloc[0] == "20250126", "trade_date应该正确"

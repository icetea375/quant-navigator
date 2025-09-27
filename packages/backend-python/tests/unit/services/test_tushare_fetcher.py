"""
TushareFetcher 单元测试
测试Tushare数据源的功能
"""

from unittest.mock import Mock, patch

import pandas as pd
import pytest

from src.core.interfaces import DataSourceError
from src.services.data_sources.tushare_fetcher import TushareFetcher


class TestTushareFetcher:
    """TushareFetcher测试类"""

    @pytest.fixture
    def mock_tushare_pro(self):
        """模拟Tushare Pro API"""
        with patch("tushare.pro_api") as mock_pro_api:
            mock_pro = Mock()
            mock_pro_api.return_value = mock_pro
            yield mock_pro

    @pytest.fixture
    def fetcher(self, mock_tushare_pro):
        """创建TushareFetcher实例"""
        with patch("tushare.set_token"):
            return TushareFetcher(token="test_token")

    def test_initialization_with_token(self, mock_tushare_pro):
        """测试使用指定token初始化"""
        with patch("tushare.set_token") as mock_set_token:
            fetcher = TushareFetcher(token="custom_token")

            mock_set_token.assert_called_once_with("custom_token")
            assert fetcher.token == "custom_token"
            assert fetcher.pro == mock_tushare_pro

    def test_initialization_without_token(self, mock_tushare_pro):
        """测试使用默认token初始化"""
        with (
            patch("tushare.set_token") as mock_set_token,
            patch(
                "src.services.data_sources.tushare_fetcher.settings"
            ) as mock_settings,
        ):
            mock_settings.TUSHARE_TOKEN = "default_token"

            fetcher = TushareFetcher()

            mock_set_token.assert_called_once_with("default_token")
            assert fetcher.token == "default_token"

    def test_initialization_failure(self):
        """测试初始化失败"""
        with patch("tushare.set_token", side_effect=Exception("API Error")):
            with pytest.raises(DataSourceError) as exc_info:
                TushareFetcher(token="invalid_token")

            assert "Tushare数据源初始化失败" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_get_daily_quotes_success(self, fetcher, mock_tushare_pro):
        """测试成功获取日线行情数据"""
        # 模拟返回数据
        mock_data = pd.DataFrame(
            {
                "ts_code": ["000001.SZ"],
                "trade_date": ["20240101"],
                "open": [10.0],
                "high": [11.0],
                "low": [9.0],
                "close": [10.5],
                "vol": [1000000],
                "amount": [10500000.0],
            }
        )
        mock_tushare_pro.daily.return_value = mock_data

        result = await fetcher.get_daily_quotes("000001.SZ", "20240101")

        assert isinstance(result, pd.DataFrame)
        assert len(result) == 1
        assert result.iloc[0]["stock_code"] == "000001.SZ"
        assert result.iloc[0]["trade_date"] == "20240101"
        mock_tushare_pro.daily.assert_called_once_with(
            ts_code="000001.SZ", trade_date="20240101"
        )

    @pytest.mark.asyncio
    async def test_get_daily_quotes_failure(self, fetcher, mock_tushare_pro):
        """测试获取日线行情数据失败"""
        mock_tushare_pro.daily.side_effect = Exception("API Error")

        with pytest.raises(DataSourceError) as exc_info:
            await fetcher.get_daily_quotes("000001.SZ", "20240101")

        assert "获取日线行情失败" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_get_announcements_success(self, fetcher, mock_tushare_pro):
        """测试成功获取公告数据"""
        mock_data = pd.DataFrame(
            {
                "ts_code": ["000001.SZ"],
                "ann_date": ["20240101"],
                "title": ["测试公告"],
                "content": ["公告内容"],
            }
        )
        mock_tushare_pro.anns.return_value = mock_data

        result = await fetcher.get_announcements("000001.SZ", "20240101")

        assert isinstance(result, list)
        assert len(result) == 1
        assert result[0]["stock_code"] == "000001.SZ"
        mock_tushare_pro.anns.assert_called_once_with(
            ts_code="000001.SZ", ann_date="20240101"
        )

    @pytest.mark.asyncio
    async def test_get_announcements_failure(self, fetcher, mock_tushare_pro):
        """测试获取公告数据失败"""
        mock_tushare_pro.anns.side_effect = Exception("API Error")

        with pytest.raises(DataSourceError) as exc_info:
            await fetcher.get_announcements("000001.SZ", "20240101")

        assert "获取公告数据失败" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_get_financial_data_success(self, fetcher, mock_tushare_pro):
        """测试成功获取财务数据"""
        mock_income = pd.DataFrame(
            {
                "ts_code": ["000001.SZ"],
                "ann_date": ["20240101"],
                "revenue": [1000000.0],
                "n_income": [100000.0],
            }
        )
        mock_balancesheet = pd.DataFrame(
            {
                "ts_code": ["000001.SZ"],
                "ann_date": ["20240101"],
                "total_assets": [5000000.0],
                "total_liab": [2000000.0],
            }
        )
        mock_cashflow = pd.DataFrame(
            {
                "ts_code": ["000001.SZ"],
                "ann_date": ["20240101"],
                "c_fr_sale_sg": [100000.0],
                "c_paid_goods_s": [50000.0],
            }
        )

        mock_tushare_pro.income.return_value = mock_income
        mock_tushare_pro.balancesheet.return_value = mock_balancesheet
        mock_tushare_pro.cashflow.return_value = mock_cashflow

        result = await fetcher.get_financial_data("000001.SZ", "20240101")

        assert isinstance(result, dict)
        assert "net_profit" in result
        assert "revenue" in result
        assert "net_profit" in result
        assert result["stock_code"] == "000001.SZ"

    @pytest.mark.asyncio
    async def test_get_financial_data_failure(self, fetcher, mock_tushare_pro):
        """测试获取财务数据失败"""
        mock_tushare_pro.income.side_effect = Exception("API Error")

        with pytest.raises(DataSourceError) as exc_info:
            await fetcher.get_financial_data("000001.SZ", "20240101")

        assert "获取财务数据失败" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_get_industry_classification_success(self, fetcher, mock_tushare_pro):
        """测试成功获取行业分类数据"""
        mock_data = pd.DataFrame(
            {
                "ts_code": ["000001.SZ"],
                "industry": ["银行"],
                "area": ["深圳"],
                "market": ["主板"],
            }
        )
        mock_tushare_pro.stock_basic.return_value = mock_data

        result = await fetcher.get_industry_classification("000001.SZ")

        assert isinstance(result, dict)
        assert "industry_code" in result
        assert "industry_name" in result
        assert "classification_source" in result
        mock_tushare_pro.stock_basic.assert_called_once_with(
            ts_code="000001.SZ", fields="ts_code,name,industry,area,market,list_date"
        )

    @pytest.mark.asyncio
    async def test_get_industry_classification_failure(self, fetcher, mock_tushare_pro):
        """测试获取行业分类数据失败"""
        mock_tushare_pro.stock_basic.side_effect = Exception("API Error")

        with pytest.raises(DataSourceError) as exc_info:
            await fetcher.get_industry_classification("000001.SZ")

        assert "获取行业分类数据失败" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_get_concept_data_success(self, fetcher, mock_tushare_pro):
        """测试成功获取概念数据"""
        mock_data = pd.DataFrame(
            {
                "ts_code": ["000001.SZ"],
                "concept_name": ["人工智能"],
                "concept_desc": ["AI相关概念"],
            }
        )
        mock_tushare_pro.concept_detail.return_value = mock_data

        result = await fetcher.get_concept_data("000001.SZ", "20240101")

        assert isinstance(result, list)
        assert len(result) == 1
        assert result[0]["stock_code"] == "000001.SZ"
        mock_tushare_pro.concept_detail.assert_called_once_with(ts_code="000001.SZ")

    @pytest.mark.asyncio
    async def test_get_concept_data_failure(self, fetcher, mock_tushare_pro):
        """测试获取概念数据失败"""
        mock_tushare_pro.concept_detail.side_effect = Exception("API Error")

        with pytest.raises(DataSourceError) as exc_info:
            await fetcher.get_concept_data("000001.SZ", "20240101")

        assert "获取概念数据失败" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_get_market_data_success(self, fetcher, mock_tushare_pro):
        """测试成功获取市场数据"""
        mock_daily_basic = pd.DataFrame(
            {
                "trade_date": ["20240101"],
                "ts_code": ["000001.SZ"],
                "pe": [10.5],
                "pb": [1.2],
                "ps": [2.1],
                "dv_ratio": [3.5],
                "total_mv": [1000000000],
                "turnover_rate": [0.05],
            }
        )
        mock_index_daily = pd.DataFrame(
            {
                "ts_code": ["000001.SH"],
                "trade_date": ["20240101"],
                "close": [3000.0],
                "pct_chg": [1.5],
            }
        )

        mock_tushare_pro.daily_basic.return_value = mock_daily_basic
        mock_tushare_pro.index_daily.return_value = mock_index_daily

        result = await fetcher.get_market_data("20240101")

        assert isinstance(result, dict)
        assert "market_cap" in result
        assert "pe_ratio" in result
        assert "pb_ratio" in result

    @pytest.mark.asyncio
    async def test_get_market_data_failure(self, fetcher, mock_tushare_pro):
        """测试获取市场数据失败"""
        mock_tushare_pro.daily_basic.side_effect = Exception("API Error")

        with pytest.raises(DataSourceError) as exc_info:
            await fetcher.get_market_data("20240101")

        assert "获取市场数据失败" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_health_check_success(self, fetcher, mock_tushare_pro):
        """测试健康检查成功"""
        mock_tushare_pro.stock_basic.return_value = pd.DataFrame(
            {"ts_code": ["000001.SZ"]}
        )

        result = await fetcher.health_check()

        assert isinstance(result, dict)
        assert result["status"] == "healthy"
        assert "last_success" in result
        assert "response_time" in result

    @pytest.mark.asyncio
    async def test_health_check_failure(self, fetcher, mock_tushare_pro):
        """测试健康检查失败"""
        mock_tushare_pro.stock_basic.side_effect = Exception("API Error")

        result = await fetcher.health_check()

        assert isinstance(result, dict)
        assert result["status"] == "unhealthy"
        assert "error_count" in result
        assert "response_time" in result

    def test_logger_initialization(self, fetcher):
        """测试日志器初始化"""
        assert fetcher.logger is not None
        assert fetcher.logger.name == "src.services.data_sources.tushare_fetcher"

    def test_pro_initialization(self, fetcher, mock_tushare_pro):
        """测试Pro API初始化"""
        assert fetcher.pro == mock_tushare_pro

    @pytest.mark.asyncio
    async def test_empty_data_handling(self, fetcher, mock_tushare_pro):
        """测试空数据处理"""
        # 模拟返回空数据
        mock_tushare_pro.daily.return_value = pd.DataFrame()

        result = await fetcher.get_daily_quotes("000001.SZ", "20240101")

        assert isinstance(result, pd.DataFrame)
        assert len(result) == 0

    @pytest.mark.asyncio
    async def test_data_conversion_to_dict(self, fetcher, mock_tushare_pro):
        """测试数据转换为字典格式"""
        mock_data = pd.DataFrame(
            {"ts_code": ["000001.SZ"], "trade_date": ["20240101"], "close": [10.5]}
        )
        mock_tushare_pro.anns.return_value = mock_data

        result = await fetcher.get_announcements("000001.SZ", "20240101")

        assert isinstance(result, list)
        assert isinstance(result[0], dict)
        assert "stock_code" in result[0]
        assert "publish_date" in result[0]
        assert "announcement_type" in result[0]

    @pytest.mark.asyncio
    async def test_get_announcements_empty_data(self, fetcher, mock_tushare_pro):
        """测试获取公告数据时返回空数据的情况"""
        # 模拟返回空DataFrame
        mock_tushare_pro.anns.return_value = pd.DataFrame()

        result = await fetcher.get_announcements("000001.SZ", "20240101")

        assert isinstance(result, list)
        assert len(result) == 0
        mock_tushare_pro.anns.assert_called_once_with(
            ts_code="000001.SZ", ann_date="20240101"
        )

    @pytest.mark.asyncio
    async def test_get_financial_data_empty_data(self, fetcher, mock_tushare_pro):
        """测试获取财务数据时返回空数据的情况"""
        # 模拟返回空DataFrame
        mock_tushare_pro.income.return_value = pd.DataFrame()

        result = await fetcher.get_financial_data("000001.SZ", "20240101")

        assert isinstance(result, dict)
        assert len(result) == 0
        mock_tushare_pro.income.assert_called_once_with(
            ts_code="000001.SZ", period="20240101"
        )

    @pytest.mark.asyncio
    async def test_get_industry_classification_empty_data(
        self, fetcher, mock_tushare_pro
    ):
        """测试获取行业分类数据时返回空数据的情况"""
        # 模拟返回空DataFrame
        mock_tushare_pro.stock_basic.return_value = pd.DataFrame()

        result = await fetcher.get_industry_classification("000001.SZ")

        assert isinstance(result, dict)
        assert len(result) == 0
        mock_tushare_pro.stock_basic.assert_called_once_with(
            ts_code="000001.SZ", fields="ts_code,name,industry,area,market,list_date"
        )

    @pytest.mark.asyncio
    async def test_get_concept_data_empty_data(self, fetcher, mock_tushare_pro):
        """测试获取概念数据时返回空数据的情况"""
        # 模拟返回空DataFrame
        mock_tushare_pro.concept_detail.return_value = pd.DataFrame()

        result = await fetcher.get_concept_data("000001.SZ", "20240101")

        assert isinstance(result, list)
        assert len(result) == 0
        mock_tushare_pro.concept_detail.assert_called_once_with(ts_code="000001.SZ")

    @pytest.mark.asyncio
    async def test_get_market_data_empty_data(self, fetcher, mock_tushare_pro):
        """测试获取市场数据时返回空数据的情况"""
        # 模拟返回空DataFrame
        mock_tushare_pro.daily_basic.return_value = pd.DataFrame()

        result = await fetcher.get_market_data("20240101")

        assert isinstance(result, dict)
        assert len(result) == 0
        mock_tushare_pro.daily_basic.assert_called_once_with(trade_date="20240101")

    def test_standardize_financial_data_empty_dataframe(self, fetcher):
        """测试标准化财务数据时处理空DataFrame的情况"""
        empty_df = pd.DataFrame()
        result = fetcher._standardize_financial_data(empty_df, "000001.SZ", "20240101")

        assert isinstance(result, dict)
        assert len(result) == 0

    def test_standardize_industry_classification_empty_dataframe(self, fetcher):
        """测试标准化行业分类数据时处理空DataFrame的情况"""
        empty_df = pd.DataFrame()
        result = fetcher._standardize_industry_classification(empty_df, "000001.SZ")

        assert isinstance(result, dict)
        assert len(result) == 0

    def test_standardize_market_data_empty_dataframe(self, fetcher):
        """测试标准化市场数据时处理空DataFrame的情况"""
        empty_df = pd.DataFrame()
        result = fetcher._standardize_market_data(empty_df, "20240101")

        assert isinstance(result, dict)
        assert len(result) == 0

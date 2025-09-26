#!/usr/bin/env python3
"""
股票数据加载方法单元测试 - TDD第三步:红灯
测试_load_stock_data方法的快速失败和并行加载功能
"""

import asyncio
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.exceptions.workflow_exceptions import QuantDataProviderError


class MockDatabaseManager:
    """模拟数据库管理器"""
    def __init__(self):
        self.get_financial_data_async = AsyncMock()
        self.get_price_data_async = AsyncMock()
        self.get_news_data_async = AsyncMock()
        self.get_announcement_data_async = AsyncMock()


class MockMainWorkflow:
    """模拟主工作流类"""
    def __init__(self):
        self.logger = MagicMock()
        self.db_manager = MockDatabaseManager()

    async def _load_stock_data(self, stock_code: str, trade_date: str) -> dict:
        """
        加载股票数据 - 快速失败版本,并行加载数据

        Args:
            stock_code: 股票代码
            trade_date: 交易日期

        Returns:
            股票数据字典

        Raises:
            QuantDataProviderError: 当数据加载失败时
        """
        try:
            self.logger.info(f"加载股票数据: {stock_code}")

            # 并行加载所有数据
            tasks = [
                self.db_manager.get_financial_data_async(stock_code, trade_date),
                self.db_manager.get_price_data_async(stock_code, trade_date),
                self.db_manager.get_news_data_async(stock_code, trade_date),
                self.db_manager.get_announcement_data_async(stock_code, trade_date)
            ]

            results = await asyncio.gather(*tasks, return_exceptions=True)

            # 检查是否有异常
            for _i, result in enumerate(results):
                if isinstance(result, Exception):
                    raise QuantDataProviderError(f"数据加载失败: {result}")

            # 构建数据字典
            data = {
                "financial_data": results[0],
                "price_data": results[1],
                "news_data": results[2],
                "announcement_data": results[3],
                "stock_code": stock_code,
                "trade_date": trade_date
            }

            # 验证数据完整性
            if not data["financial_data"] and not data["price_data"]:
                raise QuantDataProviderError(f"股票{stock_code}缺少核心数据")

            return data

        except QuantDataProviderError:
            # 重新抛出业务异常
            raise
        except Exception as e:
            # 快速失败 - 重新抛出异常
            self.logger.error(f"加载股票数据失败: {stock_code} - {e}", exc_info=True)
            raise QuantDataProviderError(f"加载股票数据失败: {stock_code} - {e}") from e


class TestLoadStockData:
    """测试股票数据加载方法"""

    @pytest.fixture
    def mock_workflow(self):
        """创建模拟的工作流实例"""
        return MockMainWorkflow()

    @pytest.mark.asyncio
    async def test_load_stock_data_success(self, mock_workflow):
        """测试成功加载股票数据"""
        # 模拟数据库返回数据
        mock_workflow.db_manager.get_financial_data_async.return_value = {"revenue": 1000}
        mock_workflow.db_manager.get_price_data_async.return_value = {"close": 10.5}
        mock_workflow.db_manager.get_news_data_async.return_value = [{"title": "新闻1"}]
        mock_workflow.db_manager.get_announcement_data_async.return_value = [{"content": "公告1"}]

        stock_code = "000001"
        trade_date = "2025-01-17"
        result = await mock_workflow._load_stock_data(stock_code, trade_date)

        # 验证结果
        assert result["stock_code"] == stock_code
        assert result["trade_date"] == trade_date
        assert result["financial_data"] == {"revenue": 1000}
        assert result["price_data"] == {"close": 10.5}
        assert result["news_data"] == [{"title": "新闻1"}]
        assert result["announcement_data"] == [{"content": "公告1"}]

        # 验证并行调用
        mock_workflow.db_manager.get_financial_data_async.assert_called_once_with(stock_code, trade_date)
        mock_workflow.db_manager.get_price_data_async.assert_called_once_with(stock_code, trade_date)
        mock_workflow.db_manager.get_news_data_async.assert_called_once_with(stock_code, trade_date)
        mock_workflow.db_manager.get_announcement_data_async.assert_called_once_with(stock_code, trade_date)

    @pytest.mark.asyncio
    async def test_load_stock_data_financial_data_failure(self, mock_workflow):
        """测试财务数据加载失败时快速失败"""
        # 模拟财务数据加载失败
        mock_workflow.db_manager.get_financial_data_async.side_effect = Exception("财务数据错误")

        # 其他数据正常
        mock_workflow.db_manager.get_price_data_async.return_value = {"close": 10.5}
        mock_workflow.db_manager.get_news_data_async.return_value = []
        mock_workflow.db_manager.get_announcement_data_async.return_value = []

        stock_code = "000001"
        trade_date = "2025-01-17"

        # 验证抛出QuantDataProviderError
        with pytest.raises(QuantDataProviderError) as exc_info:
            await mock_workflow._load_stock_data(stock_code, trade_date)

        assert "数据加载失败" in str(exc_info.value)
        assert "财务数据错误" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_load_stock_data_price_data_failure(self, mock_workflow):
        """测试价格数据加载失败时快速失败"""
        # 模拟价格数据加载失败
        mock_workflow.db_manager.get_price_data_async.side_effect = Exception("价格数据错误")

        # 其他数据正常
        mock_workflow.db_manager.get_financial_data_async.return_value = {"revenue": 1000}
        mock_workflow.db_manager.get_news_data_async.return_value = []
        mock_workflow.db_manager.get_announcement_data_async.return_value = []

        stock_code = "000001"
        trade_date = "2025-01-17"

        # 验证抛出QuantDataProviderError
        with pytest.raises(QuantDataProviderError) as exc_info:
            await mock_workflow._load_stock_data(stock_code, trade_date)

        assert "数据加载失败" in str(exc_info.value)
        assert "价格数据错误" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_load_stock_data_no_core_data(self, mock_workflow):
        """测试缺少核心数据时快速失败"""
        # 模拟所有数据都为空
        mock_workflow.db_manager.get_financial_data_async.return_value = None
        mock_workflow.db_manager.get_price_data_async.return_value = None
        mock_workflow.db_manager.get_news_data_async.return_value = []
        mock_workflow.db_manager.get_announcement_data_async.return_value = []

        stock_code = "000001"
        trade_date = "2025-01-17"

        # 验证抛出QuantDataProviderError
        with pytest.raises(QuantDataProviderError) as exc_info:
            await mock_workflow._load_stock_data(stock_code, trade_date)

        assert "缺少核心数据" in str(exc_info.value)
        assert stock_code in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_load_stock_data_with_financial_data_only(self, mock_workflow):
        """测试只有财务数据时成功"""
        # 模拟只有财务数据
        mock_workflow.db_manager.get_financial_data_async.return_value = {"revenue": 1000}
        mock_workflow.db_manager.get_price_data_async.return_value = None
        mock_workflow.db_manager.get_news_data_async.return_value = []
        mock_workflow.db_manager.get_announcement_data_async.return_value = []

        stock_code = "000001"
        trade_date = "2025-01-17"
        result = await mock_workflow._load_stock_data(stock_code, trade_date)

        # 验证结果
        assert result["financial_data"] == {"revenue": 1000}
        assert result["price_data"] is None
        assert result["news_data"] == []
        assert result["announcement_data"] == []

    @pytest.mark.asyncio
    async def test_load_stock_data_with_price_data_only(self, mock_workflow):
        """测试只有价格数据时成功"""
        # 模拟只有价格数据
        mock_workflow.db_manager.get_financial_data_async.return_value = None
        mock_workflow.db_manager.get_price_data_async.return_value = {"close": 10.5}
        mock_workflow.db_manager.get_news_data_async.return_value = []
        mock_workflow.db_manager.get_announcement_data_async.return_value = []

        stock_code = "000001"
        trade_date = "2025-01-17"
        result = await mock_workflow._load_stock_data(stock_code, trade_date)

        # 验证结果
        assert result["financial_data"] is None
        assert result["price_data"] == {"close": 10.5}
        assert result["news_data"] == []
        assert result["announcement_data"] == []

    @pytest.mark.asyncio
    async def test_load_stock_data_parallel_execution(self, mock_workflow):
        """测试并行执行"""
        # 模拟所有数据都有延迟
        async def delayed_financial_data(_stock_code,_trade_datee):
            await asyncio.sleep(0.1)
            return {"revenue": 1000}

        async def delayed_price_data(_stock_code,_trade_datee):
            await asyncio.sleep(0.1)
            return {"close": 10.5}

        async def delayed_news_data(_stock_code,_trade_datee):
            await asyncio.sleep(0.1)
            return [{"title": "新闻1"}]

        async def delayed_announcement_data(_stock_code,_trade_datee):
            await asyncio.sleep(0.1)
            return [{"content": "公告1"}]

        mock_workflow.db_manager.get_financial_data_async.side_effect = delayed_financial_data
        mock_workflow.db_manager.get_price_data_async.side_effect = delayed_price_data
        mock_workflow.db_manager.get_news_data_async.side_effect = delayed_news_data
        mock_workflow.db_manager.get_announcement_data_async.side_effect = delayed_announcement_data

        stock_code = "000001"
        trade_date = "2025-01-17"

        # 记录开始时间
        start_time = datetime.now()
        result = await mock_workflow._load_stock_data(stock_code, trade_date)
        end_time = datetime.now()

        # 验证结果
        assert result["stock_code"] == stock_code
        assert result["trade_date"] == trade_date

        # 验证并行执行(总时间应该接近0.1秒,而不是0.4秒)
        execution_time = (end_time - start_time).total_seconds()
        assert execution_time < 0.15  # 允许一些误差

    @pytest.mark.asyncio
    async def test_load_stock_data_logging(self, mock_workflow):
        """测试日志记录"""
        mock_workflow.db_manager.get_financial_data_async.return_value = {"revenue": 1000}
        mock_workflow.db_manager.get_price_data_async.return_value = {"close": 10.5}
        mock_workflow.db_manager.get_news_data_async.return_value = []
        mock_workflow.db_manager.get_announcement_data_async.return_value = []

        stock_code = "000001"
        trade_date = "2025-01-17"
        await mock_workflow._load_stock_data(stock_code, trade_date)

        # 验证日志调用
        mock_workflow.logger.info.assert_called_with(f"加载股票数据: {stock_code}")

    @pytest.mark.asyncio
    async def test_load_stock_data_exception_logging(self, mock_workflow):
        """测试异常时的日志记录"""
        mock_workflow.db_manager.get_financial_data_async.side_effect = ValueError("测试错误")
        mock_workflow.db_manager.get_price_data_async.return_value = {"close": 10.5}
        mock_workflow.db_manager.get_news_data_async.return_value = []
        mock_workflow.db_manager.get_announcement_data_async.return_value = []

        stock_code = "000001"
        trade_date = "2025-01-17"

        with pytest.raises(QuantDataProviderError):
            await mock_workflow._load_stock_data(stock_code, trade_date)

        # 验证info日志被调用
        mock_workflow.logger.info.assert_called_with(f"加载股票数据: {stock_code}")

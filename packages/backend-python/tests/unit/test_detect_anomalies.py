#!/usr/bin/env python3
"""
异常检测方法单元测试 - TDD第二步:红灯
测试_detect_anomalies方法的快速失败和并行检测功能
"""

import asyncio
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.exceptions.workflow_exceptions import QuantDataProviderError
from src.main_workflow import MainWorkflow


class TestDetectAnomalies:
    """测试异常检测方法"""

    @pytest.fixture
    def mock_workflow(self):
        """创建模拟的工作流实例"""
        config = {
            "quant_engine": {},
            "data_pipeline": {},
            "database": {},
            "llm_service": {
                "qwen": {
                    "api_key": "test_qwen_key"
                },
                "doubao": {
                    "api_key": "test_doubao_key"
                }
            }
        }
        workflow = MainWorkflow(config)
        workflow.logger = MagicMock()
        return workflow

    @pytest.mark.asyncio
    async def test_detect_anomalies_success(self, mock_workflow):
        """测试成功检测异常股票"""
        # 模拟量化引擎返回异常股票
        mock_workflow.quant_engine = AsyncMock()
        mock_workflow.quant_engine.detect_anomalies_async.return_value = ["000001", "000002"]

        # 模拟数据管道返回异常股票
        mock_workflow.data_pipeline = AsyncMock()
        mock_workflow.data_pipeline.get_price_anomalies_async.return_value = ["000002", "600036"]

        trade_date = "2025-01-17"
        result = await mock_workflow._detect_anomalies(trade_date)

        # 验证结果
        assert len(result) == 3  # 去重后应该有3只股票
        assert "000001" in result
        assert "000002" in result
        assert "600036" in result

        # 验证并行调用
        mock_workflow.quant_engine.detect_anomalies_async.assert_called_once_with(trade_date)
        mock_workflow.data_pipeline.get_price_anomalies_async.assert_called_once_with(trade_date)

    @pytest.mark.asyncio
    async def test_detect_anomalies_quant_engine_failure(self, mock_workflow):
        """测试量化引擎失败时快速失败"""
        # 模拟量化引擎抛出异常
        mock_workflow.quant_engine = AsyncMock()
        mock_workflow.quant_engine.detect_anomalies_async.side_effect = Exception("量化引擎错误")

        # 模拟数据管道正常
        mock_workflow.data_pipeline = AsyncMock()
        mock_workflow.data_pipeline.get_price_anomalies_async.return_value = ["600036"]

        trade_date = "2025-01-17"

        # 验证抛出QuantDataProviderError
        with pytest.raises(QuantDataProviderError) as exc_info:
            await mock_workflow._detect_anomalies(trade_date)

        assert "异常检测失败" in str(exc_info.value)
        assert "量化引擎错误" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_detect_anomalies_data_pipeline_failure(self, mock_workflow):
        """测试数据管道失败时快速失败"""
        # 模拟量化引擎正常
        mock_workflow.quant_engine = AsyncMock()
        mock_workflow.quant_engine.detect_anomalies_async.return_value = ["000001"]

        # 模拟数据管道抛出异常
        mock_workflow.data_pipeline = AsyncMock()
        mock_workflow.data_pipeline.get_price_anomalies_async.side_effect = Exception("数据管道错误")

        trade_date = "2025-01-17"

        # 验证抛出QuantDataProviderError
        with pytest.raises(QuantDataProviderError) as exc_info:
            await mock_workflow._detect_anomalies(trade_date)

        assert "异常检测失败" in str(exc_info.value)
        assert "数据管道错误" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_detect_anomalies_no_anomalies_found(self, mock_workflow):
        """测试未检测到异常股票时快速失败"""
        # 模拟两个引擎都返回空列表
        mock_workflow.quant_engine = AsyncMock()
        mock_workflow.quant_engine.detect_anomalies_async.return_value = []

        mock_workflow.data_pipeline = AsyncMock()
        mock_workflow.data_pipeline.get_price_anomalies_async.return_value = []

        trade_date = "2025-01-17"

        # 验证抛出QuantDataProviderError
        with pytest.raises(QuantDataProviderError) as exc_info:
            await mock_workflow._detect_anomalies(trade_date)

        assert "未检测到任何异常股票" in str(exc_info.value)
        assert trade_date in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_detect_anomalies_parallel_execution(self, mock_workflow):
        """测试并行执行"""
        # 模拟两个引擎都有延迟
        async def delayed_quant_engine(_trade_date):
            await asyncio.sleep(0.1)
            return ["000001"]

        async def delayed_data_pipeline(_trade_date):
            await asyncio.sleep(0.1)
            return ["000002"]

        mock_workflow.quant_engine = AsyncMock()
        mock_workflow.quant_engine.detect_anomalies_async.side_effect = delayed_quant_engine

        mock_workflow.data_pipeline = AsyncMock()
        mock_workflow.data_pipeline.get_price_anomalies_async.side_effect = delayed_data_pipeline

        trade_date = "2025-01-17"

        # 记录开始时间
        start_time = datetime.now()
        result = await mock_workflow._detect_anomalies(trade_date)
        end_time = datetime.now()

        # 验证结果
        assert len(result) == 2
        assert "000001" in result
        assert "000002" in result

        # 验证并行执行(总时间应该接近0.1秒,而不是0.2秒)
        execution_time = (end_time - start_time).total_seconds()
        assert execution_time < 0.15  # 允许一些误差

    @pytest.mark.asyncio
    async def test_detect_anomalies_logging(self, mock_workflow):
        """测试日志记录"""
        mock_workflow.quant_engine = AsyncMock()
        mock_workflow.quant_engine.detect_anomalies_async.return_value = ["000001"]

        mock_workflow.data_pipeline = AsyncMock()
        mock_workflow.data_pipeline.get_price_anomalies_async.return_value = ["000002"]

        trade_date = "2025-01-17"
        await mock_workflow._detect_anomalies(trade_date)

        # 验证日志调用
        mock_workflow.logger.info.assert_any_call(f"开始检测{trade_date}的异常股票")
        mock_workflow.logger.info.assert_any_call("检测到2只异常股票")

    @pytest.mark.asyncio
    async def test_detect_anomalies_exception_logging(self, mock_workflow):
        """测试异常时的日志记录"""
        # 模拟一个会导致asyncio.gather本身失败的异常
        mock_workflow.quant_engine = AsyncMock()
        mock_workflow.quant_engine.detect_anomalies_async.side_effect = Exception("测试错误")

        mock_workflow.data_pipeline = AsyncMock()
        mock_workflow.data_pipeline.get_price_anomalies_async.side_effect = Exception("数据管道错误")

        # 模拟asyncio.gather失败
        with patch('asyncio.gather', side_effect=Exception("gather失败")):
            trade_date = "2025-01-17"

            with pytest.raises(QuantDataProviderError):
                await mock_workflow._detect_anomalies(trade_date)

            # 验证错误日志
            mock_workflow.logger.critical.assert_called_once()
            assert "异常检测失败" in str(mock_workflow.logger.critical.call_args)

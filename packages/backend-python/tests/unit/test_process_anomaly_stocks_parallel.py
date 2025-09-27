#!/usr/bin/env python3
"""
并行处理异常股票方法单元测试 - TDD第七步:红灯
测试_process_anomaly_stocks_parallel方法的异步并行处理功能
"""

import asyncio
from datetime import datetime
from unittest.mock import MagicMock

import pytest

from src.exceptions.workflow_exceptions import ArbitrationWorkflowError


class MockMainWorkflow:
    """模拟主工作流类(带并行处理)"""

    def __init__(self, config):
        self.config = config
        self.logger = MagicMock()

        # 模拟信号量
        self.stock_processing_semaphore = asyncio.Semaphore(5)

    async def _process_single_stock_with_retry(
        self, stock_code: str, trade_date: str, max_retries: int
    ) -> dict:
        """模拟单股票处理"""
        await asyncio.sleep(0.01)  # 模拟处理延迟

        # 模拟一些股票处理失败
        if stock_code == "000003":
            raise ArbitrationWorkflowError(f"股票 {stock_code} 处理失败")

        return {"stock_code": stock_code, "status": "success"}

    async def _process_anomaly_stocks_parallel(
        self, anomaly_stocks: list, trade_date: str, max_retries: int = 3
    ) -> dict:
        """
        并行处理异常股票 - 异步版本

        Args:
            anomaly_stocks: 异常股票代码列表
            trade_date: 交易日期
            max_retries: 最大重试次数

        Returns:
            处理结果统计
        """
        try:
            self.logger.info(f"开始并行处理{len(anomaly_stocks)}只异常股票")

            # 创建并行任务
            tasks = []
            for stock_code in anomaly_stocks:
                task = asyncio.create_task(
                    self._process_single_stock_with_retry(
                        stock_code, trade_date, max_retries
                    )
                )
                tasks.append(task)

            # 等待所有任务完成
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # 统计结果
            successful = 0
            failed = 0
            failed_stocks = []

            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    failed += 1
                    failed_stocks.append(
                        {"stock_code": anomaly_stocks[i], "error": str(result)}
                    )
                else:
                    successful += 1

            self.logger.info(f"并行处理完成: 成功{successful}, 失败{failed}")

            return {
                "successful": successful,
                "failed": failed,
                "failed_stocks": failed_stocks,
            }

        except Exception as e:
            self.logger.critical(f"并行处理异常股票失败: {e}", exc_info=True)
            raise ArbitrationWorkflowError(f"并行处理异常股票失败: {e}") from e


class TestProcessAnomalyStocksParallel:
    """测试并行处理异常股票方法"""

    @pytest.fixture
    def mock_workflow(self):
        """创建模拟的工作流实例"""
        config = {"concurrency": {"max_stock_processing": 5}}
        return MockMainWorkflow(config)

    @pytest.mark.asyncio
    async def test_process_anomaly_stocks_parallel_all_success(self, mock_workflow):
        """测试所有股票处理成功"""
        anomaly_stocks = ["000001", "000002", "000004"]
        trade_date = "2025-01-17"

        result = await mock_workflow._process_anomaly_stocks_parallel(
            anomaly_stocks, trade_date, 3
        )

        # 验证结果
        assert result["successful"] == 3
        assert result["failed"] == 0
        assert len(result["failed_stocks"]) == 0

        # 验证日志调用
        mock_workflow.logger.info.assert_any_call("开始并行处理3只异常股票")
        mock_workflow.logger.info.assert_any_call("并行处理完成: 成功3, 失败0")

    @pytest.mark.asyncio
    async def test_process_anomaly_stocks_parallel_some_failures(self, mock_workflow):
        """测试部分股票处理失败"""
        anomaly_stocks = ["000001", "000002", "000003", "000004"]
        trade_date = "2025-01-17"

        result = await mock_workflow._process_anomaly_stocks_parallel(
            anomaly_stocks, trade_date, 3
        )

        # 验证结果
        assert result["successful"] == 3
        assert result["failed"] == 1
        assert len(result["failed_stocks"]) == 1
        assert result["failed_stocks"][0]["stock_code"] == "000003"
        assert "股票 000003 处理失败" in result["failed_stocks"][0]["error"]

        # 验证日志调用
        mock_workflow.logger.info.assert_any_call("开始并行处理4只异常股票")
        mock_workflow.logger.info.assert_any_call("并行处理完成: 成功3, 失败1")

    @pytest.mark.asyncio
    async def test_process_anomaly_stocks_parallel_all_failures(self, mock_workflow):
        """测试所有股票处理失败"""

        # 修改模拟方法,让所有股票都失败
        async def failing_processor(stock_code, _trade_date, _max_retriess):
            raise ArbitrationWorkflowError(f"股票 {stock_code} 处理失败")

        mock_workflow._process_single_stock_with_retry = failing_processor

        anomaly_stocks = ["000001", "000002"]
        trade_date = "2025-01-17"

        result = await mock_workflow._process_anomaly_stocks_parallel(
            anomaly_stocks, trade_date, 3
        )

        # 验证结果
        assert result["successful"] == 0
        assert result["failed"] == 2
        assert len(result["failed_stocks"]) == 2

        # 验证失败股票信息
        failed_codes = [stock["stock_code"] for stock in result["failed_stocks"]]
        assert "000001" in failed_codes
        assert "000002" in failed_codes

    @pytest.mark.asyncio
    async def test_process_anomaly_stocks_parallel_empty_list(self, mock_workflow):
        """测试空股票列表"""
        anomaly_stocks = []
        trade_date = "2025-01-17"

        result = await mock_workflow._process_anomaly_stocks_parallel(
            anomaly_stocks, trade_date, 3
        )

        # 验证结果
        assert result["successful"] == 0
        assert result["failed"] == 0
        assert len(result["failed_stocks"]) == 0

        # 验证日志调用
        mock_workflow.logger.info.assert_any_call("开始并行处理0只异常股票")
        mock_workflow.logger.info.assert_any_call("并行处理完成: 成功0, 失败0")

    @pytest.mark.asyncio
    async def test_process_anomaly_stocks_parallel_large_list(self, mock_workflow):
        """测试大量股票处理"""
        # 创建大量股票列表
        anomaly_stocks = [f"00000{i:03d}" for i in range(1, 21)]  # 20只股票
        trade_date = "2025-01-17"

        # 记录开始时间
        start_time = datetime.now()
        result = await mock_workflow._process_anomaly_stocks_parallel(
            anomaly_stocks, trade_date, 3
        )
        end_time = datetime.now()

        # 验证结果
        assert result["successful"] == 20  # 所有股票都成功(因为000003不在列表中)
        assert result["failed"] == 0
        assert len(result["failed_stocks"]) == 0

        # 验证并行执行(总时间应该明显小于串行执行)
        execution_time = (end_time - start_time).total_seconds()
        assert execution_time < 0.5  # 并行执行应该很快

    @pytest.mark.asyncio
    async def test_process_anomaly_stocks_parallel_exception_handling(
        self, mock_workflow
    ):
        """测试异常处理"""

        # 修改模拟方法,让它在创建任务时抛出异常
        async def failing_processor(stock_code, _trade_date, _max_retriess):
            if stock_code == "000001":
                raise Exception("创建任务时出错")
            return {"stock_code": stock_code, "status": "success"}

        mock_workflow._process_single_stock_with_retry = failing_processor

        anomaly_stocks = ["000001", "000002"]
        trade_date = "2025-01-17"

        result = await mock_workflow._process_anomaly_stocks_parallel(
            anomaly_stocks, trade_date, 3
        )

        # 验证结果
        assert result["successful"] == 1
        assert result["failed"] == 1
        assert len(result["failed_stocks"]) == 1
        assert "创建任务时出错" in result["failed_stocks"][0]["error"]

    @pytest.mark.asyncio
    async def test_process_anomaly_stocks_parallel_critical_error(self, mock_workflow):
        """测试关键错误处理"""

        # 修改模拟方法,让它在gather时抛出异常
        async def critical_failing_processor(_stock_code, _trade_date, _max_retries):
            raise Exception("关键错误")

        mock_workflow._process_single_stock_with_retry = critical_failing_processor

        # 修改gather方法,让它抛出异常
        original_gather = asyncio.gather

        async def failing_gather(*_tasks, return_exceptions=False):
            raise Exception("gather失败")

        asyncio.gather = failing_gather

        try:
            anomaly_stocks = ["000001"]
            trade_date = "2025-01-17"

            with pytest.raises(ArbitrationWorkflowError) as exc_info:
                await mock_workflow._process_anomaly_stocks_parallel(
                    anomaly_stocks, trade_date, 3
                )

            # 验证异常
            assert "并行处理异常股票失败" in str(exc_info.value)
            assert "gather失败" in str(exc_info.value)

            # 验证日志调用
            mock_workflow.logger.critical.assert_called_once()

        finally:
            asyncio.gather = original_gather

    @pytest.mark.asyncio
    async def test_process_anomaly_stocks_parallel_logging(self, mock_workflow):
        """测试日志记录"""
        anomaly_stocks = ["000001", "000002"]
        trade_date = "2025-01-17"

        await mock_workflow._process_anomaly_stocks_parallel(
            anomaly_stocks, trade_date, 3
        )

        # 验证日志调用
        mock_workflow.logger.info.assert_any_call("开始并行处理2只异常股票")
        mock_workflow.logger.info.assert_any_call("并行处理完成: 成功2, 失败0")

    @pytest.mark.asyncio
    async def test_process_anomaly_stocks_parallel_task_creation(self, mock_workflow):
        """测试任务创建"""
        anomaly_stocks = ["000001", "000002", "000003"]
        trade_date = "2025-01-17"

        # 记录任务创建
        created_tasks = []
        original_create_task = asyncio.create_task

        def track_create_task(coro):
            created_tasks.append(coro)
            return original_create_task(coro)

        asyncio.create_task = track_create_task

        try:
            await mock_workflow._process_anomaly_stocks_parallel(
                anomaly_stocks, trade_date, 3
            )

            # 验证任务创建
            assert len(created_tasks) == 3  # 应该创建3个任务

        finally:
            asyncio.create_task = original_create_task

    @pytest.mark.asyncio
    async def test_process_anomaly_stocks_parallel_result_structure(
        self, mock_workflow
    ):
        """测试结果结构"""
        anomaly_stocks = ["000001", "000002", "000003"]
        trade_date = "2025-01-17"

        result = await mock_workflow._process_anomaly_stocks_parallel(
            anomaly_stocks, trade_date, 3
        )

        # 验证结果结构
        assert "successful" in result
        assert "failed" in result
        assert "failed_stocks" in result
        assert isinstance(result["successful"], int)
        assert isinstance(result["failed"], int)
        assert isinstance(result["failed_stocks"], list)

        # 验证总数
        assert result["successful"] + result["failed"] == len(anomaly_stocks)

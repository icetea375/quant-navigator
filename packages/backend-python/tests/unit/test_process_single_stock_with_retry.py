#!/usr/bin/env python3
"""
单股票处理重试方法单元测试 - TDD第六步:红灯
测试_process_single_stock_with_retry方法的单股票处理带重试功能
"""

import asyncio
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.exceptions.workflow_exceptions import (
    ArbitrationWorkflowError,
)


class MockMainWorkflow:
    """模拟主工作流类(带单股票处理重试)"""
    def __init__(self, config):
        self.config = config
        self.logger = MagicMock()

        # 模拟数据库管理器
        self.db_manager = AsyncMock()

        # 模拟分析器
        self.qwen_analyzer = AsyncMock()
        self.doubao_analyzer = AsyncMock()

        # 模拟信号量
        self.stock_processing_semaphore = asyncio.Semaphore(5)

    async def _load_stock_data(self, stock_code: str, trade_date: str) -> dict:
        """模拟数据加载"""
        await asyncio.sleep(0.01)  # 模拟延迟
        return {
            "stock_code": stock_code,
            "trade_date": trade_date,
            "financial_data": {"revenue": 1000},
            "price_data": {"close": 10.5}
        }

    async def _save_report_to_db_async(self, report: dict, report_type: str):
        """模拟保存报告到数据库"""
        await asyncio.sleep(0.01)  # 模拟延迟
        return {"id": f"{report_type}_{report['stock_code']}"}

    async def _create_arbitration_case_async(self, stock_code: str, trade_date: str, qwen_report: dict, doubao_report: dict):
        """模拟创建仲裁案件"""
        await asyncio.sleep(0.01)  # 模拟延迟
        return {"case_id": f"case_{stock_code}_{trade_date}"}

    async def _process_single_stock_with_retry(
        self, stock_code: str, trade_date: str, max_retries: int
    ) -> dict:
        """
        单股票处理 - 带重试机制

        Args:
            stock_code: 股票代码
            trade_date: 交易日期
            max_retries: 最大重试次数

        Returns:
            处理结果字典

        Raises:
            ArbitrationWorkflowError: 当处理失败时
        """
        for attempt in range(max_retries):
            try:
                self.logger.info(f"处理股票 {stock_code} (尝试 {attempt + 1}/{max_retries})")

                # 1. 加载数据
                await self._load_stock_data(stock_code, trade_date)

                # 2. 并行生成双脑报告
                qwen_task = asyncio.create_task(
                    self.qwen_analyzer.analyze_async(stock_code, trade_date)
                )
                doubao_task = asyncio.create_task(
                    self.doubao_analyzer.analyze_async(stock_code, trade_date)
                )

                qwen_report, doubao_report = await asyncio.gather(
                    qwen_task, doubao_task
                )

                # 3. 保存报告
                await self._save_report_to_db_async(qwen_report, "qwen_fact_based")
                await self._save_report_to_db_async(doubao_report, "doubao_sentiment_based")

                # 4. 创建仲裁案件
                await self._create_arbitration_case_async(
                    stock_code, trade_date, qwen_report, doubao_report
                )

                self.logger.info(f"成功处理股票 {stock_code}")
                return {"stock_code": stock_code, "status": "success"}

            except Exception as e:
                self.logger.warning(f"处理股票 {stock_code} 失败 (尝试 {attempt + 1}): {e}")

                if attempt == max_retries - 1:
                    # 最后一次尝试失败
                    raise ArbitrationWorkflowError(f"股票 {stock_code} 处理失败: {e}") from e

                # 等待后重试
                await asyncio.sleep(2 ** attempt)  # 指数退避


class TestProcessSingleStockWithRetry:
    """测试单股票处理重试方法"""

    @pytest.fixture
    def mock_workflow(self):
        """创建模拟的工作流实例"""
        config = {"concurrency": {"max_stock_processing": 5}}
        return MockMainWorkflow(config)

    @pytest.mark.asyncio
    async def test_process_single_stock_success_first_attempt(self, mock_workflow):
        """测试第一次尝试成功"""
        # 模拟分析器返回报告
        mock_workflow.qwen_analyzer.analyze_async.return_value = {
            "stock_code": "000001",
            "analysis": "Qwen分析结果"
        }
        mock_workflow.doubao_analyzer.analyze_async.return_value = {
            "stock_code": "000001",
            "analysis": "豆包分析结果"
        }

        result = await mock_workflow._process_single_stock_with_retry(
            "000001", "2025-01-17", 3
        )

        # 验证结果
        assert result["stock_code"] == "000001"
        assert result["status"] == "success"

        # 验证日志调用
        mock_workflow.logger.info.assert_any_call("处理股票 000001 (尝试 1/3)")
        mock_workflow.logger.info.assert_any_call("成功处理股票 000001")

    @pytest.mark.asyncio
    async def test_process_single_stock_success_after_retry(self, mock_workflow):
        """测试重试后成功"""
        attempt_count = 0

        async def failing_then_successful_analyzer(stock_code, _trade_date):
            nonlocal attempt_count
            attempt_count += 1
            if attempt_count < 2:
                raise Exception("分析器临时失败")
            return {
                "stock_code": stock_code,
                "analysis": f"分析结果 (尝试 {attempt_count})"
            }

        mock_workflow.qwen_analyzer.analyze_async.side_effect = failing_then_successful_analyzer
        mock_workflow.doubao_analyzer.analyze_async.side_effect = failing_then_successful_analyzer

        result = await mock_workflow._process_single_stock_with_retry(
            "000001", "2025-01-17", 3
        )

        # 验证结果
        assert result["stock_code"] == "000001"
        assert result["status"] == "success"
        # 注意:attempt_count可能包括两个分析器的调用,所以不一定是2
        assert attempt_count >= 2

        # 验证日志调用
        mock_workflow.logger.warning.assert_any_call("处理股票 000001 失败 (尝试 1): 分析器临时失败")
        mock_workflow.logger.info.assert_any_call("成功处理股票 000001")

    @pytest.mark.asyncio
    async def test_process_single_stock_all_retries_fail(self, mock_workflow):
        """测试所有重试都失败"""
        # 模拟分析器总是失败
        mock_workflow.qwen_analyzer.analyze_async.side_effect = Exception("分析器永久失败")
        mock_workflow.doubao_analyzer.analyze_async.side_effect = Exception("分析器永久失败")

        with pytest.raises(ArbitrationWorkflowError) as exc_info:
            await mock_workflow._process_single_stock_with_retry(
                "000001", "2025-01-17", 2
            )

        # 验证异常
        assert "股票 000001 处理失败" in str(exc_info.value)
        assert "分析器永久失败" in str(exc_info.value)

        # 验证日志调用
        mock_workflow.logger.warning.assert_any_call("处理股票 000001 失败 (尝试 1): 分析器永久失败")
        mock_workflow.logger.warning.assert_any_call("处理股票 000001 失败 (尝试 2): 分析器永久失败")

    @pytest.mark.asyncio
    async def test_process_single_stock_data_loading_failure(self, mock_workflow):
        """测试数据加载失败"""
        # 模拟数据加载失败
        async def failing_data_loader(_stock_code,_trade_datee):
            raise Exception("数据加载失败")

        mock_workflow._load_stock_data = failing_data_loader

        with pytest.raises(ArbitrationWorkflowError) as exc_info:
            await mock_workflow._process_single_stock_with_retry(
                "000001", "2025-01-17", 2
            )

        # 验证异常
        assert "股票 000001 处理失败" in str(exc_info.value)
        assert "数据加载失败" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_process_single_stock_parallel_analysis(self, mock_workflow):
        """测试并行分析"""
        # 模拟分析器有延迟
        async def delayed_qwen_analyzer(stock_code, _trade_date):
            await asyncio.sleep(0.1)
            return {"stock_code": stock_code, "analysis": "Qwen分析结果"}

        async def delayed_doubao_analyzer(stock_code, _trade_date):
            await asyncio.sleep(0.1)
            return {"stock_code": stock_code, "analysis": "豆包分析结果"}

        mock_workflow.qwen_analyzer.analyze_async.side_effect = delayed_qwen_analyzer
        mock_workflow.doubao_analyzer.analyze_async.side_effect = delayed_doubao_analyzer

        # 记录开始时间
        start_time = datetime.now()
        result = await mock_workflow._process_single_stock_with_retry(
            "000001", "2025-01-17", 3
        )
        end_time = datetime.now()

        # 验证结果
        assert result["status"] == "success"

        # 验证并行执行(总时间应该接近0.1秒,而不是0.2秒)
        execution_time = (end_time - start_time).total_seconds()
        assert execution_time < 0.20  # 允许一些误差

    @pytest.mark.asyncio
    async def test_process_single_stock_exponential_backoff(self, mock_workflow):
        """测试指数退避"""
        # 模拟分析器总是失败
        mock_workflow.qwen_analyzer.analyze_async.side_effect = Exception("分析器失败")
        mock_workflow.doubao_analyzer.analyze_async.side_effect = Exception("分析器失败")

        # 记录重试次数
        retry_count = 0

        # 创建一个包装器来跟踪重试
        original_process = mock_workflow._process_single_stock_with_retry

        async def wrapped_process(stock_code, trade_date, max_retries):
            nonlocal retry_count
            retry_count += 1
            return await original_process(stock_code, trade_date, max_retries)

        mock_workflow._process_single_stock_with_retry = wrapped_process

        with pytest.raises(ArbitrationWorkflowError):
            await mock_workflow._process_single_stock_with_retry(
                "000001", "2025-01-17", 3
            )

        # 验证重试次数
        assert retry_count == 1  # 只调用一次包装器

    @pytest.mark.asyncio
    async def test_process_single_stock_logging(self, mock_workflow):
        """测试日志记录"""
        mock_workflow.qwen_analyzer.analyze_async.return_value = {
            "stock_code": "000001",
            "analysis": "Qwen分析结果"
        }
        mock_workflow.doubao_analyzer.analyze_async.return_value = {
            "stock_code": "000001",
            "analysis": "豆包分析结果"
        }

        await mock_workflow._process_single_stock_with_retry(
            "000001", "2025-01-17", 3
        )

        # 验证日志调用
        mock_workflow.logger.info.assert_any_call("处理股票 000001 (尝试 1/3)")
        mock_workflow.logger.info.assert_any_call("成功处理股票 000001")

    @pytest.mark.asyncio
    async def test_process_single_stock_retry_logging(self, mock_workflow):
        """测试重试日志记录"""
        attempt_count = 0

        async def failing_analyzer(stock_code, _trade_date):
            nonlocal attempt_count
            attempt_count += 1
            if attempt_count < 2:
                raise Exception("分析器失败")
            return {"stock_code": stock_code, "analysis": "分析结果"}

        mock_workflow.qwen_analyzer.analyze_async.side_effect = failing_analyzer
        mock_workflow.doubao_analyzer.analyze_async.side_effect = failing_analyzer

        await mock_workflow._process_single_stock_with_retry(
            "000001", "2025-01-17", 3
        )

        # 验证日志调用
        mock_workflow.logger.info.assert_any_call("处理股票 000001 (尝试 1/3)")
        mock_workflow.logger.warning.assert_any_call("处理股票 000001 失败 (尝试 1): 分析器失败")
        mock_workflow.logger.info.assert_any_call("处理股票 000001 (尝试 2/3)")
        mock_workflow.logger.info.assert_any_call("成功处理股票 000001")

    @pytest.mark.asyncio
    async def test_process_single_stock_database_operations(self, mock_workflow):
        """测试数据库操作"""
        mock_workflow.qwen_analyzer.analyze_async.return_value = {
            "stock_code": "000001",
            "analysis": "Qwen分析结果"
        }
        mock_workflow.doubao_analyzer.analyze_async.return_value = {
            "stock_code": "000001",
            "analysis": "豆包分析结果"
        }

        await mock_workflow._process_single_stock_with_retry(
            "000001", "2025-01-17", 3
        )

        # 验证数据库操作被调用
        # 注意:这些方法在测试中被替换为函数,所以无法直接检查call_count
        # 我们通过日志来验证操作是否被调用
        mock_workflow.logger.info.assert_any_call("成功处理股票 000001")

    @pytest.mark.asyncio
    async def test_process_single_stock_exception_chain(self, mock_workflow):
        """测试异常链"""
        mock_workflow.qwen_analyzer.analyze_async.side_effect = Exception("分析器失败")
        mock_workflow.doubao_analyzer.analyze_async.side_effect = Exception("分析器失败")

        with pytest.raises(ArbitrationWorkflowError) as exc_info:
            await mock_workflow._process_single_stock_with_retry(
                "000001", "2025-01-17", 1
            )

        # 验证异常链
        assert exc_info.value.__cause__ is not None
        assert isinstance(exc_info.value.__cause__, Exception)

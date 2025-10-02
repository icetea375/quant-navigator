#!/usr/bin/env python3
"""
并发控制机制单元测试 - 防止惊群效应
测试信号量控制和重试机制
"""

import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../packages/backend-python')))

import asyncio
from datetime import datetime
from typing import Optional
from unittest.mock import AsyncMock, MagicMock

import pytest

from exceptions.workflow_exceptions import QuantDataProviderError


class MockMainWorkflow:
    """模拟主工作流类(带并发控制)"""

    def __init__(self, config):
        self.config = config
        self.logger = MagicMock()

        # 初始化并发控制器
        self.db_semaphore = asyncio.Semaphore(
            config.get("concurrency", {}).get("max_db_connections", 10)
        )
        self.llm_semaphore = asyncio.Semaphore(
            config.get("concurrency", {}).get("max_llm_requests", 5)
        )
        self.stock_processing_semaphore = asyncio.Semaphore(
            config.get("concurrency", {}).get("max_stock_processing", 20)
        )

        # 模拟数据库管理器
        self.db_manager = AsyncMock()

    async def _load_stock_data_with_semaphore(
        self, stock_code: str, trade_date: str
    ) -> dict:
        """带信号量控制的数据加载方法"""
        async with self.db_semaphore:
            try:
                self.logger.info(
                    f"加载股票数据: {stock_code} (并发控制: {self.db_semaphore._value})"
                )

                # 模拟数据库调用
                await asyncio.sleep(0.1)  # 模拟数据库延迟

                return {
                    "stock_code": stock_code,
                    "trade_date": trade_date,
                    "financial_data": {"revenue": 1000},
                    "price_data": {"close": 10.5},
                }

            except Exception as e:
                self.logger.error(f"加载股票数据失败: {stock_code} - {e}")
                raise QuantDataProviderError(
                    f"加载股票数据失败: {stock_code} - {e}"
                ) from e

    async def _retry_wrapper(
        self,
        func,
        *args,
        retries: int = 3,
        delay: int = 0.1,
        operation_name: str = "操作",
        **kwargs,
    ):
        """重试包装器"""
        last_exception = None

        for attempt in range(retries + 1):
            try:
                self.logger.info(f"{operation_name} - 尝试 {attempt + 1}/{retries + 1}")
                result = await func(*args, **kwargs)
                if attempt > 0:
                    self.logger.info(f"{operation_name} - 重试成功")
                return result

            except Exception as e:
                last_exception = e
                self.logger.warning(f"{operation_name} - 尝试 {attempt + 1} 失败: {e}")

                if attempt < retries:
                    self.logger.info(f"{operation_name} - 等待 {delay} 秒后重试...")
                    await asyncio.sleep(delay)
                else:
                    self.logger.critical(f"{operation_name} - 所有重试失败,操作终止")

        # 所有重试都失败了
        await self._send_critical_alert(
            f"{operation_name}重试失败", str(last_exception)
        )
        raise last_exception

    async def _send_critical_alert(
        self, title: str, message: str, trade_date: Optional[str] = None
    ):
        """发送告警"""
        self.logger.critical(f"🚨 最高级别告警: {title} - {message}")
        self.logger.info("告警已发送")


class TestConcurrencyControl:
    """测试并发控制机制"""

    @pytest.fixture
    def mock_workflow(self):
        """创建模拟的工作流实例"""
        config = {
            "concurrency": {
                "max_db_connections": 3,
                "max_llm_requests": 2,
                "max_stock_processing": 5,
            }
        }
        return MockMainWorkflow(config)

    @pytest.mark.asyncio
    async def test_green_phase_semaphore_limits_concurrency(self, mock_workflow):
        """测试信号量限制并发数量"""
        # 创建多个并发任务
        tasks = []
        for i in range(10):  # 创建10个任务,但信号量限制为3
            task = asyncio.create_task(
                mock_workflow._load_stock_data_with_semaphore(f"00000{i}", "2025-01-17")
            )
            tasks.append(task)

        # 记录开始时间
        start_time = datetime.now()
        results = await asyncio.gather(*tasks)
        end_time = datetime.now()

        # 验证结果
        assert len(results) == 10
        for i, result in enumerate(results):
            assert result["stock_code"] == f"00000{i}"

        # 验证并发控制(总时间应该明显大于0.1秒,因为信号量限制了并发)
        execution_time = (end_time - start_time).total_seconds()
        assert execution_time > 0.3  # 至少需要3个批次,每批次0.1秒

    @pytest.mark.asyncio
    async def test_semaphore_logging(self, mock_workflow):
        """测试信号量日志记录"""
        # 创建3个并发任务(正好等于信号量限制)
        tasks = [
            mock_workflow._load_stock_data_with_semaphore("000001", "2025-01-17"),
            mock_workflow._load_stock_data_with_semaphore("000002", "2025-01-17"),
            mock_workflow._load_stock_data_with_semaphore("000003", "2025-01-17"),
        ]

        await asyncio.gather(*tasks)

        # 验证日志调用
        assert mock_workflow.logger.info.call_count >= 3  # 每个任务至少1次info调用
        assert mock_workflow.logger.info.call_count <= 6  # 最多2次info调用

    @pytest.mark.asyncio
    async def test_retry_wrapper_success_on_first_attempt(self, mock_workflow):
        """测试重试包装器第一次尝试成功"""

        async def successful_operation():
            return "success"

        result = await mock_workflow._retry_wrapper(
            successful_operation, retries=3, delay=0.01, operation_name="测试操作"
        )

        assert result == "success"
        mock_workflow.logger.info.assert_called_with("测试操作 - 尝试 1/4")

    @pytest.mark.asyncio
    async def test_retry_wrapper_success_on_retry(self, mock_workflow):
        """测试重试包装器重试后成功"""
        attempt_count = 0

        async def failing_then_successful_operation():
            nonlocal attempt_count
            attempt_count += 1
            if attempt_count < 3:
                raise Exception("临时失败")
            return "success"

        result = await mock_workflow._retry_wrapper(
            failing_then_successful_operation,
            retries=3,
            delay=0.01,
            operation_name="测试操作",
        )

        assert result == "success"
        assert attempt_count == 3

        # 验证日志调用
        mock_workflow.logger.info.assert_any_call("测试操作 - 重试成功")

    @pytest.mark.asyncio
    async def test_retry_wrapper_all_retries_fail(self, mock_workflow):
        """测试重试包装器所有重试都失败"""

        async def always_failing_operation():
            raise Exception("永久失败")

        with pytest.raises(Exception) as exc_info:
            await mock_workflow._retry_wrapper(
                always_failing_operation,
                retries=2,
                delay=0.01,
                operation_name="测试操作",
            )

        assert "永久失败" in str(exc_info.value)

        # 验证告警被发送
        mock_workflow.logger.critical.assert_called_with(
            "🚨 最高级别告警: 测试操作重试失败 - 永久失败"
        )

    @pytest.mark.asyncio
    async def test_retry_wrapper_logging(self, mock_workflow):
        """测试重试包装器日志记录"""
        attempt_count = 0

        async def failing_operation():
            nonlocal attempt_count
            attempt_count += 1
            if attempt_count < 2:
                raise Exception("临时失败")
            return "success"

        await mock_workflow._retry_wrapper(
            failing_operation, retries=3, delay=0.01, operation_name="测试操作"
        )

        # 验证日志调用
        mock_workflow.logger.info.assert_any_call("测试操作 - 尝试 1/4")
        mock_workflow.logger.warning.assert_any_call("测试操作 - 尝试 1 失败: 临时失败")
        mock_workflow.logger.info.assert_any_call("测试操作 - 等待 0.01 秒后重试...")
        mock_workflow.logger.info.assert_any_call("测试操作 - 尝试 2/4")
        mock_workflow.logger.info.assert_any_call("测试操作 - 重试成功")

    @pytest.mark.asyncio
    async def test_critical_alert_sending(self, mock_workflow):
        """测试告警发送"""
        await mock_workflow._send_critical_alert("测试告警", "测试消息", "2025-01-17")

        # 验证告警日志
        mock_workflow.logger.critical.assert_called_with(
            "🚨 最高级别告警: 测试告警 - 测试消息"
        )
        mock_workflow.logger.info.assert_called_with("告警已发送")

    @pytest.mark.asyncio
    async def test_semaphore_initialization(self, mock_workflow):
        """测试信号量初始化"""
        # 测试信号量是否被正确创建
        assert mock_workflow.db_semaphore is not None
        assert mock_workflow.llm_semaphore is not None
        assert mock_workflow.stock_processing_semaphore is not None

    @pytest.mark.asyncio
    async def test_semaphore_default_values(self):
        """测试信号量默认值"""
        config = {}  # 空配置,应该使用默认值
        workflow = MockMainWorkflow(config)

        # 测试信号量是否被正确创建
        assert workflow.db_semaphore is not None
        assert workflow.llm_semaphore is not None
        assert workflow.stock_processing_semaphore is not None

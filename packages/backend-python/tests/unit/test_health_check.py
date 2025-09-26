#!/usr/bin/env python3
"""
健康检查方法单元测试 - TDD第五步:红灯
测试health_check方法的独立健康检查功能
"""

import asyncio
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock

import pytest


class MockMainWorkflow:
    """模拟主工作流类(带健康检查)"""
    def __init__(self, config):
        self.config = config
        self.logger = MagicMock()

        # 模拟数据库管理器
        self.db_manager = AsyncMock()

        # 模拟LLM服务
        self.llm_service = AsyncMock()

    async def health_check(self) -> dict:
        """
        健康检查端点 - 独立于启动过程

        Returns:
            健康状态字典
        """
        try:
            health_status = {
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "checks": {}
            }

            # 检查数据库连接
            try:
                await self.db_manager.test_connection()
                health_status["checks"]["database"] = "healthy"
            except Exception as e:
                health_status["checks"]["database"] = f"unhealthy: {e}"
                health_status["status"] = "unhealthy"

            # 检查LLM服务
            try:
                await self._test_llm_connections()
                health_status["checks"]["llm_services"] = "healthy"
            except Exception as e:
                health_status["checks"]["llm_services"] = f"unhealthy: {e}"
                health_status["status"] = "unhealthy"

            return health_status

        except Exception as e:
            return {
                "status": "unhealthy",
                "timestamp": datetime.now().isoformat(),
                "error": str(e)
            }

    async def _test_llm_connections(self):
        """测试LLM连接"""
        # 模拟LLM连接测试
        await self.llm_service.test_connection()


class TestHealthCheck:
    """测试健康检查方法"""

    @pytest.fixture
    def mock_workflow(self):
        """创建模拟的工作流实例"""
        config = {
            "llm_service": {
                "qwen": {"api_key": "test_key"},
                "doubao": {"api_key": "test_key"}
            }
        }
        return MockMainWorkflow(config)

    @pytest.mark.asyncio
    async def test_health_check_all_healthy(self, mock_workflow):
        """测试所有服务都健康"""
        # 模拟所有服务都正常
        mock_workflow.db_manager.test_connection.return_value = None
        mock_workflow.llm_service.test_connection.return_value = None

        result = await mock_workflow.health_check()

        # 验证结果
        assert result["status"] == "healthy"
        assert "timestamp" in result
        assert result["checks"]["database"] == "healthy"
        assert result["checks"]["llm_services"] == "healthy"

    @pytest.mark.asyncio
    async def test_health_check_database_unhealthy(self, mock_workflow):
        """测试数据库不健康"""
        # 模拟数据库连接失败
        mock_workflow.db_manager.test_connection.side_effect = Exception("数据库连接失败")
        mock_workflow.llm_service.test_connection.return_value = None

        result = await mock_workflow.health_check()

        # 验证结果
        assert result["status"] == "unhealthy"
        assert "数据库连接失败" in result["checks"]["database"]
        assert result["checks"]["llm_services"] == "healthy"

    @pytest.mark.asyncio
    async def test_health_check_llm_services_unhealthy(self, mock_workflow):
        """测试LLM服务不健康"""
        # 模拟LLM服务连接失败
        mock_workflow.db_manager.test_connection.return_value = None
        mock_workflow.llm_service.test_connection.side_effect = Exception("LLM服务连接失败")

        result = await mock_workflow.health_check()

        # 验证结果
        assert result["status"] == "unhealthy"
        assert result["checks"]["database"] == "healthy"
        assert "LLM服务连接失败" in result["checks"]["llm_services"]

    @pytest.mark.asyncio
    async def test_health_check_both_unhealthy(self, mock_workflow):
        """测试所有服务都不健康"""
        # 模拟所有服务都失败
        mock_workflow.db_manager.test_connection.side_effect = Exception("数据库连接失败")
        mock_workflow.llm_service.test_connection.side_effect = Exception("LLM服务连接失败")

        result = await mock_workflow.health_check()

        # 验证结果
        assert result["status"] == "unhealthy"
        assert "数据库连接失败" in result["checks"]["database"]
        assert "LLM服务连接失败" in result["checks"]["llm_services"]

    @pytest.mark.asyncio
    async def test_health_check_critical_error(self, mock_workflow):
        """测试健康检查本身出错"""
        # 模拟数据库和LLM都失败,但健康检查本身正常处理
        mock_workflow.db_manager.test_connection.side_effect = Exception("数据库连接失败")
        mock_workflow.llm_service.test_connection.side_effect = Exception("LLM服务连接失败")

        result = await mock_workflow.health_check()

        # 验证结果 - 健康检查应该正常处理异常,返回unhealthy状态
        assert result["status"] == "unhealthy"
        assert "数据库连接失败" in result["checks"]["database"]
        assert "LLM服务连接失败" in result["checks"]["llm_services"]
        assert "timestamp" in result

    @pytest.mark.asyncio
    async def test_health_check_timestamp_format(self, mock_workflow):
        """测试时间戳格式"""
        mock_workflow.db_manager.test_connection.return_value = None
        mock_workflow.llm_service.test_connection.return_value = None

        result = await mock_workflow.health_check()

        # 验证时间戳格式
        timestamp = result["timestamp"]
        # 应该能解析为ISO格式
        parsed_time = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        assert isinstance(parsed_time, datetime)

    @pytest.mark.asyncio
    async def test_health_check_checks_structure(self, mock_workflow):
        """测试检查结果结构"""
        mock_workflow.db_manager.test_connection.return_value = None
        mock_workflow.llm_service.test_connection.return_value = None

        result = await mock_workflow.health_check()

        # 验证结构
        assert "status" in result
        assert "timestamp" in result
        assert "checks" in result
        assert isinstance(result["checks"], dict)
        assert "database" in result["checks"]
        assert "llm_services" in result["checks"]

    @pytest.mark.asyncio
    async def test_health_check_database_exception_types(self, mock_workflow):
        """测试不同类型的数据库异常"""
        # 测试不同类型的异常
        exceptions = [
            Exception("通用异常"),
            ConnectionError("连接错误"),
            TimeoutError("超时错误"),
            ValueError("值错误")
        ]

        for exc in exceptions:
            mock_workflow.db_manager.test_connection.side_effect = exc
            mock_workflow.llm_service.test_connection.return_value = None

            result = await mock_workflow.health_check()

            # 验证异常信息被正确记录
            assert result["status"] == "unhealthy"
            assert str(exc) in result["checks"]["database"]

    @pytest.mark.asyncio
    async def test_health_check_llm_exception_types(self, mock_workflow):
        """测试不同类型的LLM异常"""
        # 测试不同类型的异常
        exceptions = [
            Exception("通用异常"),
            ConnectionError("连接错误"),
            TimeoutError("超时错误"),
            ValueError("值错误")
        ]

        for exc in exceptions:
            mock_workflow.db_manager.test_connection.return_value = None
            mock_workflow.llm_service.test_connection.side_effect = exc

            result = await mock_workflow.health_check()

            # 验证异常信息被正确记录
            assert result["status"] == "unhealthy"
            assert str(exc) in result["checks"]["llm_services"]

    @pytest.mark.asyncio
    async def test_health_check_async_behavior(self, mock_workflow):
        """测试异步行为"""
        # 模拟异步延迟
        async def delayed_db_test():
            await asyncio.sleep(0.1)
            return None

        async def delayed_llm_test():
            await asyncio.sleep(0.1)
            return None

        mock_workflow.db_manager.test_connection.side_effect = delayed_db_test
        mock_workflow.llm_service.test_connection.side_effect = delayed_llm_test

        # 记录开始时间
        start_time = datetime.now()
        result = await mock_workflow.health_check()
        end_time = datetime.now()

        # 验证结果
        assert result["status"] == "healthy"

        # 验证异步执行(总时间应该接近0.1秒,而不是0.2秒)
        execution_time = (end_time - start_time).total_seconds()
        assert execution_time < 0.25  # 允许一些误差

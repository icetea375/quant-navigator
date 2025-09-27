"""
SimpleWorkflowService单元测试 - 遵循TDD原则
先写测试，后写实现
"""

from datetime import datetime, timedelta
from unittest.mock import patch

import pytest

from src.services.simple_workflow_service import SimpleWorkflowService


class TestSimpleWorkflowServiceUnit:
    """SimpleWorkflowService单元测试类"""

    @pytest.fixture
    def workflow_service(self):
        """创建SimpleWorkflowService实例"""
        return SimpleWorkflowService()

    @pytest.mark.asyncio
    async def test_should_initialize_empty_workflows(self, workflow_service):
        """测试服务初始化时工作流列表为空"""
        # Act
        workflows = await workflow_service.get_all_workflows()

        # Assert
        assert len(workflows) == 0

    @pytest.mark.asyncio
    async def test_should_run_daily_flow_successfully(self, workflow_service):
        """测试成功运行日常分析工作流"""
        # Arrange
        target_date = "2024-01-15"

        # Act
        workflow_id = await workflow_service.run_daily_flow(target_date)

        # Assert
        assert workflow_id.startswith("daily_")
        assert len(workflow_id) > 6  # 确保有时间戳

        # 验证工作流状态
        status = await workflow_service.get_workflow_status(workflow_id)
        assert status is not None
        assert status["type"] == "daily_flow"
        assert status["status"] == "completed"
        assert status["target_date"] == target_date
        assert "start_time" in status
        assert "end_time" in status
        assert "result" in status

    @pytest.mark.asyncio
    async def test_should_run_historical_backfill_successfully(self, workflow_service):
        """测试成功运行历史数据回填工作流"""
        # Arrange
        start_date = "2024-01-01"
        end_date = "2024-01-31"

        # Act
        workflow_id = await workflow_service.run_historical_backfill(
            start_date, end_date
        )

        # Assert
        assert workflow_id.startswith("backfill_")
        assert len(workflow_id) > 8  # 确保有时间戳

        # 验证工作流状态
        status = await workflow_service.get_workflow_status(workflow_id)
        assert status is not None
        assert status["type"] == "historical_backfill"
        assert status["status"] == "completed"
        assert status["start_date"] == start_date
        assert status["end_date"] == end_date
        assert "start_time" in status
        assert "end_time" in status
        assert "result" in status

    @pytest.mark.asyncio
    async def test_should_handle_daily_flow_exception(self, workflow_service):
        """测试日常分析工作流异常处理"""
        # Arrange
        target_date = "2024-01-15"

        with patch("asyncio.sleep", side_effect=Exception("模拟异常")):
            # Act & Assert
            with pytest.raises(Exception, match="模拟异常"):
                await workflow_service.run_daily_flow(target_date)

            # 验证工作流状态记录
            workflows = await workflow_service.get_all_workflows()
            assert len(workflows) == 1
            assert workflows[0]["status"] == "failed"
            assert "error" in workflows[0]
            assert workflows[0]["error"] == "模拟异常"

    @pytest.mark.asyncio
    async def test_should_handle_backfill_exception(self, workflow_service):
        """测试历史回填工作流异常处理"""
        # Arrange
        start_date = "2024-01-01"
        end_date = "2024-01-31"

        with patch("asyncio.sleep", side_effect=Exception("模拟回填异常")):
            # Act & Assert
            with pytest.raises(Exception, match="模拟回填异常"):
                await workflow_service.run_historical_backfill(start_date, end_date)

            # 验证工作流状态记录
            workflows = await workflow_service.get_all_workflows()
            assert len(workflows) == 1
            assert workflows[0]["status"] == "failed"
            assert "error" in workflows[0]
            assert workflows[0]["error"] == "模拟回填异常"

    @pytest.mark.asyncio
    async def test_should_get_workflow_status(self, workflow_service):
        """测试获取工作流状态"""
        # Arrange
        target_date = "2024-01-15"
        workflow_id = await workflow_service.run_daily_flow(target_date)

        # Act
        status = await workflow_service.get_workflow_status(workflow_id)
        non_existent = await workflow_service.get_workflow_status("non_existent")

        # Assert
        assert status is not None
        assert status["id"] == workflow_id
        assert status["type"] == "daily_flow"
        assert status["status"] == "completed"
        assert non_existent is None

    @pytest.mark.asyncio
    async def test_should_get_workflow_logs(self, workflow_service):
        """测试获取工作流日志"""
        # Arrange
        target_date = "2024-01-15"
        workflow_id = await workflow_service.run_daily_flow(target_date)

        # Act
        logs = await workflow_service.get_workflow_logs(workflow_id)
        non_existent_logs = await workflow_service.get_workflow_logs("non_existent")

        # Assert
        assert len(logs) >= 2  # 至少应该有启动和完成日志
        assert all("timestamp" in log for log in logs)
        assert all("level" in log for log in logs)
        assert all("message" in log for log in logs)
        assert non_existent_logs == []

    @pytest.mark.asyncio
    async def test_should_get_all_workflows(self, workflow_service):
        """测试获取所有工作流"""
        # Arrange - 创建多个工作流
        await workflow_service.run_daily_flow("2024-01-15")
        await workflow_service.run_historical_backfill("2024-01-01", "2024-01-31")

        # Act
        workflows = await workflow_service.get_all_workflows()

        # Assert
        assert len(workflows) == 2
        assert all("id" in workflow for workflow in workflows)
        assert all("type" in workflow for workflow in workflows)
        assert all("status" in workflow for workflow in workflows)

    @pytest.mark.asyncio
    async def test_should_cancel_running_workflow(self, workflow_service):
        """测试取消运行中的工作流"""
        # Arrange - 创建一个运行中的工作流（模拟）
        workflow_id = "test_workflow_123"
        workflow_service.active_workflows[workflow_id] = {
            "id": workflow_id,
            "type": "daily_flow",
            "status": "running",
            "start_time": datetime.now(),
            "logs": [],
        }

        # Act
        success = await workflow_service.cancel_workflow(workflow_id)
        failed = await workflow_service.cancel_workflow("non_existent")

        # Assert
        assert success is True
        assert failed is False

        # 验证工作流状态
        status = await workflow_service.get_workflow_status(workflow_id)
        assert status["status"] == "cancelled"
        assert "end_time" in status

    @pytest.mark.asyncio
    async def test_should_not_cancel_completed_workflow(self, workflow_service):
        """测试不能取消已完成的工作流"""
        # Arrange - 创建一个已完成的工作流
        workflow_id = "completed_workflow_123"
        workflow_service.active_workflows[workflow_id] = {
            "id": workflow_id,
            "type": "daily_flow",
            "status": "completed",
            "start_time": datetime.now(),
            "end_time": datetime.now(),
            "logs": [],
        }

        # Act
        success = await workflow_service.cancel_workflow(workflow_id)

        # Assert
        assert success is False

    @pytest.mark.asyncio
    async def test_should_cleanup_old_workflows(self, workflow_service):
        """测试清理旧工作流记录"""
        # Arrange - 创建新旧工作流
        old_time = datetime.now() - timedelta(hours=25)
        new_time = datetime.now() - timedelta(hours=1)

        old_workflow_id = "old_workflow"
        new_workflow_id = "new_workflow"

        workflow_service.active_workflows[old_workflow_id] = {
            "id": old_workflow_id,
            "type": "daily_flow",
            "status": "completed",
            "start_time": old_time,
            "logs": [],
        }

        workflow_service.active_workflows[new_workflow_id] = {
            "id": new_workflow_id,
            "type": "daily_flow",
            "status": "completed",
            "start_time": new_time,
            "logs": [],
        }

        # Act
        await workflow_service.cleanup_old_workflows(hours=24)

        # Assert
        workflows = await workflow_service.get_all_workflows()
        assert len(workflows) == 1
        assert workflows[0]["id"] == new_workflow_id

    @pytest.mark.asyncio
    async def test_should_handle_cleanup_with_no_old_workflows(self, workflow_service):
        """测试清理时没有旧工作流的情况"""
        # Arrange - 只创建新工作流
        new_time = datetime.now() - timedelta(hours=1)
        new_workflow_id = "new_workflow"

        workflow_service.active_workflows[new_workflow_id] = {
            "id": new_workflow_id,
            "type": "daily_flow",
            "status": "completed",
            "start_time": new_time,
            "logs": [],
        }

        # Act
        await workflow_service.cleanup_old_workflows(hours=24)

        # Assert
        workflows = await workflow_service.get_all_workflows()
        assert len(workflows) == 1

    @pytest.mark.asyncio
    async def test_should_add_logs_during_workflow_execution(self, workflow_service):
        """测试工作流执行过程中添加日志"""
        # Arrange
        target_date = "2024-01-15"

        # Act
        workflow_id = await workflow_service.run_daily_flow(target_date)

        # Assert
        logs = await workflow_service.get_workflow_logs(workflow_id)
        assert len(logs) >= 2

        # 检查日志内容
        log_messages = [log["message"] for log in logs]
        assert "工作流启动" in log_messages
        assert "工作流完成" in log_messages

    @pytest.mark.asyncio
    async def test_should_handle_concurrent_workflows(self, workflow_service):
        """测试并发工作流处理"""
        # Arrange
        target_dates = ["2024-01-15", "2024-01-16", "2024-01-17"]

        # Act - 并发运行多个工作流
        workflow_ids = []
        for target_date in target_dates:
            workflow_id = await workflow_service.run_daily_flow(target_date)
            workflow_ids.append(workflow_id)

        # Assert
        assert len(workflow_ids) == 3
        assert len(set(workflow_ids)) == 3  # 确保ID唯一

        workflows = await workflow_service.get_all_workflows()
        assert len(workflows) == 3

    @pytest.mark.asyncio
    async def test_should_handle_workflow_with_different_types(self, workflow_service):
        """测试不同类型的工作流"""
        # Arrange
        target_date = "2024-01-15"
        start_date = "2024-01-01"
        end_date = "2024-01-31"

        # Act
        daily_id = await workflow_service.run_daily_flow(target_date)
        backfill_id = await workflow_service.run_historical_backfill(
            start_date, end_date
        )

        # Assert
        daily_status = await workflow_service.get_workflow_status(daily_id)
        backfill_status = await workflow_service.get_workflow_status(backfill_id)

        assert daily_status["type"] == "daily_flow"
        assert backfill_status["type"] == "historical_backfill"
        assert daily_status["target_date"] == target_date
        assert backfill_status["start_date"] == start_date
        assert backfill_status["end_date"] == end_date

    @pytest.mark.asyncio
    async def test_should_handle_edge_case_workflow_id_generation(
        self, workflow_service
    ):
        """测试工作流ID生成的边界情况"""
        # Act - 快速创建多个工作流
        workflow_ids = []
        for i in range(5):
            workflow_id = await workflow_service.run_daily_flow(f"2024-01-{15+i:02d}")
            workflow_ids.append(workflow_id)

        # Assert
        assert len(set(workflow_ids)) == 5  # 所有ID都应该唯一
        assert all(id.startswith("daily_") for id in workflow_ids)

    @pytest.mark.asyncio
    async def test_should_handle_workflow_result_structure(self, workflow_service):
        """测试工作流结果结构"""
        # Arrange
        target_date = "2024-01-15"

        # Act
        workflow_id = await workflow_service.run_daily_flow(target_date)

        # Assert
        status = await workflow_service.get_workflow_status(workflow_id)
        result = status["result"]

        assert "message" in result
        assert target_date in result["message"]
        assert "日常分析完成" in result["message"]

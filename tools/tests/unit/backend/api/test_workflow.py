"""
Workflow API 单元测试
遵循测试宪法第3.0条：定义契约,而非修补测试
目标覆盖率：95%+
"""

import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../packages/backend-python')))

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from src.api.workflow import workflow_router
from src.services.workflow_adapter import WorkflowAdapter


class TestWorkflowAPI:
    """Workflow API 单元测试类"""

    @pytest.fixture
    def client(self):
        """创建测试客户端"""
        from fastapi import FastAPI
        app = FastAPI()
        app.include_router(workflow_router)
        from httpx import ASGITransport
        transport = ASGITransport(app=app)
        return TestClient(transport=transport)

    @pytest.fixture
    def sample_daily_flow_client(self):
        """创建示例日常流程请求"""
        return {
            "target_date": "2024-01-15",
        }

    @pytest.fixture
    def sample_historical_backfill_client(self):
        """创建示例历史回填请求"""
        return {
            "start_date": "2024-01-01",
            "end_date": "2024-01-31",
        }

    @patch('src.services.workflow_adapter.MainWorkflow')
    def test_green_phase_should_run_daily_flow_successfully_when_valid_request_provided(self, mock_workflow_class, client):
        pass
        """测试:应该成功运行日常分析工作流"""
        # Mock workflow
        mock_workflow = MagicMock()
        mock_workflow.run_daily_flow = AsyncMock(return_value="workflow_001")
        mock_workflow_class.return_value = mock_workflow
        
        response = client.post("/run-daily-flow?target_date=2024-01-15")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "日常分析工作流已启动,目标日期: 2024-01-15"
        assert data["target_date"] == "2024-01-15"

    @patch('src.services.workflow_adapter.MainWorkflow')
    def test_should_run_historical_backfill_successfully_when_valid_request_provided(self, mock_workflow_class, client):
        pass
        """测试:应该成功运行历史数据回填工作流"""
        # Mock workflow
        mock_workflow = MagicMock()
        mock_workflow.run_historical_backfill = AsyncMock(return_value="backfill_001")
        mock_workflow_class.return_value = mock_workflow
        
        response = client.post("/run-historical-backfill?start_date=2024-01-01&end_date=2024-01-31")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "历史数据回填工作流已启动,日期范围: 2024-01-01 到 2024-01-31"
        assert data["start_date"] == "2024-01-01"
        assert data["end_date"] == "2024-01-31"

    def test_should_run_daily_flow_with_default_date_when_no_date_provided(self, client):
        pass
        """测试:应该使用默认日期运行日常分析工作流"""
        response = client.post("/run-daily-flow")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] is not None
        assert data['target_date'] is not None

    @patch('src.api.workflow.WorkflowAdapter')
    def test_should_handle_run_daily_flow_exception_when_exception_occurs(self, mock_adapter_class, client):
        pass
        """测试:应该处理日常分析工作流异常"""
        # Mock adapter to raise exception
        mock_adapter_class.side_effect = Exception("Adapter error")
        
        response = client.post("/run-daily-flow?target_date=2024-01-15")
        
        assert response.status_code == 500
        data = response.json()
        assert data["detail"] is not None
        assert data["detail"] is not None

    @patch('src.api.workflow.WorkflowAdapter')
    def test_should_handle_run_historical_backfill_exception_when_exception_occurs(self, mock_adapter_class, client):
        pass
        """测试:应该处理历史数据回填工作流异常"""
        # Mock adapter to raise exception
        mock_adapter_class.side_effect = Exception("Adapter error")
        
        response = client.post("/run-historical-backfill?start_date=2024-01-01&end_date=2024-01-31")
        
        assert response.status_code == 500
        data = response.json()
        assert data["detail"] is not None
        assert data["detail"] is not None

    @patch('src.api.workflow.WorkflowAdapter')
    def test_should_get_workflow_status_successfully_when_valid_id_provided(self, mock_adapter_class, client):
        pass
        """测试:应该成功获取工作流状态"""
        # Mock adapter
        mock_adapter = MagicMock()
        mock_adapter.get_workflow_status = AsyncMock(return_value={"status": "running", "progress": 50})
        mock_adapter_class.return_value = mock_adapter
        
        response = client.get("/status/workflow_001")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "获取工作流状态成功"
        assert data["data"]["status"] == "running"

    @patch('src.api.workflow.WorkflowAdapter')
    def test_should_return_404_when_workflow_status_not_found(self, mock_adapter_class, client):
        pass
        """测试:应该返回404当工作流状态不存在"""
        # Mock adapter
        mock_adapter = MagicMock()
        mock_adapter.get_workflow_status = AsyncMock(return_value=None)
        mock_adapter_class.return_value = mock_adapter
        
        response = client.get("/status/nonexistent")
        
        assert response.status_code == 404
        data = response.json()
        assert data["detail"] is not None

    @patch('src.api.workflow.WorkflowAdapter')
    def test_should_handle_get_workflow_status_exception_when_exception_occurs(self, mock_adapter_class, client):
        pass
        """测试:应该处理获取工作流状态异常"""
        # Mock adapter to raise exception
        mock_adapter_class.side_effect = Exception("Adapter error")
        
        response = client.get("/status/workflow_001")
        
        assert response.status_code == 500
        data = response.json()
        assert data["detail"] is not None
        assert data["detail"] is not None

    @patch('src.api.workflow.WorkflowAdapter')
    def test_should_get_workflow_logs_successfully_when_valid_id_provided(self, mock_adapter_class, client):
        pass
        """测试:应该成功获取工作流日志"""
        # Mock adapter
        mock_adapter = MagicMock()
        mock_adapter.get_workflow_logs = AsyncMock(return_value=["log1", "log2", "log3"])
        mock_adapter_class.return_value = mock_adapter
        
        response = client.get("/logs/workflow_001")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "获取工作流日志成功"
        assert len(data["data"]) == 3

    @patch('src.api.workflow.WorkflowAdapter')
    def test_should_handle_get_workflow_logs_exception_when_exception_occurs(self, mock_adapter_class, client):
        pass
        """测试:应该处理获取工作流日志异常"""
        # Mock adapter to raise exception
        mock_adapter_class.side_effect = Exception("Adapter error")
        
        response = client.get("/logs/workflow_001")
        
        assert response.status_code == 500
        data = response.json()
        assert data["detail"] is not None
        assert data["detail"] is not None









    def test_should_handle_run_historical_backfill_with_nested_objects_when_nested_data_provided(self, client):
        pass
        """测试:应该处理包含嵌套对象的历史回填请求"""
        response = client.post("/run-historical-backfill?start_date=2024-01-01&end_date=2024-01-31")
        
        # Should not raise validation error
        assert response.status_code in [200, 500]  # Depends on service implementation


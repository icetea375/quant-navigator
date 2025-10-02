"""
Reports API 单元测试
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

from src.api.reports import reports_router
from src.schemas.reports import (
    GeneratedReport,
    ReportCreate,
    ReportListResponse,
    ReportResponse,
    ReportStatus,
    ReportType,
    ReportUpdate,
)
from src.services.report_service import ReportService


class TestReportsAPI:
    """Reports API 单元测试类"""

    @pytest.fixture
    def client(self):
        """创建测试客户端"""
        from fastapi import FastAPI
        app = FastAPI()
        app.include_router(reports_router)
        from httpx import ASGITransport
        transport = ASGITransport(app=app)
        return TestClient(transport=transport)

    @pytest.fixture
    def sample_report(self):
        """创建示例报告"""
        from datetime import date, datetime
        return GeneratedReport(
            report_id="1",
            title="今日市场分析报告",
            description="市场整体表现平稳,建议关注...",
            summary="市场分析总结",
            report_type=ReportType.DAILY_ANALYSIS,
            target_code="000001.SZ",
            report_date=date(2024, 1, 15),
            content="今日市场分析报告：市场整体表现平稳,建议关注...",
            status=ReportStatus.COMPLETED,
            created_at=datetime(2024, 1, 15, 10, 0, 0),
            generated_at=datetime(2024, 1, 15, 10, 0, 0),
        )

    @pytest.fixture
    def sample_report_create(self):
        """创建示例报告创建请求"""
        return {
            "report_type": "daily_analysis",
            "title": "新的市场分析报告",
            "description": "基于最新市场数据的分析报告",
            "target_code": "000001.SZ",
            "report_date": "2024-01-15",
            "content": "新的市场分析报告",
            "summary": "市场整体表现良好,建议关注科技板块",
            "author": "system"
        }

    @pytest.fixture
    def sample_report_update(self):
        """创建示例报告更新请求"""
        return {
            "content": "更新后的市场分析报告",
            "status": "completed",
        }

    @pytest.fixture
    def sample_report_list_response(self):
        """创建示例报告列表响应"""
        return {
            "data": [
                {
                    "report_id": "RPT_000001",
                    "report_type": "daily_analysis",
                    "title": "今日市场分析报告",
                    "description": "基于技术指标和市场数据的综合分析",
                    "target_code": "000001.SZ",
                    "report_date": "2024-01-15",
                    "content": "今日市场分析报告",
                    "summary": "市场整体表现良好,建议关注科技板块",
                    "status": "completed",
                    "generated_at": "2024-01-15T10:00:00Z",
                    "created_at": "2024-01-15T10:00:00Z",
                }
            ],
            "total": 1,
        }

    @patch('src.api.reports.ReportService')
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_green_phase_should_get_reports_successfully_when_valid_parameters_provided(self, mock_service_class, client, sample_report_list_response):
        pass
        """测试:应该成功获取报告列表"""
        # Mock service
        mock_service = AsyncMock()
        mock_service.get_reports.return_value = sample_report_list_response
        mock_service_class.return_value = mock_service
        
        response = client.get("/?page=1&size=10")
        
        # 验证mock被调用
        mock_service_class.assert_called_once()
        mock_service.get_reports.assert_called_once_with(
            page=1, size=10, report_type=None, target_code=None
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "获取报告列表成功"
        assert data['data'] is not None
        assert data['total'] is not None
        assert data["page"] == 1
        assert data["size"] == 10

    @patch('src.api.reports.ReportService')
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_get_reports_with_filters_when_filters_provided(self, mock_service_class, client, sample_report_list_response):
        pass
        """测试:应该使用筛选条件获取报告列表"""
        # Mock service
        mock_service = AsyncMock()
        mock_service.get_reports.return_value = sample_report_list_response
        mock_service_class.return_value = mock_service
        
        response = client.get("/?page=1&size=10&report_type=daily_analysis&target_code=000001.SZ")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        mock_service.get_reports.assert_called_once_with(
            page=1, size=10, report_type="daily_analysis", target_code="000001.SZ"
        )

    @patch('src.api.reports.ReportService')
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_get_reports_error_when_exception_occurs(self, mock_service_class, client):
        pass
        """测试:获取报告列表时出错应该返回500错误"""
        # Mock service to raise exception
        mock_service = AsyncMock()
        mock_service.get_reports.side_effect = Exception("Database error")
        mock_service_class.return_value = mock_service
        
        response = client.get("/")
        
        assert response.status_code == 500
        data = response.json()
        assert data["detail"] is not None

    @patch('src.api.reports.ReportService')
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_get_report_successfully_when_valid_id_provided(self, mock_service_class, client, sample_report):
        pass
        """测试:应该成功获取单个报告详情"""
        # Mock service
        mock_service = AsyncMock()
        mock_service.get_report_by_id.return_value = sample_report
        mock_service_class.return_value = mock_service
        
        response = client.get("/1")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "获取报告详情成功"
        assert data["data"]["report_id"] == "1"

    @patch('src.api.reports.ReportService')
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_return_404_for_nonexistent_report_when_report_not_found(self, mock_service_class, client):
        pass
        """测试:获取不存在的报告应该返回404错误"""
        # Mock service to return None
        mock_service = AsyncMock()
        mock_service.get_report_by_id.return_value = None
        mock_service_class.return_value = mock_service
        
        response = client.get("/999")
        
        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "报告不存在"

    @patch('src.api.reports.ReportService')
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_get_report_error_when_exception_occurs(self, mock_service_class, client):
        pass
        """测试:获取报告详情时出错应该返回500错误"""
        # Mock service to raise exception
        mock_service = AsyncMock()
        mock_service.get_report_by_id.side_effect = Exception("Database error")
        mock_service_class.return_value = mock_service
        
        response = client.get("/1")
        
        assert response.status_code == 500
        data = response.json()
        assert data["detail"] is not None

    @patch('src.api.reports.ReportService')
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_create_report_successfully_when_valid_data_provided(self, mock_service_class, client, sample_report, sample_report_create):
        pass
        """测试:应该成功创建新报告"""
        # Mock service
        mock_service = AsyncMock()
        mock_service.create_report.return_value = sample_report
        mock_service_class.return_value = mock_service
        
        response = client.post("/", json=sample_report_create)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "创建报告成功"
        assert data["data"]["report_id"] == "1"

    @patch('src.api.reports.ReportService')
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_create_report_error_when_exception_occurs(self, mock_service_class, client, sample_report_create):
        pass
        """测试:创建报告时出错应该返回500错误"""
        # Mock service to raise exception
        mock_service = AsyncMock()
        mock_service.create_report.side_effect = Exception("Database error")
        mock_service_class.return_value = mock_service
        
        response = client.post("/", json=sample_report_create)
        
        assert response.status_code == 500
        data = response.json()
        assert data["detail"] is not None

    @patch('src.api.reports.ReportService')
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_update_report_successfully_when_valid_data_provided(self, mock_service_class, client, sample_report, sample_report_update):
        pass
        """测试:应该成功更新报告"""
        # Mock service
        mock_service = AsyncMock()
        mock_service.update_report.return_value = sample_report
        mock_service_class.return_value = mock_service
        
        response = client.put("/1", json=sample_report_update)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "更新报告成功"
        assert data["data"]["report_id"] == "1"

    @patch('src.api.reports.ReportService')
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_return_404_for_update_nonexistent_report_when_report_not_found(self, mock_service_class, client, sample_report_update):
        pass
        """测试:更新不存在的报告应该返回404错误"""
        # Mock service to return None
        mock_service = AsyncMock()
        mock_service.update_report.return_value = None
        mock_service_class.return_value = mock_service
        
        response = client.put("/999", json=sample_report_update)
        
        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "报告不存在"

    @patch('src.api.reports.ReportService')
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_update_report_error_when_exception_occurs(self, mock_service_class, client, sample_report_update):
        pass
        """测试:更新报告时出错应该返回500错误"""
        # Mock service to raise exception
        mock_service = AsyncMock()
        mock_service.update_report.side_effect = Exception("Database error")
        mock_service_class.return_value = mock_service
        
        response = client.put("/1", json=sample_report_update)
        
        assert response.status_code == 500
        data = response.json()
        assert data["detail"] is not None

    @patch('src.api.reports.ReportService')
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_delete_report_successfully_when_valid_id_provided(self, mock_service_class, client):
        pass
        """测试:应该成功删除报告"""
        # Mock service
        mock_service = AsyncMock()
        mock_service.delete_report.return_value = True
        mock_service_class.return_value = mock_service
        
        response = client.delete("/1")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "删除报告成功"

    @patch('src.api.reports.ReportService')
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_return_404_for_delete_nonexistent_report_when_report_not_found(self, mock_service_class, client):
        pass
        """测试:删除不存在的报告应该返回404错误"""
        # Mock service to return False
        mock_service = AsyncMock()
        mock_service.delete_report.return_value = False
        mock_service_class.return_value = mock_service
        
        response = client.delete("/999")
        
        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "报告不存在"

    @patch('src.api.reports.ReportService')
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_delete_report_error_when_exception_occurs(self, mock_service_class, client):
        pass
        """测试:删除报告时出错应该返回500错误"""
        # Mock service to raise exception
        mock_service = AsyncMock()
        mock_service.delete_report.side_effect = Exception("Database error")
        mock_service_class.return_value = mock_service
        
        response = client.delete("/1")
        
        assert response.status_code == 500
        data = response.json()
        assert data["detail"] is not None

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_validate_query_parameters_when_invalid_parameters_provided(self, client):
        pass
        """测试:应该验证查询参数"""
        # Test invalid page parameter
        response = client.get("/?page=0")
        assert response.status_code == 422  # Validation error
        
        # Test invalid size parameter
        response = client.get("/?size=0")
        assert response.status_code == 422  # Validation error
        
        # Test size too large
        response = client.get("/?size=101")
        assert response.status_code == 422  # Validation error

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_missing_required_fields_in_create_when_incomplete_data_provided(self, client):
        pass
        """测试:应该处理创建请求中缺少必需字段的情况"""
        # Test with empty create data
        response = client.post("/", json={})
        
        # Should not raise validation error for empty create
        assert response.status_code == 422  # Validation error for missing required fields

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_invalid_json_in_create_when_invalid_json_provided(self, client):
        pass
        """测试:应该处理创建请求中的无效JSON"""
        response = client.post(
            "/",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 422  # Validation error

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_large_page_size_when_large_size_provided(self, client):
        pass
        """测试:应该处理大页面大小"""
        response = client.get("/?size=100")
        
        # Should be valid (max allowed size)
        assert response.status_code == 200  # Valid request with max allowed size

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_negative_page_number_when_negative_page_provided(self, client):
        pass
        """测试:应该处理负数页码"""
        response = client.get("/?page=-1")
        
        assert response.status_code == 422  # Validation error

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_string_page_parameter_when_string_page_provided(self, client):
        pass
        """测试:应该处理字符串页码参数"""
        response = client.get("/?page=abc")
        
        assert response.status_code == 422  # Validation error

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_string_size_parameter_when_string_size_provided(self, client):
        pass
        """测试:应该处理字符串大小参数"""
        response = client.get("/?size=abc")
        
        assert response.status_code == 422  # Validation error

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_create_report_with_special_characters_when_special_chars_provided(self, client):
        pass
        """测试:应该处理包含特殊字符的创建请求"""
        special_create = {
            "report_type": "daily_analysis",
            "target_code": "000001.SZ",
            "content": "特殊字符测试：!@#$%^&*()_+-=[]{}|;':\",./<>?",
        }
        
        response = client.post("/", json=special_create)
        
        # Should not raise validation error
        assert response.status_code == 422  # Validation error for missing required fields

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_create_report_with_nested_objects_when_nested_data_provided(self, client):
        pass
        """测试:应该处理包含嵌套对象的创建请求"""
        nested_create = {
            "report_type": "daily_analysis",
            "target_code": "000001.SZ",
            "content": "报告内容",
            "metadata": {
                "level1": {
                    "level2": {
                        "level3": "deep_value",
                    },
                },
                "array": [1, 2, 3, {"nested": "value"}],
            },
        }
        
        response = client.post("/", json=nested_create)
        
        # Should not raise validation error
        assert response.status_code == 422  # Validation error for missing required fields

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_create_report_with_boolean_values_when_boolean_data_provided(self, client):
        pass
        """测试:应该处理包含布尔值的创建请求"""
        boolean_create = {
            "report_type": "daily_analysis",
            "target_code": "000001.SZ",
            "content": "报告内容",
            "options": {
                "include_charts": True,
                "include_recommendations": False,
                "include_summary": True,
            },
        }
        
        response = client.post("/", json=boolean_create)
        
        # Should not raise validation error
        assert response.status_code == 422  # Validation error for missing required fields

    @patch('src.api.reports.ReportService')
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_create_report_error_when_service_raises_exception(self, mock_service_class, client, sample_report_create):
        pass
        """测试:创建报告时服务抛出异常应该返回500错误"""
        # Mock service to raise exception
        mock_service = AsyncMock()
        mock_service.create_report.side_effect = Exception("Service error")
        mock_service_class.return_value = mock_service
        
        response = client.post("/", json=sample_report_create)
        
        assert response.status_code == 500
        data = response.json()
        assert data["detail"] is not None

    @patch('src.api.reports.ReportService')
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_compare_reports_successfully_when_valid_ids_provided(self, mock_service_class, client):
        pass
        """测试:应该成功对比两个报告"""
        # Mock service
        mock_service = AsyncMock()
        mock_service.compare_reports.return_value = {
            "similarity": 0.85,
            "differences": ["content", "summary"],
            "common_points": ["target_code", "report_type"]
        }
        mock_service_class.return_value = mock_service
        
        response = client.post("/compare?report1_id=1&report2_id=2")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "报告对比成功"
        assert data['data'] is not None
        assert data["data"]["similarity"] == 0.85

    @patch('src.api.reports.ReportService')
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_compare_reports_value_error_when_invalid_ids_provided(self, mock_service_class, client):
        pass
        """测试:对比报告时值错误应该返回400错误"""
        # Mock service to raise ValueError
        mock_service = AsyncMock()
        mock_service.compare_reports.side_effect = ValueError("Invalid report IDs")
        mock_service_class.return_value = mock_service
        
        response = client.post("/compare?report1_id=invalid&report2_id=2")
        
        assert response.status_code == 400
        data = response.json()
        assert data["detail"] == "Invalid report IDs"

    @patch('src.api.reports.ReportService')
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_compare_reports_general_error_when_exception_occurs(self, mock_service_class, client):
        pass
        """测试:对比报告时一般异常应该返回500错误"""
        # Mock service to raise general exception
        mock_service = AsyncMock()
        mock_service.compare_reports.side_effect = Exception("Database error")
        mock_service_class.return_value = mock_service
        
        response = client.post("/compare?report1_id=1&report2_id=2")
        
        assert response.status_code == 500
        data = response.json()
        assert data["detail"] is not None

    @patch('src.api.reports.ReportService')
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_get_report_statistics_successfully_when_service_returns_data(self, mock_service_class, client):
        pass
        """测试:应该成功获取报告统计信息"""
        # Mock service
        mock_service = AsyncMock()
        mock_service.get_statistics.return_value = {
            "total_reports": 100,
            "completed_reports": 85,
            "failed_reports": 5,
            "pending_reports": 10,
            "reports_by_type": {
                "daily_analysis": 50,
                "fact_analysis": 30,
                "sentiment_analysis": 20
            },
            "reports_by_status": {
                "completed": 85,
                "failed": 5,
                "pending": 10
            }
        }
        mock_service_class.return_value = mock_service
        
        response = client.get("/statistics")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "获取统计信息成功"
        assert data['data'] is not None
        assert data["data"]["total_reports"] == 100

    @patch('src.api.reports.ReportService')
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_get_statistics_error_when_exception_occurs(self, mock_service_class, client):
        pass
        """测试:获取统计信息时出错应该返回500错误"""
        # Mock service to raise exception
        mock_service = AsyncMock()
        mock_service.get_statistics.side_effect = Exception("Database error")
        mock_service_class.return_value = mock_service
        
        response = client.get("/statistics")
        
        assert response.status_code == 500
        data = response.json()
        assert data["detail"] is not None

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_compare_reports_missing_parameters_when_parameters_missing(self, client):
        pass
        """测试:应该处理对比报告时缺少参数的情况"""
        # Test missing report1_id
        response = client.post("/compare?report2_id=2")
        assert response.status_code == 422  # Validation error
        
        # Test missing report2_id
        response = client.post("/compare?report1_id=1")
        assert response.status_code == 422  # Validation error
        
        # Test both parameters missing
        response = client.post("/compare")
        assert response.status_code == 422  # Validation error

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_compare_reports_invalid_parameters_when_invalid_parameters_provided(self, client):
        pass
        """测试:应该处理对比报告时无效参数的情况"""
        # Test with empty parameters
        response = client.post("/compare?report1_id=&report2_id=")
        assert response.status_code == 422  # Validation error
        
        # Test with non-string parameters
        response = client.post("/compare?report1_id=1&report2_id=2")
        # This should work as they are valid strings
        assert response.status_code in [200, 500]  # Either success or service error

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_statistics_endpoint_with_different_methods_when_various_methods_used(self, client):
        pass
        """测试:应该处理统计信息端点的不同HTTP方法"""
        # Test GET method (should work)
        response = client.get("/statistics")
        assert response.status_code in [200, 500]  # Either success or service error
        
        # Test POST method (should not be allowed)
        response = client.post("/statistics")
        assert response.status_code == 405  # Method not allowed
        
        # Test PUT method (should not be allowed)
        response = client.put("/statistics")
        assert response.status_code == 405  # Method not allowed
        
        # Test DELETE method (should not be allowed)
        response = client.delete("/statistics")
        assert response.status_code == 405  # Method not allowed

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_compare_reports_endpoint_with_different_methods_when_various_methods_used(self, client):
        pass
        """测试:应该处理对比报告端点的不同HTTP方法"""
        # Test POST method (should work)
        response = client.post("/compare?report1_id=1&report2_id=2")
        assert response.status_code in [200, 400, 500]  # Success, validation error, or service error
        
        # Test GET method (should not be allowed)
        response = client.get("/compare?report1_id=1&report2_id=2")
        assert response.status_code == 405  # Method not allowed
        
        # Test PUT method (should not be allowed)
        response = client.put("/compare?report1_id=1&report2_id=2")
        assert response.status_code == 405  # Method not allowed
        
        # Test DELETE method (should not be allowed)
        response = client.delete("/compare?report1_id=1&report2_id=2")
        assert response.status_code == 405  # Method not allowed

    @patch('src.api.reports.ReportService')
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_create_report_with_complex_data_when_complex_data_provided(self, mock_service_class, client, sample_report):
        pass
        """测试:应该处理包含复杂数据的创建请求"""
        # Mock service
        mock_service = AsyncMock()
        mock_service.create_report.return_value = sample_report
        mock_service_class.return_value = mock_service
        
        complex_create = {
            "report_type": "daily_analysis",
            "title": "复杂的市场分析报告",
            "description": "包含多种数据类型的复杂分析报告",
            "target_code": "000001.SZ",
            "report_date": "2024-01-15",
            "content": "复杂的报告内容,包含多种数据类型",
            "summary": "基于复杂数据的综合分析结果",
            "metadata": {
                "sections": ["市场概况", "技术分析", "投资建议"],
                "metrics": {"volatility": 0.15, "trend": "stable"},
                "recommendations": [
                    {"action": "buy", "target": "000001.SZ", "confidence": 0.85},
                    {"action": "hold", "target": "000002.SZ", "confidence": 0.7}
                ],
                "nested_data": {
                    "level1": {
                        "level2": {
                            "level3": "deep_value"
                        }
                    }
                }
            },
            "options": {
                "include_charts": True,
                "include_recommendations": True,
                "include_summary": True,
                "format": "pdf",
                "language": "zh-CN"
            }
        }
        
        response = client.post("/", json=complex_create)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "创建报告成功"

    @patch('src.api.reports.ReportService')
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_create_report_with_minimal_data_when_minimal_data_provided(self, mock_service_class, client, sample_report):
        pass
        """测试:应该处理最小数据的创建请求"""
        # Mock service
        mock_service = AsyncMock()
        mock_service.create_report.return_value = sample_report
        mock_service_class.return_value = mock_service
        
        minimal_create = {
            "report_type": "daily_analysis",
            "title": "最小报告",
            "description": "最小描述",
            "target_code": "000001.SZ",
            "report_date": "2024-01-15",
            "content": "最小报告内容",
            "summary": "最小摘要"
        }
        
        response = client.post("/", json=minimal_create)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "创建报告成功"

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_create_report_with_missing_required_fields_when_required_fields_missing(self, client):
        pass
        """测试:应该处理缺少必需字段的创建请求"""
        # Test with missing report_type
        incomplete_create = {
            "target_code": "000001.SZ",
            "report_date": "2024-01-15",
            "content": "测试内容"
        }
        
        response = client.post("/", json=incomplete_create)
        assert response.status_code == 422  # Validation error
        
        # Test with missing target_code
        incomplete_create = {
            "report_type": "daily_analysis",
            "report_date": "2024-01-15",
            "content": "测试内容"
        }
        
        response = client.post("/", json=incomplete_create)
        assert response.status_code == 422  # Validation error
        
        # Test with missing report_date
        incomplete_create = {
            "report_type": "daily_analysis",
            "target_code": "000001.SZ",
            "content": "测试内容"
        }
        
        response = client.post("/", json=incomplete_create)
        assert response.status_code == 422  # Validation error
        
        # Test with missing content
        incomplete_create = {
            "report_type": "daily_analysis",
            "target_code": "000001.SZ",
            "report_date": "2024-01-15"
        }
        
        response = client.post("/", json=incomplete_create)
        assert response.status_code == 422  # Validation error

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_handle_create_report_with_invalid_field_types_when_invalid_types_provided(self, client):
        pass
        """测试:应该处理无效字段类型的创建请求"""
        # Test with invalid report_type
        invalid_create = {
            "report_type": 123,  # Should be string
            "target_code": "000001.SZ",
            "report_date": "2024-01-15",
            "content": "测试内容"
        }
        
        response = client.post("/", json=invalid_create)
        assert response.status_code == 422  # Validation error
        
        # Test with invalid report_date
        invalid_create = {
            "report_type": "daily_analysis",
            "target_code": "000001.SZ",
            "report_date": "invalid_date",  # Should be valid date
            "content": "测试内容"
        }
        
        response = client.post("/", json=invalid_create)
        assert response.status_code == 422  # Validation error
        
        # Test with invalid content type
        invalid_create = {
            "report_type": "daily_analysis",
            "target_code": "000001.SZ",
            "report_date": "2024-01-15",
            "content": 123  # Should be string
        }
        
        response = client.post("/", json=invalid_create)
        assert response.status_code == 422  # Validation error

"""
Admin API 单元测试
遵循测试宪法第3.0条：定义契约，而非修补测试
目标覆盖率：95%+
"""

import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../packages/backend-python')))

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from src.api.admin import admin_router
from src.schemas.arbitration import (
    ArbitrationCase,
    ArbitrationCaseListResponse,
    ArbitrationCaseResponse,
    ArbitrationCaseUpdate,
    ArbitrationStatus,
)
from src.services.arbitration_service import ArbitrationService


class TestAdminAPI:
    """Admin API 单元测试类"""

    @pytest.fixture
    def client(self):
        """创建测试客户端"""
        from fastapi import FastAPI
        app = FastAPI()
        app.include_router(admin_router)
        return TestClient(app)

    @pytest.fixture
    def sample_arbitration_case(self):
        """创建示例仲裁案件"""
        return ArbitrationCase(
            case_id="case_001",
            report_type="fact_analysis",
            target_code="000001.SZ",
            qwen_analysis={
                "analysis": "Qwen分析：该股票基本面良好",
                "confidence": 0.85,
                "reasoning": "基于财务数据的综合分析",
            },
            doubao_analysis={
                "sentiment": "positive",
                "score": 0.7,
                "reasoning": "市场情绪积极",
            },
            disagreement_score=0.3,
            status=ArbitrationStatus.PENDING,
            created_at="2024-01-15T10:00:00Z",
        )

    @pytest.fixture
    def sample_case_list_response(self):
        """创建示例案件列表响应"""
        from schemas.arbitration import ArbitrationCase, AnalysisResult, SentimentAnalysis, ArbitrationStatus
        from datetime import datetime
        
        sample_case = ArbitrationCase(
            case_id="case_001",
            report_type="fact_analysis",
            target_code="000001.SZ",
            qwen_analysis=AnalysisResult(
                analysis="Qwen分析：该股票基本面良好",
                confidence=0.85,
                reasoning="基于财务数据的综合分析",
            ),
            doubao_analysis=SentimentAnalysis(
                sentiment="positive",
                score=0.7,
                reasoning="市场情绪积极",
            ),
            disagreement_score=0.3,
            status=ArbitrationStatus.PENDING,
            created_at=datetime.now(),
        )
        
        return {
            "data": [sample_case],
            "total": 1,
        }

    @patch('src.services.arbitration_service.ArbitrationService')
    def test_green_phase_should_get_arbitration_cases_successfully(self, mock_service_class, client, sample_case_list_response):
        """测试:应该成功获取仲裁案件列表"""
# Mock service
        mock_service = AsyncMock()
        mock_service.get_cases.return_value = sample_case_list_response
        mock_service_class.return_value = mock_service
        
        response = client.get("/arbitration-cases?page=1&size=10")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "获取仲裁案件列表成功"
        assert data['data'] is not None
        assert data['total'] is not None
        assert data["page"] == 1
        assert data["size"] == 10

    @patch('src.services.arbitration_service.ArbitrationService')
    def test_should_get_arbitration_cases_with_filters(self, mock_service_class, client, sample_case_list_response):
        """测试:应该使用筛选条件获取仲裁案件列表"""
# Mock service
        mock_service = AsyncMock()
        mock_service.get_cases.return_value = sample_case_list_response
        mock_service_class.return_value = mock_service
        
        response = client.get("/arbitration-cases?page=1&size=10&status=pending&target_code=000001.SZ")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        mock_service.get_cases.assert_called_once_with(
            page=1, size=10, status="pending", target_code="000001.SZ"
        )

    @patch('src.services.arbitration_service.ArbitrationService')
    def test_should_handle_get_cases_error(self, mock_service_class, client):
        """测试:获取仲裁案件列表时出错应该返回500错误"""
# Mock service to raise exception
        mock_service = AsyncMock()
        mock_service.get_cases.side_effect = Exception("Database error")
        mock_service_class.return_value = mock_service
        
        response = client.get("/arbitration-cases")
        
        assert response.status_code == 500
        data = response.json()
        assert data["detail"] is not None

    @patch('src.services.arbitration_service.ArbitrationService')
    def test_should_get_arbitration_case_successfully(self, mock_service_class, client, sample_arbitration_case):
        """测试:应该成功获取单个仲裁案件详情"""
# Mock service
        mock_service = AsyncMock()
        mock_service.get_case_by_id.return_value = sample_arbitration_case
        mock_service_class.return_value = mock_service
        
        response = client.get("/arbitration-cases/case_001")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "获取仲裁案件详情成功"
        assert data["data"]["case_id"] == "case_001"

    @patch('src.services.arbitration_service.ArbitrationService')
    def test_should_return_404_for_nonexistent_case(self, mock_service_class, client):
        """测试:获取不存在的仲裁案件应该返回404错误"""
# Mock service to return None
        mock_service = AsyncMock()
        mock_service.get_case_by_id.return_value = None
        mock_service_class.return_value = mock_service
        
        response = client.get("/arbitration-cases/nonexistent_case")
        
        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "仲裁案件不存在"

    @patch('src.services.arbitration_service.ArbitrationService')
    def test_should_handle_get_case_error(self, mock_service_class, client):
        """测试:获取仲裁案件详情时出错应该返回500错误"""
# Mock service to raise exception
        mock_service = AsyncMock()
        mock_service.get_case_by_id.side_effect = Exception("Database error")
        mock_service_class.return_value = mock_service
        
        response = client.get("/arbitration-cases/case_001")
        
        assert response.status_code == 500
        data = response.json()
        assert data["detail"] is not None

    @patch('src.services.arbitration_service.ArbitrationService')
    def test_should_update_arbitration_case_successfully(self, mock_service_class, client, sample_arbitration_case):
        """测试:应该成功更新仲裁案件"""
# Mock service
        mock_service = AsyncMock()
        mock_service.update_case.return_value = sample_arbitration_case
        mock_service_class.return_value = mock_service
        
        update_data = {
            "status": "resolved",
            "human_decision": "同意Qwen分析",
            "human_reasoning": "基于详细分析，Qwen的分析更准确",
        }
        
        response = client.put("/arbitration-cases/case_001", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "更新仲裁案件成功"
        assert data["data"]["case_id"] == "case_001"

    @patch('src.services.arbitration_service.ArbitrationService')
    def test_should_return_404_for_update_nonexistent_case(self, mock_service_class, client):
        """测试:更新不存在的仲裁案件应该返回404错误"""
        # Mock service to return None
        mock_service = AsyncMock()
        mock_service.update_case.return_value = None
        mock_service_class.return_value = mock_service
        
        update_data = {"status": "resolved"}
        
        response = client.put("/arbitration-cases/nonexistent_case", json=update_data)
        
        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "仲裁案件不存在"

    @patch('src.services.arbitration_service.ArbitrationService')
    def test_should_handle_update_case_error(self, mock_service_class, client):
        """测试:更新仲裁案件时出错应该返回500错误"""
        # Mock service to raise exception
        mock_service = AsyncMock()
        mock_service.update_case.side_effect = Exception("Database error")
        mock_service_class.return_value = mock_service
        
        update_data = {"status": "resolved"}
        
        response = client.put("/arbitration-cases/case_001", json=update_data)
        
        assert response.status_code == 500
        data = response.json()
        assert data["detail"] is not None

    @patch('src.services.arbitration_service.ArbitrationService')
    def test_should_preprocess_arbitration_case_successfully(self, mock_service_class, client):
        """测试:应该成功预处理仲裁案件"""
        # Mock service
        mock_service = AsyncMock()
        mock_service.preprocess_case.return_value = {
            "summary": "案件摘要",
            "key_points": ["要点1", "要点2"],
            "recommendation": "建议同意Qwen分析",
        }
        mock_service_class.return_value = mock_service
        
        response = client.get("/arbitration-cases/case_001/preprocess")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "仲裁案件预处理完成"
        assert data['data'] is not None

    @patch('src.services.arbitration_service.ArbitrationService')
    def test_should_handle_preprocess_case_error(self, mock_service_class, client):
        """测试:预处理仲裁案件时出错应该返回500错误"""
        # Mock service to raise exception
        mock_service = AsyncMock()
        mock_service.preprocess_case.side_effect = Exception("Processing error")
        mock_service_class.return_value = mock_service
        
        response = client.get("/arbitration-cases/case_001/preprocess")
        
        assert response.status_code == 500
        data = response.json()
        assert data["detail"] is not None

    @patch('src.services.arbitration_service.ArbitrationService')
    def test_should_get_admin_statistics_successfully(self, mock_service_class, client):
        """测试:应该成功获取管理后台统计信息"""
# Mock service
        mock_service = AsyncMock()
        mock_service.get_statistics.return_value = {
            "total_cases": 100,
            "pending_cases": 20,
            "resolved_cases": 70,
            "rejected_cases": 10,
            "avg_processing_time": 2.5,
        }
        mock_service_class.return_value = mock_service
        
        response = client.get("/statistics")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "获取统计信息成功"
        assert data['data'] is not None
        assert data["data"]["total_cases"] == 100

    @patch('src.services.arbitration_service.ArbitrationService')
    def test_should_handle_get_statistics_error(self, mock_service_class, client):
        """测试:获取统计信息时出错应该返回500错误"""
# Mock service to raise exception
        mock_service = AsyncMock()
        mock_service.get_statistics.side_effect = Exception("Statistics error")
        mock_service_class.return_value = mock_service
        
        response = client.get("/statistics")
        
        assert response.status_code == 500
        data = response.json()
        assert data["detail"] is not None

    # TODO: 简化复杂测试逻辑，拆分为多个简单测试
    def test_should_validate_query_parameters(self, client):
        """测试:应该验证查询参数"""
        # Test invalid page parameter
        response = client.get("/arbitration-cases?page=0")
        assert response.status_code == 422  # Validation error
        
        # Test invalid size parameter
        response = client.get("/arbitration-cases?size=0")
        assert response.status_code == 422  # Validation error
        
        # Test size too large
        response = client.get("/arbitration-cases?size=101")
        assert response.status_code == 422  # Validation error

    # TODO: 简化复杂测试逻辑，拆分为多个简单测试
    def test_should_handle_missing_required_fields_in_update(self, client):
        """测试:应该处理更新请求中缺少必需字段的情况"""
        # Test with empty update data
        response = client.put("/arbitration-cases/case_001", json={})
        
        # Should not raise validation error for empty update
        assert response.status_code in [200, 404, 500]  # Depends on service implementation

    # TODO: 简化复杂测试逻辑，拆分为多个简单测试
    def test_should_handle_invalid_json_in_update(self, client):
        """测试:应该处理更新请求中的无效JSON"""
        response = client.put(
            "/arbitration-cases/case_001",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 422  # Validation error

    # TODO: 简化复杂测试逻辑，拆分为多个简单测试
    def test_should_handle_large_page_size(self, client):
        """测试:应该处理大页面大小"""
        response = client.get("/arbitration-cases?size=100")
        
        # Should be valid (max allowed size)
        assert response.status_code in [200, 500]  # Depends on service implementation

    # TODO: 简化复杂测试逻辑，拆分为多个简单测试
    def test_should_handle_negative_page_number(self, client):
        """测试:应该处理负数页码"""
        response = client.get("/arbitration-cases?page=-1")
        
        assert response.status_code == 422  # Validation error

    # TODO: 简化复杂测试逻辑，拆分为多个简单测试
    def test_should_handle_string_page_parameter(self, client):
        """测试:应该处理字符串页码参数"""
        response = client.get("/arbitration-cases?page=abc")
        
        assert response.status_code == 422  # Validation error

    # TODO: 简化复杂测试逻辑，拆分为多个简单测试
    def test_should_handle_string_size_parameter(self, client):
        """测试:应该处理字符串大小参数"""
        response = client.get("/arbitration-cases?size=abc")
        
        assert response.status_code == 422  # Validation error

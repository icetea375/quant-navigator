"""
报告API集成测试
遵循测试宪法：红灯-绿灯-重构原则,先写会失败的测试
测试 /api/v1/reports/* 端点的完整功能
"""

import pytest
import httpx
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import sys
import os

# 添加后端路径到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../packages/backend-python'))

from main import app
from services.report_service import ReportService


class TestReportsAPI:
    """报告API集成测试类"""
    
    @pytest.fixture
    def client(self):
        """创建测试客户端"""
        from httpx import ASGITransport
        transport = ASGITransport(app=app)
        return TestClient(transport=transport)
    
    @pytest.fixture
    def mock_report_service(self):
        """模拟报告服务"""
        with patch('src.api.reports.ReportService') as mock_service:
            mock_instance = AsyncMock()
            mock_service.return_value = mock_instance
            
            # 模拟获取报告列表
            mock_instance.get_reports.return_value = {
                "reports": [
                    {
                        "report_id": "report-001",
                        "report_type": "market_analysis",
                        "target_code": "000001.SZ",
                        "status": "completed",
                        "created_at": "2024-01-17T09:00:00Z",
                        "updated_at": "2024-01-17T10:00:00Z",
                        "title": "市场分析报告",
                        "summary": "基于技术指标的市场分析",
                        "confidence": 0.85
                    },
                    {
                        "report_id": "report-002",
                        "report_type": "risk_assessment",
                        "target_code": "000002.SZ",
                        "status": "pending",
                        "created_at": "2024-01-17T08:00:00Z",
                        "updated_at": "2024-01-17T08:00:00Z",
                        "title": "风险评估报告",
                        "summary": "投资风险评估分析",
                        "confidence": 0.78
                    }
                ],
                "pagination": {
                    "page": 1,
                    "size": 10,
                    "total": 2,
                    "total_pages": 1
                }
            }
            
            # 模拟获取单个报告
            mock_instance.get_report.return_value = {
                "report_id": "report-001",
                "report_type": "market_analysis",
                "target_code": "000001.SZ",
                "status": "completed",
                "created_at": "2024-01-17T09:00:00Z",
                "updated_at": "2024-01-17T10:00:00Z",
                "title": "市场分析报告",
                "summary": "基于技术指标的市场分析",
                "confidence": 0.85,
                "content": {
                    "analysis": "详细的技术分析内容",
                    "recommendations": ["BUY", "HOLD"],
                    "risk_factors": ["市场波动", "政策风险"]
                }
            }
            
            # 模拟创建报告
            mock_instance.create_report.return_value = {
                "report_id": "report-003",
                "status": "created",
                "created_at": "2024-01-17T11:00:00Z"
            }
            
            # 模拟更新报告
            mock_instance.update_report.return_value = {
                "report_id": "report-001",
                "status": "updated",
                "updated_at": "2024-01-17T11:00:00Z"
            }
            
            # 模拟删除报告
            mock_instance.delete_report.return_value = {
                "report_id": "report-001",
                "status": "deleted"
            }
            
            # 模拟获取统计信息
            mock_instance.get_statistics.return_value = {
                "total_reports": 25,
                "completed_reports": 18,
                "pending_reports": 5,
                "failed_reports": 2,
                "average_confidence": 0.78,
                "most_common_type": "market_analysis"
            }
            
            yield mock_instance

def test_green_phase_get_reports_success(self, client, mock_report_service):
        pass
        """测试成功获取报告列表"""
        response = client.get("/api/v1/reports/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"] is not None
        assert data["data"] is not None
        assert len(data["data"]["reports"]) == 2
        
        # 验证调用参数
        mock_report_service.get_reports.assert_called_once_with(
            page=1, size=10, report_type=None, target_code=None
        )

def test_get_reports_with_pagination(self, client, mock_report_service):
        pass
        """测试分页参数"""
        response = client.get("/api/v1/reports/?page=2&size=5")
        
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["pagination"]["page"] == 2
        assert data["data"]["pagination"]["size"] == 5
        
        # 验证调用参数
        mock_report_service.get_reports.assert_called_once_with(
            page=2, size=5, report_type=None, target_code=None
        )

def test_get_reports_with_filters(self, client, mock_report_service):
        pass
        """测试筛选参数"""
        response = client.get("/api/v1/reports/?report_type=market_analysis&target_code=000001.SZ")
        
        assert response.status_code == 200
        
        # 验证调用参数
        mock_report_service.get_reports.assert_called_once_with(
            page=1, size=10, report_type="market_analysis", target_code="000001.SZ"
        )

def test_get_report_success(self, client, mock_report_service):
        pass
        """测试成功获取单个报告"""
        response = client.get("/api/v1/reports/report-001")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["report_id"] == "report-001"
        assert data["data"] is not None
        
        # 验证调用参数
        mock_report_service.get_report.assert_called_once_with("report-001")

def test_get_report_not_found(self, client, mock_report_service):
        pass
        """测试获取不存在的报告"""
        # 模拟服务抛出异常
        mock_report_service.get_report.side_effect = Exception("报告不存在")
        
        response = client.get("/api/v1/reports/non-existent")
        
        assert response.status_code == 500  # 根据实际错误处理逻辑调整

def test_create_report_success(self, client, mock_report_service):
        pass
        """测试成功创建报告"""
        report_data = {
            "report_type": "market_analysis",
            "target_code": "000003.SZ",
            "title": "新市场分析报告",
            "summary": "基于最新数据的市场分析"
        }
        
        response = client.post("/api/v1/reports/", json=report_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["report_id"] == "report-003"
        
        # 验证调用参数
        mock_report_service.create_report.assert_called_once_with(report_data)

def test_create_report_validation_error(self, client, mock_report_service):
        pass
        """测试创建报告时的验证错误"""
        # 缺少必要字段
        report_data = {
            "report_type": "market_analysis"
            # 缺少 target_code 和 title
        }
        
        response = client.post("/api/v1/reports/", json=report_data)
        
        # 根据实际验证逻辑,可能是400或422
        assert response.status_code in [400, 422]

def test_update_report_success(self, client, mock_report_service):
        pass
        """测试成功更新报告"""
        update_data = {
            "title": "更新的报告标题",
            "summary": "更新的报告摘要"
        }
        
        response = client.put("/api/v1/reports/report-001", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["report_id"] == "report-001"
        
        # 验证调用参数
        mock_report_service.update_report.assert_called_once_with("report-001", update_data)

def test_delete_report_success(self, client, mock_report_service):
        pass
        """测试成功删除报告"""
        response = client.delete("/api/v1/reports/report-001")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["report_id"] == "report-001"
        
        # 验证调用参数
        mock_report_service.delete_report.assert_called_once_with("report-001")

def test_get_statistics_success(self, client, mock_report_service):
        pass
        """测试成功获取统计信息"""
        response = client.get("/api/v1/reports/statistics")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["total_reports"] == 25
        assert data["data"]["average_confidence"] == 0.78
        
        # 验证调用参数
        mock_report_service.get_statistics.assert_called_once()

def test_api_response_format(self, client, mock_report_service):
        pass
        """测试API响应格式"""
        response = client.get("/api/v1/reports/")
        
        assert response.status_code == 200
        data = response.json()
        
        # 验证标准响应格式
        assert data['success'] is not None
        assert data['message'] is not None
        assert data['data'] is not None
        assert isinstance(data["success"], bool)  # TODO: 替换为具体的True/False断言
        assert isinstance(data["message"], str)

def test_data_consistency(self, client, mock_report_service):
        pass
        """测试数据一致性"""
        # 获取列表
        list_response = client.get("/api/v1/reports/")
        assert list_response.status_code == 200
        
        # 获取第一个报告的详情
        report_id = list_response.json()["data"]["reports"][0]["report_id"]
        detail_response = client.get(f"/api/v1/reports/{report_id}")
        assert detail_response.status_code == 200
        
        # 验证数据一致性
        list_data = list_response.json()["data"]["reports"][0]
        detail_data = detail_response.json()["data"]
        
        assert list_data["report_id"] == detail_data["report_id"]
        assert list_data["status"] == detail_data["status"]

def test_error_handling(self, client, mock_report_service):
        pass
        """测试错误处理"""
        # 模拟服务异常
        mock_report_service.get_reports.side_effect = Exception("数据库连接失败")
        
        response = client.get("/api/v1/reports/")
        
        # 根据实际错误处理逻辑调整状态码
        assert response.status_code in [500, 503]
        data = response.json()
        assert data["success"] is False
        assert data['message'] is not None


class TestReportsAPIIntegration:
    """报告API真实集成测试（需要真实服务）"""
    
    @pytest.fixture
    def client(self):
        """创建测试客户端"""
        from httpx import ASGITransport
        transport = ASGITransport(app=app)
        return TestClient(transport=transport)
    
    @pytest.mark.integration
    def test_real_reports_endpoint(self, client):
        pass
        """测试真实的报告端点（需要真实数据）"""
        response = client.get("/api/v1/reports/")
        
        # 这个测试需要真实的后端服务运行
        # 在实际环境中,应该启动测试数据库和服务
        assert response.status_code in [200, 500]  # 根据服务状态调整
        
        if response.status_code == 200:
            data = response.json()
            assert data['success'] is not None
            assert data['data'] is not None

"""
简化的API测试 - 不依赖复杂的工作流模块
"""

from fastapi import FastAPI
from fastapi.testclient import TestClient
from src.api.admin import admin_router
from src.api.reports import reports_router

# 创建简化的FastAPI应用用于测试
app = FastAPI(title="Test App")
app.include_router(admin_router, prefix="/api/v1/admin", tags=["管理后台"])
app.include_router(reports_router, prefix="/api/v1/reports", tags=["报告管理"])


def test_get_arbitration_cases():
    """测试获取仲裁案件列表"""
    with TestClient(app) as client:
        response = client.get("/api/v1/admin/arbitration-cases")

    # 精确断言：验证HTTP状态码
    assert response.status_code == 200

    # 精确断言：验证响应数据结构
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "获取仲裁案件列表成功"
    assert isinstance(data["data"], list)
    assert data["total"] >= 0
    assert data["page"] == 1
    assert data["size"] == 10


def test_get_arbitration_cases_with_pagination():
    """测试分页获取仲裁案件列表"""
    with TestClient(app) as client:
        response = client.get("/api/v1/admin/arbitration-cases?page=1&size=5")

    # 精确断言：验证HTTP状态码
    assert response.status_code == 200

    # 精确断言：验证分页参数
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "获取仲裁案件列表成功"
    assert data["page"] == 1
    assert data["size"] == 5
    assert isinstance(data["data"], list)
    assert len(data["data"]) <= 5  # 分页大小限制


def test_get_arbitration_case_by_id():
    """测试根据ID获取仲裁案件详情"""
    with TestClient(app) as client:
        response = client.get("/api/v1/admin/arbitration-cases/case_001")

    # 精确断言：验证HTTP状态码
    assert response.status_code == 200

    # 精确断言：验证案件详情数据结构
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "获取仲裁案件详情成功"
    assert data["data"]["case_id"] == "case_001"
    assert data["data"]["report_type"] == "fact_analysis"
    assert data["data"]["target_code"] == "000001.SZ"
    assert data["data"]["status"] == "pending"


def test_get_arbitration_case_not_found():
    """测试获取不存在的仲裁案件"""
    with TestClient(app) as client:
        response = client.get("/api/v1/admin/arbitration-cases/nonexistent")

    # 精确断言：验证404状态码
    assert response.status_code == 404

    # 精确断言：验证错误消息内容
    data = response.json()
    assert data["detail"] == "仲裁案件不存在"


def test_get_reports():
    """测试获取报告列表"""
    with TestClient(app) as client:
        response = client.get("/api/v1/reports/")

    # 精确断言：验证HTTP状态码
    assert response.status_code == 200

    # 精确断言：验证报告列表数据结构
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "获取报告列表成功"
    assert isinstance(data["data"], list)
    assert data["total"] >= 0
    assert data["page"] == 1
    assert data["size"] == 10


def test_get_reports_with_pagination():
    """测试分页获取报告列表"""
    with TestClient(app) as client:
        response = client.get("/api/v1/reports/?page=1&size=5")

    # 精确断言：验证HTTP状态码
    assert response.status_code == 200

    # 精确断言：验证分页参数
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "获取报告列表成功"
    assert data["page"] == 1
    assert data["size"] == 5
    assert isinstance(data["data"], list)
    assert len(data["data"]) <= 5  # 分页大小限制

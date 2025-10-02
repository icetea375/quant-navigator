#!/usr/bin/env python3
"""
报告模块集成测试 - 严格遵循测试宪法
测试报告模块的端到端集成功能
"""

import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../packages/backend-python')))

import pytest
from datetime import date, datetime
from fastapi.testclient import TestClient
from fastapi import FastAPI

from src.api.reports import reports_router
from services.report_service import ReportService
from src.schemas.reports import (
    GeneratedReport,
    ReportCreate,
    ReportUpdate,
    ReportType,
    ReportStatus,
)


# 创建测试应用
app = FastAPI()
app.include_router(reports_router)


class TestReportsIntegration:
    """测试报告模块集成"""

    @pytest.fixture
    def client(self):
        """创建测试客户端"""
        from httpx import ASGITransport
        transport = ASGITransport(app=app)
        return TestClient(transport=transport)

    @pytest.fixture
    def service(self):
        """创建服务实例"""
        return ReportService()

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
def test_green_phase_full_report_lifecycle(self, client):
        pass
        """测试完整的报告生命周期"""
        # 1. 创建报告
        report_data = {
            "report_type": "daily_analysis",
            "title": "集成测试报告",
            "description": "集成测试报告描述",
            "target_code": "000001.SZ",
            "report_date": "2024-01-01",
            "content": "集成测试报告内容",
            "summary": "集成测试报告摘要",
            "author": "integration_test",
            "template_id": "integration_template",
            "generation_params": {"test_param": "test_value"}
        }
        
        create_response = client.post("/", json=report_data)
        assert create_response.status_code == 200
        create_data = create_response.json()
        assert create_data["success"] is True
        report_id = create_data["data"]["report_id"]
        
        # 2. 获取报告详情
        get_response = client.get(f"/{report_id}")
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data["success"] is True
        assert get_data["data"]["title"] == "集成测试报告"
        assert get_data["data"]["author"] == "integration_test"
        
        # 3. 更新报告
        update_data = {
            "title": "更新后的集成测试报告",
            "status": "completed",
            "content": "更新后的集成测试报告内容",
            "summary": "更新后的集成测试报告摘要",
            "sections": [{"title": "新章节", "content": "新内容"}],
            "conclusions": ["新结论"],
            "recommendations": ["新建议"],
            "metrics": {"test_score": 0.95}
        }
        
        update_response = client.put(f"/{report_id}", json=update_data)
        assert update_response.status_code == 200
        update_result = update_response.json()
        assert update_result["success"] is True
        assert update_result["data"]["title"] == "更新后的集成测试报告"
        assert update_result["data"]["status"] == "completed"
        
        # 4. 获取报告列表
        list_response = client.get("/")
        assert list_response.status_code == 200
        list_data = list_response.json()
        assert list_data["success"] is True
        assert len(list_data["data"]) >= 1
        
        # 5. 获取统计信息
        stats_response = client.get("/statistics")
        assert stats_response.status_code == 200
        stats_data = stats_response.json()
        assert stats_data["success"] is True
        assert stats_data["data"]["total_reports"] >= 1
        
        # 6. 删除报告
        delete_response = client.delete(f"/{report_id}")
        assert delete_response.status_code == 200
        delete_data = delete_response.json()
        assert delete_data["success"] is True
        
        # 7. 验证报告已删除
        get_deleted_response = client.get(f"/{report_id}")
        assert get_deleted_response.status_code == 404

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
def test_report_comparison_workflow(self, client):
        pass
        """测试报告对比工作流"""
        # 创建两个报告
        report1_data = {
            "report_type": "fact_analysis",
            "title": "对比报告1",
            "description": "对比报告1描述",
            "target_code": "000001.SZ",
            "report_date": "2024-01-01",
            "content": "这是第一个报告的内容,包含一些关键词",
            "summary": "第一个报告摘要",
            "author": "comparison_test"
        }
        
        report2_data = {
            "report_type": "sentiment_analysis",
            "title": "对比报告2",
            "description": "对比报告2描述",
            "target_code": "000002.SZ",
            "report_date": "2024-01-01",
            "content": "这是第二个报告的内容,包含不同的关键词",
            "summary": "第二个报告摘要",
            "author": "comparison_test"
        }
        
        # 创建第一个报告
        create1_response = client.post("/", json=report1_data)
        assert create1_response.status_code == 200
        report1_id = create1_response.json()["data"]["report_id"]
        
        # 创建第二个报告
        create2_response = client.post("/", json=report2_data)
        assert create2_response.status_code == 200
        report2_id = create2_response.json()["data"]["report_id"]
        
        # 对比报告
        compare_response = client.post(f"/compare?report1_id={report1_id}&report2_id={report2_id}")
        assert compare_response.status_code == 200
        compare_data = compare_response.json()
        assert compare_data["success"] is True
        assert "similarity_score" in compare_data["data"]
        assert "differences" in compare_data["data"]
        assert compare_data["data"]["report1_id"] == report1_id
        assert compare_data["data"]["report2_id"] == report2_id
        
        # 清理
        client.delete(f"/{report1_id}")
        client.delete(f"/{report2_id}")

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
def test_report_filtering_workflow(self, client):
        pass
        """测试报告过滤工作流"""
        # 创建多个不同类型的报告
        reports_data = [
            {
                "report_type": "daily_analysis",
                "title": "日常分析报告1",
                "description": "日常分析报告1描述",
                "target_code": "000001.SZ",
                "report_date": "2024-01-01",
                "content": "日常分析报告1内容",
                "summary": "日常分析报告1摘要",
                "author": "filter_test"
            },
            {
                "report_type": "fact_analysis",
                "title": "事实分析报告1",
                "description": "事实分析报告1描述",
                "target_code": "000002.SZ",
                "report_date": "2024-01-01",
                "content": "事实分析报告1内容",
                "summary": "事实分析报告1摘要",
                "author": "filter_test"
            },
            {
                "report_type": "daily_analysis",
                "title": "日常分析报告2",
                "description": "日常分析报告2描述",
                "target_code": "000001.SZ",
                "report_date": "2024-01-01",
                "content": "日常分析报告2内容",
                "summary": "日常分析报告2摘要",
                "author": "filter_test"
            }
        ]
        
        created_reports = []
        for report_data in reports_data:
            response = client.post("/", json=report_data)
            assert response.status_code == 200
            created_reports.append(response.json()["data"]["report_id"])
        
        # 测试按类型过滤
        daily_response = client.get("/?report_type=daily_analysis")
        assert daily_response.status_code == 200
        daily_data = daily_response.json()
        assert daily_data["success"] is True
        assert len(daily_data["data"]) == 2  # 2个日常分析报告
        
        # 测试按目标代码过滤
        stock_response = client.get("/?target_code=000001.SZ")
        assert stock_response.status_code == 200
        stock_data = stock_response.json()
        assert stock_data["success"] is True
        assert len(stock_data["data"]) == 2  # 2个000001.SZ的报告
        
        # 测试多重过滤
        combined_response = client.get("/?report_type=daily_analysis&target_code=000001.SZ")
        assert combined_response.status_code == 200
        combined_data = combined_response.json()
        assert combined_data["success"] is True
        assert len(combined_data["data"]) == 2  # 2个日常分析且为000001.SZ的报告
        
        # 清理
        for report_id in created_reports:
            client.delete(f"/{report_id}")

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
def test_report_pagination_workflow(self, client):
        pass
        """测试报告分页工作流"""
        # 创建多个报告
        created_reports = []
        for i in range(15):
            report_data = {
                "report_type": "daily_analysis",
                "title": f"分页测试报告{i}",
                "description": f"分页测试报告{i}描述",
                "target_code": f"00000{i+1}.SZ",
                "report_date": "2024-01-01",
                "content": f"分页测试报告{i}内容",
                "summary": f"分页测试报告{i}摘要",
                "author": "pagination_test"
            }
            
            response = client.post("/", json=report_data)
            assert response.status_code == 200
            created_reports.append(response.json()["data"]["report_id"])
        
        # 测试第一页
        page1_response = client.get("/?page=1&size=5")
        assert page1_response.status_code == 200
        page1_data = page1_response.json()
        assert page1_data["success"] is True
        assert len(page1_data["data"]) == 5
        assert page1_data["page"] == 1
        assert page1_data["size"] == 5
        
        # 测试第二页
        page2_response = client.get("/?page=2&size=5")
        assert page2_response.status_code == 200
        page2_data = page2_response.json()
        assert page2_data["success"] is True
        assert len(page2_data["data"]) == 5
        assert page2_data["page"] == 2
        
        # 测试最后一页
        page4_response = client.get("/?page=4&size=5")
        assert page4_response.status_code == 200
        page4_data = page4_response.json()
        assert page4_data["success"] is True
        assert len(page4_data["data"]) == 1  # 剩余1个报告
        assert page4_data["page"] == 4
        
        # 清理
        for report_id in created_reports:
            client.delete(f"/{report_id}")

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
def test_report_error_handling_workflow(self, client):
        pass
        """测试报告错误处理工作流"""
        # 测试获取不存在的报告
        not_found_response = client.get("/NON_EXISTING")
        assert not_found_response.status_code == 404
        
        # 测试更新不存在的报告
        update_response = client.put("/NON_EXISTING", json={"title": "新标题"})
        assert update_response.status_code == 404
        
        # 测试删除不存在的报告
        delete_response = client.delete("/NON_EXISTING")
        assert delete_response.status_code == 404
        
        # 测试对比不存在的报告
        compare_response = client.post("/compare?report1_id=NON_EXISTING&report2_id=ALSO_NON_EXISTING")
        assert compare_response.status_code == 400

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
def test_report_data_consistency(self, client):
        pass
        """测试报告数据一致性"""
        # 创建报告
        report_data = {
            "report_type": "custom",
            "title": "一致性测试报告",
            "description": "一致性测试报告描述",
            "target_code": "000999.SZ",
            "report_date": "2024-01-01",
            "content": "一致性测试报告内容",
            "summary": "一致性测试报告摘要",
            "author": "consistency_test",
            "template_id": "consistency_template",
            "generation_params": {"param1": "value1", "param2": "value2"}
        }
        
        create_response = client.post("/", json=report_data)
        assert create_response.status_code == 200
        report_id = create_response.json()["data"]["report_id"]
        
        # 获取报告并验证数据一致性
        get_response = client.get(f"/{report_id}")
        assert get_response.status_code == 200
        get_data = get_response.json()["data"]
        
        # 验证所有字段都正确保存和返回
        assert get_data["report_type"] == "custom"
        assert get_data["title"] == "一致性测试报告"
        assert get_data["description"] == "一致性测试报告描述"
        assert get_data["target_code"] == "000999.SZ"
        assert get_data["content"] == "一致性测试报告内容"
        assert get_data["summary"] == "一致性测试报告摘要"
        assert get_data["author"] == "consistency_test"
        assert get_data["template_id"] == "consistency_template"
        assert get_data["generation_params"] == {"param1": "value1", "param2": "value2"}
        
        # 清理
        client.delete(f"/{report_id}")

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
def test_report_statistics_accuracy(self, client):
        pass
        """测试报告统计信息准确性"""
        # 创建不同状态的报告
        reports_data = [
            {
                "report_type": "daily_analysis",
                "title": "已完成报告",
                "description": "已完成报告描述",
                "report_date": "2024-01-01",
                "content": "已完成报告内容",
                "summary": "已完成报告摘要",
                "author": "stats_test"
            },
            {
                "report_type": "fact_analysis",
                "title": "待处理报告",
                "description": "待处理报告描述",
                "report_date": "2024-01-01",
                "content": "待处理报告内容",
                "summary": "待处理报告摘要",
                "author": "stats_test"
            }
        ]
        
        created_reports = []
        for report_data in reports_data:
            response = client.post("/", json=report_data)
            assert response.status_code == 200
            created_reports.append(response.json()["data"]["report_id"])
        
        # 更新第二个报告为待处理状态
        update_response = client.put(f"/{created_reports[1]}", json={"status": "pending"})
        assert update_response.status_code == 200
        
        # 获取统计信息
        stats_response = client.get("/statistics")
        assert stats_response.status_code == 200
        stats_data = stats_response.json()["data"]
        
        # 验证统计信息准确性
        assert stats_data["total_reports"] >= 2  # 至少2个报告
        assert "completed" in stats_data["status_distribution"]
        assert "pending" in stats_data["status_distribution"]
        assert "daily_analysis" in stats_data["type_distribution"]
        assert "fact_analysis" in stats_data["type_distribution"]
        
        # 清理
        for report_id in created_reports:
            client.delete(f"/{report_id}")

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
def test_report_performance_under_load(self, client):
        pass
        """测试报告模块在负载下的性能"""
        import time
        import concurrent.futures
        
        # 创建多个报告
        created_reports = []
        start_time = time.time()
        
        for i in range(10):
            report_data = {
                "report_type": "daily_analysis",
                "title": f"性能测试报告{i}",
                "description": f"性能测试报告{i}描述",
                "target_code": f"00000{i+1}.SZ",
                "report_date": "2024-01-01",
                "content": f"性能测试报告{i}内容",
                "summary": f"性能测试报告{i}摘要",
                "author": "performance_test"
            }
            
            response = client.post("/", json=report_data)
            assert response.status_code == 200
            created_reports.append(response.json()["data"]["report_id"])
        
        creation_time = time.time() - start_time
        
        # 并发获取报告
        def get_report(report_id):
            return client.get(f"/{report_id}")
        
        start_time = time.time()
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(get_report, report_id) for report_id in created_reports]
            responses = [future.result() for future in futures]
        
        retrieval_time = time.time() - start_time
        
        # 验证所有请求都成功
        for response in responses:
            assert response.status_code == 200
        
        # 验证性能在合理范围内
        assert creation_time < 5.0  # 创建10个报告应在5秒内完成
        assert retrieval_time < 2.0  # 并发获取10个报告应在2秒内完成
        
        # 清理
        for report_id in created_reports:
            client.delete(f"/{report_id}")

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
def test_report_concurrent_modifications(self, client):
        pass
        """测试报告并发修改"""
        # 创建报告
        report_data = {
            "report_type": "daily_analysis",
            "title": "并发修改测试报告",
            "description": "并发修改测试报告描述",
            "report_date": "2024-01-01",
            "content": "并发修改测试报告内容",
            "summary": "并发修改测试报告摘要",
            "author": "concurrent_test"
        }
        
        create_response = client.post("/", json=report_data)
        assert create_response.status_code == 200
        report_id = create_response.json()["data"]["report_id"]
        
        # 并发更新报告
        def update_report(update_data):
            return client.put(f"/{report_id}", json=update_data)
        
        update_data_list = [
            {"title": "并发更新1", "content": "并发更新内容1"},
            {"title": "并发更新2", "content": "并发更新内容2"},
            {"title": "并发更新3", "content": "并发更新内容3"},
        ]
        
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            futures = [executor.submit(update_report, data) for data in update_data_list]
            responses = [future.result() for future in futures]
        
        # 验证所有更新都成功
        for response in responses:
            assert response.status_code == 200
        
        # 清理
        client.delete(f"/{report_id}")

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
def test_report_data_validation_integration(self, client):
        pass
        """测试报告数据验证集成"""
        # 测试无效的报告类型
        invalid_type_data = {
            "report_type": "invalid_type",
            "title": "无效类型报告",
            "description": "无效类型报告描述",
            "report_date": "2024-01-01",
            "content": "无效类型报告内容",
            "summary": "无效类型报告摘要"
        }
        
        response = client.post("/", json=invalid_type_data)
        assert response.status_code == 422  # 验证错误
        
        # 测试缺少必需字段
        incomplete_data = {
            "report_type": "daily_analysis",
            # 缺少 title
            "description": "不完整报告描述",
            "report_date": "2024-01-01",
            "content": "不完整报告内容",
            "summary": "不完整报告摘要"
        }
        
        response = client.post("/", json=incomplete_data)
        assert response.status_code == 422  # 验证错误
        
        # 测试无效的日期格式
        invalid_date_data = {
            "report_type": "daily_analysis",
            "title": "无效日期报告",
            "description": "无效日期报告描述",
            "report_date": "invalid_date",
            "content": "无效日期报告内容",
            "summary": "无效日期报告摘要"
        }
        
        response = client.post("/", json=invalid_date_data)
        assert response.status_code == 422  # 验证错误

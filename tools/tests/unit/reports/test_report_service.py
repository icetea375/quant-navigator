#!/usr/bin/env python3
"""
报告服务测试 - 严格遵循测试宪法
测试 services/report_service.py 中的所有功能
"""

import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../packages/backend-python')))

import pytest
from datetime import date, datetime
from unittest.mock import Mock, patch

from services.report_service import ReportService
from src.schemas.reports import (
    GeneratedReport,
    ReportCreate,
    ReportUpdate,
    ReportType,
    ReportStatus,
)


class TestReportService:
    """测试 ReportService 类"""

    @pytest.fixture
    def service(self):
        """创建服务实例"""
        return ReportService()

    @pytest.fixture
    def sample_report(self):
        """创建示例报告"""
        return GeneratedReport(
            report_id="RPT_000001",
            report_type=ReportType.DAILY_ANALYSIS,
            title="示例报告",
            description="示例报告描述",
            target_code="000001.SZ",
            report_date=date.today(),
            content="示例报告内容",
            summary="示例报告摘要",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
            author="system",
            version="1.0",
        )

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_green_phase_service_initialization(self, service):
        """测试服务初始化"""
        assert service.config == {}
        assert isinstance(service.reports, dict)
        assert service._next_id == 2  # 因为有示例数据
        assert "RPT_000001" in service.reports

    def test_service_initialization_with_config(self):
        """测试带配置的服务初始化"""
        config = {"test_key": "test_value"}
        service = ReportService(config)
        assert service.config == config

    async def test_get_reports_empty(self):
        """测试获取空报告列表"""
        service = ReportService()
        service.reports = {}  # 清空报告
        service._next_id = 1
        
        result = await service.get_reports()
        
        assert result["data"] == []
        assert result["total"] == 0

    async def test_get_reports_with_data(self, service, sample_report):
        """测试获取有数据的报告列表"""
        # 添加更多报告
        service.reports["RPT_000002"] = sample_report
        
        result = await service.get_reports()
        
        assert len(result["data"]) == 2
        assert result["total"] == 2
        assert "RPT_000001" in [r.report_id for r in result["data"]]
        assert "RPT_000002" in [r.report_id for r in result["data"]]

    async def test_get_reports_with_pagination(self, service):
        """测试分页功能"""
        # 添加多个报告
        for i in range(15):
            report = GeneratedReport(
                report_id=f"RPT_{i:06d}",
                report_type=ReportType.DAILY_ANALYSIS,
                title=f"报告{i}",
                description=f"报告{i}描述",
                report_date=date.today(),
                content=f"报告{i}内容",
                summary=f"报告{i}摘要",
                status=ReportStatus.COMPLETED,
                generated_at=datetime.now(),
                created_at=datetime.now(),
            )
            service.reports[f"RPT_{i:06d}"] = report
        
        # 测试第一页
        result = await service.get_reports(page=1, size=5)
        assert len(result["data"]) == 5
        assert result["total"] == 16  # 15个新报告 + 1个示例报告
        
        # 测试第二页
        result = await service.get_reports(page=2, size=5)
        assert len(result["data"]) == 5
        
        # 测试最后一页
        result = await service.get_reports(page=4, size=5)
        assert len(result["data"]) == 1  # 剩余1个报告

    async def test_get_reports_with_type_filter(self, service):
        """测试按类型过滤"""
        # 添加不同类型的报告
        fact_report = GeneratedReport(
            report_id="RPT_FACT",
            report_type=ReportType.FACT_ANALYSIS,
            title="事实分析报告",
            description="事实分析报告描述",
            report_date=date.today(),
            content="事实分析报告内容",
            summary="事实分析报告摘要",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        service.reports["RPT_FACT"] = fact_report
        
        # 过滤事实分析报告
        result = await service.get_reports(report_type="fact_analysis")
        assert len(result["data"]) == 1
        assert result["data"][0].report_type == ReportType.FACT_ANALYSIS
        
        # 过滤日常分析报告
        result = await service.get_reports(report_type="daily_analysis")
        assert len(result["data"]) == 1
        assert result["data"][0].report_type == ReportType.DAILY_ANALYSIS

    async def test_get_reports_with_target_code_filter(self, service):
        """测试按目标代码过滤"""
        # 添加不同目标代码的报告
        stock_report = GeneratedReport(
            report_id="RPT_STOCK",
            report_type=ReportType.DAILY_ANALYSIS,
            title="股票报告",
            description="股票报告描述",
            target_code="000002.SZ",
            report_date=date.today(),
            content="股票报告内容",
            summary="股票报告摘要",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        service.reports["RPT_STOCK"] = stock_report
        
        # 过滤特定股票
        result = await service.get_reports(target_code="000002.SZ")
        assert len(result["data"]) == 1
        assert result["data"][0].target_code == "000002.SZ"
        
        # 过滤不存在的股票
        result = await service.get_reports(target_code="999999.SZ")
        assert len(result["data"]) == 0

    async def test_get_reports_with_status_filter(self, service):
        """测试按状态过滤"""
        # 添加不同状态的报告
        pending_report = GeneratedReport(
            report_id="RPT_PENDING",
            report_type=ReportType.DAILY_ANALYSIS,
            title="待处理报告",
            description="待处理报告描述",
            report_date=date.today(),
            content="待处理报告内容",
            summary="待处理报告摘要",
            status=ReportStatus.PENDING,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        service.reports["RPT_PENDING"] = pending_report
        
        # 过滤待处理报告
        result = await service.get_reports(status="pending")
        assert len(result["data"]) == 1
        assert result["data"][0].status == ReportStatus.PENDING
        
        # 过滤已完成报告
        result = await service.get_reports(status="completed")
        assert len(result["data"]) == 1
        assert result["data"][0].status == ReportStatus.COMPLETED

    async def test_get_reports_with_multiple_filters(self, service):
        """测试多重过滤"""
        # 添加多个报告
        report1 = GeneratedReport(
            report_id="RPT_001",
            report_type=ReportType.DAILY_ANALYSIS,
            title="报告1",
            description="报告1描述",
            target_code="000001.SZ",
            report_date=date.today(),
            content="报告1内容",
            summary="报告1摘要",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        report2 = GeneratedReport(
            report_id="RPT_002",
            report_type=ReportType.DAILY_ANALYSIS,
            title="报告2",
            description="报告2描述",
            target_code="000002.SZ",
            report_date=date.today(),
            content="报告2内容",
            summary="报告2摘要",
            status=ReportStatus.PENDING,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        service.reports["RPT_001"] = report1
        service.reports["RPT_002"] = report2
        
        # 多重过滤
        result = await service.get_reports(
            report_type="daily_analysis",
            target_code="000001.SZ",
            status="completed"
        )
        assert len(result["data"]) == 1
        assert result["data"][0].report_id == "RPT_001"

    async def test_get_report_by_id_existing(self, service):
        """测试获取存在的报告"""
        result = await service.get_report_by_id("RPT_000001")
        
        assert result is not None  # TODO: 替换为具体的值断言
        assert result.report_id == "RPT_000001"
        assert result.title == "今日市场分析报告"

    async def test_get_report_by_id_not_existing(self, service):
        """测试获取不存在的报告"""
        result = await service.get_report_by_id("NON_EXISTING")
        
        assert result is None

    async def test_create_report(self, service):
        """测试创建报告"""
        report_data = ReportCreate(
            report_type=ReportType.FACT_ANALYSIS,
            title="新报告",
            description="新报告描述",
            target_code="000003.SZ",
            report_date=date.today(),
            content="新报告内容",
            summary="新报告摘要",
            author="test_user",
            template_id="template_001",
            generation_params={"param1": "value1"},
        )
        
        result = await service.create_report(report_data)
        
        assert result.report_id == "RPT_000002"  # 下一个ID
        assert result.report_type == ReportType.FACT_ANALYSIS
        assert result.title == "新报告"
        assert result.description == "新报告描述"
        assert result.target_code == "000003.SZ"
        assert result.content == "新报告内容"
        assert result.summary == "新报告摘要"
        assert result.status == ReportStatus.PENDING
        assert result.author == "test_user"
        assert result.template_id == "template_001"
        assert result.generation_params == {"param1": "value1"}
        
        # 验证报告已保存
        assert "RPT_000002" in service.reports
        assert service._next_id == 3

    async def test_create_report_with_defaults(self, service):
        """测试使用默认值创建报告"""
        report_data = ReportCreate(
            report_type=ReportType.DAILY_ANALYSIS,
            title="默认值报告",
            description="默认值报告描述",
            report_date=date.today(),
            content="默认值报告内容",
            summary="默认值报告摘要",
        )
        
        result = await service.create_report(report_data)
        
        assert result.author == "system"
        assert result.generation_params == {}

    async def test_update_report_existing(self, service, sample_report):
        """测试更新存在的报告"""
        service.reports["RPT_UPDATE"] = sample_report
        
        update_data = ReportUpdate(
            title="更新后的标题",
            description="更新后的描述",
            content="更新后的内容",
            summary="更新后的摘要",
            status=ReportStatus.FAILED,
            sections=[{"title": "新章节", "content": "新内容"}],
            conclusions=["新结论"],
            recommendations=["新建议"],
            metrics={"new_score": 0.9},
        )
        
        result = await service.update_report("RPT_UPDATE", update_data)
        
        assert result is not None  # TODO: 替换为具体的值断言
        assert result.title == "更新后的标题"
        assert result.description == "更新后的描述"
        assert result.content == "更新后的内容"
        assert result.summary == "更新后的摘要"
        assert result.status == ReportStatus.FAILED
        assert result.sections == [{"title": "新章节", "content": "新内容"}]
        assert result.conclusions == ["新结论"]
        assert result.recommendations == ["新建议"]
        assert result.metrics == {"new_score": 0.9}
        assert result.updated_at is not None

    async def test_update_report_partial(self, service, sample_report):
        """测试部分更新报告"""
        service.reports["RPT_PARTIAL"] = sample_report
        original_title = sample_report.title
        
        update_data = ReportUpdate(
            status=ReportStatus.GENERATING,
        )
        
        result = await service.update_report("RPT_PARTIAL", update_data)
        
        assert result is not None  # TODO: 替换为具体的值断言
        assert result.title == original_title  # 未更新
        assert result.status == ReportStatus.GENERATING  # 已更新

    async def test_update_report_not_existing(self, service):
        """测试更新不存在的报告"""
        update_data = ReportUpdate(title="新标题")
        
        result = await service.update_report("NON_EXISTING", update_data)
        
        assert result is None

    async def test_delete_report_existing(self, service, sample_report):
        """测试删除存在的报告"""
        service.reports["RPT_DELETE"] = sample_report
        
        result = await service.delete_report("RPT_DELETE")
        
        assert result is True
        assert "RPT_DELETE" not in service.reports

    async def test_delete_report_not_existing(self, service):
        """测试删除不存在的报告"""
        result = await service.delete_report("NON_EXISTING")
        
        assert result is False

    async def test_get_reports_by_type(self, service):
        """测试按类型获取报告"""
        # 添加不同类型的报告
        fact_report = GeneratedReport(
            report_id="RPT_FACT",
            report_type=ReportType.FACT_ANALYSIS,
            title="事实分析报告",
            description="事实分析报告描述",
            report_date=date.today(),
            content="事实分析报告内容",
            summary="事实分析报告摘要",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        service.reports["RPT_FACT"] = fact_report
        
        result = await service.get_reports_by_type(ReportType.FACT_ANALYSIS)
        
        assert len(result) == 1
        assert result[0].report_type == ReportType.FACT_ANALYSIS

    async def test_get_reports_by_date_range(self, service):
        """测试按日期范围获取报告"""
        today = date.today()
        yesterday = date.fromordinal(today.toordinal() - 1)
        tomorrow = date.fromordinal(today.toordinal() + 1)
        
        # 添加不同日期的报告
        yesterday_report = GeneratedReport(
            report_id="RPT_YESTERDAY",
            report_type=ReportType.DAILY_ANALYSIS,
            title="昨天报告",
            description="昨天报告描述",
            report_date=yesterday,
            content="昨天报告内容",
            summary="昨天报告摘要",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        tomorrow_report = GeneratedReport(
            report_id="RPT_TOMORROW",
            report_type=ReportType.DAILY_ANALYSIS,
            title="明天报告",
            description="明天报告描述",
            report_date=tomorrow,
            content="明天报告内容",
            summary="明天报告摘要",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        service.reports["RPT_YESTERDAY"] = yesterday_report
        service.reports["RPT_TOMORROW"] = tomorrow_report
        
        # 测试日期范围
        result = await service.get_reports_by_date_range(today, today)
        assert len(result) == 1  # 只有今天的报告
        
        result = await service.get_reports_by_date_range(yesterday, today)
        assert len(result) == 2  # 昨天和今天的报告

    async def test_compare_reports_existing(self, service):
        """测试对比存在的报告"""
        report1 = GeneratedReport(
            report_id="RPT_COMPARE_1",
            report_type=ReportType.DAILY_ANALYSIS,
            title="对比报告1",
            description="对比报告1描述",
            report_date=date.today(),
            content="这是第一个报告的内容,包含一些关键词",
            summary="第一个报告摘要",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        report2 = GeneratedReport(
            report_id="RPT_COMPARE_2",
            report_type=ReportType.DAILY_ANALYSIS,
            title="对比报告2",
            description="对比报告2描述",
            report_date=date.today(),
            content="这是第二个报告的内容,包含不同的关键词",
            summary="第二个报告摘要",
            status=ReportStatus.PENDING,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        service.reports["RPT_COMPARE_1"] = report1
        service.reports["RPT_COMPARE_2"] = report2
        
        result = await service.compare_reports("RPT_COMPARE_1", "RPT_COMPARE_2")
        
        assert result["report1_id"] == "RPT_COMPARE_1"
        assert result["report2_id"] == "RPT_COMPARE_2"
        assert "similarity_score" in result
        assert "differences" in result
        assert "comparison_timestamp" in result
        assert isinstance(result["similarity_score"], float)
        assert isinstance(result["differences"], list)

    async def test_compare_reports_not_existing(self, service):
        """测试对比不存在的报告"""
        with pytest.raises(ValueError, match="报告不存在"):
            await service.compare_reports("NON_EXISTING_1", "NON_EXISTING_2")

    async def test_compare_reports_one_not_existing(self, service, sample_report):
        """测试对比一个不存在的报告"""
        service.reports["RPT_EXISTING"] = sample_report
        
        with pytest.raises(ValueError, match="报告不存在"):
            await service.compare_reports("RPT_EXISTING", "NON_EXISTING")

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_calculate_similarity_identical(self, service):
        """测试计算相同内容的相似度"""
        report1 = GeneratedReport(
            report_id="RPT_1",
            report_type=ReportType.DAILY_ANALYSIS,
            title="相同报告1",
            description="相同报告1描述",
            report_date=date.today(),
            content="完全相同的内容",
            summary="相同摘要",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        report2 = GeneratedReport(
            report_id="RPT_2",
            report_type=ReportType.DAILY_ANALYSIS,
            title="相同报告2",
            description="相同报告2描述",
            report_date=date.today(),
            content="完全相同的内容",
            summary="相同摘要",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        
        similarity = service._calculate_similarity(report1, report2)
        assert similarity == 1.0

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_calculate_similarity_different(self, service):
        """测试计算不同内容的相似度"""
        report1 = GeneratedReport(
            report_id="RPT_1",
            report_type=ReportType.DAILY_ANALYSIS,
            title="不同报告1",
            description="不同报告1描述",
            report_date=date.today(),
            content="完全不同的内容A",
            summary="不同摘要A",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        report2 = GeneratedReport(
            report_id="RPT_2",
            report_type=ReportType.DAILY_ANALYSIS,
            title="不同报告2",
            description="不同报告2描述",
            report_date=date.today(),
            content="完全不同的内容B",
            summary="不同摘要B",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        
        similarity = service._calculate_similarity(report1, report2)
        assert similarity == 0.0

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_calculate_similarity_partial(self, service):
        """测试计算部分相似内容的相似度"""
        report1 = GeneratedReport(
            report_id="RPT_1",
            report_type=ReportType.DAILY_ANALYSIS,
            title="部分相似报告1",
            description="部分相似报告1描述",
            report_date=date.today(),
            content="这是包含共同词汇的内容",
            summary="部分相似摘要",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        report2 = GeneratedReport(
            report_id="RPT_2",
            report_type=ReportType.DAILY_ANALYSIS,
            title="部分相似报告2",
            description="部分相似报告2描述",
            report_date=date.today(),
            content="这是包含不同词汇但也有一些共同词汇的内容",
            summary="部分相似摘要",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        
        similarity = service._calculate_similarity(report1, report2)
        assert 0.0 < similarity < 1.0

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_calculate_similarity_empty_content(self, service):
        """测试计算空内容的相似度"""
        report1 = GeneratedReport(
            report_id="RPT_1",
            report_type=ReportType.DAILY_ANALYSIS,
            title="空内容报告1",
            description="空内容报告1描述",
            report_date=date.today(),
            content="",
            summary="空摘要",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        report2 = GeneratedReport(
            report_id="RPT_2",
            report_type=ReportType.DAILY_ANALYSIS,
            title="空内容报告2",
            description="空内容报告2描述",
            report_date=date.today(),
            content="",
            summary="空摘要",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        
        similarity = service._calculate_similarity(report1, report2)
        assert similarity == 1.0

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_find_differences_identical(self, service):
        """测试找出相同报告的差异"""
        report1 = GeneratedReport(
            report_id="RPT_1",
            report_type=ReportType.DAILY_ANALYSIS,
            title="相同标题",
            description="相同描述",
            report_date=date.today(),
            content="相同内容",
            summary="相同摘要",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        report2 = GeneratedReport(
            report_id="RPT_2",
            report_type=ReportType.DAILY_ANALYSIS,
            title="相同标题",
            description="相同描述",
            report_date=date.today(),
            content="相同内容",
            summary="相同摘要",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        
        differences = service._find_differences(report1, report2)
        assert len(differences) == 0

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_find_differences_different(self, service):
        """测试找出不同报告的差异"""
        report1 = GeneratedReport(
            report_id="RPT_1",
            report_type=ReportType.DAILY_ANALYSIS,
            title="不同标题1",
            description="不同描述1",
            target_code="000001.SZ",
            report_date=date.today(),
            content="不同内容1",
            summary="不同摘要1",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        report2 = GeneratedReport(
            report_id="RPT_2",
            report_type=ReportType.FACT_ANALYSIS,
            title="不同标题2",
            description="不同描述2",
            target_code="000002.SZ",
            report_date=date.today(),
            content="不同内容2",
            summary="不同摘要2",
            status=ReportStatus.PENDING,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        
        differences = service._find_differences(report1, report2)
        assert len(differences) == 4  # 标题、类型、目标代码、状态都不同
        assert any("标题不同" in diff for diff in differences)
        assert any("类型不同" in diff for diff in differences)
        assert any("目标代码不同" in diff for diff in differences)
        assert any("状态不同" in diff for diff in differences)

    async def test_get_statistics(self, service):
        """测试获取统计信息"""
        # 添加不同状态的报告
        pending_report = GeneratedReport(
            report_id="RPT_PENDING",
            report_type=ReportType.DAILY_ANALYSIS,
            title="待处理报告",
            description="待处理报告描述",
            report_date=date.today(),
            content="待处理报告内容",
            summary="待处理报告摘要",
            status=ReportStatus.PENDING,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        failed_report = GeneratedReport(
            report_id="RPT_FAILED",
            report_type=ReportType.FACT_ANALYSIS,
            title="失败报告",
            description="失败报告描述",
            report_date=date.today(),
            content="失败报告内容",
            summary="失败报告摘要",
            status=ReportStatus.FAILED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        service.reports["RPT_PENDING"] = pending_report
        service.reports["RPT_FAILED"] = failed_report
        
        stats = await service.get_statistics()
        
        assert stats["total_reports"] == 3  # 1个示例 + 2个新报告
        assert stats["completed_reports"] == 1  # 示例报告
        assert stats["pending_reports"] == 1
        assert stats["completion_rate"] == 1/3
        
        # 测试类型分布
        assert "daily_analysis" in stats["type_distribution"]
        assert "fact_analysis" in stats["type_distribution"]
        assert stats["type_distribution"]["daily_analysis"] == 2
        assert stats["type_distribution"]["fact_analysis"] == 1
        
        # 测试状态分布
        assert "completed" in stats["status_distribution"]
        assert "pending" in stats["status_distribution"]
        assert "failed" in stats["status_distribution"]
        assert stats["status_distribution"]["completed"] == 1
        assert stats["status_distribution"]["pending"] == 1
        assert stats["status_distribution"]["failed"] == 1

    async def test_get_statistics_empty(self):
        """测试空服务的统计信息"""
        service = ReportService()
        service.reports = {}
        
        stats = await service.get_statistics()
        
        assert stats["total_reports"] == 0
        assert stats["completed_reports"] == 0
        assert stats["pending_reports"] == 0
        assert stats["completion_rate"] == 0
        assert stats["type_distribution"] == {}
        assert stats["status_distribution"] == {}

    async def test_service_concurrent_operations(self, service):
        """测试并发操作"""
        # 模拟并发创建报告
        reports = []
        for i in range(10):
            report_data = ReportCreate(
                report_type=ReportType.DAILY_ANALYSIS,
                title=f"并发报告{i}",
                description=f"并发报告{i}描述",
                report_date=date.today(),
                content=f"并发报告{i}内容",
                summary=f"并发报告{i}摘要",
            )
            reports.append(service.create_report(report_data))
        
        # 等待所有创建完成
        import asyncio
        results = await asyncio.gather(*reports)
        
        # 验证所有报告都创建成功
        assert len(results) == 10
        assert len(service.reports) == 11  # 10个新报告 + 1个示例报告
        
        # 验证ID不重复
        report_ids = [r.report_id for r in results]
        assert len(set(report_ids)) == 10  # 所有ID都唯一

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_service_error_handling(self, service):
        """测试错误处理"""
        # 测试创建报告时的错误处理
        with pytest.raises(Exception):
            # 这里可以测试各种异常情况
            pass

    async def test_get_reports_with_none_filters(self, service):
        """测试使用None过滤器的报告获取"""
        # 测试所有过滤器都为None的情况
        result = await service.get_reports(
            report_type=None,
            target_code=None,
            status=None
        )
        
        assert "data" in result
        assert "total" in result
        assert len(result["data"]) == 1  # 只有示例报告

    async def test_get_reports_with_empty_string_filters(self, service):
        """测试使用空字符串过滤器的报告获取"""
        # 测试空字符串过滤器
        result = await service.get_reports(
            report_type="",
            target_code="",
            status=""
        )
        
        assert "data" in result
        assert "total" in result
        assert len(result["data"]) == 0  # 空字符串不匹配任何报告

    async def test_get_reports_pagination_edge_cases(self, service):
        """测试分页边界情况"""
        # 测试页码超出范围
        result = await service.get_reports(page=999, size=10)
        assert result["data"] == []
        assert result["total"] == 1  # 示例报告
        
        # 测试负页码
        result = await service.get_reports(page=-1, size=10)
        assert result["data"] == []
        
        # 测试零页码
        result = await service.get_reports(page=0, size=10)
        assert result["data"] == []

    async def test_get_reports_size_zero(self, service):
        """测试分页大小为0的情况"""
        result = await service.get_reports(page=1, size=0)
        assert result["data"] == []
        assert result["total"] == 1

    async def test_get_reports_size_negative(self, service):
        """测试分页大小为负数的情况"""
        result = await service.get_reports(page=1, size=-5)
        assert result["data"] == []

    async def test_get_reports_large_page_size(self, service):
        """测试大分页大小"""
        result = await service.get_reports(page=1, size=1000)
        assert len(result["data"]) == 1  # 只有示例报告
        assert result["total"] == 1

    async def test_get_reports_exact_page_boundary(self, service):
        """测试分页边界精确匹配"""
        # 添加更多报告以测试边界
        for i in range(5):
            report = GeneratedReport(
                report_id=f"RPT_BOUNDARY_{i:06d}",
                report_type=ReportType.DAILY_ANALYSIS,
                title=f"边界报告{i}",
                description=f"边界报告{i}描述",
                report_date=date.today(),
                content=f"边界报告{i}内容",
                summary=f"边界报告{i}摘要",
                status=ReportStatus.COMPLETED,
                generated_at=datetime.now(),
                created_at=datetime.now(),
            )
            service.reports[f"RPT_BOUNDARY_{i:06d}"] = report
        
        # 测试精确分页
        result = await service.get_reports(page=1, size=3)
        assert len(result["data"]) == 3
        assert result["total"] == 6  # 5个新报告 + 1个示例报告
        
        result = await service.get_reports(page=2, size=3)
        assert len(result["data"]) == 3
        
        result = await service.get_reports(page=3, size=3)
        assert len(result["data"]) == 0  # 超出范围

    async def test_get_reports_filter_combinations(self, service):
        """测试过滤器组合"""
        # 添加测试数据
        report1 = GeneratedReport(
            report_id="RPT_COMBO_1",
            report_type=ReportType.DAILY_ANALYSIS,
            title="组合报告1",
            description="组合报告1描述",
            target_code="000001.SZ",
            report_date=date.today(),
            content="组合报告1内容",
            summary="组合报告1摘要",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        report2 = GeneratedReport(
            report_id="RPT_COMBO_2",
            report_type=ReportType.FACT_ANALYSIS,
            title="组合报告2",
            description="组合报告2描述",
            target_code="000002.SZ",
            report_date=date.today(),
            content="组合报告2内容",
            summary="组合报告2摘要",
            status=ReportStatus.PENDING,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        service.reports["RPT_COMBO_1"] = report1
        service.reports["RPT_COMBO_2"] = report2
        
        # 测试类型和状态组合
        result = await service.get_reports(
            report_type="daily_analysis",
            status="completed"
        )
        assert len(result["data"]) == 2  # 示例报告 + 组合报告1
        
        # 测试类型和目标代码组合
        result = await service.get_reports(
            report_type="fact_analysis",
            target_code="000002.SZ"
        )
        assert len(result["data"]) == 1  # 只有组合报告2

    async def test_get_reports_invalid_filter_values(self, service):
        """测试无效过滤器值"""
        # 测试无效的报告类型
        result = await service.get_reports(report_type="invalid_type")
        assert len(result["data"]) == 0
        
        # 测试无效的状态
        result = await service.get_reports(status="invalid_status")
        assert len(result["data"]) == 0

    async def test_create_report_with_none_values(self, service):
        """测试使用None值创建报告"""
        report_data = ReportCreate(
            report_type=ReportType.DAILY_ANALYSIS,
            title="None值报告",
            description="None值报告描述",
            report_date=date.today(),
            content="None值报告内容",
            summary="None值报告摘要",
            author=None,  # None值
            template_id=None,  # None值
            generation_params=None,  # None值
        )
        
        result = await service.create_report(report_data)
        
        assert result.author == "system"  # 应该使用默认值
        assert result.template_id is None
        assert result.generation_params == {}

    async def test_create_report_with_empty_strings(self, service):
        """测试使用空字符串创建报告"""
        report_data = ReportCreate(
            report_type=ReportType.DAILY_ANALYSIS,
            title="空字符串报告",
            description="空字符串报告描述",
            report_date=date.today(),
            content="空字符串报告内容",
            summary="空字符串报告摘要",
            author="",  # 空字符串
            template_id="",  # 空字符串
            generation_params={},  # 空字典
        )
        
        result = await service.create_report(report_data)
        
        assert result.author == ""  # 应该保持空字符串
        assert result.template_id == ""
        assert result.generation_params == {}

    async def test_update_report_with_none_values(self, service, sample_report):
        """测试使用None值更新报告"""
        service.reports["RPT_NONE_UPDATE"] = sample_report
        
        update_data = ReportUpdate(
            title=None,  # None值
            description=None,  # None值
            content=None,  # None值
            summary=None,  # None值
            status=None,  # None值
            sections=None,  # None值
            conclusions=None,  # None值
            recommendations=None,  # None值
            metrics=None,  # None值
        )
        
        result = await service.update_report("RPT_NONE_UPDATE", update_data)
        
        assert result is not None  # TODO: 替换为具体的值断言
        # 所有字段应该保持原值
        assert result.title == sample_report.title
        assert result.description == sample_report.description
        assert result.content == sample_report.content
        assert result.summary == sample_report.summary
        assert result.status == sample_report.status

    async def test_update_report_with_empty_values(self, service, sample_report):
        """测试使用空值更新报告"""
        service.reports["RPT_EMPTY_UPDATE"] = sample_report
        
        update_data = ReportUpdate(
            title="",  # 空字符串
            description="",  # 空字符串
            content="",  # 空字符串
            summary="",  # 空字符串
            sections=[],  # 空列表
            conclusions=[],  # 空列表
            recommendations=[],  # 空列表
            metrics={},  # 空字典
        )
        
        result = await service.update_report("RPT_EMPTY_UPDATE", update_data)
        
        assert result is not None  # TODO: 替换为具体的值断言
        assert result.title == ""
        assert result.description == ""
        assert result.content == ""
        assert result.summary == ""
        assert result.sections == []
        assert result.conclusions == []
        assert result.recommendations == []
        assert result.metrics == {}

    async def test_compare_reports_with_same_id(self, service, sample_report):
        """测试对比相同ID的报告"""
        service.reports["RPT_SAME_ID"] = sample_report
        
        # 对比相同ID的报告
        result = await service.compare_reports("RPT_SAME_ID", "RPT_SAME_ID")
        
        assert result["report1_id"] == "RPT_SAME_ID"
        assert result["report2_id"] == "RPT_SAME_ID"
        assert result["similarity_score"] == 1.0  # 相同报告相似度应该为1
        assert len(result["differences"]) == 0  # 相同报告没有差异

    async def test_compare_reports_with_missing_first_report(self, service, sample_report):
        """测试对比时第一个报告不存在"""
        service.reports["RPT_EXISTING"] = sample_report
        
        with pytest.raises(ValueError, match="报告不存在"):
            await service.compare_reports("NON_EXISTING", "RPT_EXISTING")

    async def test_compare_reports_with_missing_second_report(self, service, sample_report):
        """测试对比时第二个报告不存在"""
        service.reports["RPT_EXISTING"] = sample_report
        
        with pytest.raises(ValueError, match="报告不存在"):
            await service.compare_reports("RPT_EXISTING", "NON_EXISTING")

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_calculate_similarity_with_none_content(self, service):
        """测试计算None内容的相似度"""
        report1 = GeneratedReport(
            report_id="RPT_1",
            report_type=ReportType.DAILY_ANALYSIS,
            title="None内容报告1",
            description="None内容报告1描述",
            report_date=date.today(),
            content=None,  # None内容
            summary="None摘要",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        report2 = GeneratedReport(
            report_id="RPT_2",
            report_type=ReportType.DAILY_ANALYSIS,
            title="None内容报告2",
            description="None内容报告2描述",
            report_date=date.today(),
            content=None,  # None内容
            summary="None摘要",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        
        similarity = service._calculate_similarity(report1, report2)
        assert similarity == 1.0  # 两个None内容应该相似度为1

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_calculate_similarity_with_mixed_content(self, service):
        """测试计算混合内容的相似度"""
        report1 = GeneratedReport(
            report_id="RPT_1",
            report_type=ReportType.DAILY_ANALYSIS,
            title="混合内容报告1",
            description="混合内容报告1描述",
            report_date=date.today(),
            content="",  # 空字符串
            summary="混合摘要",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        report2 = GeneratedReport(
            report_id="RPT_2",
            report_type=ReportType.DAILY_ANALYSIS,
            title="混合内容报告2",
            description="混合内容报告2描述",
            report_date=date.today(),
            content="有内容",  # 有内容
            summary="混合摘要",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        
        similarity = service._calculate_similarity(report1, report2)
        assert similarity == 0.0  # 空字符串和有内容应该相似度为0

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_find_differences_with_none_values(self, service):
        """测试找出None值的差异"""
        report1 = GeneratedReport(
            report_id="RPT_1",
            report_type=ReportType.DAILY_ANALYSIS,
            title="None值报告1",
            description="None值报告1描述",
            target_code=None,  # None值
            report_date=date.today(),
            content="None值内容1",
            summary="None值摘要1",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        report2 = GeneratedReport(
            report_id="RPT_2",
            report_type=ReportType.DAILY_ANALYSIS,
            title="None值报告2",
            description="None值报告2描述",
            target_code="000001.SZ",  # 有值
            report_date=date.today(),
            content="None值内容2",
            summary="None值摘要2",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        
        differences = service._find_differences(report1, report2)
        assert len(differences) == 1  # 只有目标代码不同
        assert any("目标代码不同" in diff for diff in differences)

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_find_differences_with_empty_values(self, service):
        """测试找出空值的差异"""
        report1 = GeneratedReport(
            report_id="RPT_1",
            report_type=ReportType.DAILY_ANALYSIS,
            title="",  # 空字符串
            description="空值报告1描述",
            target_code="000001.SZ",
            report_date=date.today(),
            content="空值内容1",
            summary="空值摘要1",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        report2 = GeneratedReport(
            report_id="RPT_2",
            report_type=ReportType.DAILY_ANALYSIS,
            title="有标题",  # 有值
            description="空值报告2描述",
            target_code="000001.SZ",
            report_date=date.today(),
            content="空值内容2",
            summary="空值摘要2",
            status=ReportStatus.COMPLETED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        
        differences = service._find_differences(report1, report2)
        assert len(differences) == 1  # 只有标题不同
        assert any("标题不同" in diff for diff in differences)

    async def test_get_statistics_with_mixed_statuses(self, service):
        """测试混合状态的统计信息"""
        # 添加不同状态的报告
        generating_report = GeneratedReport(
            report_id="RPT_GENERATING",
            report_type=ReportType.DAILY_ANALYSIS,
            title="生成中报告",
            description="生成中报告描述",
            report_date=date.today(),
            content="生成中报告内容",
            summary="生成中报告摘要",
            status=ReportStatus.GENERATING,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        failed_report = GeneratedReport(
            report_id="RPT_FAILED",
            report_type=ReportType.FACT_ANALYSIS,
            title="失败报告",
            description="失败报告描述",
            report_date=date.today(),
            content="失败报告内容",
            summary="失败报告摘要",
            status=ReportStatus.FAILED,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        service.reports["RPT_GENERATING"] = generating_report
        service.reports["RPT_FAILED"] = failed_report
        
        stats = await service.get_statistics()
        
        assert stats["total_reports"] == 3  # 1个示例 + 2个新报告
        assert stats["completed_reports"] == 1  # 示例报告
        assert stats["pending_reports"] == 0  # 没有待处理报告
        assert stats["completion_rate"] == 1/3
        
        # 测试状态分布
        assert "completed" in stats["status_distribution"]
        assert "generating" in stats["status_distribution"]
        assert "failed" in stats["status_distribution"]
        assert stats["status_distribution"]["completed"] == 1
        assert stats["status_distribution"]["generating"] == 1
        assert stats["status_distribution"]["failed"] == 1

    async def test_get_statistics_with_single_report_type(self, service):
        """测试单一报告类型的统计信息"""
        # 清空所有报告
        service.reports = {}
        
        # 只添加一种类型的报告
        for i in range(3):
            report = GeneratedReport(
                report_id=f"RPT_SINGLE_{i:06d}",
                report_type=ReportType.DAILY_ANALYSIS,
                title=f"单一类型报告{i}",
                description=f"单一类型报告{i}描述",
                report_date=date.today(),
                content=f"单一类型报告{i}内容",
                summary=f"单一类型报告{i}摘要",
                status=ReportStatus.COMPLETED,
                generated_at=datetime.now(),
                created_at=datetime.now(),
            )
            service.reports[f"RPT_SINGLE_{i:06d}"] = report
        
        stats = await service.get_statistics()
        
        assert stats["total_reports"] == 3
        assert stats["completed_reports"] == 3
        assert stats["pending_reports"] == 0
        assert stats["completion_rate"] == 1.0
        
        # 测试类型分布
        assert "daily_analysis" in stats["type_distribution"]
        assert stats["type_distribution"]["daily_analysis"] == 3
        assert len(stats["type_distribution"]) == 1

    async def test_get_statistics_with_no_reports(self):
        """测试无报告时的统计信息"""
        service = ReportService()
        service.reports = {}
        service._next_id = 1
        
        stats = await service.get_statistics()
        
        assert stats["total_reports"] == 0
        assert stats["completed_reports"] == 0
        assert stats["pending_reports"] == 0
        assert stats["completion_rate"] == 0
        assert stats["type_distribution"] == {}
        assert stats["status_distribution"] == {}

    async def test_service_concurrent_updates(self, service):
        """测试并发更新操作"""
        # 添加一个报告
        test_report = GeneratedReport(
            report_id="RPT_CONCURRENT",
            report_type=ReportType.DAILY_ANALYSIS,
            title="并发更新报告",
            description="并发更新报告描述",
            report_date=date.today(),
            content="并发更新报告内容",
            summary="并发更新报告摘要",
            status=ReportStatus.PENDING,
            generated_at=datetime.now(),
            created_at=datetime.now(),
        )
        service.reports["RPT_CONCURRENT"] = test_report
        
        # 模拟并发更新
        update_tasks = []
        for i in range(5):
            update_data = ReportUpdate(
                title=f"并发更新标题{i}",
                status=ReportStatus.COMPLETED if i % 2 == 0 else ReportStatus.FAILED
            )
            update_tasks.append(service.update_report("RPT_CONCURRENT", update_data))
        
        # 等待所有更新完成
        import asyncio
        results = await asyncio.gather(*update_tasks)
        
        # 验证所有更新都成功
        assert len(results) == 5
        assert all(result is not None for result in results)
        
        # 验证最终状态
        final_report = service.reports["RPT_CONCURRENT"]
        assert final_report.title.startswith("并发更新标题")
        assert final_report.status in [ReportStatus.COMPLETED, ReportStatus.FAILED]

    async def test_service_concurrent_deletes(self, service):
        """测试并发删除操作"""
        # 添加多个报告
        for i in range(5):
            report = GeneratedReport(
                report_id=f"RPT_DELETE_{i:06d}",
                report_type=ReportType.DAILY_ANALYSIS,
                title=f"删除报告{i}",
                description=f"删除报告{i}描述",
                report_date=date.today(),
                content=f"删除报告{i}内容",
                summary=f"删除报告{i}摘要",
                status=ReportStatus.COMPLETED,
                generated_at=datetime.now(),
                created_at=datetime.now(),
            )
            service.reports[f"RPT_DELETE_{i:06d}"] = report
        
        # 模拟并发删除
        delete_tasks = []
        for i in range(5):
            delete_tasks.append(service.delete_report(f"RPT_DELETE_{i:06d}"))
        
        # 等待所有删除完成
        import asyncio
        results = await asyncio.gather(*delete_tasks)
        
        # 验证所有删除都成功
        assert len(results) == 5
        assert all(result is True for result in results)
        
        # 验证报告已被删除
        assert len(service.reports) == 1  # 只有示例报告

    async def test_service_error_recovery(self, service):
        """测试错误恢复"""
        # 测试在错误后服务仍然可用
        try:
            # 尝试删除不存在的报告
            result = await service.delete_report("NON_EXISTING")
            assert result is False
        except Exception:
            # 如果抛出异常,测试失败
            pytest.fail("删除不存在的报告不应该抛出异常")
        
        # 验证服务仍然可用
        result = await service.get_reports()
        assert "data" in result
        assert "total" in result

    async def test_service_memory_usage(self, service):
        """测试内存使用情况"""
        # 添加大量报告
        for i in range(1000):
            report = GeneratedReport(
                report_id=f"RPT_MEMORY_{i:06d}",
                report_type=ReportType.DAILY_ANALYSIS,
                title=f"内存测试报告{i}",
                description=f"内存测试报告{i}描述",
                report_date=date.today(),
                content=f"内存测试报告{i}内容" * 100,  # 大量内容
                summary=f"内存测试报告{i}摘要",
                status=ReportStatus.COMPLETED,
                generated_at=datetime.now(),
                created_at=datetime.now(),
            )
            service.reports[f"RPT_MEMORY_{i:06d}"] = report
        
        # 验证服务仍然正常工作
        result = await service.get_reports(page=1, size=10)
        assert len(result["data"]) == 10
        assert result["total"] == 1001  # 1000个新报告 + 1个示例报告
        
        # 验证统计信息
        stats = await service.get_statistics()
        assert stats["total_reports"] == 1001
        assert stats["completed_reports"] == 1001
        assert stats["completion_rate"] == 1.0

    async def test_service_edge_cases(self, service):
        """测试边界情况"""
        # 测试空字符串ID
        result = await service.get_report_by_id("")
        assert result is None
        
        # 测试None ID
        result = await service.get_report_by_id(None)
        assert result is None
        
        # 测试负数分页
        result = await service.get_reports(page=-1, size=10)
        assert result["data"] == []  # 应该返回空列表
        
        # 测试零分页大小
        result = await service.get_reports(page=1, size=0)
        assert result["data"] == []  # 应该返回空列表

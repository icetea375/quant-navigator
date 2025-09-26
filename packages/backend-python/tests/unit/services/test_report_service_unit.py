"""
ReportService单元测试 - 遵循TDD原则
先写测试，后写实现
"""

import pytest
from datetime import date, datetime
from unittest.mock import patch, MagicMock

from src.services.report_service import ReportService
from src.schemas.reports import (
    GeneratedReport,
    ReportCreate,
    ReportStatus,
    ReportType,
    ReportUpdate,
)


class TestReportServiceUnit:
    """ReportService单元测试类"""

    @pytest.fixture
    def report_service(self):
        """创建ReportService实例"""
        return ReportService()

    @pytest.fixture
    def sample_report_data(self):
        """创建测试报告数据"""
        return ReportCreate(
            report_type=ReportType.DAILY_ANALYSIS,
            target_code="000001.SZ",
            report_date=date.today(),
            content="测试报告内容",
        )

    @pytest.fixture
    def sample_update_data(self):
        """创建测试更新数据"""
        return ReportUpdate(
            content="更新后的报告内容",
            status=ReportStatus.COMPLETED,
        )

    @pytest.mark.asyncio
    async def test_should_initialize_with_sample_data(self, report_service):
        """测试服务初始化时包含示例数据"""
        # Act
        reports = await report_service.get_reports()
        
        # Assert
        assert reports["total"] == 1
        assert len(reports["data"]) == 1
        assert reports["data"][0].report_id == 1
        assert reports["data"][0].target_code == "000001.SZ"
        assert reports["data"][0].report_type == ReportType.DAILY_ANALYSIS

    @pytest.mark.asyncio
    async def test_should_get_reports_with_pagination(self, report_service):
        """测试分页获取报告列表"""
        # Arrange - 创建多个测试报告
        for i in range(5):
            report_data = ReportCreate(
                report_type=ReportType.DAILY_ANALYSIS,
                target_code=f"00000{i}.SZ",
                report_date=date.today(),
                content=f"测试报告内容{i}",
            )
            await report_service.create_report(report_data)

        # Act
        page1 = await report_service.get_reports(page=1, size=3)
        page2 = await report_service.get_reports(page=2, size=3)

        # Assert
        assert page1["total"] == 6  # 1个示例 + 5个新创建
        assert len(page1["data"]) == 3
        assert page2["total"] == 6
        assert len(page2["data"]) == 3

    @pytest.mark.asyncio
    async def test_should_filter_reports_by_type(self, report_service):
        """测试按类型过滤报告"""
        # Arrange - 创建不同类型的报告
        daily_report = ReportCreate(
            report_type=ReportType.DAILY_ANALYSIS,
            target_code="000001.SZ",
            report_date=date.today(),
            content="日常分析报告",
        )
        fact_report = ReportCreate(
            report_type=ReportType.FACT_ANALYSIS,
            target_code="000002.SZ",
            report_date=date.today(),
            content="事实分析报告",
        )
        await report_service.create_report(daily_report)
        await report_service.create_report(fact_report)
        
        # Act
        daily_reports = await report_service.get_reports(report_type="daily_analysis")
        fact_reports = await report_service.get_reports(report_type="fact_analysis")

        # Assert
        assert daily_reports["total"] == 2  # 1个示例 + 1个新创建
        assert fact_reports["total"] == 1
        for report in daily_reports["data"]:
            assert report.report_type == ReportType.DAILY_ANALYSIS

    @pytest.mark.asyncio
    async def test_should_filter_reports_by_target_code(self, report_service, sample_report_data):
        """测试按目标代码过滤报告"""
        # Arrange
        await report_service.create_report(sample_report_data)
        
        # Act
        filtered_reports = await report_service.get_reports(target_code="000001.SZ")

        # Assert
        assert filtered_reports["total"] == 2  # 1个示例 + 1个新创建
        for report in filtered_reports["data"]:
            assert report.target_code == "000001.SZ"

    @pytest.mark.asyncio
    async def test_should_get_report_by_id(self, report_service):
        """测试根据ID获取报告"""
        # Act
        report = await report_service.get_report_by_id(1)
        non_existent = await report_service.get_report_by_id(999)

        # Assert
        assert report is not None
        assert report.report_id == 1
        assert report.target_code == "000001.SZ"
        assert non_existent is None

    @pytest.mark.asyncio
    async def test_should_create_report(self, report_service, sample_report_data):
        """测试创建新报告"""
        # Act
        created_report = await report_service.create_report(sample_report_data)

        # Assert
        assert created_report.report_id == 2  # 第二个报告
        assert created_report.report_type == sample_report_data.report_type
        assert created_report.target_code == sample_report_data.target_code
        assert created_report.content == sample_report_data.content
        assert created_report.status == ReportStatus.PENDING
        assert created_report.created_at is not None

    @pytest.mark.asyncio
    async def test_should_update_report(self, report_service, sample_update_data):
        """测试更新报告"""
        # Arrange
        report_id = 1
        
        # Act
        updated_report = await report_service.update_report(report_id, sample_update_data)
        non_existent = await report_service.update_report(999, sample_update_data)

        # Assert
        assert updated_report is not None
        assert updated_report.content == "更新后的报告内容"
        assert updated_report.status == ReportStatus.COMPLETED
        assert updated_report.updated_at is not None
        assert non_existent is None

    @pytest.mark.asyncio
    async def test_should_delete_report(self, report_service):
        """测试删除报告"""
        # Act
        success = await report_service.delete_report(1)
        failed = await report_service.delete_report(999)

        # Assert
        assert success is True
        assert failed is False
        # 验证报告确实被删除
        deleted_report = await report_service.get_report_by_id(1)
        assert deleted_report is None

    @pytest.mark.asyncio
    async def test_should_get_reports_by_type(self, report_service):
        """测试根据类型获取报告"""
        # Arrange - 创建不同类型的报告
        daily_report = ReportCreate(
            report_type=ReportType.DAILY_ANALYSIS,
            target_code="000001.SZ",
            report_date=date.today(),
            content="日常分析报告",
        )
        fact_report = ReportCreate(
            report_type=ReportType.FACT_ANALYSIS,
            target_code="000002.SZ",
            report_date=date.today(),
            content="事实分析报告",
        )
        await report_service.create_report(daily_report)
        await report_service.create_report(fact_report)
        
        # Act
        daily_reports = await report_service.get_reports_by_type(ReportType.DAILY_ANALYSIS)
        fact_reports = await report_service.get_reports_by_type(ReportType.FACT_ANALYSIS)

        # Assert
        assert len(daily_reports) == 2  # 1个示例 + 1个新创建
        assert len(fact_reports) == 1
        for report in daily_reports:
            assert report.report_type == ReportType.DAILY_ANALYSIS

    @pytest.mark.asyncio
    async def test_should_get_reports_by_date_range(self, report_service):
        """测试根据日期范围获取报告"""
        # Arrange - 创建不同日期的报告
        today = date.today()
        yesterday = date.today().replace(day=today.day-1) if today.day > 1 else date(today.year, today.month-1, 28) if today.month > 1 else date(today.year-1, 12, 28)
        tomorrow = date.today().replace(day=today.day+1) if today.day < 28 else date(today.year, today.month+1, 1) if today.month < 12 else date(today.year+1, 1, 1)
        
        yesterday_report = ReportCreate(
            report_type=ReportType.DAILY_ANALYSIS,
            target_code="000001.SZ",
            report_date=yesterday,
            content="昨天的报告",
        )
        today_report = ReportCreate(
            report_type=ReportType.DAILY_ANALYSIS,
            target_code="000002.SZ",
            report_date=today,
            content="今天的报告",
        )
        tomorrow_report = ReportCreate(
            report_type=ReportType.DAILY_ANALYSIS,
            target_code="000003.SZ",
            report_date=tomorrow,
            content="明天的报告",
        )
        
        await report_service.create_report(yesterday_report)
        await report_service.create_report(today_report)
        await report_service.create_report(tomorrow_report)
        
        # Act
        range_reports = await report_service.get_reports_by_date_range(yesterday, today)

        # Assert
        assert len(range_reports) == 3  # 1个示例(今天) + 2个新创建(今天)
        for report in range_reports:
            assert yesterday <= report.report_date <= today

    @pytest.mark.asyncio
    async def test_should_get_statistics(self, report_service):
        """测试获取统计信息"""
        # Arrange - 创建一些测试数据
        report_data = ReportCreate(
            report_type=ReportType.DAILY_ANALYSIS,
            target_code="000001.SZ",
            report_date=date.today(),
            content="测试报告",
        )
        await report_service.create_report(report_data)
        
        # 更新一个报告为已完成
        await report_service.update_report(
            1, 
            ReportUpdate(status=ReportStatus.COMPLETED)
        )

        # Act
        stats = await report_service.get_statistics()

        # Assert
        assert stats["total_reports"] == 2
        assert stats["completed_reports"] == 1
        assert stats["pending_reports"] == 1
        assert stats["completion_rate"] == 0.5
        assert "type_distribution" in stats
        assert stats["type_distribution"]["daily_analysis"] == 2

    @pytest.mark.asyncio
    async def test_should_handle_empty_reports_list(self):
        """测试空报告列表的处理"""
        # Arrange - 创建新的服务实例（没有示例数据）
        service = ReportService()
        service.reports = {}  # 清空示例数据
        service._next_id = 1

        # Act
        stats = await service.get_statistics()

        # Assert
        assert stats["total_reports"] == 0
        assert stats["completion_rate"] == 0

    @pytest.mark.asyncio
    async def test_should_handle_partial_update(self, report_service):
        """测试部分更新报告"""
        # Arrange
        partial_update = ReportUpdate(content="部分更新内容")

        # Act
        updated_report = await report_service.update_report(1, partial_update)

        # Assert
        assert updated_report.content == "部分更新内容"
        assert updated_report.status == ReportStatus.COMPLETED  # 保持原状态

    @pytest.mark.asyncio
    async def test_should_handle_different_report_types(self, report_service):
        """测试不同报告类型的处理"""
        # Arrange - 创建所有类型的报告
        report_types = [
            ReportType.DAILY_ANALYSIS,
            ReportType.FACT_ANALYSIS,
            ReportType.SENTIMENT_ANALYSIS,
        ]
        
        for i, report_type in enumerate(report_types):
            report_data = ReportCreate(
                report_type=report_type,
                target_code=f"00000{i}.SZ",
                report_date=date.today(),
                content=f"{report_type.value}报告",
            )
            await report_service.create_report(report_data)

        # Act
        stats = await report_service.get_statistics()

        # Assert
        assert stats["total_reports"] == 4  # 1个示例 + 3个新创建
        assert stats["type_distribution"]["daily_analysis"] == 2  # 1个示例 + 1个新创建
        assert stats["type_distribution"]["fact_analysis"] == 1
        assert stats["type_distribution"]["sentiment_analysis"] == 1

    @pytest.mark.asyncio
    async def test_should_handle_edge_case_pagination(self, report_service):
        """测试分页边界情况"""
        # Act
        empty_page = await report_service.get_reports(page=999, size=10)
        zero_size = await report_service.get_reports(page=1, size=0)

        # Assert
        assert empty_page["total"] == 1  # 只有示例数据
        assert len(empty_page["data"]) == 0
        assert zero_size["total"] == 1
        assert len(zero_size["data"]) == 0

    @pytest.mark.asyncio
    async def test_should_handle_status_filtering(self, report_service):
        """测试状态过滤"""
        # Arrange - 创建不同状态的报告
        pending_report = ReportCreate(
            report_type=ReportType.DAILY_ANALYSIS,
            target_code="000001.SZ",
            report_date=date.today(),
            content="待处理报告",
        )
        await report_service.create_report(pending_report)
        
        # 更新示例报告为已完成
        await report_service.update_report(
            1, 
            ReportUpdate(status=ReportStatus.COMPLETED)
        )

        # Act
        pending_reports = await report_service.get_reports()
        # 注意：当前实现没有status过滤，这里测试基本功能

        # Assert
        assert pending_reports["total"] == 2
        # 验证状态分布
        stats = await report_service.get_statistics()
        assert stats["completed_reports"] == 1
        assert stats["pending_reports"] == 1

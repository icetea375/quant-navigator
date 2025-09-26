"""
数据库集成测试 - 遵循测试宪法TDD原则
先写测试（红灯），再实现功能（绿灯），最后重构
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.database.connection import Base
from src.services.arbitration_service import ArbitrationService
from src.services.report_service import ReportService
from src.schemas.arbitration import (
    ArbitrationCaseCreate,
    AnalysisResult,
    SentimentAnalysis,
)
from src.schemas.reports import ReportCreate, ReportType


class TestDatabaseIntegration:
    """数据库集成测试类"""

    @pytest.fixture
    def test_db(self):
        """创建测试数据库"""
        # 创建内存SQLite数据库
        engine = create_engine("sqlite:///:memory:", echo=False)
        Base.metadata.create_all(bind=engine)

        TestingSessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=engine
        )

        def override_get_db():
            try:
                db = TestingSessionLocal()
                yield db
            finally:
                db.close()

        return engine, TestingSessionLocal, override_get_db

    @pytest.mark.asyncio
    async def test_arbitration_service_database_integration(self, test_db):
        """测试仲裁服务与数据库的集成"""
        engine, TestingSessionLocal, override_get_db = test_db

        # Arrange - 准备测试数据
        service = ArbitrationService()

        # 创建测试案件数据
        case_data = ArbitrationCaseCreate(
            report_type="fact_analysis",
            target_code="000001.SZ",
            qwen_analysis=AnalysisResult(
                analysis="测试Qwen分析", confidence=0.8, reasoning="测试推理过程"
            ),
            doubao_analysis=SentimentAnalysis(
                sentiment="positive", score=0.7, reasoning="测试情感分析"
            ),
        )

        # Act - 执行被测试的功能
        result = await service.create_case(case_data)

        # Assert - 验证结果
        assert result is not None
        assert result.report_type == "fact_analysis"
        assert result.target_code == "000001.SZ"
        assert result.qwen_analysis.confidence == 0.8
        assert result.doubao_analysis.sentiment == "positive"
        assert result.disagreement_score > 0  # 应该计算了分歧度

    @pytest.mark.asyncio
    async def test_report_service_database_integration(self, test_db):
        """测试报告服务与数据库的集成"""
        engine, TestingSessionLocal, override_get_db = test_db

        # Arrange - 准备测试数据
        service = ReportService()

        # 创建测试报告数据
        report_data = ReportCreate(
            report_type=ReportType.DAILY_ANALYSIS,
            target_code="000001.SZ",
            report_date="2025-01-26",
            content="测试报告内容",
        )

        # Act - 执行被测试的功能
        result = await service.create_report(report_data)

        # Assert - 验证结果
        assert result is not None
        assert result.report_type == ReportType.DAILY_ANALYSIS
        assert result.target_code == "000001.SZ"
        assert result.content == "测试报告内容"
        assert result.status == "pending"  # 新创建的报告应该是pending状态

    @pytest.mark.asyncio
    async def test_arbitration_case_persistence(self, test_db):
        """测试仲裁案件数据持久化"""
        engine, TestingSessionLocal, override_get_db = test_db

        # Arrange
        service = ArbitrationService()

        # 创建案件
        case_data = ArbitrationCaseCreate(
            report_type="fact_analysis", target_code="000001.SZ"
        )
        created_case = await service.create_case(case_data)

        # Act - 通过ID查询案件
        retrieved_case = await service.get_case_by_id(created_case.case_id)

        # Assert - 验证数据持久化
        assert retrieved_case is not None
        assert retrieved_case.case_id == created_case.case_id
        assert retrieved_case.report_type == created_case.report_type
        assert retrieved_case.target_code == created_case.target_code

    @pytest.mark.asyncio
    async def test_report_persistence(self, test_db):
        """测试报告数据持久化"""
        engine, TestingSessionLocal, override_get_db = test_db

        # Arrange
        service = ReportService()

        # 创建报告
        report_data = ReportCreate(
            report_type=ReportType.DAILY_ANALYSIS,
            target_code="000001.SZ",
            report_date="2025-01-26",
            content="测试报告内容",
        )
        created_report = await service.create_report(report_data)

        # Act - 通过ID查询报告
        retrieved_report = await service.get_report_by_id(created_report.report_id)

        # Assert - 验证数据持久化
        assert retrieved_report is not None
        assert retrieved_report.report_id == created_report.report_id
        assert retrieved_report.content == created_report.content

    @pytest.mark.asyncio
    async def test_arbitration_case_pagination(self, test_db):
        """测试仲裁案件分页功能"""
        engine, TestingSessionLocal, override_get_db = test_db

        # Arrange
        service = ArbitrationService()

        # 创建多个测试案件
        for i in range(15):
            case_data = ArbitrationCaseCreate(
                report_type="fact_analysis", target_code=f"00000{i:02d}.SZ"
            )
            await service.create_case(case_data)

        # Act - 测试分页
        page1 = await service.get_cases(page=1, size=10)
        page2 = await service.get_cases(page=2, size=10)

        # Assert - 验证分页结果
        assert page1["total"] == 16  # 15个新创建的 + 1个示例数据
        assert len(page1["data"]) == 10
        assert page2["total"] == 16
        assert len(page2["data"]) == 6  # 剩余6个

    @pytest.mark.asyncio
    async def test_report_filtering(self, test_db):
        """测试报告筛选功能"""
        engine, TestingSessionLocal, override_get_db = test_db

        # Arrange
        service = ReportService()

        # 创建不同类型的报告
        daily_report = ReportCreate(
            report_type=ReportType.DAILY_ANALYSIS,
            target_code="000001.SZ",
            report_date="2025-01-26",
            content="日常分析报告",
        )
        fact_report = ReportCreate(
            report_type=ReportType.FACT_ANALYSIS,
            target_code="000002.SZ",
            report_date="2025-01-26",
            content="事实分析报告",
        )

        await service.create_report(daily_report)
        await service.create_report(fact_report)

        # Act - 按类型筛选
        daily_reports = await service.get_reports_by_type(ReportType.DAILY_ANALYSIS)
        fact_reports = await service.get_reports_by_type(ReportType.FACT_ANALYSIS)

        # Assert - 验证筛选结果
        assert len(daily_reports) == 2  # 1个新创建的 + 1个示例数据
        assert len(fact_reports) == 1
        assert all(r.report_type == ReportType.DAILY_ANALYSIS for r in daily_reports)
        assert all(r.report_type == ReportType.FACT_ANALYSIS for r in fact_reports)

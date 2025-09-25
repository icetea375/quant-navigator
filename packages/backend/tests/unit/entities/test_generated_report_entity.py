"""
生成报告实体单元测试
遵循TDD原则：先写测试，后写实现
"""

import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError

# 这些导入将会失败，因为实体类还不存在
from src.entities.generated_report import GeneratedReportEntity
from src.entities.base import Base


class TestGeneratedReportEntity:
    """生成报告实体测试类"""
    
    @pytest.fixture
    def db_session(self):
        """创建测试数据库会话"""
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        Session = sessionmaker(bind=engine)
        session = Session()
        yield session
        session.close()
    
    def test_generated_report_creation(self, db_session):
        """测试生成报告实体创建"""
        # 准备测试数据
        generated_report = GeneratedReportEntity(
            report_id="rpt_123",
            report_type="daily_analysis",
            title="每日分析报告",
            description="今日市场分析报告",
            status="completed",
            period_start=datetime(2024, 1, 1, 0, 0, 0),
            period_end=datetime(2024, 1, 1, 23, 59, 59),
            summary="今日市场表现良好",
            conclusions=["结论1", "结论2"],
            recommendations=["建议1", "建议2"],
            author="系统",
            version="1.0.0",
            related_events=["evt_123", "evt_456"],
            related_signals=["sig_123", "sig_456"],
            related_stocks=["000001.SZ", "000002.SZ"],
            file_format="json",
            metadata={"test": "data"}
        )
        
        # 保存到数据库
        db_session.add(generated_report)
        db_session.commit()
        
        # 验证保存成功
        assert generated_report.report_id == "rpt_123"
        assert generated_report.report_type == "daily_analysis"
        assert generated_report.title == "每日分析报告"
        assert generated_report.status == "completed"
        assert generated_report.author == "系统"
        assert generated_report.version == "1.0.0"
    
    def test_generated_report_validation(self, db_session):
        """测试生成报告实体验证"""
        # 测试必填字段验证
        with pytest.raises(IntegrityError):
            generated_report = GeneratedReportEntity(
                # 缺少必填字段
                report_id="rpt_123"
            )
            db_session.add(generated_report)
            db_session.commit()
    
    def test_generated_report_enum_validation(self, db_session):
        """测试枚举字段验证"""
        # 测试无效的报告类型
        with pytest.raises(ValueError):
            generated_report = GeneratedReportEntity(
                report_id="rpt_123",
                report_type="invalid_type",  # 无效的报告类型
                title="测试报告",
                description="测试描述",
                status="completed",
                period_start=datetime.now(),
                period_end=datetime.now(),
                summary="测试摘要",
                author="测试作者"
            )
    
    def test_generated_report_period_validation(self, db_session):
        """测试报告周期验证"""
        # 测试结束时间必须晚于开始时间
        with pytest.raises(ValueError):
            generated_report = GeneratedReportEntity(
                report_id="rpt_123",
                report_type="daily_analysis",
                title="测试报告",
                description="测试描述",
                status="completed",
                period_start=datetime(2024, 1, 2),  # 开始时间
                period_end=datetime(2024, 1, 1),    # 结束时间早于开始时间
                summary="测试摘要",
                author="测试作者"
            )
    
    def test_generated_report_metrics(self, db_session):
        """测试报告指标字段"""
        metrics = {
            "total_events": 100,
            "processed_events": 95,
            "anomaly_count": 5,
            "signal_count": 20,
            "success_rate": 0.95,
            "processing_time": 5000,
            "confidence_score": 0.85
        }
        
        generated_report = GeneratedReportEntity(
            report_id="rpt_123",
            report_type="daily_analysis",
            title="测试报告",
            description="测试描述",
            status="completed",
            period_start=datetime.now(),
            period_end=datetime.now(),
            summary="测试摘要",
            author="测试作者",
            metrics=metrics
        )
        
        db_session.add(generated_report)
        db_session.commit()
        
        # 验证指标保存成功
        assert generated_report.metrics == metrics
        assert generated_report.metrics["total_events"] == 100
        assert generated_report.metrics["success_rate"] == 0.95
    
    def test_generated_report_sections(self, db_session):
        """测试报告章节字段"""
        sections = [
            {
                "section_id": "sec_1",
                "title": "市场概况",
                "content": "今日市场表现...",
                "order": 1,
                "section_type": "overview"
            },
            {
                "section_id": "sec_2", 
                "title": "技术分析",
                "content": "技术指标显示...",
                "order": 2,
                "section_type": "technical"
            }
        ]
        
        generated_report = GeneratedReportEntity(
            report_id="rpt_123",
            report_type="daily_analysis",
            title="测试报告",
            description="测试描述",
            status="completed",
            period_start=datetime.now(),
            period_end=datetime.now(),
            summary="测试摘要",
            author="测试作者",
            sections=sections
        )
        
        db_session.add(generated_report)
        db_session.commit()
        
        # 验证章节保存成功
        assert len(generated_report.sections) == 2
        assert generated_report.sections[0]["title"] == "市场概况"
        assert generated_report.sections[1]["title"] == "技术分析"
    
    def test_generated_report_timestamps(self, db_session):
        """测试时间戳字段"""
        now = datetime.now()
        generated_report = GeneratedReportEntity(
            report_id="rpt_123",
            report_type="daily_analysis",
            title="测试报告",
            description="测试描述",
            status="completed",
            period_start=now,
            period_end=now,
            summary="测试摘要",
            author="测试作者"
        )
        
        db_session.add(generated_report)
        db_session.commit()
        
        # 验证时间戳字段自动设置
        assert generated_report.created_at is not None
        assert generated_report.updated_at is not None
        assert generated_report.created_at <= now
        assert generated_report.updated_at <= now

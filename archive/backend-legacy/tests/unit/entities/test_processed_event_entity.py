"""
处理事件实体单元测试
遵循TDD原则：先写测试，后写实现
"""

import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError

# 这些导入将会失败，因为实体类还不存在
from src.entities.processed_event import ProcessedEventEntity
from src.entities.base import Base


class TestProcessedEventEntity:
    """处理事件实体测试类"""

    @pytest.fixture
    def db_session(self):
        """创建测试数据库会话"""
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        Session = sessionmaker(bind=engine)
        session = Session()
        yield session
        session.close()

    def test_processed_event_creation(self, db_session):
        """测试处理事件实体创建"""
        # 准备测试数据
        processed_event = ProcessedEventEntity(
            event_id="evt_123",
            event_type="news",
            title="重大公告",
            content="公司发布重要公告...",
            published_at=datetime(2024, 1, 1, 10, 0, 0),
            related_stocks=["000001.SZ", "000002.SZ"],
            keywords=["公告", "重大", "公司"],
            sentiment_score=0.8,
            importance_score=0.9,
            status="completed",
            metadata={"source": "test"},
        )

        # 保存到数据库
        db_session.add(processed_event)
        db_session.commit()

        # 验证保存成功
        assert processed_event.event_id == "evt_123"
        assert processed_event.event_type == "news"
        assert processed_event.title == "重大公告"
        assert processed_event.sentiment_score == 0.8
        assert processed_event.importance_score == 0.9
        assert processed_event.status == "completed"

    def test_processed_event_validation(self, db_session):
        """测试处理事件实体验证"""
        # 测试必填字段验证
        with pytest.raises(IntegrityError):
            processed_event = ProcessedEventEntity(
                # 缺少必填字段
                event_id="evt_123"
            )
            db_session.add(processed_event)
            db_session.commit()

    def test_processed_event_enum_validation(self, db_session):
        """测试枚举字段验证"""
        # 测试无效的事件类型
        with pytest.raises(ValueError):
            processed_event = ProcessedEventEntity(
                event_id="evt_123",
                event_type="invalid_type",  # 无效的事件类型
                title="测试",
                content="测试内容",
                published_at=datetime.now(),
                sentiment_score=0.5,
                importance_score=0.5,
                status="completed",
            )

    def test_processed_event_sentiment_range(self, db_session):
        """测试情感分数范围验证"""
        # 测试情感分数超出范围
        with pytest.raises(ValueError):
            processed_event = ProcessedEventEntity(
                event_id="evt_123",
                event_type="news",
                title="测试",
                content="测试内容",
                published_at=datetime.now(),
                sentiment_score=1.5,  # 超出范围 [-1, 1]
                importance_score=0.5,
                status="completed",
            )

    def test_processed_event_importance_range(self, db_session):
        """测试重要性分数范围验证"""
        # 测试重要性分数超出范围
        with pytest.raises(ValueError):
            processed_event = ProcessedEventEntity(
                event_id="evt_123",
                event_type="news",
                title="测试",
                content="测试内容",
                published_at=datetime.now(),
                sentiment_score=0.5,
                importance_score=1.5,  # 超出范围 [0, 1]
                status="completed",
            )

    def test_processed_event_processing_result(self, db_session):
        """测试处理结果字段"""
        processing_result = {
            "extracted_entities": ["公司A", "产品B"],
            "sentiment_analysis": {"positive": 0.8, "negative": 0.2},
            "relevance_score": 0.9,
        }

        processed_event = ProcessedEventEntity(
            event_id="evt_123",
            event_type="news",
            title="测试",
            content="测试内容",
            published_at=datetime.now(),
            sentiment_score=0.5,
            importance_score=0.5,
            status="completed",
            processing_result=processing_result,
        )

        db_session.add(processed_event)
        db_session.commit()

        # 验证处理结果保存成功
        assert processed_event.processing_result == processing_result
        assert processed_event.processing_result["extracted_entities"] == [
            "公司A",
            "产品B",
        ]
        assert processed_event.processing_result["relevance_score"] == 0.9

    def test_processed_event_timestamps(self, db_session):
        """测试时间戳字段"""
        now = datetime.now()
        processed_event = ProcessedEventEntity(
            event_id="evt_123",
            event_type="news",
            title="测试",
            content="测试内容",
            published_at=now,
            sentiment_score=0.5,
            importance_score=0.5,
            status="completed",
        )

        db_session.add(processed_event)
        db_session.commit()

        # 验证时间戳字段自动设置
        assert processed_event.created_at is not None
        assert processed_event.updated_at is not None
        assert processed_event.created_at <= now
        assert processed_event.updated_at <= now

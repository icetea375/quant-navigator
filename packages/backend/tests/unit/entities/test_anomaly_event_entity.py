"""
异常事件实体单元测试
遵循TDD原则：先写测试，后写实现
"""

import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError

# 这些导入将会失败，因为实体类还不存在
from src.entities.anomaly_event import AnomalyEventEntity
from src.entities.base import Base


class TestAnomalyEventEntity:
    """异常事件实体测试类"""
    
    @pytest.fixture
    def db_session(self):
        """创建测试数据库会话"""
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        Session = sessionmaker(bind=engine)
        session = Session()
        yield session
        session.close()
    
    def test_anomaly_event_creation(self, db_session):
        """测试异常事件实体创建"""
        # 准备测试数据
        anomaly_event = AnomalyEventEntity(
            id="evt_123",
            stock_code="000001.SZ",
            timestamp=1640995200000,  # 2022-01-01 00:00:00
            anomaly_type="price",
            severity="high",
            description="价格异常波动",
            z_score=2.5,
            current_value=100.0,
            expected_value=95.0,
            deviation=5.0,
            confidence=0.85,
            context={
                "market_state": "trading",
                "sector_performance": 0.02,
                "news_count": 5,
                "volume_ratio": 1.5
            },
            metadata={"source": "test"}
        )
        
        # 保存到数据库
        db_session.add(anomaly_event)
        db_session.commit()
        
        # 验证保存成功
        assert anomaly_event.id == "evt_123"
        assert anomaly_event.stock_code == "000001.SZ"
        assert anomaly_event.anomaly_type == "price"
        assert anomaly_event.severity == "high"
        assert anomaly_event.z_score == 2.5
        assert anomaly_event.confidence == 0.85
    
    def test_anomaly_event_validation(self, db_session):
        """测试异常事件实体验证"""
        # 测试必填字段验证
        with pytest.raises(IntegrityError):
            anomaly_event = AnomalyEventEntity(
                # 缺少必填字段
                stock_code="000001.SZ"
            )
            db_session.add(anomaly_event)
            db_session.commit()
    
    def test_anomaly_event_enum_validation(self, db_session):
        """测试枚举字段验证"""
        # 测试无效的异常类型
        with pytest.raises(ValueError):
            anomaly_event = AnomalyEventEntity(
                id="evt_123",
                stock_code="000001.SZ",
                timestamp=1640995200000,
                anomaly_type="invalid_type",  # 无效的异常类型
                severity="high",
                description="测试",
                z_score=2.5,
                current_value=100.0,
                expected_value=95.0,
                deviation=5.0,
                confidence=0.85,
                context={},
                metadata={}
            )
    
    def test_anomaly_event_confidence_range(self, db_session):
        """测试置信度范围验证"""
        # 测试置信度超出范围
        with pytest.raises(ValueError):
            anomaly_event = AnomalyEventEntity(
                id="evt_123",
                stock_code="000001.SZ",
                timestamp=1640995200000,
                anomaly_type="price",
                severity="high",
                description="测试",
                z_score=2.5,
                current_value=100.0,
                expected_value=95.0,
                deviation=5.0,
                confidence=1.5,  # 超出范围 [0, 1]
                context={},
                metadata={}
            )
    
    def test_anomaly_event_context_validation(self, db_session):
        """测试上下文信息验证"""
        # 测试缺少必需的上下文字段
        with pytest.raises(ValueError):
            anomaly_event = AnomalyEventEntity(
                id="evt_123",
                stock_code="000001.SZ",
                timestamp=1640995200000,
                anomaly_type="price",
                severity="high",
                description="测试",
                z_score=2.5,
                current_value=100.0,
                expected_value=95.0,
                deviation=5.0,
                confidence=0.85,
                context={},  # 缺少必需的上下文字段
                metadata={}
            )
    
    def test_anomaly_event_timestamps(self, db_session):
        """测试时间戳字段"""
        now = datetime.now()
        anomaly_event = AnomalyEventEntity(
            id="evt_123",
            stock_code="000001.SZ",
            timestamp=1640995200000,
            anomaly_type="price",
            severity="high",
            description="测试",
            z_score=2.5,
            current_value=100.0,
            expected_value=95.0,
            deviation=5.0,
            confidence=0.85,
            context={
                "market_state": "trading",
                "sector_performance": 0.02,
                "news_count": 5,
                "volume_ratio": 1.5
            },
            metadata={}
        )
        
        db_session.add(anomaly_event)
        db_session.commit()
        
        # 验证时间戳字段自动设置
        assert anomaly_event.created_at is not None
        assert anomaly_event.updated_at is not None
        assert anomaly_event.created_at <= now
        assert anomaly_event.updated_at <= now

"""
异常事件实体单元测试
严格遵循测试宪法:风险驱动,测试金字塔,TDD红-绿-重构循环
"""

from datetime import datetime

import pytest
from quant_navigator_shared_types.events import AnomalyEvent, AnomalyType, SeverityLevel
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.entities.anomaly_event import AnomalyEventEntity


class TestAnomalyEventEntity:
    """异常事件实体测试类"""

    @pytest.fixture
    def engine(self):
        """创建测试数据库引擎"""
        engine = create_engine("sqlite:///:memory:", echo=False)
        AnomalyEventEntity.metadata.create_all(engine)
        return engine

    @pytest.fixture
    def session(self, engine):
        """创建测试数据库会话"""
        Session = sessionmaker(bind=engine)
        session = Session()
        yield session
        session.close()

    def test_entity_creation(self, session):
        """测试实体创建"""
        entity = AnomalyEventEntity(
            id="test_anomaly_001",
            stock_code="000001.SZ",
            timestamp=int(datetime.now().timestamp() * 1000),
            anomaly_type="price",
            severity="high",
            description="价格异常波动",
            z_score=2.5,
            current_value=12.50,
            expected_value=10.00,
            deviation=2.50,
            confidence=0.85,
            context_json={
                "market_state": "trading",
                "sector_performance": 0.05,
                "news_count": 10,
                "volume_ratio": 1.5,
            },
            metadata_json={"source": "test"},
        )

        session.add(entity)
        session.commit()

        assert entity.id == "test_anomaly_001"  # 使用字符串ID
        assert entity.stock_code == "000001.SZ"
        assert entity.anomaly_type == "price"
        assert entity.severity == "high"
        assert entity.z_score == 2.5
        assert entity.confidence == 0.85

    def test_entity_validation_success(self, session):
        """测试实体验证成功"""
        valid_data = {
            "id": "test_anomaly_002",
            "stock_code": "000001.SZ",
            "timestamp": int(datetime.now().timestamp() * 1000),
            "anomaly_type": "volume",
            "severity": "medium",
            "description": "成交量异常",
            "z_score": 1.8,
            "current_value": 150000000,
            "expected_value": 100000000,
            "deviation": 50000000,
            "confidence": 0.75,
            "context_json": {
                "market_state": "trading",
                "sector_performance": 0.03,
                "news_count": 5,
                "volume_ratio": 2.0,
            },
            "metadata_json": {"source": "test"},
        }

        entity = AnomalyEventEntity(**valid_data)
        session.add(entity)
        session.commit()

        assert entity.id == "test_anomaly_002"  # 使用字符串ID
        assert entity.anomaly_type == "volume"
        assert entity.severity == "medium"

    def test_entity_validation_failure(self):
        """测试实体验证失败"""
        invalid_data = {
            "id": "test_anomaly_003",
            "stock_code": "000001.SZ",
            "timestamp": int(datetime.now().timestamp() * 1000),
            "anomaly_type": "invalid_type",  # 无效的异常类型
            "severity": "medium",
            "description": "测试描述",
            "z_score": 1.8,
            "current_value": 150000000,
            "expected_value": 100000000,
            "deviation": 50000000,
            "confidence": 0.75,
            "context_json": {
                "market_state": "trading",
                "sector_performance": 0.03,
                "news_count": 5,
                "volume_ratio": 2.0,
            },
            "metadata_json": {"source": "test"},
        }

        with pytest.raises(ValueError) as exc_info:
            AnomalyEventEntity(**invalid_data)

        assert "Invalid anomaly event data" in str(exc_info.value)

    def test_to_anomaly_event(self, session):
        """测试转换为Pydantic模型"""
        entity = AnomalyEventEntity(
            id="test_anomaly_004",
            stock_code="000001.SZ",
            timestamp=int(datetime.now().timestamp() * 1000),
            anomaly_type="price",
            severity="high",
            description="价格异常波动",
            z_score=2.5,
            current_value=12.50,
            expected_value=10.00,
            deviation=2.50,
            confidence=0.85,
            context_json={
                "market_state": "trading",
                "sector_performance": 0.05,
                "news_count": 10,
                "volume_ratio": 1.5,
            },
            metadata_json={"source": "test"},
        )

        session.add(entity)
        session.commit()

        anomaly_event = entity.to_anomaly_event()

        assert isinstance(anomaly_event, AnomalyEvent)
        assert anomaly_event.stock_code == "000001.SZ"
        assert anomaly_event.anomaly_type == AnomalyType.PRICE
        assert anomaly_event.severity == SeverityLevel.HIGH
        assert anomaly_event.z_score == 2.5
        assert anomaly_event.confidence == 0.85
        assert anomaly_event.context == {
            "market_state": "trading",
            "sector_performance": 0.05,
            "news_count": 10,
            "volume_ratio": 1.5,
        }
        assert anomaly_event.metadata == {"source": "test"}

    def test_from_anomaly_event(self, session):
        """测试从Pydantic模型创建实体"""
        anomaly_event = AnomalyEvent(
            id="test_id",
            stock_code="000001.SZ",
            timestamp=int(datetime.now().timestamp() * 1000),
            anomaly_type=AnomalyType.PRICE,
            severity=SeverityLevel.HIGH,
            description="价格异常波动",
            z_score=2.5,
            current_value=12.50,
            expected_value=10.00,
            deviation=2.50,
            confidence=0.85,
            context={
                "market_state": "trading",
                "sector_performance": 0.05,
                "news_count": 10,
                "volume_ratio": 1.5,
            },
            metadata={"source": "test"},
        )

        entity = AnomalyEventEntity.from_anomaly_event(anomaly_event)

        session.add(entity)
        session.commit()

        assert entity.id == "test_id"
        assert entity.stock_code == "000001.SZ"
        assert entity.anomaly_type == "price"
        assert entity.severity == "high"
        assert entity.z_score == 2.5
        assert entity.confidence == 0.85
        assert entity.context_json == {
            "market_state": "trading",
            "sector_performance": 0.05,
            "news_count": 10,
            "volume_ratio": 1.5,
        }
        assert entity.metadata_json == {"source": "test"}

    def test_round_trip_conversion(self, session):
        """测试往返转换"""
        original_entity = AnomalyEventEntity(
            id="test_anomaly_005",
            stock_code="000001.SZ",
            timestamp=int(datetime.now().timestamp() * 1000),
            anomaly_type="price",
            severity="high",
            description="价格异常波动",
            z_score=2.5,
            current_value=12.50,
            expected_value=10.00,
            deviation=2.50,
            confidence=0.85,
            context_json={
                "market_state": "trading",
                "sector_performance": 0.05,
                "news_count": 10,
                "volume_ratio": 1.5,
            },
            metadata_json={"source": "test"},
        )

        # 转换为Pydantic模型
        anomaly_event = original_entity.to_anomaly_event()

        # 从Pydantic模型创建新实体
        new_entity = AnomalyEventEntity.from_anomaly_event(anomaly_event)

        # 验证数据一致性
        assert new_entity.stock_code == original_entity.stock_code
        assert new_entity.anomaly_type == original_entity.anomaly_type
        assert new_entity.severity == original_entity.severity
        assert new_entity.z_score == original_entity.z_score
        assert new_entity.confidence == original_entity.confidence
        assert new_entity.context_json == original_entity.context_json
        assert new_entity.metadata_json == original_entity.metadata_json

    def test_nullable_fields(self, session):
        """测试可空字段"""
        entity = AnomalyEventEntity(
            id="test_anomaly_004",
            stock_code="000001.SZ",
            timestamp=int(datetime.now().timestamp() * 1000),
            anomaly_type="price",
            severity="high",
            description="价格异常波动",
            z_score=2.5,
            current_value=12.50,
            expected_value=10.00,
            deviation=2.50,
            confidence=0.85,
            context_json={
                "market_state": "trading",
                "sector_performance": 0.05,
                "news_count": 10,
                "volume_ratio": 1.5,
            },
            metadata_json={},  # 测试可空字段,使用空字典而不是None
        )

        session.add(entity)
        session.commit()

        assert entity.metadata_json == {}

        # 转换为Pydantic模型时应该使用默认值
        anomaly_event = entity.to_anomaly_event()
        assert anomaly_event.metadata == {}

    def test_confidence_constraint(self, session):
        """测试置信度约束"""
        # 测试有效置信度
        entity = AnomalyEventEntity(
            id="test_anomaly_004",
            stock_code="000001.SZ",
            timestamp=int(datetime.now().timestamp() * 1000),
            anomaly_type="price",
            severity="high",
            description="价格异常波动",
            z_score=2.5,
            current_value=12.50,
            expected_value=10.00,
            deviation=2.50,
            confidence=0.5,  # 有效置信度
            context_json={
                "market_state": "trading",
                "sector_performance": 0.05,
                "news_count": 10,
                "volume_ratio": 1.5,
            },
            metadata_json={"source": "test"},
        )

        session.add(entity)
        session.commit()

        assert entity.confidence == 0.5

    def test_anomaly_type_constraint(self, session):
        """测试异常类型约束"""
        valid_types = ["price", "volume", "volatility", "correlation"]

        for i, anomaly_type in enumerate(valid_types):
            entity = AnomalyEventEntity(
                id=f"test_anomaly_type_{i}",
                stock_code="000001.SZ",
                timestamp=int(datetime.now().timestamp() * 1000),
                anomaly_type=anomaly_type,
                severity="high",
                description="测试异常",
                z_score=2.5,
                current_value=12.50,
                expected_value=10.00,
                deviation=2.50,
                confidence=0.85,
                context_json={
                    "market_state": "trading",
                    "sector_performance": 0.05,
                    "news_count": 10,
                    "volume_ratio": 1.5,
                },
                metadata_json={"source": "test"},
            )

            session.add(entity)
            session.commit()

            assert entity.anomaly_type == anomaly_type

    def test_severity_constraint(self, session):
        """测试严重程度约束"""
        valid_severities = ["low", "medium", "high", "critical"]

        for i, severity in enumerate(valid_severities):
            entity = AnomalyEventEntity(
                id=f"test_severity_{i}",
                stock_code="000001.SZ",
                timestamp=int(datetime.now().timestamp() * 1000),
                anomaly_type="price",
                severity=severity,
                description="测试异常",
                z_score=2.5,
                current_value=12.50,
                expected_value=10.00,
                deviation=2.50,
                confidence=0.85,
                context_json={
                    "market_state": "trading",
                    "sector_performance": 0.05,
                    "news_count": 10,
                    "volume_ratio": 1.5,
                },
                metadata_json={"source": "test"},
            )

            session.add(entity)
            session.commit()

            assert entity.severity == severity

    def test_entity_repr(self, session):
        """测试实体字符串表示"""
        entity = AnomalyEventEntity(
            id="test_anomaly_004",
            stock_code="000001.SZ",
            timestamp=int(datetime.now().timestamp() * 1000),
            anomaly_type="price",
            severity="high",
            description="价格异常波动",
            z_score=2.5,
            current_value=12.50,
            expected_value=10.00,
            deviation=2.50,
            confidence=0.85,
            context_json={
                "market_state": "trading",
                "sector_performance": 0.05,
                "news_count": 10,
                "volume_ratio": 1.5,
            },
            metadata_json={"source": "test"},
        )

        session.add(entity)
        session.commit()

        repr_str = repr(entity)
        assert "AnomalyEventEntity" in repr_str
        assert "000001.SZ" in repr_str
        assert "price" in repr_str

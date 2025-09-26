"""
量化信号实体单元测试
遵循TDD原则：先写测试，后写实现
"""

import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError

# 这些导入将会失败，因为实体类还不存在
from src.entities.quant_signal import QuantSignalEntity
from src.entities.base import Base


class TestQuantSignalEntity:
    """量化信号实体测试类"""

    @pytest.fixture
    def db_session(self):
        """创建测试数据库会话"""
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        Session = sessionmaker(bind=engine)
        session = Session()
        yield session
        session.close()

    def test_quant_signal_creation(self, db_session):
        """测试量化信号实体创建"""
        # 准备测试数据
        quant_signal = QuantSignalEntity(
            signal_id="sig_123",
            target_code="000001.SZ",
            signal_date=datetime(2024, 1, 1),
            signal_type="individual",
            status="active",
            return_z_score=1.5,
            volume_z_score=2.0,
            momentum_z_score=1.8,
            volatility_z_score=1.2,
            macro_risk_z_score=0.5,
            market_style_z_score=1.0,
            industry_rotation_z_score=1.3,
            concept_z_score=0.8,
            mda_fulfillment_rate=0.85,
            management_credibility_score=0.9,
            disclosure_quality_score=0.8,
            financial_transparency_score=0.75,
            rsi=65.0,
            macd_signal=0.5,
            bollinger_position=0.6,
            ma_signal=1.0,
            overall_signal_strength=0.7,
            signal_confidence=0.8,
            validity_days=30,
            model_version="v1.0.0",
            source="test_source",
            metadata={"test": "data"},
        )

        # 保存到数据库
        db_session.add(quant_signal)
        db_session.commit()

        # 验证保存成功
        assert quant_signal.signal_id == "sig_123"
        assert quant_signal.target_code == "000001.SZ"
        assert quant_signal.signal_type == "individual"
        assert quant_signal.status == "active"
        assert quant_signal.return_z_score == 1.5
        assert quant_signal.signal_confidence == 0.8

    def test_quant_signal_validation(self, db_session):
        """测试量化信号实体验证"""
        # 测试必填字段验证
        with pytest.raises(IntegrityError):
            quant_signal = QuantSignalEntity(
                # 缺少必填字段
                signal_id="sig_123"
            )
            db_session.add(quant_signal)
            db_session.commit()

    def test_quant_signal_enum_validation(self, db_session):
        """测试枚举字段验证"""
        # 测试无效的信号类型
        with pytest.raises(ValueError):
            quant_signal = QuantSignalEntity(
                signal_id="sig_123",
                target_code="000001.SZ",
                signal_date=datetime.now(),
                signal_type="invalid_type",  # 无效的信号类型
                status="active",
                return_z_score=1.5,
                volume_z_score=2.0,
                momentum_z_score=1.8,
                volatility_z_score=1.2,
                macro_risk_z_score=0.5,
                market_style_z_score=1.0,
                industry_rotation_z_score=1.3,
                concept_z_score=0.8,
                mda_fulfillment_rate=0.85,
                management_credibility_score=0.9,
                disclosure_quality_score=0.8,
                financial_transparency_score=0.75,
                rsi=65.0,
                macd_signal=0.5,
                bollinger_position=0.6,
                ma_signal=1.0,
                overall_signal_strength=0.7,
                signal_confidence=0.8,
                validity_days=30,
                model_version="v1.0.0",
                source="test_source",
            )

    def test_quant_signal_confidence_range(self, db_session):
        """测试置信度范围验证"""
        # 测试置信度超出范围
        with pytest.raises(ValueError):
            quant_signal = QuantSignalEntity(
                signal_id="sig_123",
                target_code="000001.SZ",
                signal_date=datetime.now(),
                signal_type="individual",
                status="active",
                return_z_score=1.5,
                volume_z_score=2.0,
                momentum_z_score=1.8,
                volatility_z_score=1.2,
                macro_risk_z_score=0.5,
                market_style_z_score=1.0,
                industry_rotation_z_score=1.3,
                concept_z_score=0.8,
                mda_fulfillment_rate=0.85,
                management_credibility_score=0.9,
                disclosure_quality_score=0.8,
                financial_transparency_score=0.75,
                rsi=65.0,
                macd_signal=0.5,
                bollinger_position=0.6,
                ma_signal=1.0,
                overall_signal_strength=0.7,
                signal_confidence=1.5,  # 超出范围 [0, 1]
                validity_days=30,
                model_version="v1.0.0",
                source="test_source",
            )

    def test_quant_signal_rsi_range(self, db_session):
        """测试RSI范围验证"""
        # 测试RSI超出范围
        with pytest.raises(ValueError):
            quant_signal = QuantSignalEntity(
                signal_id="sig_123",
                target_code="000001.SZ",
                signal_date=datetime.now(),
                signal_type="individual",
                status="active",
                return_z_score=1.5,
                volume_z_score=2.0,
                momentum_z_score=1.8,
                volatility_z_score=1.2,
                macro_risk_z_score=0.5,
                market_style_z_score=1.0,
                industry_rotation_z_score=1.3,
                concept_z_score=0.8,
                mda_fulfillment_rate=0.85,
                management_credibility_score=0.9,
                disclosure_quality_score=0.8,
                financial_transparency_score=0.75,
                rsi=150.0,  # 超出范围 [0, 100]
                macd_signal=0.5,
                bollinger_position=0.6,
                ma_signal=1.0,
                overall_signal_strength=0.7,
                signal_confidence=0.8,
                validity_days=30,
                model_version="v1.0.0",
                source="test_source",
            )

    def test_quant_signal_future_date_validation(self, db_session):
        """测试未来日期验证"""
        # 测试信号日期不能是未来时间
        future_date = datetime(2025, 12, 31)
        with pytest.raises(ValueError):
            quant_signal = QuantSignalEntity(
                signal_id="sig_123",
                target_code="000001.SZ",
                signal_date=future_date,  # 未来日期
                signal_type="individual",
                status="active",
                return_z_score=1.5,
                volume_z_score=2.0,
                momentum_z_score=1.8,
                volatility_z_score=1.2,
                macro_risk_z_score=0.5,
                market_style_z_score=1.0,
                industry_rotation_z_score=1.3,
                concept_z_score=0.8,
                mda_fulfillment_rate=0.85,
                management_credibility_score=0.9,
                disclosure_quality_score=0.8,
                financial_transparency_score=0.75,
                rsi=65.0,
                macd_signal=0.5,
                bollinger_position=0.6,
                ma_signal=1.0,
                overall_signal_strength=0.7,
                signal_confidence=0.8,
                validity_days=30,
                model_version="v1.0.0",
                source="test_source",
            )

    def test_quant_signal_timestamps(self, db_session):
        """测试时间戳字段"""
        now = datetime.now()
        quant_signal = QuantSignalEntity(
            signal_id="sig_123",
            target_code="000001.SZ",
            signal_date=now,
            signal_type="individual",
            status="active",
            return_z_score=1.5,
            volume_z_score=2.0,
            momentum_z_score=1.8,
            volatility_z_score=1.2,
            macro_risk_z_score=0.5,
            market_style_z_score=1.0,
            industry_rotation_z_score=1.3,
            concept_z_score=0.8,
            mda_fulfillment_rate=0.85,
            management_credibility_score=0.9,
            disclosure_quality_score=0.8,
            financial_transparency_score=0.75,
            rsi=65.0,
            macd_signal=0.5,
            bollinger_position=0.6,
            ma_signal=1.0,
            overall_signal_strength=0.7,
            signal_confidence=0.8,
            validity_days=30,
            model_version="v1.0.0",
            source="test_source",
        )

        db_session.add(quant_signal)
        db_session.commit()

        # 验证时间戳字段自动设置
        assert quant_signal.created_at is not None
        assert quant_signal.updated_at is not None
        assert quant_signal.created_at <= now
        assert quant_signal.updated_at <= now

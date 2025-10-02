"""
量化信号实体 - 与Pydantic契约保持严格一致
"""

from typing import Any

from pydantic import ValidationError
from quant_navigator_shared_types.quant_signals import QuantSignal
from sqlalchemy import JSON, CheckConstraint, Column, DateTime, Float, Integer, String

from .base import BaseEntity


class QuantSignalEntity(BaseEntity):
    """量化信号实体类"""

    __tablename__ = "quant_signals"

    # 基本信息
    signal_id = Column(String(255), nullable=False, unique=True, comment="信号ID")
    target_code = Column(String(20), nullable=False, comment="目标股票代码")
    signal_date = Column(DateTime, nullable=False, comment="信号日期")
    signal_type = Column(String(20), nullable=False, comment="信号类型")
    status = Column(String(20), nullable=False, comment="状态")

    # Z分数指标
    return_z_score = Column(Float, nullable=False, comment="收益率Z分数")
    volume_z_score = Column(Float, nullable=False, comment="成交量Z分数")
    momentum_z_score = Column(Float, nullable=False, comment="动量Z分数")
    volatility_z_score = Column(Float, nullable=False, comment="波动率Z分数")
    macro_risk_z_score = Column(Float, nullable=False, comment="宏观风险Z分数")
    market_style_z_score = Column(Float, nullable=False, comment="市场风格Z分数")
    industry_rotation_z_score = Column(Float, nullable=False, comment="行业轮动Z分数")
    concept_z_score = Column(Float, nullable=False, comment="概念Z分数")

    # MDA相关指标
    mda_fulfillment_rate = Column(Float, nullable=False, comment="MDA履行率")
    management_credibility_score = Column(
        Float, nullable=False, comment="管理层可信度分数"
    )
    disclosure_quality_score = Column(Float, nullable=False, comment="披露质量分数")
    financial_transparency_score = Column(
        Float, nullable=False, comment="财务透明度分数"
    )

    # 技术指标
    rsi = Column(Float, nullable=False, comment="RSI指标")
    macd_signal = Column(Float, nullable=False, comment="MACD信号")
    bollinger_position = Column(Float, nullable=False, comment="布林带位置")
    ma_signal = Column(Float, nullable=False, comment="移动平均信号")

    # 综合指标
    overall_signal_strength = Column(Float, nullable=False, comment="整体信号强度")
    signal_confidence = Column(Float, nullable=False, comment="信号置信度")
    validity_days = Column(Integer, nullable=False, comment="有效期天数")

    # 元数据
    model_version = Column(String(50), nullable=False, comment="模型版本")
    calculation_params_json = Column(JSON, nullable=True, comment="计算参数")
    source = Column(String(100), nullable=False, comment="数据源")
    metadata_json = Column(JSON, nullable=True, comment="元数据")

    # 添加约束
    __table_args__ = (
        CheckConstraint(
            "mda_fulfillment_rate >= 0 AND mda_fulfillment_rate <= 1",
            name="check_mda_fulfillment_range",
        ),
        CheckConstraint(
            "management_credibility_score >= 0 AND management_credibility_score <= 1",
            name="check_management_credibility_range",
        ),
        CheckConstraint(
            "disclosure_quality_score >= 0 AND disclosure_quality_score <= 1",
            name="check_disclosure_quality_range",
        ),
        CheckConstraint(
            "financial_transparency_score >= 0 AND financial_transparency_score <= 1",
            name="check_financial_transparency_range",
        ),
        CheckConstraint("rsi >= 0 AND rsi <= 100", name="check_rsi_range"),
        CheckConstraint(
            "bollinger_position >= 0 AND bollinger_position <= 1",
            name="check_bollinger_position_range",
        ),
        CheckConstraint(
            "overall_signal_strength >= -1 AND overall_signal_strength <= 1",
            name="check_signal_strength_range",
        ),
        CheckConstraint(
            "signal_confidence >= 0 AND signal_confidence <= 1",
            name="check_signal_confidence_range",
        ),
        CheckConstraint("validity_days > 0", name="check_validity_days_positive"),
        CheckConstraint(
            'signal_type IN ("individual", "market", "macro", "style", "industry")',
            name="check_signal_type",
        ),
        CheckConstraint(
            'status IN ("active", "expired", "cancelled", "archived")',
            name="check_signal_status",
        ),
    )

    def __init__(self, **kwargs):
        """初始化量化信号实体"""
        # 验证输入数据
        self._validate_input_data(kwargs)
        super().__init__(**kwargs)

    def _validate_input_data(self, data: dict[str, Any]) -> None:
        """验证输入数据"""
        try:
            # 创建Pydantic模型进行验证
            QuantSignal(**data)
        except ValidationError as e:
            raise ValueError(f"Invalid quant signal data: {e}") from e

    def to_quant_signal(self) -> QuantSignal:
        """转换为Pydantic QuantSignal模型"""
        data = {
            "signal_id": self.signal_id,
            "target_code": self.target_code,
            "signal_date": self.signal_date,
            "signal_type": self.signal_type,
            "status": self.status,
            "return_z_score": self.return_z_score,
            "volume_z_score": self.volume_z_score,
            "momentum_z_score": self.momentum_z_score,
            "volatility_z_score": self.volatility_z_score,
            "macro_risk_z_score": self.macro_risk_z_score,
            "market_style_z_score": self.market_style_z_score,
            "industry_rotation_z_score": self.industry_rotation_z_score,
            "concept_z_score": self.concept_z_score,
            "mda_fulfillment_rate": self.mda_fulfillment_rate,
            "management_credibility_score": self.management_credibility_score,
            "disclosure_quality_score": self.disclosure_quality_score,
            "financial_transparency_score": self.financial_transparency_score,
            "rsi": self.rsi,
            "macd_signal": self.macd_signal,
            "bollinger_position": self.bollinger_position,
            "ma_signal": self.ma_signal,
            "overall_signal_strength": self.overall_signal_strength,
            "signal_confidence": self.signal_confidence,
            "validity_days": self.validity_days,
            "model_version": self.model_version,
            "calculation_params": self.calculation_params_json or {},
            "source": self.source,
            "metadata": self.metadata_json or {},
        }
        return QuantSignal(**data)

    @classmethod
    def from_quant_signal(cls, quant_signal: QuantSignal) -> "QuantSignalEntity":
        """从Pydantic QuantSignal模型创建实体"""
        data = quant_signal.model_dump()
        return cls(
            id=data["signal_id"],  # 使用signal_id作为主键
            signal_id=data["signal_id"],
            target_code=data["target_code"],
            signal_date=data["signal_date"],
            signal_type=data["signal_type"],
            status=data["status"],
            return_z_score=data["return_z_score"],
            volume_z_score=data["volume_z_score"],
            momentum_z_score=data["momentum_z_score"],
            volatility_z_score=data["volatility_z_score"],
            macro_risk_z_score=data["macro_risk_z_score"],
            market_style_z_score=data["market_style_z_score"],
            industry_rotation_z_score=data["industry_rotation_z_score"],
            concept_z_score=data["concept_z_score"],
            mda_fulfillment_rate=data["mda_fulfillment_rate"],
            management_credibility_score=data["management_credibility_score"],
            disclosure_quality_score=data["disclosure_quality_score"],
            financial_transparency_score=data["financial_transparency_score"],
            rsi=data["rsi"],
            macd_signal=data["macd_signal"],
            bollinger_position=data["bollinger_position"],
            ma_signal=data["ma_signal"],
            overall_signal_strength=data["overall_signal_strength"],
            signal_confidence=data["signal_confidence"],
            validity_days=data["validity_days"],
            model_version=data["model_version"],
            calculation_params_json=data["calculation_params"],
            source=data["source"],
            metadata_json=data["metadata"],
        )

    def __repr__(self):
        """字符串表示"""
        return f"<QuantSignalEntity(id='{self.id}', signal_id='{self.signal_id}', target_code='{self.target_code}')>"

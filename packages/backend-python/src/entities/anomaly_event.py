"""
异常事件实体 - 与Pydantic契约保持严格一致
"""

from datetime import datetime
from typing import Dict, Any
from sqlalchemy import Column, String, Integer, Float, Text, JSON, CheckConstraint
from sqlalchemy.dialects.postgresql import ENUM
from pydantic import ValidationError

from .base import BaseEntity
from quant_navigator_shared_types.events import AnomalyEvent, AnomalyType, SeverityLevel


class AnomalyEventEntity(BaseEntity):
    """异常事件实体类"""
    __tablename__ = 'anomaly_events'
    
    # 基本信息
    stock_code = Column(String(20), nullable=False, comment="股票代码")
    timestamp = Column(Integer, nullable=False, comment="时间戳 (毫秒)")
    anomaly_type = Column(String(20), nullable=False, comment="异常类型")
    severity = Column(String(20), nullable=False, comment="严重程度")
    description = Column(Text, nullable=False, comment="描述信息")
    
    # 数值指标
    z_score = Column(Float, nullable=False, comment="Z分数")
    current_value = Column(Float, nullable=False, comment="当前值")
    expected_value = Column(Float, nullable=False, comment="期望值")
    deviation = Column(Float, nullable=False, comment="偏差值")
    confidence = Column(Float, nullable=False, comment="置信度 (0-1)")
    
    # 上下文信息
    context_json = Column(JSON, nullable=False, comment="上下文信息")
    
    # 添加约束
    __table_args__ = (
        CheckConstraint('confidence >= 0 AND confidence <= 1', name='check_confidence_range'),
        CheckConstraint('anomaly_type IN ("price", "volume", "volatility", "correlation")', name='check_anomaly_type'),
        CheckConstraint('severity IN ("low", "medium", "high", "critical")', name='check_severity'),
    )
    
    def __init__(self, **kwargs):
        """初始化异常事件实体"""
        # 验证输入数据
        self._validate_input_data(kwargs)
        super().__init__(**kwargs)
    
    def _validate_input_data(self, data: Dict[str, Any]) -> None:
        """验证输入数据"""
        try:
            # 创建Pydantic模型进行验证
            anomaly_event = AnomalyEvent(**data)
        except ValidationError as e:
            raise ValueError(f"Invalid anomaly event data: {e}")
    
    def to_anomaly_event(self) -> AnomalyEvent:
        """转换为Pydantic AnomalyEvent模型"""
        data = {
            'id': self.id,
            'stock_code': self.stock_code,
            'timestamp': self.timestamp,
            'anomaly_type': self.anomaly_type,
            'severity': self.severity,
            'description': self.description,
            'z_score': self.z_score,
            'current_value': self.current_value,
            'expected_value': self.expected_value,
            'deviation': self.deviation,
            'confidence': self.confidence,
            'context': self.context_json or {},
            'metadata': self.metadata_json or {}
        }
        return AnomalyEvent(**data)
    
    @classmethod
    def from_anomaly_event(cls, anomaly_event: AnomalyEvent) -> 'AnomalyEventEntity':
        """从Pydantic AnomalyEvent模型创建实体"""
        data = anomaly_event.model_dump()
        return cls(
            id=data['id'],
            stock_code=data['stock_code'],
            timestamp=data['timestamp'],
            anomaly_type=data['anomaly_type'],
            severity=data['severity'],
            description=data['description'],
            z_score=data['z_score'],
            current_value=data['current_value'],
            expected_value=data['expected_value'],
            deviation=data['deviation'],
            confidence=data['confidence'],
            context_json=data['context'],
            metadata_json=data['metadata']
        )
    
    def __repr__(self):
        """字符串表示"""
        return f"<AnomalyEventEntity(id='{self.id}', stock_code='{self.stock_code}', type='{self.anomaly_type}')>"

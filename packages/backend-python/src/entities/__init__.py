"""
实体模块 - 数据库实体定义
所有实体类都继承自Base,确保与Pydantic契约保持一致
"""

from .anomaly_event import AnomalyEventEntity
from .base import Base, BaseEntity
from .generated_report import GeneratedReportEntity
from .processed_event import ProcessedEventEntity
from .quant_signal import QuantSignalEntity

__all__ = [
    "AnomalyEventEntity",
    "Base",
    "BaseEntity",
    "GeneratedReportEntity",
    "ProcessedEventEntity",
    "QuantSignalEntity",
]

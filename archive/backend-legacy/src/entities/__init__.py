"""
实体模块 - 数据库实体定义
所有实体类都继承自Base，确保与Pydantic契约保持一致
"""

from .base import Base
from .anomaly_event import AnomalyEventEntity
from .processed_event import ProcessedEventEntity
from .quant_signal import QuantSignalEntity
from .generated_report import GeneratedReportEntity

__all__ = [
    "Base",
    "AnomalyEventEntity",
    "ProcessedEventEntity",
    "QuantSignalEntity",
    "GeneratedReportEntity",
]

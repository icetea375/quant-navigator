"""
业务异常定义模块

定义项目中使用的所有自定义业务异常,实现失败透明化。
"""

from .quant_exceptions import (
    QuantAnomalyDetectionError,
    QuantCalculationError,
    QuantConfigurationError,
    QuantDatabaseError,
    QuantDataProviderError,
    QuantServiceError,
    QuantSignalError,
    QuantValidationError,
)

__all__ = [
    "QuantAnomalyDetectionError",
    "QuantCalculationError",
    "QuantConfigurationError",
    "QuantDataProviderError",
    "QuantDatabaseError",
    "QuantServiceError",
    "QuantSignalError",
    "QuantValidationError",
]

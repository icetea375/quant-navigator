"""
量化服务业务异常定义

定义所有量化服务相关的业务异常,实现失败透明化。
每个异常都包含详细的上下文信息,便于调试和监控。
"""

from typing import Any, Optional


class QuantServiceError(Exception):
    """量化服务基础异常类"""

    def __init__(self, message: str, context: Optional[dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.context = context or {}

    def __str__(self) -> str:
        if self.context:
            context_str = ", ".join(f"{k}={v}" for k, v in self.context.items())
            return f"{self.message} (Context: {context_str})"
        return self.message


class QuantDatabaseError(QuantServiceError):
    """数据库操作异常"""

    def __init__(
        self,
        message: str,
        operation: str,
        entity: Optional[str] = None,
        context: Optional[dict[str, Any]] = None,
    ):
        super().__init__(message, context)
        self.operation = operation
        self.entity = entity

    def __str__(self) -> str:
        base_msg = f"Database {self.operation} failed: {self.message}"
        if self.entity:
            base_msg += f" (Entity: {self.entity})"
        if self.context:
            context_str = ", ".join(f"{k}={v}" for k, v in self.context.items())
            base_msg += f" (Context: {context_str})"
        return base_msg


class QuantDataProviderError(QuantServiceError):
    """数据提供者异常"""

    def __init__(
        self,
        message: str,
        provider: str,
        data_type: Optional[str] = None,
        context: Optional[dict[str, Any]] = None,
    ):
        super().__init__(message, context)
        self.provider = provider
        self.data_type = data_type

    def __str__(self) -> str:
        base_msg = f"Data provider '{self.provider}' error: {self.message}"
        if self.data_type:
            base_msg += f" (Data type: {self.data_type})"
        if self.context:
            context_str = ", ".join(f"{k}={v}" for k, v in self.context.items())
            base_msg += f" (Context: {context_str})"
        return base_msg


class QuantCalculationError(QuantServiceError):
    """计算异常"""

    def __init__(
        self,
        message: str,
        calculation_type: str,
        inputs: Optional[dict[str, Any]] = None,
        context: Optional[dict[str, Any]] = None,
    ):
        super().__init__(message, context)
        self.calculation_type = calculation_type
        self.inputs = inputs or {}

    def __str__(self) -> str:
        base_msg = f"Calculation '{self.calculation_type}' failed: {self.message}"
        if self.inputs:
            inputs_str = ", ".join(f"{k}={v}" for k, v in self.inputs.items())
            base_msg += f" (Inputs: {inputs_str})"
        if self.context:
            context_str = ", ".join(f"{k}={v}" for k, v in self.context.items())
            base_msg += f" (Context: {context_str})"
        return base_msg


class QuantValidationError(QuantServiceError):
    """数据验证异常"""

    def __init__(
        self,
        message: str,
        field: Optional[str] = None,
        value: Optional[Any] = None,
        context: Optional[dict[str, Any]] = None,
    ):
        super().__init__(message, context)
        self.field = field
        self.value = value

    def __str__(self) -> str:
        base_msg = f"Validation failed: {self.message}"
        if self.field:
            base_msg += f" (Field: {self.field})"
        if self.value is not None:
            base_msg += f" (Value: {self.value})"
        if self.context:
            context_str = ", ".join(f"{k}={v}" for k, v in self.context.items())
            base_msg += f" (Context: {context_str})"
        return base_msg


class QuantConfigurationError(QuantServiceError):
    """配置异常"""

    def __init__(
        self,
        message: str,
        config_key: Optional[str] = None,
        config_value: Optional[Any] = None,
        context: Optional[dict[str, Any]] = None,
    ):
        super().__init__(message, context)
        self.config_key = config_key
        self.config_value = config_value

    def __str__(self) -> str:
        base_msg = f"Configuration error: {self.message}"
        if self.config_key:
            base_msg += f" (Key: {self.config_key})"
        if self.config_value is not None:
            base_msg += f" (Value: {self.config_value})"
        if self.context:
            context_str = ", ".join(f"{k}={v}" for k, v in self.context.items())
            base_msg += f" (Context: {context_str})"
        return base_msg


class QuantSignalError(QuantServiceError):
    """量化信号异常"""

    def __init__(
        self,
        message: str,
        signal_id: Optional[str] = None,
        signal_type: Optional[str] = None,
        context: Optional[dict[str, Any]] = None,
    ):
        super().__init__(message, context)
        self.signal_id = signal_id
        self.signal_type = signal_type

    def __str__(self) -> str:
        base_msg = f"Quant signal error: {self.message}"
        if self.signal_id:
            base_msg += f" (Signal ID: {self.signal_id})"
        if self.signal_type:
            base_msg += f" (Signal Type: {self.signal_type})"
        if self.context:
            context_str = ", ".join(f"{k}={v}" for k, v in self.context.items())
            base_msg += f" (Context: {context_str})"
        return base_msg


class QuantAnomalyDetectionError(QuantServiceError):
    """异常检测异常"""

    def __init__(
        self,
        message: str,
        stock_code: Optional[str] = None,
        anomaly_type: Optional[str] = None,
        context: Optional[dict[str, Any]] = None,
    ):
        super().__init__(message, context)
        self.stock_code = stock_code
        self.anomaly_type = anomaly_type

    def __str__(self) -> str:
        base_msg = f"Anomaly detection error: {self.message}"
        if self.stock_code:
            base_msg += f" (Stock Code: {self.stock_code})"
        if self.anomaly_type:
            base_msg += f" (Anomaly Type: {self.anomaly_type})"
        if self.context:
            context_str = ", ".join(f"{k}={v}" for k, v in self.context.items())
            base_msg += f" (Context: {context_str})"
        return base_msg

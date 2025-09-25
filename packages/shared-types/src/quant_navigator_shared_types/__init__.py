"""
共享类型库入口文件
量化导航仪项目的类型契约宪法

这是所有模块关于业务数据结构的单一事实来源
任何模块都必须通过此文件导入共享类型定义
"""

from .common import ApiResponse, PaginatedResponse, DatabaseEntity, ConfigItem
from .events import (
    AnomalyEvent,
    AttributionResult,
    ProcessedEvent,
    AnomalyType,
    SeverityLevel,
    EventType,
    EventStatus,
)
from .quant_signals import (
    QuantSignal,
    SignalType,
    SignalStatus,
)
from .workflow import (
    WorkflowConfig,
    WorkflowExecutionResult,
    AttributionEngineConfig,
)
from .reports import (
    GeneratedReport,
    ReportType,
    ReportStatus,
    ReportSection,
)

__all__ = [
    # Common types
    "ApiResponse",
    "PaginatedResponse", 
    "DatabaseEntity",
    "ConfigItem",
    # Event types
    "AnomalyEvent",
    "AttributionResult",
    "ProcessedEvent",
    "AnomalyType",
    "SeverityLevel",
    "EventType",
    "EventStatus",
    # Quant signal types
    "QuantSignal",
    "SignalType",
    "SignalStatus",
    # Workflow types
    "WorkflowConfig",
    "WorkflowExecutionResult",
    "AttributionEngineConfig",
    # Report types
    "GeneratedReport",
    "ReportType",
    "ReportStatus",
    "ReportSection",
]

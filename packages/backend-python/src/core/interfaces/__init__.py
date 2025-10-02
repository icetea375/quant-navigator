"""
核心接口模块 - 定义系统核心抽象接口
遵循YAGNI平衡法则:这些是"必要的架构抽象",不是"不必要的复杂功能"
"""

from .data_source_interface import (
    DataSourceAuthenticationError,
    DataSourceError,
    DataSourceInterface,
    DataSourceRateLimitError,
    DataSourceTimeoutError,
)
from .llm_provider_interface import (
    LlmModelType,
    LlmProviderAuthenticationError,
    LlmProviderError,
    LlmProviderInterface,
    LlmProviderModelNotFoundError,
    LlmProviderRateLimitError,
    LlmProviderTimeoutError,
)

__all__ = [
    "DataSourceAuthenticationError",
    "DataSourceError",
    # 数据源接口
    "DataSourceInterface",
    "DataSourceRateLimitError",
    "DataSourceTimeoutError",
    "LlmModelType",
    "LlmProviderAuthenticationError",
    "LlmProviderError",
    # LLM提供商接口
    "LlmProviderInterface",
    "LlmProviderModelNotFoundError",
    "LlmProviderRateLimitError",
    "LlmProviderTimeoutError",
]

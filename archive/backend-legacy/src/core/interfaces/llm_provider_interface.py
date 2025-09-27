"""
LLM提供商抽象接口 - 定义所有LLM提供商必须实现的标准接口
遵循YAGNI平衡法则:这是"必要的架构抽象",不是"不必要的复杂功能"
"""

from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Optional


class LlmModelType(str, Enum):
    """LLM模型类型枚举"""

    TEXT_GENERATION = "text_generation"
    CHAT_COMPLETION = "chat_completion"
    EMBEDDING = "embedding"
    IMAGE_GENERATION = "image_generation"


class LlmProviderInterface(ABC):
    """
    LLM提供商抽象接口 - 所有LLM提供商实现必须遵循此接口

    这是"骨骼"而非"赘肉":
    - 防止锁定依赖:未来可以轻松切换LLM提供商
    - 统一调用方式:所有业务逻辑依赖统一接口
    - 支持测试:可以轻松创建Mock LLM提供商
    """

    @abstractmethod
    async def generate_text(
        self,
        prompt: str,
        model: str,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        **kwargs,
    ) -> str:
        """
        生成文本内容

        Args:
            prompt: 输入提示词
            model: 模型名称
            max_tokens: 最大生成token数
            temperature: 温度参数
            **kwargs: 其他模型参数

        Returns:
            生成的文本内容
        """
        pass

    @abstractmethod
    async def chat_completion(
        self,
        messages: list[dict[str, str]],
        model: str,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        **kwargs,
    ) -> str:
        """
        聊天完成接口

        Args:
            messages: 消息列表,格式为 [{"role": "user", "content": "..."}]
            model: 模型名称
            max_tokens: 最大生成token数
            temperature: 温度参数
            **kwargs: 其他模型参数

        Returns:
            生成的回复内容
        """
        pass

    @abstractmethod
    async def generate_embeddings(
        self, texts: list[str], model: str, **kwargs
    ) -> list[list[float]]:
        """
        生成文本嵌入向量

        Args:
            texts: 文本列表
            model: 嵌入模型名称
            **kwargs: 其他模型参数

        Returns:
            嵌入向量列表
        """
        pass

    @abstractmethod
    async def analyze_sentiment(
        self, text: str, model: str, **kwargs
    ) -> dict[str, Any]:
        """
        情感分析

        Args:
            text: 待分析文本
            model: 模型名称
            **kwargs: 其他模型参数

        Returns:
            情感分析结果,包含:
            - sentiment: 情感倾向 ('positive', 'negative', 'neutral')
            - score: 情感分数 (0-1)
            - confidence: 置信度 (0-1)
            - reasoning: 分析推理过程
        """
        pass

    @abstractmethod
    async def analyze_fact(
        self, text: str, context: Optional[str] = None, model: str = "default", **kwargs
    ) -> dict[str, Any]:
        """
        事实分析

        Args:
            text: 待分析文本
            context: 上下文信息
            model: 模型名称
            **kwargs: 其他模型参数

        Returns:
            事实分析结果,包含:
            - analysis: 分析结果
            - confidence: 置信度 (0-1)
            - reasoning: 分析推理过程
            - fact_check: 事实核查结果
        """
        pass

    @abstractmethod
    async def batch_process(
        self, requests: list[dict[str, Any]], model: str, **kwargs
    ) -> list[dict[str, Any]]:
        """
        批量处理请求

        Args:
            requests: 请求列表,每个请求包含处理参数
            model: 模型名称
            **kwargs: 其他模型参数

        Returns:
            处理结果列表
        """
        pass

    @abstractmethod
    def get_available_models(self) -> list[str]:
        """
        获取可用的模型列表

        Returns:
            可用模型名称列表
        """
        pass

    @abstractmethod
    def get_model_info(self, model: str) -> dict[str, Any]:
        """
        获取模型信息

        Args:
            model: 模型名称

        Returns:
            模型信息字典,包含:
            - model_name: 模型名称
            - model_type: 模型类型
            - max_tokens: 最大token数
            - supported_features: 支持的功能列表
            - cost_per_token: 每token成本
        """
        pass

    @abstractmethod
    async def health_check(self) -> dict[str, Any]:
        """
        LLM提供商健康检查

        Returns:
            健康状态字典,包含:
            - status: 状态 ('healthy', 'unhealthy', 'degraded')
            - response_time: 响应时间 (毫秒)
            - last_success: 最后成功时间
            - error_count: 错误次数
            - rate_limit_remaining: 剩余请求次数
            - available_models: 可用模型数量
        """
        pass


class LlmProviderError(Exception):
    """LLM提供商相关异常"""

    pass


class LlmProviderTimeoutError(LlmProviderError):
    """LLM提供商超时异常"""

    pass


class LlmProviderRateLimitError(LlmProviderError):
    """LLM提供商限流异常"""

    pass


class LlmProviderAuthenticationError(LlmProviderError):
    """LLM提供商认证异常"""

    pass


class LlmProviderModelNotFoundError(LlmProviderError):
    """LLM提供商模型不存在异常"""

    pass

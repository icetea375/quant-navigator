"""
Qwen LLM提供商实现 - 实现LlmProviderInterface接口
遵循YAGNI平衡法则:这是"具体的实现",不是"不必要的复杂功能"
"""

import logging
from datetime import datetime
from typing import Any, Optional

import httpx

import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent.parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from config.settings import settings
from src.core.interfaces import (
    LlmProviderAuthenticationError,
    LlmProviderError,
    LlmProviderInterface,
    LlmProviderRateLimitError,
    LlmProviderTimeoutError,
)


class QwenProvider(LlmProviderInterface):
    """
    Qwen LLM提供商实现

    实现LlmProviderInterface接口,提供标准化的LLM调用
    未来可以轻松切换到其他LLM提供商(如OpenAI,豆包等)
    """

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None, client: Optional[httpx.AsyncClient] = None):
        """
        初始化Qwen提供商

        Args:
            api_key: Qwen API密钥,如果为None则从配置中读取
            base_url: API基础URL,如果为None则使用默认值
            client: HTTP客户端,如果为None则创建默认客户端
        """
        self.logger = logging.getLogger(__name__)
        self.api_key = api_key or settings.QWEN_API_KEY
        self.base_url = base_url or "https://dashscope.aliyuncs.com/api/v1"
        self.client = client or httpx.AsyncClient(timeout=30.0)
        self._call_count = 0
        self._error_count = 0

    async def generate_text(
        self,
        prompt: str,
        model: str = "qwen-plus",
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        **kwargs
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
        try:
            self._call_count += 1

            # 构建请求参数
            request_data = {
                "model": model,
                "input": {
                    "messages": [{"role": "user", "content": prompt}]
                },
                "parameters": {}
            }

            if max_tokens:
                request_data["parameters"]["max_tokens"] = max_tokens
            if temperature:
                request_data["parameters"]["temperature"] = temperature

            # 添加其他参数
            request_data["parameters"].update(kwargs)

            # 发送请求
            response = await self.client.post(
                f"{self.base_url}/services/aigc/text-generation/generation",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json=request_data
            )

            if response.status_code == 401:
                raise LlmProviderAuthenticationError("Qwen API认证失败")
            elif response.status_code == 429:
                raise LlmProviderRateLimitError("Qwen API请求频率超限")
            elif response.status_code != 200:
                raise LlmProviderError(f"Qwen API请求失败: {response.status_code}")

            result = response.json()

            # ✅ 关键：用契约验证响应结构
            from src.core.contract_validator import contract_validator
            if not contract_validator.validate_response(result, "chat_completion"):
                raise LlmProviderError("Qwen API响应不符合契约定义")
            
            # 提取生成的文本
            return result["output"]["text"]

        except httpx.TimeoutException as e:
            self._error_count += 1
            raise LlmProviderTimeoutError("Qwen API请求超时") from e
        except Exception as e:
            self._error_count += 1
            if isinstance(e, (LlmProviderError, LlmProviderTimeoutError, LlmProviderRateLimitError, LlmProviderAuthenticationError)):
                raise
            else:
                raise LlmProviderError(f"Qwen API调用失败: {e!s}") from e

    async def chat_completion(
        self,
        messages: list[dict[str, str]],
        model: str = "qwen-plus",
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        **kwargs
    ) -> str:
        """
        聊天完成接口

        Args:
            messages: 消息列表
            model: 模型名称
            max_tokens: 最大生成token数
            temperature: 温度参数
            **kwargs: 其他模型参数

        Returns:
            生成的回复内容
        """
        try:
            self._call_count += 1

            # 构建请求参数
            request_data = {
                "model": model,
                "input": {
                    "messages": messages
                },
                "parameters": {}
            }

            if max_tokens:
                request_data["parameters"]["max_tokens"] = max_tokens
            if temperature:
                request_data["parameters"]["temperature"] = temperature

            # 添加其他参数
            request_data["parameters"].update(kwargs)

            # 发送请求
            response = await self.client.post(
                f"{self.base_url}/services/aigc/text-generation/generation",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json=request_data
            )

            if response.status_code == 401:
                raise LlmProviderAuthenticationError("Qwen API认证失败")
            elif response.status_code == 429:
                raise LlmProviderRateLimitError("Qwen API请求频率超限")
            elif response.status_code != 200:
                raise LlmProviderError(f"Qwen API请求失败: {response.status_code}")

            result = response.json()

            # ✅ 关键：用契约验证响应结构
            from src.core.contract_validator import contract_validator
            if not contract_validator.validate_response(result, "chat_completion"):
                raise LlmProviderError("Qwen API响应不符合契约定义")
            
            # 提取生成的文本
            return result["output"]["text"]

        except httpx.TimeoutException as e:
            self._error_count += 1
            raise LlmProviderTimeoutError("Qwen API请求超时") from e
        except Exception as e:
            self._error_count += 1
            if isinstance(e, (LlmProviderError, LlmProviderTimeoutError, LlmProviderRateLimitError, LlmProviderAuthenticationError)):
                raise
            else:
                raise LlmProviderError(f"Qwen API调用失败: {e!s}") from e

    async def generate_embeddings(
        self,
        texts: list[str],
        model: str = "text-embedding-v1",
        **kwargs
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
        try:
            self._call_count += 1

            # 构建请求参数
            request_data = {
                "model": model,
                "input": {
                    "texts": texts
                },
                "parameters": kwargs
            }

            # 发送请求
            response = await self.client.post(
                f"{self.base_url}/services/embeddings/text-embedding/text-embedding",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json=request_data
            )

            if response.status_code == 401:
                raise LlmProviderAuthenticationError("Qwen API认证失败")
            elif response.status_code == 429:
                raise LlmProviderRateLimitError("Qwen API请求频率超限")
            elif response.status_code != 200:
                raise LlmProviderError(f"Qwen API请求失败: {response.status_code}")

            result = response.json()

            # 提取嵌入向量
            if "output" in result and "embeddings" in result["output"]:
                return result["output"]["embeddings"]
            else:
                raise LlmProviderError("Qwen API响应格式错误")

        except httpx.TimeoutException as e:
            self._error_count += 1
            raise LlmProviderTimeoutError("Qwen API请求超时") from e
        except Exception as e:
            self._error_count += 1
            if isinstance(e, (LlmProviderError, LlmProviderTimeoutError, LlmProviderRateLimitError, LlmProviderAuthenticationError)):
                raise
            else:
                raise LlmProviderError(f"Qwen API调用失败: {e!s}") from e

    async def analyze_sentiment(
        self,
        text: str,
        model: str = "qwen-plus",
        **kwargs
    ) -> dict[str, Any]:
        """
        情感分析

        Args:
            text: 待分析文本
            model: 模型名称
            **kwargs: 其他模型参数

        Returns:
            情感分析结果
        """
        try:
            # 构建情感分析提示词
            prompt = f"""
            请分析以下文本的情感倾向,并给出分析结果。

            文本内容:{text}

            请以JSON格式返回结果,包含以下字段:
            - sentiment: 情感倾向 ('positive', 'negative', 'neutral')
            - score: 情感分数 (0-1之间的小数)
            - confidence: 置信度 (0-1之间的小数)
            - reasoning: 分析推理过程
            """

            # 调用文本生成接口
            response_text = await self.generate_text(prompt, model, **kwargs)

            # 解析响应(这里简化处理,实际应该更robust)
            import json
            try:
                result = json.loads(response_text)
                return result
            except json.JSONDecodeError:
                # 如果解析失败,返回默认结果
                return {
                    "sentiment": "neutral",
                    "score": 0.5,
                    "confidence": 0.5,
                    "reasoning": "无法解析模型响应"
                }

        except Exception as e:
            self._error_count += 1
            raise LlmProviderError(f"情感分析失败: {e!s}") from e

    async def analyze_fact(
        self,
        text: str,
        context: Optional[str] = None,
        model: str = "qwen-plus",
        **kwargs
    ) -> dict[str, Any]:
        """
        事实分析

        Args:
            text: 待分析文本
            context: 上下文信息
            model: 模型名称
            **kwargs: 其他模型参数

        Returns:
            事实分析结果
        """
        try:
            # 构建事实分析提示词
            prompt = f"""
            请对以下文本进行事实分析,并给出分析结果。

            文本内容:{text}
            """

            if context:
                prompt += f"\n\n上下文信息:{context}"

            prompt += """

            请以JSON格式返回结果,包含以下字段:
            - analysis: 分析结果
            - confidence: 置信度 (0-1之间的小数)
            - reasoning: 分析推理过程
            - fact_check: 事实核查结果
            """

            # 调用文本生成接口
            response_text = await self.generate_text(prompt, model, **kwargs)

            # 解析响应(这里简化处理,实际应该更robust)
            import json
            try:
                result = json.loads(response_text)
                return result
            except json.JSONDecodeError:
                # 如果解析失败,返回默认结果
                return {
                    "analysis": "无法进行事实分析",
                    "confidence": 0.0,
                    "reasoning": "无法解析模型响应",
                    "fact_check": "无法验证"
                }

        except Exception as e:
            self._error_count += 1
            raise LlmProviderError(f"事实分析失败: {e!s}") from e

    async def batch_process(
        self,
        requests: list[dict[str, Any]],
        model: str = "qwen-plus",
        **kwargs
    ) -> list[dict[str, Any]]:
        """
        批量处理请求

        Args:
            requests: 请求列表
            model: 模型名称
            **kwargs: 其他模型参数

        Returns:
            处理结果列表
        """
        try:
            results = []
            for request in requests:
                # 根据请求类型调用相应方法
                if request.get("type") == "text_generation":
                    result = await self.generate_text(
                        request["prompt"],
                        model,
                        **request.get("params", {})
                    )
                elif request.get("type") == "chat_completion":
                    result = await self.chat_completion(
                        request["messages"],
                        model,
                        **request.get("params", {})
                    )
                elif request.get("type") == "sentiment_analysis":
                    result = await self.analyze_sentiment(
                        request["text"],
                        model,
                        **request.get("params", {})
                    )
                elif request.get("type") == "fact_analysis":
                    result = await self.analyze_fact(
                        request["text"],
                        request.get("context"),
                        model,
                        **request.get("params", {})
                    )
                else:
                    result = {"error": f"未知的请求类型: {request.get('type')}"}

                results.append({
                    "request_id": request.get("id"),
                    "result": result,
                    "status": "success"
                })

            return results

        except Exception as e:
            self._error_count += 1
            raise LlmProviderError(f"批量处理失败: {e!s}") from e

    def get_available_models(self) -> list[str]:
        """
        获取可用的模型列表

        Returns:
            可用模型名称列表
        """
        return [
            "qwen-plus",
            "qwen-turbo",
            "qwen-max",
            "text-embedding-v1",
            "text-embedding-v2"
        ]

    def get_model_info(self, model: str) -> dict[str, Any]:
        """
        获取模型信息

        Args:
            model: 模型名称

        Returns:
            模型信息字典
        """
        model_info = {
            "qwen-plus": {
                "model_name": "qwen-plus",
                "model_type": "chat_completion",
                "max_tokens": 8192,
                "supported_features": ["text_generation", "chat_completion", "sentiment_analysis", "fact_analysis"],
                "cost_per_token": 0.0001
            },
            "qwen-turbo": {
                "model_name": "qwen-turbo",
                "model_type": "chat_completion",
                "max_tokens": 4096,
                "supported_features": ["text_generation", "chat_completion"],
                "cost_per_token": 0.00005
            },
            "qwen-max": {
                "model_name": "qwen-max",
                "model_type": "chat_completion",
                "max_tokens": 16384,
                "supported_features": ["text_generation", "chat_completion", "sentiment_analysis", "fact_analysis"],
                "cost_per_token": 0.0002
            },
            "text-embedding-v1": {
                "model_name": "text-embedding-v1",
                "model_type": "embedding",
                "max_tokens": 2048,
                "supported_features": ["text_embedding"],
                "cost_per_token": 0.00001
            },
            "text-embedding-v2": {
                "model_name": "text-embedding-v2",
                "model_type": "embedding",
                "max_tokens": 2048,
                "supported_features": ["text_embedding"],
                "cost_per_token": 0.00001
            }
        }

        return model_info.get(model, {
            "model_name": model,
            "model_type": "unknown",
            "max_tokens": 0,
            "supported_features": [],
            "cost_per_token": 0
        })

    async def health_check(self) -> dict[str, Any]:
        """
        LLM提供商健康检查

        Returns:
            健康状态字典
        """
        try:
            start_time = datetime.now()

            # 测试API连接
            await self.generate_text("测试", "qwen-plus", max_tokens=10)

            end_time = datetime.now()
            response_time = (end_time - start_time).total_seconds() * 1000

            return {
                "status": "healthy",
                "response_time": response_time,
                "last_success": end_time.isoformat(),
                "error_count": self._error_count,
                "rate_limit_remaining": 999,  # Qwen的限流信息需要额外获取
                "available_models": len(self.get_available_models())
            }

        except Exception as e:
            self.logger.error(f"健康检查失败: {e!s}")
            return {
                "status": "unhealthy",
                "response_time": -1,
                "last_success": None,
                "error_count": self._error_count,
                "rate_limit_remaining": 0,
                "available_models": 0
            }

    async def close(self):
        """关闭HTTP客户端"""
        await self.client.aclose()

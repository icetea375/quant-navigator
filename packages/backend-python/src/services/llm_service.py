"""
LLM服务 - 遵循TDD原则实现,使用抽象接口遵循YAGNI平衡法则
"""

import asyncio
import logging
from typing import Any, Optional

from src.core.interfaces import LlmProviderInterface
from src.schemas.arbitration import AnalysisResult, SentimentAnalysis


class LLMService:
    """
    LLM服务类 - 统一管理所有LLM API调用

    遵循YAGNI平衡法则:
    - 依赖抽象接口,不依赖具体实现
    - 未来可以轻松切换LLM提供商
    - 保持代码的灵活性和可测试性
    """

    def __init__(self, llm_provider: Optional[LlmProviderInterface] = None):
        """
        初始化LLM服务

        Args:
            llm_provider: LLM提供商实例,如果为None则使用默认的Qwen提供商
        """
        self.logger = logging.getLogger(__name__)
        self._call_count = 0
        self._error_count = 0

        # 依赖注入:使用抽象接口,不依赖具体实现
        if llm_provider is None:
            from src.services.llm_providers import QwenProvider

            self.llm_provider = QwenProvider()
        else:
            self.llm_provider = llm_provider

    def get_health_status(self) -> dict[str, Any]:
        """简化的健康检查"""
        return {
            "status": "healthy",
            "call_count": self._call_count,
            "error_count": self._error_count,
            "error_rate": self._error_count / max(self._call_count, 1),
        }

    async def analyze_fact(self, input_data: dict[str, Any]) -> AnalysisResult:
        """
        使用LLM提供商进行事实分析

        Args:
            input_data: 包含股票代码,新闻内容,市场数据等

        Returns:
            AnalysisResult: 分析结果
        """
        self._call_count += 1
        try:
            # 构建分析提示词
            stock_code = input_data.get("stock_code", "未知")
            news_content = input_data.get("news_content", "")
            context = input_data.get("context", "")

            prompt = f"""
            请对以下股票信息进行事实分析:

            股票代码:{stock_code}
            新闻内容:{news_content}
            """

            if context:
                prompt += f"\n上下文信息:{context}"

            prompt += """

            请以JSON格式返回分析结果,包含以下字段:
            - analysis: 分析结果
            - confidence: 置信度 (0-1之间的小数)
            - reasoning: 分析推理过程
            """

            # 使用抽象接口调用LLM提供商
            response_text = await self.llm_provider.generate_text(
                prompt=prompt, model="qwen-plus", max_tokens=1000, temperature=0.3
            )

            # 解析响应(这里简化处理,实际应该更robust)
            import json

            try:
                result = json.loads(response_text)
                return AnalysisResult(
                    analysis=result.get("analysis", "无法进行分析"),
                    confidence=result.get("confidence", 0.5),
                    reasoning=result.get("reasoning", "无法获取推理过程"),
                )
            except json.JSONDecodeError:
                # 如果解析失败,返回默认结果
                return AnalysisResult(
                    analysis=f"基于{stock_code}的基本面分析",
                    confidence=0.6,
                    reasoning="无法解析模型响应,使用默认分析",
                )

        except Exception as e:
            self._error_count += 1
            self.logger.error(f"事实分析失败: {e!s}")
            raise Exception(f"事实分析失败: {e!s}") from e

    async def analyze_sentiment(self, input_data: dict[str, Any]) -> SentimentAnalysis:
        """
        使用LLM提供商进行情感分析

        Args:
            input_data: 包含股票代码,新闻内容,社交媒体数据等

        Returns:
            SentimentAnalysis: 情感分析结果
        """
        self._call_count += 1
        try:
            # 构建情感分析提示词
            stock_code = input_data.get("stock_code", "未知")
            news_content = input_data.get("news_content", "")

            prompt = f"""
            请对以下股票信息进行情感分析:

            股票代码:{stock_code}
            新闻内容:{news_content}

            请以JSON格式返回分析结果,包含以下字段:
            - sentiment: 情感倾向 ('positive', 'negative', 'neutral')
            - score: 情感分数 (0-1之间的小数)
            - reasoning: 分析推理过程
            """

            # 使用抽象接口调用LLM提供商
            response_text = await self.llm_provider.generate_text(
                prompt=prompt, model="qwen-plus", max_tokens=500, temperature=0.3
            )

            # 解析响应(这里简化处理,实际应该更robust)
            import json

            try:
                result = json.loads(response_text)
                return SentimentAnalysis(
                    sentiment=result.get("sentiment", "neutral"),
                    score=result.get("score", 0.5),
                    reasoning=result.get("reasoning", "无法获取推理过程"),
                )
            except json.JSONDecodeError:
                # 如果解析失败,使用简单的情感分析逻辑
                positive_words = ["上涨", "利好", "增长", "盈利", "突破"]
                negative_words = ["下跌", "利空", "亏损", "风险", "危机"]

                positive_count = sum(
                    1 for word in positive_words if word in news_content
                )
                negative_count = sum(
                    1 for word in negative_words if word in news_content
                )

                if positive_count > negative_count:
                    sentiment = "positive"
                    score = min(0.9, 0.5 + positive_count * 0.1)
                elif negative_count > positive_count:
                    sentiment = "negative"
                    score = max(0.1, 0.5 - negative_count * 0.1)
                else:
                    sentiment = "neutral"
                    score = 0.5

                reasoning = f"基于关键词的情感分析,{stock_code}市场情绪{sentiment}"

                return SentimentAnalysis(
                    sentiment=sentiment, score=score, reasoning=reasoning
                )

        except Exception as e:
            self._error_count += 1
            self.logger.error(f"情感分析失败: {e!s}")
            raise Exception(f"情感分析失败: {e!s}") from e

    async def analyze_with_retry(
        self, analysis_func, input_data: dict[str, Any], max_retries: int = 3
    ) -> Any:
        """
        带重试机制的分析方法

        Args:
            analysis_func: 分析函数
            input_data: 输入数据
            max_retries: 最大重试次数

        Returns:
            分析结果
        """
        last_exception = None

        for attempt in range(max_retries):
            try:
                return await analysis_func(input_data)
            except Exception as e:
                last_exception = e
                self.logger.warning(f"分析尝试 {attempt + 1} 失败: {e!s}")

                if attempt < max_retries - 1:
                    await asyncio.sleep(2**attempt)  # 指数退避
                else:
                    self.logger.error(f"分析失败,已重试 {max_retries} 次")
                    raise last_exception from last_exception

        raise last_exception

    async def batch_analyze_facts(
        self, batch_data: list[dict[str, Any]]
    ) -> list[AnalysisResult]:
        """
        批量事实分析

        Args:
            batch_data: 批量输入数据

        Returns:
            批量分析结果
        """
        tasks = [self.analyze_fact(data) for data in batch_data]
        return await asyncio.gather(*tasks, return_exceptions=True)

    async def batch_analyze_sentiments(
        self, batch_data: list[dict[str, Any]]
    ) -> list[SentimentAnalysis]:
        """
        批量情感分析

        Args:
            batch_data: 批量输入数据

        Returns:
            批量情感分析结果
        """
        tasks = [self.analyze_sentiment(data) for data in batch_data]
        return await asyncio.gather(*tasks, return_exceptions=True)

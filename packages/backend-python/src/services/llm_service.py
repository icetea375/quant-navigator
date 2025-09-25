"""
LLM服务 - 遵循TDD原则实现
"""

import asyncio
import logging
from typing import Dict, Any, Optional
from src.core.config import settings
from src.schemas.arbitration import AnalysisResult, SentimentAnalysis


class LLMService:
    """LLM服务类 - 统一管理所有LLM API调用"""
    
    def __init__(self):
        """初始化LLM服务"""
        self.logger = logging.getLogger(__name__)
        self.qwen_api_key = settings.QWEN_API_KEY
        self.doubao_api_key = settings.DOUBAO_API_KEY
        self.openai_api_key = settings.OPENAI_API_KEY
    
    async def analyze_fact(self, input_data: Dict[str, Any]) -> AnalysisResult:
        """
        使用Qwen进行事实分析
        
        Args:
            input_data: 包含股票代码、新闻内容、市场数据等
            
        Returns:
            AnalysisResult: 分析结果
        """
        try:
            # 模拟Qwen API调用
            await asyncio.sleep(0.1)  # 模拟网络延迟
            
            # 基于输入数据生成分析结果
            stock_code = input_data.get("stock_code", "未知")
            news_content = input_data.get("news_content", "")
            
            analysis = f"Qwen分析：{stock_code} 基于新闻内容'{news_content[:50]}...'的基本面分析"
            confidence = 0.8 if len(news_content) > 100 else 0.6
            reasoning = "基于财务数据和市场表现的综合分析"
            
            return AnalysisResult(
                analysis=analysis,
                confidence=confidence,
                reasoning=reasoning
            )
            
        except Exception as e:
            self.logger.error(f"Qwen事实分析失败: {str(e)}")
            raise Exception(f"Qwen事实分析失败: {str(e)}")
    
    async def analyze_sentiment(self, input_data: Dict[str, Any]) -> SentimentAnalysis:
        """
        使用豆包进行情感分析
        
        Args:
            input_data: 包含股票代码、新闻内容、社交媒体数据等
            
        Returns:
            SentimentAnalysis: 情感分析结果
        """
        try:
            # 模拟豆包API调用
            await asyncio.sleep(0.1)  # 模拟网络延迟
            
            # 基于输入数据生成情感分析结果
            stock_code = input_data.get("stock_code", "未知")
            news_content = input_data.get("news_content", "")
            
            # 简单的情感分析逻辑
            positive_words = ["上涨", "利好", "增长", "盈利", "突破"]
            negative_words = ["下跌", "利空", "亏损", "风险", "危机"]
            
            positive_count = sum(1 for word in positive_words if word in news_content)
            negative_count = sum(1 for word in negative_words if word in news_content)
            
            if positive_count > negative_count:
                sentiment = "positive"
                score = min(0.9, 0.5 + positive_count * 0.1)
            elif negative_count > positive_count:
                sentiment = "negative"
                score = min(0.9, 0.5 + negative_count * 0.1)
            else:
                sentiment = "neutral"
                score = 0.5
            
            reasoning = f"基于新闻内容的情感分析，{stock_code}市场情绪{sentiment}"
            
            return SentimentAnalysis(
                sentiment=sentiment,
                score=score,
                reasoning=reasoning
            )
            
        except Exception as e:
            self.logger.error(f"豆包情感分析失败: {str(e)}")
            raise Exception(f"豆包情感分析失败: {str(e)}")
    
    async def analyze_with_retry(self, analysis_func, input_data: Dict[str, Any], max_retries: int = 3) -> Any:
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
                self.logger.warning(f"分析尝试 {attempt + 1} 失败: {str(e)}")
                
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)  # 指数退避
                else:
                    self.logger.error(f"分析失败，已重试 {max_retries} 次")
                    raise last_exception
        
        raise last_exception
    
    async def batch_analyze_facts(self, batch_data: list[Dict[str, Any]]) -> list[AnalysisResult]:
        """
        批量事实分析
        
        Args:
            batch_data: 批量输入数据
            
        Returns:
            批量分析结果
        """
        tasks = [self.analyze_fact(data) for data in batch_data]
        return await asyncio.gather(*tasks, return_exceptions=True)
    
    async def batch_analyze_sentiments(self, batch_data: list[Dict[str, Any]]) -> list[SentimentAnalysis]:
        """
        批量情感分析
        
        Args:
            batch_data: 批量输入数据
            
        Returns:
            批量情感分析结果
        """
        tasks = [self.analyze_sentiment(data) for data in batch_data]
        return await asyncio.gather(*tasks, return_exceptions=True)

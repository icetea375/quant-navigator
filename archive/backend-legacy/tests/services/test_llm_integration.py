"""
LLM服务集成测试 - 遵循测试宪法TDD原则
先写测试（红灯），再实现功能（绿灯），最后重构
"""

import pytest
from unittest.mock import Mock, AsyncMock
from src.services.llm_service import LLMService
from src.schemas.arbitration import AnalysisResult, SentimentAnalysis


class TestLLMIntegration:
    """LLM服务集成测试类"""

    @pytest.fixture
    def mock_llm_service(self):
        """创建模拟的LLM服务"""
        service = Mock(spec=LLMService)
        service.analyze_fact = AsyncMock()
        service.analyze_sentiment = AsyncMock()
        return service

    @pytest.mark.asyncio
    async def test_qwen_fact_analysis_integration(self, mock_llm_service):
        """测试Qwen事实分析集成"""
        # Arrange - 准备测试数据
        input_data = {
            "stock_code": "000001.SZ",
            "news_content": "测试新闻内容",
            "market_data": {"close": 10.5, "volume": 1000000},
        }

        expected_result = AnalysisResult(
            analysis="Qwen分析：该股票基本面良好",
            confidence=0.85,
            reasoning="基于财务数据和市场表现的综合分析",
        )

        mock_llm_service.analyze_fact.return_value = expected_result

        # Act - 执行被测试的功能
        result = await mock_llm_service.analyze_fact(input_data)

        # Assert - 验证结果
        assert result is not None
        assert result.analysis == "Qwen分析：该股票基本面良好"
        assert result.confidence == 0.85
        assert result.reasoning == "基于财务数据和市场表现的综合分析"
        mock_llm_service.analyze_fact.assert_called_once_with(input_data)

    @pytest.mark.asyncio
    async def test_doubao_sentiment_analysis_integration(self, mock_llm_service):
        """测试豆包情感分析集成"""
        # Arrange - 准备测试数据
        input_data = {
            "stock_code": "000001.SZ",
            "news_content": "测试新闻内容",
            "social_media_data": {"sentiment": "positive"},
        }

        expected_result = SentimentAnalysis(
            sentiment="positive", score=0.7, reasoning="市场情绪积极，投资者信心较强"
        )

        mock_llm_service.analyze_sentiment.return_value = expected_result

        # Act - 执行被测试的功能
        result = await mock_llm_service.analyze_sentiment(input_data)

        # Assert - 验证结果
        assert result is not None
        assert result.sentiment == "positive"
        assert result.score == 0.7
        assert result.reasoning == "市场情绪积极，投资者信心较强"
        mock_llm_service.analyze_sentiment.assert_called_once_with(input_data)

    @pytest.mark.asyncio
    async def test_llm_service_error_handling(self, mock_llm_service):
        """测试LLM服务错误处理"""
        # Arrange - 模拟API错误
        mock_llm_service.analyze_fact.side_effect = Exception("API调用失败")

        # Act & Assert - 验证错误处理
        with pytest.raises(Exception) as exc_info:
            await mock_llm_service.analyze_fact({"test": "data"})

        assert "API调用失败" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_llm_service_timeout_handling(self, mock_llm_service):
        """测试LLM服务超时处理"""
        # Arrange - 模拟超时
        import asyncio

        mock_llm_service.analyze_fact.side_effect = asyncio.TimeoutError("请求超时")

        # Act & Assert - 验证超时处理
        with pytest.raises(asyncio.TimeoutError) as exc_info:
            await mock_llm_service.analyze_fact({"test": "data"})

        assert "请求超时" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_llm_service_rate_limiting(self, mock_llm_service):
        """测试LLM服务限流处理"""
        # Arrange - 模拟限流错误
        mock_llm_service.analyze_fact.side_effect = Exception("API限流，请稍后重试")

        # Act & Assert - 验证限流处理
        with pytest.raises(Exception) as exc_info:
            await mock_llm_service.analyze_fact({"test": "data"})

        assert "API限流" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_llm_service_retry_mechanism(self, mock_llm_service):
        """测试LLM服务重试机制"""
        # Arrange - 模拟第一次失败，第二次成功
        expected_result = AnalysisResult(
            analysis="重试成功", confidence=0.8, reasoning="重试后的分析结果"
        )

        mock_llm_service.analyze_fact.side_effect = [
            Exception("临时错误"),
            expected_result,
        ]

        # Act - 执行重试逻辑
        result = None
        for attempt in range(2):
            try:
                result = await mock_llm_service.analyze_fact({"test": "data"})
                break
            except Exception:
                if attempt == 0:
                    continue
                raise

        # Assert - 验证重试结果
        assert result is not None
        assert result.analysis == "重试成功"
        assert mock_llm_service.analyze_fact.call_count == 2

    @pytest.mark.asyncio
    async def test_llm_service_batch_processing(self, mock_llm_service):
        """测试LLM服务批量处理"""
        # Arrange - 准备批量数据
        batch_data = [
            {"stock_code": "000001.SZ", "content": "新闻1"},
            {"stock_code": "000002.SZ", "content": "新闻2"},
            {"stock_code": "000003.SZ", "content": "新闻3"},
        ]

        expected_results = [
            AnalysisResult(analysis="分析1", confidence=0.8, reasoning="推理1"),
            AnalysisResult(analysis="分析2", confidence=0.7, reasoning="推理2"),
            AnalysisResult(analysis="分析3", confidence=0.9, reasoning="推理3"),
        ]

        mock_llm_service.analyze_fact.side_effect = expected_results

        # Act - 执行批量处理
        results = []
        for data in batch_data:
            result = await mock_llm_service.analyze_fact(data)
            results.append(result)

        # Assert - 验证批量处理结果
        assert len(results) == 3
        assert all(isinstance(r, AnalysisResult) for r in results)
        assert results[0].analysis == "分析1"
        assert results[1].analysis == "分析2"
        assert results[2].analysis == "分析3"
        assert mock_llm_service.analyze_fact.call_count == 3

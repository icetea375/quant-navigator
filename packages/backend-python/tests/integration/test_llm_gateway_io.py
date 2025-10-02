"""
LLM_Gateway 外部交互强化集成测试
严格遵循测试宪法:风险驱动,测试金字塔,TDD红-绿-重构循环

测试目标:确保与LLM API的交互100%可靠和健壮,验证后处理校验逻辑
"""

import asyncio
import json
from unittest.mock import AsyncMock, Mock

import pytest

from src.core.interfaces import (
    LlmProviderAuthenticationError,
    LlmProviderError,
    LlmProviderRateLimitError,
    LlmProviderTimeoutError,
)
from src.schemas.arbitration import AnalysisResult, SentimentAnalysis
from src.services.llm_providers.qwen_provider import QwenProvider
from src.services.llm_service import LLMService


class TestLLMGatewayIOIntegration:
    """LLM_Gateway 外部交互集成测试类"""

    @pytest.fixture
    def mock_qwen_provider(self):
        """创建模拟的Qwen提供商"""
        provider = Mock(spec=QwenProvider)
        provider.generate_text = AsyncMock()
        return provider

    @pytest.fixture
    def llm_service(self, mock_qwen_provider):
        """创建LLMService实例"""
        return LLMService(llm_provider=mock_qwen_provider)

    @pytest.mark.asyncio
    async def test_should_handle_valid_json_response(
        self, llm_service, mock_qwen_provider
    ):
        """测试:LLM API返回有效JSON响应的情况"""
        # 模拟LLM API返回有效JSON
        mock_response = {
            "analysis": "基于技术指标分析,该股票呈现上涨趋势",
            "confidence": 0.85,
            "reasoning": "RSI指标显示超卖状态,MACD金叉信号明确",
        }
        mock_qwen_provider.generate_text.return_value = json.dumps(mock_response)

        input_data = {
            "stock_code": "000001.SZ",
            "news_content": "平安银行发布2024年Q1财报,净利润同比增长15%",
            "context": "银行业整体表现良好",
        }

        result = await llm_service.analyze_fact(input_data)

        # 验证结果
        assert isinstance(result, AnalysisResult)
        assert result.analysis == mock_response["analysis"]
        assert result.confidence == mock_response["confidence"]
        assert result.reasoning == mock_response["reasoning"]

        # 验证LLM提供商被正确调用
        mock_qwen_provider.generate_text.assert_called_once()
        call_args = mock_qwen_provider.generate_text.call_args
        assert "000001.SZ" in call_args[1]["prompt"]
        assert "平安银行发布2024年Q1财报" in call_args[1]["prompt"]

    @pytest.mark.asyncio
    async def test_should_handle_truncated_json_response(
        self, llm_service, mock_qwen_provider
    ):
        """测试:LLM API返回被截断的JSON的情况"""
        # 模拟LLM API返回被截断的JSON
        truncated_json = '{"analysis": "基于技术指标分析,该股票呈现上涨趋势", "confidence": 0.85, "reasoning": "RSI指标显示超卖状态,MACD金叉信号明确'
        mock_qwen_provider.generate_text.return_value = truncated_json

        input_data = {
            "stock_code": "000001.SZ",
            "news_content": "平安银行发布2024年Q1财报",
            "context": "银行业整体表现良好",
        }

        result = await llm_service.analyze_fact(input_data)

        # 验证系统能处理截断的JSON,返回默认结果
        assert isinstance(result, AnalysisResult)
        assert "基于000001.SZ的基本面分析" in result.analysis
        assert result.confidence == 0.6
        assert "无法解析模型响应" in result.reasoning

    @pytest.mark.asyncio
    async def test_should_handle_malformed_json_response(
        self, llm_service, mock_qwen_provider
    ):
        """测试:LLM API返回格式错误的JSON的情况"""
        # 模拟LLM API返回格式错误的JSON
        malformed_json = '{"analysis": "基于技术指标分析", "confidence": 0.85, "reasoning": "RSI指标显示超卖状态"'  # 缺少闭合括号
        mock_qwen_provider.generate_text.return_value = malformed_json

        input_data = {
            "stock_code": "000001.SZ",
            "news_content": "平安银行发布2024年Q1财报",
            "context": "银行业整体表现良好",
        }

        result = await llm_service.analyze_fact(input_data)

        # 验证系统能处理格式错误的JSON,返回默认结果
        assert isinstance(result, AnalysisResult)
        assert "基于000001.SZ的基本面分析" in result.analysis
        assert result.confidence == 0.6
        assert "无法解析模型响应" in result.reasoning

    @pytest.mark.asyncio
    async def test_should_handle_low_confidence_response(
        self, llm_service, mock_qwen_provider
    ):
        """测试:LLM API返回低置信度响应的情况"""
        # 模拟LLM API返回低置信度响应
        low_confidence_response = {
            "analysis": "基于有限信息分析,该股票可能呈现上涨趋势",
            "confidence": 0.3,  # 低置信度
            "reasoning": "数据不足,分析结果仅供参考",
        }
        mock_qwen_provider.generate_text.return_value = json.dumps(
            low_confidence_response
        )

        input_data = {
            "stock_code": "000001.SZ",
            "news_content": "平安银行发布2024年Q1财报",
            "context": "银行业整体表现良好",
        }

        result = await llm_service.analyze_fact(input_data)

        # 验证系统能处理低置信度响应
        assert isinstance(result, AnalysisResult)
        assert result.analysis == low_confidence_response["analysis"]
        assert result.confidence == 0.3
        assert result.reasoning == low_confidence_response["reasoning"]

    @pytest.mark.asyncio
    async def test_should_handle_llm_provider_timeout_error(
        self, llm_service, mock_qwen_provider
    ):
        """测试:LLM提供商超时异常的情况"""
        # 模拟LLM提供商抛出超时异常
        mock_qwen_provider.generate_text.side_effect = LlmProviderTimeoutError(
            "请求超时"
        )

        input_data = {
            "stock_code": "000001.SZ",
            "news_content": "平安银行发布2024年Q1财报",
            "context": "银行业整体表现良好",
        }

        with pytest.raises(Exception) as exc_info:
            await llm_service.analyze_fact(input_data)

        assert "事实分析失败" in str(exc_info.value)
        assert "请求超时" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_should_handle_llm_provider_rate_limit_error(
        self, llm_service, mock_qwen_provider
    ):
        """测试:LLM提供商限流异常的情况"""
        # 模拟LLM提供商抛出限流异常
        mock_qwen_provider.generate_text.side_effect = LlmProviderRateLimitError(
            "请求频率过高"
        )

        input_data = {
            "stock_code": "000001.SZ",
            "news_content": "平安银行发布2024年Q1财报",
            "context": "银行业整体表现良好",
        }

        with pytest.raises(Exception) as exc_info:
            await llm_service.analyze_fact(input_data)

        assert "事实分析失败" in str(exc_info.value)
        assert "请求频率过高" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_should_handle_llm_provider_auth_error(
        self, llm_service, mock_qwen_provider
    ):
        """测试:LLM提供商认证异常的情况"""
        # 模拟LLM提供商抛出认证异常
        mock_qwen_provider.generate_text.side_effect = LlmProviderAuthenticationError(
            "API密钥无效"
        )

        input_data = {
            "stock_code": "000001.SZ",
            "news_content": "平安银行发布2024年Q1财报",
            "context": "银行业整体表现良好",
        }

        with pytest.raises(Exception) as exc_info:
            await llm_service.analyze_fact(input_data)

        assert "事实分析失败" in str(exc_info.value)
        assert "API密钥无效" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_should_handle_llm_provider_general_error(
        self, llm_service, mock_qwen_provider
    ):
        """测试:LLM提供商一般异常的情况"""
        # 模拟LLM提供商抛出一般异常
        mock_qwen_provider.generate_text.side_effect = LlmProviderError("未知错误")

        input_data = {
            "stock_code": "000001.SZ",
            "news_content": "平安银行发布2024年Q1财报",
            "context": "银行业整体表现良好",
        }

        with pytest.raises(Exception) as exc_info:
            await llm_service.analyze_fact(input_data)

        assert "事实分析失败" in str(exc_info.value)
        assert "未知错误" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_should_handle_sentiment_analysis_with_fallback(
        self, llm_service, mock_qwen_provider
    ):
        """测试:情感分析JSON解析失败时的回退逻辑"""
        # 模拟LLM API返回无法解析的响应
        mock_qwen_provider.generate_text.return_value = "这不是一个有效的JSON响应"

        input_data = {
            "stock_code": "000001.SZ",
            "news_content": "平安银行发布2024年Q1财报,净利润同比增长15%,市场表现强劲",
        }

        result = await llm_service.analyze_sentiment(input_data)

        # 验证回退逻辑被正确触发
        assert isinstance(result, SentimentAnalysis)
        assert result.sentiment == "positive"  # 包含"增长","强劲"等积极词汇
        assert result.score > 0.5
        assert "基于关键词的情感分析" in result.reasoning

    @pytest.mark.asyncio
    async def test_should_handle_negative_sentiment_analysis(
        self, llm_service, mock_qwen_provider
    ):
        """测试:负面情感分析的回退逻辑"""
        # 模拟LLM API返回无法解析的响应
        mock_qwen_provider.generate_text.return_value = "这不是一个有效的JSON响应"

        input_data = {
            "stock_code": "000001.SZ",
            "news_content": "平安银行发布2024年Q1财报,净利润同比下降15%,市场表现疲软,存在风险",
        }

        result = await llm_service.analyze_sentiment(input_data)

        # 验证负面情感分析
        assert isinstance(result, SentimentAnalysis)
        assert result.sentiment == "negative"  # 包含"下降","疲软","风险"等负面词汇
        assert result.score < 0.5
        assert "基于关键词的情感分析" in result.reasoning

    @pytest.mark.asyncio
    async def test_should_handle_retry_mechanism(self, llm_service, mock_qwen_provider):
        """测试:重试机制的正确性"""
        # 模拟前两次调用失败,第三次成功
        mock_qwen_provider.generate_text.side_effect = [
            LlmProviderError("第一次失败"),
            LlmProviderError("第二次失败"),
            json.dumps(
                {
                    "analysis": "重试成功后的分析结果",
                    "confidence": 0.8,
                    "reasoning": "经过重试后获得的分析",
                }
            ),
        ]

        input_data = {
            "stock_code": "000001.SZ",
            "news_content": "平安银行发布2024年Q1财报",
        }

        result = await llm_service.analyze_with_retry(
            llm_service.analyze_fact, input_data, max_retries=3
        )

        # 验证重试机制工作正常
        assert isinstance(result, AnalysisResult)
        assert result.analysis == "重试成功后的分析结果"
        assert result.confidence == 0.8
        assert result.reasoning == "经过重试后获得的分析"

        # 验证LLM提供商被调用了3次
        assert mock_qwen_provider.generate_text.call_count == 3

    @pytest.mark.asyncio
    async def test_should_handle_retry_exhaustion(
        self, llm_service, mock_qwen_provider
    ):
        """测试:重试次数耗尽的情况"""
        # 模拟所有重试都失败
        mock_qwen_provider.generate_text.side_effect = LlmProviderError("持续失败")

        input_data = {
            "stock_code": "000001.SZ",
            "news_content": "平安银行发布2024年Q1财报",
        }

        with pytest.raises(Exception) as exc_info:
            await llm_service.analyze_with_retry(
                llm_service.analyze_fact, input_data, max_retries=3
            )

        assert "事实分析失败" in str(exc_info.value)
        assert "持续失败" in str(exc_info.value)
        # 验证LLM提供商被调用了3次
        assert mock_qwen_provider.generate_text.call_count == 3

    @pytest.mark.asyncio
    async def test_should_handle_batch_analysis_with_mixed_results(
        self, llm_service, mock_qwen_provider
    ):
        """测试:批量分析混合结果的情况"""
        # 模拟批量分析中部分成功,部分失败
        mock_responses = [
            json.dumps({"analysis": "分析1", "confidence": 0.8, "reasoning": "推理1"}),
            LlmProviderError("分析2失败"),
            json.dumps({"analysis": "分析3", "confidence": 0.7, "reasoning": "推理3"}),
        ]
        mock_qwen_provider.generate_text.side_effect = mock_responses

        batch_data = [
            {"stock_code": "000001.SZ", "news_content": "新闻1"},
            {"stock_code": "000002.SZ", "news_content": "新闻2"},
            {"stock_code": "000003.SZ", "news_content": "新闻3"},
        ]

        results = await llm_service.batch_analyze_facts(batch_data)

        # 验证批量分析结果
        assert len(results) == 3
        assert isinstance(results[0], AnalysisResult)
        assert isinstance(
            results[1], Exception
        )  # 修改为Exception,因为LLMService会包装异常
        assert isinstance(results[2], AnalysisResult)

        # 验证成功的结果
        assert results[0].analysis == "分析1"
        assert results[0].confidence == 0.8
        assert results[2].analysis == "分析3"
        assert results[2].confidence == 0.7

    @pytest.mark.asyncio
    async def test_should_handle_concurrent_requests(
        self, llm_service, mock_qwen_provider
    ):
        """测试:并发请求的情况"""
        # 模拟并发请求
        mock_qwen_provider.generate_text.return_value = json.dumps(
            {"analysis": "并发分析结果", "confidence": 0.8, "reasoning": "并发推理过程"}
        )

        input_data = {
            "stock_code": "000001.SZ",
            "news_content": "平安银行发布2024年Q1财报",
        }

        # 并发执行多个分析请求
        tasks = [
            llm_service.analyze_fact(input_data),
            llm_service.analyze_sentiment(input_data),
            llm_service.analyze_fact(input_data),
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # 验证所有请求都成功完成
        assert len(results) == 3
        for result in results:
            assert not isinstance(result, Exception)
            assert isinstance(result, (AnalysisResult, SentimentAnalysis))

    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_should_handle_real_llm_api_call(self):
        """测试:真实LLM API调用(标记为慢测试)"""
        # 这个测试会真实调用LLM API,用于验证认证和网络链路
        # 注意:这个测试需要有效的API密钥
        pytest.skip("需要有效的API密钥,跳过真实API调用测试")

    def test_health_status_tracking(self, llm_service, mock_qwen_provider):
        """测试:健康状态跟踪"""
        # 初始状态
        health = llm_service.get_health_status()
        assert health["status"] == "healthy"
        assert health["call_count"] == 0
        assert health["error_count"] == 0
        assert health["error_rate"] == 0.0

        # 模拟一些调用和错误
        llm_service._call_count = 10
        llm_service._error_count = 2

        health = llm_service.get_health_status()
        assert health["call_count"] == 10
        assert health["error_count"] == 2
        assert health["error_rate"] == 0.2

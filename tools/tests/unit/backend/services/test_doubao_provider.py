"""
豆包提供商单元测试 - 遵循测试宪法
测试覆盖率目标: 90%+
"""

import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../packages/backend-python')))

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import Response, HTTPStatusError

from src.services.llm_providers.doubao_provider import DoubaoProvider
from src.core.interfaces import (
    LlmProviderError,
    LlmProviderTimeoutError,
    LlmProviderRateLimitError,
    LlmProviderAuthenticationError,
)


class TestDoubaoProvider:
    """豆包提供商测试类"""

    @pytest.fixture
    def provider(self):
        """创建豆包提供商实例"""
        return DoubaoProvider(
            api_key="test_api_key",
            base_url="https://test.api.com",
            client=AsyncMock()
        )

    @pytest.fixture
    def mock_response(self):
        """模拟API响应"""
        response_data = {
            "choices": [
                {
                    "message": {
                        "content": "测试响应内容"
                    }
                }
            ]
        }
        response = Response(200, content=json.dumps(response_data))
        return response

    @pytest.mark.asyncio
    async def test_green_phase_generate_text_success(self, provider, mock_response):
        """测试文本生成成功"""
        provider.client.post = AsyncMock(return_value=mock_response)
        
        result = await provider.generate_text("测试提示词")
        
        assert result == "测试响应内容"
        assert provider._call_count == 1
        assert provider._error_count == 0

    @pytest.mark.asyncio
    async def test_generate_text_with_parameters(self, provider, mock_response):
        """测试带参数的文本生成"""
        provider.client.post = AsyncMock(return_value=mock_response)
        
        result = await provider.generate_text(
            "测试提示词",
            model="doubao-seed-1-8",
            max_tokens=500,
            temperature=0.7
        )
        
        assert result == "测试响应内容"
        # 验证请求参数
        call_args = provider.client.post.call_args
        assert call_args[1]["json"]["model"] == "doubao-seed-1-8"
        assert call_args[1]["json"]["max_tokens"] == 500
        assert call_args[1]["json"]["temperature"] == 0.7

    @pytest.mark.asyncio
    async def test_generate_text_authentication_error(self, provider):
        """测试认证错误"""
        response = Response(401, content="Unauthorized")
        provider.client.post = AsyncMock(return_value=response)
        
        with pytest.raises(LlmProviderAuthenticationError):
            await provider.generate_text("测试提示词")
        
        assert provider._error_count == 1

    @pytest.mark.asyncio
    async def test_generate_text_rate_limit_error(self, provider):
        """测试限流错误"""
        response = Response(429, content="Rate Limited")
        provider.client.post = AsyncMock(return_value=response)
        
        with pytest.raises(LlmProviderRateLimitError):
            await provider.generate_text("测试提示词")
        
        assert provider._error_count == 1

    @pytest.mark.asyncio
    async def test_generate_text_timeout_error(self, provider):
        """测试超时错误"""
        provider.client.post = AsyncMock(side_effect=TimeoutError("Request timeout"))
        
        with pytest.raises(LlmProviderTimeoutError):
            await provider.generate_text("测试提示词")
        
        assert provider._error_count == 1

    @pytest.mark.asyncio
    async def test_generate_text_invalid_response(self, provider):
        """测试无效响应格式"""
        response_data = {"invalid": "response"}
        response = Response(200, content=json.dumps(response_data))
        provider.client.post = AsyncMock(return_value=response)
        
        with pytest.raises(LlmProviderError):
            await provider.generate_text("测试提示词")
        
        assert provider._error_count == 1

    @pytest.mark.asyncio
    async def test_chat_completion_success(self, provider, mock_response):
        """测试聊天完成成功"""
        provider.client.post = AsyncMock(return_value=mock_response)
        
        messages = [
            {"role": "user", "content": "你好"},
            {"role": "assistant", "content": "你好！有什么可以帮助你的吗？"}
        ]
        
        result = await provider.chat_completion(messages)
        
        assert result == "测试响应内容"
        assert provider._call_count == 1

    @pytest.mark.asyncio
    async def test_generate_embeddings_success(self, provider):
        """测试嵌入向量生成成功"""
        response_data = {
            "data": [
                {"embedding": [0.1, 0.2, 0.3]},
                {"embedding": [0.4, 0.5, 0.6]}
            ]
        }
        response = Response(200, content=json.dumps(response_data))
        provider.client.post = AsyncMock(return_value=response)
        
        texts = ["文本1", "文本2"]
        result = await provider.generate_embeddings(texts)
        
        assert result == [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]
        assert provider._call_count == 1

    @pytest.mark.asyncio
    async def test_analyze_sentiment_success(self, provider):
        """测试情感分析成功"""
        sentiment_response = {
            "sentiment": "positive",
            "score": 0.8,
            "confidence": 0.9,
            "reasoning": "文本包含积极词汇"
        }
        
        with patch.object(provider, 'generate_text', return_value=json.dumps(sentiment_response)):
            result = await provider.analyze_sentiment("这是一个很好的产品")
            
            assert result["sentiment"] == "positive"
            assert result["score"] == 0.8
            assert result["confidence"] == 0.9

    @pytest.mark.asyncio
    async def test_analyze_sentiment_json_parse_error(self, provider):
        """测试情感分析JSON解析错误"""
        with patch.object(provider, 'generate_text', return_value="invalid json"):
            result = await provider.analyze_sentiment("测试文本")
            
            assert result["sentiment"] == "neutral"
            assert result["score"] == 0.5
            assert result["confidence"] == 0.5

    @pytest.mark.asyncio
    async def test_analyze_fact_success(self, provider):
        """测试事实分析成功"""
        fact_response = {
            "analysis": "这是一个事实陈述",
            "confidence": 0.8,
            "reasoning": "基于已知信息",
            "fact_check": "已验证"
        }
        
        with patch.object(provider, 'generate_text', return_value=json.dumps(fact_response)):
            result = await provider.analyze_fact("地球是圆的")
            
            assert result["analysis"] == "这是一个事实陈述"
            assert result["confidence"] == 0.8

    @pytest.mark.asyncio
    async def test_analyze_fact_with_context(self, provider):
        """测试带上下文的事实分析"""
        fact_response = {
            "analysis": "基于上下文的分析",
            "confidence": 0.9,
            "reasoning": "结合上下文信息",
            "fact_check": "高度可信"
        }
        
        with patch.object(provider, 'generate_text', return_value=json.dumps(fact_response)):
            result = await provider.analyze_fact("这个公司很成功", context="该公司年收入增长30%")
            
            assert result["analysis"] == "基于上下文的分析"
            assert result["confidence"] == 0.9

    @pytest.mark.asyncio
    async def test_batch_process_success(self, provider):
        """测试批量处理成功"""
        requests = [
            {
                "id": "1",
                "type": "text_generation",
                "prompt": "测试提示词1",
                "params": {}
            },
            {
                "id": "2",
                "type": "sentiment_analysis",
                "text": "测试文本",
                "params": {}
            }
        ]
        
        with patch.object(provider, 'generate_text', return_value="测试响应"):
            with patch.object(provider, 'analyze_sentiment', return_value={"sentiment": "positive"}):
                results = await provider.batch_process(requests)
                
                assert len(results) == 2
                assert results[0]["request_id"] == "1"
                assert results[0]["status"] == "success"
                assert results[1]["request_id"] == "2"
                assert results[1]["status"] == "success"

    @pytest.mark.asyncio
    async def test_batch_process_unknown_type(self, provider):
        """测试批量处理未知类型"""
        requests = [
            {
                "id": "1",
                "type": "unknown_type",
                "params": {}
            }
        ]
        
        results = await provider.batch_process(requests)
        
        assert len(results) == 1
        assert "error" in results[0]["result"]
        assert "未知的请求类型" in results[0]["result"]["error"]

    def test_get_available_models(self, provider):
        pass
        """测试获取可用模型"""
        models = provider.get_available_models()
        
        assert "doubao-seed-1-6" in models
        assert "doubao-seed-1-8" in models
        assert "doubao-embedding" in models

    def test_get_model_info(self, provider):
        pass
        """测试获取模型信息"""
        info = provider.get_model_info("doubao-seed-1-6")
        
        assert info["model_name"] == "doubao-seed-1-6"
        assert info["model_type"] == "chat_completion"
        assert info["max_tokens"] == 8192
        assert "text_generation" in info["supported_features"]

    def test_get_model_info_unknown(self, provider):
        pass
        """测试获取未知模型信息"""
        info = provider.get_model_info("unknown-model")
        
        assert info["model_name"] == "unknown-model"
        assert info["model_type"] == "unknown"
        assert info["max_tokens"] == 0

    @pytest.mark.asyncio
    async def test_health_check_success(self, provider, mock_response):
        """测试健康检查成功"""
        provider.client.post = AsyncMock(return_value=mock_response)
        
        health = await provider.health_check()
        
        assert health["status"] == "healthy"
        assert health["response_time"] > 0
        assert health["available_models"] == 3

    @pytest.mark.asyncio
    async def test_health_check_failure(self, provider):
        """测试健康检查失败"""
        provider.client.post = AsyncMock(side_effect=Exception("API错误"))
        
        health = await provider.health_check()
        
        assert health["status"] == "unhealthy"
        assert health["response_time"] == -1
        assert health["last_success"] is None

    @pytest.mark.asyncio
    async def test_close(self, provider):
        """测试关闭客户端"""
        provider.client.aclose = AsyncMock()
        
        await provider.close()
        
        provider.client.aclose.assert_called_once()

    def test_initialization_with_defaults(self):
        pass
        """测试使用默认值初始化"""
        with patch('src.services.llm_providers.doubao_provider.settings') as mock_settings:
            mock_settings.DOUBAO_API_KEY = "default_key"
            
            provider = DoubaoProvider()
            
            assert provider.api_key == "default_key"
            assert provider.base_url == "https://ark.cn-beijing.volces.com/api/v3"

    def test_initialization_with_custom_values(self):
        pass
        """测试使用自定义值初始化"""
        provider = DoubaoProvider(
            api_key="custom_key",
            base_url="https://custom.api.com"
        )
        
        assert provider.api_key == "custom_key"
        assert provider.base_url == "https://custom.api.com"

    @pytest.mark.asyncio
    async def test_generate_text_http_error(self, provider):
        """测试HTTP错误响应"""
        response = Response(500, content="Internal Server Error")
        provider.client.post = AsyncMock(return_value=response)
        
        with pytest.raises(LlmProviderError):
            await provider.generate_text("测试提示词")
        
        assert provider._error_count == 1

    @pytest.mark.asyncio
    async def test_generate_text_empty_choices(self, provider):
        """测试空choices响应"""
        response_data = {"choices": []}
        response = Response(200, content=json.dumps(response_data))
        provider.client.post = AsyncMock(return_value=response)
        
        with pytest.raises(LlmProviderError):
            await provider.generate_text("测试提示词")
        
        assert provider._error_count == 1

    @pytest.mark.asyncio
    async def test_chat_completion_http_error(self, provider):
        """测试聊天完成HTTP错误"""
        response = Response(500, content="Internal Server Error")
        provider.client.post = AsyncMock(return_value=response)
        
        messages = [{"role": "user", "content": "测试"}]
        with pytest.raises(LlmProviderError):
            await provider.chat_completion(messages)
        
        assert provider._error_count == 1

    @pytest.mark.asyncio
    async def test_chat_completion_empty_choices(self, provider):
        """测试聊天完成空choices响应"""
        response_data = {"choices": []}
        response = Response(200, content=json.dumps(response_data))
        provider.client.post = AsyncMock(return_value=response)
        
        messages = [{"role": "user", "content": "测试"}]
        with pytest.raises(LlmProviderError):
            await provider.chat_completion(messages)
        
        assert provider._error_count == 1

    @pytest.mark.asyncio
    async def test_generate_embeddings_http_error(self, provider):
        """测试嵌入向量生成HTTP错误"""
        response = Response(500, content="Internal Server Error")
        provider.client.post = AsyncMock(return_value=response)
        
        with pytest.raises(LlmProviderError):
            await provider.generate_embeddings(["测试文本"])
        
        assert provider._error_count == 1

    @pytest.mark.asyncio
    async def test_generate_embeddings_invalid_response(self, provider):
        """测试嵌入向量生成无效响应"""
        response_data = {"invalid": "response"}
        response = Response(200, content=json.dumps(response_data))
        provider.client.post = AsyncMock(return_value=response)
        
        with pytest.raises(LlmProviderError):
            await provider.generate_embeddings(["测试文本"])
        
        assert provider._error_count == 1

    @pytest.mark.asyncio
    async def test_analyze_sentiment_generate_text_error(self, provider):
        """测试情感分析时generate_text出错"""
        with patch.object(provider, 'generate_text', side_effect=LlmProviderError("API错误")):
            with pytest.raises(LlmProviderError):
                await provider.analyze_sentiment("测试文本")
            
            assert provider._error_count == 1

    @pytest.mark.asyncio
    async def test_analyze_fact_generate_text_error(self, provider):
        """测试事实分析时generate_text出错"""
        with patch.object(provider, 'generate_text', side_effect=LlmProviderError("API错误")):
            with pytest.raises(LlmProviderError):
                await provider.analyze_fact("测试文本")
            
            assert provider._error_count == 1

    @pytest.mark.asyncio
    async def test_batch_process_generate_text_error(self, provider):
        """测试批量处理时generate_text出错"""
        requests = [
            {
                "id": "1",
                "type": "text_generation",
                "prompt": "测试提示词",
                "params": {}
            }
        ]
        
        with patch.object(provider, 'generate_text', side_effect=LlmProviderError("API错误")):
            with pytest.raises(LlmProviderError):
                await provider.batch_process(requests)
            
            assert provider._error_count == 1

    @pytest.mark.asyncio
    async def test_batch_process_chat_completion_error(self, provider):
        """测试批量处理时chat_completion出错"""
        requests = [
            {
                "id": "1",
                "type": "chat_completion",
                "messages": [{"role": "user", "content": "测试"}],
                "params": {}
            }
        ]
        
        with patch.object(provider, 'chat_completion', side_effect=LlmProviderError("API错误")):
            with pytest.raises(LlmProviderError):
                await provider.batch_process(requests)
            
            assert provider._error_count == 1

    @pytest.mark.asyncio
    async def test_batch_process_sentiment_analysis_error(self, provider):
        """测试批量处理时sentiment_analysis出错"""
        requests = [
            {
                "id": "1",
                "type": "sentiment_analysis",
                "text": "测试文本",
                "params": {}
            }
        ]
        
        with patch.object(provider, 'analyze_sentiment', side_effect=LlmProviderError("API错误")):
            with pytest.raises(LlmProviderError):
                await provider.batch_process(requests)
            
            assert provider._error_count == 1

    @pytest.mark.asyncio
    async def test_batch_process_fact_analysis_error(self, provider):
        """测试批量处理时fact_analysis出错"""
        requests = [
            {
                "id": "1",
                "type": "fact_analysis",
                "text": "测试文本",
                "params": {}
            }
        ]
        
        with patch.object(provider, 'analyze_fact', side_effect=LlmProviderError("API错误")):
            with pytest.raises(LlmProviderError):
                await provider.batch_process(requests)
            
            assert provider._error_count == 1

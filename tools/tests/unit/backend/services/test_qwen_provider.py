"""
QwenProvider单元测试

严格遵循《测试宪法》第五条【模拟铁律】:
- 只模拟httpx.AsyncClient,不模拟内部逻辑
- 测试真实的业务逻辑和错误处理
- 覆盖所有成功和失败场景
"""

import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../packages/backend-python')))

from unittest.mock import AsyncMock, Mock, patch

import httpx
import pytest

from src.core.interfaces import (
    LlmProviderAuthenticationError,
    LlmProviderError,
    LlmProviderRateLimitError,
    LlmProviderTimeoutError,
)
from src.services.llm_providers.qwen_provider import QwenProvider


class TestQwenProvider:
    """QwenProvider测试类"""

    @pytest.fixture
    def mock_httpx_client(self):
        """创建模拟的httpx.AsyncClient"""
        return AsyncMock(spec=httpx.AsyncClient)

    @pytest.fixture
    def provider(self, mock_httpx_client):
        """创建QwenProvider实例,注入模拟的HTTP客户端"""
        return QwenProvider(
            api_key="test_api_key",
            base_url="https://test.api.com",
            client=mock_httpx_client,
        )

    # ==================== 初始化测试 ====================

    def test_green_phase_initialization_with_parameters(self, mock_httpx_client):
        pass
        """测试使用参数初始化"""
        provider = QwenProvider(
            api_key="custom_key",
            base_url="https://custom.api.com",
            client=mock_httpx_client,
        )

        assert provider.api_key == "custom_key"
        assert provider.base_url == "https://custom.api.com"
        assert provider.client is mock_httpx_client
        assert provider._call_count == 0
        assert provider._error_count == 0

    def test_initialization_with_defaults(self, mock_httpx_client):
        pass
        """测试使用默认值初始化"""
        with patch(
            "src.services.llm_providers.qwen_provider.settings"
        ) as mock_settings:
            mock_settings.QWEN_API_KEY = "default_key"
            provider = QwenProvider(client=mock_httpx_client)

            assert provider.api_key == "default_key"
            assert provider.base_url == "https://dashscope.aliyuncs.com/api/v1"
            assert provider.client is mock_httpx_client

    def test_initialization_logger_setup(self, provider):
        pass
        """测试日志器设置"""
        assert provider.logger is not None
        assert provider.logger.name == "src.services.llm_providers.qwen_provider"

    # ==================== generate_text测试 ====================

    @pytest.mark.asyncio
    async def test_generate_text_success(self, provider, mock_httpx_client):
        """测试成功生成文本"""
        # 模拟成功的API响应
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "output": {"text": "这是生成的文本内容"},
            "usage": {"total_tokens": 100, "input_tokens": 50, "output_tokens": 50},
        }
        mock_httpx_client.post.return_value = mock_response

        result = await provider.generate_text("测试提示词")

        assert result == "这是生成的文本内容"
        assert provider._call_count == 1
        assert provider._error_count == 0

        # 验证API调用
        mock_httpx_client.post.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_text_with_custom_parameters(
        self, provider, mock_httpx_client
    ):
        """测试使用自定义参数生成文本"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "output": {"text": "自定义文本"},
            "usage": {"total_tokens": 200},
        }
        mock_httpx_client.post.return_value = mock_response

        result = await provider.generate_text(
            "测试提示词", model="qwen-turbo", max_tokens=1000, temperature=0.7
        )

        assert result == "自定义文本"

    @pytest.mark.asyncio
    async def test_generate_text_authentication_error(
        self, provider, mock_httpx_client
    ):
        """测试认证错误"""
        mock_response = Mock()
        mock_response.status_code = 401
        mock_response.json.return_value = {"error": {"message": "Invalid API key"}}
        mock_httpx_client.post.return_value = mock_response

        with pytest.raises(LlmProviderAuthenticationError) as exc_info:
            await provider.generate_text("测试提示词")

        assert "认证失败" in str(exc_info.value)
        assert provider._error_count == 1

    @pytest.mark.asyncio
    async def test_generate_text_rate_limit_error(self, provider, mock_httpx_client):
        """测试速率限制错误"""
        mock_response = Mock()
        mock_response.status_code = 429
        mock_response.json.return_value = {"error": {"message": "Rate limit exceeded"}}
        mock_httpx_client.post.return_value = mock_response

        with pytest.raises(LlmProviderRateLimitError) as exc_info:
            await provider.generate_text("测试提示词")

        assert "请求频率超限" in str(exc_info.value)
        assert provider._error_count == 1

    @pytest.mark.asyncio
    async def test_generate_text_timeout_error(self, provider, mock_httpx_client):
        """测试超时错误"""
        mock_httpx_client.post.side_effect = httpx.TimeoutException("Request timeout")

        with pytest.raises(LlmProviderTimeoutError) as exc_info:
            await provider.generate_text("测试提示词")

        assert "请求超时" in str(exc_info.value)
        assert provider._error_count == 1

    @pytest.mark.asyncio
    async def test_generate_text_http_error(self, provider, mock_httpx_client):
        """测试HTTP错误"""
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.json.return_value = {
            "error": {"message": "Internal server error"}
        }
        mock_httpx_client.post.return_value = mock_response

        with pytest.raises(LlmProviderError) as exc_info:
            await provider.generate_text("测试提示词")

        assert "请求失败" in str(exc_info.value)
        assert provider._error_count == 1

    @pytest.mark.asyncio
    async def test_generate_text_network_error(self, provider, mock_httpx_client):
        """测试网络错误"""
        mock_httpx_client.post.side_effect = httpx.ConnectError("Network error")

        with pytest.raises(LlmProviderError) as exc_info:
            await provider.generate_text("测试提示词")

        assert "调用失败" in str(exc_info.value)
        assert provider._error_count == 1

    # ==================== chat_completion测试 ====================

    @pytest.mark.asyncio
    async def test_chat_completion_success(self, provider, mock_httpx_client):
        """测试成功聊天完成"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "output": {"text": "这是聊天回复"},
            "usage": {"total_tokens": 150},
        }
        mock_httpx_client.post.return_value = mock_response

        messages = [{"role": "user", "content": "你好"}]
        result = await provider.chat_completion(messages)

        assert result == "这是聊天回复"

    @pytest.mark.asyncio
    async def test_chat_completion_with_system_message(
        self, provider, mock_httpx_client
    ):
        """测试包含系统消息的聊天完成"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "output": {"text": "系统回复"},
            "usage": {"total_tokens": 200},
        }
        mock_httpx_client.post.return_value = mock_response

        messages = [
            {"role": "system", "content": "你是一个助手"},
            {"role": "user", "content": "你好"},
        ]
        result = await provider.chat_completion(messages)

        assert result == "系统回复"

    @pytest.mark.asyncio
    async def test_chat_completion_error(self, provider, mock_httpx_client):
        """测试聊天完成错误"""
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.json.return_value = {"error": {"message": "Bad request"}}
        mock_httpx_client.post.return_value = mock_response

        with pytest.raises(LlmProviderError):
            await provider.chat_completion([{"role": "user", "content": "测试"}])

    # ==================== generate_embeddings测试 ====================

    @pytest.mark.asyncio
    async def test_generate_embeddings_success(self, provider, mock_httpx_client):
        """测试成功生成嵌入向量"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "output": {
                "embeddings": [
                    {"embedding": [0.1, 0.2, 0.3, 0.4, 0.5], "text_index": 0}
                ]
            },
            "usage": {"total_tokens": 10},
        }
        mock_httpx_client.post.return_value = mock_response

        texts = ["测试文本"]
        result = await provider.generate_embeddings(texts)

        assert len(result) == 1
        assert result[0]["embedding"] == [0.1, 0.2, 0.3, 0.4, 0.5]

    @pytest.mark.asyncio
    async def test_generate_embeddings_multiple_texts(
        self, provider, mock_httpx_client
    ):
        """测试生成多个文本的嵌入向量"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "output": {
                "embeddings": [
                    {"embedding": [0.1, 0.2], "text_index": 0},
                    {"embedding": [0.3, 0.4], "text_index": 1},
                ]
            },
            "usage": {"total_tokens": 20},
        }
        mock_httpx_client.post.return_value = mock_response

        texts = ["文本1", "文本2"]
        result = await provider.generate_embeddings(texts)

        assert len(result) == 2
        assert result[0]["embedding"] == [0.1, 0.2]
        assert result[1]["embedding"] == [0.3, 0.4]

    @pytest.mark.asyncio
    async def test_generate_embeddings_error(self, provider, mock_httpx_client):
        """测试生成嵌入向量错误"""
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.json.return_value = {"error": {"message": "Server error"}}
        mock_httpx_client.post.return_value = mock_response

        with pytest.raises(LlmProviderError):
            await provider.generate_embeddings(["测试文本"])

    # ==================== analyze_sentiment测试 ====================

    @pytest.mark.asyncio
    async def test_analyze_sentiment_success(self, provider, mock_httpx_client):
        """测试成功分析情感"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "output": {"text": '{"sentiment": "positive", "confidence": 0.85}'},
            "usage": {"total_tokens": 50},
        }
        mock_httpx_client.post.return_value = mock_response

        result = await provider.analyze_sentiment("我很高兴")

        assert result["sentiment"] == "positive"
        assert result["confidence"] == 0.85

    @pytest.mark.asyncio
    async def test_analyze_sentiment_negative(self, provider, mock_httpx_client):
        """测试分析负面情感"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "output": {"text": '{"sentiment": "negative", "confidence": 0.92}'},
            "usage": {"total_tokens": 50},
        }
        mock_httpx_client.post.return_value = mock_response

        result = await provider.analyze_sentiment("我很失望")

        assert result["sentiment"] == "negative"
        assert result["confidence"] == 0.92

    @pytest.mark.asyncio
    async def test_analyze_sentiment_error(self, provider, mock_httpx_client):
        """测试情感分析错误"""
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.json.return_value = {"error": {"message": "Invalid input"}}
        mock_httpx_client.post.return_value = mock_response

        with pytest.raises(LlmProviderError):
            await provider.analyze_sentiment("测试文本")

    # ==================== analyze_fact测试 ====================

    @pytest.mark.asyncio
    async def test_analyze_fact_success(self, provider, mock_httpx_client):
        """测试成功分析事实"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "output": {
                "text": '{"factual": true, "confidence": 0.95, "reasoning": "基于可靠数据"}'
            },
            "usage": {"total_tokens": 100},
        }
        mock_httpx_client.post.return_value = mock_response

        result = await provider.analyze_fact("地球是圆的")

        assert result["factual"] is True
        assert result["confidence"] == 0.95
        assert result["reasoning"] == "基于可靠数据"

    @pytest.mark.asyncio
    async def test_analyze_fact_false(self, provider, mock_httpx_client):
        """测试分析错误事实"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "output": {
                "text": '{"factual": false, "confidence": 0.88, "reasoning": "缺乏证据支持"}'
            },
            "usage": {"total_tokens": 100},
        }
        mock_httpx_client.post.return_value = mock_response

        result = await provider.analyze_fact("地球是平的")

        assert result["factual"] is False
        assert result["confidence"] == 0.88

    @pytest.mark.asyncio
    async def test_analyze_fact_error(self, provider, mock_httpx_client):
        """测试事实分析错误"""
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.json.return_value = {"error": {"message": "Analysis failed"}}
        mock_httpx_client.post.return_value = mock_response

        with pytest.raises(LlmProviderError):
            await provider.analyze_fact("测试文本")

    # ==================== batch_process测试 ====================

    @pytest.mark.asyncio
    async def test_batch_process_success(self, provider, mock_httpx_client):
        """测试成功批量处理"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "output": {"text": "批量处理结果"},
            "usage": {"total_tokens": 200},
        }
        mock_httpx_client.post.return_value = mock_response

        tasks = [
            {"type": "text_generation", "prompt": "任务1"},
            {"type": "sentiment_analysis", "text": "任务2"},
        ]
        result = await provider.batch_process(tasks)

        assert result[0]["result"] == "批量处理结果"
        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_batch_process_error(self, provider, mock_httpx_client):
        """测试批量处理错误"""
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.json.return_value = {
            "error": {"message": "Batch processing failed"}
        }
        mock_httpx_client.post.return_value = mock_response

        result = await provider.batch_process([{"type": "test", "data": "test"}])
        assert result[0]["result"]["error"] == "未知的请求类型: test"

    # ==================== get_available_models测试 ====================

    def test_get_available_models(self, provider):
        pass
        """测试获取可用模型列表"""
        models = provider.get_available_models()

        assert isinstance(models, list)
        assert "qwen-plus" in models
        assert "qwen-turbo" in models
        assert "qwen-max" in models

    # ==================== get_model_info测试 ====================

    def test_get_model_info_existing_model(self, provider):
        pass
        """测试获取现有模型信息"""
        info = provider.get_model_info("qwen-plus")

        assert info["model_name"] == "qwen-plus"
        assert "max_tokens" in info
        assert "supported_features" in info

    def test_get_model_info_unknown_model(self, provider):
        pass
        """测试获取未知模型信息"""
        info = provider.get_model_info("unknown-model")

        assert info["model_name"] == "unknown-model"
        assert info["max_tokens"] == 0
        assert info["supported_features"] == []

    # ==================== health_check测试 ====================

    @pytest.mark.asyncio
    async def test_health_check_success(self, provider, mock_httpx_client):
        """测试成功健康检查"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "output": {"text": "健康"},
            "usage": {"total_tokens": 10},
        }
        mock_httpx_client.post.return_value = mock_response

        result = await provider.health_check()

        assert result["status"] == "healthy"
        assert "response_time" in result
        assert "last_success" in result
        assert result["error_count"] == 0

    @pytest.mark.asyncio
    async def test_health_check_failure(self, provider, mock_httpx_client):
        """测试健康检查失败"""
        mock_httpx_client.post.side_effect = httpx.ConnectError("Connection failed")

        result = await provider.health_check()

        assert result["status"] == "unhealthy"
        assert result["response_time"] == -1
        assert result["last_success"] is None
        assert result["error_count"] == 1

    # ==================== close测试 ====================

    @pytest.mark.asyncio
    async def test_close(self, provider, mock_httpx_client):
        """测试关闭客户端"""
        await provider.close()

        mock_httpx_client.aclose.assert_called_once()

    # ==================== 统计信息测试 ====================

    @pytest.mark.asyncio
    async def test_call_count_tracking(self, provider, mock_httpx_client):
        """测试调用次数统计"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "output": {"text": "测试"},
            "usage": {"total_tokens": 10},
        }
        mock_httpx_client.post.return_value = mock_response

        # 进行多次调用
        await provider.generate_text("测试1")
        await provider.generate_text("测试2")
        await provider.generate_text("测试3")

        assert provider._call_count == 3

    @pytest.mark.asyncio
    async def test_error_count_tracking(self, provider, mock_httpx_client):
        """测试错误次数统计"""
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.json.return_value = {"error": {"message": "Server error"}}
        mock_httpx_client.post.return_value = mock_response

        # 进行多次失败调用
        with pytest.raises(LlmProviderError):
            await provider.generate_text("测试1")

        with pytest.raises(LlmProviderError):
            await provider.generate_text("测试2")

        assert provider._error_count == 2

    # ==================== 边界条件测试 ====================

    @pytest.mark.asyncio
    async def test_empty_prompt(self, provider, mock_httpx_client):
        """测试空提示词"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "output": {"text": ""},
            "usage": {"total_tokens": 0},
        }
        mock_httpx_client.post.return_value = mock_response

        result = await provider.generate_text("")
        assert result == ""

    @pytest.mark.asyncio
    async def test_very_long_prompt(self, provider, mock_httpx_client):
        """测试超长提示词"""
        long_prompt = "测试" * 10000  # 很长的提示词

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "output": {"text": "处理完成"},
            "usage": {"total_tokens": 50000},
        }
        mock_httpx_client.post.return_value = mock_response

        result = await provider.generate_text(long_prompt)
        assert result == "处理完成"

    @pytest.mark.asyncio
    async def test_special_characters_in_prompt(self, provider, mock_httpx_client):
        """测试特殊字符提示词"""
        special_prompt = "测试特殊字符:!@#$%^&*()_+-=[]{}|;':\",./<>?`~"

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "output": {"text": "特殊字符处理完成"},
            "usage": {"total_tokens": 50},
        }
        mock_httpx_client.post.return_value = mock_response

        result = await provider.generate_text(special_prompt)
        assert result == "特殊字符处理完成"

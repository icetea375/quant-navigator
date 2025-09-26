"""
QwenProvider契约测试 - 验证QwenProvider是否符合LlmProviderInterface契约
遵循YAGNI平衡法则：这是"必要的架构守护"，不是"不必要的复杂功能"
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
import json

from src.services.llm_providers import QwenProvider
from tests.contracts import run_llm_provider_contract_tests


class TestQwenProviderContract:
    """QwenProvider契约测试类"""
    
    @pytest.fixture
    def qwen_provider(self):
        """创建QwenProvider实例用于测试"""
        return QwenProvider(api_key="test_key", base_url="https://test.api.com")
    
    @pytest.mark.asyncio
    async def test_qwen_provider_conforms_to_contract(self, qwen_provider):
        """
        测试QwenProvider是否符合LlmProviderInterface契约
        
        这是核心的契约测试，确保QwenProvider完全符合接口定义
        """
        # 使用契约测试生成器验证QwenProvider
        assert run_llm_provider_contract_tests(qwen_provider), "QwenProvider不符合LlmProviderInterface契约"
    
    @pytest.mark.asyncio
    async def test_generate_text_contract(self, qwen_provider):
        """测试generate_text方法契约"""
        # Mock HTTP响应
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "output": {
                "text": "这是生成的文本"
            }
        }
        
        with patch.object(qwen_provider.client, 'post', return_value=mock_response):
            result = await qwen_provider.generate_text("测试提示词", "qwen-plus")
            
            # 验证返回类型
            assert isinstance(result, str), "必须返回str"
            assert result == "这是生成的文本", "返回内容应该正确"
    
    @pytest.mark.asyncio
    async def test_chat_completion_contract(self, qwen_provider):
        """测试chat_completion方法契约"""
        # Mock HTTP响应
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "output": {
                "text": "这是聊天回复"
            }
        }
        
        with patch.object(qwen_provider.client, 'post', return_value=mock_response):
            messages = [{"role": "user", "content": "测试消息"}]
            result = await qwen_provider.chat_completion(messages, "qwen-plus")
            
            # 验证返回类型
            assert isinstance(result, str), "必须返回str"
            assert result == "这是聊天回复", "返回内容应该正确"
    
    @pytest.mark.asyncio
    async def test_generate_embeddings_contract(self, qwen_provider):
        """测试generate_embeddings方法契约"""
        # Mock HTTP响应
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "output": {
                "embeddings": [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]
            }
        }
        
        with patch.object(qwen_provider.client, 'post', return_value=mock_response):
            result = await qwen_provider.generate_embeddings(["测试文本1", "测试文本2"], "text-embedding-v1")
            
            # 验证返回类型
            assert isinstance(result, list), "必须返回List"
            assert len(result) == 2, "应该返回2个嵌入向量"
            assert isinstance(result[0], list), "嵌入向量必须是List"
            assert isinstance(result[0][0], (int, float)), "嵌入向量元素必须是数字"
    
    @pytest.mark.asyncio
    async def test_analyze_sentiment_contract(self, qwen_provider):
        """测试analyze_sentiment方法契约"""
        # Mock generate_text响应
        mock_sentiment_response = json.dumps({
            "sentiment": "positive",
            "score": 0.8,
            "reasoning": "基于关键词分析"
        })
        
        with patch.object(qwen_provider, 'generate_text', return_value=mock_sentiment_response):
            result = await qwen_provider.analyze_sentiment("测试文本", "qwen-plus")
            
            # 验证返回类型
            assert isinstance(result, dict), "必须返回Dict"
            
            # 验证必需键
            required_keys = ['sentiment', 'score', 'reasoning']
            assert set(required_keys).issubset(result.keys()), f"缺少必需键: {required_keys}"
            
            # 验证值类型
            assert result['sentiment'] in ['positive', 'negative', 'neutral'], "sentiment值应该有效"
            assert 0 <= result['score'] <= 1, "score应该在0-1之间"
            assert isinstance(result['reasoning'], str), "reasoning应该是字符串"
    
    @pytest.mark.asyncio
    async def test_analyze_fact_contract(self, qwen_provider):
        """测试analyze_fact方法契约"""
        # Mock generate_text响应
        mock_fact_response = json.dumps({
            "analysis": "事实分析结果",
            "confidence": 0.9,
            "reasoning": "基于上下文分析",
            "fact_check": "已验证"
        })
        
        with patch.object(qwen_provider, 'generate_text', return_value=mock_fact_response):
            result = await qwen_provider.analyze_fact("测试文本", "测试上下文", "qwen-plus")
            
            # 验证返回类型
            assert isinstance(result, dict), "必须返回Dict"
            
            # 验证必需键
            required_keys = ['analysis', 'confidence', 'reasoning', 'fact_check']
            assert set(required_keys).issubset(result.keys()), f"缺少必需键: {required_keys}"
            
            # 验证值类型
            assert isinstance(result['analysis'], str), "analysis应该是字符串"
            assert 0 <= result['confidence'] <= 1, "confidence应该在0-1之间"
            assert isinstance(result['reasoning'], str), "reasoning应该是字符串"
    
    @pytest.mark.asyncio
    async def test_batch_process_contract(self, qwen_provider):
        """测试batch_process方法契约"""
        # Mock generate_text响应
        mock_batch_response = "批量处理结果"
        
        with patch.object(qwen_provider, 'generate_text', return_value=mock_batch_response):
            requests = [
                {"id": "1", "type": "text_generation", "prompt": "测试1"},
                {"id": "2", "type": "text_generation", "prompt": "测试2"}
            ]
            result = await qwen_provider.batch_process(requests, "qwen-plus")
            
            # 验证返回类型
            assert isinstance(result, list), "必须返回List"
            assert len(result) == 2, "应该返回2个结果"
            
            # 验证结果格式
            for item in result:
                assert isinstance(item, dict), "结果元素必须是Dict"
                assert 'request_id' in item, "应该包含request_id"
                assert 'result' in item, "应该包含result"
                assert 'status' in item, "应该包含status"
    
    def test_get_available_models_contract(self, qwen_provider):
        """测试get_available_models方法契约"""
        result = qwen_provider.get_available_models()
        
        # 验证返回类型
        assert isinstance(result, list), "必须返回List"
        
        # 验证元素类型
        for model in result:
            assert isinstance(model, str), "模型名称必须是字符串"
        
        # 验证包含预期模型
        expected_models = ["qwen-plus", "qwen-turbo", "qwen-max"]
        for model in expected_models:
            assert model in result, f"应该包含模型: {model}"
    
    def test_get_model_info_contract(self, qwen_provider):
        """测试get_model_info方法契约"""
        result = qwen_provider.get_model_info("qwen-plus")
        
        # 验证返回类型
        assert isinstance(result, dict), "必须返回Dict"
        
        # 验证必需键
        required_keys = ['model_name', 'model_type', 'max_tokens', 'supported_features', 'cost_per_token']
        assert set(required_keys).issubset(result.keys()), f"缺少必需键: {required_keys}"
        
        # 验证值类型
        assert isinstance(result['model_name'], str), "model_name应该是字符串"
        assert isinstance(result['model_type'], str), "model_type应该是字符串"
        assert isinstance(result['max_tokens'], int), "max_tokens应该是整数"
        assert isinstance(result['supported_features'], list), "supported_features应该是列表"
        assert isinstance(result['cost_per_token'], (int, float)), "cost_per_token应该是数字"
    
    @pytest.mark.asyncio
    async def test_health_check_contract(self, qwen_provider):
        """测试health_check方法契约"""
        # Mock generate_text响应
        with patch.object(qwen_provider, 'generate_text', return_value="测试响应"):
            result = await qwen_provider.health_check()
            
            # 验证返回类型
            assert isinstance(result, dict), "必须返回Dict"
            
            # 验证必需键
            required_keys = ['status', 'response_time', 'last_success', 'error_count', 'rate_limit_remaining', 'available_models']
            assert set(required_keys).issubset(result.keys()), f"缺少必需键: {required_keys}"
            
            # 验证status值
            assert result['status'] in ['healthy', 'unhealthy', 'degraded'], f"无效的status值: {result['status']}"
            
            # 验证数值类型
            assert isinstance(result['response_time'], (int, float)), "response_time应该是数字"
            assert isinstance(result['error_count'], int), "error_count应该是整数"
            assert isinstance(result['available_models'], int), "available_models应该是整数"
    
    @pytest.mark.asyncio
    async def test_exception_handling_contract(self, qwen_provider):
        """测试异常处理契约"""
        from src.core.interfaces import LlmProviderError, LlmProviderAuthenticationError, LlmProviderRateLimitError
        
        # 测试认证错误
        mock_response = Mock()
        mock_response.status_code = 401
        
        with patch.object(qwen_provider.client, 'post', return_value=mock_response):
            with pytest.raises(LlmProviderAuthenticationError):
                await qwen_provider.generate_text("测试", "qwen-plus")
        
        # 测试限流错误
        mock_response.status_code = 429
        
        with patch.object(qwen_provider.client, 'post', return_value=mock_response):
            with pytest.raises(LlmProviderRateLimitError):
                await qwen_provider.generate_text("测试", "qwen-plus")
        
        # 测试超时错误
        import httpx
        
        with patch.object(qwen_provider.client, 'post', side_effect=httpx.TimeoutException("超时")):
            with pytest.raises(LlmProviderError):
                await qwen_provider.generate_text("测试", "qwen-plus")
    
    @pytest.mark.asyncio
    async def test_json_parsing_fallback(self, qwen_provider):
        """测试JSON解析失败时的回退机制"""
        # Mock无效的JSON响应
        with patch.object(qwen_provider, 'generate_text', return_value="无效的JSON响应"):
            result = await qwen_provider.analyze_sentiment("测试文本", "qwen-plus")
            
            # 验证回退机制
            assert isinstance(result, dict), "应该返回Dict"
            assert 'sentiment' in result, "应该包含sentiment键"
            assert 'score' in result, "应该包含score键"
            assert 'reasoning' in result, "应该包含reasoning键"
    
    @pytest.mark.asyncio
    async def test_close_method(self, qwen_provider):
        """测试close方法"""
        with patch.object(qwen_provider.client, 'aclose') as mock_close:
            await qwen_provider.close()
            mock_close.assert_called_once()

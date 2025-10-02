"""
豆包提供商集成测试 - 验证与LLMService的集成
遵循测试宪法
"""

import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../packages/backend-python')))

import pytest
from unittest.mock import AsyncMock, patch

from src.services.llm_service import LLMService
from src.services.llm_providers.doubao_provider import DoubaoProvider


class TestDoubaoIntegration:
    """豆包提供商集成测试类"""

    @pytest.fixture
    def doubao_provider(self):
        """创建豆包提供商实例"""
        return DoubaoProvider(
            api_key="test_api_key",
            base_url="https://test.api.com",
            client=AsyncMock()
        )

    @pytest.fixture
    def llm_service_with_doubao(self, doubao_provider):
        """创建使用豆包提供商的LLM服务"""
        return LLMService(llm_provider=doubao_provider)

    @pytest.mark.asyncio
    async def test_green_phase_llm_service_with_doubao_provider(self, llm_service_with_doubao, doubao_provider):
        """测试LLM服务使用豆包提供商"""
        # 模拟豆包提供商的响应
        with patch.object(doubao_provider, 'generate_text', return_value="豆包分析结果"):
            result = await llm_service_with_doubao.analyze_fact({
                "stock_code": "000001",
                "news_content": "测试新闻内容"
            })
            
            assert result.analysis is not None
            assert result.confidence > 0
            assert result.reasoning is not None

    @pytest.mark.asyncio
    async def test_llm_service_sentiment_analysis_with_doubao(self, llm_service_with_doubao, doubao_provider):
        """测试LLM服务使用豆包提供商进行情感分析"""
        # 模拟豆包提供商的响应
        with patch.object(doubao_provider, 'generate_text', return_value='{"sentiment": "positive", "score": 0.8, "reasoning": "积极情绪"}'):
            result = await llm_service_with_doubao.analyze_sentiment({
                "stock_code": "000001",
                "news_content": "这是一个好消息"
            })
            
            assert result.sentiment == "positive"
            assert result.score == 0.8
            assert result.reasoning == "积极情绪"

    def test_llm_service_health_check_with_doubao(self, llm_service_with_doubao):
        pass
        """测试LLM服务健康检查"""
        health = llm_service_with_doubao.get_health_status()
        
        assert "status" in health
        assert "call_count" in health
        assert "error_count" in health
        assert "error_rate" in health

    @pytest.mark.asyncio
    async def test_doubao_provider_implements_interface(self, doubao_provider):
        """测试豆包提供商正确实现了接口"""
        from core.interfaces import LlmProviderInterface
        
        # 验证豆包提供商是接口的实现
        assert isinstance(doubao_provider, LlmProviderInterface)
        
        # 验证所有必需的方法都存在
        required_methods = [
            'generate_text',
            'chat_completion', 
            'generate_embeddings',
            'analyze_sentiment',
            'analyze_fact',
            'batch_process',
            'get_available_models',
            'get_model_info',
            'health_check'
        ]
        
        for method_name in required_methods:
            assert hasattr(doubao_provider, method_name)
            assert callable(getattr(doubao_provider, method_name))

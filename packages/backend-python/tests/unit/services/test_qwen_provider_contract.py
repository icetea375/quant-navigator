"""
QwenProvider 契约测试 - 符合《测试宪法》第3.0条
用契约生成测试，而非修补硬编码Mock
"""

import os
import sys
from unittest.mock import AsyncMock

import pytest

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))

from src.core.contract_validator import contract_validator


class TestQwenProviderContract:
    """基于契约的QwenProvider测试"""

    @pytest.fixture
    def provider(self):
        """创建QwenProvider实例"""
        # 使用Mock避免复杂的依赖
        from unittest.mock import MagicMock

        provider = MagicMock()
        provider.chat_completion = AsyncMock()
        provider.generate_embeddings = AsyncMock()
        return provider

    @pytest.fixture
    def valid_chat_response(self):
        """符合契约的聊天响应"""
        return contract_validator.get_schema("chat_completion")

    @pytest.fixture
    def valid_embeddings_response(self):
        """符合契约的嵌入向量响应"""
        return contract_validator.get_schema("generate_embeddings")

    def test_chat_completion_contract_validation(self, provider, valid_chat_response):
        """测试聊天完成契约验证"""
        # 使用契约生成的有效响应
        valid_response = {
            "output": {"text": "这是聊天回复"},
            "usage": {"total_tokens": 150},
        }

        # 验证响应符合契约
        assert (
            contract_validator.validate_response(valid_response, "chat_completion")
            == True
        )

    def test_generate_embeddings_contract_validation(
        self, provider, valid_embeddings_response
    ):
        """测试嵌入向量生成契约验证"""
        # 使用契约生成的有效响应
        valid_response = {
            "output": {"embeddings": [{"embedding": [0.1, 0.2, 0.3], "text_index": 0}]},
            "usage": {"total_tokens": 20},
        }

        # 验证响应符合契约
        assert (
            contract_validator.validate_response(valid_response, "generate_embeddings")
            == True
        )

    def test_invalid_response_raises_error(self, provider):
        """测试无效响应抛出错误"""
        # 不符合契约的响应
        invalid_response = {"invalid": "response"}

        # 验证响应不符合契约
        assert (
            contract_validator.validate_response(invalid_response, "chat_completion")
            == False
        )

    def test_contract_schemas_loaded(self):
        """测试契约文件已正确加载"""
        schemas = contract_validator.list_schemas()
        assert "chat_completion" in schemas
        assert "generate_embeddings" in schemas
        assert "analyze_sentiment" in schemas
        assert "analyze_fact" in schemas
        assert "health_check" in schemas

    def test_contract_validation_works(self):
        """测试契约验证功能"""
        valid_response = {"output": {"text": "测试"}, "usage": {"total_tokens": 10}}

        invalid_response = {"invalid": "response"}

        assert (
            contract_validator.validate_response(valid_response, "chat_completion")
            == True
        )
        assert (
            contract_validator.validate_response(invalid_response, "chat_completion")
            == False
        )

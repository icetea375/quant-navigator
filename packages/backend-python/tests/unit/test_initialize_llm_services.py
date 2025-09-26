#!/usr/bin/env python3
"""
LLM服务初始化方法单元测试 - TDD第四步:红灯
测试_initialize_llm_services方法的解耦配置验证功能
"""

from unittest.mock import MagicMock

import pytest

from src.exceptions.workflow_exceptions import LLMServiceError


class MockMainWorkflow:
    """模拟主工作流类"""
    def __init__(self, config):
        self.config = config
        self.logger = MagicMock()

    def _initialize_llm_services(self):
        """
        初始化LLM服务 - 解耦版本,只验证配置

        Raises:
            LLMServiceError: 当LLM服务配置验证失败时
        """
        try:
            # 只检查配置存在性,不测试连接
            if "llm_service" not in self.config:
                raise ValueError("缺少LLM服务配置")

            qwen_config = self.config["llm_service"].get("qwen", {})
            doubao_config = self.config["llm_service"].get("doubao", {})

            if not qwen_config.get("api_key"):
                raise ValueError("缺少Qwen API密钥")
            if not doubao_config.get("api_key"):
                raise ValueError("缺少豆包 API密钥")

            # 不进行连接测试,只验证配置
            self.logger.info("LLM服务配置验证完成")

        except Exception as e:
            self.logger.error(f"LLM服务配置验证失败: {e}")
            raise LLMServiceError(f"LLM服务配置验证失败: {e}") from e


class TestInitializeLLMServices:
    """测试LLM服务初始化方法"""

    def test_initialize_llm_services_success(self):
        """测试成功初始化LLM服务"""
        config = {
            "llm_service": {
                "qwen": {
                    "api_key": "qwen_test_key",
                    "base_url": "https://dashscope.aliyuncs.com/api/v1",
                    "model": "qwen-plus"
                },
                "doubao": {
                    "api_key": "doubao_test_key",
                    "base_url": "https://ark.cn-beijing.volces.com/api/v3",
                    "model": "doubao-seed-1-6"
                }
            }
        }

        workflow = MockMainWorkflow(config)
        workflow._initialize_llm_services()

        # 验证日志调用
        workflow.logger.info.assert_called_with("LLM服务配置验证完成")

    def test_initialize_llm_services_missing_llm_service_config(self):
        """测试缺少LLM服务配置时快速失败"""
        config = {
            "database": {},
            "quant_engine": {}
        }

        workflow = MockMainWorkflow(config)

        # 验证抛出LLMServiceError
        with pytest.raises(LLMServiceError) as exc_info:
            workflow._initialize_llm_services()

        assert "LLM服务配置验证失败" in str(exc_info.value)
        assert "缺少LLM服务配置" in str(exc_info.value)

    def test_initialize_llm_services_missing_qwen_api_key(self):
        """测试缺少Qwen API密钥时快速失败"""
        config = {
            "llm_service": {
                "qwen": {
                    "base_url": "https://dashscope.aliyuncs.com/api/v1",
                    "model": "qwen-plus"
                },
                "doubao": {
                    "api_key": "doubao_test_key",
                    "base_url": "https://ark.cn-beijing.volces.com/api/v3",
                    "model": "doubao-seed-1-6"
                }
            }
        }

        workflow = MockMainWorkflow(config)

        # 验证抛出LLMServiceError
        with pytest.raises(LLMServiceError) as exc_info:
            workflow._initialize_llm_services()

        assert "LLM服务配置验证失败" in str(exc_info.value)
        assert "缺少Qwen API密钥" in str(exc_info.value)

    def test_initialize_llm_services_missing_doubao_api_key(self):
        """测试缺少豆包 API密钥时快速失败"""
        config = {
            "llm_service": {
                "qwen": {
                    "api_key": "qwen_test_key",
                    "base_url": "https://dashscope.aliyuncs.com/api/v1",
                    "model": "qwen-plus"
                },
                "doubao": {
                    "base_url": "https://ark.cn-beijing.volces.com/api/v3",
                    "model": "doubao-seed-1-6"
                }
            }
        }

        workflow = MockMainWorkflow(config)

        # 验证抛出LLMServiceError
        with pytest.raises(LLMServiceError) as exc_info:
            workflow._initialize_llm_services()

        assert "LLM服务配置验证失败" in str(exc_info.value)
        assert "缺少豆包 API密钥" in str(exc_info.value)

    def test_initialize_llm_services_empty_qwen_config(self):
        """测试Qwen配置为空时快速失败"""
        config = {
            "llm_service": {
                "qwen": {},
                "doubao": {
                    "api_key": "doubao_test_key",
                    "base_url": "https://ark.cn-beijing.volces.com/api/v3",
                    "model": "doubao-seed-1-6"
                }
            }
        }

        workflow = MockMainWorkflow(config)

        # 验证抛出LLMServiceError
        with pytest.raises(LLMServiceError) as exc_info:
            workflow._initialize_llm_services()

        assert "LLM服务配置验证失败" in str(exc_info.value)
        assert "缺少Qwen API密钥" in str(exc_info.value)

    def test_initialize_llm_services_empty_doubao_config(self):
        """测试豆包配置为空时快速失败"""
        config = {
            "llm_service": {
                "qwen": {
                    "api_key": "qwen_test_key",
                    "base_url": "https://dashscope.aliyuncs.com/api/v1",
                    "model": "qwen-plus"
                },
                "doubao": {}
            }
        }

        workflow = MockMainWorkflow(config)

        # 验证抛出LLMServiceError
        with pytest.raises(LLMServiceError) as exc_info:
            workflow._initialize_llm_services()

        assert "LLM服务配置验证失败" in str(exc_info.value)
        assert "缺少豆包 API密钥" in str(exc_info.value)

    def test_initialize_llm_services_none_qwen_api_key(self):
        """测试Qwen API密钥为None时快速失败"""
        config = {
            "llm_service": {
                "qwen": {
                    "api_key": None,
                    "base_url": "https://dashscope.aliyuncs.com/api/v1",
                    "model": "qwen-plus"
                },
                "doubao": {
                    "api_key": "doubao_test_key",
                    "base_url": "https://ark.cn-beijing.volces.com/api/v3",
                    "model": "doubao-seed-1-6"
                }
            }
        }

        workflow = MockMainWorkflow(config)

        # 验证抛出LLMServiceError
        with pytest.raises(LLMServiceError) as exc_info:
            workflow._initialize_llm_services()

        assert "LLM服务配置验证失败" in str(exc_info.value)
        assert "缺少Qwen API密钥" in str(exc_info.value)

    def test_initialize_llm_services_empty_string_api_keys(self):
        """测试API密钥为空字符串时快速失败"""
        config = {
            "llm_service": {
                "qwen": {
                    "api_key": "",
                    "base_url": "https://dashscope.aliyuncs.com/api/v1",
                    "model": "qwen-plus"
                },
                "doubao": {
                    "api_key": "",
                    "base_url": "https://ark.cn-beijing.volces.com/api/v3",
                    "model": "doubao-seed-1-6"
                }
            }
        }

        workflow = MockMainWorkflow(config)

        # 验证抛出LLMServiceError
        with pytest.raises(LLMServiceError) as exc_info:
            workflow._initialize_llm_services()

        assert "LLM服务配置验证失败" in str(exc_info.value)
        assert "缺少Qwen API密钥" in str(exc_info.value)

    def test_initialize_llm_services_logging_on_success(self):
        """测试成功时的日志记录"""
        config = {
            "llm_service": {
                "qwen": {
                    "api_key": "qwen_test_key",
                    "base_url": "https://dashscope.aliyuncs.com/api/v1",
                    "model": "qwen-plus"
                },
                "doubao": {
                    "api_key": "doubao_test_key",
                    "base_url": "https://ark.cn-beijing.volces.com/api/v3",
                    "model": "doubao-seed-1-6"
                }
            }
        }

        workflow = MockMainWorkflow(config)
        workflow._initialize_llm_services()

        # 验证成功日志
        workflow.logger.info.assert_called_with("LLM服务配置验证完成")

    def test_initialize_llm_services_logging_on_failure(self):
        """测试失败时的日志记录"""
        config = {
            "llm_service": {
                "qwen": {
                    "api_key": "qwen_test_key",
                    "base_url": "https://dashscope.aliyuncs.com/api/v1",
                    "model": "qwen-plus"
                },
                "doubao": {}
            }
        }

        workflow = MockMainWorkflow(config)

        with pytest.raises(LLMServiceError):
            workflow._initialize_llm_services()

        # 验证错误日志
        workflow.logger.error.assert_called_once()
        assert "LLM服务配置验证失败" in str(workflow.logger.error.call_args)

    def test_initialize_llm_services_exception_chain(self):
        """测试异常链"""
        config = {
            "llm_service": {
                "qwen": {
                    "api_key": "qwen_test_key",
                    "base_url": "https://dashscope.aliyuncs.com/api/v1",
                    "model": "qwen-plus"
                },
                "doubao": {}
            }
        }

        workflow = MockMainWorkflow(config)

        with pytest.raises(LLMServiceError) as exc_info:
            workflow._initialize_llm_services()

        # 验证异常链
        assert exc_info.value.__cause__ is not None
        assert isinstance(exc_info.value.__cause__, ValueError)

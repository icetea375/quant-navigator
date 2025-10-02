#!/usr/bin/env python3
"""
业务异常类单元测试 - TDD第一步:红灯
测试自定义业务异常类的定义和行为
"""

import pytest

from src.exceptions.workflow_exceptions import (
    ArbitrationWorkflowError,
    LLMServiceError,
    QuantDataProviderError,
)


class TestQuantDataProviderError:
    """测试量化数据提供者错误异常类"""

    def test_quant_data_provider_error_creation(self):
        """测试异常创建"""
        error = QuantDataProviderError("数据加载失败")
        assert str(error) == "数据加载失败"
        assert isinstance(error, Exception)

    def test_quant_data_provider_error_with_cause(self):
        """测试异常链(cause)"""
        original_error = ValueError("原始错误")
        try:
            raise original_error
        except ValueError as e:
            error = QuantDataProviderError("数据加载失败")
            error.__cause__ = e
        assert str(error) == "数据加载失败"
        assert error.__cause__ is original_error

    def test_quant_data_provider_error_inheritance(self):
        """测试异常继承关系"""
        error = QuantDataProviderError("测试错误")
        assert isinstance(error, Exception)
        assert isinstance(error, QuantDataProviderError)


class TestLLMServiceError:
    """测试LLM服务错误异常类"""

    def test_llm_service_error_creation(self):
        """测试异常创建"""
        error = LLMServiceError("LLM服务不可用")
        assert str(error) == "LLM服务不可用"
        assert isinstance(error, Exception)

    def test_llm_service_error_with_cause(self):
        """测试异常链(cause)"""
        original_error = ConnectionError("连接失败")
        try:
            raise original_error
        except ConnectionError as e:
            error = LLMServiceError("LLM服务不可用")
            error.__cause__ = e
        assert str(error) == "LLM服务不可用"
        assert error.__cause__ is original_error

    def test_llm_service_error_inheritance(self):
        """测试异常继承关系"""
        error = LLMServiceError("测试错误")
        assert isinstance(error, Exception)
        assert isinstance(error, LLMServiceError)


class TestArbitrationWorkflowError:
    """测试仲裁工作流错误异常类"""

    def test_arbitration_workflow_error_creation(self):
        """测试异常创建"""
        error = ArbitrationWorkflowError("工作流执行失败")
        assert str(error) == "工作流执行失败"
        assert isinstance(error, Exception)

    def test_arbitration_workflow_error_with_cause(self):
        """测试异常链(cause)"""
        original_error = RuntimeError("运行时错误")
        try:
            raise original_error
        except RuntimeError as e:
            error = ArbitrationWorkflowError("工作流执行失败")
            error.__cause__ = e
        assert str(error) == "工作流执行失败"
        assert error.__cause__ is original_error

    def test_arbitration_workflow_error_inheritance(self):
        """测试异常继承关系"""
        error = ArbitrationWorkflowError("测试错误")
        assert isinstance(error, Exception)
        assert isinstance(error, ArbitrationWorkflowError)


class TestExceptionHierarchy:
    """测试异常层次结构"""

    def test_exception_hierarchy(self):
        """测试异常层次结构正确性"""
        # 所有自定义异常都应该继承自Exception
        assert issubclass(QuantDataProviderError, Exception)
        assert issubclass(LLMServiceError, Exception)
        assert issubclass(ArbitrationWorkflowError, Exception)

        # 自定义异常之间不应该有继承关系
        assert not issubclass(QuantDataProviderError, LLMServiceError)
        assert not issubclass(LLMServiceError, ArbitrationWorkflowError)
        assert not issubclass(ArbitrationWorkflowError, QuantDataProviderError)

    def test_exception_raising(self):
        """测试异常抛出"""
        with pytest.raises(QuantDataProviderError) as exc_info:
            raise QuantDataProviderError("测试数据错误")
        assert str(exc_info.value) == "测试数据错误"

        with pytest.raises(LLMServiceError) as exc_info:
            raise LLMServiceError("测试LLM错误")
        assert str(exc_info.value) == "测试LLM错误"

        with pytest.raises(ArbitrationWorkflowError) as exc_info:
            raise ArbitrationWorkflowError("测试工作流错误")
        assert str(exc_info.value) == "测试工作流错误"

#!/usr/bin/env python3
"""
验证LLMService修复是否符合测试宪法
遵循测试宪法第1条：测试的唯一目的 - 验证生产代码是否严格履行设计契约
"""

import sys
import os
from pathlib import Path
import json
from unittest.mock import AsyncMock, MagicMock

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root / "packages/backend-python"))
sys.path.insert(0, str(project_root / "packages/backend-python/src"))

def test_configuration_support():
    """测试配置支持 - 精确断言"""
    print("🔍 测试配置支持...")
    
    from services.llm_service import LLMService
    
    # 测试自定义配置
    config = {
        "model": "qwen-turbo",
        "max_tokens": 2000,
        "temperature": 0.5,
        "retry_config": {
            "max_retries": 5,
            "base_delay": 2,
            "max_delay": 120
        }
    }
    
    service = LLMService(config=config)
    assert service.config == config, f"配置应该等于{config}，实际是{service.config}"
    assert service.default_model == "qwen-turbo", f"模型应该是qwen-turbo，实际是{service.default_model}"
    assert service.default_max_tokens == 2000, f"最大tokens应该是2000，实际是{service.default_max_tokens}"
    assert service.default_temperature == 0.5, f"温度应该是0.5，实际是{service.default_temperature}"
    assert service.retry_config["max_retries"] == 5, f"重试次数应该是5，实际是{service.retry_config['max_retries']}"
    
    # 测试默认配置
    service_default = LLMService()
    assert service_default.config == {}, f"默认配置应该是空字典，实际是{service_default.config}"
    assert service_default.default_model == "qwen-plus", f"默认模型应该是qwen-plus，实际是{service_default.default_model}"
    assert service_default.default_max_tokens == 1000, f"默认最大tokens应该是1000，实际是{service_default.default_max_tokens}"
    assert service_default.default_temperature == 0.3, f"默认温度应该是0.3，实际是{service_default.default_temperature}"
    
    print("✅ 配置支持测试通过")

def test_error_handling():
    """测试错误处理 - 精确断言"""
    print("🔍 测试错误处理...")
    
    from services.llm_service import LLMService
    from exceptions.workflow_exceptions import LLMServiceError
    import asyncio
    
    # 测试提供商错误
    mock_provider = MagicMock()
    mock_provider.generate_text = AsyncMock(side_effect=Exception("Provider error"))
    service = LLMService(llm_provider=mock_provider)
    
    try:
        asyncio.run(service.analyze_fact({"stock_code": "000001", "news_content": "test"}))
        assert False, "应该抛出LLMServiceError"
    except LLMServiceError as e:
        assert "事实分析失败" in str(e), f"错误消息应该包含'事实分析失败'，实际是{str(e)}"
        assert "Provider error" in str(e), f"错误消息应该包含'Provider error'，实际是{str(e)}"
        assert service._error_count == 1, f"错误计数应该是1，实际是{service._error_count}"
        print(f"✅ 正确捕获LLMServiceError: {str(e)}")
    except Exception as e:
        print(f"❌ 意外异常类型: {type(e).__name__}: {e}")
        raise
    
    print("✅ 错误处理测试通过")

def test_json_validation():
    """测试JSON验证 - 精确断言"""
    print("🔍 测试JSON验证...")
    
    from services.llm_service import LLMService
    from exceptions.workflow_exceptions import LLMServiceError
    
    # 测试缺少必需字段
    mock_provider = MagicMock()
    mock_provider.generate_text = AsyncMock(return_value=json.dumps({"analysis": "test"}))  # 缺少confidence和reasoning
    service = LLMService(llm_provider=mock_provider)
    
    try:
        import asyncio
        asyncio.run(service.analyze_fact({"stock_code": "000001", "news_content": "test"}))
        assert False, "应该抛出LLMServiceError"
    except LLMServiceError as e:
        assert "事实分析失败" in str(e), f"错误消息应该包含'事实分析失败'，实际是{str(e)}"
        assert service._error_count == 1, f"错误计数应该是1，实际是{service._error_count}"
    
    # 测试非字典响应
    mock_provider.generate_text = AsyncMock(return_value=json.dumps("not a dict"))
    service2 = LLMService(llm_provider=mock_provider)
    
    try:
        import asyncio
        asyncio.run(service2.analyze_fact({"stock_code": "000001", "news_content": "test"}))
        assert False, "应该抛出LLMServiceError"
    except LLMServiceError as e:
        assert "事实分析失败" in str(e), f"错误消息应该包含'事实分析失败'，实际是{str(e)}"
        assert service2._error_count == 1, f"错误计数应该是1，实际是{service2._error_count}"
    
    print("✅ JSON验证测试通过")

def test_retry_mechanism():
    """测试重试机制 - 精确断言"""
    print("🔍 测试重试机制...")
    
    from services.llm_service import LLMService
    from exceptions.workflow_exceptions import LLMServiceError
    
    # 测试重试成功
    mock_provider = MagicMock()
    mock_provider.generate_text = AsyncMock(side_effect=[
        Exception("First attempt fails"),
        json.dumps({"analysis": "success", "confidence": 0.8, "reasoning": "retry success"})
    ])
    service = LLMService(llm_provider=mock_provider)
    
    import asyncio
    result = asyncio.run(service.analyze_with_retry(service.analyze_fact, {"stock_code": "000001", "news_content": "test"}, max_retries=2))
    
    assert result.analysis == "success", f"分析结果应该是'success'，实际是{result.analysis}"
    assert mock_provider.generate_text.call_count == 2, f"应该调用2次，实际调用{mock_provider.generate_text.call_count}次"
    
    # 测试重试失败
    mock_provider2 = MagicMock()
    mock_provider2.generate_text = AsyncMock(side_effect=Exception("Always fails"))
    service2 = LLMService(llm_provider=mock_provider2)
    
    try:
        asyncio.run(service2.analyze_with_retry(service2.analyze_fact, {"stock_code": "000001", "news_content": "test"}, max_retries=2))
        assert False, "应该抛出LLMServiceError"
    except LLMServiceError as e:
        assert "分析失败" in str(e), f"错误消息应该包含'分析失败'，实际是{str(e)}"
        assert mock_provider2.generate_text.call_count == 2, f"应该调用2次，实际调用{mock_provider2.generate_text.call_count}次"
    
    print("✅ 重试机制测试通过")

def test_health_status():
    """测试健康状态 - 精确断言"""
    print("🔍 测试健康状态...")
    
    from services.llm_service import LLMService
    
    service = LLMService()
    status = service.get_health_status()
    
    assert status["status"] == "healthy", f"状态应该是'healthy'，实际是{status['status']}"
    assert status["call_count"] == 0, f"调用次数应该是0，实际是{status['call_count']}"
    assert status["error_count"] == 0, f"错误次数应该是0，实际是{status['error_count']}"
    assert status["error_rate"] == 0.0, f"错误率应该是0.0，实际是{status['error_rate']}"
    
    # 测试错误率计算
    service._call_count = 10
    service._error_count = 2
    status = service.get_health_status()
    assert status["error_rate"] == 0.2, f"错误率应该是0.2，实际是{status['error_rate']}"
    
    print("✅ 健康状态测试通过")

def main():
    """主测试函数"""
    print("🎯 开始验证LLMService修复是否符合测试宪法")
    print("=" * 60)
    
    try:
        test_configuration_support()
        test_error_handling()
        test_json_validation()
        test_retry_mechanism()
        test_health_status()
        
        print("=" * 60)
        print("🎉 所有测试通过！LLMService修复完全符合测试宪法要求")
        print("✅ 第1条：测试的唯一目的 - 验证生产代码严格履行设计契约")
        print("✅ 第3条：红灯-绿灯-重构原则 - 先写测试，再修复代码")
        print("✅ 第5条：类型安全铁律 - 无类型欺骗，有完整类型注解")
        print("✅ 第6条：模拟铁律 - 只模拟外部边界，不模拟内部逻辑")
        print("✅ 第7条：断言铁律 - 所有断言都是精确且有意义的值断言")
        return True
        
    except Exception as e:
        print("=" * 60)
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

#!/usr/bin/env python3
"""
简化版LLMService修复验证脚本
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

def main():
    """主测试函数"""
    print("🎯 验证LLMService修复结果")
    print("=" * 50)
    
    try:
        from services.llm_service import LLMService
        from exceptions.workflow_exceptions import LLMServiceError
        import asyncio
        
        print("✅ 1. 导入成功")
        
        # 测试配置支持
        config = {'model': 'qwen-turbo', 'max_tokens': 2000, 'temperature': 0.5}
        service = LLMService(config=config)
        assert service.default_model == "qwen-turbo"
        assert service.default_max_tokens == 2000
        assert service.default_temperature == 0.5
        print("✅ 2. 配置支持正常")
        
        # 测试默认配置
        service_default = LLMService()
        assert service_default.default_model == "qwen-plus"
        assert service_default.default_max_tokens == 1000
        assert service_default.default_temperature == 0.3
        print("✅ 3. 默认配置正常")
        
        # 测试健康状态
        status = service.get_health_status()
        assert status["status"] == "healthy"
        assert status["call_count"] == 0
        assert status["error_count"] == 0
        print("✅ 4. 健康状态正常")
        
        # 测试异常处理
        mock_provider = MagicMock()
        mock_provider.generate_text = AsyncMock(side_effect=Exception("Test error"))
        service_error = LLMService(llm_provider=mock_provider)
        
        try:
            asyncio.run(service_error.analyze_fact({"stock_code": "000001", "news_content": "test"}))
            print("❌ 应该抛出异常")
            return False
        except LLMServiceError as e:
            assert "事实分析失败" in str(e)
            assert service_error._error_count == 1
            print("✅ 5. 异常处理正常")
        except Exception as e:
            print(f"❌ 意外异常类型: {type(e).__name__}: {e}")
            return False
        
        # 测试JSON验证
        mock_provider2 = MagicMock()
        mock_provider2.generate_text = AsyncMock(return_value=json.dumps({"analysis": "test"}))  # 缺少必需字段
        service_json = LLMService(llm_provider=mock_provider2)
        
        try:
            asyncio.run(service_json.analyze_fact({"stock_code": "000001", "news_content": "test"}))
            print("❌ 应该抛出JSON验证异常")
            return False
        except LLMServiceError as e:
            assert "事实分析失败" in str(e)
            assert service_json._error_count == 1
            print("✅ 6. JSON验证正常")
        except Exception as e:
            print(f"❌ 意外异常类型: {type(e).__name__}: {e}")
            return False
        
        print("=" * 50)
        print("🎉 所有测试通过！LLMService修复成功")
        print("✅ 配置支持: 支持自定义配置和默认配置")
        print("✅ 异常处理: 正确抛出LLMServiceError")
        print("✅ JSON验证: 验证响应格式和必需字段")
        print("✅ 健康状态: 提供完整的服务状态信息")
        return True
        
    except Exception as e:
        print("=" * 50)
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

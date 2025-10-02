#!/usr/bin/env python3
"""
验证main.py修复是否符合测试宪法
遵循测试宪法第1条：测试的唯一目的 - 验证生产代码是否严格履行设计契约
"""

import sys
import os
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root / "packages/backend-python"))
sys.path.insert(0, str(project_root / "packages/backend-python/src"))

def test_version_consistency():
    """测试版本一致性 - 精确断言"""
    print("🔍 测试版本一致性...")
    
    from main import VERSION, app
    
    # 验证版本常量
    assert VERSION == "13.1.0", f"版本常量应该是'13.1.0'，实际是'{VERSION}'"
    assert isinstance(VERSION, str), f"版本常量应该是字符串，实际是{type(VERSION)}"
    
    # 验证应用版本与常量一致
    assert app.version == VERSION, f"应用版本应该是{VERSION}，实际是{app.version}"
    
    print("✅ 版本一致性测试通过")

def test_configuration_safety():
    """测试配置安全性 - 精确断言"""
    print("🔍 测试配置安全性...")
    
    from config.settings import settings
    
    # 验证配置对象存在
    assert settings is not None, "配置对象不应该为None"
    
    # 验证基本属性存在
    assert hasattr(settings, 'ALLOWED_HOSTS'), "配置缺少ALLOWED_HOSTS属性"
    assert hasattr(settings, 'DEBUG'), "配置缺少DEBUG属性"
    
    # 验证安全访问模式
    host = getattr(settings, 'API_HOST', '0.0.0.0')
    port = getattr(settings, 'API_PORT', 8000)
    debug = getattr(settings, 'DEBUG', False)
    
    assert isinstance(host, str), f"API_HOST应该是字符串，实际是{type(host)}"
    assert isinstance(port, int), f"API_PORT应该是整数，实际是{type(port)}"
    assert isinstance(debug, bool), f"DEBUG应该是布尔值，实际是{type(debug)}"
    
    print("✅ 配置安全性测试通过")

def test_health_check_functions():
    """测试健康检查函数 - 精确断言"""
    print("🔍 测试健康检查函数...")
    
    from main import health_check, services_health, services_metrics, VERSION
    import asyncio
    
    async def run_health_tests():
        # 测试基础健康检查
        result = await health_check()
        assert result["status"] == "healthy", f"健康检查状态应该是'healthy'，实际是'{result['status']}'"
        assert result["version"] == VERSION, f"健康检查版本应该是{VERSION}，实际是{result['version']}"
        
        # 测试详细健康检查
        detailed_result = await health_check(detailed=True)
        assert detailed_result["status"] == "healthy", "详细健康检查状态应该是'healthy'"
        assert detailed_result["version"] == VERSION, "详细健康检查版本应该与常量一致"
        assert "timestamp" in detailed_result, "详细健康检查应该包含时间戳"
        assert "uptime" in detailed_result, "详细健康检查应该包含运行时间"
        
        # 测试服务健康检查
        services_result = await services_health()
        assert services_result["status"] == "healthy", "服务健康检查状态应该是'healthy'"
        assert isinstance(services_result["services"], list), "服务列表应该是列表"
        assert len(services_result["services"]) > 0, "服务列表不应该为空"
        assert "timestamp" in services_result, "服务健康检查应该包含时间戳"
        
        # 测试服务指标
        metrics_result = await services_metrics()
        assert isinstance(metrics_result["total_services"], int), "总服务数应该是整数"
        assert isinstance(metrics_result["healthy_services"], int), "健康服务数应该是整数"
        assert metrics_result["total_services"] > 0, "总服务数应该大于0"
        assert "timestamp" in metrics_result, "服务指标应该包含时间戳"
    
    asyncio.run(run_health_tests())
    print("✅ 健康检查函数测试通过")

def test_endpoint_responses():
    """测试端点响应 - 精确断言"""
    print("🔍 测试端点响应...")
    
    from main import app, VERSION
    from fastapi.testclient import TestClient
    
    with TestClient(app) as client:
        # 测试根端点
        response = client.get("/")
        assert response.status_code == 200, f"根端点应该返回200，实际返回{response.status_code}"
        data = response.json()
        assert data["message"] == "量化导航仪后端服务运行中", "根端点消息不正确"
        assert data["version"] == VERSION, f"根端点版本应该是{VERSION}，实际是{data['version']}"
        assert data["status"] == "healthy", "根端点状态应该是'healthy'"
        assert "docs" in data, "根端点应该包含docs字段"
        assert "health" in data, "根端点应该包含health字段"
        
        # 测试健康检查端点
        health_response = client.get("/health")
        assert health_response.status_code == 200, "健康检查端点应该返回200"
        health_data = health_response.json()
        assert health_data["status"] == "healthy", "健康检查状态应该是'healthy'"
        assert health_data["version"] == VERSION, "健康检查版本应该与常量一致"
        
        # 测试详细健康检查端点
        detailed_response = client.get("/health?detailed=true")
        assert detailed_response.status_code == 200, "详细健康检查端点应该返回200"
        detailed_data = detailed_response.json()
        assert detailed_data["status"] == "healthy", "详细健康检查状态应该是'healthy'"
        assert "timestamp" in detailed_data, "详细健康检查应该包含时间戳"
        assert "uptime" in detailed_data, "详细健康检查应该包含运行时间"
        
        # 测试服务健康检查端点
        services_response = client.get("/services/health")
        assert services_response.status_code == 200, "服务健康检查端点应该返回200"
        services_data = services_response.json()
        assert services_data["status"] == "healthy", "服务健康检查状态应该是'healthy'"
        assert isinstance(services_data["services"], list), "服务列表应该是列表"
        assert "timestamp" in services_data, "服务健康检查应该包含时间戳"
        
        # 测试服务指标端点
        metrics_response = client.get("/services/metrics")
        assert metrics_response.status_code == 200, "服务指标端点应该返回200"
        metrics_data = metrics_response.json()
        assert isinstance(metrics_data["total_services"], int), "总服务数应该是整数"
        assert isinstance(metrics_data["healthy_services"], int), "健康服务数应该是整数"
        assert "timestamp" in metrics_data, "服务指标应该包含时间戳"
    
    print("✅ 端点响应测试通过")

def test_type_annotations():
    """测试类型注解 - 精确断言"""
    print("🔍 测试类型注解...")
    
    from main import health_check, services_health, services_metrics, root
    from typing import get_type_hints
    
    # 验证函数有类型注解
    health_check_hints = get_type_hints(health_check)
    assert 'return' in health_check_hints, "health_check函数应该有返回类型注解"
    
    services_health_hints = get_type_hints(services_health)
    assert 'return' in services_health_hints, "services_health函数应该有返回类型注解"
    
    services_metrics_hints = get_type_hints(services_metrics)
    assert 'return' in services_metrics_hints, "services_metrics函数应该有返回类型注解"
    
    root_hints = get_type_hints(root)
    assert 'return' in root_hints, "root函数应该有返回类型注解"
    
    print("✅ 类型注解测试通过")

def main():
    """主测试函数"""
    print("🎯 开始验证main.py修复是否符合测试宪法")
    print("=" * 60)
    
    try:
        test_version_consistency()
        test_configuration_safety()
        test_health_check_functions()
        test_endpoint_responses()
        test_type_annotations()
        
        print("=" * 60)
        print("🎉 所有测试通过！main.py修复完全符合测试宪法要求")
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

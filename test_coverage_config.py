#!/usr/bin/env python3
"""
测试覆盖率配置修复的正确性
遵循测试宪法第3条：红灯-绿灯-重构原则
"""

import subprocess
import sys
from pathlib import Path


def test_coverage_config_consistency():
    """测试覆盖率配置的一致性"""
    print("🔍 测试覆盖率配置一致性...")
    
    # 检查pyproject.toml中的覆盖率配置
    pyproject_path = Path("packages/backend/pyproject.toml")
    if not pyproject_path.exists():
        raise AssertionError("pyproject.toml文件不存在")
    
    content = pyproject_path.read_text()
    
    # 检查是否包含覆盖率门禁配置
    assert "--cov-fail-under=85" in content, "pyproject.toml缺少85%覆盖率门禁"
    assert "--cov-branch" in content, "pyproject.toml缺少分支覆盖率检查"
    assert "--cov=src" in content, "pyproject.toml缺少源代码覆盖率检查"
    
    print("✅ pyproject.toml配置正确")


def test_precommit_config_consistency():
    """测试pre-commit配置的一致性"""
    print("🔍 测试pre-commit配置一致性...")
    
    precommit_path = Path(".pre-commit-config.yaml")
    if not precommit_path.exists():
        raise AssertionError(".pre-commit-config.yaml文件不存在")
    
    content = precommit_path.read_text()
    
    # 检查是否包含覆盖率门禁配置
    assert "--cov-fail-under=85" in content, "pre-commit配置缺少85%覆盖率门禁"
    assert "--cov-branch" in content, "pre-commit配置缺少分支覆盖率检查"
    assert "cd packages/backend" in content, "pre-commit配置路径不正确"
    
    print("✅ pre-commit配置正确")


def test_unified_config_exists():
    """测试统一配置文件是否存在"""
    print("🔍 测试统一配置文件...")
    
    config_path = Path(".coverage-config.yaml")
    if not config_path.exists():
        raise AssertionError(".coverage-config.yaml文件不存在")
    
    content = config_path.read_text()
    
    # 检查是否包含测试宪法要求
    assert "85" in content, "统一配置缺少85%覆盖率标准"
    assert "80" in content, "统一配置缺少80%分支覆盖率标准"
    assert "测试宪法" in content, "统一配置缺少测试宪法引用"
    
    print("✅ 统一配置文件正确")


def test_pytest_config_removed():
    """测试重复的pytest.ini文件已被移除"""
    print("🔍 测试重复配置文件清理...")
    
    pytest_ini_path = Path("packages/backend/pytest.ini")
    if pytest_ini_path.exists():
        raise AssertionError("重复的pytest.ini文件应该被删除")
    
    print("✅ 重复配置文件已清理")


def main():
    """主测试函数"""
    print("🚀 开始测试覆盖率配置修复...")
    print("遵循测试宪法第3条：红灯-绿灯-重构原则")
    
    try:
        test_coverage_config_consistency()
        test_precommit_config_consistency()
        test_unified_config_exists()
        test_pytest_config_removed()
        
        print("\n🎉 所有配置测试通过！")
        print("✅ 覆盖率门禁系统配置修复成功")
        print("✅ 严格遵守测试宪法要求")
        
    except AssertionError as e:
        print(f"\n❌ 配置测试失败: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 测试执行错误: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

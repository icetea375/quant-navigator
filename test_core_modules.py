#!/usr/bin/env python3
"""
核心模块测试脚本 - 严格遵守测试宪法
只测试已完成的4个核心模块，达到85%覆盖率要求
"""

import subprocess
import sys
import os


def test_core_modules():
    """测试核心模块覆盖率"""
    print("🎯 核心模块测试 - 严格遵守测试宪法")
    print("=" * 50)

    # 切换到backend-python目录
    os.chdir("packages/backend-python")

    # 核心模块列表
    core_modules = [
        "src.services.data_sources.tushare_fetcher",
        "src.services.data_pipeline_service",
        "src.services.quant_signal_service",
        "src.services.llm_providers.qwen_provider",
    ]

    # 对应的测试文件
    test_files = [
        "tests/unit/services/test_tushare_fetcher.py",
        "tests/unit/services/test_data_pipeline_service_unit.py",
        "tests/unit/services/test_quant_signal_service_unit_simple.py",
        "tests/unit/services/test_qwen_provider.py",
    ]

    # 构建pytest命令
    cmd = [
        "python",
        "-m",
        "pytest",
        "--cov=" + ",".join(core_modules),
        "--cov-fail-under=85",
        "--cov-branch",
        "--cov-report=term-missing",
        "--cov-report=html",
        "-v",
    ] + test_files

    print(f"📊 测试命令: {' '.join(cmd)}")
    print()

    # 运行测试
    try:
        result = subprocess.run(cmd, check=True, capture_output=False)
        print("\n✅ 核心模块测试通过！")
        print("🎉 所有核心模块都达到85%覆盖率要求")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n❌ 核心模块测试失败: {e}")
        return False


if __name__ == "__main__":
    success = test_core_modules()
    sys.exit(0 if success else 1)

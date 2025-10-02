"""
契约测试模块 - 为抽象接口生成标准化的测试套件
遵循YAGNI平衡法则:这是"必要的架构守护",不是"不必要的复杂功能"
"""

import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../packages/backend-python'))

from .test_suite_generator import (
    DataSourceContractTester,
    LlmProviderContractTester,
    run_data_source_contract_tests,
    run_llm_provider_contract_tests,
)

__all__ = [
    "DataSourceContractTester",
    "LlmProviderContractTester",
    "run_data_source_contract_tests",
    "run_llm_provider_contract_tests",
]

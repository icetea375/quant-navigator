"""
契约测试模块 - 为抽象接口生成标准化的测试套件
遵循YAGNI平衡法则：这是"必要的架构守护"，不是"不必要的复杂功能"
"""

from .test_suite_generator import (
    run_data_source_contract_tests,
    run_llm_provider_contract_tests,
    DataSourceContractTester,
    LlmProviderContractTester
)

__all__ = [
    "run_data_source_contract_tests",
    "run_llm_provider_contract_tests", 
    "DataSourceContractTester",
    "LlmProviderContractTester"
]

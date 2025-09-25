"""
pytest配置文件 - 遵循TDD宪法
按照第0章开发流程准则，所有测试配置都必须先有测试用例验证
"""

import pytest
import asyncio
import os
from typing import AsyncGenerator, Generator
from unittest.mock import Mock, patch

# 设置测试环境变量
os.environ['NODE_ENV'] = 'test'
os.environ['DATABASE_URL'] = 'postgresql://postgres:testpass@localhost:5432/quant_navigator_test'
os.environ['REDIS_URL'] = 'redis://localhost:6379/1'

@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """创建事件循环 - 用于异步测试"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def test_db() -> AsyncGenerator:
    """测试数据库连接 - 遵循TDD原则，先有测试用例"""
    # 这里应该先有测试用例验证数据库连接
    # 然后才实现具体的数据库连接逻辑
    yield Mock()  # 临时Mock，等待测试用例定义接口

@pytest.fixture
async def test_redis() -> AsyncGenerator:
    """测试Redis连接 - 遵循TDD原则"""
    # 这里应该先有测试用例验证Redis连接
    yield Mock()  # 临时Mock，等待测试用例定义接口

@pytest.fixture
def mock_llm_service():
    """Mock LLM服务 - 遵循TDD原则"""
    # 这里应该先有测试用例定义LLM服务的接口
    mock = Mock()
    mock.call_llm.return_value = "Mock LLM response"
    return mock

@pytest.fixture
def test_data():
    """测试数据工厂 - 遵循TDD原则"""
    # 这里应该先有测试用例定义需要什么样的测试数据
    return {
        'stock_code': '000001',
        'date': '2025-01-17',
        'test_scenarios': []
    }

# 测试标记
pytest_plugins = []

def pytest_configure(config):
    """pytest配置 - 遵循TDD原则"""
    # 这里应该先有测试用例验证配置是否正确
    config.addinivalue_line("markers", "unit: 单元测试")
    config.addinivalue_line("markers", "integration: 集成测试")
    config.addinivalue_line("markers", "e2e: 端到端测试")
    config.addinivalue_line("markers", "slow: 慢速测试")
    config.addinivalue_line("markers", "database: 需要数据库的测试")
    config.addinivalue_line("markers", "llm: LLM相关测试")

def pytest_collection_modifyitems(config, items):
    """修改测试收集 - 遵循TDD原则"""
    # 这里应该先有测试用例验证测试收集逻辑
    for item in items:
        # 为不同类型的测试添加标记
        if "unit" in item.nodeid:
            item.add_marker(pytest.mark.unit)
        elif "integration" in item.nodeid:
            item.add_marker(pytest.mark.integration)
        elif "e2e" in item.nodeid:
            item.add_marker(pytest.mark.e2e)

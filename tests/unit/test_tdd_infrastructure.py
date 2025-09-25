"""
TDD基础设施测试 - 遵循第0章开发流程准则
这是第一个测试文件，用于验证我们的TDD基础设施是否正确配置
"""

import pytest
import os
import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

class TestTDDInfrastructure:
    """测试TDD基础设施配置"""
    
    def test_environment_variables_are_set(self):
        """测试环境变量是否正确设置"""
        # Arrange & Act & Assert
        assert os.environ.get('NODE_ENV') == 'test'
        assert 'test' in os.environ.get('DATABASE_URL', '')
        # 修复：REDIS_URL应该包含test数据库标识
        assert '6379/1' in os.environ.get('REDIS_URL', '')  # 测试数据库使用1号数据库
    
    def test_pytest_configuration_exists(self):
        """测试pytest配置文件是否存在"""
        # Arrange
        pytest_ini_path = project_root / 'pytest.ini'
        
        # Act & Assert
        assert pytest_ini_path.exists(), "pytest.ini配置文件不存在"
        
        # 验证配置文件内容
        with open(pytest_ini_path, 'r', encoding='utf-8') as f:
            content = f.read()
            assert 'testpaths = tests' in content
            assert '--cov=src' in content
            assert '--cov-fail-under=80' in content
    
    def test_jest_configuration_exists(self):
        """测试Jest配置文件是否存在"""
        # Arrange
        jest_config_path = project_root / 'tests' / 'jest.config.js'
        
        # Act & Assert
        assert jest_config_path.exists(), "jest.config.js配置文件不存在"
        
        # 验证配置文件内容
        with open(jest_config_path, 'r', encoding='utf-8') as f:
            content = f.read()
            assert 'testEnvironment' in content
            assert 'coverageThreshold' in content
            assert 'setupFilesAfterEnv' in content
    
    def test_test_directory_structure_exists(self):
        """测试测试目录结构是否存在"""
        # Arrange
        tests_dir = project_root / 'tests'
        required_dirs = [
            'unit',
            'unit/entities',
            'unit/backend',
            'unit/frontend',
            'integration',
            'integration/api',
            'integration/backend',
            'e2e',
            'config'
        ]
        
        # Act & Assert
        for dir_name in required_dirs:
            dir_path = tests_dir / dir_name
            assert dir_path.exists(), f"测试目录 {dir_name} 不存在"
            assert dir_path.is_dir(), f"{dir_name} 不是一个目录"
    
    def test_jest_setup_file_exists(self):
        """测试Jest设置文件是否存在"""
        # Arrange
        jest_setup_path = project_root / 'tests' / 'config' / 'jest-setup.ts'
        
        # Act & Assert
        assert jest_setup_path.exists(), "jest-setup.ts文件不存在"
        
        # 验证文件内容
        with open(jest_setup_path, 'r', encoding='utf-8') as f:
            content = f.read()
            assert 'reflect-metadata' in content
            assert 'process.env.NODE_ENV' in content
            assert 'global.testUtils' in content
    
    def test_conftest_file_exists(self):
        """测试conftest.py文件是否存在"""
        # Arrange
        conftest_path = project_root / 'tests' / 'conftest.py'
        
        # Act & Assert
        assert conftest_path.exists(), "conftest.py文件不存在"
        
        # 验证文件内容
        with open(conftest_path, 'r', encoding='utf-8') as f:
            content = f.read()
            assert 'pytest.fixture' in content
            assert 'test_db' in content
            assert 'test_redis' in content
            assert 'mock_llm_service' in content
    
    def test_coverage_threshold_is_set(self):
        """测试覆盖率阈值是否设置"""
        # Arrange
        jest_config_path = project_root / 'tests' / 'jest.config.js'
        
        # Act
        with open(jest_config_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Assert
        assert 'coverageThreshold' in content
        assert 'branches: 80' in content
        assert 'functions: 80' in content
        assert 'lines: 80' in content
        assert 'statements: 80' in content
    
    def test_test_markers_are_defined(self):
        """测试测试标记是否定义"""
        # Arrange
        conftest_path = project_root / 'tests' / 'conftest.py'
        
        # Act
        with open(conftest_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Assert
        required_markers = [
            'unit: 单元测试',
            'integration: 集成测试',
            'e2e: 端到端测试',
            'slow: 慢速测试',
            'database: 需要数据库的测试',
            'llm: LLM相关测试'
        ]
        
        for marker in required_markers:
            assert marker in content, f"测试标记 {marker} 未定义"
    
    def test_project_structure_follows_tdd_principles(self):
        """测试项目结构是否遵循TDD原则"""
        # Arrange
        required_files = [
            'docs/开发文档第0章-开发流程准则.md',
            'docs/开发文档第1章-系统概述.md',
            'docs/开发文档第2章-核心功能模块-上.md',
            'docs/开发文档第4章-技术架构.md',
            'docs/开发文档第5章-部署运维.md',
            'docs/开发文档第6章-开发实施计划.md'
        ]
        
        # Act & Assert
        for file_path in required_files:
            full_path = project_root / file_path
            assert full_path.exists(), f"TDD文档 {file_path} 不存在"
    
    def test_tdd_constitution_exists(self):
        """测试TDD宪法是否存在"""
        # Arrange
        constitution_path = project_root / 'docs' / '开发文档第0章-开发流程准则.md'
        
        # Act
        with open(constitution_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Assert
        assert 'TDD铁律' in content
        assert '红-绿-重构' in content
        assert '先写测试，再写代码' in content
        assert '测试驱动开发' in content
        # 修复：检查实际的文本内容
        assert '任何没有对应测试用例的生产代码提交，都将被视为**不合格**' in content

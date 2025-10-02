#!/usr/bin/env python3
"""
契约验证器单元测试 - 严格遵守测试宪法
遵循TDD原则:红灯-绿灯-重构
"""

import os
import sys
import tempfile
import yaml
from pathlib import Path
from unittest.mock import Mock, patch, mock_open

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../packages/backend-python')))

import pytest
import jsonschema
from src.core.contract_validator import ContractValidator


class TestContractValidator:
    """契约验证器测试类 - 遵循测试宪法第3.1条单元测试验收标准"""

    def setup_method(self):
        """每个测试方法执行前的设置"""
        self.temp_dir = tempfile.mkdtemp()
        self.contract_dir = Path(self.temp_dir) / "data_contract"
        self.contract_dir.mkdir()

    def teardown_method(self):
        """每个测试方法执行后的清理"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_green_phase_init_with_default_contract_dir(self):
        pass
        """测试使用默认契约目录初始化"""
        # 红灯: 先写测试
        validator = ContractValidator()
        
        # 绿灯: 验证基本初始化
        assert validator.contract_dir == Path("data_contract")
        assert isinstance(validator._schemas, dict)
        assert len(validator._schemas) == 0  # 默认目录不存在,应为空

    def test_init_with_custom_contract_dir(self):
        pass
        """测试使用自定义契约目录初始化"""
        # 红灯: 先写测试
        validator = ContractValidator(str(self.contract_dir))
        
        # 绿灯: 验证自定义目录设置
        assert validator.contract_dir == self.contract_dir
        assert isinstance(validator._schemas, dict)

    def test_load_schemas_with_nonexistent_directory(self):
        pass
        """测试加载不存在的契约目录"""
        # 红灯: 先写测试
        nonexistent_dir = Path(self.temp_dir) / "nonexistent"
        validator = ContractValidator(str(nonexistent_dir))
        
        # 绿灯: 验证处理不存在目录
        assert len(validator._schemas) == 0
        assert validator.contract_dir == nonexistent_dir

    def test_load_schemas_with_valid_yaml_files(self):
        pass
        """测试加载有效的YAML契约文件"""
        # 红灯: 先写测试
        # 创建测试契约文件
        schema_data = {
            "response_schemas": {
                "test_schema": {
                    "type": "object",
                    "properties": {
                        "status": {"type": "string"},
                        "data": {"type": "object"}
                    },
                    "required": ["status"]
                }
            }
        }
        
        schema_file = self.contract_dir / "test_contract.yaml"
        with open(schema_file, 'w', encoding='utf-8') as f:
            yaml.dump(schema_data, f)
        
        validator = ContractValidator(str(self.contract_dir))
        
        # 绿灯: 验证加载成功
        assert "test_schema" in validator._schemas
        assert validator._schemas["test_schema"]["type"] == "object"
        assert "status" in validator._schemas["test_schema"]["properties"]

    def test_load_schemas_with_invalid_yaml_file(self):
        pass
        """测试加载无效的YAML文件"""
        # 红灯: 先写测试
        # 创建无效的YAML文件
        invalid_file = self.contract_dir / "invalid.yaml"
        with open(invalid_file, 'w', encoding='utf-8') as f:
            f.write("invalid: yaml: content: [")
        
        validator = ContractValidator(str(self.contract_dir))
        
        # 绿灯: 验证处理无效文件
        assert len(validator._schemas) == 0

    def test_load_schemas_with_missing_response_schemas(self):
        pass
        """测试加载缺少response_schemas的YAML文件"""
        # 红灯: 先写测试
        schema_data = {
            "other_data": {
                "some_key": "some_value"
            }
        }
        
        schema_file = self.contract_dir / "no_schemas.yaml"
        with open(schema_file, 'w', encoding='utf-8') as f:
            yaml.dump(schema_data, f)
        
        validator = ContractValidator(str(self.contract_dir))
        
        # 绿灯: 验证跳过缺少response_schemas的文件
        assert len(validator._schemas) == 0

    def test_validate_response_with_valid_data(self):
        pass
        """测试验证有效的响应数据"""
        # 红灯: 先写测试
        # 设置测试契约
        schema_data = {
            "response_schemas": {
                "test_schema": {
                    "type": "object",
                    "properties": {
                        "status": {"type": "string"},
                        "data": {"type": "object"}
                    },
                    "required": ["status"]
                }
            }
        }
        
        schema_file = self.contract_dir / "test_contract.yaml"
        with open(schema_file, 'w', encoding='utf-8') as f:
            yaml.dump(schema_data, f)
        
        validator = ContractValidator(str(self.contract_dir))
        
        # 绿灯: 验证有效响应
        valid_response = {
            "status": "success",
            "data": {"key": "value"}
        }
        
        result = validator.validate_response(valid_response, "test_schema")
        assert result is True

    def test_validate_response_with_invalid_data(self):
        pass
        """测试验证无效的响应数据"""
        # 红灯: 先写测试
        # 设置测试契约
        schema_data = {
            "response_schemas": {
                "test_schema": {
                    "type": "object",
                    "properties": {
                        "status": {"type": "string"},
                        "data": {"type": "object"}
                    },
                    "required": ["status"]
                }
            }
        }
        
        schema_file = self.contract_dir / "test_contract.yaml"
        with open(schema_file, 'w', encoding='utf-8') as f:
            yaml.dump(schema_data, f)
        
        validator = ContractValidator(str(self.contract_dir))
        
        # 绿灯: 验证无效响应
        invalid_response = {
            "data": {"key": "value"}
            # 缺少必需的status字段
        }
        
        result = validator.validate_response(invalid_response, "test_schema")
        assert result is False

    def test_validate_response_with_nonexistent_schema(self):
        pass
        """测试验证不存在的契约"""
        # 红灯: 先写测试
        validator = ContractValidator(str(self.contract_dir))
        
        # 绿灯: 验证不存在的契约
        response = {"status": "success"}
        result = validator.validate_response(response, "nonexistent_schema")
        assert result is False

    def test_validate_response_with_validation_error(self):
        pass
        """测试验证过程中的异常处理"""
        # 红灯: 先写测试
        # 设置测试契约
        schema_data = {
            "response_schemas": {
                "test_schema": {
                    "type": "object",
                    "properties": {
                        "status": {"type": "string"}
                    },
                    "required": ["status"]
                }
            }
        }
        
        schema_file = self.contract_dir / "test_contract.yaml"
        with open(schema_file, 'w', encoding='utf-8') as f:
            yaml.dump(schema_data, f)
        
        validator = ContractValidator(str(self.contract_dir))
        
        # 绿灯: 验证异常处理
        with patch('jsonschema.validate', side_effect=Exception("Validation error")):
            response = {"status": "success"}
            result = validator.validate_response(response, "test_schema")
            assert result is False

    def test_get_schema_existing(self):
        pass
        """测试获取存在的契约"""
        # 红灯: 先写测试
        # 设置测试契约
        schema_data = {
            "response_schemas": {
                "test_schema": {
                    "type": "object",
                    "properties": {
                        "status": {"type": "string"}
                    }
                }
            }
        }
        
        schema_file = self.contract_dir / "test_contract.yaml"
        with open(schema_file, 'w', encoding='utf-8') as f:
            yaml.dump(schema_data, f)
        
        validator = ContractValidator(str(self.contract_dir))
        
        # 绿灯: 验证获取存在的契约
        schema = validator.get_schema("test_schema")
        assert schema["type"] == "object"
        assert "status" in schema["properties"]

    def test_get_schema_nonexistent(self):
        pass
        """测试获取不存在的契约"""
        # 红灯: 先写测试
        validator = ContractValidator(str(self.contract_dir))
        
        # 绿灯: 验证获取不存在的契约
        schema = validator.get_schema("nonexistent_schema")
        assert schema == {}

    def test_list_schemas(self):
        pass
        """测试列出所有契约"""
        # 红灯: 先写测试
        # 设置测试契约
        schema_data = {
            "response_schemas": {
                "schema1": {"type": "object"},
                "schema2": {"type": "array"}
            }
        }
        
        schema_file = self.contract_dir / "test_contract.yaml"
        with open(schema_file, 'w', encoding='utf-8') as f:
            yaml.dump(schema_data, f)
        
        validator = ContractValidator(str(self.contract_dir))
        
        # 绿灯: 验证列出所有契约
        schemas = validator.list_schemas()
        assert "schema1" in schemas
        assert "schema2" in schemas
        assert len(schemas) == 2

    def test_list_schemas_empty(self):
        pass
        """测试列出空契约列表"""
        # 红灯: 先写测试
        validator = ContractValidator(str(self.contract_dir))
        
        # 绿灯: 验证空契约列表
        schemas = validator.list_schemas()
        assert schemas == []

    def test_contract_validator_singleton(self):
        pass
        """测试全局契约验证器实例"""
        # 红灯: 先写测试
        from core.contract_validator import contract_validator
        
        # 绿灯: 验证全局实例
        assert isinstance(contract_validator, ContractValidator)
        assert contract_validator.contract_dir == Path("data_contract")

    def test_validate_response_with_complex_schema(self):
        pass
        """测试验证复杂契约结构"""
        # 红灯: 先写测试
        # 设置复杂测试契约
        schema_data = {
            "response_schemas": {
                "api_response": {
                    "type": "object",
                    "properties": {
                        "status": {"type": "string", "enum": ["success", "error"]},
                        "data": {
                            "type": "object",
                            "properties": {
                                "id": {"type": "integer"},
                                "name": {"type": "string"},
                                "items": {
                                    "type": "array",
                                    "items": {"type": "string"}
                                }
                            },
                            "required": ["id", "name"]
                        },
                        "message": {"type": "string"}
                    },
                    "required": ["status", "data"]
                }
            }
        }
        
        schema_file = self.contract_dir / "complex_contract.yaml"
        with open(schema_file, 'w', encoding='utf-8') as f:
            yaml.dump(schema_data, f)
        
        validator = ContractValidator(str(self.contract_dir))
        
        # 绿灯: 验证复杂响应
        valid_response = {
            "status": "success",
            "data": {
                "id": 123,
                "name": "test",
                "items": ["item1", "item2"]
            },
            "message": "Operation completed"
        }
        
        result = validator.validate_response(valid_response, "api_response")
        assert result is True

    def test_validate_response_with_invalid_complex_schema(self):
        pass
        """测试验证无效的复杂契约结构"""
        # 红灯: 先写测试
        # 设置复杂测试契约
        schema_data = {
            "response_schemas": {
                "api_response": {
                    "type": "object",
                    "properties": {
                        "status": {"type": "string", "enum": ["success", "error"]},
                        "data": {
                            "type": "object",
                            "properties": {
                                "id": {"type": "integer"},
                                "name": {"type": "string"}
                            },
                            "required": ["id", "name"]
                        }
                    },
                    "required": ["status", "data"]
                }
            }
        }
        
        schema_file = self.contract_dir / "complex_contract.yaml"
        with open(schema_file, 'w', encoding='utf-8') as f:
            yaml.dump(schema_data, f)
        
        validator = ContractValidator(str(self.contract_dir))
        
        # 绿灯: 验证无效响应
        invalid_response = {
            "status": "invalid_status",  # 不在枚举中
            "data": {
                "id": "not_an_integer",  # 类型错误
                # 缺少必需的name字段
            }
        }
        
        result = validator.validate_response(invalid_response, "api_response")
        assert result is False


if __name__ == "__main__":
    # 运行测试
    pytest.main([__file__, "-v", "--tb=short"])

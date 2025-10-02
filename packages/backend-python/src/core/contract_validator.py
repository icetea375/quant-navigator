"""
契约验证器 - 符合《测试宪法》第3.0条
定义契约，而非修补测试
"""

import logging
from pathlib import Path
from typing import Any, Dict

import jsonschema
import yaml

logger = logging.getLogger(__name__)


class ContractValidator:
    """API响应契约验证器"""

    def __init__(self, contract_dir: str = "data_contract"):
        self.contract_dir = Path(contract_dir)
        self._schemas = {}
        self._load_schemas()

    def _load_schemas(self):
        """加载所有契约文件"""
        if not self.contract_dir.exists():
            logger.warning(f"契约目录不存在: {self.contract_dir}")
            return

        for schema_file in self.contract_dir.glob("*.yaml"):
            try:
                with open(schema_file, encoding="utf-8") as f:
                    schemas = yaml.safe_load(f)
                    if "response_schemas" in schemas:
                        self._schemas.update(schemas["response_schemas"])
                        logger.info(f"加载契约文件: {schema_file.name}")
            except Exception as e:
                logger.error(f"加载契约文件失败 {schema_file}: {e}")

    def validate_response(self, response: Dict[str, Any], schema_name: str) -> bool:
        """
        验证API响应是否符合契约

        Args:
            response: API响应数据
            schema_name: 契约名称

        Returns:
            bool: 是否符合契约
        """
        if schema_name not in self._schemas:
            logger.error(f"未找到契约: {schema_name}")
            return False

        try:
            jsonschema.validate(instance=response, schema=self._schemas[schema_name])
            logger.debug(f"响应验证通过: {schema_name}")
            return True
        except jsonschema.ValidationError as e:
            logger.error(f"响应验证失败 {schema_name}: {e.message}")
            return False
        except Exception as e:
            logger.error(f"契约验证异常 {schema_name}: {e}")
            return False

    def get_schema(self, schema_name: str) -> Dict[str, Any]:
        """获取指定契约"""
        return self._schemas.get(schema_name, {})

    def list_schemas(self) -> list:
        """列出所有可用契约"""
        return list(self._schemas.keys())


# 全局契约验证器实例
contract_validator = ContractValidator()

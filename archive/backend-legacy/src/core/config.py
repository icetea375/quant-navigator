"""
配置模块 - 已迁移到 config/settings.py
此文件保留用于向后兼容，实际配置请使用 config/settings.py
"""

import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

# 导入统一配置
from config.settings import settings, get_settings, validate_critical_config

# 向后兼容：保持原有的settings实例
__all__ = ["settings", "get_settings", "validate_critical_config"]

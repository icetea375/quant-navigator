"""
配置模块 - 已迁移到 config/settings.py
此文件保留用于向后兼容，实际配置请使用 config/settings.py
"""

import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

try:
    # 导入统一配置
    from config.settings import settings, get_settings, validate_critical_config
except ImportError:
    # 如果无法导入，使用默认配置
    class DefaultSettings:
        API_HOST = "0.0.0.0"
        API_PORT = 8000
        DEBUG = True
        ALLOWED_HOSTS = ["*"]
        LOG_LEVEL = "INFO"
        LOG_FILE = "logs/backend.log"
    
    settings = DefaultSettings()
    get_settings = lambda: settings
    validate_critical_config = lambda: True

# 向后兼容：保持原有的settings实例
__all__ = ['settings', 'get_settings', 'validate_critical_config']
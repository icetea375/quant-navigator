"""
日志配置模块
"""

import logging
import logging.handlers
from pathlib import Path
from src.core.config import settings


def setup_logging():
    """设置日志配置"""
    
    # 创建日志目录
    log_dir = Path(settings.LOG_FILE).parent
    log_dir.mkdir(parents=True, exist_ok=True)
    
    # 配置根日志器
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            # 控制台处理器
            logging.StreamHandler(),
            # 文件处理器 - 轮转日志
            logging.handlers.RotatingFileHandler(
                settings.LOG_FILE,
                maxBytes=10*1024*1024,  # 10MB
                backupCount=5
            )
        ]
    )
    
    # 设置第三方库日志级别
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("fastapi").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    
    # 创建应用日志器
    app_logger = logging.getLogger("quantitative_navigator")
    app_logger.setLevel(logging.DEBUG)
    
    return app_logger

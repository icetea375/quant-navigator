"""
工具模块 - 通用工具函数
"""

import json
import logging
import os
from pathlib import Path
from typing import Dict, Any

def load_config(config_path: str) -> Dict[str, Any]:
    """
    加载配置文件
    
    Args:
        config_path: 配置文件路径
        
    Returns:
        配置字典
    """
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        # 返回默认配置
        return {
            "database": {
                "url": "postgresql://user:password@localhost:5432/quant_navigator"
            },
            "llm_service": {
                "provider": "tongyi",
                "api_key": "your_api_key_here"
            },
            "anomaly_thresholds": {
                "z_score_threshold": 2.5,
                "confidence_threshold": 0.6
            }
        }

def setup_logging(name: str) -> logging.Logger:
    """
    设置日志记录
    
    Args:
        name: 日志记录器名称
        
    Returns:
        日志记录器
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # 创建日志目录
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # 文件处理器
    file_handler = logging.FileHandler(f"logs/{name}.log", encoding='utf-8')
    file_handler.setLevel(logging.INFO)
    
    # 控制台处理器
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    
    # 格式化器
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    # 添加处理器
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

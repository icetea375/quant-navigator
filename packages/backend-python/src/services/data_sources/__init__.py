"""
数据源服务模块 - 实现各种数据源的统一接口
遵循YAGNI平衡法则:这些是"具体的实现",不是"不必要的复杂功能"
"""

from .tushare_fetcher import TushareFetcher

__all__ = ["TushareFetcher"]

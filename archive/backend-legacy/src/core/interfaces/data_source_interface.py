"""
数据源抽象接口 - 定义所有数据源必须实现的标准接口
遵循YAGNI平衡法则:这是"必要的架构抽象",不是"不必要的复杂功能"
"""

from abc import ABC, abstractmethod
from typing import Any

import pandas as pd


class DataSourceInterface(ABC):
    """
    数据源抽象接口 - 所有数据源实现必须遵循此接口

    这是"骨骼"而非"赘肉":
    - 防止锁定依赖:未来可以轻松切换数据源
    - 统一数据格式:所有下游模块依赖统一接口
    - 支持测试:可以轻松创建Mock数据源
    """

    @abstractmethod
    def get_daily_quotes(self, stock_code: str, trade_date: str) -> pd.DataFrame:
        """
        获取单只股票的日线行情数据

        Args:
            stock_code: 股票代码 (如: '000001.SZ')
            trade_date: 交易日期 (如: '20250126')

        Returns:
            标准化的DataFrame,包含以下列:
            - stock_code: 股票代码
            - trade_date: 交易日期
            - open: 开盘价
            - high: 最高价
            - low: 最低价
            - close: 收盘价
            - volume: 成交量
            - amount: 成交额
        """
        pass

    @abstractmethod
    def get_announcements(self, stock_code: str, trade_date: str) -> list[dict[str, Any]]:
        """
        获取公司公告数据

        Args:
            stock_code: 股票代码
            trade_date: 交易日期

        Returns:
            标准化的公告列表,每个公告包含:
            - announcement_id: 公告ID
            - stock_code: 股票代码
            - title: 公告标题
            - content: 公告内容
            - publish_date: 发布日期
            - announcement_type: 公告类型
        """
        pass

    @abstractmethod
    def get_financial_data(self, stock_code: str, report_date: str) -> dict[str, Any]:
        """
        获取财务数据

        Args:
            stock_code: 股票代码
            report_date: 报告期 (如: '20241231')

        Returns:
            标准化的财务数据字典,包含:
            - stock_code: 股票代码
            - report_date: 报告期
            - revenue: 营业收入
            - net_profit: 净利润
            - total_assets: 总资产
            - total_liabilities: 总负债
            - roe: 净资产收益率
            - roa: 总资产收益率
        """
        pass

    @abstractmethod
    def get_industry_classification(self, stock_code: str) -> dict[str, Any]:
        """
        获取行业分类数据

        Args:
            stock_code: 股票代码

        Returns:
            标准化的行业分类字典,包含:
            - stock_code: 股票代码
            - industry_code: 行业代码
            - industry_name: 行业名称
            - industry_level: 行业级别
            - classification_source: 分类来源 (如: 'shenwan', 'citic')
        """
        pass

    @abstractmethod
    def get_concept_data(self, stock_code: str, trade_date: str) -> list[dict[str, Any]]:
        """
        获取概念板块数据

        Args:
            stock_code: 股票代码
            trade_date: 交易日期

        Returns:
            标准化的概念数据列表,每个概念包含:
            - stock_code: 股票代码
            - concept_code: 概念代码
            - concept_name: 概念名称
            - hot_rank: 热度排名
            - concept_source: 概念来源 (如: 'ths', 'dc')
        """
        pass

    @abstractmethod
    def get_market_data(self, trade_date: str) -> dict[str, Any]:
        """
        获取市场整体数据

        Args:
            trade_date: 交易日期

        Returns:
            标准化的市场数据字典,包含:
            - trade_date: 交易日期
            - market_cap: 总市值
            - turnover_rate: 换手率
            - pe_ratio: 平均市盈率
            - pb_ratio: 平均市净率
            - market_sentiment: 市场情绪指标
        """
        pass

    @abstractmethod
    def health_check(self) -> dict[str, Any]:
        """
        数据源健康检查

        Returns:
            健康状态字典,包含:
            - status: 状态 ('healthy', 'unhealthy', 'degraded')
            - response_time: 响应时间 (毫秒)
            - last_success: 最后成功时间
            - error_count: 错误次数
            - rate_limit_remaining: 剩余请求次数
        """
        pass


class DataSourceError(Exception):
    """数据源相关异常"""
    pass


class DataSourceTimeoutError(DataSourceError):
    """数据源超时异常"""
    pass


class DataSourceRateLimitError(DataSourceError):
    """数据源限流异常"""
    pass


class DataSourceAuthenticationError(DataSourceError):
    """数据源认证异常"""
    pass

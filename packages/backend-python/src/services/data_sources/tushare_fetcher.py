"""
Tushare数据源实现 - 实现DataSourceInterface接口
遵循YAGNI平衡法则:这是"具体的实现",不是"不必要的复杂功能"
"""

import logging
from datetime import datetime
from typing import Any, Optional

import pandas as pd
import tushare as ts

from src.core.config import settings
from src.core.interfaces import DataSourceError, DataSourceInterface


class TushareFetcher(DataSourceInterface):
    """
    Tushare数据源实现

    实现DataSourceInterface接口,提供标准化的数据访问
    未来可以轻松切换到其他数据源(如AKShare,Wind等)
    """

    def __init__(self, token: Optional[str] = None):
        """
        初始化Tushare数据源

        Args:
            token: Tushare API Token,如果为None则从配置中读取
        """
        self.logger = logging.getLogger(__name__)
        self.token = token or settings.TUSHARE_TOKEN
        self.pro = None
        self._initialize()

    def _initialize(self):
        """初始化Tushare Pro API"""
        try:
            ts.set_token(self.token)
            self.pro = ts.pro_api()
            self.logger.info("Tushare数据源初始化成功")
        except Exception as e:
            self.logger.error(f"Tushare数据源初始化失败: {e!s}")
            raise DataSourceError(f"Tushare数据源初始化失败: {e!s}") from e

    async def get_daily_quotes(self, stock_code: str, trade_date: str) -> pd.DataFrame:
        """
        获取单只股票的日线行情数据

        Args:
            stock_code: 股票代码 (如: '000001.SZ')
            trade_date: 交易日期 (如: '20250126')

        Returns:
            标准化的DataFrame
        """
        try:
            # 调用Tushare API获取数据
            df = self.pro.daily(ts_code=stock_code, trade_date=trade_date)

            if df.empty:
                self.logger.warning(f"未找到股票 {stock_code} 在 {trade_date} 的数据")
                return pd.DataFrame()

            # 标准化数据格式
            standardized_df = self._standardize_daily_quotes(df, stock_code, trade_date)
            return standardized_df

        except Exception as e:
            self.logger.error(f"获取日线行情失败: {e!s}")
            raise DataSourceError(f"获取日线行情失败: {e!s}") from e

    async def get_announcements(
        self, stock_code: str, trade_date: str
    ) -> list[dict[str, Any]]:
        """
        获取公司公告数据

        Args:
            stock_code: 股票代码
            trade_date: 交易日期

        Returns:
            标准化的公告列表
        """
        try:
            # 调用Tushare API获取公告数据
            df = self.pro.anns(ts_code=stock_code, ann_date=trade_date)

            if df.empty:
                self.logger.warning(f"未找到股票 {stock_code} 在 {trade_date} 的公告")
                return []

            # 标准化数据格式
            announcements = self._standardize_announcements(df, stock_code, trade_date)
            return announcements

        except Exception as e:
            self.logger.error(f"获取公告数据失败: {e!s}")
            raise DataSourceError(f"获取公告数据失败: {e!s}") from e

    async def get_financial_data(
        self, stock_code: str, report_date: str
    ) -> dict[str, Any]:
        """
        获取财务数据

        Args:
            stock_code: 股票代码
            report_date: 报告期 (如: '20241231')

        Returns:
            标准化的财务数据字典
        """
        try:
            # 调用Tushare API获取财务数据
            df = self.pro.income(ts_code=stock_code, period=report_date)

            if df.empty:
                self.logger.warning(
                    f"未找到股票 {stock_code} 在 {report_date} 的财务数据"
                )
                return {}

            # 标准化数据格式
            financial_data = self._standardize_financial_data(
                df, stock_code, report_date
            )
            return financial_data

        except Exception as e:
            self.logger.error(f"获取财务数据失败: {e!s}")
            raise DataSourceError(f"获取财务数据失败: {e!s}") from e

    async def get_industry_classification(self, stock_code: str) -> dict[str, Any]:
        """
        获取行业分类数据

        Args:
            stock_code: 股票代码

        Returns:
            标准化的行业分类字典
        """
        try:
            # 调用Tushare API获取行业分类数据
            df = self.pro.stock_basic(
                ts_code=stock_code, fields="ts_code,name,industry,area,market,list_date"
            )

            if df.empty:
                self.logger.warning(f"未找到股票 {stock_code} 的行业分类数据")
                return {}

            # 标准化数据格式
            industry_data = self._standardize_industry_classification(df, stock_code)
            return industry_data

        except Exception as e:
            self.logger.error(f"获取行业分类数据失败: {e!s}")
            raise DataSourceError(f"获取行业分类数据失败: {e!s}") from e

    async def get_concept_data(
        self, stock_code: str, trade_date: str
    ) -> list[dict[str, Any]]:
        """
        获取概念板块数据

        Args:
            stock_code: 股票代码
            trade_date: 交易日期

        Returns:
            标准化的概念数据列表
        """
        try:
            # 调用Tushare API获取概念数据
            df = self.pro.concept_detail(ts_code=stock_code)

            if df.empty:
                self.logger.warning(f"未找到股票 {stock_code} 的概念数据")
                return []

            # 标准化数据格式
            concept_data = self._standardize_concept_data(df, stock_code, trade_date)
            return concept_data

        except Exception as e:
            self.logger.error(f"获取概念数据失败: {e!s}")
            raise DataSourceError(f"获取概念数据失败: {e!s}") from e

    async def get_market_data(self, trade_date: str) -> dict[str, Any]:
        """
        获取市场整体数据

        Args:
            trade_date: 交易日期

        Returns:
            标准化的市场数据字典
        """
        try:
            # 调用Tushare API获取市场数据
            df = self.pro.daily_basic(trade_date=trade_date)

            if df.empty:
                self.logger.warning(f"未找到 {trade_date} 的市场数据")
                return {}

            # 标准化数据格式
            market_data = self._standardize_market_data(df, trade_date)
            return market_data

        except Exception as e:
            self.logger.error(f"获取市场数据失败: {e!s}")
            raise DataSourceError(f"获取市场数据失败: {e!s}") from e

    async def health_check(self) -> dict[str, Any]:
        """
        数据源健康检查

        Returns:
            健康状态字典
        """
        try:
            start_time = datetime.now()

            # 测试API连接
            self.pro.stock_basic(ts_code="000001.SZ", fields="ts_code,name")

            end_time = datetime.now()
            response_time = (end_time - start_time).total_seconds() * 1000

            return {
                "status": "healthy",
                "response_time": response_time,
                "last_success": end_time.isoformat(),
                "error_count": 0,
                "rate_limit_remaining": 999,  # Tushare的限流信息需要额外获取
            }

        except Exception as e:
            self.logger.error(f"健康检查失败: {e!s}")
            return {
                "status": "unhealthy",
                "response_time": -1,
                "last_success": None,
                "error_count": 1,
                "rate_limit_remaining": 0,
            }

    def _standardize_daily_quotes(
        self, df: pd.DataFrame, stock_code: str, trade_date: str
    ) -> pd.DataFrame:
        """标准化日线行情数据格式"""
        standardized_df = pd.DataFrame(
            {
                "stock_code": [stock_code] * len(df),
                "trade_date": [trade_date] * len(df),
                "open": df["open"],
                "high": df["high"],
                "low": df["low"],
                "close": df["close"],
                "volume": df["vol"],
                "amount": df["amount"],
            }
        )
        return standardized_df

    def _standardize_announcements(
        self, df: pd.DataFrame, stock_code: str, trade_date: str
    ) -> list[dict[str, Any]]:
        """标准化公告数据格式"""
        announcements = []
        for _, row in df.iterrows():
            announcement = {
                "announcement_id": row.get("ann_id", ""),
                "stock_code": stock_code,
                "title": row.get("title", ""),
                "content": row.get("content", ""),
                "publish_date": row.get("ann_date", trade_date),
                "announcement_type": row.get("ann_type", "unknown"),
            }
            announcements.append(announcement)
        return announcements

    def _standardize_financial_data(
        self, df: pd.DataFrame, stock_code: str, report_date: str
    ) -> dict[str, Any]:
        """标准化财务数据格式"""
        if df.empty:
            return {}

        row = df.iloc[0]
        return {
            "stock_code": stock_code,
            "report_date": report_date,
            "revenue": row.get("revenue", 0),
            "net_profit": row.get("n_income", 0),
            "total_assets": row.get("total_assets", 0),
            "total_liabilities": row.get("total_liab", 0),
            "roe": row.get("roe", 0),
            "roa": row.get("roa", 0),
        }

    def _standardize_industry_classification(
        self, df: pd.DataFrame, stock_code: str
    ) -> dict[str, Any]:
        """标准化行业分类数据格式"""
        if df.empty:
            return {}

        row = df.iloc[0]
        return {
            "stock_code": stock_code,
            "industry_code": row.get("industry", ""),
            "industry_name": row.get("industry", ""),
            "industry_level": "level1",
            "classification_source": "tushare",
        }

    def _standardize_concept_data(
        self, df: pd.DataFrame, stock_code: str, trade_date: str
    ) -> list[dict[str, Any]]:
        """标准化概念数据格式"""
        concepts = []
        for _, row in df.iterrows():
            concept = {
                "stock_code": stock_code,
                "concept_code": row.get("concept_code", ""),
                "concept_name": row.get("concept_name", ""),
                "hot_rank": 0,  # Tushare概念数据中没有热度排名
                "concept_source": "tushare",
            }
            concepts.append(concept)
        return concepts

    def _standardize_market_data(
        self, df: pd.DataFrame, trade_date: str
    ) -> dict[str, Any]:
        """标准化市场数据格式"""
        if df.empty:
            return {}

        # 计算市场整体指标
        total_market_cap = df["total_mv"].sum()
        avg_turnover_rate = df["turnover_rate"].mean()
        avg_pe_ratio = df["pe"].mean()
        avg_pb_ratio = df["pb"].mean()

        return {
            "trade_date": trade_date,
            "market_cap": total_market_cap,
            "turnover_rate": avg_turnover_rate,
            "pe_ratio": avg_pe_ratio,
            "pb_ratio": avg_pb_ratio,
            "market_sentiment": 0.5,  # 需要额外的情绪分析
        }

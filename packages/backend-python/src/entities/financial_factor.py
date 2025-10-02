"""
财务因子实体 - 与Pydantic契约保持严格一致
"""

from typing import Any

from pydantic import ValidationError
from sqlalchemy import JSON, CheckConstraint, Column, DateTime, Float, Integer, String, Text
from sqlalchemy import DECIMAL

from .base import BaseEntity


class FinancialFactorEntity(BaseEntity):
    """财务因子实体类"""

    __tablename__ = "financial_factors"

    # 基本信息
    stock_code = Column(String(20), nullable=False, comment="股票代码")
    trade_date = Column(String(8), nullable=False, comment="交易日期")

    # 估值指标
    pe_ratio = Column(DECIMAL(10, 4), nullable=True, comment="PE比率")
    pb_ratio = Column(DECIMAL(10, 4), nullable=True, comment="PB比率")
    ps_ratio = Column(DECIMAL(10, 4), nullable=True, comment="PS比率")
    dividend_yield = Column(DECIMAL(10, 4), nullable=True, comment="股息率")

    # 市场数据
    market_cap = Column(DECIMAL(20, 2), nullable=True, comment="总市值")
    turnover_rate = Column(DECIMAL(10, 4), nullable=True, comment="换手率")
    volume_ratio = Column(DECIMAL(10, 4), nullable=True, comment="量比")
    float_market_cap = Column(DECIMAL(20, 2), nullable=True, comment="流通市值")

    # 股本数据
    total_shares = Column(DECIMAL(20, 4), nullable=True, comment="总股本")
    float_shares = Column(DECIMAL(20, 4), nullable=True, comment="流通股本")
    free_shares = Column(DECIMAL(20, 4), nullable=True, comment="自由流通股本")

    # 价格数据
    open_price = Column(DECIMAL(10, 4), nullable=True, comment="开盘价")
    high_price = Column(DECIMAL(10, 4), nullable=True, comment="最高价")
    low_price = Column(DECIMAL(10, 4), nullable=True, comment="最低价")
    close_price = Column(DECIMAL(10, 4), nullable=True, comment="收盘价")
    pre_close = Column(DECIMAL(10, 4), nullable=True, comment="昨收价")
    price_change = Column(DECIMAL(10, 4), nullable=True, comment="涨跌额")
    price_change_pct = Column(DECIMAL(10, 4), nullable=True, comment="涨跌幅")

    # 交易数据
    volume = Column(DECIMAL(20, 4), nullable=True, comment="成交量")
    amount = Column(DECIMAL(20, 2), nullable=True, comment="成交额")

    # 元数据
    source = Column(String(100), nullable=False, default="tushare", comment="数据源")
    metadata_json = Column(JSON, nullable=True, comment="元数据")

    # 添加约束
    __table_args__ = (
        CheckConstraint("pe_ratio >= 0", name="check_pe_ratio_positive"),
        CheckConstraint("pb_ratio >= 0", name="check_pb_ratio_positive"),
        CheckConstraint("ps_ratio >= 0", name="check_ps_ratio_positive"),
        CheckConstraint("dividend_yield >= 0", name="check_dividend_yield_positive"),
        CheckConstraint("market_cap >= 0", name="check_market_cap_positive"),
        CheckConstraint("turnover_rate >= 0", name="check_turnover_rate_positive"),
        CheckConstraint("volume_ratio >= 0", name="check_volume_ratio_positive"),
        CheckConstraint("float_market_cap >= 0", name="check_float_market_cap_positive"),
        CheckConstraint("total_shares >= 0", name="check_total_shares_positive"),
        CheckConstraint("float_shares >= 0", name="check_float_shares_positive"),
        CheckConstraint("free_shares >= 0", name="check_free_shares_positive"),
        CheckConstraint("open_price > 0", name="check_open_price_positive"),
        CheckConstraint("high_price > 0", name="check_high_price_positive"),
        CheckConstraint("low_price > 0", name="check_low_price_positive"),
        CheckConstraint("close_price > 0", name="check_close_price_positive"),
        CheckConstraint("pre_close > 0", name="check_pre_close_positive"),
        CheckConstraint("volume >= 0", name="check_volume_positive"),
        CheckConstraint("amount >= 0", name="check_amount_positive"),
    )

    def __init__(self, **kwargs):
        """初始化财务因子实体"""
        # 生成唯一ID
        if "id" not in kwargs:
            kwargs["id"] = f"{kwargs.get('stock_code', 'unknown')}_{kwargs.get('trade_date', 'unknown')}"
        
        super().__init__(**kwargs)

    def to_dict(self) -> dict[str, Any]:
        """转换为字典"""
        result = super().to_dict()
        
        # 处理DECIMAL类型
        for key, value in result.items():
            if value is not None and hasattr(value, 'quantize'):  # DECIMAL类型
                result[key] = float(value)
        
        return result

    @classmethod
    def from_financial_factors_dict(cls, data: dict[str, Any]) -> "FinancialFactorEntity":
        """从财务因子字典创建实体"""
        # 生成唯一ID
        entity_id = f"{data.get('stock_code', 'unknown')}_{data.get('trade_date', 'unknown')}"
        
        return cls(
            id=entity_id,
            stock_code=data.get("stock_code"),
            trade_date=data.get("trade_date"),
            pe_ratio=data.get("pe_ratio"),
            pb_ratio=data.get("pb_ratio"),
            ps_ratio=data.get("ps_ratio"),
            dividend_yield=data.get("dividend_yield"),
            market_cap=data.get("market_cap"),
            turnover_rate=data.get("turnover_rate"),
            volume_ratio=data.get("volume_ratio"),
            float_market_cap=data.get("float_market_cap"),
            total_shares=data.get("total_shares"),
            float_shares=data.get("float_shares"),
            free_shares=data.get("free_shares"),
            open_price=data.get("open_price"),
            high_price=data.get("high_price"),
            low_price=data.get("low_price"),
            close_price=data.get("close_price"),
            pre_close=data.get("pre_close"),
            price_change=data.get("price_change"),
            price_change_pct=data.get("price_change_pct"),
            volume=data.get("volume"),
            amount=data.get("amount"),
            source=data.get("source", "tushare"),
            metadata_json=data.get("metadata", {}),
        )

    def __repr__(self):
        """字符串表示"""
        return f"<FinancialFactorEntity(id='{self.id}', stock_code='{self.stock_code}', trade_date='{self.trade_date}')>"


class SuperFinancialFactorEntity(BaseEntity):
    """超级财务因子实体类"""

    __tablename__ = "super_financial_factors"

    # 基本信息
    stock_code = Column(String(20), nullable=False, comment="股票代码")
    trade_date = Column(String(8), nullable=False, comment="交易日期")

    # 基础财务因子（继承自FinancialFactorEntity）
    pe_ratio = Column(DECIMAL(10, 4), nullable=True, comment="PE比率")
    pb_ratio = Column(DECIMAL(10, 4), nullable=True, comment="PB比率")
    ps_ratio = Column(DECIMAL(10, 4), nullable=True, comment="PS比率")
    dividend_yield = Column(DECIMAL(10, 4), nullable=True, comment="股息率")
    market_cap = Column(DECIMAL(20, 2), nullable=True, comment="总市值")
    turnover_rate = Column(DECIMAL(10, 4), nullable=True, comment="换手率")
    volume_ratio = Column(DECIMAL(10, 4), nullable=True, comment="量比")
    float_market_cap = Column(DECIMAL(20, 2), nullable=True, comment="流通市值")
    total_shares = Column(DECIMAL(20, 4), nullable=True, comment="总股本")
    float_shares = Column(DECIMAL(20, 4), nullable=True, comment="流通股本")
    free_shares = Column(DECIMAL(20, 4), nullable=True, comment="自由流通股本")
    open_price = Column(DECIMAL(10, 4), nullable=True, comment="开盘价")
    high_price = Column(DECIMAL(10, 4), nullable=True, comment="最高价")
    low_price = Column(DECIMAL(10, 4), nullable=True, comment="最低价")
    close_price = Column(DECIMAL(10, 4), nullable=True, comment="收盘价")
    pre_close = Column(DECIMAL(10, 4), nullable=True, comment="昨收价")
    price_change = Column(DECIMAL(10, 4), nullable=True, comment="涨跌额")
    price_change_pct = Column(DECIMAL(10, 4), nullable=True, comment="涨跌幅")
    volume = Column(DECIMAL(20, 4), nullable=True, comment="成交量")
    amount = Column(DECIMAL(20, 2), nullable=True, comment="成交额")

    # 超级财务因子评分
    value_score = Column(Float, nullable=False, comment="价值评分")
    growth_score = Column(Float, nullable=False, comment="成长性评分")
    profitability_score = Column(Float, nullable=False, comment="盈利能力评分")
    financial_health_score = Column(Float, nullable=False, comment="财务健康度评分")
    overall_score = Column(Float, nullable=False, comment="综合评分")

    # 计算信息
    calculated_at = Column(DateTime, nullable=False, comment="计算时间")
    model_version = Column(String(50), nullable=False, default="v1.0", comment="模型版本")
    calculation_params_json = Column(JSON, nullable=True, comment="计算参数")

    # 元数据
    source = Column(String(100), nullable=False, default="tushare", comment="数据源")
    metadata_json = Column(JSON, nullable=True, comment="元数据")

    # 添加约束
    __table_args__ = (
        CheckConstraint("value_score >= 0 AND value_score <= 100", name="check_value_score_range"),
        CheckConstraint("growth_score >= 0 AND growth_score <= 100", name="check_growth_score_range"),
        CheckConstraint("profitability_score >= 0 AND profitability_score <= 100", name="check_profitability_score_range"),
        CheckConstraint("financial_health_score >= 0 AND financial_health_score <= 100", name="check_financial_health_score_range"),
        CheckConstraint("overall_score >= 0 AND overall_score <= 100", name="check_overall_score_range"),
    )

    def __init__(self, **kwargs):
        """初始化超级财务因子实体"""
        # 生成唯一ID
        if "id" not in kwargs:
            kwargs["id"] = f"super_{kwargs.get('stock_code', 'unknown')}_{kwargs.get('trade_date', 'unknown')}"
        
        super().__init__(**kwargs)

    def to_dict(self) -> dict[str, Any]:
        """转换为字典"""
        result = super().to_dict()
        
        # 处理DECIMAL类型
        for key, value in result.items():
            if value is not None and hasattr(value, 'quantize'):  # DECIMAL类型
                result[key] = float(value)
        
        return result

    @classmethod
    def from_super_financial_factors_dict(cls, data: dict[str, Any]) -> "SuperFinancialFactorEntity":
        """从超级财务因子字典创建实体"""
        # 生成唯一ID
        entity_id = f"super_{data.get('stock_code', 'unknown')}_{data.get('trade_date', 'unknown')}"
        
        return cls(
            id=entity_id,
            stock_code=data.get("stock_code"),
            trade_date=data.get("trade_date"),
            # 基础财务因子
            pe_ratio=data.get("pe_ratio"),
            pb_ratio=data.get("pb_ratio"),
            ps_ratio=data.get("ps_ratio"),
            dividend_yield=data.get("dividend_yield"),
            market_cap=data.get("market_cap"),
            turnover_rate=data.get("turnover_rate"),
            volume_ratio=data.get("volume_ratio"),
            float_market_cap=data.get("float_market_cap"),
            total_shares=data.get("total_shares"),
            float_shares=data.get("float_shares"),
            free_shares=data.get("free_shares"),
            open_price=data.get("open_price"),
            high_price=data.get("high_price"),
            low_price=data.get("low_price"),
            close_price=data.get("close_price"),
            pre_close=data.get("pre_close"),
            price_change=data.get("price_change"),
            price_change_pct=data.get("price_change_pct"),
            volume=data.get("volume"),
            amount=data.get("amount"),
            # 超级财务因子评分
            value_score=data.get("value_score", 0.0),
            growth_score=data.get("growth_score", 0.0),
            profitability_score=data.get("profitability_score", 0.0),
            financial_health_score=data.get("financial_health_score", 0.0),
            overall_score=data.get("overall_score", 0.0),
            # 计算信息
            calculated_at=data.get("calculated_at"),
            model_version=data.get("model_version", "v1.0"),
            calculation_params_json=data.get("calculation_params", {}),
            # 元数据
            source=data.get("source", "tushare"),
            metadata_json=data.get("metadata", {}),
        )

    def __repr__(self):
        """字符串表示"""
        return f"<SuperFinancialFactorEntity(id='{self.id}', stock_code='{self.stock_code}', overall_score={self.overall_score:.2f})>"

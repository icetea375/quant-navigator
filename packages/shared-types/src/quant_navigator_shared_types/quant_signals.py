"""
量化信号相关类型定义
这是所有模块关于"量化信号"概念的单一事实来源
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from enum import Enum
from pydantic import BaseModel, Field, validator

from .common import DatabaseEntity


class SignalType(str, Enum):
    """信号类型枚举"""
    INDIVIDUAL = "individual"
    MARKET = "market"
    MACRO = "macro"
    STYLE = "style"
    INDUSTRY = "industry"


class SignalStatus(str, Enum):
    """信号状态枚举"""
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    ARCHIVED = "archived"


class QuantSignal(BaseModel):
    """量化信号接口 - 系统核心业务概念"""
    signal_id: str = Field(..., description="信号ID")
    target_code: str = Field(..., description="目标股票代码")
    signal_date: datetime = Field(..., description="信号日期")
    signal_type: SignalType = Field(..., description="信号类型")
    status: SignalStatus = Field(..., description="状态")
    
    # Z分数指标
    return_z_score: float = Field(..., description="收益率Z分数")
    volume_z_score: float = Field(..., description="成交量Z分数")
    momentum_z_score: float = Field(..., description="动量Z分数")
    volatility_z_score: float = Field(..., description="波动率Z分数")
    macro_risk_z_score: float = Field(..., description="宏观风险Z分数")
    market_style_z_score: float = Field(..., description="市场风格Z分数")
    industry_rotation_z_score: float = Field(..., description="行业轮动Z分数")
    concept_z_score: float = Field(..., description="概念Z分数")
    
    # MDA相关指标
    mda_fulfillment_rate: float = Field(..., ge=0.0, le=1.0, description="MDA履行率")
    management_credibility_score: float = Field(..., ge=0.0, le=1.0, description="管理层可信度分数")
    disclosure_quality_score: float = Field(..., ge=0.0, le=1.0, description="披露质量分数")
    financial_transparency_score: float = Field(..., ge=0.0, le=1.0, description="财务透明度分数")
    
    # 技术指标
    rsi: float = Field(..., ge=0.0, le=100.0, description="RSI指标")
    macd_signal: float = Field(..., description="MACD信号")
    bollinger_position: float = Field(..., ge=0.0, le=1.0, description="布林带位置")
    ma_signal: float = Field(..., description="移动平均信号")
    
    # 综合指标
    overall_signal_strength: float = Field(..., ge=-1.0, le=1.0, description="整体信号强度")
    signal_confidence: float = Field(..., ge=0.0, le=1.0, description="信号置信度")
    validity_days: int = Field(..., ge=1, description="有效期天数")
    
    # 元数据
    model_version: str = Field(..., description="模型版本")
    calculation_params: Dict[str, Any] = Field(default_factory=dict, description="计算参数")
    source: str = Field(..., description="数据源")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="元数据")
    
    @validator('signal_date')
    def validate_signal_date(cls, v):
        """验证信号日期不能是未来时间"""
        if v > datetime.now():
            raise ValueError("Signal date cannot be in the future")
        return v


class SignalFilter(BaseModel):
    """信号过滤器"""
    target_codes: Optional[List[str]] = Field(None, description="目标股票代码列表")
    signal_types: Optional[List[SignalType]] = Field(None, description="信号类型列表")
    statuses: Optional[List[SignalStatus]] = Field(None, description="状态列表")
    min_confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="最小置信度")
    max_confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="最大置信度")
    min_strength: Optional[float] = Field(None, ge=-1.0, le=1.0, description="最小信号强度")
    max_strength: Optional[float] = Field(None, ge=-1.0, le=1.0, description="最大信号强度")
    start_date: Optional[datetime] = Field(None, description="开始日期")
    end_date: Optional[datetime] = Field(None, description="结束日期")
    
    @validator('end_date')
    def validate_date_range(cls, v, values):
        """验证日期范围"""
        if v and 'start_date' in values and values['start_date'] and v < values['start_date']:
            raise ValueError("End date must be after start date")
        return v


class SignalBatch(BaseModel):
    """信号批次"""
    batch_id: str = Field(..., description="批次ID")
    signals: List[QuantSignal] = Field(..., description="信号列表")
    created_at: datetime = Field(default_factory=datetime.now, description="创建时间")
    total_count: int = Field(..., description="总数量")
    valid_count: int = Field(..., description="有效数量")
    invalid_count: int = Field(..., description="无效数量")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="元数据")
    
    @validator('total_count')
    def validate_total_count(cls, v, values):
        """验证总数量与信号列表长度一致"""
        if 'signals' in values and v != len(values['signals']):
            raise ValueError("Total count must match signals list length")
        return v

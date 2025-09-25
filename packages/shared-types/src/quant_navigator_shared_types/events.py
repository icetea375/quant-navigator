"""
事件相关类型定义 - 量化导航仪项目的核心业务契约
这是所有模块关于"事件"概念的单一事实来源
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Literal
from enum import Enum
from pydantic import BaseModel, Field, validator

from .common import DatabaseEntity


class AnomalyType(str, Enum):
    """异常类型枚举"""
    PRICE = "price"
    VOLUME = "volume"
    VOLATILITY = "volatility"
    CORRELATION = "correlation"


class SeverityLevel(str, Enum):
    """严重程度枚举"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class EventType(str, Enum):
    """事件类型枚举"""
    NEWS = "news"
    ANNOUNCEMENT = "announcement"
    E_INTERACTION = "e_interaction"
    MARKET_DATA = "market_data"


class EventStatus(str, Enum):
    """事件状态枚举"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class AnomalyEvent(BaseModel):
    """异常事件接口 - 系统核心业务概念"""
    id: str = Field(..., description="事件唯一标识符")
    stock_code: str = Field(..., description="股票代码")
    timestamp: int = Field(..., description="时间戳 (毫秒)")
    anomaly_type: AnomalyType = Field(..., description="异常类型")
    severity: SeverityLevel = Field(..., description="严重程度")
    description: str = Field(..., description="描述信息")
    z_score: float = Field(..., description="Z分数")
    current_value: float = Field(..., description="当前值")
    expected_value: float = Field(..., description="期望值")
    deviation: float = Field(..., description="偏差值")
    confidence: float = Field(..., ge=0.0, le=1.0, description="置信度 (0-1)")
    context: Dict[str, Any] = Field(..., description="上下文信息")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="元数据")
    
    @validator('context')
    def validate_context(cls, v):
        """验证上下文信息结构"""
        required_keys = ['market_state', 'sector_performance', 'news_count', 'volume_ratio']
        for key in required_keys:
            if key not in v:
                raise ValueError(f"Context must contain '{key}' field")
        return v


class EvidenceItem(BaseModel):
    """证据项"""
    type: Literal['news', 'technical', 'fundamental', 'market'] = Field(..., description="证据类型")
    content: str = Field(..., description="证据内容")
    relevance_score: float = Field(..., ge=0.0, le=1.0, description="相关性分数")
    source: str = Field(..., description="证据来源")


class AttributionResult(BaseModel):
    """归因结果接口 - 异常事件分析结果"""
    event_id: str = Field(..., description="事件ID")
    stock_code: str = Field(..., description="股票代码")
    timestamp: int = Field(..., description="时间戳")
    attribution: Dict[str, Any] = Field(..., description="归因分析结果")
    confidence: float = Field(..., ge=0.0, le=1.0, description="置信度 (0-1)")
    evidence: List[EvidenceItem] = Field(default_factory=list, description="支持证据")
    narrative: str = Field(..., description="叙述性描述")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="元数据")
    
    @validator('attribution')
    def validate_attribution(cls, v):
        """验证归因分析结果结构"""
        required_keys = ['primary_factors', 'secondary_factors', 'confidence_score', 'explanation']
        for key in required_keys:
            if key not in v:
                raise ValueError(f"Attribution must contain '{key}' field")
        return v


class ProcessingResult(BaseModel):
    """处理结果"""
    extracted_entities: List[str] = Field(default_factory=list, description="提取的实体")
    sentiment_analysis: Dict[str, Any] = Field(default_factory=dict, description="情感分析结果")
    relevance_score: float = Field(..., ge=0.0, le=1.0, description="相关性分数")


class ProcessedEvent(BaseModel):
    """处理事件接口 - 已处理的事件"""
    event_id: str = Field(..., description="事件ID")
    event_type: EventType = Field(..., description="事件类型")
    title: str = Field(..., description="标题")
    content: str = Field(..., description="内容")
    published_at: datetime = Field(..., description="发布时间")
    related_stocks: List[str] = Field(default_factory=list, description="相关股票代码列表")
    keywords: List[str] = Field(default_factory=list, description="关键词")
    sentiment_score: float = Field(..., ge=-1.0, le=1.0, description="情感分数 (-1到1)")
    importance_score: float = Field(..., ge=0.0, le=1.0, description="重要性分数 (0-1)")
    status: EventStatus = Field(..., description="状态")
    processing_result: Optional[ProcessingResult] = Field(None, description="处理结果")
    error_message: Optional[str] = Field(None, description="错误信息")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="元数据")


class EventContext(BaseModel):
    """事件上下文"""
    market_state: str = Field(..., description="市场状态")
    sector_performance: float = Field(..., description="行业表现")
    news_count: int = Field(..., ge=0, description="新闻数量")
    volume_ratio: float = Field(..., ge=0.0, description="成交量比率")

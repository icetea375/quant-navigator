"""
仲裁案件相关的Pydantic模式
"""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ArbitrationStatus(str, Enum):
    """仲裁状态枚举"""

    PENDING = "pending"
    IN_REVIEW = "in_review"
    RESOLVED = "resolved"
    REJECTED = "rejected"


class AnalysisResult(BaseModel):
    """分析结果"""

    analysis: str
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str


class SentimentAnalysis(BaseModel):
    """情感分析结果"""

    sentiment: str
    score: float = Field(ge=0.0, le=1.0)
    reasoning: str


class ArbitrationCase(BaseModel):
    """仲裁案件"""

    case_id: str
    report_type: str
    target_code: Optional[str] = None
    qwen_analysis: Optional[AnalysisResult] = None
    doubao_analysis: Optional[SentimentAnalysis] = None
    disagreement_score: float = Field(ge=0.0, le=1.0)
    status: ArbitrationStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    human_decision: Optional[str] = None
    human_reasoning: Optional[str] = None

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True


class ArbitrationCaseCreate(BaseModel):
    """创建仲裁案件请求"""

    report_type: str
    target_code: Optional[str] = None
    qwen_analysis: Optional[AnalysisResult] = None
    doubao_analysis: Optional[SentimentAnalysis] = None


class ArbitrationCaseUpdate(BaseModel):
    """更新仲裁案件请求"""

    status: Optional[ArbitrationStatus] = None
    human_decision: Optional[str] = None
    human_reasoning: Optional[str] = None


class ArbitrationCaseResponse(BaseModel):
    """仲裁案件响应"""

    success: bool
    message: str
    data: Optional[ArbitrationCase] = None


class ArbitrationCaseListResponse(BaseModel):
    """仲裁案件列表响应"""

    success: bool
    message: str
    data: list[ArbitrationCase]
    total: int
    page: int
    size: int

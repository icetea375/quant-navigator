"""
仲裁相关类型定义
这是所有模块关于"仲裁"概念的单一事实来源
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, field_validator


class ArbitrationStatus(str, Enum):
    """仲裁状态枚举"""
    
    PENDING = "pending"
    IN_REVIEW = "in_review"
    RESOLVED = "resolved"
    REJECTED = "rejected"


class ReportType(str, Enum):
    """报告类型枚举 - 仲裁相关"""
    
    FACT_ANALYSIS = "fact_analysis"
    SENTIMENT_ANALYSIS = "sentiment_analysis"
    TECHNICAL_ANALYSIS = "technical_analysis"
    COMPREHENSIVE = "comprehensive"
    ANOMALY = "anomaly"
    QUARTERLY = "quarterly"
    INTERIM = "interim"
    ARBITRATION_CASE = "arbitration_case"


class AnalysisResult(BaseModel):
    """AI分析结果"""
    
    analysis: str = Field(..., description="分析内容")
    confidence: float = Field(..., ge=0.0, le=1.0, description="置信度")
    reasoning: str = Field(..., description="推理过程")
    key_points: List[str] = Field(default_factory=list, description="关键点")
    recommendations: List[str] = Field(default_factory=list, description="建议")
    risk_factors: List[str] = Field(default_factory=list, description="风险因素")
    timestamp: datetime = Field(default_factory=datetime.now, description="分析时间")


class SentimentAnalysis(BaseModel):
    """情感分析结果"""
    
    sentiment: str = Field(..., description="情感倾向")
    score: float = Field(..., ge=0.0, le=1.0, description="情感分数")
    reasoning: str = Field(..., description="分析推理")
    confidence: float = Field(..., ge=0.0, le=1.0, description="置信度")
    timestamp: datetime = Field(default_factory=datetime.now, description="分析时间")


class ArbitrationCase(BaseModel):
    """仲裁案件 - 核心业务实体"""
    
    case_id: str = Field(..., description="案件ID")
    report_type: ReportType = Field(..., description="报告类型")
    target_code: Optional[str] = Field(None, description="目标股票代码")
    target_name: Optional[str] = Field(None, description="目标股票名称")
    
    # AI分析结果
    qwen_analysis: Optional[AnalysisResult] = Field(None, description="Qwen分析结果")
    doubao_analysis: Optional[AnalysisResult] = Field(None, description="豆包分析结果")
    disagreement_score: float = Field(0.0, ge=0.0, le=1.0, description="分歧分数")
    
    # 案件状态
    status: ArbitrationStatus = Field(..., description="案件状态")
    priority: str = Field("medium", description="优先级")
    priority_score: float = Field(0.0, ge=0.0, le=1.0, description="优先级分数")
    
    # 时间信息
    created_at: datetime = Field(default_factory=datetime.now, description="创建时间")
    updated_at: Optional[datetime] = Field(None, description="更新时间")
    report_date: str = Field(..., description="报告日期")
    
    # 内容信息
    key_findings: List[str] = Field(default_factory=list, description="关键发现")
    risk_factors: List[str] = Field(default_factory=list, description="风险因素")
    summary: str = Field("", description="案件摘要")
    tags: List[str] = Field(default_factory=list, description="标签")
    industry: Optional[str] = Field(None, description="行业")
    concept: Optional[str] = Field(None, description="概念")
    
    # 人工决策
    human_decision: Optional[str] = Field(None, description="人工决策")
    human_reasoning: Optional[str] = Field(None, description="人工推理")
    human_confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="人工置信度")
    
    # 元数据
    metadata: Dict[str, Any] = Field(default_factory=dict, description="元数据")
    
    class Config:
        from_attributes = True
        arbitrary_types_allowed = True


class ArbitrationCaseCreate(BaseModel):
    """创建仲裁案件请求"""
    
    report_type: ReportType = Field(..., description="报告类型")
    target_code: Optional[str] = Field(None, description="目标股票代码")
    target_name: Optional[str] = Field(None, description="目标股票名称")
    qwen_analysis: Optional[AnalysisResult] = Field(None, description="Qwen分析结果")
    doubao_analysis: Optional[AnalysisResult] = Field(None, description="豆包分析结果")
    report_date: str = Field(..., description="报告日期")
    summary: str = Field("", description="案件摘要")
    key_findings: List[str] = Field(default_factory=list, description="关键发现")
    risk_factors: List[str] = Field(default_factory=list, description="风险因素")
    tags: List[str] = Field(default_factory=list, description="标签")
    industry: Optional[str] = Field(None, description="行业")
    concept: Optional[str] = Field(None, description="概念")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="元数据")


class ArbitrationCaseUpdate(BaseModel):
    """更新仲裁案件请求"""
    
    status: Optional[ArbitrationStatus] = Field(None, description="案件状态")
    priority: Optional[str] = Field(None, description="优先级")
    priority_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="优先级分数")
    human_decision: Optional[str] = Field(None, description="人工决策")
    human_reasoning: Optional[str] = Field(None, description="人工推理")
    human_confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="人工置信度")
    summary: Optional[str] = Field(None, description="案件摘要")
    key_findings: Optional[List[str]] = Field(None, description="关键发现")
    risk_factors: Optional[List[str]] = Field(None, description="风险因素")
    tags: Optional[List[str]] = Field(None, description="标签")
    industry: Optional[str] = Field(None, description="行业")
    concept: Optional[str] = Field(None, description="概念")
    metadata: Optional[Dict[str, Any]] = Field(None, description="元数据")


class ArbitrationCaseResponse(BaseModel):
    """仲裁案件响应"""
    
    success: bool = Field(..., description="是否成功")
    message: str = Field(..., description="响应消息")
    data: Optional[ArbitrationCase] = Field(None, description="案件数据")
    timestamp: datetime = Field(default_factory=datetime.now, description="响应时间")


class ArbitrationCaseListResponse(BaseModel):
    """仲裁案件列表响应"""
    
    success: bool = Field(..., description="是否成功")
    message: str = Field(..., description="响应消息")
    data: List[ArbitrationCase] = Field(..., description="案件列表")
    total: int = Field(..., ge=0, description="总数量")
    page: int = Field(..., ge=1, description="当前页码")
    size: int = Field(..., ge=1, description="每页大小")
    timestamp: datetime = Field(default_factory=datetime.now, description="响应时间")


class ArbitrationStatistics(BaseModel):
    """仲裁统计信息"""
    
    total_cases: int = Field(0, ge=0, description="总案件数")
    pending_cases: int = Field(0, ge=0, description="待处理案件数")
    in_review_cases: int = Field(0, ge=0, description="审核中案件数")
    resolved_cases: int = Field(0, ge=0, description="已解决案件数")
    rejected_cases: int = Field(0, ge=0, description="已拒绝案件数")
    
    avg_disagreement_score: float = Field(0.0, ge=0.0, le=1.0, description="平均分歧分数")
    avg_processing_time: float = Field(0.0, ge=0.0, description="平均处理时间(小时)")
    
    high_priority_cases: int = Field(0, ge=0, description="高优先级案件数")
    medium_priority_cases: int = Field(0, ge=0, description="中优先级案件数")
    low_priority_cases: int = Field(0, ge=0, description="低优先级案件数")
    
    # 按报告类型统计
    fact_analysis_cases: int = Field(0, ge=0, description="事实分析案件数")
    sentiment_analysis_cases: int = Field(0, ge=0, description="情感分析案件数")
    technical_analysis_cases: int = Field(0, ge=0, description="技术分析案件数")
    comprehensive_cases: int = Field(0, ge=0, description="综合分析案件数")
    
    # 时间范围
    period_start: datetime = Field(..., description="统计周期开始时间")
    period_end: datetime = Field(..., description="统计周期结束时间")
    
    @field_validator("period_end")
    @classmethod
    def validate_period_end(cls, v, info):
        """验证统计周期结束时间必须晚于开始时间"""
        if (
            hasattr(info, "data")
            and "period_start" in info.data
            and v <= info.data["period_start"]
        ):
            raise ValueError("Period end must be after period start")
        return v


class ArbitrationDecision(BaseModel):
    """仲裁决策"""
    
    decision_id: str = Field(..., description="决策ID")
    case_id: str = Field(..., description="案件ID")
    decision_type: str = Field(..., description="决策类型")
    decision_content: str = Field(..., description="决策内容")
    reasoning: str = Field(..., description="决策推理")
    confidence: float = Field(..., ge=0.0, le=1.0, description="决策置信度")
    decision_maker: str = Field(..., description="决策者")
    decision_time: datetime = Field(default_factory=datetime.now, description="决策时间")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="元数据")

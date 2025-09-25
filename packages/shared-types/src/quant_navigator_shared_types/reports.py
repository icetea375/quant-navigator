"""
报告相关类型定义
这是所有模块关于"报告"概念的单一事实来源
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Literal
from enum import Enum
from pydantic import BaseModel, Field, validator

from .common import DatabaseEntity


class ReportType(str, Enum):
    """报告类型枚举"""
    DAILY_ANALYSIS = "daily_analysis"
    WEEKLY_SUMMARY = "weekly_summary"
    MONTHLY_REPORT = "monthly_report"
    ANOMALY_REPORT = "anomaly_report"
    SIGNAL_REPORT = "signal_report"
    ARBITRATION_REPORT = "arbitration_report"
    CUSTOM = "custom"


class ReportStatus(str, Enum):
    """报告状态枚举"""
    DRAFT = "draft"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"
    ARCHIVED = "archived"


class ReportSection(BaseModel):
    """报告章节"""
    section_id: str = Field(..., description="章节ID")
    title: str = Field(..., description="章节标题")
    content: str = Field(..., description="章节内容")
    order: int = Field(..., ge=0, description="排序")
    section_type: str = Field(..., description="章节类型")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="元数据")


class ReportMetrics(BaseModel):
    """报告指标"""
    total_events: int = Field(0, ge=0, description="总事件数")
    processed_events: int = Field(0, ge=0, description="已处理事件数")
    anomaly_count: int = Field(0, ge=0, description="异常数量")
    signal_count: int = Field(0, ge=0, description="信号数量")
    success_rate: float = Field(0.0, ge=0.0, le=1.0, description="成功率")
    processing_time: int = Field(0, ge=0, description="处理时间 (毫秒)")
    confidence_score: float = Field(0.0, ge=0.0, le=1.0, description="置信度分数")


class GeneratedReport(BaseModel):
    """生成报告接口 - 系统核心业务概念"""
    report_id: str = Field(..., description="报告ID")
    report_type: ReportType = Field(..., description="报告类型")
    title: str = Field(..., description="报告标题")
    description: str = Field(..., description="报告描述")
    status: ReportStatus = Field(..., description="报告状态")
    
    # 时间信息
    generated_at: datetime = Field(default_factory=datetime.now, description="生成时间")
    period_start: datetime = Field(..., description="报告周期开始时间")
    period_end: datetime = Field(..., description="报告周期结束时间")
    
    # 内容结构
    sections: List[ReportSection] = Field(default_factory=list, description="报告章节")
    summary: str = Field(..., description="报告摘要")
    conclusions: List[str] = Field(default_factory=list, description="结论列表")
    recommendations: List[str] = Field(default_factory=list, description="建议列表")
    
    # 数据指标
    metrics: ReportMetrics = Field(default_factory=ReportMetrics, description="报告指标")
    
    # 关联数据
    related_events: List[str] = Field(default_factory=list, description="相关事件ID列表")
    related_signals: List[str] = Field(default_factory=list, description="相关信号ID列表")
    related_stocks: List[str] = Field(default_factory=list, description="相关股票代码列表")
    
    # 元数据
    author: str = Field(..., description="报告作者")
    version: str = Field("1.0.0", description="报告版本")
    template_id: Optional[str] = Field(None, description="模板ID")
    generation_params: Dict[str, Any] = Field(default_factory=dict, description="生成参数")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="元数据")
    
    # 文件信息
    file_path: Optional[str] = Field(None, description="文件路径")
    file_size: Optional[int] = Field(None, ge=0, description="文件大小 (字节)")
    file_format: Literal['pdf', 'html', 'json', 'markdown'] = Field('json', description="文件格式")
    
    @validator('period_end')
    def validate_period_end(cls, v, values):
        """验证报告周期结束时间必须晚于开始时间"""
        if 'period_start' in values and v <= values['period_start']:
            raise ValueError("Period end must be after period start")
        return v


class ReportTemplate(BaseModel):
    """报告模板"""
    template_id: str = Field(..., description="模板ID")
    template_name: str = Field(..., description="模板名称")
    report_type: ReportType = Field(..., description="报告类型")
    description: str = Field(..., description="模板描述")
    sections: List[Dict[str, Any]] = Field(..., description="章节配置")
    is_active: bool = Field(True, description="是否激活")
    created_at: datetime = Field(default_factory=datetime.now, description="创建时间")
    updated_at: datetime = Field(default_factory=datetime.now, description="更新时间")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="元数据")


class ReportFilter(BaseModel):
    """报告过滤器"""
    report_types: Optional[List[ReportType]] = Field(None, description="报告类型列表")
    statuses: Optional[List[ReportStatus]] = Field(None, description="状态列表")
    authors: Optional[List[str]] = Field(None, description="作者列表")
    start_date: Optional[datetime] = Field(None, description="开始日期")
    end_date: Optional[datetime] = Field(None, description="结束日期")
    min_confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="最小置信度")
    max_confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="最大置信度")
    related_stocks: Optional[List[str]] = Field(None, description="相关股票代码列表")
    
    @validator('end_date')
    def validate_date_range(cls, v, values):
        """验证日期范围"""
        if v and 'start_date' in values and values['start_date'] and v < values['start_date']:
            raise ValueError("End date must be after start date")
        return v


class ReportGenerationRequest(BaseModel):
    """报告生成请求"""
    request_id: str = Field(..., description="请求ID")
    report_type: ReportType = Field(..., description="报告类型")
    title: str = Field(..., description="报告标题")
    description: str = Field(..., description="报告描述")
    period_start: datetime = Field(..., description="报告周期开始时间")
    period_end: datetime = Field(..., description="报告周期结束时间")
    template_id: Optional[str] = Field(None, description="模板ID")
    generation_params: Dict[str, Any] = Field(default_factory=dict, description="生成参数")
    priority: Literal['low', 'normal', 'high', 'urgent'] = Field('normal', description="优先级")
    requester: str = Field(..., description="请求者")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="元数据")
    
    @validator('period_end')
    def validate_period_end(cls, v, values):
        """验证报告周期结束时间必须晚于开始时间"""
        if 'period_start' in values and v <= values['period_start']:
            raise ValueError("Period end must be after period start")
        return v

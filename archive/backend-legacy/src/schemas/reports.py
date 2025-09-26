"""
报告相关的Pydantic模式
"""

from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from enum import Enum


class ReportType(str, Enum):
    """报告类型枚举"""

    DAILY_ANALYSIS = "daily_analysis"
    FACT_ANALYSIS = "fact_analysis"
    SENTIMENT_ANALYSIS = "sentiment_analysis"
    ARBITRATION_CASE = "arbitration_case"


class ReportStatus(str, Enum):
    """报告状态枚举"""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class GeneratedReport(BaseModel):
    """生成的报告"""

    report_id: int
    report_type: ReportType
    target_code: Optional[str] = None
    report_date: date
    content: str
    status: ReportStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReportCreate(BaseModel):
    """创建报告请求"""

    report_type: ReportType
    target_code: Optional[str] = None
    report_date: date
    content: str


class ReportUpdate(BaseModel):
    """更新报告请求"""

    content: Optional[str] = None
    status: Optional[ReportStatus] = None


class ReportResponse(BaseModel):
    """报告响应"""

    success: bool
    message: str
    data: Optional[GeneratedReport] = None


class ReportListResponse(BaseModel):
    """报告列表响应"""

    success: bool
    message: str
    data: list[GeneratedReport]
    total: int
    page: int
    size: int

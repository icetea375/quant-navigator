"""
通用类型定义 - 量化导航仪项目的基础契约
这是所有模块关于通用数据结构的单一事实来源
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Generic, TypeVar
from pydantic import BaseModel, Field, ConfigDict

T = TypeVar("T")


class DatabaseEntity(BaseModel):
    """数据库实体基类"""

    id: str = Field(..., description="唯一标识符")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")


class ApiResponse(BaseModel, Generic[T]):
    """API响应基类"""

    success: bool = Field(..., description="请求是否成功")
    data: Optional[T] = Field(None, description="响应数据")
    error: Optional[str] = Field(None, description="错误信息")
    message: Optional[str] = Field(None, description="响应消息")
    timestamp: datetime = Field(default_factory=datetime.now, description="响应时间戳")


class PaginatedResponse(BaseModel, Generic[T]):
    """分页响应基类"""

    success: bool = Field(..., description="请求是否成功")
    data: List[T] = Field(..., description="响应数据列表")
    pagination: Dict[str, int] = Field(..., description="分页信息")
    error: Optional[str] = Field(None, description="错误信息")
    message: Optional[str] = Field(None, description="响应消息")
    timestamp: datetime = Field(default_factory=datetime.now, description="响应时间戳")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "data": [],
                "pagination": {"page": 1, "limit": 20, "total": 100, "total_pages": 5},
                "timestamp": "2024-01-01T00:00:00Z",
            }
        }
    )


class ConfigItem(DatabaseEntity):
    """配置项实体"""

    config_id: str = Field(..., description="配置项ID")
    config_type: str = Field(..., description="配置类型")
    config_key: str = Field(..., description="配置键")
    config_value: str = Field(..., description="配置值")
    description: str = Field(..., description="配置描述")
    is_active: bool = Field(True, description="是否激活")
    version: int = Field(1, description="版本号")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="元数据")


class ValidationError(BaseModel):
    """验证错误信息"""

    field: str = Field(..., description="字段名")
    message: str = Field(..., description="错误消息")
    value: Any = Field(..., description="错误值")


class BatchOperationResult(BaseModel):
    """批量操作结果"""

    success: bool = Field(..., description="操作是否成功")
    processed_count: int = Field(0, description="处理数量")
    success_count: int = Field(0, description="成功数量")
    error_count: int = Field(0, description="错误数量")
    errors: List[ValidationError] = Field(default_factory=list, description="错误列表")
    warnings: List[str] = Field(default_factory=list, description="警告列表")

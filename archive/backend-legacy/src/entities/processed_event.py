"""
处理事件实体 - 与Pydantic契约保持严格一致
"""

from typing import Dict, Any
from sqlalchemy import Column, String, DateTime, Float, Text, JSON, CheckConstraint
from pydantic import ValidationError

from .base import BaseEntity
from quant_navigator_shared_types.events import ProcessedEvent


class ProcessedEventEntity(BaseEntity):
    """处理事件实体类"""

    __tablename__ = "processed_events"

    # 基本信息
    event_id = Column(String(255), nullable=False, unique=True, comment="事件ID")
    event_type = Column(String(20), nullable=False, comment="事件类型")
    title = Column(String(500), nullable=False, comment="标题")
    content = Column(Text, nullable=False, comment="内容")
    published_at = Column(DateTime, nullable=False, comment="发布时间")

    # 关联信息
    related_stocks_json = Column(
        JSON, nullable=False, default=list, comment="相关股票代码列表"
    )
    keywords_json = Column(JSON, nullable=False, default=list, comment="关键词列表")

    # 评分信息
    sentiment_score = Column(Float, nullable=False, comment="情感分数 (-1到1)")
    importance_score = Column(Float, nullable=False, comment="重要性分数 (0-1)")

    # 状态信息
    status = Column(String(20), nullable=False, comment="状态")
    processing_result_json = Column(JSON, nullable=True, comment="处理结果")
    error_message = Column(Text, nullable=True, comment="错误信息")

    # 添加约束
    __table_args__ = (
        CheckConstraint(
            "sentiment_score >= -1 AND sentiment_score <= 1",
            name="check_sentiment_range",
        ),
        CheckConstraint(
            "importance_score >= 0 AND importance_score <= 1",
            name="check_importance_range",
        ),
        CheckConstraint(
            'event_type IN ("news", "announcement", "e_interaction", "market_data")',
            name="check_event_type",
        ),
        CheckConstraint(
            'status IN ("pending", "processing", "completed", "failed")',
            name="check_status",
        ),
    )

    def __init__(self, **kwargs):
        """初始化处理事件实体"""
        # 验证输入数据
        self._validate_input_data(kwargs)
        super().__init__(**kwargs)

    def _validate_input_data(self, data: Dict[str, Any]) -> None:
        """验证输入数据"""
        try:
            # 创建Pydantic模型进行验证
            processed_event = ProcessedEvent(**data)
        except ValidationError as e:
            raise ValueError(f"Invalid processed event data: {e}")

    def to_processed_event(self) -> ProcessedEvent:
        """转换为Pydantic ProcessedEvent模型"""
        data = {
            "event_id": self.event_id,
            "event_type": self.event_type,
            "title": self.title,
            "content": self.content,
            "published_at": self.published_at,
            "related_stocks": self.related_stocks_json or [],
            "keywords": self.keywords_json or [],
            "sentiment_score": self.sentiment_score,
            "importance_score": self.importance_score,
            "status": self.status,
            "processing_result": self.processing_result_json,
            "error_message": self.error_message,
            "metadata": self.metadata_json or {},
        }
        return ProcessedEvent(**data)

    @classmethod
    def from_processed_event(
        cls, processed_event: ProcessedEvent
    ) -> "ProcessedEventEntity":
        """从Pydantic ProcessedEvent模型创建实体"""
        data = processed_event.model_dump()
        return cls(
            id=data.get("id", data["event_id"]),  # 如果没有id字段，使用event_id
            event_id=data["event_id"],
            event_type=data["event_type"],
            title=data["title"],
            content=data["content"],
            published_at=data["published_at"],
            related_stocks_json=data["related_stocks"],
            keywords_json=data["keywords"],
            sentiment_score=data["sentiment_score"],
            importance_score=data["importance_score"],
            status=data["status"],
            processing_result_json=data.get("processing_result"),
            error_message=data.get("error_message"),
            metadata_json=data["metadata"],
        )

    def __repr__(self):
        """字符串表示"""
        return f"<ProcessedEventEntity(id='{self.id}', event_id='{self.event_id}', type='{self.event_type}')>"

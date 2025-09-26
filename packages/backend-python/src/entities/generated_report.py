"""
生成报告实体 - 与Pydantic契约保持严格一致
"""

from typing import Any

from pydantic import ValidationError
from quant_navigator_shared_types.reports import GeneratedReport
from sqlalchemy import JSON, CheckConstraint, Column, DateTime, Integer, String, Text

from .base import BaseEntity


class GeneratedReportEntity(BaseEntity):
    """生成报告实体类"""
    __tablename__ = "generated_reports"

    # 基本信息
    report_id = Column(String(255), nullable=False, unique=True, comment="报告ID")
    report_type = Column(String(30), nullable=False, comment="报告类型")
    title = Column(String(500), nullable=False, comment="报告标题")
    description = Column(Text, nullable=False, comment="报告描述")
    status = Column(String(20), nullable=False, comment="报告状态")

    # 时间信息
    generated_at = Column(DateTime, nullable=False, comment="生成时间")
    period_start = Column(DateTime, nullable=False, comment="报告周期开始时间")
    period_end = Column(DateTime, nullable=False, comment="报告周期结束时间")

    # 内容结构
    sections_json = Column(JSON, nullable=True, comment="报告章节")
    summary = Column(Text, nullable=False, comment="报告摘要")
    conclusions_json = Column(JSON, nullable=True, comment="结论列表")
    recommendations_json = Column(JSON, nullable=True, comment="建议列表")

    # 数据指标
    metrics_json = Column(JSON, nullable=True, comment="报告指标")

    # 关联数据
    related_events_json = Column(JSON, nullable=True, comment="相关事件ID列表")
    related_signals_json = Column(JSON, nullable=True, comment="相关信号ID列表")
    related_stocks_json = Column(JSON, nullable=True, comment="相关股票代码列表")

    # 元数据
    author = Column(String(100), nullable=False, comment="报告作者")
    version = Column(String(20), nullable=False, comment="报告版本")
    template_id = Column(String(100), nullable=True, comment="模板ID")
    generation_params_json = Column(JSON, nullable=True, comment="生成参数")

    # 文件信息
    file_path = Column(String(500), nullable=True, comment="文件路径")
    file_size = Column(Integer, nullable=True, comment="文件大小 (字节)")
    file_format = Column(String(20), nullable=False, comment="文件格式")
    metadata_json = Column(JSON, nullable=True, comment="元数据")

    # 添加约束
    __table_args__ = (
        CheckConstraint("file_size >= 0", name="check_file_size_positive"),
        CheckConstraint('file_format IN ("pdf", "html", "json", "markdown")', name="check_file_format"),
        CheckConstraint('report_type IN ("daily_analysis", "weekly_summary", "monthly_report", "anomaly_report", "signal_report", "arbitration_report", "custom")', name="check_report_type"),
        CheckConstraint('status IN ("draft", "generating", "completed", "failed", "archived")', name="check_report_status"),
    )

    def __init__(self, **kwargs):
        """初始化生成报告实体"""
        # 验证输入数据
        self._validate_input_data(kwargs)
        super().__init__(**kwargs)

    def _validate_input_data(self, data: dict[str, Any]) -> None:
        """验证输入数据"""
        try:
            # 创建Pydantic模型进行验证
            GeneratedReport(**data)
        except ValidationError as e:
            raise ValueError(f"Invalid generated report data: {e}") from e

    def to_generated_report(self) -> GeneratedReport:
        """转换为Pydantic GeneratedReport模型"""
        data = {
            "report_id": self.report_id,
            "report_type": self.report_type,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "generated_at": self.generated_at,
            "period_start": self.period_start,
            "period_end": self.period_end,
            "sections": self.sections_json or [],
            "summary": self.summary,
            "conclusions": self.conclusions_json or [],
            "recommendations": self.recommendations_json or [],
            "metrics": self.metrics_json or {},
            "related_events": self.related_events_json or [],
            "related_signals": self.related_signals_json or [],
            "related_stocks": self.related_stocks_json or [],
            "author": self.author,
            "version": self.version,
            "template_id": self.template_id,
            "generation_params": self.generation_params_json or {},
            "file_path": self.file_path,
            "file_size": self.file_size,
            "file_format": self.file_format,
            "metadata": self.metadata_json or {}
        }
        return GeneratedReport(**data)

    @classmethod
    def from_generated_report(cls, generated_report: GeneratedReport) -> "GeneratedReportEntity":
        """从Pydantic GeneratedReport模型创建实体"""
        data = generated_report.model_dump()
        return cls(
            id=data["report_id"],  # 使用report_id作为主键
            report_id=data["report_id"],
            report_type=data["report_type"],
            title=data["title"],
            description=data["description"],
            status=data["status"],
            generated_at=data["generated_at"],
            period_start=data["period_start"],
            period_end=data["period_end"],
            sections_json=data["sections"],
            summary=data["summary"],
            conclusions_json=data["conclusions"],
            recommendations_json=data["recommendations"],
            metrics_json=data["metrics"],
            related_events_json=data["related_events"],
            related_signals_json=data["related_signals"],
            related_stocks_json=data["related_stocks"],
            author=data["author"],
            version=data["version"],
            template_id=data.get("template_id"),
            generation_params_json=data["generation_params"],
            file_path=data.get("file_path"),
            file_size=data.get("file_size"),
            file_format=data["file_format"],
            metadata_json=data["metadata"]
        )

    def __repr__(self):
        """字符串表示"""
        return f"<GeneratedReportEntity(id='{self.id}', report_id='{self.report_id}', type='{self.report_type}')>"

"""
工作流相关类型定义
这是所有模块关于"工作流"概念的单一事实来源
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Literal
from pydantic import BaseModel, Field, validator


class WorkflowConfig(BaseModel):
    """工作流配置接口"""
    enable_core_universe: bool = Field(True, description="启用核心宇宙处理")
    enable_observation_universe: bool = Field(True, description="启用观察宇宙处理")
    enable_daily_promotion: bool = Field(True, description="启用每日提升检查")
    enable_monthly_demotion: bool = Field(True, description="启用月度降级检查")
    core_universe_max_size: int = Field(100, ge=1, description="核心宇宙最大规模")
    observation_universe_max_size: int = Field(500, ge=1, description="观察宇宙最大规模")
    promotion_check_time: str = Field("09:00", description="提升检查时间 (HH:MM格式)")
    demotion_check_time: str = Field("18:00", description="降级检查时间 (HH:MM格式)")
    
    @validator('promotion_check_time', 'demotion_check_time')
    def validate_time_format(cls, v):
        """验证时间格式"""
        try:
            datetime.strptime(v, "%H:%M")
        except ValueError:
            raise ValueError("Time must be in HH:MM format")
        return v


class WorkflowExecutionResult(BaseModel):
    """工作流执行结果接口"""
    success: bool = Field(..., description="执行是否成功")
    start_time: datetime = Field(..., description="开始时间")
    end_time: datetime = Field(..., description="结束时间")
    duration: int = Field(..., ge=0, description="执行时长 (毫秒)")
    core_universe_processed: int = Field(0, ge=0, description="核心宇宙处理数量")
    observation_universe_processed: int = Field(0, ge=0, description="观察宇宙处理数量")
    errors: List[str] = Field(default_factory=list, description="错误列表")
    warnings: List[str] = Field(default_factory=list, description="警告列表")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="元数据")
    
    @validator('end_time')
    def validate_end_time(cls, v, values):
        """验证结束时间必须晚于开始时间"""
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError("End time must be after start time")
        return v


class AnomalyDetectionConfig(BaseModel):
    """异常检测配置"""
    enabled: bool = Field(True, description="是否启用")
    z_score_threshold: float = Field(2.0, ge=0.0, description="Z分数阈值")
    detection_interval: int = Field(300, ge=1, description="检测间隔 (秒)")
    max_anomalies_per_run: int = Field(100, ge=1, description="每次运行最大异常数")


class SignalTranslationConfig(BaseModel):
    """信号转换配置"""
    enabled: bool = Field(True, description="是否启用")
    translation_rules: List[Dict[str, Any]] = Field(default_factory=list, description="转换规则")
    output_format: Literal['json', 'text'] = Field('json', description="输出格式")


class LLMCollaborationConfig(BaseModel):
    """LLM协作配置"""
    enabled: bool = Field(True, description="是否启用")
    providers: List[str] = Field(default_factory=list, description="提供商列表")
    max_retries: int = Field(3, ge=0, description="最大重试次数")
    timeout: int = Field(30, ge=1, description="超时时间 (秒)")


class WorkflowExecutionConfig(BaseModel):
    """工作流执行配置"""
    enable_daily_attribution: bool = Field(True, description="启用每日归因")
    enable_anomaly_attribution: bool = Field(True, description="启用异常归因")
    enable_historical_attribution: bool = Field(True, description="启用历史归因")
    enable_cross_validation: bool = Field(True, description="启用交叉验证")


class MonitoringConfig(BaseModel):
    """监控配置"""
    enabled: bool = Field(True, description="是否启用")
    log_level: Literal['debug', 'info', 'warn', 'error'] = Field('info', description="日志级别")
    metrics_collection: bool = Field(True, description="是否收集指标")


class AttributionEngineConfig(BaseModel):
    """归因引擎配置接口"""
    enabled: bool = Field(True, description="是否启用")
    anomaly_detection: AnomalyDetectionConfig = Field(default_factory=AnomalyDetectionConfig, description="异常检测配置")
    signal_translation: SignalTranslationConfig = Field(default_factory=SignalTranslationConfig, description="信号转换配置")
    llm_collaboration: LLMCollaborationConfig = Field(default_factory=LLMCollaborationConfig, description="LLM协作配置")
    workflow: WorkflowExecutionConfig = Field(default_factory=WorkflowExecutionConfig, description="工作流配置")
    monitoring: MonitoringConfig = Field(default_factory=MonitoringConfig, description="监控配置")


class WorkflowStep(BaseModel):
    """工作流步骤"""
    step_id: str = Field(..., description="步骤ID")
    step_name: str = Field(..., description="步骤名称")
    step_type: str = Field(..., description="步骤类型")
    status: Literal['pending', 'running', 'completed', 'failed', 'skipped'] = Field('pending', description="步骤状态")
    start_time: Optional[datetime] = Field(None, description="开始时间")
    end_time: Optional[datetime] = Field(None, description="结束时间")
    duration: Optional[int] = Field(None, ge=0, description="执行时长 (毫秒)")
    input_data: Dict[str, Any] = Field(default_factory=dict, description="输入数据")
    output_data: Dict[str, Any] = Field(default_factory=dict, description="输出数据")
    error_message: Optional[str] = Field(None, description="错误信息")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="元数据")


class WorkflowInstance(BaseModel):
    """工作流实例"""
    instance_id: str = Field(..., description="实例ID")
    workflow_name: str = Field(..., description="工作流名称")
    status: Literal['pending', 'running', 'completed', 'failed', 'cancelled'] = Field('pending', description="实例状态")
    created_at: datetime = Field(default_factory=datetime.now, description="创建时间")
    started_at: Optional[datetime] = Field(None, description="开始时间")
    completed_at: Optional[datetime] = Field(None, description="完成时间")
    steps: List[WorkflowStep] = Field(default_factory=list, description="步骤列表")
    config: Dict[str, Any] = Field(default_factory=dict, description="配置信息")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="元数据")

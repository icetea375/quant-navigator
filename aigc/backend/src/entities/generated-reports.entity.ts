import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsDateString, IsEnum, MaxLength, IsNumber, Min, Max, IsObject } from 'class-validator';
import { HumanFeedbackLoop } from './human-feedback-loop.entity';

export enum ReportType {
    ATTRIBUTION_ANALYSIS = 'attribution_analysis',
    PREDICTION_FORECAST = 'prediction_forecast',
    EVENT_CHAIN = 'event_chain',
    MDA_VERIFICATION = 'mda_verification',
    COUNTERFACTUAL_VALIDATION = 'counterfactual_validation'
}

export enum ReportStatus {
    DRAFT = 'draft',
    PENDING_REVIEW = 'pending_review',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    ARCHIVED = 'archived'
}

/**
 * @description 存储AI生成的分析报告，为仲裁界面提供AI辩论数据
 * 这是"AI辩论区"面板的核心数据源
 */
@Entity({ name: 'generated_reports' })
@Index(['target_code', 'report_date'])
@Index(['report_type', 'status'])
@Index(['created_at'])
export class GeneratedReports {
    @PrimaryGeneratedColumn('uuid')
    report_id: string;

    /**
     * @description 报告类型，用于分类和路由
     * @example "attribution_analysis", "prediction_forecast"
     */
    @Column({
        type: 'enum',
        enum: ReportType,
        nullable: false
    })
    @IsEnum(ReportType)
    @IsNotEmpty()
    report_type: ReportType;

    /**
     * @description 目标股票代码
     * @example "600519.SH"
     */
    @Column({ type: 'varchar', length: 20, nullable: false })
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    target_code: string;

    /**
     * @description 报告生成日期
     * @example "2024-10-28"
     */
    @Column({ type: 'date', nullable: false })
    @IsDateString()
    @IsNotEmpty()
    report_date: string;

    /**
     * @description 报告标题，用于快速识别
     * @example "600519.SH 2024Q3 归因分析报告"
     */
    @Column({ type: 'varchar', length: 200, nullable: false })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    title: string;

    /**
     * @description 报告摘要，提供核心结论概述
     * @example "基于多维度分析，该股票异常表现主要归因于新能源业务突破..."
     */
    @Column({ type: 'text', nullable: false })
    @IsString()
    @IsNotEmpty()
    summary: string;

    /**
     * @description 报告完整内容，包含详细分析过程
     * @example "## 执行摘要\n\n### 核心发现\n1. 新能源业务营收增长..."
     */
    @Column({ type: 'text', nullable: false })
    @IsString()
    @IsNotEmpty()
    content: string;

    /**
     * @description 报告状态，用于工作流管理
     * @example "approved", "pending_review", "rejected"
     */
    @Column({
        type: 'enum',
        enum: ReportStatus,
        default: ReportStatus.DRAFT
    })
    @IsEnum(ReportStatus)
    @IsNotEmpty()
    status: ReportStatus;

    /**
     * @description 报告置信度评分，由AI模型输出
     * @example 0.85 (0-1之间，1为最高置信度)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Max(1)
    confidence_score: number | null;

    /**
     * @description 报告质量评分，由人类审核员给出
     * @example 4.2 (1-5之间，5为最高质量)
     */
    @Column({ type: 'decimal', precision: 2, scale: 1, nullable: true })
    @IsOptional()
    @Min(1)
    @Max(5)
    quality_score: number | null;

    /**
     * @description 使用的AI模型标识
     * @example "kimi-v1-8k", "qwen-max", "gpt-4"
     */
    @Column({ type: 'varchar', length: 100, nullable: true })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    model_used: string | null;

    /**
     * @description 报告版本号，用于版本管理
     * @example "1.0", "1.1", "2.0"
     */
    @Column({ type: 'varchar', length: 10, default: '1.0' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(10)
    version: string;

    /**
     * @description 关键发现列表，用于快速提取核心信息
     * @example ["新能源业务营收增长35%", "管理层承诺兑现率85%", "技术指标显示超买信号"]
     */
    @Column({ type: 'text', array: true, nullable: true })
    @IsArray()
    @IsOptional()
    key_findings: string[] | null;

    /**
     * @description 风险提示列表，用于风险识别
     * @example ["行业竞争加剧", "政策不确定性", "技术迭代风险"]
     */
    @Column({ type: 'text', array: true, nullable: true })
    @IsArray()
    @IsOptional()
    risk_factors: string[] | null;

    /**
     * @description 报告元数据，存储额外的结构化信息
     * @example {"processing_time": "2.5s", "token_count": 1500, "api_calls": 3}
     */
    @Column({ type: 'jsonb', nullable: true })
    @IsOptional()
    @IsObject()
    metadata: object | null;

    /**
     * @description 报告创建者标识
     * @example "ai_system", "human_analyst", "hybrid_workflow"
     */
    @Column({ type: 'varchar', length: 50, default: 'ai_system' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    created_by: string;

    /**
     * @description 报告审核者标识
     * @example "admin", "senior_analyst", "quality_reviewer"
     */
    @Column({ type: 'varchar', length: 50, nullable: true })
    @IsString()
    @IsOptional()
    @MaxLength(50)
    reviewed_by: string | null;

    /**
     * @description 审核意见，用于记录审核过程中的反馈
     * @example "报告质量良好，建议增加行业对比分析"
     */
    @Column({ type: 'text', nullable: true })
    @IsString()
    @IsOptional()
    review_comment: string | null;

    /**
     * @description 与人工反馈循环的关联关系
     */
    @OneToMany(() => HumanFeedbackLoop, feedback => feedback.report)
    feedbacks: HumanFeedbackLoop[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    constructor() {
        // 确保任何通过 new GeneratedReports() 创建的实例，
        // status字段都有一个确定的值，与数据库默认值保持一致
        this.status = ReportStatus.DRAFT;
        // 设置默认版本号
        this.version = '1.0';
        // 设置默认创建者
        this.created_by = 'ai_system';
        
        // 初始化所有必填字段
        this.report_id = '';
        this.report_type = ReportType.ATTRIBUTION_ANALYSIS;
        this.target_code = '';
        this.report_date = new Date().toISOString();
        this.title = '';
        this.summary = '';
        this.content = '';
        this.created_at = new Date();
        this.updated_at = new Date();
        
        // 初始化所有可为空字段
        this.confidence_score = null;
        this.quality_score = null;
        this.model_used = null;
        this.key_findings = null;
        this.risk_factors = null;
        this.metadata = null;
        this.reviewed_by = null;
        this.review_comment = null;
        this.feedbacks = [];
    }
}

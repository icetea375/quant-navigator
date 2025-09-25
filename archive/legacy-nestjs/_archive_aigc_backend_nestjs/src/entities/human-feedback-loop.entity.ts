import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, MaxLength, IsNumber, Min, Max, IsUUID, IsObject, IsArray } from 'class-validator';
import { GeneratedReports } from './generated-reports.entity';

export enum FeedbackType {
    ANNOTATION = 'annotation',
    ARBITRATION = 'arbitration',
    QUALITY_REVIEW = 'quality_review',
    CORRECTION = 'correction',
    APPROVAL = 'approval'
}

export enum FeedbackRating {
    EXCELLENT = 'excellent',
    GOOD = 'good',
    AVERAGE = 'average',
    POOR = 'poor',
    BAD = 'bad'
}

export enum FeedbackStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    REJECTED = 'rejected',
    ARCHIVED = 'archived'
}

/**
 * @description 存储人工反馈循环数据，为仲裁界面提供历史仲裁记录
 * 这是"历史仲裁记录"面板的核心数据源，也是系统智能进化的"黄金燃料"
 */
@Entity({ name: 'human_feedback_loop' })
@Index(['feedback_type', 'status'])
@Index(['stock_code', 'feedback_date'])
@Index(['reviewer', 'created_at'])
export class HumanFeedbackLoop {
    // 添加索引签名以支持动态属性访问
    [key: string]: any;
    
    @PrimaryGeneratedColumn('uuid')
    feedback_id: string;

    /**
     * @description 反馈类型，用于分类和路由
     * @example "arbitration", "annotation", "quality_review"
     */
    @Column({
        type: 'enum',
        enum: FeedbackType,
        nullable: false
    })
    @IsEnum(FeedbackType)
    @IsNotEmpty()
    feedback_type: FeedbackType;

    /**
     * @description 源数据类型，标识反馈针对的具体内容
     * @example "attribution_report", "news_score", "event_chain", "prediction"
     */
    @Column({ type: 'varchar', length: 50, nullable: false })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    source_type: string;

    /**
     * @description 源数据ID，关联具体的分析结果
     * @example "report_12345", "event_67890", "prediction_abcde"
     */
    @Column({ type: 'varchar', length: 100, nullable: false })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    source_id: string;

    /**
     * @description 关联的报告ID（可选）
     * @example "550e8400-e29b-41d4-a716-446655440000"
     */
    @Column({ type: 'uuid', nullable: true })
    @IsOptional()
    @IsUUID()
    report_id: string | null;

    /**
     * @description 股票代码
     * @example "600519.SH"
     */
    @Column({ type: 'varchar', length: 20, nullable: true })
    @IsString()
    @IsOptional()
    @MaxLength(20)
    stock_code: string | null;

    /**
     * @description 反馈日期
     * @example "2024-10-28"
     */
    @Column({ type: 'date', nullable: false })
    @IsDateString()
    @IsNotEmpty()
    feedback_date: string;

    /**
     * @description 反馈状态
     * @example "completed", "pending", "in_progress"
     */
    @Column({
        type: 'enum',
        enum: FeedbackStatus,
        default: FeedbackStatus.PENDING
    })
    @IsEnum(FeedbackStatus)
    @IsNotEmpty()
    status: FeedbackStatus;

    // ==================== 原始AI输出 ====================

    /**
     * @description 原始AI输出内容，用于对比分析
     * @example {"prediction": "看涨", "confidence": 0.85, "reasoning": "基于技术分析..."}
     */
    @Column({ type: 'jsonb', nullable: false })
    @IsNotEmpty()
    @IsObject()
    original_output: object;

    /**
     * @description 原始AI输出摘要，用于快速识别
     * @example "AI预测600519.SH未来5日看涨，置信度85%"
     */
    @Column({ type: 'text', nullable: true })
    @IsString()
    @IsOptional()
    original_summary: string | null;

    // ==================== 人工反馈内容 ====================

    /**
     * @description 人工反馈内容，包含具体的修正意见
     * @example {"correct_prediction": "看跌", "correct_confidence": 0.65, "feedback": "AI忽略了政策风险"}
     */
    @Column({ type: 'jsonb', nullable: false })
    @IsNotEmpty()
    @IsObject()
    human_feedback: object;

    /**
     * @description 反馈评分，用于量化反馈质量
     * @example 4 (1-5之间，5为最高质量)
     */
    @Column({ type: 'integer', nullable: true })
    @IsOptional()
    @Min(1)
    @Max(5)
    feedback_score: number | null;

    /**
     * @description 反馈评论，提供详细的文字说明
     * @example "AI的分析过于乐观，忽略了宏观经济下行风险和政策不确定性"
     */
    @Column({ type: 'text', nullable: true })
    @IsString()
    @IsOptional()
    feedback_comment: string | null;

    /**
     * @description 正确的归因分析，当AI归因错误时提供
     * @example "真正原因是第三大股东发布了减持公告，AI完全忽略了这一重要信息"
     */
    @Column({ type: 'text', nullable: true })
    @IsString()
    @IsOptional()
    correct_attribution: string | null;

    /**
     * @description 正确的预测结果，当AI预测错误时提供
     * @example "基于政策风险和技术面分析，该股票未来5日更可能下跌"
     */
    @Column({ type: 'text', nullable: true })
    @IsString()
    @IsOptional()
    correct_prediction: string | null;

    // ==================== 质量评级 ====================

    /**
     * @description 质量评级，由专家给出
     * @example "good", "excellent", "poor"
     */
    @Column({
        type: 'enum',
        enum: FeedbackRating,
        nullable: true
    })
    @IsEnum(FeedbackRating)
    @IsOptional()
    rating: FeedbackRating | null;

    /**
     * @description 准确性评分（0-1）
     * @example 0.75 (75%的准确性)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Max(1)
    accuracy_score: number | null;

    /**
     * @description 完整性评分（0-1）
     * @example 0.85 (85%的完整性)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Max(1)
    completeness_score: number | null;

    /**
     * @description 逻辑性评分（0-1）
     * @example 0.90 (90%的逻辑性)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Max(1)
    logic_score: number | null;

    /**
     * @description 创新性评分（0-1）
     * @example 0.65 (65%的创新性)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Max(1)
    innovation_score: number | null;

    // ==================== 审核信息 ====================

    /**
     * @description 审核者标识
     * @example "admin", "senior_analyst", "quality_reviewer"
     */
    @Column({ type: 'varchar', length: 100, nullable: false })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    reviewer: string;

    /**
     * @description 审核者角色
     * @example "首席分析师", "风控经理", "质量审核员"
     */
    @Column({ type: 'varchar', length: 100, nullable: true })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    reviewer_role: string | null;

    /**
     * @description 审核者经验等级
     * @example "senior", "expert", "master"
     */
    @Column({ type: 'varchar', length: 50, nullable: true })
    @IsString()
    @IsOptional()
    @MaxLength(50)
    reviewer_level: string | null;

    /**
     * @description 审核意见，提供详细的审核反馈
     * @example "报告质量良好，建议增加行业对比分析，提高预测的准确性"
     */
    @Column({ type: 'text', nullable: true })
    @IsString()
    @IsOptional()
    review_comment: string | null;

    /**
     * @description 审核时间
     * @example "2024-10-28T15:30:00Z"
     */
    @Column({ type: 'timestamp', nullable: true })
    @IsOptional()
    review_time: Date | null;

    // ==================== 优先级和分类 ====================

    /**
     * @description 优先级（1-5）
     * @example 3 (中等优先级)
     */
    @Column({ type: 'integer', default: 1 })
    @IsNumber()
    @IsNotEmpty()
    @Min(1)
    @Max(5)
    priority: number;

    /**
     * @description 标签列表，用于分类和搜索
     * @example ["财报分析", "技术面", "政策风险", "需要改进"]
     */
    @Column({ type: 'text', array: true, nullable: true })
    @IsOptional()
    @IsArray()
    tags: string[] | null;

    /**
     * @description 行业分类
     * @example "食品饮料", "新能源", "医药生物"
     */
    @Column({ type: 'varchar', length: 100, nullable: true })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    industry: string | null;

    /**
     * @description 概念板块
     * @example "白酒", "锂电池", "创新药"
     */
    @Column({ type: 'varchar', length: 100, nullable: true })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    concept: string | null;

    // ==================== 学习价值 ====================

    /**
     * @description 学习价值评分（0-1）
     * @example 0.85 (85%的学习价值)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Max(1)
    learning_value: number | null;

    /**
     * @description 是否用于模型训练
     * @example true
     */
    @Column({ type: 'boolean', default: false })
    @IsOptional()
    used_for_training: boolean;

    /**
     * @description 训练效果评分（0-1）
     * @example 0.78 (78%的训练效果)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Max(1)
    training_effectiveness: number | null;

    // ==================== 关联关系 ====================

    /**
     * @description 与生成报告的关联关系
     */
    @ManyToOne(() => GeneratedReports, report => report.feedbacks)
    @JoinColumn({ name: 'report_id' })
    report: GeneratedReports;

    // ==================== 元数据 ====================

    /**
     * @description 反馈元数据，存储额外的结构化信息
     * @example {"processing_time": "2.5s", "ai_model": "kimi-v1-8k", "confidence": 0.85}
     */
    @Column({ type: 'jsonb', nullable: true })
    @IsOptional()
    metadata: object | null;

    /**
     * @description 数据来源标识
     * @example "arbitration_interface", "quality_review", "manual_annotation"
     */
    @Column({ type: 'varchar', length: 50, nullable: true })
    @IsString()
    @IsOptional()
    @MaxLength(50)
    data_source: string | null;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    constructor() {
        // 确保任何通过 new HumanFeedbackLoop() 创建的实例，
        // status字段都有一个确定的值，与数据库默认值保持一致
        this.status = FeedbackStatus.PENDING;
        // 设置默认优先级
        this.priority = 1;
        
        // 初始化所有必填字段
        this.feedback_id = '';
        this.feedback_type = FeedbackType.ARBITRATION;
        this.source_type = '';
        this.source_id = '';
        this.feedback_date = new Date().toISOString();
        this.original_output = {};
        this.human_feedback = {};
        this.reviewer = '';
        this.used_for_training = false;
        this.created_at = new Date();
        this.updated_at = new Date();
        
        // 初始化所有可为空字段
        this.report_id = null;
        this.stock_code = null;
        this.original_summary = null;
        this.feedback_score = null;
        this.feedback_comment = null;
        this.correct_attribution = null;
        this.correct_prediction = null;
        this.rating = null;
        this.accuracy_score = null;
        this.completeness_score = null;
        this.logic_score = null;
        this.innovation_score = null;
        this.reviewer_role = null;
        this.reviewer_level = null;
        this.review_comment = null;
        this.review_time = null;
        this.tags = null;
        this.industry = null;
        this.concept = null;
        this.learning_value = null;
        this.training_effectiveness = null;
        this.metadata = null;
        this.data_source = null;
        this.report = null as any;
    }
}

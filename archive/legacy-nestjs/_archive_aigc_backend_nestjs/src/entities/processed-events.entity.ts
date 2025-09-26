import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsDateString, IsEnum, MaxLength, IsUUID, Min, Max, IsObject } from 'class-validator';

export enum EventType {
    NEWS = 'news',
    ANNOUNCEMENT = 'announcement',
    E_INTERACTION = 'e_interaction',
    FINANCIAL_REPORT = 'financial_report',
    OTHER = 'other'
}

export enum EventStatus {
    PENDING = 'pending',
    PROCESSED = 'processed',
    FAILED = 'failed'
}

/**
 * @description 存储处理后的原始事件数据，为仲裁界面提供原始文本证据
 * 这是"原始文本浏览器"面板的核心数据源
 */
@Entity({ name: 'processed_events' })
@Index(['event_type', 'published_at'])
@Index(['related_stocks'])
@Index(['status', 'created_at'])
export class ProcessedEvents {
    // 添加索引签名以支持动态属性访问
    [key: string]: any;

    @PrimaryGeneratedColumn('uuid')
    event_id: string;

    /**
     * @description 事件类型，用于分类和过滤
     * @example "news", "announcement", "e_interaction"
     */
    @Column({
        type: 'enum',
        enum: EventType,
        nullable: false
    })
    @IsEnum(EventType)
    @IsNotEmpty()
    event_type: EventType;

    /**
     * @description 事件标题，用于快速识别和搜索
     * @example "公司发布2024年第三季度财务报告"
     */
    @Column({ type: 'varchar', length: 500, nullable: false })
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    title: string;

    /**
     * @description 事件完整内容，包含所有原始文本信息
     * @example "公司于2024年10月28日发布第三季度财务报告，营收同比增长15.2%..."
     */
    @Column({ type: 'text', nullable: false })
    @IsString()
    @IsNotEmpty()
    content: string;

    /**
     * @description 事件来源URL，用于追溯和验证
     * @example "https://www.sse.com.cn/disclosure/announcement/company/600519_20241028_1.pdf"
     */
    @Column({ type: 'varchar', length: 1000, nullable: true })
    @IsString()
    @IsOptional()
    @MaxLength(1000)
    source_url: string | null;

    /**
     * @description 事件发布时间，用于时间线排序
     * @example "2024-10-28T09:30:00Z"
     */
    @Column({ type: 'timestamp', nullable: false })
    @IsDateString()
    @IsNotEmpty()
    published_at: string;

    /**
     * @description 关联的股票代码列表，支持多股票关联
     * @example ["600519.SH", "000858.SZ"]
     */
    @Column({ type: 'text', array: true, nullable: true })
    @IsArray()
    @IsOptional()
    related_stocks: string[] | null;

    /**
     * @description 事件关键词标签，用于快速分类和搜索
     * @example ["财报", "营收增长", "新能源", "产能扩张"]
     */
    @Column({ type: 'text', array: true, nullable: true })
    @IsArray()
    @IsOptional()
    keywords: string[] | null;

    /**
     * @description 事件处理状态，用于跟踪处理进度
     * @example "processed", "pending", "failed"
     */
    @Column({
        type: 'enum',
        enum: EventStatus,
        default: EventStatus.PENDING
    })
    @IsEnum(EventStatus)
    @IsNotEmpty()
    status: EventStatus;

    /**
     * @description 事件重要性评分，由AI分析得出
     * @example 0.85 (0-1之间，1为最重要)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Max(1)
    importance_score: number | null;

    /**
     * @description 事件情感倾向评分，由AI分析得出
     * @example 0.65 (0-1之间，1为最积极)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Max(1)
    sentiment_score: number | null;

    /**
     * @description 原始数据来源标识
     * @example "tushare", "eastmoney", "sse", "szse"
     */
    @Column({ type: 'varchar', length: 50, nullable: true })
    @IsString()
    @IsOptional()
    @MaxLength(50)
    data_source: string | null;

    /**
     * @description 处理过程中的错误信息，用于调试和监控
     * @example "Failed to extract keywords: Invalid text format"
     */
    @Column({ type: 'text', nullable: true })
    @IsString()
    @IsOptional()
    error_message: string | null;

    /**
     * @description 事件元数据，存储额外的结构化信息
     * @example {"author": "公司董事会", "file_size": "2.5MB", "page_count": 15}
     */
    @Column({ type: 'jsonb', nullable: true })
    @IsOptional()
    @IsObject()
    metadata: object | null;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    constructor() {
        // 确保任何通过 new ProcessedEvents() 创建的实例，
        // status字段都有一个确定的值，与数据库默认值保持一致
        this.status = EventStatus.PENDING;
        // 初始化所有必填字段以避免TypeScript严格模式错误
        this.event_id = '';
        this.event_type = EventType.NEWS;
        this.title = '';
        this.content = '';
        this.published_at = new Date().toISOString();
        this.created_at = new Date();
        this.updated_at = new Date();
        // 初始化所有可为空字段
        this.source_url = null;
        this.related_stocks = null;
        this.keywords = null;
        this.importance_score = null;
        this.sentiment_score = null;
        this.data_source = null;
        this.error_message = null;
        this.metadata = null;
    }
}

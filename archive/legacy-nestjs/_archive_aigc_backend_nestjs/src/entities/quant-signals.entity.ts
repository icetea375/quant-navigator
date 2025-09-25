import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, MaxLength, IsNumber, Min, Max, IsObject } from 'class-validator';

export enum SignalType {
    INDIVIDUAL = 'individual',
    MARKET = 'market',
    MACRO = 'macro',
    STYLE = 'style',
    INDUSTRY = 'industry'
}

export enum SignalStatus {
    ACTIVE = 'active',
    EXPIRED = 'expired',
    CANCELLED = 'cancelled',
    ARCHIVED = 'archived'
}

/**
 * @description 存储量化信号数据，为仲裁界面提供量化信号仪表盘
 * 这是"量化信号仪表盘"面板的核心数据源
 */
@Entity({ name: 'quant_signals' })
@Index(['target_code', 'signal_date'])
@Index(['signal_type', 'status'])
@Index(['created_at'])
export class QuantSignals {
    // 添加索引签名以支持动态属性访问
    [key: string]: any;
    
    @PrimaryGeneratedColumn('uuid')
    signal_id: string;

    /**
     * @description 目标股票代码或市场标识
     * @example "600519.SH", "000001.SH", "macro_market"
     */
    @Column({ type: 'varchar', length: 20, nullable: false })
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    target_code: string;

    /**
     * @description 信号日期
     * @example "2024-10-28"
     */
    @Column({ type: 'date', nullable: false })
    @IsDateString()
    @IsNotEmpty()
    signal_date: string;

    /**
     * @description 信号类型，用于分类和过滤
     * @example "individual", "market", "macro", "style"
     */
    @Column({
        type: 'enum',
        enum: SignalType,
        nullable: false
    })
    @IsEnum(SignalType)
    @IsNotEmpty()
    signal_type: SignalType;

    /**
     * @description 信号状态
     * @example "active", "expired", "cancelled"
     */
    @Column({
        type: 'enum',
        enum: SignalStatus,
        default: SignalStatus.ACTIVE
    })
    @IsEnum(SignalStatus)
    @IsNotEmpty()
    status: SignalStatus;

    // ==================== 个股信号指标 ====================

    /**
     * @description 收益率Z分数，衡量个股相对市场表现
     * @example 2.35 (超过2表示显著异常)
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    return_z_score: number | null;

    /**
     * @description 成交量Z分数，衡量交易活跃度异常
     * @example 1.85 (超过1.5表示成交量异常)
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    volume_z_score: number | null;

    /**
     * @description 价格动量Z分数，衡量价格趋势强度
     * @example 2.10 (正值表示上涨动量)
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    momentum_z_score: number | null;

    /**
     * @description 波动率Z分数，衡量价格波动异常
     * @example 1.45 (超过1表示波动率异常)
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    volatility_z_score: number | null;

    // ==================== 市场背景信号 ====================

    /**
     * @description 宏观风险偏好Z分数
     * @example -1.20 (负值表示风险偏好下降)
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    macro_risk_z_score: number | null;

    /**
     * @description 市场风格Z分数
     * @example 1.65 (正值表示成长风格占优)
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    market_style_z_score: number | null;

    /**
     * @description 行业轮动Z分数
     * @example 0.85 (正值表示该行业相对强势)
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    industry_rotation_z_score: number | null;

    /**
     * @description 概念板块Z分数
     * @example 2.25 (正值表示该概念板块强势)
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    concept_z_score: number | null;

    // ==================== 管理层可信度因子 ====================

    /**
     * @description MD&A承诺兑现率（0-1）
     * @example 0.85 (85%的承诺得到兑现)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Max(1)
    mda_fulfillment_rate: number | null;

    /**
     * @description 管理层可信度评分（0-1）
     * @example 0.78 (综合评分)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Max(1)
    management_credibility_score: number | null;

    /**
     * @description 信息披露质量评分（0-1）
     * @example 0.82 (信息披露质量较高)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Max(1)
    disclosure_quality_score: number | null;

    /**
     * @description 财务透明度评分（0-1）
     * @example 0.90 (财务透明度很高)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Max(1)
    financial_transparency_score: number | null;

    // ==================== 技术分析信号 ====================

    /**
     * @description RSI相对强弱指数
     * @example 65.5 (50以上为强势)
     */
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Max(100)
    rsi: number | null;

    /**
     * @description MACD信号强度
     * @example 1.25 (正值表示买入信号)
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    macd_signal: number | null;

    /**
     * @description 布林带位置（0-1）
     * @example 0.75 (0.8以上为超买)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Max(1)
    bollinger_position: number | null;

    /**
     * @description 移动平均线信号
     * @example 1.0 (1为多头排列，-1为空头排列)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    ma_signal: number | null;

    // ==================== 综合评分 ====================

    /**
     * @description 综合信号强度（-1到1）
     * @example 0.65 (正值表示看涨信号)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(-1)
    @Max(1)
    overall_signal_strength: number | null;

    /**
     * @description 信号置信度（0-1）
     * @example 0.82 (82%的置信度)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Max(1)
    signal_confidence: number | null;

    /**
     * @description 信号有效期（天数）
     * @example 5 (5个交易日有效)
     */
    @Column({ type: 'integer', nullable: true })
    @IsOptional()
    @Min(1)
    validity_days: number | null;

    // ==================== 元数据 ====================

    /**
     * @description 计算模型版本
     * @example "v2.1", "lightgbm-v1.0"
     */
    @Column({ type: 'varchar', length: 50, nullable: true })
    @IsString()
    @IsOptional()
    @MaxLength(50)
    model_version: string | null;

    /**
     * @description 计算参数配置
     * @example {"lookback_days": 90, "z_score_threshold": 2.0}
     */
    @Column({ type: 'jsonb', nullable: true })
    @IsOptional()
    @IsObject()
    calculation_params: object | null;

    /**
     * @description 信号来源标识
     * @example "quant_engine", "ml_model", "rule_based"
     */
    @Column({ type: 'varchar', length: 50, nullable: true })
    @IsString()
    @IsOptional()
    @MaxLength(50)
    source: string | null;

    /**
     * @description 信号元数据，存储额外的结构化信息
     * @example {"calculation_time": "0.5s", "data_points": 1000, "accuracy": 0.75}
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
        // 确保任何通过 new QuantSignals() 创建的实例，
        // status字段都有一个确定的值，与数据库默认值保持一致
        this.status = SignalStatus.ACTIVE;
        
        // 初始化所有必填字段
        this.signal_id = '';
        this.target_code = '';
        this.signal_date = new Date().toISOString();
        this.signal_type = SignalType.INDIVIDUAL;
        this.created_at = new Date();
        this.updated_at = new Date();
        
        // 初始化所有可为空字段
        this.return_z_score = null;
        this.volume_z_score = null;
        this.momentum_z_score = null;
        this.volatility_z_score = null;
        this.macro_risk_z_score = null;
        this.market_style_z_score = null;
        this.industry_rotation_z_score = null;
        this.concept_z_score = null;
        this.mda_fulfillment_rate = null;
        this.management_credibility_score = null;
        this.disclosure_quality_score = null;
        this.financial_transparency_score = null;
        this.rsi = null;
        this.macd_signal = null;
        this.bollinger_position = null;
        this.ma_signal = null;
        this.overall_signal_strength = null;
        this.signal_confidence = null;
        this.validity_days = null;
        this.model_version = null;
        this.calculation_params = null;
        this.source = null;
        this.metadata = null;
    }
}

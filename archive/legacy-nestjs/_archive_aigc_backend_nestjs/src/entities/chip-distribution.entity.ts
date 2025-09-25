import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, MaxLength, IsNumber, Min, Max } from 'class-validator';

export enum DistributionType {
    COST_DISTRIBUTION = 'cost_distribution',
    VOLUME_DISTRIBUTION = 'volume_distribution',
    PRICE_DISTRIBUTION = 'price_distribution'
}

export enum ChipStatus {
    ACTIVE = 'active',
    LOCKED = 'locked',
    FLOATING = 'floating'
}

/**
 * @description 存储筹码分布数据，为仲裁界面提供资金流向与筹码分布
 * 这是"资金流向与筹码分布"面板的筹码分布数据源
 */
@Entity({ name: 'chip_distribution' })
@Index(['stock_code', 'distribution_date'])
@Index(['distribution_type', 'chip_status'])
@Index(['created_at'])
export class ChipDistribution {
    @PrimaryGeneratedColumn('uuid')
    distribution_id: string;

    /**
     * @description 股票代码
     * @example "600519.SH"
     */
    @Column({ type: 'varchar', length: 20, nullable: false })
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    stock_code: string;

    /**
     * @description 分布日期
     * @example "2024-10-28"
     */
    @Column({ type: 'date', nullable: false })
    @IsDateString()
    @IsNotEmpty()
    distribution_date: Date;

    /**
     * @description 分布类型
     * @example "cost_distribution", "volume_distribution", "price_distribution"
     */
    @Column({
        type: 'enum',
        enum: DistributionType,
        nullable: false
    })
    @IsEnum(DistributionType)
    @IsNotEmpty()
    distribution_type: DistributionType;

    /**
     * @description 筹码状态
     * @example "active", "locked", "floating"
     */
    @Column({
        type: 'enum',
        enum: ChipStatus,
        nullable: false
    })
    @IsEnum(ChipStatus)
    @IsNotEmpty()
    chip_status: ChipStatus;

    // ==================== 价格区间数据 ====================

    /**
     * @description 价格区间下限（元）
     * @example 42.50
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: false })
    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    price_lower: number;

    /**
     * @description 价格区间上限（元）
     * @example 48.90
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: false })
    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    price_upper: number;

    /**
     * @description 价格区间中值（元）
     * @example 45.70
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    @Min(0)
    price_median: number;

    // ==================== 筹码数量数据 ====================

    /**
     * @description 筹码数量（万股）
     * @example 1500.50
     */
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    chip_quantity: number;

    /**
     * @description 筹码数量占比（%）
     * @example 25.50 (占总筹码的25.5%)
     */
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Min(100)
    chip_ratio: number;

    /**
     * @description 筹码金额（万元）
     * @example 68500.25
     */
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    chip_amount: number;

    /**
     * @description 筹码金额占比（%）
     * @example 28.75 (占总金额的28.75%)
     */
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Min(100)
    chip_amount_ratio: number;

    // ==================== 成本分布数据 ====================

    /**
     * @description 平均成本（元）
     * @example 45.67
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    @Min(0)
    average_cost: number;

    /**
     * @description 成本集中度（0-1）
     * @example 0.65 (65%的筹码集中在此区间)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Min(1)
    cost_concentration: number;

    /**
     * @description 成本分散度（0-1）
     * @example 0.35 (35%的分散度)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Min(1)
    cost_dispersion: number;

    // ==================== 盈亏分析 ====================

    /**
     * @description 当前价格（元）
     * @example 46.20
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    @Min(0)
    current_price: number;

    /**
     * @description 盈亏比例（%）
     * @example 1.16 (盈利1.16%)
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    profit_loss_ratio: number;

    /**
     * @description 盈亏金额（万元）
     * @example 795.50 (盈利795.5万元)
     */
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    @IsOptional()
    profit_loss_amount: number;

    /**
     * @description 盈亏状态
     * @example "profit", "loss", "break_even"
     */
    @Column({ type: 'varchar', length: 20, nullable: true })
    @IsString()
    @IsOptional()
    @MaxLength(20)
    profit_loss_status: string;

    // ==================== 筹码流动分析 ====================

    /**
     * @description 筹码流入量（万股）
     * @example 200.50
     */
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    chip_inflow: number;

    /**
     * @description 筹码流出量（万股）
     * @example 150.25
     */
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    chip_outflow: number;

    /**
     * @description 净筹码流动（万股）
     * @example 50.25 (正值表示净流入)
     */
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    @IsOptional()
    net_chip_flow: number;

    /**
     * @description 筹码流动强度（0-1）
     * @example 0.75 (75%的流动强度)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Min(1)
    chip_flow_intensity: number;

    // ==================== 历史对比数据 ====================

    /**
     * @description 相比5日前变化率（%）
     * @example 15.25 (比5日前增加15.25%)
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    change_vs_5d: number;

    /**
     * @description 相比10日前变化率（%）
     * @example 8.75 (比10日前增加8.75%)
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    change_vs_10d: number;

    /**
     * @description 相比20日前变化率（%）
     * @example -5.50 (比20日前减少5.5%)
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    change_vs_20d: number;

    /**
     * @description 相比历史平均变化率（%）
     * @example 12.50 (比历史平均高12.5%)
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    change_vs_historical: number;

    // ==================== 统计分析 ====================

    /**
     * @description 筹码分布标准差
     * @example 2.35
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    @Min(0)
    distribution_std: number;

    /**
     * @description 筹码分布偏度
     * @example 0.25 (正值表示右偏)
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    distribution_skewness: number;

    /**
     * @description 筹码分布峰度
     * @example 2.85 (大于3表示尖峰分布)
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    distribution_kurtosis: number;

    // ==================== 元数据 ====================

    /**
     * @description 计算模型版本
     * @example "v2.1", "chip_analysis_v1.0"
     */
    @Column({ type: 'varchar', length: 50, nullable: true })
    @IsString()
    @IsOptional()
    @MaxLength(50)
    model_version: string;

    /**
     * @description 计算参数配置
     * @example {"lookback_days": 20, "price_bins": 50, "smoothing_factor": 0.1}
     */
    @Column({ type: 'jsonb', nullable: true })
    @IsOptional()
    calculation_params: object;

    /**
     * @description 数据来源标识
     * @example "tushare", "wind", "eastmoney"
     */
    @Column({ type: 'varchar', length: 50, nullable: true })
    @IsString()
    @IsOptional()
    @MaxLength(50)
    data_source: string;

    /**
     * @description 数据更新时间
     * @example "2024-10-28T15:30:00Z"
     */
    @Column({ type: 'timestamp', nullable: true })
    @IsOptional()
    data_updated_at: Date;

    /**
     * @description 筹码分布元数据，存储额外的结构化信息
     * @example {"calculation_time": "1.2s", "data_points": 5000, "accuracy": 0.88}
     */
    @Column({ type: 'jsonb', nullable: true })
    @IsOptional()
    metadata: object;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, MaxLength, IsNumber, Min } from 'class-validator';

export enum FlowType {
    MAIN_FORCE = 'main_force',
    SUPER_LARGE = 'super_large',
    LARGE = 'large',
    MEDIUM = 'medium',
    SMALL = 'small'
}

export enum FlowDirection {
    INFLOW = 'inflow',
    OUTFLOW = 'outflow',
    NET = 'net'
}

/**
 * @description 存储资金流向数据，为仲裁界面提供资金流向与筹码分布
 * 这是"资金流向与筹码分布"面板的核心数据源
 */
@Entity({ name: 'money_flow' })
@Index(['stock_code', 'flow_date'])
@Index(['flow_type', 'flow_direction'])
@Index(['created_at'])
export class MoneyFlow {
    @PrimaryGeneratedColumn('uuid')
    flow_id: string;

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
     * @description 资金流向日期
     * @example "2024-10-28"
     */
    @Column({ type: 'date', nullable: false })
    @IsDateString()
    @IsNotEmpty()
    flow_date: Date;

    /**
     * @description 资金类型
     * @example "main_force", "super_large", "large"
     */
    @Column({
        type: 'enum',
        enum: FlowType,
        nullable: false
    })
    @IsEnum(FlowType)
    @IsNotEmpty()
    flow_type: FlowType;

    /**
     * @description 资金方向
     * @example "inflow", "outflow", "net"
     */
    @Column({
        type: 'enum',
        enum: FlowDirection,
        nullable: false
    })
    @IsEnum(FlowDirection)
    @IsNotEmpty()
    flow_direction: FlowDirection;

    // ==================== 资金流向金额 ====================

    /**
     * @description 资金净流入金额（万元）
     * @example 15000.50 (正值表示净流入)
     */
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
    @IsNumber()
    @IsNotEmpty()
    net_amount: number;

    /**
     * @description 买入金额（万元）
     * @example 25000.75
     */
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    buy_amount: number;

    /**
     * @description 卖出金额（万元）
     * @example 10000.25
     */
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    sell_amount: number;

    /**
     * @description 成交金额（万元）
     * @example 35000.00
     */
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    total_amount: number;

    // ==================== 资金流向比例 ====================

    /**
     * @description 净流入占成交额比例（%）
     * @example 42.86 (42.86%的成交额为净流入)
     */
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    @IsOptional()
    net_inflow_ratio: number;

    /**
     * @description 主力资金占比（%）
     * @example 35.50 (主力资金占35.5%)
     */
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Min(100)
    main_force_ratio: number;

    /**
     * @description 散户资金占比（%）
     * @example 64.50 (散户资金占64.5%)
     */
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Min(100)
    retail_ratio: number;

    // ==================== 资金流向强度 ====================

    /**
     * @description 资金流向强度评分（0-1）
     * @example 0.75 (75%的强度)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Min(1)
    flow_intensity: number;

    /**
     * @description 资金流向异常度（Z分数）
     * @example 2.15 (超过2表示异常)
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    flow_anomaly_score: number;

    /**
     * @description 资金流向趋势（-1到1）
     * @example 0.65 (正值表示流入趋势)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(-1)
    @Min(1)
    flow_trend: number;

    // ==================== 历史对比数据 ====================

    /**
     * @description 5日平均净流入（万元）
     * @example 8000.25
     */
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    @IsOptional()
    avg_net_inflow_5d: number;

    /**
     * @description 10日平均净流入（万元）
     * @example 12000.50
     */
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    @IsOptional()
    avg_net_inflow_10d: number;

    /**
     * @description 20日平均净流入（万元）
     * @example 15000.75
     */
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    @IsOptional()
    avg_net_inflow_20d: number;

    /**
     * @description 相比5日平均变化率（%）
     * @example 87.50 (比5日平均高87.5%)
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    change_vs_5d_avg: number;

    /**
     * @description 相比10日平均变化率（%）
     * @example 25.00 (比10日平均高25%)
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    change_vs_10d_avg: number;

    /**
     * @description 相比20日平均变化率（%）
     * @example 0.00 (与20日平均持平)
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    change_vs_20d_avg: number;

    // ==================== 筹码分布数据 ====================

    /**
     * @description 当前价格（元）
     * @example 45.67
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    @Min(0)
    current_price: number;

    /**
     * @description 90%成本区间下限（元）
     * @example 42.50
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    @Min(0)
    cost_range_lower: number;

    /**
     * @description 90%成本区间上限（元）
     * @example 48.90
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    @Min(0)
    cost_range_upper: number;

    /**
     * @description 主要筹码峰价格（元）
     * @example 46.20
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    @Min(0)
    main_chip_peak: number;

    /**
     * @description 筹码集中度（0-1）
     * @example 0.65 (65%的筹码集中在主要区间)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Min(1)
    chip_concentration: number;

    // ==================== 元数据 ====================

    /**
     * @description 数据来源标识
     * @example "tushare", "eastmoney", "wind"
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
     * @description 资金流向元数据，存储额外的结构化信息
     * @example {"calculation_method": "volume_weighted", "sample_size": 1000, "confidence": 0.85}
     */
    @Column({ type: 'jsonb', nullable: true })
    @IsOptional()
    metadata: object;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}

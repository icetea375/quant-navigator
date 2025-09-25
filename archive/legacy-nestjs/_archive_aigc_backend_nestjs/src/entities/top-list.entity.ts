import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, MaxLength, IsNumber, Min } from 'class-validator';

export enum ListType {
    DRAGON_TIGER = 'dragon_tiger',
    TOP_GAINERS = 'top_gainers',
    TOP_LOSERS = 'top_losers',
    TOP_VOLUME = 'top_volume',
    TOP_TURNOVER = 'top_turnover'
}

export enum SeatType {
    BUY = 'buy',
    SELL = 'sell',
    NET = 'net'
}

/**
 * @description 存储龙虎榜数据，为仲裁界面提供资金流向与筹码分布
 * 这是"资金流向与筹码分布"面板的龙虎榜数据源
 */
@Entity({ name: 'top_list' })
@Index(['stock_code', 'list_date'])
@Index(['list_type', 'seat_type'])
@Index(['created_at'])
export class TopList {
    @PrimaryGeneratedColumn('uuid')
    list_id: string;

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
     * @description 上榜日期
     * @example "2024-10-28"
     */
    @Column({ type: 'date', nullable: false })
    @IsDateString()
    @IsNotEmpty()
    list_date: Date;

    /**
     * @description 榜单类型
     * @example "dragon_tiger", "top_gainers", "top_losers"
     */
    @Column({
        type: 'enum',
        enum: ListType,
        nullable: false
    })
    @IsEnum(ListType)
    @IsNotEmpty()
    list_type: ListType;

    /**
     * @description 席位类型
     * @example "buy", "sell", "net"
     */
    @Column({
        type: 'enum',
        enum: SeatType,
        nullable: false
    })
    @IsEnum(SeatType)
    @IsNotEmpty()
    seat_type: SeatType;

    // ==================== 席位信息 ====================

    /**
     * @description 席位名称
     * @example "国泰君安证券上海分公司"
     */
    @Column({ type: 'varchar', length: 200, nullable: false })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    seat_name: string;

    /**
     * @description 席位代码
     * @example "600000"
     */
    @Column({ type: 'varchar', length: 20, nullable: true })
    @IsString()
    @IsOptional()
    @MaxLength(20)
    seat_code: string;

    /**
     * @description 席位类型描述
     * @example "机构专用", "营业部", "深股通专用"
     */
    @Column({ type: 'varchar', length: 100, nullable: true })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    seat_category: string;

    // ==================== 交易金额 ====================

    /**
     * @description 买入金额（万元）
     * @example 15000.50
     */
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    buy_amount: number;

    /**
     * @description 卖出金额（万元）
     * @example 8000.25
     */
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    sell_amount: number;

    /**
     * @description 净买入金额（万元）
     * @example 7000.25 (正值表示净买入)
     */
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    @IsOptional()
    net_amount: number;

    /**
     * @description 成交金额（万元）
     * @example 23000.75
     */
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    total_amount: number;

    // ==================== 交易比例 ====================

    /**
     * @description 买入占成交额比例（%）
     * @example 65.22 (买入占65.22%)
     */
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Min(100)
    buy_ratio: number;

    /**
     * @description 卖出占成交额比例（%）
     * @example 34.78 (卖出占34.78%)
     */
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Min(100)
    sell_ratio: number;

    /**
     * @description 净买入占成交额比例（%）
     * @example 30.44 (净买入占30.44%)
     */
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    @IsOptional()
    net_ratio: number;

    // ==================== 排名信息 ====================

    /**
     * @description 买入排名
     * @example 1 (买入排名第1)
     */
    @Column({ type: 'integer', nullable: true })
    @IsOptional()
    @Min(1)
    buy_rank: number;

    /**
     * @description 卖出排名
     * @example 3 (卖出排名第3)
     */
    @Column({ type: 'integer', nullable: true })
    @IsOptional()
    @Min(1)
    sell_rank: number;

    /**
     * @description 净买入排名
     * @example 2 (净买入排名第2)
     */
    @Column({ type: 'integer', nullable: true })
    @IsOptional()
    @Min(1)
    net_rank: number;

    /**
     * @description 总排名
     * @example 1 (总排名第1)
     */
    @Column({ type: 'integer', nullable: true })
    @IsOptional()
    @Min(1)
    total_rank: number;

    // ==================== 市场影响 ====================

    /**
     * @description 对股价影响评分（-1到1）
     * @example 0.75 (正值表示推高股价)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(-1)
    @Min(1)
    price_impact_score: number;

    /**
     * @description 市场关注度评分（0-1）
     * @example 0.85 (85%的关注度)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Min(1)
    attention_score: number;

    /**
     * @description 异常度评分（0-1）
     * @example 0.90 (90%的异常度)
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Min(1)
    anomaly_score: number;

    // ==================== 历史对比 ====================

    /**
     * @description 相比历史平均变化率（%）
     * @example 150.25 (比历史平均高150.25%)
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    change_vs_historical: number;

    /**
     * @description 连续上榜天数
     * @example 3 (连续3天上榜)
     */
    @Column({ type: 'integer', nullable: true })
    @IsOptional()
    @Min(0)
    consecutive_days: number;

    /**
     * @description 本月上榜次数
     * @example 5 (本月上榜5次)
     */
    @Column({ type: 'integer', nullable: true })
    @IsOptional()
    @Min(0)
    monthly_count: number;

    // ==================== 元数据 ====================

    /**
     * @description 上榜原因
     * @example "日涨幅偏离值达7%", "连续三个交易日内涨幅偏离值累计达20%"
     */
    @Column({ type: 'varchar', length: 500, nullable: true })
    @IsString()
    @IsOptional()
    @MaxLength(500)
    list_reason: string;

    /**
     * @description 数据来源标识
     * @example "sse", "szse", "tushare"
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
     * @description 龙虎榜元数据，存储额外的结构化信息
     * @example {"exchange": "SSE", "market_cap": "5000000", "pe_ratio": 15.5}
     */
    @Column({ type: 'jsonb', nullable: true })
    @IsOptional()
    metadata: object;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}

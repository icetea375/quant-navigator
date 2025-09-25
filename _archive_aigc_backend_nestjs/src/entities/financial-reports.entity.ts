import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, MaxLength, IsNumber, Min, Max, IsObject } from 'class-validator';

export enum ReportPeriod {
    Q1 = 'Q1',
    Q2 = 'Q2',
    Q3 = 'Q3',
    Q4 = 'Q4',
    ANNUAL = 'annual'
}

export enum ReportStatus {
    DRAFT = 'draft',
    PUBLISHED = 'published',
    REVISED = 'revised',
    ARCHIVED = 'archived'
}

/**
 * @description 存储公司财务报告数据，为仲裁界面提供财务快照
 * 这是"财务数据快照"面板的核心数据源
 */
@Entity({ name: 'financial_reports' })
@Index(['stock_code', 'report_date'])
@Index(['report_period', 'fiscal_year'])
@Index(['created_at'])
export class FinancialReports {
    // 添加索引签名以支持动态属性访问
    [key: string]: any;
    
    @PrimaryGeneratedColumn('uuid')
    report_id: string;

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
     * @description 报告日期
     * @example "2024-10-28"
     */
    @Column({ type: 'date', nullable: false })
    @IsDateString()
    @IsNotEmpty()
    report_date: string;

    /**
     * @description 报告期间
     * @example "Q3", "Q4", "annual"
     */
    @Column({
        type: 'enum',
        enum: ReportPeriod,
        nullable: false
    })
    @IsEnum(ReportPeriod)
    @IsNotEmpty()
    report_period: ReportPeriod;

    /**
     * @description 会计年度
     * @example 2024
     */
    @Column({ type: 'integer', nullable: false })
    @IsNumber()
    @IsNotEmpty()
    @Min(2000)
    fiscal_year: number;

    /**
     * @description 报告状态
     * @example "published", "draft", "revised"
     */
    @Column({
        type: 'enum',
        enum: ReportStatus,
        default: ReportStatus.DRAFT
    })
    @IsEnum(ReportStatus)
    @IsNotEmpty()
    status: ReportStatus;

    // ==================== 核心财务指标 ====================

    /**
     * @description 营业收入（万元）
     * @example 1500000.50
     */
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    revenue: number | null;

    /**
     * @description 营业收入同比增长率（%）
     * @example 15.25
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    revenue_growth_rate: number | null;

    /**
     * @description 扣非净利润（万元）
     * @example 250000.75
     */
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    net_profit_excluding_non_recurring: number | null;

    /**
     * @description 扣非净利润同比增长率（%）
     * @example 22.18
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    net_profit_growth_rate: number | null;

    /**
     * @description 毛利率（%）
     * @example 45.67
     */
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Max(100)
    gross_margin: number | null;

    /**
     * @description 净利率（%）
     * @example 16.67
     */
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Max(100)
    net_margin: number | null;

    /**
     * @description 经营性现金流净额（万元）
     * @example 180000.25
     */
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    operating_cash_flow: number | null;

    /**
     * @description 研发费用（万元）
     * @example 50000.00
     */
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    r_d_expenses: number | null;

    /**
     * @description 研发费用率（%）
     * @example 3.33
     */
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Max(100)
    r_d_ratio: number | null;

    /**
     * @description 合同负债（万元）
     * @example 80000.50
     */
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    contract_liabilities: number | null;

    // ==================== 资产负债指标 ====================

    /**
     * @description 总资产（万元）
     * @example 5000000.00
     */
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    total_assets: number | null;

    /**
     * @description 总负债（万元）
     * @example 2000000.00
     */
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    total_liabilities: number | null;

    /**
     * @description 净资产（万元）
     * @example 3000000.00
     */
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    net_assets: number | null;

    /**
     * @description 资产负债率（%）
     * @example 40.00
     */
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Max(100)
    debt_to_asset_ratio: number | null;

    // ==================== 盈利能力指标 ====================

    /**
     * @description 净资产收益率（%）
     * @example 8.33
     */
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    @IsOptional()
    roe: number | null;

    /**
     * @description 总资产收益率（%）
     * @example 5.00
     */
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    @IsOptional()
    roa: number | null;

    /**
     * @description 每股收益（元）
     * @example 2.50
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    eps: number | null;

    /**
     * @description 每股净资产（元）
     * @example 30.00
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    @Min(0)
    book_value_per_share: number | null;

    // ==================== 成长性指标 ====================

    /**
     * @description 营业收入3年复合增长率（%）
     * @example 12.50
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    revenue_cagr_3y: number | null;

    /**
     * @description 净利润3年复合增长率（%）
     * @example 18.75
     */
    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    @IsOptional()
    profit_cagr_3y: number | null;

    // ==================== 数据质量指标 ====================

    /**
     * @description 数据完整性评分（0-1）
     * @example 0.95
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    @IsOptional()
    @Min(0)
    @Max(1)
    data_completeness_score: number | null;

    /**
     * @description 数据来源标识
     * @example "tushare", "eastmoney", "company_announcement"
     */
    @Column({ type: 'varchar', length: 50, nullable: true })
    @IsString()
    @IsOptional()
    @MaxLength(50)
    data_source: string | null;

    /**
     * @description 数据更新时间
     * @example "2024-10-28T15:30:00Z"
     */
    @Column({ type: 'timestamp', nullable: true })
    @IsOptional()
    data_updated_at: Date | null;

    /**
     * @description 报告元数据，存储额外的结构化信息
     * @example {"auditor": "普华永道", "report_pages": 45, "file_size": "5.2MB"}
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
        // 确保任何通过 new FinancialReports() 创建的实例，
        // status字段都有一个确定的值，与数据库默认值保持一致
        this.status = ReportStatus.DRAFT;
        
        // 初始化所有必填字段
        this.report_id = '';
        this.stock_code = '';
        this.report_date = new Date().toISOString();
        this.report_period = ReportPeriod.ANNUAL;
        this.fiscal_year = new Date().getFullYear();
        this.created_at = new Date();
        this.updated_at = new Date();
        
        // 初始化所有可为空字段
        this.revenue = null;
        this.revenue_growth_rate = null;
        this.net_profit_excluding_non_recurring = null;
        this.net_profit_growth_rate = null;
        this.gross_margin = null;
        this.net_margin = null;
        this.operating_cash_flow = null;
        this.r_d_expenses = null;
        this.r_d_ratio = null;
        this.contract_liabilities = null;
        this.total_assets = null;
        this.total_liabilities = null;
        this.net_assets = null;
        this.debt_to_asset_ratio = null;
        this.roe = null;
        this.roa = null;
        this.eps = null;
        this.book_value_per_share = null;
        this.revenue_cagr_3y = null;
        this.profit_cagr_3y = null;
        this.data_completeness_score = null;
        this.data_source = null;
        this.data_updated_at = null;
        this.metadata = null;
    }
}

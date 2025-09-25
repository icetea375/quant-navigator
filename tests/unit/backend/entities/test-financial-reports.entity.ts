/**
 * FinancialReports 实体单元测试
 * 测试目标：验证数据校验装饰器 (class-validator) 是否能正常工作
 * 测试框架：Jest + class-validator
 * 测试环境：Node.js
 */

import { validate } from 'class-validator';
import { FinancialReports, ReportPeriod, ReportStatus } from '../../../../aigc/backend/src/entities/financial-reports.entity';

describe('FinancialReports Entity Validation', () => {
    let validFinancialReport: FinancialReports;

    beforeEach(() => {
        // 创建完全符合所有校验规则的有效实体对象
        validFinancialReport = new FinancialReports();
        validFinancialReport.report_id = '550e8400-e29b-41d4-a716-446655440000';
        validFinancialReport.stock_code = '600519.SH';
        validFinancialReport.report_date = '2024-10-28T00:00:00.000Z';
        validFinancialReport.report_period = ReportPeriod.Q3;
        validFinancialReport.fiscal_year = 2024;
        validFinancialReport.status = ReportStatus.PUBLISHED;
        validFinancialReport.revenue = 1500000.50;
        validFinancialReport.revenue_growth_rate = 15.25;
        validFinancialReport.net_profit_excluding_non_recurring = 250000.75;
        validFinancialReport.net_profit_growth_rate = 22.18;
        validFinancialReport.gross_margin = 45.67;
        validFinancialReport.net_margin = 16.67;
        validFinancialReport.operating_cash_flow = 180000.25;
        validFinancialReport.r_d_expenses = 50000.00;
        validFinancialReport.r_d_ratio = 3.33;
        validFinancialReport.contract_liabilities = 80000.50;
        validFinancialReport.total_assets = 5000000.00;
        validFinancialReport.total_liabilities = 2000000.00;
        validFinancialReport.net_assets = 3000000.00;
        validFinancialReport.debt_to_asset_ratio = 40.00;
        validFinancialReport.roe = 8.33;
        validFinancialReport.roa = 5.00;
        validFinancialReport.eps = 2.50;
        validFinancialReport.book_value_per_share = 30.00;
        validFinancialReport.revenue_cagr_3y = 12.50;
        validFinancialReport.profit_cagr_3y = 18.75;
        validFinancialReport.data_completeness_score = 0.95;
        validFinancialReport.data_source = 'tushare';
        validFinancialReport.data_updated_at = new Date('2024-10-28T15:30:00Z');
        validFinancialReport.metadata = { auditor: '普华永道', report_pages: 45, file_size: '5.2MB' };
    });

    describe('正确数据测试', () => {
        it('应该通过所有校验规则', async () => {
            const errors = await validate(validFinancialReport);
            expect(errors).toHaveLength(0);
        });

        it('应该接受所有可选字段为空', async () => {
            const minimalReport = new FinancialReports();
            minimalReport.report_id = '550e8400-e29b-41d4-a716-446655440000';
            minimalReport.stock_code = '600519.SH';
            minimalReport.report_date = '2024-10-28T00:00:00.000Z';
            minimalReport.report_period = ReportPeriod.Q3;
            minimalReport.fiscal_year = 2024;
            minimalReport.status = ReportStatus.DRAFT;

            const errors = await validate(minimalReport);
            expect(errors).toHaveLength(0);
        });
    });

    describe('stock_code 字段校验', () => {
        it('应该拒绝空的 stock_code', async () => {
            validFinancialReport.stock_code = '';
            const errors = await validate(validFinancialReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('stock_code');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });

        it('应该拒绝超过20字符的 stock_code', async () => {
            validFinancialReport.stock_code = 'a'.repeat(21);
            const errors = await validate(validFinancialReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('stock_code');
            expect(errors[0].constraints?.maxLength).toBeDefined();
        });

        it('应该拒绝非字符串类型的 stock_code', async () => {
            validFinancialReport.stock_code = 123 as any;
            const errors = await validate(validFinancialReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('stock_code');
            expect(errors[0].constraints?.isString).toBeDefined();
        });
    });

    describe('report_date 字段校验', () => {
        it('应该拒绝无效的日期格式', async () => {
            validFinancialReport.report_date = 'invalid-date' as any;
            const errors = await validate(validFinancialReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('report_date');
            expect(errors[0].constraints?.isDateString).toBeDefined();
        });

        it('应该拒绝空的 report_date', async () => {
            validFinancialReport.report_date = null as any;
            const errors = await validate(validFinancialReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('report_date');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });
    });

    describe('report_period 字段校验', () => {
        it('应该拒绝无效的 report_period', async () => {
            validFinancialReport.report_period = 'invalid_period' as ReportPeriod;
            const errors = await validate(validFinancialReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('report_period');
            expect(errors[0].constraints?.isEnum).toBeDefined();
        });

        it('应该拒绝空的 report_period', async () => {
            validFinancialReport.report_period = null as any;
            const errors = await validate(validFinancialReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('report_period');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });
    });

    describe('fiscal_year 字段校验', () => {
        it('应该拒绝小于2000的 fiscal_year', async () => {
            validFinancialReport.fiscal_year = 1999;
            const errors = await validate(validFinancialReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('fiscal_year');
            expect(errors[0].constraints?.min).toBeDefined();
        });

        it('应该拒绝非数字类型的 fiscal_year', async () => {
            validFinancialReport.fiscal_year = 'not-number' as any;
            const errors = await validate(validFinancialReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('fiscal_year');
            expect(errors[0].constraints?.isNumber).toBeDefined();
        });

        it('应该拒绝空的 fiscal_year', async () => {
            validFinancialReport.fiscal_year = null as any;
            const errors = await validate(validFinancialReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('fiscal_year');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });
    });

    describe('status 字段校验', () => {
        it('应该拒绝无效的 status', async () => {
            validFinancialReport.status = 'invalid_status' as ReportStatus;
            const errors = await validate(validFinancialReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('status');
            expect(errors[0].constraints?.isEnum).toBeDefined();
        });

        it('应该拒绝空的 status', async () => {
            validFinancialReport.status = null as any;
            const errors = await validate(validFinancialReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('status');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });
    });

    describe('财务数据字段校验 (非负数)', () => {
        const financialFields = [
            'revenue', 'net_profit_excluding_non_recurring', 'operating_cash_flow',
            'r_d_expenses', 'contract_liabilities', 'total_assets', 'total_liabilities',
            'net_assets', 'book_value_per_share'
        ];

        financialFields.forEach(field => {
            it(`应该拒绝小于0的 ${field}`, async () => {
                (validFinancialReport as any)[field] = -0.1;
                const errors = await validate(validFinancialReport);
                expect(errors).toHaveLength(1);
                expect(errors[0].property).toBe(field);
                expect(errors[0].constraints?.min).toBeDefined();
            });

            it(`应该接受空的 ${field}`, async () => {
                (validFinancialReport as any)[field] = null;
                const errors = await validate(validFinancialReport);
                expect(errors).toHaveLength(0);
            });
        });
    });

    describe('百分比字段校验 (0-100范围)', () => {
        const percentageFields = [
            'gross_margin', 'net_margin', 'r_d_ratio', 'debt_to_asset_ratio'
        ];

        percentageFields.forEach(field => {
            it(`应该拒绝小于0的 ${field}`, async () => {
                (validFinancialReport as any)[field] = -0.1;
                const errors = await validate(validFinancialReport);
                expect(errors).toHaveLength(1);
                expect(errors[0].property).toBe(field);
                expect(errors[0].constraints?.min).toBeDefined();
            });

            it(`应该拒绝大于100的 ${field}`, async () => {
                (validFinancialReport as any)[field] = 100.1;
                const errors = await validate(validFinancialReport);
                expect(errors).toHaveLength(1);
                expect(errors[0].property).toBe(field);
                expect(errors[0].constraints?.max).toBeDefined();
            });

            it(`应该接受空的 ${field}`, async () => {
                (validFinancialReport as any)[field] = null;
                const errors = await validate(validFinancialReport);
                expect(errors).toHaveLength(0);
            });
        });
    });

    describe('data_completeness_score 字段校验', () => {
        it('应该拒绝小于0的 data_completeness_score', async () => {
            validFinancialReport.data_completeness_score = -0.1;
            const errors = await validate(validFinancialReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('data_completeness_score');
            expect(errors[0].constraints?.min).toBeDefined();
        });

        it('应该拒绝大于1的 data_completeness_score', async () => {
            validFinancialReport.data_completeness_score = 1.1;
            const errors = await validate(validFinancialReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('data_completeness_score');
            expect(errors[0].constraints?.max).toBeDefined();
        });

        it('应该接受空的 data_completeness_score', async () => {
            validFinancialReport.data_completeness_score = null;
            const errors = await validate(validFinancialReport);
            expect(errors).toHaveLength(0);
        });
    });

    describe('data_source 字段校验', () => {
        it('应该拒绝超过50字符的 data_source', async () => {
            validFinancialReport.data_source = 'a'.repeat(51);
            const errors = await validate(validFinancialReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('data_source');
            expect(errors[0].constraints?.maxLength).toBeDefined();
        });

        it('应该接受空的 data_source', async () => {
            validFinancialReport.data_source = null;
            const errors = await validate(validFinancialReport);
            expect(errors).toHaveLength(0);
        });
    });

    describe('metadata 字段校验', () => {
        it('应该拒绝非对象类型的 metadata', async () => {
            validFinancialReport.metadata = 'not-object' as any;
            const errors = await validate(validFinancialReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('metadata');
            expect(errors[0].constraints?.isObject).toBeDefined();
        });

        it('应该接受空的 metadata', async () => {
            validFinancialReport.metadata = null;
            const errors = await validate(validFinancialReport);
            expect(errors).toHaveLength(0);
        });
    });

    describe('边界值测试', () => {
        it('应该接受最大长度的 stock_code', async () => {
            validFinancialReport.stock_code = 'a'.repeat(20);
            const errors = await validate(validFinancialReport);
            expect(errors).toHaveLength(0);
        });

        it('应该接受最大长度的 data_source', async () => {
            validFinancialReport.data_source = 'a'.repeat(50);
            const errors = await validate(validFinancialReport);
            expect(errors).toHaveLength(0);
        });

        it('应该接受边界值的 fiscal_year', async () => {
            validFinancialReport.fiscal_year = 2000;
            const errors = await validate(validFinancialReport);
            expect(errors).toHaveLength(0);
        });

        it('应该接受边界值的百分比字段', async () => {
            const percentageFields = [
                'gross_margin', 'net_margin', 'r_d_ratio', 'debt_to_asset_ratio'
            ];

            for (const field of percentageFields) {
                (validFinancialReport as any)[field] = 0;
                const errors = await validate(validFinancialReport);
                expect(errors).toHaveLength(0);

                (validFinancialReport as any)[field] = 100;
                const errors2 = await validate(validFinancialReport);
                expect(errors2).toHaveLength(0);
            }
        });

        it('应该接受边界值的 data_completeness_score', async () => {
            validFinancialReport.data_completeness_score = 0;
            const errors = await validate(validFinancialReport);
            expect(errors).toHaveLength(0);

            validFinancialReport.data_completeness_score = 1;
            const errors2 = await validate(validFinancialReport);
            expect(errors2).toHaveLength(0);
        });
    });

    describe('枚举值测试', () => {
        it('应该接受所有有效的 ReportPeriod 值', async () => {
            const reportPeriods = Object.values(ReportPeriod);
            for (const reportPeriod of reportPeriods) {
                validFinancialReport.report_period = reportPeriod;
                const errors = await validate(validFinancialReport);
                expect(errors).toHaveLength(0);
            }
        });

        it('应该接受所有有效的 ReportStatus 值', async () => {
            const reportStatuses = Object.values(ReportStatus);
            for (const reportStatus of reportStatuses) {
                validFinancialReport.status = reportStatus;
                const errors = await validate(validFinancialReport);
                expect(errors).toHaveLength(0);
            }
        });
    });
});

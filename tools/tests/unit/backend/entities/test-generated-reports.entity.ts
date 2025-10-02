/**
 * GeneratedReports 实体单元测试
 * 测试目标：验证数据校验装饰器 (class-validator) 是否能正常工作
 * 测试框架：Jest + class-validator
 * 测试环境：Node.js
 */

import { validate } from 'class-validator';
import { GeneratedReports, ReportType, ReportStatus } from '../../../../aigc/backend/src/entities/generated-reports.entity';

describe('GeneratedReports Entity Validation', () => {
    let validGeneratedReport: GeneratedReports;

    beforeEach(() => {
        // 创建完全符合所有校验规则的有效实体对象
        validGeneratedReport = new GeneratedReports();
        validGeneratedReport.report_id = '550e8400-e29b-41d4-a716-446655440000';
        validGeneratedReport.report_type = ReportType.ATTRIBUTION_ANALYSIS;
        validGeneratedReport.target_code = '600519.SH';
        validGeneratedReport.report_date = '2024-10-28T00:00:00.000Z';
        validGeneratedReport.title = '600519.SH 2024Q3 归因分析报告';
        validGeneratedReport.summary = '基于多维度分析，该股票异常表现主要归因于新能源业务突破...';
        validGeneratedReport.content = '## 执行摘要\n\n### 核心发现\n1. 新能源业务营收增长...';
        validGeneratedReport.status = ReportStatus.APPROVED;
        validGeneratedReport.confidence_score = 0.85;
        validGeneratedReport.quality_score = 4.2;
        validGeneratedReport.model_used = 'kimi-v1-8k';
        validGeneratedReport.version = '1.0';
        validGeneratedReport.key_findings = ['新能源业务营收增长35%', '管理层承诺兑现率85%', '技术指标显示超买信号'];
        validGeneratedReport.risk_factors = ['行业竞争加剧', '政策不确定性', '技术迭代风险'];
        validGeneratedReport.metadata = { processing_time: '2.5s', token_count: 1500, api_calls: 3 };
        validGeneratedReport.created_by = 'ai_system';
        validGeneratedReport.reviewed_by = 'admin';
        validGeneratedReport.review_comment = '报告质量良好，建议增加行业对比分析';
    });

    describe('正确数据测试', () => {
        it('应该通过所有校验规则', async () => {
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(0);
        });

        it('应该接受所有可选字段为空', async () => {
            const minimalReport = new GeneratedReports();
            minimalReport.report_id = '550e8400-e29b-41d4-a716-446655440000';
            minimalReport.report_type = ReportType.ATTRIBUTION_ANALYSIS;
            minimalReport.target_code = '600519.SH';
            minimalReport.report_date = '2024-10-28T00:00:00.000Z';
            minimalReport.title = '测试报告';
            minimalReport.summary = '测试摘要';
            minimalReport.content = '测试内容';
            minimalReport.status = ReportStatus.DRAFT;
            minimalReport.version = '1.0';
            minimalReport.created_by = 'ai_system';

            const errors = await validate(minimalReport);
            expect(errors).toHaveLength(0);
        });
    });

    describe('report_type 字段校验', () => {
        it('应该拒绝无效的 report_type', async () => {
            validGeneratedReport.report_type = 'invalid_type' as ReportType;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('report_type');
            expect(errors[0].constraints?.isEnum).toBeDefined();
        });

        it('应该拒绝空的 report_type', async () => {
            validGeneratedReport.report_type = null as any;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('report_type');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });
    });

    describe('target_code 字段校验', () => {
        it('应该拒绝空的 target_code', async () => {
            validGeneratedReport.target_code = '';
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('target_code');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });

        it('应该拒绝超过20字符的 target_code', async () => {
            validGeneratedReport.target_code = 'a'.repeat(21);
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('target_code');
            expect(errors[0].constraints?.maxLength).toBeDefined();
        });

        it('应该拒绝非字符串类型的 target_code', async () => {
            validGeneratedReport.target_code = 123 as any;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('target_code');
            expect(errors[0].constraints?.isString).toBeDefined();
        });
    });

    describe('report_date 字段校验', () => {
        it('应该拒绝无效的日期格式', async () => {
            validGeneratedReport.report_date = 'invalid-date';
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('report_date');
            expect(errors[0].constraints?.isDateString).toBeDefined();
        });

        it('应该拒绝空的 report_date', async () => {
            validGeneratedReport.report_date = null as any;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('report_date');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });
    });

    describe('title 字段校验', () => {
        it('应该拒绝空的 title', async () => {
            validGeneratedReport.title = '';
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('title');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });

        it('应该拒绝超过200字符的 title', async () => {
            validGeneratedReport.title = 'a'.repeat(201);
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('title');
            expect(errors[0].constraints?.maxLength).toBeDefined();
        });

        it('应该拒绝非字符串类型的 title', async () => {
            validGeneratedReport.title = 123 as any;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('title');
            expect(errors[0].constraints?.isString).toBeDefined();
        });
    });

    describe('summary 字段校验', () => {
        it('应该拒绝空的 summary', async () => {
            validGeneratedReport.summary = '';
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('summary');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });

        it('应该拒绝非字符串类型的 summary', async () => {
            validGeneratedReport.summary = 123 as any;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('summary');
            expect(errors[0].constraints?.isString).toBeDefined();
        });
    });

    describe('content 字段校验', () => {
        it('应该拒绝空的 content', async () => {
            validGeneratedReport.content = '';
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('content');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });

        it('应该拒绝非字符串类型的 content', async () => {
            validGeneratedReport.content = 123 as any;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('content');
            expect(errors[0].constraints?.isString).toBeDefined();
        });
    });

    describe('status 字段校验', () => {
        it('应该拒绝无效的 status', async () => {
            validGeneratedReport.status = 'invalid_status' as ReportStatus;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('status');
            expect(errors[0].constraints?.isEnum).toBeDefined();
        });

        it('应该拒绝空的 status', async () => {
            validGeneratedReport.status = null as any;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('status');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });
    });

    describe('confidence_score 字段校验', () => {
        it('应该拒绝小于0的 confidence_score', async () => {
            validGeneratedReport.confidence_score = -0.1;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('confidence_score');
            expect(errors[0].constraints?.min).toBeDefined();
        });

        it('应该拒绝大于1的 confidence_score', async () => {
            validGeneratedReport.confidence_score = 1.1;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('confidence_score');
            expect(errors[0].constraints?.max).toBeDefined();
        });

        it('应该接受空的 confidence_score', async () => {
            validGeneratedReport.confidence_score = null;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(0);
        });
    });

    describe('quality_score 字段校验', () => {
        it('应该拒绝小于1的 quality_score', async () => {
            validGeneratedReport.quality_score = 0.5;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('quality_score');
            expect(errors[0].constraints?.min).toBeDefined();
        });

        it('应该拒绝大于5的 quality_score', async () => {
            validGeneratedReport.quality_score = 5.5;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('quality_score');
            expect(errors[0].constraints?.max).toBeDefined();
        });

        it('应该接受空的 quality_score', async () => {
            validGeneratedReport.quality_score = null;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(0);
        });
    });

    describe('model_used 字段校验', () => {
        it('应该拒绝超过100字符的 model_used', async () => {
            validGeneratedReport.model_used = 'a'.repeat(101);
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('model_used');
            expect(errors[0].constraints?.maxLength).toBeDefined();
        });

        it('应该接受空的 model_used', async () => {
            validGeneratedReport.model_used = null;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(0);
        });
    });

    describe('version 字段校验', () => {
        it('应该拒绝空的 version', async () => {
            validGeneratedReport.version = '';
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('version');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });

        it('应该拒绝超过10字符的 version', async () => {
            validGeneratedReport.version = 'a'.repeat(11);
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('version');
            expect(errors[0].constraints?.maxLength).toBeDefined();
        });

        it('应该拒绝非字符串类型的 version', async () => {
            validGeneratedReport.version = 123 as any;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('version');
            expect(errors[0].constraints?.isString).toBeDefined();
        });
    });

    describe('key_findings 字段校验', () => {
        it('应该拒绝非数组类型的 key_findings', async () => {
            validGeneratedReport.key_findings = 'not-array' as any;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('key_findings');
            expect(errors[0].constraints?.isArray).toBeDefined();
        });

        it('应该接受空的 key_findings', async () => {
            validGeneratedReport.key_findings = null;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(0);
        });
    });

    describe('risk_factors 字段校验', () => {
        it('应该拒绝非数组类型的 risk_factors', async () => {
            validGeneratedReport.risk_factors = 'not-array' as any;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('risk_factors');
            expect(errors[0].constraints?.isArray).toBeDefined();
        });

        it('应该接受空的 risk_factors', async () => {
            validGeneratedReport.risk_factors = null;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(0);
        });
    });

    describe('created_by 字段校验', () => {
        it('应该拒绝空的 created_by', async () => {
            validGeneratedReport.created_by = '';
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('created_by');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });

        it('应该拒绝超过50字符的 created_by', async () => {
            validGeneratedReport.created_by = 'a'.repeat(51);
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('created_by');
            expect(errors[0].constraints?.maxLength).toBeDefined();
        });

        it('应该拒绝非字符串类型的 created_by', async () => {
            validGeneratedReport.created_by = 123 as any;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('created_by');
            expect(errors[0].constraints?.isString).toBeDefined();
        });
    });

    describe('reviewed_by 字段校验', () => {
        it('应该拒绝超过50字符的 reviewed_by', async () => {
            validGeneratedReport.reviewed_by = 'a'.repeat(51);
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('reviewed_by');
            expect(errors[0].constraints?.maxLength).toBeDefined();
        });

        it('应该接受空的 reviewed_by', async () => {
            validGeneratedReport.reviewed_by = null;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(0);
        });
    });

    describe('review_comment 字段校验', () => {
        it('应该拒绝非字符串类型的 review_comment', async () => {
            validGeneratedReport.review_comment = 123 as any;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('review_comment');
            expect(errors[0].constraints?.isString).toBeDefined();
        });

        it('应该接受空的 review_comment', async () => {
            validGeneratedReport.review_comment = null;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(0);
        });
    });

    describe('metadata 字段校验', () => {
        it('应该拒绝非对象类型的 metadata', async () => {
            validGeneratedReport.metadata = 'not-object' as any;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('metadata');
            expect(errors[0].constraints?.isObject).toBeDefined();
        });

        it('应该接受空的 metadata', async () => {
            validGeneratedReport.metadata = null;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(0);
        });
    });

    describe('边界值测试', () => {
        it('应该接受最大长度的 target_code', async () => {
            validGeneratedReport.target_code = 'a'.repeat(20);
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(0);
        });

        it('应该接受最大长度的 title', async () => {
            validGeneratedReport.title = 'a'.repeat(200);
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(0);
        });

        it('应该接受最大长度的 model_used', async () => {
            validGeneratedReport.model_used = 'a'.repeat(100);
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(0);
        });

        it('应该接受最大长度的 version', async () => {
            validGeneratedReport.version = 'a'.repeat(10);
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(0);
        });

        it('应该接受最大长度的 created_by', async () => {
            validGeneratedReport.created_by = 'a'.repeat(50);
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(0);
        });

        it('应该接受边界值的 confidence_score', async () => {
            validGeneratedReport.confidence_score = 0;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(0);

            validGeneratedReport.confidence_score = 1;
            const errors2 = await validate(validGeneratedReport);
            expect(errors2).toHaveLength(0);
        });

        it('应该接受边界值的 quality_score', async () => {
            validGeneratedReport.quality_score = 1;
            const errors = await validate(validGeneratedReport);
            expect(errors).toHaveLength(0);

            validGeneratedReport.quality_score = 5;
            const errors2 = await validate(validGeneratedReport);
            expect(errors2).toHaveLength(0);
        });
    });

    describe('枚举值测试', () => {
        it('应该接受所有有效的 ReportType 值', async () => {
            const reportTypes = Object.values(ReportType);
            for (const reportType of reportTypes) {
                validGeneratedReport.report_type = reportType;
                const errors = await validate(validGeneratedReport);
                expect(errors).toHaveLength(0);
            }
        });

        it('应该接受所有有效的 ReportStatus 值', async () => {
            const reportStatuses = Object.values(ReportStatus);
            for (const reportStatus of reportStatuses) {
                validGeneratedReport.status = reportStatus;
                const errors = await validate(validGeneratedReport);
                expect(errors).toHaveLength(0);
            }
        });
    });
});

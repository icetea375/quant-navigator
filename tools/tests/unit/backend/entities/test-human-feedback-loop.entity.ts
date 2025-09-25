/**
 * HumanFeedbackLoop 实体单元测试
 * 测试目标：验证数据校验装饰器 (class-validator) 是否能正常工作
 * 测试框架：Jest + class-validator
 * 测试环境：Node.js
 */

import { validate } from 'class-validator';
import { HumanFeedbackLoop, FeedbackType, FeedbackRating, FeedbackStatus } from '../../../../aigc/backend/src/entities/human-feedback-loop.entity';

describe('HumanFeedbackLoop Entity Validation', () => {
    let validFeedback: HumanFeedbackLoop;

    beforeEach(() => {
        // 创建完全符合所有校验规则的有效实体对象
        validFeedback = new HumanFeedbackLoop();
        validFeedback.feedback_id = '550e8400-e29b-41d4-a716-446655440000';
        validFeedback.feedback_type = FeedbackType.ARBITRATION;
        validFeedback.source_type = 'attribution_report';
        validFeedback.source_id = 'report_12345';
        validFeedback.report_id = '550e8400-e29b-41d4-a716-446655440001';
        validFeedback.stock_code = '600519.SH';
        validFeedback.feedback_date = '2024-10-28T00:00:00.000Z';
        validFeedback.status = FeedbackStatus.COMPLETED;
        validFeedback.original_output = { prediction: '看涨', confidence: 0.85, reasoning: '基于技术分析...' };
        validFeedback.original_summary = 'AI预测600519.SH未来5日看涨，置信度85%';
        validFeedback.human_feedback = { correct_prediction: '看跌', correct_confidence: 0.65, feedback: 'AI忽略了政策风险' };
        validFeedback.feedback_score = 4;
        validFeedback.feedback_comment = 'AI的分析过于乐观，忽略了宏观经济下行风险和政策不确定性';
        validFeedback.correct_attribution = '真正原因是第三大股东发布了减持公告，AI完全忽略了这一重要信息';
        validFeedback.correct_prediction = '基于政策风险和技术面分析，该股票未来5日更可能下跌';
        validFeedback.rating = FeedbackRating.GOOD;
        validFeedback.accuracy_score = 0.75;
        validFeedback.completeness_score = 0.85;
        validFeedback.logic_score = 0.90;
        validFeedback.innovation_score = 0.65;
        validFeedback.reviewer = 'admin';
        validFeedback.reviewer_role = '首席分析师';
        validFeedback.reviewer_level = 'senior';
        validFeedback.review_comment = '报告质量良好，建议增加行业对比分析，提高预测的准确性';
        validFeedback.review_time = new Date('2024-10-28T15:30:00Z');
        validFeedback.priority = 3;
        validFeedback.tags = ['财报分析', '技术面', '政策风险', '需要改进'];
        validFeedback.industry = '食品饮料';
        validFeedback.concept = '白酒';
        validFeedback.learning_value = 0.85;
        validFeedback.used_for_training = true;
        validFeedback.training_effectiveness = 0.78;
        validFeedback.metadata = { processing_time: '2.5s', ai_model: 'kimi-v1-8k', confidence: 0.85 };
        validFeedback.data_source = 'arbitration_interface';
    });

    describe('正确数据测试', () => {
        it('应该通过所有校验规则', async () => {
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(0);
        });

        it('应该接受所有可选字段为空', async () => {
            const minimalFeedback = new HumanFeedbackLoop();
            minimalFeedback.feedback_id = '550e8400-e29b-41d4-a716-446655440000';
            minimalFeedback.feedback_type = FeedbackType.ARBITRATION;
            minimalFeedback.source_type = 'attribution_report';
            minimalFeedback.source_id = 'report_12345';
            minimalFeedback.feedback_date = '2024-10-28T00:00:00.000Z';
            minimalFeedback.status = FeedbackStatus.PENDING;
            minimalFeedback.original_output = { prediction: '看涨' };
            minimalFeedback.human_feedback = { correct_prediction: '看跌' };
            minimalFeedback.reviewer = 'admin';
            minimalFeedback.priority = 1;

            const errors = await validate(minimalFeedback);
            expect(errors).toHaveLength(0);
        });
    });

    describe('feedback_type 字段校验', () => {
        it('应该拒绝无效的 feedback_type', async () => {
            validFeedback.feedback_type = 'invalid_type' as FeedbackType;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('feedback_type');
            expect(errors[0].constraints?.isEnum).toBeDefined();
        });

        it('应该拒绝空的 feedback_type', async () => {
            validFeedback.feedback_type = null as any;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('feedback_type');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });
    });

    describe('source_type 字段校验', () => {
        it('应该拒绝空的 source_type', async () => {
            validFeedback.source_type = '';
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('source_type');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });

        it('应该拒绝超过50字符的 source_type', async () => {
            validFeedback.source_type = 'a'.repeat(51);
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('source_type');
            expect(errors[0].constraints?.maxLength).toBeDefined();
        });

        it('应该拒绝非字符串类型的 source_type', async () => {
            validFeedback.source_type = 123 as any;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('source_type');
            expect(errors[0].constraints?.isString).toBeDefined();
        });
    });

    describe('source_id 字段校验', () => {
        it('应该拒绝空的 source_id', async () => {
            validFeedback.source_id = '';
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('source_id');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });

        it('应该拒绝超过100字符的 source_id', async () => {
            validFeedback.source_id = 'a'.repeat(101);
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('source_id');
            expect(errors[0].constraints?.maxLength).toBeDefined();
        });

        it('应该拒绝非字符串类型的 source_id', async () => {
            validFeedback.source_id = 123 as any;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('source_id');
            expect(errors[0].constraints?.isString).toBeDefined();
        });
    });

    describe('report_id 字段校验', () => {
        it('应该拒绝无效的UUID格式', async () => {
            validFeedback.report_id = 'invalid-uuid';
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('report_id');
            expect(errors[0].constraints?.isUuid).toBeDefined();
        });

        it('应该接受空的 report_id', async () => {
            validFeedback.report_id = null;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(0);
        });
    });

    describe('stock_code 字段校验', () => {
        it('应该拒绝超过20字符的 stock_code', async () => {
            validFeedback.stock_code = 'a'.repeat(21);
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('stock_code');
            expect(errors[0].constraints?.maxLength).toBeDefined();
        });

        it('应该接受空的 stock_code', async () => {
            validFeedback.stock_code = null;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(0);
        });
    });

    describe('feedback_date 字段校验', () => {
        it('应该拒绝无效的日期格式', async () => {
            validFeedback.feedback_date = 'invalid-date';
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('feedback_date');
            expect(errors[0].constraints?.isDateString).toBeDefined();
        });

        it('应该拒绝空的 feedback_date', async () => {
            validFeedback.feedback_date = null as any;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('feedback_date');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });
    });

    describe('status 字段校验', () => {
        it('应该拒绝无效的 status', async () => {
            validFeedback.status = 'invalid_status' as FeedbackStatus;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('status');
            expect(errors[0].constraints?.isEnum).toBeDefined();
        });

        it('应该拒绝空的 status', async () => {
            validFeedback.status = null as any;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('status');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });
    });

    describe('original_output 字段校验', () => {
        it('应该拒绝空的 original_output', async () => {
            validFeedback.original_output = null as any;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('original_output');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });

        it('应该拒绝非对象类型的 original_output', async () => {
            validFeedback.original_output = 'not-object' as any;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('original_output');
            expect(errors[0].constraints?.isObject).toBeDefined();
        });
    });

    describe('human_feedback 字段校验', () => {
        it('应该拒绝空的 human_feedback', async () => {
            validFeedback.human_feedback = null as any;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('human_feedback');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });

        it('应该拒绝非对象类型的 human_feedback', async () => {
            validFeedback.human_feedback = 'not-object' as any;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('human_feedback');
            expect(errors[0].constraints?.isObject).toBeDefined();
        });
    });

    describe('feedback_score 字段校验', () => {
        it('应该拒绝小于1的 feedback_score', async () => {
            validFeedback.feedback_score = 0;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('feedback_score');
            expect(errors[0].constraints?.min).toBeDefined();
        });

        it('应该拒绝大于5的 feedback_score', async () => {
            validFeedback.feedback_score = 6;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('feedback_score');
            expect(errors[0].constraints?.max).toBeDefined();
        });

        it('应该接受空的 feedback_score', async () => {
            validFeedback.feedback_score = null;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(0);
        });
    });

    describe('rating 字段校验', () => {
        it('应该拒绝无效的 rating', async () => {
            validFeedback.rating = 'invalid_rating' as FeedbackRating;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('rating');
            expect(errors[0].constraints?.isEnum).toBeDefined();
        });

        it('应该接受空的 rating', async () => {
            validFeedback.rating = null;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(0);
        });
    });

    describe('评分字段校验', () => {
        const scoreFields = [
            'accuracy_score', 'completeness_score', 'logic_score', 
            'innovation_score', 'learning_value', 'training_effectiveness'
        ];

            scoreFields.forEach(field => {
                it(`应该拒绝小于0的 ${field}`, async () => {
                    (validFeedback as any)[field] = -0.1;
                    const errors = await validate(validFeedback);
                    expect(errors).toHaveLength(1);
                    expect(errors[0].property).toBe(field);
                    expect(errors[0].constraints?.min).toBeDefined();
                });

                it(`应该拒绝大于1的 ${field}`, async () => {
                    (validFeedback as any)[field] = 1.1;
                    const errors = await validate(validFeedback);
                    expect(errors).toHaveLength(1);
                    expect(errors[0].property).toBe(field);
                    expect(errors[0].constraints?.max).toBeDefined();
                });

                it(`应该接受空的 ${field}`, async () => {
                    (validFeedback as any)[field] = null;
                    const errors = await validate(validFeedback);
                    expect(errors).toHaveLength(0);
                });
            });
    });

    describe('reviewer 字段校验', () => {
        it('应该拒绝空的 reviewer', async () => {
            validFeedback.reviewer = '';
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('reviewer');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });

        it('应该拒绝超过100字符的 reviewer', async () => {
            validFeedback.reviewer = 'a'.repeat(101);
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('reviewer');
            expect(errors[0].constraints?.maxLength).toBeDefined();
        });

        it('应该拒绝非字符串类型的 reviewer', async () => {
            validFeedback.reviewer = 123 as any;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('reviewer');
            expect(errors[0].constraints?.isString).toBeDefined();
        });
    });

    describe('priority 字段校验', () => {
        it('应该拒绝小于1的 priority', async () => {
            validFeedback.priority = 0;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('priority');
            expect(errors[0].constraints?.min).toBeDefined();
        });

        it('应该拒绝大于5的 priority', async () => {
            validFeedback.priority = 6;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('priority');
            expect(errors[0].constraints?.max).toBeDefined();
        });

        it('应该拒绝非数字类型的 priority', async () => {
            validFeedback.priority = 'not-number' as any;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('priority');
            expect(errors[0].constraints?.isNumber).toBeDefined();
        });
    });

    describe('tags 字段校验', () => {
        it('应该拒绝非数组类型的 tags', async () => {
            validFeedback.tags = 'not-array' as any;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('tags');
            expect(errors[0].constraints?.isArray).toBeDefined();
        });

        it('应该接受空的 tags', async () => {
            validFeedback.tags = null;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(0);
        });
    });

    describe('字符串字段长度校验', () => {
        const stringFields = [
            { field: 'reviewer_role', maxLength: 100 },
            { field: 'reviewer_level', maxLength: 50 },
            { field: 'industry', maxLength: 100 },
            { field: 'concept', maxLength: 100 },
            { field: 'data_source', maxLength: 50 }
        ];

        stringFields.forEach(({ field, maxLength }) => {
            it(`应该拒绝超过${maxLength}字符的 ${field}`, async () => {
                (validFeedback as any)[field] = 'a'.repeat(maxLength + 1);
                const errors = await validate(validFeedback);
                expect(errors).toHaveLength(1);
                expect(errors[0].property).toBe(field);
                expect(errors[0].constraints?.maxLength).toBeDefined();
            });

            it(`应该接受空的 ${field}`, async () => {
                (validFeedback as any)[field] = null;
                const errors = await validate(validFeedback);
                expect(errors).toHaveLength(0);
            });
        });
    });

    describe('边界值测试', () => {
        it('应该接受最大长度的 source_type', async () => {
            validFeedback.source_type = 'a'.repeat(50);
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(0);
        });

        it('应该接受最大长度的 source_id', async () => {
            validFeedback.source_id = 'a'.repeat(100);
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(0);
        });

        it('应该接受最大长度的 stock_code', async () => {
            validFeedback.stock_code = 'a'.repeat(20);
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(0);
        });

        it('应该接受边界值的 feedback_score', async () => {
            validFeedback.feedback_score = 1;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(0);

            validFeedback.feedback_score = 5;
            const errors2 = await validate(validFeedback);
            expect(errors2).toHaveLength(0);
        });

        it('应该接受边界值的 priority', async () => {
            validFeedback.priority = 1;
            const errors = await validate(validFeedback);
            expect(errors).toHaveLength(0);

            validFeedback.priority = 5;
            const errors2 = await validate(validFeedback);
            expect(errors2).toHaveLength(0);
        });

        it('应该接受边界值的评分字段', async () => {
            const scoreFields = [
                'accuracy_score', 'completeness_score', 'logic_score', 
                'innovation_score', 'learning_value', 'training_effectiveness'
            ];

            for (const field of scoreFields) {
                (validFeedback as any)[field] = 0;
                const errors = await validate(validFeedback);
                expect(errors).toHaveLength(0);

                (validFeedback as any)[field] = 1;
                const errors2 = await validate(validFeedback);
                expect(errors2).toHaveLength(0);
            }
        });
    });

    describe('枚举值测试', () => {
        it('应该接受所有有效的 FeedbackType 值', async () => {
            const feedbackTypes = Object.values(FeedbackType);
            for (const feedbackType of feedbackTypes) {
                validFeedback.feedback_type = feedbackType;
                const errors = await validate(validFeedback);
                expect(errors).toHaveLength(0);
            }
        });

        it('应该接受所有有效的 FeedbackRating 值', async () => {
            const feedbackRatings = Object.values(FeedbackRating);
            for (const feedbackRating of feedbackRatings) {
                validFeedback.rating = feedbackRating;
                const errors = await validate(validFeedback);
                expect(errors).toHaveLength(0);
            }
        });

        it('应该接受所有有效的 FeedbackStatus 值', async () => {
            const feedbackStatuses = Object.values(FeedbackStatus);
            for (const feedbackStatus of feedbackStatuses) {
                validFeedback.status = feedbackStatus;
                const errors = await validate(validFeedback);
                expect(errors).toHaveLength(0);
            }
        });
    });
});

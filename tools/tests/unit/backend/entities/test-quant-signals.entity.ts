/**
 * QuantSignals 实体单元测试
 * 测试目标：验证数据校验装饰器 (class-validator) 是否能正常工作
 * 测试框架：Jest + class-validator
 * 测试环境：Node.js
 */

import { validate } from 'class-validator';
import { QuantSignals, SignalType, SignalStatus } from '../../../../aigc/backend/src/entities/quant-signals.entity';

describe('QuantSignals Entity Validation', () => {
    let validQuantSignal: QuantSignals;

    beforeEach(() => {
        // 创建完全符合所有校验规则的有效实体对象
        validQuantSignal = new QuantSignals();
        validQuantSignal.signal_id = '550e8400-e29b-41d4-a716-446655440000';
        validQuantSignal.target_code = '600519.SH';
        validQuantSignal.signal_date = '2024-10-28T00:00:00.000Z';
        validQuantSignal.signal_type = SignalType.INDIVIDUAL;
        validQuantSignal.status = SignalStatus.ACTIVE;
        validQuantSignal.return_z_score = 2.35;
        validQuantSignal.volume_z_score = 1.85;
        validQuantSignal.momentum_z_score = 2.10;
        validQuantSignal.volatility_z_score = 1.45;
        validQuantSignal.macro_risk_z_score = -1.20;
        validQuantSignal.market_style_z_score = 1.65;
        validQuantSignal.industry_rotation_z_score = 0.85;
        validQuantSignal.concept_z_score = 2.25;
        validQuantSignal.mda_fulfillment_rate = 0.85;
        validQuantSignal.management_credibility_score = 0.78;
        validQuantSignal.disclosure_quality_score = 0.82;
        validQuantSignal.financial_transparency_score = 0.90;
        validQuantSignal.rsi = 65.5;
        validQuantSignal.macd_signal = 1.25;
        validQuantSignal.bollinger_position = 0.75;
        validQuantSignal.ma_signal = 1.0;
        validQuantSignal.overall_signal_strength = 0.65;
        validQuantSignal.signal_confidence = 0.82;
        validQuantSignal.validity_days = 5;
        validQuantSignal.model_version = 'v2.1';
        validQuantSignal.calculation_params = { lookback_days: 90, z_score_threshold: 2.0 };
        validQuantSignal.source = 'quant_engine';
        validQuantSignal.metadata = { calculation_time: '0.5s', data_points: 1000, accuracy: 0.75 };
    });

    describe('正确数据测试', () => {
        it('应该通过所有校验规则', async () => {
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(0);
        });

        it('应该接受所有可选字段为空', async () => {
            const minimalSignal = new QuantSignals();
            minimalSignal.signal_id = '550e8400-e29b-41d4-a716-446655440000';
            minimalSignal.target_code = '600519.SH';
            minimalSignal.signal_date = '2024-10-28T00:00:00.000Z';
            minimalSignal.signal_type = SignalType.INDIVIDUAL;
            minimalSignal.status = SignalStatus.ACTIVE;

            const errors = await validate(minimalSignal);
            expect(errors).toHaveLength(0);
        });
    });

    describe('target_code 字段校验', () => {
        it('应该拒绝空的 target_code', async () => {
            validQuantSignal.target_code = '';
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('target_code');
            expect(errors[0].constraints?.isNotEmpty).toBe('target_code should not be empty');
        });

        it('应该拒绝超过20字符的 target_code', async () => {
            validQuantSignal.target_code = 'a'.repeat(21);
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('target_code');
            expect(errors[0].constraints?.maxLength).toBeDefined();
        });

        it('应该拒绝非字符串类型的 target_code', async () => {
            validQuantSignal.target_code = 123 as any;
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('target_code');
            expect(errors[0].constraints?.isString).toBeDefined();
        });
    });

    describe('signal_date 字段校验', () => {
        it('应该拒绝无效的日期格式', async () => {
            validQuantSignal.signal_date = 'invalid-date';
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('signal_date');
            expect(errors[0].constraints?.isDateString).toBeDefined();
        });

        it('应该拒绝空的 signal_date', async () => {
            validQuantSignal.signal_date = null as any;
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('signal_date');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });
    });

    describe('signal_type 字段校验', () => {
        it('应该拒绝无效的 signal_type', async () => {
            validQuantSignal.signal_type = 'invalid_type' as SignalType;
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('signal_type');
            expect(errors[0].constraints?.isEnum).toBeDefined();
        });

        it('应该拒绝空的 signal_type', async () => {
            validQuantSignal.signal_type = null as any;
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('signal_type');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });
    });

    describe('status 字段校验', () => {
        it('应该拒绝无效的 status', async () => {
            validQuantSignal.status = 'invalid_status' as SignalStatus;
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('status');
            expect(errors[0].constraints?.isEnum).toBeDefined();
        });

        it('应该拒绝空的 status', async () => {
            validQuantSignal.status = null as any;
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('status');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });
    });

    describe('评分字段校验 (0-1范围)', () => {
        const scoreFields = [
            'mda_fulfillment_rate', 'management_credibility_score', 
            'disclosure_quality_score', 'financial_transparency_score',
            'bollinger_position', 'signal_confidence'
        ];

            scoreFields.forEach(field => {
                it(`应该拒绝小于0的 ${field}`, async () => {
                    (validQuantSignal as any)[field] = -0.1;
                    const errors = await validate(validQuantSignal);
                    expect(errors).toHaveLength(1);
                    expect(errors[0].property).toBe(field);
                    expect(errors[0].constraints?.min).toBeDefined();
                });

                it(`应该拒绝大于1的 ${field}`, async () => {
                    (validQuantSignal as any)[field] = 1.1;
                    const errors = await validate(validQuantSignal);
                    expect(errors).toHaveLength(1);
                    expect(errors[0].property).toBe(field);
                    expect(errors[0].constraints?.max).toBeDefined();
                });

                it(`应该接受空的 ${field}`, async () => {
                    (validQuantSignal as any)[field] = null;
                    const errors = await validate(validQuantSignal);
                    expect(errors).toHaveLength(0);
                });
            });
    });

    describe('RSI 字段校验', () => {
        it('应该拒绝小于0的 rsi', async () => {
            validQuantSignal.rsi = -0.1;
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('rsi');
            expect(errors[0].constraints?.min).toBeDefined();
        });

        it('应该拒绝大于100的 rsi', async () => {
            validQuantSignal.rsi = 100.1;
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('rsi');
            expect(errors[0].constraints?.max).toBeDefined();
        });

        it('应该接受空的 rsi', async () => {
            validQuantSignal.rsi = null;
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(0);
        });
    });

    describe('overall_signal_strength 字段校验', () => {
        it('应该拒绝小于-1的 overall_signal_strength', async () => {
            validQuantSignal.overall_signal_strength = -1.1;
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('overall_signal_strength');
            expect(errors[0].constraints?.min).toBeDefined();
        });

        it('应该拒绝大于1的 overall_signal_strength', async () => {
            validQuantSignal.overall_signal_strength = 1.1;
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('overall_signal_strength');
            expect(errors[0].constraints?.max).toBeDefined();
        });

        it('应该接受空的 overall_signal_strength', async () => {
            validQuantSignal.overall_signal_strength = null;
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(0);
        });
    });

    describe('validity_days 字段校验', () => {
        it('应该拒绝小于1的 validity_days', async () => {
            validQuantSignal.validity_days = 0;
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('validity_days');
            expect(errors[0].constraints?.min).toBeDefined();
        });

        it('应该接受空的 validity_days', async () => {
            validQuantSignal.validity_days = null;
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(0);
        });
    });

    describe('model_version 字段校验', () => {
        it('应该拒绝超过50字符的 model_version', async () => {
            validQuantSignal.model_version = 'a'.repeat(51);
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('model_version');
            expect(errors[0].constraints?.maxLength).toBeDefined();
        });

        it('应该接受空的 model_version', async () => {
            validQuantSignal.model_version = null;
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(0);
        });
    });

    describe('source 字段校验', () => {
        it('应该拒绝超过50字符的 source', async () => {
            validQuantSignal.source = 'a'.repeat(51);
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('source');
            expect(errors[0].constraints?.maxLength).toBeDefined();
        });

        it('应该接受空的 source', async () => {
            validQuantSignal.source = null;
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(0);
        });
    });

    describe('calculation_params 字段校验', () => {
        it('应该拒绝非对象类型的 calculation_params', async () => {
            validQuantSignal.calculation_params = 'not-object' as any;
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('calculation_params');
            expect(errors[0].constraints?.isObject).toBeDefined();
        });

        it('应该接受空的 calculation_params', async () => {
            validQuantSignal.calculation_params = null;
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(0);
        });
    });

    describe('metadata 字段校验', () => {
        it('应该拒绝非对象类型的 metadata', async () => {
            validQuantSignal.metadata = 'not-object' as any;
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('metadata');
            expect(errors[0].constraints?.isObject).toBeDefined();
        });

        it('应该接受空的 metadata', async () => {
            validQuantSignal.metadata = null;
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(0);
        });
    });

    describe('边界值测试', () => {
        it('应该接受最大长度的 target_code', async () => {
            validQuantSignal.target_code = 'a'.repeat(20);
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(0);
        });

        it('应该接受最大长度的 model_version', async () => {
            validQuantSignal.model_version = 'a'.repeat(50);
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(0);
        });

        it('应该接受最大长度的 source', async () => {
            validQuantSignal.source = 'a'.repeat(50);
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(0);
        });

        it('应该接受边界值的评分字段', async () => {
            const scoreFields = [
                'mda_fulfillment_rate', 'management_credibility_score', 
                'disclosure_quality_score', 'financial_transparency_score',
                'bollinger_position', 'overall_signal_strength', 'signal_confidence'
            ];

            for (const field of scoreFields) {
                (validQuantSignal as any)[field] = 0;
                const errors = await validate(validQuantSignal);
                expect(errors).toHaveLength(0);

                (validQuantSignal as any)[field] = 1;
                const errors2 = await validate(validQuantSignal);
                expect(errors2).toHaveLength(0);
            }
        });

        it('应该接受边界值的 rsi', async () => {
            validQuantSignal.rsi = 0;
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(0);

            validQuantSignal.rsi = 100;
            const errors2 = await validate(validQuantSignal);
            expect(errors2).toHaveLength(0);
        });

        it('应该接受边界值的 overall_signal_strength', async () => {
            validQuantSignal.overall_signal_strength = -1;
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(0);

            validQuantSignal.overall_signal_strength = 1;
            const errors2 = await validate(validQuantSignal);
            expect(errors2).toHaveLength(0);
        });

        it('应该接受边界值的 validity_days', async () => {
            validQuantSignal.validity_days = 1;
            const errors = await validate(validQuantSignal);
            expect(errors).toHaveLength(0);
        });
    });

    describe('枚举值测试', () => {
        it('应该接受所有有效的 SignalType 值', async () => {
            const signalTypes = Object.values(SignalType);
            for (const signalType of signalTypes) {
                validQuantSignal.signal_type = signalType;
                const errors = await validate(validQuantSignal);
                expect(errors).toHaveLength(0);
            }
        });

        it('应该接受所有有效的 SignalStatus 值', async () => {
            const signalStatuses = Object.values(SignalStatus);
            for (const signalStatus of signalStatuses) {
                validQuantSignal.status = signalStatus;
                const errors = await validate(validQuantSignal);
                expect(errors).toHaveLength(0);
            }
        });
    });
});

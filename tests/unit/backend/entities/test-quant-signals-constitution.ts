/**
 * QuantSignals 实体单元测试 - 测试宪法版本
 * 严格遵循测试宪法v1.0.10
 */

import { validate } from 'class-validator';
import { QuantSignals, SignalType, SignalStatus } from '../../../../aigc/backend/src/entities/quant-signals.entity';

describe('QuantSignals Entity Validation - Constitution Compliant', () => {
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
            const testSignal = { ...validQuantSignal };
            testSignal.target_code = '';
            const errors = await validate(testSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('target_code');
            expect(errors[0].constraints?.isNotEmpty).toBe('target_code should not be empty');
        });

        it('应该拒绝超过20字符的 target_code', async () => {
            const testSignal = { ...validQuantSignal };
            testSignal.target_code = 'a'.repeat(21);
            const errors = await validate(testSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('target_code');
            expect(errors[0].constraints?.maxLength).toBe('target_code must be shorter than or equal to 20 characters');
        });
    });

    describe('signal_date 字段校验', () => {
        it('应该拒绝无效的日期格式', async () => {
            const testSignal = { ...validQuantSignal };
            testSignal.signal_date = 'invalid-date';
            const errors = await validate(testSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('signal_date');
            expect(errors[0].constraints?.isDateString).toBe('signal_date must be a valid ISO 8601 date string');
        });

        it('应该拒绝空的 signal_date', async () => {
            const testSignal = { ...validQuantSignal };
            testSignal.signal_date = '';
            const errors = await validate(testSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('signal_date');
            expect(errors[0].constraints?.isNotEmpty).toBe('signal_date should not be empty');
        });
    });

    describe('signal_type 字段校验', () => {
        it('应该拒绝无效的 signal_type', async () => {
            const testSignal = { ...validQuantSignal };
            testSignal.signal_type = 'invalid_type' as SignalType;
            const errors = await validate(testSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('signal_type');
            expect(errors[0].constraints?.isEnum).toBe('signal_type must be one of the following values: individual, market, macro, style, industry');
        });
    });

    describe('数值字段校验', () => {
        it('应该拒绝超出范围的 return_z_score', async () => {
            const testSignal = { ...validQuantSignal };
            testSignal.return_z_score = -0.1;
            const errors = await validate(testSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('return_z_score');
            expect(errors[0].constraints?.min).toBe('return_z_score must not be less than 0');
        });

        it('应该拒绝超出范围的 volume_z_score', async () => {
            const testSignal = { ...validQuantSignal };
            testSignal.volume_z_score = 1.1;
            const errors = await validate(testSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('volume_z_score');
            expect(errors[0].constraints?.max).toBe('volume_z_score must not be greater than 1');
        });
    });

    describe('对象字段校验', () => {
        it('应该拒绝非对象的 calculation_params', async () => {
            const testSignal = { ...validQuantSignal };
            testSignal.calculation_params = 'not-object';
            const errors = await validate(testSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('calculation_params');
            expect(errors[0].constraints?.isObject).toBe('calculation_params must be an object');
        });

        it('应该拒绝非对象的 metadata', async () => {
            const testSignal = { ...validQuantSignal };
            testSignal.metadata = 'not-object';
            const errors = await validate(testSignal);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('metadata');
            expect(errors[0].constraints?.isObject).toBe('metadata must be an object');
        });
    });

    describe('边界值测试', () => {
        it('应该接受最小有效值', async () => {
            const testSignal = { ...validQuantSignal };
            testSignal.return_z_score = 0;
            testSignal.volume_z_score = 0;
            testSignal.momentum_z_score = 0;
            testSignal.volatility_z_score = 0;
            testSignal.macro_risk_z_score = 0;
            testSignal.market_style_z_score = 0;
            testSignal.industry_rotation_z_score = 0;
            testSignal.concept_z_score = 0;
            testSignal.mda_fulfillment_rate = 0;
            testSignal.management_credibility_score = 0;
            testSignal.disclosure_quality_score = 0;
            testSignal.financial_transparency_score = 0;
            testSignal.rsi = 0;
            testSignal.macd_signal = 0;
            testSignal.bollinger_position = 0;
            testSignal.ma_signal = 0;
            testSignal.overall_signal_strength = 0;
            testSignal.signal_confidence = 0;

            const errors = await validate(testSignal);
            expect(errors).toHaveLength(0);
        });

        it('应该接受最大有效值', async () => {
            const testSignal = { ...validQuantSignal };
            testSignal.return_z_score = 1;
            testSignal.volume_z_score = 1;
            testSignal.momentum_z_score = 1;
            testSignal.volatility_z_score = 1;
            testSignal.macro_risk_z_score = 1;
            testSignal.market_style_z_score = 1;
            testSignal.industry_rotation_z_score = 1;
            testSignal.concept_z_score = 1;
            testSignal.mda_fulfillment_rate = 1;
            testSignal.management_credibility_score = 1;
            testSignal.disclosure_quality_score = 1;
            testSignal.financial_transparency_score = 1;
            testSignal.rsi = 100;
            testSignal.macd_signal = 1;
            testSignal.bollinger_position = 1;
            testSignal.ma_signal = 1;
            testSignal.overall_signal_strength = 1;
            testSignal.signal_confidence = 1;

            const errors = await validate(testSignal);
            expect(errors).toHaveLength(0);
        });
    });
});

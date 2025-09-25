/**
 * ProcessedEvents 实体单元测试
 * 测试目标：验证数据校验装饰器 (class-validator) 是否能正常工作
 * 测试框架：Jest + class-validator
 * 测试环境：Node.js
 */

import { validate } from 'class-validator';
import { ProcessedEvents, EventType, EventStatus } from '../../../../aigc/backend/src/entities/processed-events.entity';

describe('ProcessedEvents Entity Validation', () => {
    let validProcessedEvent: ProcessedEvents;

    beforeEach(() => {
        // 创建完全符合所有校验规则的有效实体对象
        validProcessedEvent = new ProcessedEvents();
        validProcessedEvent.event_id = '550e8400-e29b-41d4-a716-446655440000';
        validProcessedEvent.event_type = EventType.NEWS;
        validProcessedEvent.title = '贵州茅台发布2024年第三季度财务报告';
        validProcessedEvent.content = '公司于2024年10月28日发布第三季度财务报告，营收同比增长15.2%，净利润同比增长18.5%...';
        validProcessedEvent.source_url = 'https://www.sse.com.cn/disclosure/announcement/company/600519_20241028_1.pdf';
        validProcessedEvent.published_at = '2024-10-28T09:30:00Z';
        validProcessedEvent.related_stocks = ['600519.SH', '000858.SZ'];
        validProcessedEvent.keywords = ['财报', '营收增长', '新能源', '产能扩张'];
        validProcessedEvent.status = EventStatus.PROCESSED;
        validProcessedEvent.importance_score = 0.85;
        validProcessedEvent.sentiment_score = 0.65;
        validProcessedEvent.data_source = 'tushare';
        validProcessedEvent.error_message = null;
        validProcessedEvent.metadata = { author: '公司董事会', file_size: '2.5MB', page_count: 15 };
    });

    describe('正确数据测试', () => {
        it('应该通过所有校验规则', async () => {
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(0);
        });

        it('应该接受所有可选字段为空', async () => {
            const minimalEvent = new ProcessedEvents();
            minimalEvent.event_id = '550e8400-e29b-41d4-a716-446655440000';
            minimalEvent.event_type = EventType.NEWS;
            minimalEvent.title = '测试标题';
            minimalEvent.content = '测试内容';
            minimalEvent.published_at = '2024-10-28T09:30:00Z';
            minimalEvent.status = EventStatus.PENDING;

            const errors = await validate(minimalEvent);
            expect(errors).toHaveLength(0);
        });
    });

    describe('event_type 字段校验', () => {
        it('应该拒绝无效的 event_type', async () => {
            validProcessedEvent.event_type = 'invalid_type' as EventType;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('event_type');
            expect(errors[0].constraints?.isEnum).toBeDefined();
        });

        it('应该拒绝空的 event_type', async () => {
            validProcessedEvent.event_type = null as any;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('event_type');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });
    });

    describe('title 字段校验', () => {
        it('应该拒绝空的 title', async () => {
            validProcessedEvent.title = '';
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('title');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });

        it('应该拒绝超过500字符的 title', async () => {
            validProcessedEvent.title = 'a'.repeat(501);
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('title');
            expect(errors[0].constraints?.maxLength).toBeDefined();
        });

        it('应该拒绝非字符串类型的 title', async () => {
            validProcessedEvent.title = 123 as any;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('title');
            expect(errors[0].constraints?.isString).toBeDefined();
        });
    });

    describe('content 字段校验', () => {
        it('应该拒绝空的 content', async () => {
            validProcessedEvent.content = '';
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('content');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });

        it('应该拒绝非字符串类型的 content', async () => {
            validProcessedEvent.content = 123 as any;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('content');
            expect(errors[0].constraints?.isString).toBeDefined();
        });
    });

    describe('source_url 字段校验', () => {
        it('应该拒绝超过1000字符的 source_url', async () => {
            validProcessedEvent.source_url = 'https://example.com/' + 'a'.repeat(1000);
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('source_url');
            expect(errors[0].constraints?.maxLength).toBeDefined();
        });

        it('应该接受空的 source_url', async () => {
            validProcessedEvent.source_url = null;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(0);
        });
    });

    describe('published_at 字段校验', () => {
        it('应该拒绝无效的日期格式', async () => {
            validProcessedEvent.published_at = 'invalid-date' as any;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('published_at');
            expect(errors[0].constraints?.isDateString).toBeDefined();
        });

        it('应该拒绝空的 published_at', async () => {
            validProcessedEvent.published_at = null as any;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('published_at');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });
    });

    describe('related_stocks 字段校验', () => {
        it('应该拒绝非数组类型的 related_stocks', async () => {
            validProcessedEvent.related_stocks = 'not-array' as any;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('related_stocks');
            expect(errors[0].constraints?.isArray).toBeDefined();
        });

        it('应该接受空的 related_stocks', async () => {
            validProcessedEvent.related_stocks = null;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(0);
        });
    });

    describe('keywords 字段校验', () => {
        it('应该拒绝非数组类型的 keywords', async () => {
            validProcessedEvent.keywords = 'not-array' as any;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('keywords');
            expect(errors[0].constraints?.isArray).toBeDefined();
        });

        it('应该接受空的 keywords', async () => {
            validProcessedEvent.keywords = null;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(0);
        });
    });

    describe('status 字段校验', () => {
        it('应该拒绝无效的 status', async () => {
            validProcessedEvent.status = 'invalid_status' as EventStatus;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('status');
            expect(errors[0].constraints?.isEnum).toBeDefined();
        });

        it('应该拒绝空的 status', async () => {
            validProcessedEvent.status = null as any;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('status');
            expect(errors[0].constraints?.isNotEmpty).toBeDefined();
        });
    });

    describe('importance_score 字段校验', () => {
        it('应该拒绝小于0的 importance_score', async () => {
            validProcessedEvent.importance_score = -0.1;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('importance_score');
            expect(errors[0].constraints?.min).toBeDefined();
        });

        it('应该拒绝大于1的 importance_score', async () => {
            validProcessedEvent.importance_score = 1.1;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('importance_score');
            expect(errors[0].constraints?.max).toBeDefined();
        });

        it('应该接受空的 importance_score', async () => {
            validProcessedEvent.importance_score = null;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(0);
        });
    });

    describe('sentiment_score 字段校验', () => {
        it('应该拒绝小于0的 sentiment_score', async () => {
            validProcessedEvent.sentiment_score = -0.1;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('sentiment_score');
            expect(errors[0].constraints?.min).toBeDefined();
        });

        it('应该拒绝大于1的 sentiment_score', async () => {
            validProcessedEvent.sentiment_score = 1.1;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('sentiment_score');
            expect(errors[0].constraints?.max).toBeDefined();
        });

        it('应该接受空的 sentiment_score', async () => {
            validProcessedEvent.sentiment_score = null;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(0);
        });
    });

    describe('data_source 字段校验', () => {
        it('应该拒绝超过50字符的 data_source', async () => {
            validProcessedEvent.data_source = 'a'.repeat(51);
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('data_source');
            expect(errors[0].constraints?.maxLength).toBeDefined();
        });

        it('应该接受空的 data_source', async () => {
            validProcessedEvent.data_source = null;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(0);
        });
    });

    describe('error_message 字段校验', () => {
        it('应该拒绝非字符串类型的 error_message', async () => {
            validProcessedEvent.error_message = 123 as any;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('error_message');
            expect(errors[0].constraints?.isString).toBeDefined();
        });

        it('应该接受空的 error_message', async () => {
            validProcessedEvent.error_message = null;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(0);
        });
    });

    describe('metadata 字段校验', () => {
        it('应该拒绝非对象类型的 metadata', async () => {
            validProcessedEvent.metadata = 'not-object' as any;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('metadata');
            expect(errors[0].constraints?.isObject).toBeDefined();
        });

        it('应该接受空的 metadata', async () => {
            validProcessedEvent.metadata = null;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(0);
        });
    });

    describe('边界值测试', () => {
        it('应该接受最大长度的 title', async () => {
            validProcessedEvent.title = 'a'.repeat(500);
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(0);
        });

        it('应该接受最大长度的 source_url', async () => {
            validProcessedEvent.source_url = 'https://example.com/' + 'a'.repeat(980);
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(0);
        });

        it('应该接受最大长度的 data_source', async () => {
            validProcessedEvent.data_source = 'a'.repeat(50);
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(0);
        });

        it('应该接受边界值的 importance_score', async () => {
            validProcessedEvent.importance_score = 0;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(0);

            validProcessedEvent.importance_score = 1;
            const errors2 = await validate(validProcessedEvent);
            expect(errors2).toHaveLength(0);
        });

        it('应该接受边界值的 sentiment_score', async () => {
            validProcessedEvent.sentiment_score = 0;
            const errors = await validate(validProcessedEvent);
            expect(errors).toHaveLength(0);

            validProcessedEvent.sentiment_score = 1;
            const errors2 = await validate(validProcessedEvent);
            expect(errors2).toHaveLength(0);
        });
    });

    describe('枚举值测试', () => {
        it('应该接受所有有效的 EventType 值', async () => {
            const eventTypes = Object.values(EventType);
            for (const eventType of eventTypes) {
                validProcessedEvent.event_type = eventType;
                const errors = await validate(validProcessedEvent);
                expect(errors).toHaveLength(0);
            }
        });

        it('应该接受所有有效的 EventStatus 值', async () => {
            const eventStatuses = Object.values(EventStatus);
            for (const eventStatus of eventStatuses) {
                validProcessedEvent.status = eventStatus;
                const errors = await validate(validProcessedEvent);
                expect(errors).toHaveLength(0);
            }
        });
    });
});

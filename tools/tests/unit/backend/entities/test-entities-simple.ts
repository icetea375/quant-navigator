/**
 * 实体测试 - 简化版本
 * 测试目标：验证实体类的基本结构和枚举值
 * 测试框架：Jest
 * 测试环境：Node.js
 */

import { ProcessedEvents, EventType, EventStatus } from '../../../../aigc/backend/src/entities/processed-events.entity';
import { GeneratedReports, ReportType, ReportStatus } from '../../../../aigc/backend/src/entities/generated-reports.entity';
import { HumanFeedbackLoop, FeedbackType, FeedbackRating, FeedbackStatus } from '../../../../aigc/backend/src/entities/human-feedback-loop.entity';
import { QuantSignals, SignalType, SignalStatus } from '../../../../aigc/backend/src/entities/quant-signals.entity';
import { FinancialReports, ReportPeriod } from '../../../../aigc/backend/src/entities/financial-reports.entity';

describe('Entity Classes Basic Structure', () => {
    describe('ProcessedEvents Entity', () => {
        it('应该能够创建实例', () => {
            const event = new ProcessedEvents();
            expect(event).toBeDefined();
            expect(event).toBeInstanceOf(ProcessedEvents);
        });

        it('应该包含所有必需的属性', () => {
            const event = new ProcessedEvents();
            expect(event).toHaveProperty('event_id');
            expect(event).toHaveProperty('event_type');
            expect(event).toHaveProperty('title');
            expect(event).toHaveProperty('content');
            expect(event).toHaveProperty('published_at');
            expect(event).toHaveProperty('status');
        });

        it('应该支持所有EventType枚举值', () => {
            const eventTypes = Object.values(EventType);
            expect(eventTypes).toContain('news');
            expect(eventTypes).toContain('announcement');
            expect(eventTypes).toContain('e_interaction');
            expect(eventTypes).toContain('financial_report');
            expect(eventTypes).toContain('other');
        });

        it('应该支持所有EventStatus枚举值', () => {
            const eventStatuses = Object.values(EventStatus);
            expect(eventStatuses).toContain('pending');
            expect(eventStatuses).toContain('processed');
            expect(eventStatuses).toContain('failed');
        });
    });

    describe('GeneratedReports Entity', () => {
        it('应该能够创建实例', () => {
            const report = new GeneratedReports();
            expect(report).toBeDefined();
            expect(report).toBeInstanceOf(GeneratedReports);
        });

        it('应该包含所有必需的属性', () => {
            const report = new GeneratedReports();
            expect(report).toHaveProperty('report_id');
            expect(report).toHaveProperty('report_type');
            expect(report).toHaveProperty('target_code');
            expect(report).toHaveProperty('report_date');
            expect(report).toHaveProperty('title');
            expect(report).toHaveProperty('summary');
            expect(report).toHaveProperty('content');
            expect(report).toHaveProperty('status');
        });

        it('应该支持所有ReportType枚举值', () => {
            const reportTypes = Object.values(ReportType);
            expect(reportTypes).toContain('attribution_analysis');
            expect(reportTypes).toContain('prediction_forecast');
            expect(reportTypes).toContain('event_chain');
            expect(reportTypes).toContain('mda_verification');
            expect(reportTypes).toContain('counterfactual_validation');
        });

        it('应该支持所有ReportStatus枚举值', () => {
            const reportStatuses = Object.values(ReportStatus);
            expect(reportStatuses).toContain('draft');
            expect(reportStatuses).toContain('pending_review');
            expect(reportStatuses).toContain('approved');
            expect(reportStatuses).toContain('rejected');
            expect(reportStatuses).toContain('archived');
        });
    });

    describe('HumanFeedbackLoop Entity', () => {
        it('应该能够创建实例', () => {
            const feedback = new HumanFeedbackLoop();
            expect(feedback).toBeDefined();
            expect(feedback).toBeInstanceOf(HumanFeedbackLoop);
        });

        it('应该包含所有必需的属性', () => {
            const feedback = new HumanFeedbackLoop();
            expect(feedback).toHaveProperty('feedback_id');
            expect(feedback).toHaveProperty('feedback_type');
            expect(feedback).toHaveProperty('source_type');
            expect(feedback).toHaveProperty('source_id');
            expect(feedback).toHaveProperty('feedback_date');
            expect(feedback).toHaveProperty('status');
            expect(feedback).toHaveProperty('original_output');
            expect(feedback).toHaveProperty('human_feedback');
            expect(feedback).toHaveProperty('reviewer');
        });

        it('应该支持所有FeedbackType枚举值', () => {
            const feedbackTypes = Object.values(FeedbackType);
            expect(feedbackTypes).toContain('annotation');
            expect(feedbackTypes).toContain('arbitration');
            expect(feedbackTypes).toContain('quality_review');
            expect(feedbackTypes).toContain('correction');
            expect(feedbackTypes).toContain('approval');
        });

        it('应该支持所有FeedbackRating枚举值', () => {
            const feedbackRatings = Object.values(FeedbackRating);
            expect(feedbackRatings).toContain('excellent');
            expect(feedbackRatings).toContain('good');
            expect(feedbackRatings).toContain('average');
            expect(feedbackRatings).toContain('poor');
            expect(feedbackRatings).toContain('bad');
        });

        it('应该支持所有FeedbackStatus枚举值', () => {
            const feedbackStatuses = Object.values(FeedbackStatus);
            expect(feedbackStatuses).toContain('pending');
            expect(feedbackStatuses).toContain('in_progress');
            expect(feedbackStatuses).toContain('completed');
            expect(feedbackStatuses).toContain('rejected');
            expect(feedbackStatuses).toContain('archived');
        });
    });

    describe('QuantSignals Entity', () => {
        it('应该能够创建实例', () => {
            const signal = new QuantSignals();
            expect(signal).toBeDefined();
            expect(signal).toBeInstanceOf(QuantSignals);
        });

        it('应该包含所有必需的属性', () => {
            const signal = new QuantSignals();
            expect(signal).toHaveProperty('signal_id');
            expect(signal).toHaveProperty('target_code');
            expect(signal).toHaveProperty('signal_date');
            expect(signal).toHaveProperty('signal_type');
            expect(signal).toHaveProperty('status');
        });

        it('应该支持所有SignalType枚举值', () => {
            const signalTypes = Object.values(SignalType);
            expect(signalTypes).toContain('individual');
            expect(signalTypes).toContain('market');
            expect(signalTypes).toContain('macro');
            expect(signalTypes).toContain('style');
            expect(signalTypes).toContain('industry');
        });

        it('应该支持所有SignalStatus枚举值', () => {
            const signalStatuses = Object.values(SignalStatus);
            expect(signalStatuses).toContain('active');
            expect(signalStatuses).toContain('expired');
            expect(signalStatuses).toContain('cancelled');
            expect(signalStatuses).toContain('archived');
        });
    });

    describe('FinancialReports Entity', () => {
        it('应该能够创建实例', () => {
            const report = new FinancialReports();
            expect(report).toBeDefined();
            expect(report).toBeInstanceOf(FinancialReports);
        });

        it('应该包含所有必需的属性', () => {
            const report = new FinancialReports();
            expect(report).toHaveProperty('report_id');
            expect(report).toHaveProperty('stock_code');
            expect(report).toHaveProperty('report_date');
            expect(report).toHaveProperty('report_period');
            expect(report).toHaveProperty('fiscal_year');
            expect(report).toHaveProperty('status');
        });

        it('应该支持所有ReportPeriod枚举值', () => {
            const reportPeriods = Object.values(ReportPeriod);
            expect(reportPeriods).toContain('Q1');
            expect(reportPeriods).toContain('Q2');
            expect(reportPeriods).toContain('Q3');
            expect(reportPeriods).toContain('Q4');
            expect(reportPeriods).toContain('annual');
        });
    });

    describe('实体关系测试', () => {
        it('GeneratedReports应该与HumanFeedbackLoop有关联关系', () => {
            const report = new GeneratedReports();
            const feedback = new HumanFeedbackLoop();
            
            // 测试关联关系
            expect(report).toHaveProperty('feedbacks');
            expect(feedback).toHaveProperty('report');
        });
    });

    describe('实体元数据测试', () => {
        it('所有实体都应该有创建和更新时间字段', () => {
            const entities = [
                new ProcessedEvents(),
                new GeneratedReports(),
                new HumanFeedbackLoop(),
                new QuantSignals(),
                new FinancialReports()
            ];

            entities.forEach(entity => {
                expect(entity).toHaveProperty('created_at');
                expect(entity).toHaveProperty('updated_at');
            });
        });
    });
});

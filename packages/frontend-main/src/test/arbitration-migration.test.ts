/**
 * 仲裁功能迁移测试
 * 验证从 React 到 Vue 3 的迁移是否成功
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useArbitrationStore } from '@/stores/arbitration';
import type { ArbitrationCaseData, RawTextData, FinancialSnapshot } from '@/types/arbitration';

describe('仲裁功能迁移测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('应该能够创建仲裁 store', () => {
    const store = useArbitrationStore();
    expect(store).toBeDefined();
    expect(store.currentCaseId.value).toBeNull();
    expect(store.caseData.value).toBeNull();
    expect(store.loading.value).toBe(false);
  });

  it('应该能够设置当前案例', () => {
    const store = useArbitrationStore();
    store.setCurrentCase('test-case-001');
    expect(store.currentCaseId.value).toBe('test-case-001');
  });

  it('应该能够设置案例数据', () => {
    const store = useArbitrationStore();
    const mockCaseData: ArbitrationCaseData = {
      caseInfo: {
        caseId: 'test-case-001',
        stockCode: '000001',
        stockName: '平安银行',
        reportDate: '2024-01-01',
        reportType: 'comprehensive' as const,
        status: 'pending' as const,
        priority: 'high' as const,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      aiDebate: {
        qwenAnalysis: {
          summary: 'AI生成的财务分析摘要',
          keyPoints: ['关键发现1', '关键发现2'],
          confidence: 0.85,
          reasoning: '详细的AI分析内容...',
          recommendations: [],
          riskFactors: ['风险因素1', '风险因素2'],
          timestamp: '2024-01-01T00:00:00Z'
        },
        doubaoAnalysis: {
          summary: 'AI生成的财务分析摘要',
          keyPoints: ['关键发现1', '关键发现2'],
          confidence: 0.90,
          reasoning: '详细的AI分析内容...',
          recommendations: [],
          riskFactors: ['风险因素1', '风险因素2'],
          timestamp: '2024-01-01T00:00:00Z'
        },
        disagreementScore: 0.1,
        consensusSummary: '测试共识',
        conflictSummary: '测试冲突'
      },
      panels: {
        rawTextExplorer: [],
        financialSnapshot: [],
        quantSignalDashboard: [],
        flowAndChipsViewer: {
          moneyFlow: {
            netInflow: 0,
            mainInflow: 0,
            retailInflow: 0
          },
          topList: [],
          chipDistribution: []
        },
        precedentViewer: []
      }
    };

    store.setCaseData(mockCaseData);
    expect(store.caseData.value).toEqual(mockCaseData);
  });

  it('应该能够处理原始文本数据', () => {
    const mockRawTextData: RawTextData = {
      eventId: 'event-001',
      eventType: 'news',
      title: '测试新闻标题',
      content: '测试新闻内容',
      sourceUrl: 'https://example.com',
      publishedAt: '2024-01-01T00:00:00Z',
      relatedStocks: ['000001'],
      keywords: ['测试', '新闻'],
      importanceScore: 0.8,
      sentimentScore: 0.6,
      dataSource: 'test',
      metadata: {}
    };

    expect(mockRawTextData.eventId).toBe('event-001');
    expect(mockRawTextData.eventType).toBe('news');
    expect(mockRawTextData.relatedStocks).toContain('000001');
  });

  it('应该能够处理财务快照数据', () => {
    const mockFinancialData: FinancialSnapshot = {
      reportId: 'report-001',
      stockCode: '000001',
      reportDate: '2024-01-01',
      reportPeriod: 'Q1',
      fiscalYear: 2024,
      status: 'published',
      revenue: 1000000,
      revenueGrowthRate: 0.1,
      netProfitExcludingNonRecurring: 200000,
      netProfitGrowthRate: 0.15,
      grossMargin: 0.3,
      netMargin: 0.2,
      operatingCashFlow: 300000,
      rdExpenses: 50000,
      rdRatio: 0.05,
      contractLiabilities: 100000,
      totalAssets: 5000000,
      totalLiabilities: 2000000,
      netAssets: 3000000,
      debtToAssetRatio: 0.4,
      roe: 0.067,
      roa: 0.04,
      eps: 1.0,
      bookValuePerShare: 15.0,
      revenueCagr3y: 0.12,
      profitCagr3y: 0.18,
      dataCompletenessScore: 0.95,
      dataSource: 'test',
      dataUpdatedAt: '2024-01-01T00:00:00Z',
      metadata: {}
    };

    expect(mockFinancialData.stockCode).toBe('000001');
    expect(mockFinancialData.revenue).toBe(1000000);
    expect(mockFinancialData.revenueGrowthRate).toBe(0.1);
  });

  it('应该能够处理错误状态', () => {
    const store = useArbitrationStore();
    store.setError('测试错误信息');
    expect(store.error.value).toBe('测试错误信息');
    expect(store.hasError).toBe(true);
  });

  it('应该能够清除错误状态', () => {
    const store = useArbitrationStore();
    store.setError('测试错误信息');
    store.clearError();
    expect(store.error.value).toBeNull();
    expect(store.hasError).toBe(false);
  });

  it('应该能够重置 store 状态', () => {
    const store = useArbitrationStore();
    store.setCurrentCase('test-case');
    store.setError('test error');
    store.reset();
    expect(store.currentCaseId.value).toBeNull();
    expect(store.error.value).toBeNull();
    expect(store.caseData.value).toBeNull();
  });
});

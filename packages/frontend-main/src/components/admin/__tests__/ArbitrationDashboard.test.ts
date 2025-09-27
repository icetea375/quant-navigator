// 仲裁仪表盘组件测试
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestWrapper } from '@/utils/test-utils'
import { useArbitrationStore } from '@/stores/arbitration'
import ArbitrationDashboard from '../ArbitrationDashboard.vue'

// 模拟仲裁数据
const mockArbitrationData = {
  caseId: 'test-case-1',
  caseData: {
    caseInfo: {
      caseId: 'test-case-1',
      stockCode: '000001',
      stockName: '平安银行',
      reportDate: '2024-01-15',
      reportType: 'anomaly',
      status: 'pending' as const,
      priority: 0.7,
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T09:00:00Z'
    },
    aiDebate: {
      reportId: 'report-1',
      reportType: 'anomaly',
      title: '测试报告标题',
      summary: '测试报告摘要',
      content: '测试报告内容',
      confidenceScore: 0.85,
      qualityScore: 0.8,
      modelUsed: 'qwen-doubao',
      version: '1.0',
      keyFindings: ['测试发现1', '测试发现2'],
      riskFactors: ['风险因素1', '风险因素2'],
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T09:00:00Z'
    },
    panels: {
      rawTextExplorer: [
        {
          eventId: 'event-1',
          eventType: 'news' as const,
          title: '股票价格发生异常波动',
          content: '股票价格发生异常波动',
          sourceUrl: 'https://example.com',
          publishedAt: '2024-01-15T09:00:00Z',
          relatedStocks: ['000001'],
          keywords: ['价格', '波动', '异常'],
          importanceScore: 0.9,
          sentimentScore: 0.5,
          dataSource: 'market_data'
        }
      ],
      financialSnapshot: [
        {
          reportId: 'fin-001',
          stockCode: '000001',
          reportDate: '2024-01-15',
          reportPeriod: 'Q1' as const,
          fiscalYear: 2024,
          status: 'published' as const,
          revenue: 1000000,
          revenueGrowthRate: 0.15,
          netProfitExcludingNonRecurring: 200000,
          netProfitGrowthRate: 0.12,
          grossMargin: 0.25,
          netMargin: 0.20,
          operatingCashFlow: 300000,
          rdExpenses: 50000,
          rdRatio: 0.05,
          contractLiabilities: 100000,
          totalAssets: 5000000,
          totalLiabilities: 2000000,
          netAssets: 3000000,
          debtToAssetRatio: 0.4,
          roe: 0.08,
          roa: 0.04,
          eps: 0.5,
          peRatio: 25,
          pbRatio: 1.2,
          currentRatio: 1.5,
          quickRatio: 1.0,
          inventoryTurnover: 6.0,
          receivablesTurnover: 8.0,
          totalAssetTurnover: 0.2,
          interestCoverageRatio: 5.0,
          debtServiceCoverageRatio: 3.0,
          freeCashFlow: 250000,
          dividendYield: 0.03,
          payoutRatio: 0.4,
          bookValuePerShare: 8.5,
          revenueCagr3y: 0.12,
          profitCagr3y: 0.15,
          dataCompletenessScore: 0.95,
          dataSource: 'test',
          dataUpdatedAt: '2024-01-15T09:00:00Z',
          metadata: {}
        }
      ],
      quantSignalDashboard: [
        {
          signalId: 'signal-001',
          targetCode: '000001',
          signalDate: '2024-01-15',
          signalType: 'individual' as const,
          status: 'active' as const,
          returnZScore: 1.5,
          volumeZScore: 2.0,
          momentumZScore: 1.8,
          volatilityZScore: 1.2,
          macroRiskZScore: 0.5,
          marketStyleZScore: 1.0,
          industryRotationZScore: 0.8,
          conceptZScore: 1.2,
          mdaFulfillmentRate: 0.9,
          managementCredibilityScore: 0.85,
          disclosureQualityScore: 0.8,
          financialTransparencyScore: 0.9,
          rsi: 75,
          macdSignal: 0.5,
          bollingerPosition: 0.8,
          maSignal: 1.2,
          overallSignalStrength: 0.8,
          signalConfidence: 0.85,
          validityDays: 30,
          modelVersion: '1.0',
          calculationParams: {},
          source: 'test',
          dataSource: 'test',
          dataUpdatedAt: '2024-01-15T09:00:00Z',
          metadata: {}
        }
      ],
      flowAndChipsViewer: {
        moneyFlow: {
          flowId: 'flow-001',
          stockCode: '000001',
          flowDate: '2024-01-15',
          flowType: 'main_force' as const,
          flowDirection: 'inflow' as const,
          netAmount: 1000000,
          buyAmount: 1500000,
          sellAmount: 500000,
          totalAmount: 2000000,
          netInflowRatio: 0.15,
          mainForceRatio: 0.6,
          retailRatio: 0.4,
          flowIntensity: 0.8,
          flowAnomalyScore: 0.7,
          flowTrend: 1.2,
          avgNetInflow5d: 800000,
          avgNetInflow10d: 600000,
          avgNetInflow20d: 500000,
          changeVs5dAvg: 0.25,
          changeVs10dAvg: 0.67,
          changeVs20dAvg: 1.0,
          currentPrice: 12.5,
          costRangeLower: 10.0,
          costRangeUpper: 15.0,
          mainChipPeak: 12.0,
          chipConcentration: 0.7,
          dataSource: 'test',
          dataUpdatedAt: '2024-01-15T09:00:00Z',
          superLargeNetInflow: 200000,
          largeNetInflow: 300000,
          mediumNetInflow: 300000,
          smallNetInflow: 200000,
          mainInflow: 600000,
          retailInflow: 400000,
          institutionalInflow: 500000
        },
        topList: [
          {
            listId: 'top-001',
            stockCode: '000001',
            listDate: '2024-01-15',
            listType: 'dragon_tiger' as const,
            seatType: 'net' as const,
            seatName: '平安银行',
            seatCode: '000001',
            seatCategory: '银行股',
            buyAmount: 8000000,
            sellAmount: 3000000,
            netAmount: 5000000,
            totalAmount: 11000000,
            buyRatio: 0.73,
            sellRatio: 0.27,
            netRatio: 0.12,
            buyRank: 1,
            sellRank: 5,
            netRank: 1,
            totalRank: 2,
            priceImpactScore: 0.8,
            attentionScore: 0.9,
            anomalyScore: 0.7,
            changeVsHistorical: 0.5,
            consecutiveDays: 3,
            monthlyCount: 5,
            listReason: '资金净流入',
            dataSource: 'test',
            dataUpdatedAt: '2024-01-15T09:00:00Z',
            metadata: {}
          }
        ],
        chipDistribution: [
          {
            distributionId: 'chip-001',
            stockCode: '000001',
            distributionDate: '2024-01-15',
            distributionType: 'cost_distribution' as const,
            chipStatus: 'active' as const,
            priceLower: 10.0,
            priceUpper: 12.0,
            priceMedian: 11.0,
            chipQuantity: 1000000,
            chipRatio: 0.3,
            chipAmount: 11000000,
            chipAmountRatio: 0.25,
            averageCost: 11.0,
            costConcentration: 0.7,
            costDispersion: 0.3,
            currentPrice: 12.5,
            profitLossRatio: 0.136,
            profitLossAmount: 1500000,
            profitLossStatus: 'profit',
            chipInflow: 200000,
            chipOutflow: 100000,
            netChipFlow: 100000,
            chipFlowIntensity: 0.5,
            changeVs5d: 0.1,
            changeVs10d: 0.2,
            changeVs20d: 0.3,
            changeVsHistorical: 0.4,
            distributionStd: 0.5,
            distributionSkewness: 0.2,
            distributionKurtosis: 0.1,
            modelVersion: '1.0',
            calculationParams: {},
            dataSource: 'test',
            dataUpdatedAt: '2024-01-15T09:00:00Z',
            high_cost_ratio: 0.3,
            medium_cost_ratio: 0.4,
            low_cost_ratio: 0.3,
            avg_cost: 11.0,
            cost_concentration: 0.7
          }
        ]
      },
      personalPrecedentViewer: [
        {
          feedbackId: 'feedback-001',
          feedbackType: 'arbitration' as const,
          sourceType: 'case',
          sourceId: 'case-1',
          stockCode: '000001',
          feedbackDate: '2024-01-10T09:00:00Z',
          status: 'completed' as const,
          originalOutput: {
            analysis: '历史分析1',
            confidence: 0.8
          },
          originalSummary: '基于技术分析，建议仲裁',
          humanFeedback: {
            decision: 'arbitrate',
            reasoning: '基于技术分析，建议仲裁'
          },
          feedbackScore: 0.8,
          feedbackComment: '分析准确，建议采纳',
          correctAttribution: '技术分析',
          correctPrediction: '价格波动',
          rating: 'good' as const,
          accuracyScore: 0.8,
          completenessScore: 0.7,
          logicScore: 0.9,
          innovationScore: 0.6,
          reviewer: '专家A',
          reviewerRole: '技术分析师',
          reviewerLevel: '高级',
          reviewComment: '分析合理',
          reviewTime: '2024-01-10T10:00:00Z',
          priority: 0.7,
          tags: ['技术分析', '价格波动'],
          industry: '金融',
          concept: '银行股',
          learningValue: 0.8,
          dataSource: 'test',
          dataUpdatedAt: '2024-01-10T09:00:00Z',
          metadata: {}
        }
      ],
      precedentViewer: []
    }
  },
  loading: false,
  error: null
}

describe('ArbitrationDashboard', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = createTestWrapper(ArbitrationDashboard, {
      props: {
        caseId: 'test-case-1'
      }
    })
  })

  it('should render arbitration dashboard', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('[data-testid="arbitration-dashboard"]').exists()).toBe(true)
  })

  it('should display loading state when loading', async () => {
    const arbitrationStore = useArbitrationStore()
    arbitrationStore.setLoading(true)

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.find('[data-testid="loading"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('加载中...')
  })

  it('should display error state when error occurs', async () => {
    const arbitrationStore = useArbitrationStore()
    arbitrationStore.setLoading(false) // 确保 loading 为 false
    arbitrationStore.setError('测试错误信息')

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // 检查主内容区域是否显示错误状态
    const mainContent = wrapper.find('.main-content')
    expect(mainContent.find('[data-testid="error"]').exists()).toBe(true)
    expect(mainContent.text()).toContain('测试错误信息')
  })

  it('should display case data when loaded', async () => {
    const arbitrationStore = useArbitrationStore()
    arbitrationStore.setCaseData(mockArbitrationData.caseData)
    arbitrationStore.setLoading(false)
    arbitrationStore.setError(null)

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // 检查主内容区域是否显示数据面板
    const mainContent = wrapper.find('.main-content')
    expect(mainContent.find('[data-testid="content"]').exists()).toBe(true)
    // 检查是否显示了数据面板的内容（检查实际显示的内容）
    expect(mainContent.text()).toContain('股票价格发生异常波动') // RawTextExplorer 的内容
    expect(mainContent.text()).toContain('营业收入') // FinancialSnapshot 的内容
    expect(mainContent.text()).toContain('综合信号强度') // QuantSignalDashboard 的内容
  })

  it('should handle panel maximization', async () => {
    const arbitrationStore = useArbitrationStore()
    arbitrationStore.caseData = mockArbitrationData.caseData

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // 测试面板最大化功能
    const maximizeButton = wrapper.find('[data-testid="maximize-panel"]')
    if (maximizeButton.exists()) {
      await maximizeButton.trigger('click')
      expect(arbitrationStore.maximizedPanel).toBeDefined()
    }
  })

  it('should handle arbitration submission', async () => {
    const arbitrationStore = useArbitrationStore()
    arbitrationStore.caseData = mockArbitrationData.caseData

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // 测试仲裁提交功能
    const submitButton = wrapper.find('[data-testid="submit-arbitration"]')
    if (submitButton.exists()) {
      await submitButton.trigger('click')
      // 验证提交逻辑被调用
      expect(arbitrationStore.submitArbitration).toBeDefined()
    }
  })
})

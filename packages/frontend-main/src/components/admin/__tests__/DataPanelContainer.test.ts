import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DataPanelContainer from '@/components/admin/DataPanelContainer.vue'
import { mockElementPlusComponents } from '@/utils/test-utils'
import type { ArbitrationCaseData } from '@/types/arbitration'

// 创建测试包装器
const createTestWrapper = (component: unknown, options = {}) => {
  return mount(component, {
    global: {
      plugins: [createPinia()],
      stubs: {
        ...mockElementPlusComponents(),
        'v-chart': { template: '<div class="v-chart-mock"></div>' },
        RawTextExplorer: { template: '<div class="raw-text-explorer-mock">RawTextExplorer</div>' },
        FinancialSnapshot: { template: '<div class="financial-snapshot-mock">FinancialSnapshot</div>' },
        QuantSignalDashboard: { template: '<div class="quant-signal-dashboard-mock">QuantSignalDashboard</div>' },
        FlowAndChipsViewer: { template: '<div class="flow-chips-viewer-mock">FlowAndChipsViewer</div>' },
        PersonalPrecedentViewer: { template: '<div class="personal-precedent-viewer-mock">PersonalPrecedentViewer</div>' }
      }
    },
    ...options
  })
}

describe('DataPanelContainer - 展示组件单元测试', () => {
  let wrapper: VueWrapper<InstanceType<typeof DataPanelContainer>>

  const mockCaseData: ArbitrationCaseData = {
    caseInfo: {
      caseId: 'test-case-1',
      stockCode: '000001',
      stockName: '平安银行',
      reportDate: '2024-01-15T09:00:00Z',
      reportType: 'anomaly',
      status: 'pending',
      priority: 1,
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T09:00:00Z'
    },
    aiDebate: {
      reportId: 'report-1',
      reportType: 'anomaly',
      title: '测试报告',
      summary: '测试摘要',
      content: '测试内容',
      confidenceScore: 0.85,
      qualityScore: 0.8,
      modelUsed: 'qwen',
      version: '1.0.0',
      keyFindings: ['测试发现1', '测试发现2'],
      riskFactors: ['测试风险1', '测试风险2'],
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T09:00:00Z'
    },
    // 兼容旧版本字段
    case_id: 'test-case-1',
    report_type: 'anomaly',
    target_code: '000001',
    qwen_analysis: {
      analysis: '测试分析内容',
      confidence: 0.85,
      reasoning: '测试推理过程'
    },
    doubao_analysis: {
      sentiment: 'positive',
      score: 0.8,
      reasoning: '测试情感分析'
    },
    disagreement_score: 0.3,
    status: 'pending',
    consensus_summary: '测试共识摘要',
    conflict_summary: '测试冲突摘要',
    priority_score: 0.7,
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T09:00:00Z',
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
          reportId: 'report-1',
          stockCode: '000001',
          reportDate: '2024-01-15T09:00:00Z',
          reportPeriod: 'Q1' as const,
          fiscalYear: 2024,
          status: 'published' as const,
          revenue: 1000000,
          revenueGrowthRate: 0.15,
          netProfitExcludingNonRecurring: 200000,
          netProfitGrowthRate: 0.12,
          grossMargin: 0.25,
          netMargin: 0.20,
          operatingCashFlow: 150000,
          rdExpenses: 50000,
          rdRatio: 0.05,
          contractLiabilities: 100000,
          totalAssets: 5000000,
          totalLiabilities: 2000000,
          netAssets: 3000000,
          debtToAssetRatio: 0.4,
          roe: 0.08,
          roa: 0.04,
          eps: 0.50,
          bookValuePerShare: 6.25,
          revenueCagr3y: 0.12,
          profitCagr3y: 0.10,
          dataCompletenessScore: 0.95,
          dataSource: 'financial_data',
          dataUpdatedAt: '2024-01-15T09:00:00Z'
        }
      ],
      quantSignalDashboard: [
        {
          signalId: 'signal-1',
          targetCode: '000001',
          signalDate: '2024-01-15T09:00:00Z',
          signalType: 'individual' as const,
          status: 'active' as const,
          returnZScore: 2.5,
          volumeZScore: 1.8,
          momentumZScore: 2.2,
          volatilityZScore: 1.5,
          macroRiskZScore: 1.2,
          marketStyleZScore: 0.8,
          industryRotationZScore: 1.5,
          conceptZScore: 0.9,
          mdaFulfillmentRate: 0.85,
          managementCredibilityScore: 0.78,
          disclosureQualityScore: 0.82,
          financialTransparencyScore: 0.88,
          rsi: 65.5,
          macdSignal: 0.12,
          bollingerPosition: 0.75,
          maSignal: 0.68,
          overallSignalStrength: 0.85,
          signalConfidence: 0.85,
          validityDays: 30,
          modelVersion: '1.0.0',
          calculationParams: {},
          source: 'quant_signal_engine',
          metadata: {}
        }
      ],
      flowAndChipsViewer: {
        moneyFlow: {
          netAmount: 1000000,
          netInflowRatio: 15,
          superLargeNetInflow: 500000,
          largeNetInflow: 300000,
          mediumNetInflow: 200000,
          smallNetInflow: 100000
        } as any,
        topList: [
          {
            listId: 'list-1',
            stockCode: '000001',
            listDate: '2024-01-15T09:00:00Z',
            listType: 'dragon_tiger' as const,
            seatType: 'buy' as const,
            seatName: '平安银行',
            seatCode: '000001',
            seatCategory: 'institutional',
            buyAmount: 500000,
            sellAmount: 200000,
            netAmount: 300000,
            totalAmount: 700000,
            buyRatio: 0.71,
            sellRatio: 0.29,
            netRatio: 0.43,
            buyRank: 1,
            sellRank: 5,
            netRank: 1,
            totalRank: 2,
            priceImpactScore: 0.8,
            attentionScore: 0.9,
            anomalyScore: 0.7,
            changeVsHistorical: 0.15,
            consecutiveDays: 3,
            monthlyCount: 5,
            listReason: '机构大额买入',
            dataSource: 'top_list_data',
            dataUpdatedAt: '2024-01-15T09:00:00Z'
          }
        ],
        chipDistribution: [
          {
            distributionId: 'chip-1',
            stockCode: '000001',
            distributionDate: '2024-01-15T09:00:00Z',
            distributionType: 'cost_distribution' as const,
            chipStatus: 'active' as const,
            priceLower: 10.0,
            priceUpper: 15.0,
            priceMedian: 12.5,
            chipQuantity: 1000000,
            chipRatio: 0.3,
            chipAmount: 12500000,
            chipAmountRatio: 0.3,
            averageCost: 12.5,
            costConcentration: 0.7,
            costDispersion: 0.3,
            currentPrice: 12.5,
            profitLossRatio: 0.0,
            profitLossAmount: 0,
            profitLossStatus: 'break_even',
            chipInflow: 500000,
            chipOutflow: 300000,
            netChipFlow: 200000,
            chipFlowIntensity: 0.6,
            changeVs5d: 0.1,
            changeVs10d: 0.15,
            changeVs20d: 0.2,
            changeVsHistorical: 0.25,
            distributionStd: 1.2,
            distributionSkewness: 0.1,
            distributionKurtosis: 2.8,
            modelVersion: '1.0.0',
            calculationParams: {},
            dataSource: 'chip_distribution_data',
            dataUpdatedAt: '2024-01-15T09:00:00Z',
            high_cost_ratio: 0.3,
            medium_cost_ratio: 0.5,
            low_cost_ratio: 0.2,
            avg_cost: 12.5,
            cost_concentration: 0.7
          }
        ]
      },
      precedentViewer: [
        {
          feedbackId: 'feedback-1',
          feedbackType: 'arbitration' as const,
          sourceType: 'case',
          sourceId: 'case-1',
          stockCode: '000001',
          feedbackDate: '2024-01-10T09:00:00Z',
          status: 'completed' as const,
          originalOutput: {},
          originalSummary: '历史分析1',
          humanFeedback: {
            decision: 'arbitrate',
            reasoning: '基于技术分析，建议仲裁'
          },
          feedbackScore: 0.8,
          feedbackComment: '基于技术分析，建议仲裁',
          correctAttribution: '技术分析',
          correctPrediction: '建议仲裁',
          rating: 'good' as const,
          accuracyScore: 0.8,
          completenessScore: 0.85,
          logicScore: 0.9,
          innovationScore: 0.75,
          reviewer: 'reviewer-1',
          reviewerRole: 'senior_analyst',
          reviewerLevel: 'expert',
          reviewComment: '分析合理',
          reviewTime: '2024-01-10T09:00:00Z',
          priority: 1,
          tags: ['技术分析', '仲裁'],
          industry: '金融',
          concept: '银行',
          learningValue: 0.8,
          usedForTraining: true,
          trainingEffectiveness: 0.85,
          dataSource: 'arbitration_data',
          createdAt: '2024-01-10T09:00:00Z',
          updatedAt: '2024-01-10T09:00:00Z',
          // 兼容旧版本字段
          case_id: 'case-1',
          target_code: '000001',
          target_name: '平安银行',
          report_type: 'anomaly',
          created_at: '2024-01-10T09:00:00Z',
          human_decision: 'arbitrate',
          human_reasoning: '基于技术分析，建议仲裁',
          qwen_analysis: {
            analysis: '历史分析1',
            confidence: 0.8
          },
          doubao_analysis: {
            sentiment: 'positive',
            score: 0.7
          }
        }
      ]
    }
  }

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('组件渲染测试', () => {
    it('应该正确渲染数据面板容器', () => {
      wrapper = createTestWrapper(DataPanelContainer, {
        props: {
          caseData: mockCaseData,
          loading: false,
          error: null,
          maximizedPanel: null
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.panels-container').exists()).toBe(true)
      expect(wrapper.find('[data-testid="content"]').exists()).toBe(true)
    })

    it('应该渲染所有五个数据面板', () => {
      wrapper = createTestWrapper(DataPanelContainer, {
        props: {
          caseData: mockCaseData,
          loading: false,
          error: null,
          maximizedPanel: null
        }
      })

      expect(wrapper.find('.raw-text-explorer-mock').exists()).toBe(true)
      expect(wrapper.find('.financial-snapshot-mock').exists()).toBe(true)
      expect(wrapper.find('.quant-signal-dashboard-mock').exists()).toBe(true)
      expect(wrapper.find('.flow-chips-viewer-mock').exists()).toBe(true)
      expect(wrapper.find('.personal-precedent-viewer-mock').exists()).toBe(true)
    })

    it('应该显示所有面板标题', () => {
      wrapper = createTestWrapper(DataPanelContainer, {
        props: {
          caseData: mockCaseData,
          loading: false,
          error: null,
          maximizedPanel: null
        }
      })

      expect(wrapper.text()).toContain('原始文本浏览器')
      expect(wrapper.text()).toContain('财务数据快照')
      expect(wrapper.text()).toContain('量化信号仪表盘')
      expect(wrapper.text()).toContain('资金流向和筹码查看器')
      expect(wrapper.text()).toContain('个人先例查看器')
    })
  })

  describe('面板交互测试', () => {
    it('应该触发最大化事件', async () => {
      wrapper = createTestWrapper(DataPanelContainer, {
        props: {
          caseData: mockCaseData,
          loading: false,
          error: null,
          maximizedPanel: null
        }
      })

      const buttons = wrapper.findAll('button')
      const maximizeButton = buttons.find((btn: { text: () => string }) => btn.text().includes('+'))
      await maximizeButton?.trigger('click')

      expect(wrapper.emitted('toggle-maximize')).toBeTruthy()
    })

    it('应该触发关闭面板事件', async () => {
      wrapper = createTestWrapper(DataPanelContainer, {
        props: {
          caseData: mockCaseData,
          loading: false,
          error: null,
          maximizedPanel: null
        }
      })

      const buttons = wrapper.findAll('button')
      const closeButton = buttons.find((btn: { text: () => string }) => btn.text().includes('Close'))
      await closeButton?.trigger('click')

      expect(wrapper.emitted('close-panel')).toBeTruthy()
    })

    it('应该正确显示最大化状态', () => {
      wrapper = createTestWrapper(DataPanelContainer, {
        props: {
          caseData: mockCaseData,
          loading: false,
          error: null,
          maximizedPanel: 'raw-text'
        }
      })

      const buttons = wrapper.findAll('button')
      const maximizeButton = buttons.find((btn: { text: () => string }) => btn.text().includes('-'))
      expect(maximizeButton).toBeTruthy()
    })
  })

  describe('数据传递测试', () => {
    it('应该将正确的数据传递给子组件', () => {
      wrapper = createTestWrapper(DataPanelContainer, {
        props: {
          caseData: mockCaseData,
          loading: false,
          error: null,
          maximizedPanel: null
        }
      })

      // 检查 RawTextExplorer 组件接收的数据
      const rawTextExplorer = wrapper.findComponent({ name: 'RawTextExplorer' })
      expect(rawTextExplorer.props('data')).toEqual(mockCaseData.panels.rawTextExplorer)
      expect(rawTextExplorer.props('loading')).toBe(false)
      expect(rawTextExplorer.props('error')).toBe(null)

      // 检查 FinancialSnapshot 组件接收的数据
      const financialSnapshot = wrapper.findComponent({ name: 'FinancialSnapshot' })
      expect(financialSnapshot.props('data')).toEqual(mockCaseData.panels.financialSnapshot)
      expect(financialSnapshot.props('loading')).toBe(false)
      expect(financialSnapshot.props('error')).toBe(null)
    })

    it('应该传递加载状态给子组件', () => {
      wrapper = createTestWrapper(DataPanelContainer, {
        props: {
          caseData: mockCaseData,
          loading: true,
          error: null,
          maximizedPanel: null
        }
      })

      const rawTextExplorer = wrapper.findComponent({ name: 'RawTextExplorer' })
      expect(rawTextExplorer.props('loading')).toBe(true)
    })

    it('应该传递错误状态给子组件', () => {
      wrapper = createTestWrapper(DataPanelContainer, {
        props: {
          caseData: mockCaseData,
          loading: false,
          error: '测试错误',
          maximizedPanel: null
        }
      })

      const rawTextExplorer = wrapper.findComponent({ name: 'RawTextExplorer' })
      expect(rawTextExplorer.props('error')).toBe('测试错误')
    })
  })

  describe('事件传递测试', () => {
    it('应该传递文本高亮事件', () => {
      wrapper = createTestWrapper(DataPanelContainer, {
        props: {
          caseData: mockCaseData,
          loading: false,
          error: null,
          maximizedPanel: null
        }
      })

      const rawTextExplorer = wrapper.findComponent({ name: 'RawTextExplorer' })
      rawTextExplorer.vm.$emit('text-highlight', '测试文本', ['关键词'])

      expect(wrapper.emitted('text-highlight')).toBeTruthy()
      expect(wrapper.emitted('text-highlight')?.[0]).toEqual(['测试文本', ['关键词']])
    })

    it('应该传递事件选择事件', () => {
      wrapper = createTestWrapper(DataPanelContainer, {
        props: {
          caseData: mockCaseData,
          loading: false,
          error: null,
          maximizedPanel: null
        }
      })

      const rawTextExplorer = wrapper.findComponent({ name: 'RawTextExplorer' })
      rawTextExplorer.vm.$emit('event-select', { id: 'event-1' })

      expect(wrapper.emitted('event-select')).toBeTruthy()
      expect(wrapper.emitted('event-select')?.[0]).toEqual([{ id: 'event-1' }])
    })

    it('应该传递期间选择事件', () => {
      wrapper = createTestWrapper(DataPanelContainer, {
        props: {
          caseData: mockCaseData,
          loading: false,
          error: null,
          maximizedPanel: null
        }
      })

      const financialSnapshot = wrapper.findComponent({ name: 'FinancialSnapshot' })
      financialSnapshot.vm.$emit('period-select', '2024-Q1')

      expect(wrapper.emitted('period-select')).toBeTruthy()
      expect(wrapper.emitted('period-select')?.[0]).toEqual(['2024-Q1'])
    })

    it('应该传递信号悬浮事件', () => {
      wrapper = createTestWrapper(DataPanelContainer, {
        props: {
          caseData: mockCaseData,
          loading: false,
          error: null,
          maximizedPanel: null
        }
      })

      const quantSignalDashboard = wrapper.findComponent({ name: 'QuantSignalDashboard' })
      quantSignalDashboard.vm.$emit('signal-hover', 'return', 2.5)

      expect(wrapper.emitted('signal-hover')).toBeTruthy()
      expect(wrapper.emitted('signal-hover')?.[0]).toEqual(['return', 2.5])
    })
  })

  describe('边界情况测试', () => {
    it('应该处理空的 caseData', () => {
      wrapper = createTestWrapper(DataPanelContainer, {
        props: {
          caseData: null as any,
          loading: false,
          error: null,
          maximizedPanel: null
        }
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('应该处理默认 props', () => {
      wrapper = createTestWrapper(DataPanelContainer, {
        props: {
          caseData: mockCaseData
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.panels-container').exists()).toBe(true)
    })
  })
})

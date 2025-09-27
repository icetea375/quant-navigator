import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DataPanelContainer from '@/components/admin/DataPanelContainer.vue'
import { mockElementPlusComponents } from '@/utils/test-utils'
import type { ArbitrationCaseData } from '@/types/arbitration'

// 创建测试包装器
const createTestWrapper = (component: any, options = {}) => {
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
  let wrapper: any

  const mockCaseData: ArbitrationCaseData = {
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
          id: 'event-1',
          timestamp: '2024-01-15T09:00:00Z',
          event_type: 'price_change',
          title: '股票价格发生异常波动',
          content: '股票价格发生异常波动',
          source: 'market_data',
          confidence: 0.9
        }
      ],
      financialSnapshot: [
        {
          reportPeriod: '2024-Q1',
          fiscalYear: '2024',
          basicInfo: {
            stock_name: '平安银行',
            stock_code: '000001',
            current_price: 12.50
          },
          metrics: {
            revenue: 1000000,
            revenue_growth: 0.15,
            profit: 200000,
            profit_growth: 0.12,
            roe: 0.08
          }
        }
      ],
      quantSignalDashboard: [
        {
          signalId: 'signal-1',
          targetCode: '000001',
          signalDate: '2024-01-15T09:00:00Z',
          signalType: 'individual',
          status: 'active',
          returnZScore: 2.5,
          volumeZScore: 1.8,
          momentumZScore: 2.2,
          volatilityZScore: 1.5,
          marketBackground: {
            macroRiskZScore: 1.2,
            marketStyleZScore: 0.8,
            industryRotationZScore: 1.5,
            conceptHeatZScore: 0.9
          },
          managementCredibility: {
            mdaComplianceRate: 0.85,
            managementCredibility: 0.78,
            disclosureQuality: 0.82,
            financialTransparency: 0.88
          },
          technicalAnalysis: {
            rsi: 65.5,
            macdSignal: 0.12,
            bollingerPosition: 0.75,
            movingAverageSignal: 0.68
          },
          riskAssessment: {
            overallRisk: 'medium',
            riskScore: 0.6,
            riskFactors: ['市场波动', '政策风险']
          },
          confidence: 0.85,
          priority: 'high',
          createdAt: '2024-01-15T09:00:00Z',
          updatedAt: '2024-01-15T09:00:00Z'
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
        },
        topList: [
          {
            rank: 1,
            stock_code: '000001',
            stock_name: '平安银行',
            net_inflow: 500000,
            net_inflow_ratio: 0.05,
            change_pct: 2.5
          }
        ],
        chipDistribution: {
          high_cost_ratio: 0.3,
          medium_cost_ratio: 0.5,
          low_cost_ratio: 0.2,
          avg_cost: 12.5,
          cost_concentration: 0.7
        }
      },
      precedentViewer: [
        {
          case_id: 'case-1',
          target_code: '000001',
          target_name: '平安银行',
          report_type: 'anomaly',
          created_at: '2024-01-10T09:00:00Z',
          status: 'completed',
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
      const maximizeButton = buttons.find(btn => btn.text().includes('+'))
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
      const closeButton = buttons.find(btn => btn.text().includes('Close'))
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
      const maximizeButton = buttons.find(btn => btn.text().includes('-'))
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

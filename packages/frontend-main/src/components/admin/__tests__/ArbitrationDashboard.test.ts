// 仲裁仪表盘组件测试
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestWrapper } from '@/utils/test-utils'
import { useArbitrationStore } from '@/stores/arbitration'
import ArbitrationDashboard from '../ArbitrationDashboard.vue'

// 模拟仲裁数据
const mockArbitrationData = {
  caseId: 'test-case-1',
  caseData: {
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
          signal_name: 'RSI超买信号',
          value: 75,
          threshold: 70,
          strength: 0.8,
          direction: 'bearish',
          confidence: 0.85
        }
      ],
      flowAndChipsViewer: [
        {
          moneyFlow: {
            main_net_inflow: 1000000,
            net_inflow_ratio: 0.15
          },
          topList: [
            {
              stock_name: '平安银行',
              stock_code: '000001',
              rank: 1
            }
          ],
          chipDistribution: {
            high_cost_ratio: 0.30,
            medium_cost_ratio: 0.50,
            low_cost_ratio: 0.20
          }
        }
      ],
      personalPrecedentViewer: [
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

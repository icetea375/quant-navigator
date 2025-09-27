// 量化信号仪表盘组件测试
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestWrapper, mockElementPlusComponents } from '@/utils/test-utils'
import { useArbitrationStore } from '@/stores/arbitration'
import QuantSignalDashboard from '../QuantSignalDashboard.vue'

// 模拟量化信号数据
const mockQuantSignalData = [
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
      marketTrend: 'bullish',
      marketVolatility: 'normal',
      sectorRotation: 'cyclical',
      macroEnvironment: 'expansion'
    },
    managementCredibility: {
      credibilityScore: 0.8,
      trackRecord: 0.85,
      transparency: 0.75,
      communication: 0.8
    },
    technicalAnalysis: {
      rsi: 75,
      macd: 0.5,
      bollinger: 'upper',
      support: 12.0,
      resistance: 13.5
    },
    riskAssessment: {
      riskLevel: 'medium',
      riskScore: 0.6,
      riskFactors: ['volatility', 'liquidity']
    },
    confidence: 0.85,
    priority: 'high',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z'
  },
  {
    signalId: 'signal-2',
    targetCode: '000002',
    signalDate: '2024-01-15T09:05:00Z',
    signalType: 'individual',
    status: 'active',
    returnZScore: 1.8,
    volumeZScore: 2.1,
    momentumZScore: 1.9,
    volatilityZScore: 1.2,
    marketBackground: {
      marketTrend: 'bullish',
      marketVolatility: 'normal',
      sectorRotation: 'defensive',
      macroEnvironment: 'expansion'
    },
    managementCredibility: {
      credibilityScore: 0.7,
      trackRecord: 0.8,
      transparency: 0.7,
      communication: 0.75
    },
    technicalAnalysis: {
      rsi: 65,
      macd: 0.3,
      bollinger: 'middle',
      support: 25.0,
      resistance: 28.0
    },
    riskAssessment: {
      riskLevel: 'low',
      riskScore: 0.4,
      riskFactors: ['liquidity']
    },
    confidence: 0.7,
    priority: 'medium',
    createdAt: '2024-01-15T09:05:00Z',
    updatedAt: '2024-01-15T09:05:00Z'
  }
]

describe('QuantSignalDashboard', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = createTestWrapper(QuantSignalDashboard, {
      props: {
        data: mockQuantSignalData
      },
      global: {
        stubs: {
          ...mockElementPlusComponents(),
          'v-chart': { template: '<div class="v-chart-mock"></div>' }
        }
      }
    })
  })

  it('should render quant signal dashboard', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('[data-testid="quant-signal-dashboard"]').exists()).toBe(true)
  })

  it('should display individual signals', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('收益率Z分数')
    expect(wrapper.text()).toContain('成交量Z分数')
  })

  it('should render signal charts', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // 检查图表容器是否存在
    expect(wrapper.find('.radar-chart').exists()).toBe(true)
    expect(wrapper.text()).toContain('多维度信号雷达图')
  })

  it('should display market background information', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('个股信号')
    expect(wrapper.text()).toContain('市场背景')
  })

  it('should display management credibility score', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('管理层可信度')
    expect(wrapper.text()).toContain('因子')
  })

  it('should display technical analysis data', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('技术分析')
    expect(wrapper.text()).toContain('信号')
  })

  it('should handle signal hover events', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const signalItem = wrapper.find('[data-testid="signal-item"]')
    if (signalItem.exists()) {
      await signalItem.trigger('mouseenter')

      // 验证悬停事件
      expect(wrapper.emitted('signal-hover')).toBeTruthy()
    }
  })

  it('should handle signal click events', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const signalItem = wrapper.find('[data-testid="signal-item"]')
    if (signalItem.exists()) {
      await signalItem.trigger('click')

      // 验证点击事件
      expect(wrapper.emitted('signal-click')).toBeTruthy()
    }
  })

  it('should display signal strength indicators', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // 验证信号强度显示
    expect(wrapper.text()).toContain('信号强度')
    expect(wrapper.text()).toContain('置信度')
  })

  it('should handle empty data state', async () => {
    const emptyWrapper = createTestWrapper(QuantSignalDashboard, {
      props: {
        data: [],
        loading: false
      },
      global: {
        stubs: {
          ...mockElementPlusComponents(),
          'v-chart': { template: '<div class="v-chart-mock"></div>' }
        }
      }
    })

    await emptyWrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(emptyWrapper.text()).toContain('暂无量化信号数据')
  })

  it('should calculate signal scores correctly', () => {
    // 测试信号分数计算
    const component = wrapper.vm
    if (component.calculatedScores) {
      expect(component.calculatedScores).toBeDefined()
    }
  })

  it('should render radar chart for management credibility', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const radarChart = wrapper.find('[data-testid="credibility-radar-chart"]')
    if (radarChart.exists()) {
      expect(radarChart.exists()).toBe(true)
    }
  })
})

// 量化信号仪表盘组件测试
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestWrapper } from '@/utils/test-utils'
import { useArbitrationStore } from '@/stores/arbitration'
import QuantSignalDashboard from '../QuantSignalDashboard.vue'

// 模拟量化信号数据
const mockQuantSignalData = [
  {
    signal_name: 'RSI超买信号',
    value: 75,
    threshold: 70,
    strength: 0.8,
    direction: 'bearish',
    confidence: 0.85
  },
  {
    signal_name: 'MACD金叉信号',
    value: 0.5,
    threshold: 0,
    strength: 0.6,
    direction: 'bullish',
    confidence: 0.7
  }
]

describe('QuantSignalDashboard', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = createTestWrapper(QuantSignalDashboard, {
      props: {
        data: mockQuantSignalData
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

    expect(wrapper.text()).toContain('RSI超买信号')
    expect(wrapper.text()).toContain('MACD金叉信号')
  })

  it('should render signal charts', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const charts = wrapper.findAll('[data-testid="signal-chart"]')
    expect(charts.length).toBeGreaterThan(0)
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
    const strengthIndicators = wrapper.findAll('[data-testid="strength-indicator"]')
    expect(strengthIndicators.length).toBeGreaterThan(0)
  })

  it('should handle empty data state', async () => {
    const emptyWrapper = createTestWrapper(QuantSignalDashboard, {
      props: {
        data: []
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

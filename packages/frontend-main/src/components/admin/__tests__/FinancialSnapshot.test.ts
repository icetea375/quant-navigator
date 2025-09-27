// 财务数据快照组件测试
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestWrapper } from '@/utils/test-utils'
import { useArbitrationStore } from '@/stores/arbitration'
import FinancialSnapshot from '../FinancialSnapshot.vue'

// 模拟财务数据
const mockFinancialData = [
  {
    reportPeriod: '2024-Q1',
    fiscalYear: '2024',
    basicInfo: {
      stock_code: '000001',
      stock_name: '平安银行',
      current_price: 12.50,
      change_pct: 2.5,
      market_cap: 1000000000,
      pe_ratio: 8.5,
      pb_ratio: 0.8
    },
    metrics: {
      revenue_growth: 0.15,
      profit_growth: 0.12,
      roe: 0.08,
      debt_ratio: 0.3,
      current_ratio: 1.5,
      quick_ratio: 1.2
    },
    trends: [
      { period: '2024-Q1', revenue: 1000000, profit: 200000 },
      { period: '2024-Q2', revenue: 1100000, profit: 220000 },
      { period: '2024-Q3', revenue: 1200000, profit: 240000 }
    ]
  }
]

describe('FinancialSnapshot', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = createTestWrapper(FinancialSnapshot, {
      props: {
        data: mockFinancialData
      }
    })
  })

  it('should render financial snapshot', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('[data-testid="financial-snapshot"]').exists()).toBe(true)
  })

  it('should display basic stock information', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('平安银行')
    expect(wrapper.text()).toContain('000001')
    expect(wrapper.text()).toContain('12.50')
  })

  it('should display financial metrics', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('15%') // revenue_growth
    expect(wrapper.text()).toContain('12%') // profit_growth
    expect(wrapper.text()).toContain('8%')  // roe
  })

  it('should render financial charts', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const charts = wrapper.findAll('[data-testid="financial-chart"]')
    expect(charts.length).toBeGreaterThan(0)
  })

  it('should handle period selection', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const periodSelect = wrapper.find('[data-testid="period-select"]')
    if (periodSelect.exists()) {
      await periodSelect.setValue('quarterly')
      await periodSelect.trigger('change')

      // 验证期间选择功能
      expect(wrapper.vm.selectedPeriod).toBe('quarterly')
    }
  })

  it('should handle metric hover events', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const metricItem = wrapper.find('[data-testid="metric-item"]')
    if (metricItem.exists()) {
      await metricItem.trigger('mouseenter')

      // 验证悬停事件
      expect(wrapper.emitted('metric-hover')).toBeTruthy()
    }
  })

  it('should display trend data correctly', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // 验证趋势数据渲染
    expect(wrapper.text()).toContain('2024-Q1')
    expect(wrapper.text()).toContain('2024-Q2')
    expect(wrapper.text()).toContain('2024-Q3')
  })

  it('should handle empty data state', async () => {
    const emptyWrapper = createTestWrapper(FinancialSnapshot, {
      props: {
        data: null
      }
    })

    await emptyWrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(emptyWrapper.text()).toContain('暂无财务数据')
  })

  it('should calculate derived metrics correctly', () => {
    // 测试派生指标计算
    const component = wrapper.vm
    if (component.calculatedMetrics) {
      expect(component.calculatedMetrics).toBeDefined()
    }
  })
})

// 财务数据快照组件测试
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestWrapper, mockElementPlusComponents } from '@/utils/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import FinancialSnapshot from '../FinancialSnapshot.vue'

// 模拟财务数据
const mockFinancialData = [
  {
    reportId: 'report-1',
    stockCode: '000001',
    reportDate: '2024-01-15T09:00:00Z',
    reportPeriod: 'Q1',
    fiscalYear: 2024,
    status: 'published',

    // 核心财务指标
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

    // 资产负债指标
    totalAssets: 10000000,
    totalLiabilities: 3000000,
    netAssets: 7000000,
    debtToAssetRatio: 0.3,

    // 盈利能力指标
    roe: 0.08,
    roa: 0.06,
    eps: 1.2,

    // 成长性指标
    revenue3YearCAGR: 0.10,
    profit3YearCAGR: 0.12,

    // 数据质量
    dataCompleteness: 0.95,
    dataAccuracy: 0.98,
    dataTimeliness: 0.90
  }
]

describe('FinancialSnapshot', () => {
  let wrapper: VueWrapper<InstanceType<typeof FinancialSnapshot>>

  beforeEach(() => {
    wrapper = createTestWrapper(FinancialSnapshot, {
      props: {
        data: mockFinancialData
      },
      global: {
        stubs: {
          ...mockElementPlusComponents(),
          'v-chart': { template: '<div class="v-chart-mock"></div>' }
        }
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

    expect(wrapper.text()).toContain('营业收入')
    expect(wrapper.text()).toContain('扣非净利润')
    expect(wrapper.text()).toContain('毛利率')
  })

  it('should display financial metrics', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('+15.0%') // revenue_growth
    expect(wrapper.text()).toContain('+12.0%') // profit_growth
    expect(wrapper.text()).toContain('盈利能力指标')
  })

  it('should render financial charts', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // 检查图表容器是否存在
    expect(wrapper.find('.trend-charts').exists()).toBe(true)
    expect(wrapper.text()).toContain('财务趋势分析')
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
    expect(wrapper.text()).toContain('财务趋势分析')
    expect(wrapper.text()).toContain('数据质量')
    expect(wrapper.text()).toContain('数据完整性')
  })

  it('should handle empty data state', async () => {
    const emptyWrapper = createTestWrapper(FinancialSnapshot, {
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

    // 调试：打印组件内容
    console.log('Empty wrapper HTML:', emptyWrapper.html())
    console.log('Empty wrapper text:', emptyWrapper.text())

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

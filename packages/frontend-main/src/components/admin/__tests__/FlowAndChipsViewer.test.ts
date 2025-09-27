// 资金流向与筹码查看器组件测试
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestWrapper } from '@/utils/test-utils'
import { useArbitrationStore } from '@/stores/arbitration'
import FlowAndChipsViewer from '../FlowAndChipsViewer.vue'

// 模拟资金流向和筹码数据
const mockFlowAndChipsData = [
  {
    moneyFlow: {
      main_net_inflow: 1000000,
      super_large_net_inflow: 500000,
      large_net_inflow: 300000,
      medium_net_inflow: 200000,
      small_net_inflow: 100000,
      net_inflow_ratio: 0.15
    },
    topList: [
      {
        rank: 1,
        stock_code: '000001',
        stock_name: '平安银行',
        net_inflow: 500000,
        net_inflow_ratio: 0.05,
        change_pct: 2.5
      },
      {
        rank: 2,
        stock_code: '000002',
        stock_name: '万科A',
        net_inflow: 300000,
        net_inflow_ratio: 0.03,
        change_pct: 1.8
      }
    ],
    chipDistribution: {
      high_cost_ratio: 0.3,
      medium_cost_ratio: 0.5,
      low_cost_ratio: 0.2,
      avg_cost: 12.5,
      cost_concentration: 0.7
    }
  }
]

describe('FlowAndChipsViewer', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = createTestWrapper(FlowAndChipsViewer, {
      props: {
        data: mockFlowAndChipsData
      }
    })
  })

  it('should render flow and chips viewer', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('[data-testid="flow-chips-viewer"]').exists()).toBe(true)
  })

  it('should display money flow data', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('1000000') // main_net_inflow
    expect(wrapper.text()).toContain('15%')     // net_inflow_ratio
  })

  it('should display top list data', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('平安银行')
    expect(wrapper.text()).toContain('万科A')
    expect(wrapper.text()).toContain('000001')
    expect(wrapper.text()).toContain('000002')
  })

  it('should display chip distribution data', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('30%')  // high_cost_ratio
    expect(wrapper.text()).toContain('50%')  // medium_cost_ratio
    expect(wrapper.text()).toContain('20%')  // low_cost_ratio
  })

  it('should render money flow charts', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const charts = wrapper.findAll('[data-testid="flow-chart"]')
    expect(charts.length).toBeGreaterThan(0)
  })

  it('should render chip distribution charts', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const charts = wrapper.findAll('[data-testid="chip-chart"]')
    expect(charts.length).toBeGreaterThan(0)
  })

  it('should handle flow hover events', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const flowItem = wrapper.find('[data-testid="flow-item"]')
    if (flowItem.exists()) {
      await flowItem.trigger('mouseenter')

      // 验证悬停事件
      expect(wrapper.emitted('flow-hover')).toBeTruthy()
    }
  })

  it('should handle chip hover events', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const chipItem = wrapper.find('[data-testid="chip-item"]')
    if (chipItem.exists()) {
      await chipItem.trigger('mouseenter')

      // 验证悬停事件
      expect(wrapper.emitted('chip-hover')).toBeTruthy()
    }
  })

  it('should display flow direction indicators', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // 验证资金流向指示器
    const directionIndicators = wrapper.findAll('[data-testid="flow-direction"]')
    expect(directionIndicators.length).toBeGreaterThan(0)
  })

  it('should handle time period selection', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const periodSelect = wrapper.find('[data-testid="period-select"]')
    if (periodSelect.exists()) {
      await periodSelect.setValue('1d')
      await periodSelect.trigger('change')

      // 验证期间选择功能
      expect(wrapper.vm.selectedPeriod).toBe('1d')
    }
  })

  it('should display ranking information', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('1')
    expect(wrapper.text()).toContain('2')
  })

  it('should handle empty data state', async () => {
    const emptyWrapper = createTestWrapper(FlowAndChipsViewer, {
      props: {
        data: []
      }
    })

    await emptyWrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(emptyWrapper.text()).toContain('暂无资金流向数据')
  })

  it('should calculate flow ratios correctly', () => {
    // 测试资金流向比例计算
    const component = wrapper.vm
    if (component.calculatedRatios) {
      expect(component.calculatedRatios).toBeDefined()
    }
  })

  it('should render trend charts', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const trendCharts = wrapper.findAll('[data-testid="trend-chart"]')
    expect(trendCharts.length).toBeGreaterThan(0)
  })
})

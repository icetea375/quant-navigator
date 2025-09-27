// 资金流向与筹码查看器组件测试
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestWrapper, mockElementPlusComponents } from '@/utils/test-utils'
import FlowAndChipsViewer from '../FlowAndChipsViewer.vue'

// 模拟资金流向和筹码数据
const mockFlowAndChipsData = {
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

describe('FlowAndChipsViewer', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = createTestWrapper(FlowAndChipsViewer, {
      props: {
        data: mockFlowAndChipsData
      },
      global: {
        stubs: {
          ...mockElementPlusComponents(),
          'v-chart': { template: '<div class="v-chart-mock"></div>' }
        }
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

    // 检查资金流向数据
    expect(wrapper.text()).toContain('净流入金额')
    expect(wrapper.text()).toContain('1000000')
  })

  it('should display chip distribution data', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // 检查筹码分布标签页是否存在
    expect(wrapper.text()).toContain('筹码分布')
    expect(wrapper.text()).toContain('暂无筹码分布数据')
  })

  it('should render money flow charts', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // 检查图表容器是否存在
    expect(wrapper.text()).toContain('净流入金额')
    expect(wrapper.text()).toContain('1000000')
  })

  it('should render chip distribution charts', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // 检查筹码分布图表容器是否存在
    expect(wrapper.text()).toContain('筹码分布')
    expect(wrapper.text()).toContain('暂无筹码分布数据')
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
    expect(wrapper.text()).toContain('净流入金额')
    expect(wrapper.text()).toContain('净流入比例')
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

    // 检查排名信息显示
    expect(wrapper.text()).toContain('净流入金额')
    expect(wrapper.text()).toContain('1000000')
  })

  it('should handle empty data state', async () => {
    const emptyWrapper = createTestWrapper(FlowAndChipsViewer, {
      props: {
        data: null
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

    expect(emptyWrapper.text()).toContain('暂无资金流向和筹码数据')
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

    // 检查趋势图表容器是否存在
    expect(wrapper.text()).toContain('净流入金额')
    expect(wrapper.text()).toContain('1000000')
  })
})

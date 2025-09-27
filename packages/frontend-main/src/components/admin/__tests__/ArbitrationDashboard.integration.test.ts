import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ArbitrationDashboard from '../ArbitrationDashboard.vue'
import { useArbitrationStore } from '@/stores/arbitration'
import { mockElementPlusComponents } from '@/utils/test-utils'
import type { ArbitrationCaseInfo, ArbitrationCaseData } from '@/types/arbitration'

// 创建测试包装器
const createTestWrapper = (component: any, options = {}) => {
  return mount(component, {
    global: {
      plugins: [createPinia()],
      stubs: {
        ...mockElementPlusComponents(),
        'v-chart': { template: '<div class="v-chart-mock"></div>' }
      }
    },
    ...options
  })
}

describe('ArbitrationDashboard - 容器组件集成测试', () => {
  let wrapper: any
  let arbitrationStore: any
  let pinia: any

  beforeEach(() => {
    // 创建新的Pinia实例
    pinia = createPinia()
    setActivePinia(pinia)

    // 创建包装器
    wrapper = createTestWrapper(ArbitrationDashboard, {
      global: {
        plugins: [pinia],
        stubs: {
          ...mockElementPlusComponents(),
          'v-chart': { template: '<div class="v-chart-mock"></div>' }
        }
      }
    })

    // 获取Store实例
    arbitrationStore = useArbitrationStore()

    // 重置 store 状态
    arbitrationStore.cases = []
    arbitrationStore.currentCaseId = null
    arbitrationStore.caseData = null
    arbitrationStore.loading = false
    arbitrationStore.error = null
    arbitrationStore.maximizedPanel = null
  })

  const mockCases: ArbitrationCaseInfo[] = [
    {
      caseId: 'case-001',
      stockCode: '000001',
      stockName: '平安银行',
      reportDate: '2024-01-01',
      reportType: 'annual',
      status: 'pending',
      priority: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      caseId: 'case-002',
      stockCode: '000002',
      stockName: '万科A',
      reportDate: '2024-01-02',
      reportType: 'quarterly',
      status: 'in_progress',
      priority: 2,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z'
    }
  ]

  const mockCaseData: ArbitrationCaseData = {
    caseInfo: {
      caseId: 'case-001',
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
      rawTextExplorer: [],
      financialSnapshot: [],
      quantSignalDashboard: [],
      flowAndChipsViewer: {
        moneyFlow: {
          flowId: 'test-flow-1',
          stockCode: '000001',
          flowDate: '2024-01-01',
          flowType: 'main_force',
          flowDirection: 'inflow',
          netAmount: 0,
          buyAmount: 0,
          sellAmount: 0,
          totalAmount: 0,
          netInflowRatio: 0,
          mainForceRatio: 0,
          retailRatio: 0,
          flowIntensity: 0,
          flowAnomalyScore: 0,
          flowTrend: 0,
          avgNetInflow5d: 0,
          avgNetInflow10d: 0,
          avgNetInflow20d: 0,
          changeVs5dAvg: 0,
          changeVs10dAvg: 0,
          changeVs20dAvg: 0,
          currentPrice: 0,
          costRangeLower: 0,
          costRangeUpper: 0,
          mainChipPeak: 0,
          chipConcentration: 0,
          dataSource: 'test',
          dataUpdatedAt: '2024-01-01',
          superLargeNetInflow: 0,
          largeNetInflow: 0,
          mediumNetInflow: 0,
          smallNetInflow: 0,
          mainInflow: 0,
          retailInflow: 0,
          institutionalInflow: 0
        },
        topList: [],
        chipDistribution: [{
          distributionId: 'test-dist-1',
          stockCode: '000001',
          distributionDate: '2024-01-01',
          distributionType: 'cost_distribution',
          chipStatus: 'active',
          priceLower: 0,
          priceUpper: 0,
          priceMedian: 0,
          chipQuantity: 0,
          chipRatio: 0,
          chipAmount: 0,
          chipAmountRatio: 0,
          averageCost: 0,
          costConcentration: 0,
          costDispersion: 0,
          currentPrice: 0,
          profitLossRatio: 0,
          profitLossAmount: 0,
          profitLossStatus: 'neutral',
          chipInflow: 0,
          chipOutflow: 0,
          netChipFlow: 0,
          chipFlowIntensity: 0,
          changeVs5d: 0,
          changeVs10d: 0,
          changeVs20d: 0,
          changeVsHistorical: 0,
          distributionStd: 0,
          distributionSkewness: 0,
          distributionKurtosis: 0,
          modelVersion: '1.0',
          calculationParams: {},
          dataSource: 'test',
          dataUpdatedAt: '2024-01-01',
          high_cost_ratio: 0,
          medium_cost_ratio: 0,
          low_cost_ratio: 0,
          avg_cost: 0,
          cost_concentration: 0
        }]
      },
      precedentViewer: []
    }
  }


  describe('状态流测试 - Store状态到UI的传递', () => {
    it('应该正确传递加载状态到子组件', async () => {
      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 设置加载状态
      arbitrationStore.loading = true
      arbitrationStore.cases = mockCases

      // 等待响应式更新
      await wrapper.vm.$nextTick()

      // 验证加载状态被正确渲染
      expect(wrapper.find('[data-testid="loading"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="content"]').exists()).toBe(false)
    })

    it('应该正确传递错误状态到子组件', async () => {
      wrapper = createTestWrapper(ArbitrationDashboard)

      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 设置错误状态
      arbitrationStore.error = '测试错误信息'
      arbitrationStore.loading = false
      arbitrationStore.cases = []

      // 等待响应式更新
      await wrapper.vm.$nextTick()

      // 验证错误状态被正确渲染
      expect(wrapper.find('[data-testid="error"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="content"]').exists()).toBe(false)
    })

    it('应该正确传递案件数据到子组件', async () => {
      wrapper = createTestWrapper(ArbitrationDashboard)

      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 设置案件数据
      arbitrationStore.cases = mockCases
      arbitrationStore.currentCaseId = 'case-001'
      arbitrationStore.currentCase = mockCases[0]
      arbitrationStore.caseData = mockCaseData
      arbitrationStore.loading = false
      arbitrationStore.error = null

      // 等待响应式更新
      await wrapper.vm.$nextTick()

      // 验证数据面板被正确渲染
      expect(wrapper.find('[data-testid="content"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="loading"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="error"]').exists()).toBe(false)
    })

    it('应该正确传递空状态到子组件', async () => {
      wrapper = createTestWrapper(ArbitrationDashboard)

      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 设置空状态
      arbitrationStore.cases = []
      arbitrationStore.currentCaseId = null
      arbitrationStore.currentCase = null
      arbitrationStore.caseData = null
      arbitrationStore.loading = false
      arbitrationStore.error = null

      // 等待响应式更新
      await wrapper.vm.$nextTick()

      // 验证空状态被正确渲染
      expect(wrapper.find('[data-testid="empty"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="content"]').exists()).toBe(false)
    })
  })

  describe('事件流测试 - 用户交互到Store状态的传递', () => {
    it('应该正确处理案件选择事件', async () => {
      // 模拟 fetchCaseData 方法
      const mockFetchCaseData = vi.fn().mockResolvedValue(undefined)
      arbitrationStore.fetchCaseData = mockFetchCaseData

      wrapper = createTestWrapper(ArbitrationDashboard)

      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 模拟案件选择
      await wrapper.vm.handleCaseSelect('case-001')

      // 验证 store 方法被调用
      expect(mockFetchCaseData).toHaveBeenCalledWith('case-001')
    })

    it('应该正确处理刷新事件', async () => {
      // 模拟 fetchCases 和 fetchCaseData 方法
      const mockFetchCases = vi.fn().mockResolvedValue(undefined)
      const mockFetchCaseData = vi.fn().mockResolvedValue(undefined)
      arbitrationStore.fetchCases = mockFetchCases
      arbitrationStore.fetchCaseData = mockFetchCaseData

      wrapper = createTestWrapper(ArbitrationDashboard)

      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 模拟刷新操作
      await wrapper.vm.handleRefresh()

      // 验证 store 方法被调用
      expect(mockFetchCases).toHaveBeenCalled()
    })

    it('应该正确处理面板最大化事件', async () => {
      // 模拟 setMaximizedPanel 方法
      const mockSetMaximizedPanel = vi.fn()
      arbitrationStore.setMaximizedPanel = mockSetMaximizedPanel

      wrapper = createTestWrapper(ArbitrationDashboard)

      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 模拟面板最大化
      await wrapper.vm.handleToggleMaximize('raw-text')

      // 验证 store 方法被调用
      expect(mockSetMaximizedPanel).toHaveBeenCalledWith('raw-text')
    })

    it('应该正确处理面板关闭事件', async () => {
      // 模拟 setMaximizedPanel 方法
      const mockSetMaximizedPanel = vi.fn()
      arbitrationStore.setMaximizedPanel = mockSetMaximizedPanel

      wrapper = createTestWrapper(ArbitrationDashboard)

      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 模拟面板关闭
      await wrapper.vm.handleClosePanel('raw-text')

      // 验证 store 方法被调用
      expect(mockSetMaximizedPanel).toHaveBeenCalledWith(null)
    })

    it('应该正确处理错误关闭事件', async () => {
      // 模拟 clearError 方法
      const mockClearError = vi.fn()
      arbitrationStore.clearError = mockClearError

      wrapper = createTestWrapper(ArbitrationDashboard)

      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 模拟错误关闭
      await wrapper.vm.handleErrorClose()

      // 验证 store 方法被调用
      expect(mockClearError).toHaveBeenCalled()
    })
  })

  describe('组件生命周期测试', () => {
    it('应该在挂载时调用 fetchCases', async () => {
      // 模拟 fetchCases 方法
      const mockFetchCases = vi.fn().mockResolvedValue(undefined)
      arbitrationStore.fetchCases = mockFetchCases

      wrapper = createTestWrapper(ArbitrationDashboard)

      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 验证 fetchCases 被调用
      expect(mockFetchCases).toHaveBeenCalled()
    })

    it('应该在挂载时调用 loadLayoutFromStorage', async () => {
      // 模拟 loadLayoutFromStorage 方法
      const mockLoadLayoutFromStorage = vi.fn()
      arbitrationStore.loadLayoutFromStorage = mockLoadLayoutFromStorage

      wrapper = createTestWrapper(ArbitrationDashboard)

      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 验证 loadLayoutFromStorage 被调用
      expect(mockLoadLayoutFromStorage).toHaveBeenCalled()
    })
  })

  describe('计算属性测试', () => {
    it('应该正确计算 currentCaseId', async () => {
      wrapper = createTestWrapper(ArbitrationDashboard)

      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 设置 store 状态
      arbitrationStore.currentCaseId = 'case-001'

      // 等待响应式更新
      await wrapper.vm.$nextTick()

      // 验证计算属性
      expect(wrapper.vm.currentCaseId).toBe('case-001')
    })

    it('应该正确计算 currentCase', async () => {
      wrapper = createTestWrapper(ArbitrationDashboard)

      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 设置 store 状态
      arbitrationStore.currentCase = mockCases[0]

      // 等待响应式更新
      await wrapper.vm.$nextTick()

      // 验证计算属性
      expect(wrapper.vm.currentCase).toEqual(mockCases[0])
    })

    it('应该正确计算 caseData', async () => {
      wrapper = createTestWrapper(ArbitrationDashboard)

      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 设置 store 状态
      arbitrationStore.caseData = mockCaseData

      // 等待响应式更新
      await wrapper.vm.$nextTick()

      // 验证计算属性
      expect(wrapper.vm.caseData).toEqual(mockCaseData)
    })

    it('应该正确计算 loading', async () => {
      wrapper = createTestWrapper(ArbitrationDashboard)

      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 设置 store 状态
      arbitrationStore.loading = true

      // 等待响应式更新
      await wrapper.vm.$nextTick()

      // 验证计算属性
      expect(wrapper.vm.loading).toBe(true)
    })

    it('应该正确计算 error', async () => {
      wrapper = createTestWrapper(ArbitrationDashboard)

      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 设置 store 状态
      arbitrationStore.error = '测试错误'

      // 等待响应式更新
      await wrapper.vm.$nextTick()

      // 验证计算属性
      expect(wrapper.vm.error).toBe('测试错误')
    })

    it('应该正确计算 cases', async () => {
      wrapper = createTestWrapper(ArbitrationDashboard)

      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 设置 store 状态
      arbitrationStore.cases = mockCases

      // 等待响应式更新
      await wrapper.vm.$nextTick()

      // 验证计算属性
      expect(wrapper.vm.cases).toEqual(mockCases)
    })

    it('应该正确计算 maximizedPanel', async () => {
      wrapper = createTestWrapper(ArbitrationDashboard)

      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 设置 store 状态
      arbitrationStore.maximizedPanel = 'raw-text'

      // 等待响应式更新
      await wrapper.vm.$nextTick()

      // 验证计算属性
      expect(wrapper.vm.maximizedPanel).toBe('raw-text')
    })
  })

  describe('用户交互集成测试', () => {
    it('应该正确处理全屏切换', async () => {
      wrapper = createTestWrapper(ArbitrationDashboard)

      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 初始状态
      expect(wrapper.vm.isFullscreen).toBe(false)

      // 切换全屏
      await wrapper.vm.handleToggleFullscreen()

      // 验证状态变化
      expect(wrapper.vm.isFullscreen).toBe(true)

      // 再次切换
      await wrapper.vm.handleToggleFullscreen()

      // 验证状态变化
      expect(wrapper.vm.isFullscreen).toBe(false)
    })

    it('应该正确处理设置按钮点击', async () => {
      wrapper = createTestWrapper(ArbitrationDashboard)

      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 模拟设置按钮点击
      await wrapper.vm.handleSettings()

      // 验证没有错误（方法被调用）
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('边界情况测试', () => {
    it('应该处理 undefined 的 caseId prop', async () => {
      wrapper = createTestWrapper(ArbitrationDashboard, {
        props: {
          caseId: undefined
        }
      })

      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 验证组件正常渲染
      expect(wrapper.exists()).toBe(true)
    })

    it('应该处理空字符串的 caseId prop', async () => {
      wrapper = createTestWrapper(ArbitrationDashboard, {
        props: {
          caseId: ''
        }
      })

      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 验证组件正常渲染
      expect(wrapper.exists()).toBe(true)
    })

    it('应该处理 store 方法调用失败', async () => {
      // 模拟方法调用失败
      const mockFetchCases = vi.fn().mockRejectedValue(new Error('网络错误'))
      arbitrationStore.fetchCases = mockFetchCases

      wrapper = createTestWrapper(ArbitrationDashboard)

      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 验证组件正常渲染（错误处理）
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('组件渲染测试', () => {
    it('应该正确渲染主容器', async () => {
      wrapper = createTestWrapper(ArbitrationDashboard)

      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 验证主容器存在
      expect(wrapper.find('[data-testid="arbitration-dashboard"]').exists()).toBe(true)
    })

    it('应该正确渲染侧边栏', async () => {
      arbitrationStore.cases = mockCases

      wrapper = createTestWrapper(ArbitrationDashboard)

      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 验证侧边栏存在
      expect(wrapper.find('.sidebar').exists()).toBe(true)
    })

    it('应该正确渲染主内容区域', async () => {
      wrapper = createTestWrapper(ArbitrationDashboard)

      // 等待组件更新
      await wrapper.vm.$nextTick()

      // 验证主内容区域存在
      expect(wrapper.find('.main-content').exists()).toBe(true)
    })
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ArbitrationDashboard from '../ArbitrationDashboard.vue'
import { useArbitrationStore } from '@/stores/arbitration'
import { mockElementPlusComponents } from '@/utils/test-utils'

// 创建测试包装器
const createTestWrapper = (component: unknown, options = {}) => {
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

describe('ArbitrationDashboard - 修复后的集成测试', () => {
  let wrapper: VueWrapper<InstanceType<typeof ArbitrationDashboard>>
  let arbitrationStore: ReturnType<typeof useArbitrationStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    arbitrationStore = useArbitrationStore()
  })

  describe('状态流测试', () => {
    it('应该正确反映 loading 状态变化', async () => {
      wrapper = createTestWrapper(ArbitrationDashboard)
      await wrapper.vm.$nextTick()

      // 修改 store 的 ref 对象
      arbitrationStore.loading.value = true
      await wrapper.vm.$nextTick()

      // 验证计算属性
      expect(wrapper.vm.loading).toBe(true)
    })

    it('应该正确反映 error 状态变化', async () => {
      wrapper = createTestWrapper(ArbitrationDashboard)
      await wrapper.vm.$nextTick()

      // 修改 store 的 ref 对象
      arbitrationStore.error.value = '测试错误'
      await wrapper.vm.$nextTick()

      // 验证计算属性
      expect(wrapper.vm.error).toBe('测试错误')
    })

    it('应该正确反映 cases 状态变化', async () => {
      wrapper = createTestWrapper(ArbitrationDashboard)
      await wrapper.vm.$nextTick()

      // 修改 store 的 ref 对象
      arbitrationStore.cases.value = [
        { id: '1', title: '测试案例1', status: 'pending' },
        { id: '2', title: '测试案例2', status: 'completed' }
      ]
      await wrapper.vm.$nextTick()

      // 验证计算属性
      expect(wrapper.vm.cases).toHaveLength(2)
      expect(wrapper.vm.cases[0].title).toBe('测试案例1')
    })
  })

  describe('事件流测试', () => {
    it('应该正确处理案例选择事件', async () => {
      wrapper = createTestWrapper(ArbitrationDashboard)
      await wrapper.vm.$nextTick()

      // 模拟案例选择
      const caseId = 'test-case-1'
      await wrapper.vm.handleCaseSelect(caseId)

      // 验证 store 状态变化
      expect(arbitrationStore.currentCaseId.value).toBe(caseId)
    })

    it('应该正确处理刷新事件', async () => {
      wrapper = createTestWrapper(ArbitrationDashboard)
      await wrapper.vm.$nextTick()

      // 模拟刷新
      await wrapper.vm.handleRefresh()

      // 验证 store 状态变化（fetchCases 会设置模拟数据）
      expect(arbitrationStore.cases.value).toHaveLength(3)
    })
  })

  describe('UI 渲染测试', () => {
    it('应该正确渲染加载状态', async () => {
      wrapper = createTestWrapper(ArbitrationDashboard)
      await wrapper.vm.$nextTick()

      // 设置加载状态
      arbitrationStore.loading.value = true
      await wrapper.vm.$nextTick()

      // 验证 UI 渲染
      const loadingElement = wrapper.find('[data-testid="loading"]')
      expect(loadingElement.exists()).toBe(true)
    })

    it('应该正确渲染错误状态', async () => {
      wrapper = createTestWrapper(ArbitrationDashboard)
      await wrapper.vm.$nextTick()

      // 设置错误状态
      arbitrationStore.error.value = '测试错误信息'
      arbitrationStore.loading.value = false
      await wrapper.vm.$nextTick()

      // 验证 UI 渲染
      const errorElement = wrapper.find('[data-testid="error"]')
      expect(errorElement.exists()).toBe(true)
      expect(errorElement.text()).toContain('测试错误信息')
    })

    it('应该正确渲染案例数据', async () => {
      wrapper = createTestWrapper(ArbitrationDashboard)
      await wrapper.vm.$nextTick()

      // 设置案例数据
      arbitrationStore.caseData.value = {
        id: 'test-case-1',
        title: '测试案例',
        panels: {
          rawTextExplorer: [],
          financialSnapshot: [],
          quantSignalDashboard: [],
          flowAndChipsViewer: {},
          personalPrecedentViewer: []
        }
      }
      arbitrationStore.loading.value = false
      arbitrationStore.error.value = null
      await wrapper.vm.$nextTick()

      // 验证 UI 渲染
      const contentElement = wrapper.find('[data-testid="content"]')
      expect(contentElement.exists()).toBe(true)
    })
  })
})

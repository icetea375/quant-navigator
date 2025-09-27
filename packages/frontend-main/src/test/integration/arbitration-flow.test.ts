import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import ArbitrationDashboard from '@/components/admin/ArbitrationDashboard.vue'
import { useArbitrationStore } from '@/stores/arbitration'
import { mockElementPlusComponents } from '@/utils/test-utils'

describe('仲裁流程集成测试', () => {
  let wrapper: any
  let arbitrationStore: any

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('完整仲裁流程', () => {
    it('应该完成从案例选择到决策提交的完整流程', async () => {
      // 挂载主容器组件
      wrapper = mount(ArbitrationDashboard, {
        global: {
          plugins: [createPinia()],
          stubs: {
            ...mockElementPlusComponents(),
            'v-chart': { template: '<div class="v-chart-mock"></div>' }
          }
        }
      })

      arbitrationStore = useArbitrationStore()

      // 1. 初始状态：显示案例列表
      await nextTick()
      expect(wrapper.find('[data-testid="arbitration-dashboard"]').exists()).toBe(true)

      // 2. 选择案例
      const caseId = 'test-case-001'
      await wrapper.vm.handleCaseSelect(caseId)
      await nextTick()

      // 验证案例选择成功
      expect(arbitrationStore.currentCaseId).toBe(caseId)

      // 3. 验证数据加载
      expect(arbitrationStore.caseData).toBeTruthy()

      // 4. 验证数据面板显示
      const contentElement = wrapper.find('[data-testid="content"]')
      expect(contentElement.exists()).toBe(true)
    })

    it('应该正确处理错误状态和恢复流程', async () => {
      wrapper = mount(ArbitrationDashboard, {
        global: {
          plugins: [createPinia()],
          stubs: {
            ...mockElementPlusComponents(),
            'v-chart': { template: '<div class="v-chart-mock"></div>' }
          }
        }
      })

      arbitrationStore = useArbitrationStore()

      // 1. 设置错误状态
      arbitrationStore.error = '网络连接失败'
      arbitrationStore.loading = false
      await nextTick()

      // 2. 验证错误显示
      const errorElement = wrapper.find('[data-testid="error"]')
      expect(errorElement.exists()).toBe(true)

      // 3. 清除错误
      arbitrationStore.error = null
      await nextTick()

      // 4. 验证错误消失
      expect(wrapper.find('[data-testid="error"]').exists()).toBe(false)
    })

    it('应该正确处理加载状态转换', async () => {
      wrapper = mount(ArbitrationDashboard, {
        global: {
          plugins: [createPinia()],
          stubs: {
            ...mockElementPlusComponents(),
            'v-chart': { template: '<div class="v-chart-mock"></div>' }
          }
        }
      })

      arbitrationStore = useArbitrationStore()

      // 1. 设置加载状态
      arbitrationStore.loading = true
      await nextTick()

      // 2. 验证加载显示
      const loadingElement = wrapper.find('[data-testid="loading"]')
      expect(loadingElement.exists()).toBe(true)

      // 3. 完成加载
      arbitrationStore.loading = false
      arbitrationStore.caseData = {
        id: 'test-case-001',
        title: '测试案例',
        panels: {
          rawTextExplorer: [],
          financialSnapshot: [],
          quantSignalDashboard: [],
          flowAndChipsViewer: {},
          personalPrecedentViewer: []
        }
      }
      await nextTick()

      // 4. 验证数据面板显示
      const contentElement = wrapper.find('[data-testid="content"]')
      expect(contentElement.exists()).toBe(true)
    })
  })

  describe('组件间通信集成', () => {
    it('应该正确处理工具栏刷新事件', async () => {
      wrapper = mount(ArbitrationDashboard, {
        global: {
          plugins: [createPinia()],
          stubs: {
            ...mockElementPlusComponents(),
            'v-chart': { template: '<div class="v-chart-mock"></div>' }
          }
        }
      })

      arbitrationStore = useArbitrationStore()

      // 模拟刷新操作
      await wrapper.vm.handleRefresh()
      await nextTick()

      // 验证案例数据被加载
      expect(arbitrationStore.cases.length).toBeGreaterThan(0)
    })

    it('应该正确处理面板最大化事件', async () => {
      wrapper = mount(ArbitrationDashboard, {
        global: {
          plugins: [createPinia()],
          stubs: {
            ...mockElementPlusComponents(),
            'v-chart': { template: '<div class="v-chart-mock"></div>' }
          }
        }
      })

      arbitrationStore = useArbitrationStore()

      // 设置案例数据
      arbitrationStore.caseData = {
        id: 'test-case-001',
        title: '测试案例',
        panels: {
          rawTextExplorer: [],
          financialSnapshot: [],
          quantSignalDashboard: [],
          flowAndChipsViewer: {},
          personalPrecedentViewer: []
        }
      }
      await nextTick()

      // 触发面板最大化
      await wrapper.vm.handleToggleMaximize('raw-text')
      await nextTick()

      // 验证最大化状态
      expect(arbitrationStore.maximizedPanel).toBe('raw-text')
    })
  })
})

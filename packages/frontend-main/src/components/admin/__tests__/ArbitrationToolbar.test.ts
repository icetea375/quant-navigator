import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ArbitrationToolbar from '@/components/admin/ArbitrationToolbar.vue'
import { mockElementPlusComponents } from '@/utils/test-utils'
import type { ArbitrationCaseInfo } from '@/types/arbitration'

// 创建测试包装器
const createTestWrapper = (component: any, options = {}) => {
  return mount(component, {
    global: {
      plugins: [createPinia()],
      stubs: {
        ...mockElementPlusComponents()
      }
    },
    ...options
  })
}

describe('ArbitrationToolbar - 展示组件单元测试', () => {
  let wrapper: any

  const mockCurrentCase: ArbitrationCaseInfo = {
    caseId: 'case-001',
    stockCode: '000001',
    stockName: '平安银行',
    reportDate: '2024-01-01',
    reportType: 'annual',
    status: 'pending',
    priority: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('组件渲染测试', () => {
    it('应该正确渲染工具栏', () => {
      wrapper = createTestWrapper(ArbitrationToolbar, {
        props: {
          currentCase: null,
          loading: false,
          isFullscreen: false
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.toolbar').exists()).toBe(true)
      expect(wrapper.find('.dashboard-title').text()).toBe('AI治理中心 - 仲裁仪表盘')
    })

    it('应该显示所有按钮', () => {
      wrapper = createTestWrapper(ArbitrationToolbar, {
        props: {
          currentCase: null,
          loading: false,
          isFullscreen: false
        }
      })

      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThanOrEqual(3)
      expect(wrapper.text()).toContain('刷新数据')
      expect(wrapper.text()).toContain('设置')
      expect(wrapper.text()).toContain('全屏')
    })

    it('应该显示当前案例信息', () => {
      wrapper = createTestWrapper(ArbitrationToolbar, {
        props: {
          currentCase: mockCurrentCase,
          loading: false,
          isFullscreen: false
        }
      })

      expect(wrapper.text()).toContain('当前案例: 平安银行 (000001)')
    })

    it('应该在不显示当前案例时隐藏案例标签', () => {
      wrapper = createTestWrapper(ArbitrationToolbar, {
        props: {
          currentCase: null,
          loading: false,
          isFullscreen: false
        }
      })

      expect(wrapper.text()).not.toContain('当前案例:')
    })
  })

  describe('加载状态测试', () => {
    it('应该显示加载状态', () => {
      wrapper = createTestWrapper(ArbitrationToolbar, {
        props: {
          currentCase: null,
          loading: true,
          isFullscreen: false
        }
      })

      const refreshButton = wrapper.find('button')
      expect(refreshButton.attributes('loading')).toBeDefined()
    })

    it('应该在不加载时隐藏加载状态', () => {
      wrapper = createTestWrapper(ArbitrationToolbar, {
        props: {
          currentCase: null,
          loading: false,
          isFullscreen: false
        }
      })

      const refreshButton = wrapper.find('button')
      expect(refreshButton.attributes('loading')).toBe('false')
    })
  })

  describe('全屏状态测试', () => {
    it('应该显示全屏按钮文本', () => {
      wrapper = createTestWrapper(ArbitrationToolbar, {
        props: {
          currentCase: null,
          loading: false,
          isFullscreen: false
        }
      })

      expect(wrapper.text()).toContain('全屏')
    })

    it('应该显示退出全屏按钮文本', () => {
      wrapper = createTestWrapper(ArbitrationToolbar, {
        props: {
          currentCase: null,
          loading: false,
          isFullscreen: true
        }
      })

      expect(wrapper.text()).toContain('退出全屏')
    })
  })

  describe('用户交互测试', () => {
    it('应该触发刷新事件', async () => {
      wrapper = createTestWrapper(ArbitrationToolbar, {
        props: {
          currentCase: null,
          loading: false,
          isFullscreen: false
        }
      })

      const refreshButton = wrapper.find('button')
      await refreshButton.trigger('click')

      expect(wrapper.emitted('refresh')).toBeTruthy()
    })

    it('应该触发设置事件', async () => {
      wrapper = createTestWrapper(ArbitrationToolbar, {
        props: {
          currentCase: null,
          loading: false,
          isFullscreen: false
        }
      })

      const buttons = wrapper.findAll('button')
      const settingsButton = buttons.find(btn => btn.text().includes('设置'))
      await settingsButton?.trigger('click')

      expect(wrapper.emitted('settings')).toBeTruthy()
    })

    it('应该触发全屏切换事件', async () => {
      wrapper = createTestWrapper(ArbitrationToolbar, {
        props: {
          currentCase: null,
          loading: false,
          isFullscreen: false
        }
      })

      const buttons = wrapper.findAll('button')
      const fullscreenButton = buttons.find(btn => btn.text().includes('全屏'))
      await fullscreenButton?.trigger('click')

      expect(wrapper.emitted('toggle-fullscreen')).toBeTruthy()
    })
  })

  describe('边界情况测试', () => {
    it('应该处理 undefined 的 currentCase', () => {
      wrapper = createTestWrapper(ArbitrationToolbar, {
        props: {
          currentCase: undefined as any,
          loading: false,
          isFullscreen: false
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).not.toContain('当前案例:')
    })

    it('应该处理默认 props', () => {
      wrapper = createTestWrapper(ArbitrationToolbar, {
        props: {}
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('AI治理中心 - 仲裁仪表盘')
    })
  })

  describe('样式和布局测试', () => {
    it('应该具有正确的 CSS 类', () => {
      wrapper = createTestWrapper(ArbitrationToolbar, {
        props: {
          currentCase: null,
          loading: false,
          isFullscreen: false
        }
      })

      expect(wrapper.find('.toolbar').exists()).toBe(true)
      expect(wrapper.find('.toolbar-left').exists()).toBe(true)
      expect(wrapper.find('.toolbar-right').exists()).toBe(true)
      expect(wrapper.find('.dashboard-title').exists()).toBe(true)
    })

    it('应该正确显示标题', () => {
      wrapper = createTestWrapper(ArbitrationToolbar, {
        props: {
          currentCase: null,
          loading: false,
          isFullscreen: false
        }
      })

      const title = wrapper.find('.dashboard-title')
      expect(title.text()).toBe('AI治理中心 - 仲裁仪表盘')
      expect(title.classes()).toContain('dashboard-title')
    })
  })
})

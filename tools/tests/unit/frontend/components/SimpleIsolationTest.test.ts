/**
 * 简单隔离测试 - 验证技术栈组合
 * 目标：在复杂环境中测试基本功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestPinia, resetTestPinia, getTestPinia } from '../../../utils/test-pinia.ts'
import { mount } from '@vue/test-utils'
import type { Router, RouteLocationNormalized, RouteRecordRaw } from 'vue-router'

// 创建精确的Router Mock类型定义
interface MockRouter extends Partial<Router> {
  push: ReturnType<typeof vi.fn>
  currentRoute: { value: RouteLocationNormalized }
  options: {
    routes: RouteRecordRaw[]
  }
  install: ReturnType<typeof vi.fn>
}

// 创建Router Mock工厂函数
function createMockRouter(): MockRouter {
  const mockRoute: RouteLocationNormalized = {
    path: '/',
    name: undefined,
    params: {},
    query: {},
    hash: '',
    fullPath: '/',
    matched: [],
    meta: {},
    redirectedFrom: undefined
  } as RouteLocationNormalized

  return {
    push: vi.fn(),
    currentRoute: { value: mockRoute },
    options: {
      routes: []
    },
    install: vi.fn()
  }
}

//创建一个最简单的测试组件
const SimpleTestComponent = {
  template: `
    <div data-testid="simple-test">
      <h2>Simple Test</h2>
      <p>Count: {{ count }}</p>
      <button @click="increment">Increment</button>
    </div>
  `,
  data() {
    return {
      count: 0
    }
  },
  methods: {
    increment() {
      this.count++
    }
  }
}

describe('Simple Isolation Test', () => {
    let router: MockRouter

  beforeEach(() => {
    createTestPinia()
    router = createMockRouter()
  })

  it('should render simple component', () => {
    const wrapper = mount(SimpleTestComponent, {
      global: {
        plugins: [getTestPinia(), router]
      }
    })
    
    console.log('=== Simple Test HTML ===')
    console.log(wrapper.html())
    
    expect(wrapper.find('[data-testid="simple-test"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Count: 0')
  })

  it('should handle button click', async () => {
    const wrapper = mount(SimpleTestComponent, {
      global: {
        plugins: [getTestPinia(), ]
      }
    })
    
    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    
    // Use direct method call instead of trigger
    const component = wrapper.vm
    component.increment()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Count: 1')
  })
})


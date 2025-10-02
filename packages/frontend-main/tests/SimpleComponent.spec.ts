/**
 * 简单组件测试 - 隔离问题
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestPinia, resetTestPinia, getTestPinia } from '../src/utils/test-pinia.ts'
import { mount } from '@vue/test-utils'

//创建一个最简单的测试组件
const SimpleComponent = {
  template: '<div data-testid="simple-component">Hello World</div>',
  name: 'SimpleComponent'
}

describe('简单组件测试', () => {
    let router: Router

  beforeEach(() => {
    createTestPinia()
    router = {
      push: vi.fn(),
      currentRoute: { value: { path: '/' } },
      options: {
        routes: []
      }
    }
  })

  it('应该能够渲染最简单的组件', () => {
    console.log('=== 开始简单组件测试 ===')
    
    const wrapper = mount(SimpleComponent, {
      global: {
        plugins: [getTestPinia(), router]
      }
    })

    console.log('wrapper.exists():', wrapper.exists())
    console.log('wrapper.html():', wrapper.html())
    
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('[data-testid="simple-component"]').exists()).toBe(true)
  })

  it('应该能够渲染带props的组件', () => {
    const ComponentWithProps = {
      template: '<div data-testid="props-component">{{ message }}</div>',
      props: ['message'],
      name: 'ComponentWithProps'
    }

    const wrapper = mount(ComponentWithProps, {
      props: {
        message: 'Test Message'
      },
      global: {
        plugins: [getTestPinia(), router]
      }
    })

    console.log('Props component wrapper.exists():', wrapper.exists())
    console.log('Props component wrapper.html():', wrapper.html())
    
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('Test Message')
  })
})


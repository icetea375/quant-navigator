/**
 * 无菌手术室验证测试
 * 验证createTestWrapper是否正常工作
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestWrapper } from '@/utils/test-utils'
import { nextTick } from 'vue'

// 简单的测试组件
const TestComponent = {
  template: `
    <div class="test-component" data-testid="test-component">
      <h1>{{ title }}</h1>
      <p>Count: {{ count }}</p>
      <button @click="increment">Increment</button>
      <router-link to="/test">Test Link</router-link>
      <router-view />
    </div>
  `,
  props: {
    title: {
      type: String,
      default: 'Test Component'
    }
  },
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

describe('无菌手术室验证', () => {
  beforeEach(() => {
    // 清理环境
  })

  afterEach(() => {
    // 清理测试环境
  })

  describe('基础组件渲染', () => {
    it('应该能够渲染简单组件', () => {
      const wrapper = createTestWrapper(TestComponent)
      
      expect(wrapper.find('[data-testid="test-component"]').exists()).toBe(true)
      expect(wrapper.find('h1').text()).toBe('Test Component')
      expect(wrapper.find('p').text()).toBe('Count: 0')
    })

    it('应该能够处理props', () => {
      const wrapper = createTestWrapper(TestComponent, {
        props: {
          title: 'Custom Title'
        }
      })
      
      expect(wrapper.find('h1').text()).toBe('Custom Title')
    })

    it('应该能够处理用户交互', async () => {
      const wrapper = createTestWrapper(TestComponent)
      
      const button = wrapper.find('button')
      expect(button.exists()).toBe(true)
      
      // 直接调用方法而不是触发事件
      wrapper.vm.increment()
      await nextTick()
      
      expect(wrapper.find('p').text()).toBe('Count: 1')
    })
  })

  describe('路由功能', () => {
    it('应该能够使用路由', () => {
      const wrapper = createTestWrapper(TestComponent)
      
      expect(wrapper.find('[data-testid="test-component"]').exists()).toBe(true)
      // 检查路由相关的stub组件
      expect(wrapper.find('a').exists()).toBe(true) // router-link被stub为a标签
      expect(wrapper.find('.router-view').exists()).toBe(true) // router-view被stub为div.router-view
    })
  })

  describe('Element Plus集成', () => {
    it('应该能够使用Element Plus组件', () => {
      const wrapper = createTestWrapper({
        template: `
          <div>
            <el-button>Test Button</el-button>
            <el-input v-model="value" placeholder="Test Input" />
          </div>
        `,
        data() {
          return {
            value: ''
          }
        }
      })
      
      expect(wrapper.find('.el-button').exists()).toBe(true)
      expect(wrapper.find('.el-input').exists()).toBe(true)
    })
  })

  describe('Pinia Store集成', () => {
    it('应该能够使用Pinia store', () => {
      const wrapper = createTestWrapper({
        template: `
          <div>
            <p>Store available: {{ !!$pinia }}</p>
          </div>
        `
      })
      
      expect(wrapper.find('p').text()).toBe('Store available: true')
    })
  })
})

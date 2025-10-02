// 组件测试 - 使用胜利模式重建
import { describe, it, expect } from 'vitest'
import { createTestWrapper } from '@/utils/test-utils'

// 简单的测试组件
const TestComponent = {
  template: `
    <div>
      <h1>测试组件</h1>
      <button @click="handleClick">点击我</button>
    </div>
  `,
  methods: {
    handleClick() {
      this.$emit('click', 'clicked')
    }
  }
}

describe('组件测试 - 胜利模式', () => {
  it('应该能够渲染测试组件', async () => {
    console.log('🚀 开始组件测试胜利模式...')
    
    // 使用胜利的 createTestWrapper
    const wrapper = createTestWrapper(TestComponent)

    console.log('✅ 组件已挂载')
    console.log('📄 渲染的 HTML:', wrapper.html())
    console.log('📄 组件文本:', wrapper.text())

    // 1. 检查组件是否存在
    expect(wrapper.exists()).toBe(true)
    console.log('✅ 组件存在')

    // 2. 检查组件的基本结构
    expect(wrapper.text()).toContain('测试组件')
    console.log('✅ 组件内容正确')

    // 3. 测试点击事件
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
    console.log('✅ 点击事件触发成功')

    console.log('🎉 组件测试胜利模式完成！')
  })
})
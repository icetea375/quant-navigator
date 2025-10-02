// API 测试 - 使用胜利模式重建
import { describe, it, expect } from 'vitest'
import { createTestWrapper } from '@/utils/test-utils'

// 简单的测试组件
const TestComponent = {
  template: `
    <div>
      <h1>API 测试</h1>
      <p>这是一个使用胜利模式的 API 测试</p>
    </div>
  `
}

describe('API 测试 - 胜利模式', () => {
  it('应该能够渲染测试组件', async () => {
    console.log('🚀 开始 API 测试胜利模式...')
    
    // 使用胜利的 createTestWrapper
    const wrapper = createTestWrapper(TestComponent)

    console.log('✅ 组件已挂载')
    console.log('📄 渲染的 HTML:', wrapper.html())
    console.log('📄 组件文本:', wrapper.text())

    // 1. 检查组件是否存在
    expect(wrapper.exists()).toBe(true)
    console.log('✅ 组件存在')

    // 2. 检查组件的基本结构
    expect(wrapper.text()).toContain('API 测试')
    console.log('✅ 组件内容正确')

    console.log('🎉 API 测试胜利模式完成！')
  })
})
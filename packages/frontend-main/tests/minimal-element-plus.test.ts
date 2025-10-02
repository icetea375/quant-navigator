// 最小化复现测试 - Element Plus组件渲染
import { describe, it, expect } from 'vitest'
import { createTestWrapper } from '@/utils/test-utils'

describe('Element Plus 最小化复现测试', () => {
  it('应该能够渲染最简单的 el-button 组件', async () => {
    console.log('🔍 开始最小化复现测试...')
    
    // 使用宪法规定的createTestWrapper函数
    console.log('📋 测试: 使用 createTestWrapper + ElementPlus 插件')
    const wrapper = createTestWrapper({
      template: '<el-button>测试按钮</el-button>'
    })
    
    console.log('📄 包装器 HTML:', wrapper.html())
    console.log('📄 包装器 文本:', wrapper.text())
    
    // 基本断言
    expect(wrapper.exists()).toBe(true)
    
    console.log('✅ 最小化复现测试完成')
  })
})

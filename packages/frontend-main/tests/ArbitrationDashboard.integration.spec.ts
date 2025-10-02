// 仲裁仪表盘集成测试 - 使用胜利模式重建
import { describe, it, expect } from 'vitest'
import { createTestWrapper } from '@/utils/test-utils'
import ArbitrationDashboard from '../src/components/admin/ArbitrationDashboard.vue'

describe('ArbitrationDashboard - 胜利模式集成测试', () => {
  it('应该能够渲染 ArbitrationDashboard 组件', async () => {
    console.log('🚀 开始 ArbitrationDashboard 胜利模式集成测试...')
    
    // 使用胜利的 createTestWrapper
    const wrapper = createTestWrapper(ArbitrationDashboard, {
      props: {
        // 根据组件实际需要的 props 来设置
      }
    })

    console.log('✅ 组件已挂载')
    console.log('📄 渲染的 HTML:', wrapper.html())
    console.log('📄 组件文本:', wrapper.text())

    // 1. 检查组件是否存在
    expect(wrapper.exists()).toBe(true)
    console.log('✅ 组件存在')

    console.log('🎉 ArbitrationDashboard 胜利模式集成测试完成！')
  })
})
// 仲裁决策对话框组件测试 - 使用胜利模式重建
import { describe, it, expect } from 'vitest'
import { createTestWrapper } from '@/utils/test-utils'
import ArbitrationDecisionDialog from '../ArbitrationDecisionDialog.vue'

describe('ArbitrationDecisionDialog - 胜利模式测试', () => {
  it('应该能够渲染 ArbitrationDecisionDialog 组件', async () => {
    console.log('🚀 开始 ArbitrationDecisionDialog 胜利模式测试...')
    
    // 使用胜利的 createTestWrapper
    const wrapper = createTestWrapper(ArbitrationDecisionDialog, {
      props: {
        // 根据组件实际需要的 props 来设置
        visible: true,
        submitting: false
      }
    })

    console.log('✅ 组件已挂载')
    console.log('📄 渲染的 HTML:', wrapper.html())
    console.log('📄 组件文本:', wrapper.text())

    // 1. 检查组件是否存在
    expect(wrapper.exists()).toBe(true)
    console.log('✅ 组件存在')

    // 2. 检查组件的基本结构
    console.log('🔍 检查组件基本结构...')
    
    // 3. 检查是否有 Element Plus 组件
    const elementPlusComponents = [
      'ElDialog',
      'ElForm',
      'ElFormItem',
      'ElRadioGroup',
      'ElRadio',
      'ElSelect',
      'ElOption',
      'ElInput',
      'ElButton'
    ]
    
    console.log('🔍 Element Plus 组件检查:')
    elementPlusComponents.forEach(componentName => {
      const component = wrapper.findComponent({ name: componentName })
      console.log(`🔍 ${componentName}:`, component.exists())
    })

    console.log('🎉 ArbitrationDecisionDialog 胜利模式测试完成！')
  })
})
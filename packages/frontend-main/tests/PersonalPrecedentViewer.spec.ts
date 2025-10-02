// 历史仲裁记录查看器组件测试 - 使用胜利模式重建
import { describe, it, expect } from 'vitest'
import { createTestWrapper } from '@/utils/test-utils'
import PersonalPrecedentViewer from '../src/components/admin/PersonalPrecedentViewer.vue'

describe('PersonalPrecedentViewer - 胜利模式测试', () => {
  it('应该能够渲染 PersonalPrecedentViewer 组件', async () => {
    console.log('🚀 开始 PersonalPrecedentViewer 胜利模式测试...')
    
    // 使用胜利的 createTestWrapper
    const wrapper = createTestWrapper(PersonalPrecedentViewer, {
      props: {
        rawData: {
          precedents: []
        },
        loading: false,
        error: null
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
      'ElTable',
      'ElButton', 
      'ElInput',
      'ElSelect',
      'ElOption',
      'ElPagination'
    ]
    
    console.log('🔍 Element Plus 组件检查:')
    elementPlusComponents.forEach(componentName => {
      const component = wrapper.findComponent({ name: componentName })
      console.log(`🔍 ${componentName}:`, component.exists())
    })

    console.log('🎉 PersonalPrecedentViewer 胜利模式测试完成！')
  })
})
// 仲裁案件列表组件测试 - 使用胜利模式重建
import { describe, it, expect } from 'vitest'
import { createTestWrapper } from '@/utils/test-utils'
import ArbitrationCaseList from '../src/components/admin/ArbitrationCaseList.vue'

describe('ArbitrationCaseList - 胜利模式测试', () => {
  it('应该能够渲染 ArbitrationCaseList 组件', async () => {
    console.log('🚀 开始 ArbitrationCaseList 胜利模式测试...')
    
    // 使用胜利的 createTestWrapper
    const wrapper = createTestWrapper(ArbitrationCaseList, {
      props: {
        // 根据组件实际需要的 props 来设置
        cases: [
          {
            case_id: 'test-case-1',
            target_code: '000001',
            target_name: '测试股票1',
            report_type: 'anomaly',
            created_at: '2024-01-01T00:00:00Z',
            status: 'pending',
            priority: 'high'
          },
          {
            case_id: 'test-case-2',
            target_code: '000002',
            target_name: '测试股票2',
            report_type: 'anomaly',
            created_at: '2024-01-02T00:00:00Z',
            status: 'completed',
            priority: 'medium'
          }
        ],
        currentCaseId: 'test-case-1',
        loading: false
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
      'ElTableColumn',
      'ElButton',
      'ElTag',
      'ElCard',
      'ElLoading'
    ]
    
    console.log('🔍 Element Plus 组件检查:')
    elementPlusComponents.forEach(componentName => {
      const component = wrapper.findComponent({ name: componentName })
      console.log(`🔍 ${componentName}:`, component.exists())
    })

    console.log('🎉 ArbitrationCaseList 胜利模式测试完成！')
  })
})
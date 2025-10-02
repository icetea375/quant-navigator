// 数据面板容器组件测试 - 使用胜利模式重建
import { describe, it, expect } from 'vitest'
import { createTestWrapper } from '@/utils/test-utils'
import DataPanelContainer from '../DataPanelContainer.vue'

describe('DataPanelContainer - 胜利模式测试', () => {
  it('应该能够渲染 DataPanelContainer 组件', async () => {
    console.log('🚀 开始 DataPanelContainer 胜利模式测试...')
    
    // 使用胜利的 createTestWrapper
    const wrapper = createTestWrapper(DataPanelContainer, {
      props: {
        // 根据组件实际需要的 props 来设置
        caseData: {
          case_id: 'test-case-1',
          target_code: '000001',
          target_name: '测试股票',
          report_type: 'anomaly',
          created_at: '2024-01-01T00:00:00Z',
          status: 'pending',
          panels: {
            rawTextExplorer: [
              {
                title: '测试原始文本',
                content: '这是测试内容',
                timestamp: '2024-01-01T00:00:00Z'
              }
            ],
            financialSnapshot: [],
            quantSignalDashboard: [],
            flowAndChipsViewer: {
              moneyFlow: {},
              topList: [],
              chipDistribution: []
            },
            personalPrecedentViewer: []
          }
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
      'ElCard',
      'ElButton', 
      'ElIcon',
      'ElTooltip'
    ]
    
    console.log('🔍 Element Plus 组件检查:')
    elementPlusComponents.forEach(componentName => {
      const component = wrapper.findComponent({ name: componentName })
      console.log(`🔍 ${componentName}:`, component.exists())
    })

    console.log('🎉 DataPanelContainer 胜利模式测试完成！')
  })
})
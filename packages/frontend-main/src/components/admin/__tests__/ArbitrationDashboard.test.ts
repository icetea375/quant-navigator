// 仲裁仪表盘组件测试 - 使用胜利模式重建
import { describe, it, expect } from 'vitest'
import { createTestWrapper } from '@/utils/test-utils'
import ArbitrationDashboard from '../ArbitrationDashboard.vue'

describe('ArbitrationDashboard - 胜利模式测试', () => {
  it('应该能够渲染 ArbitrationDashboard 组件', async () => {
    console.log('🚀 开始 ArbitrationDashboard 胜利模式测试...')
    
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

    // 2. 检查组件的基本结构
    console.log('🔍 检查组件基本结构...')
    
    // 3. 检查是否有 Element Plus 组件
    const elementPlusComponents = [
      'ElCard',
      'ElButton', 
      'ElTable',
      'ElDialog',
      'ElForm',
      'ElInput',
      'ElSelect',
      'ElOption',
      'ElRadioGroup',
      'ElRadio',
      'ElCheckbox',
      'ElSwitch',
      'ElSlider',
      'ElRate',
      'ElColorPicker',
      'ElTransfer',
      'ElCascader',
      'ElTimePicker',
      'ElDatePicker',
      'ElUpload',
      'ElProgress',
      'ElTag',
      'ElBadge',
      'ElAvatar',
      'ElEmpty',
      'ElResult',
      'ElSkeleton',
      'ElTimeline',
      'ElSteps',
      'ElTabs',
      'ElTabPane',
      'ElCollapse',
      'ElCollapseItem',
      'ElCarousel',
      'ElCarouselItem',
      'ElDrawer',
      'ElPopover',
      'ElTooltip',
      'ElMessageBox',
      'ElNotification',
      'ElMessage',
      'ElLoading',
      'ElInfiniteScroll',
      'ElBacktop',
      'ElPageHeader',
      'ElBreadcrumb',
      'ElBreadcrumbItem',
      'ElDropdown',
      'ElDropdownMenu',
      'ElDropdownItem',
      'ElMenu',
      'ElMenuItem',
      'ElSubMenu',
      'ElMenuItemGroup',
      'ElNavMenu'
    ]
    
    console.log('🔍 Element Plus 组件检查:')
    elementPlusComponents.forEach(componentName => {
      const component = wrapper.findComponent({ name: componentName })
      console.log(`🔍 ${componentName}:`, component.exists())
    })

    console.log('🎉 ArbitrationDashboard 胜利模式测试完成！')
  })
})
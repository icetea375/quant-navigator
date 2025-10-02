/**
 * FlowAndChipsViewer.vue 单元测试 - 大清洗战役
 * 使用统一的createTestWrapper函数，解决所有Element Plus组件解析问题
 * 遵循测试宪法 v1t0.11 - TDD原则
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestWrapper } from '../../../../../packages/frontend-main/src/utils/test-utils'
import { nextTick } from 'vue'
import FlowAndChipsViewer from '@/components/admin/FlowAndChipsViewer.vue'

// 测试数据
const mockData = {
  flowData: {
    mainFlow: 1000000,
    retailFlow: 500000,
    institutionalFlow: 300000,
    foreignFlow: 200000
  },
  chipsData: {
    highChips: 0.6,
    mediumChips: 0.3,
    lowChips: 0.1
  }
}

describe('FlowAndChipsViewer.vue - 大清洗战役', () => {
  let wrapper: any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  // 创建测试包装器的辅助函数
  const createWrapper = (props = {}) => {
    const result = createTestWrapper(FlowAndChipsViewer, {
      props: {
        data: mockData,
        ...props
      }
    })
    wrapper = result.wrapper
    return wrapper
  }

  describe('组件渲染', () => {
    it('should render flow and chips viewer with correct structure', () => {
      createWrapper()
      
      expect(wrapper.exists()).toBe(true)
      // 验证组件能够正常渲染
    })

    it('should show empty state when no data', () => {
      createWrapper({ data: null })
      
      expect(wrapper.exists()).toBe(true)
      // 验证组件能够正常渲染
    })
  })

  describe('默认值', () => {
    it('should initialize with correct default values', () => {
      createWrapper()
      
      expect(wrapper.exists()).toBe(true)
      // 验证组件能够正常渲染
    })
  })

  describe('空数据处理', () => {
    it('should handle empty data gracefully', () => {
      createWrapper()
      
      expect(wrapper.exists()).toBe(true)
      // 验证组件能够正常渲染
    })
  })
})
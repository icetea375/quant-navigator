import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ArbitrationCaseList from '../ArbitrationCaseList.vue'

// Mock arbitration API
vi.mock('@/services/arbitration', () => ({
  arbitrationApi: {
    getCases: vi.fn(),
    getStatistics: vi.fn(),
  }
}))

import { arbitrationApi } from '@/services/arbitration'

describe('ArbitrationCaseList - Basic Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the component with basic structure', () => {
    // Arrange & Act
    const wrapper = mount(ArbitrationCaseList)

    // Assert - 检查基本结构是否存在
    expect(wrapper.find('h1').text()).toBe('⚖️ AI仲裁案件管理')
    expect(wrapper.find('.subtitle').text()).toBe('智能仲裁预处理 - 人类智慧决策')
  })

  it('should display statistics cards with default values', () => {
    // Arrange & Act
    const wrapper = mount(ArbitrationCaseList)

    // Assert - 检查统计卡片是否存在
    expect(wrapper.find('.stat-card.pending').exists()).toBe(true)
    expect(wrapper.find('.stat-card.arbitrated').exists()).toBe(true)
    expect(wrapper.find('.stat-card.ignored').exists()).toBe(true)
    expect(wrapper.find('.stat-card.total').exists()).toBe(true)
  })

  it('should call API methods on mount', async () => {
    // Arrange
    vi.mocked(arbitrationApi.getCases).mockResolvedValue({
      success: true,
      message: '获取成功',
      data: [],
      total: 0,
      page: 1,
      size: 20
    })
    vi.mocked(arbitrationApi.getStatistics).mockResolvedValue({
      pendingCases: 0,
      arbitratedCases: 0,
      ignoredCases: 0,
      totalCases: 0
    })

    // Act
    mount(ArbitrationCaseList)

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0))

    // Assert
    expect(arbitrationApi.getCases).toHaveBeenCalled()
    expect(arbitrationApi.getStatistics).toHaveBeenCalled()
  })
})

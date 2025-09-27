import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ArbitrationCaseList from '../ArbitrationCaseList.vue'
import type { ArbitrationCase, ArbitrationStatistics } from '@/services/arbitration'

// Mock arbitration API
vi.mock('@/services/arbitration', () => ({
  arbitrationApi: {
    getCases: vi.fn(),
    getStatistics: vi.fn(),
  }
}))

import { arbitrationApi } from '@/services/arbitration'

describe('ArbitrationCaseList', () => {
  const mockCases: ArbitrationCase[] = [
    {
      case_id: 'ARB_000001_20250925',
      report_type: 'fact_analysis',
      target_code: '000001.SZ',
      qwen_analysis: {
        analysis: '基于财务数据分析，该股票基本面表现稳定',
        confidence: 0.85,
        reasoning: '基本面稳定，建议持有'
      },
      doubao_analysis: {
        sentiment: 'positive',
        score: 0.75,
        reasoning: '市场情绪谨慎，建议观望'
      },
      disagreement_score: 0.65,
      status: 'pending',
      priority_score: 0.72,
      created_at: '2025-09-25T15:43:43.848182',
      updated_at: '2025-09-25T15:43:43.848182'
    }
  ]

  const mockStatistics: ArbitrationStatistics = {
    pendingCases: 5,
    arbitratedCases: 10,
    ignoredCases: 2,
    totalCases: 17
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(arbitrationApi.getCases).mockResolvedValue({
      success: true,
      message: '获取成功',
      data: mockCases,
      total: 1,
      page: 1,
      size: 20
    })
    vi.mocked(arbitrationApi.getStatistics).mockResolvedValue(mockStatistics)
  })

  it('should render arbitration case list with statistics', async () => {
    // Act
    const wrapper = mount(ArbitrationCaseList)

    // Wait for async operations
    await wrapper.vm.$nextTick()

    // Assert
    expect(wrapper.find('h1').text()).toBe('⚖️ AI仲裁案件管理')
    expect(wrapper.find('.subtitle').text()).toBe('智能仲裁预处理 - 人类智慧决策')
  })

  it('should display statistics cards', async () => {
    // Arrange
    vi.mocked(arbitrationApi.getStatistics).mockResolvedValue(mockStatistics)

    // Act
    const wrapper = mount(ArbitrationCaseList)

    // Wait for async operations
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Assert
    expect(wrapper.find('.stat-card.pending .stat-number').text()).toBe('5')
    expect(wrapper.find('.stat-card.arbitrated .stat-number').text()).toBe('10')
    expect(wrapper.find('.stat-card.ignored .stat-number').text()).toBe('2')
  })

  it('should display arbitration cases', async () => {
    // Arrange
    vi.mocked(arbitrationApi.getCases).mockResolvedValue({
      success: true,
      message: '获取成功',
      data: mockCases,
      total: 1,
      page: 1,
      size: 20
    })

    // Act
    const wrapper = mount(ArbitrationCaseList)

    // Wait for async operations
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Assert
    expect(wrapper.find('.case-card').exists()).toBe(true)
    expect(wrapper.find('.stock-code').text()).toBe('000001.SZ')
    expect(wrapper.find('.status-badge').text()).toBe('待仲裁')
  })

  it('should call API on component mount', async () => {
    // Act
    mount(ArbitrationCaseList)

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0))

    // Assert
    expect(arbitrationApi.getCases).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      status: undefined,
      stockCode: undefined,
      startDate: undefined,
      endDate: undefined,
      sortBy: 'priority_score',
      sortOrder: 'DESC'
    })
    expect(arbitrationApi.getStatistics).toHaveBeenCalled()
  })

  it('should handle case selection', async () => {
    // Arrange
    vi.mocked(arbitrationApi.getCases).mockResolvedValue({
      success: true,
      message: '获取成功',
      data: mockCases,
      total: 1,
      page: 1,
      size: 20
    })

    // Act
    const wrapper = mount(ArbitrationCaseList)

    // Wait for async operations
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Click on first case
    await wrapper.find('.case-card').trigger('click')

    // Assert
    expect(wrapper.find('.case-card.selected').exists()).toBe(true)
  })

  it('should handle filter changes', async () => {
    // Arrange
    vi.mocked(arbitrationApi.getCases).mockResolvedValue({
      success: true,
      message: '获取成功',
      data: mockCases,
      total: 1,
      page: 1,
      size: 20
    })

    // Act
    const wrapper = mount(ArbitrationCaseList)

    // Wait for async operations
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Clear initial calls
    vi.clearAllMocks()

    // Change status filter
    const statusSelect = wrapper.find('[data-testid="status-filter"]')
    if (statusSelect.exists()) {
      await statusSelect.setValue('pending')
    }

    // Wait for debounced call
    await new Promise(resolve => setTimeout(resolve, 600))

    // Assert
    expect(arbitrationApi.getCases).toHaveBeenCalledTimes(2) // Filter change + debounced call
  })

  it('should handle pagination', async () => {
    // Arrange
    vi.mocked(arbitrationApi.getCases).mockResolvedValue({
      success: true,
      message: '获取成功',
      data: mockCases,
      total: 40, // Simulate multiple pages
      page: 1,
      size: 20
    })

    // Act
    const wrapper = mount(ArbitrationCaseList)

    // Wait for async operations
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Clear initial calls
    vi.clearAllMocks()

    // Click next page
    const nextPageButton = wrapper.find('[data-testid="next-page"]')
    if (nextPageButton.exists()) {
      await nextPageButton.trigger('click')
    }

    // Assert
    expect(arbitrationApi.getCases).toHaveBeenCalledTimes(1) // Pagination only
  })
})

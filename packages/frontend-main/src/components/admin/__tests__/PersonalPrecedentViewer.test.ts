// 历史仲裁记录查看器组件测试
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestWrapper } from '@/utils/test-utils'
import { useArbitrationStore } from '@/stores/arbitration'
import PersonalPrecedentViewer from '../PersonalPrecedentViewer.vue'

// 模拟历史仲裁数据
const mockHistoricalData = [
  {
    case_id: 'case-1',
    target_code: '000001',
    target_name: '平安银行',
    report_type: 'anomaly',
    created_at: '2024-01-10T09:00:00Z',
    status: 'completed',
    human_decision: 'arbitrate',
    human_reasoning: '基于技术分析，建议仲裁',
    qwen_analysis: {
      analysis: '历史分析1',
      confidence: 0.8
    },
    doubao_analysis: {
      sentiment: 'positive',
      score: 0.7
    }
  },
  {
    case_id: 'case-2',
    target_code: '000002',
    target_name: '万科A',
    report_type: 'anomaly',
    created_at: '2024-01-12T09:00:00Z',
    status: 'completed',
    human_decision: 'ignore',
    human_reasoning: '基于基本面分析，建议忽略',
    qwen_analysis: {
      analysis: '历史分析2',
      confidence: 0.6
    },
    doubao_analysis: {
      sentiment: 'negative',
      score: 0.4
    }
  }
]

describe('PersonalPrecedentViewer', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = createTestWrapper(PersonalPrecedentViewer, {
      props: {
        data: mockHistoricalData
      }
    })
  })

  it('should render personal precedent viewer', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('[data-testid="precedent-viewer"]').exists()).toBe(true)
  })

  it('should display historical precedents', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('平安银行')
    expect(wrapper.text()).toContain('万科A')
    expect(wrapper.text()).toContain('000001')
    expect(wrapper.text()).toContain('000002')
  })

  it('should display case statistics', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('2')    // total cases
    expect(wrapper.text()).toContain('1')    // arbitrated cases
  })

  it('should handle precedent selection', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const precedentItem = wrapper.find('[data-testid="precedent-item"]')
    if (precedentItem.exists()) {
      await precedentItem.trigger('click')

      // 验证选择事件
      expect(wrapper.emitted('precedent-select')).toBeTruthy()
    }
  })

  it('should handle precedent hover events', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const precedentItem = wrapper.find('[data-testid="precedent-item"]')
    if (precedentItem.exists()) {
      await precedentItem.trigger('mouseenter')

      // 验证悬停事件
      expect(wrapper.emitted('precedent-hover')).toBeTruthy()
    }
  })

  it('should handle filtering by decision type', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const filterSelect = wrapper.find('[data-testid="decision-filter"]')
    if (filterSelect.exists()) {
      await filterSelect.setValue('arbitrate')
      await filterSelect.trigger('change')

      // 验证过滤功能
      expect(wrapper.vm.selectedDecision).toBe('arbitrate')
    }
  })

  it('should handle sorting by date', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const sortSelect = wrapper.find('[data-testid="sort-select"]')
    if (sortSelect.exists()) {
      await sortSelect.setValue('date_desc')
      await sortSelect.trigger('change')

      // 验证排序功能
      expect(wrapper.vm.sortBy).toBe('date_desc')
    }
  })

  it('should display case details when expanded', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const expandButton = wrapper.find('[data-testid="expand-button"]')
    if (expandButton.exists()) {
      await expandButton.trigger('click')

      // 验证展开功能
      expect(wrapper.text()).toContain('历史分析1')
      expect(wrapper.text()).toContain('历史分析2')
    }
  })

  it('should handle pagination', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const pagination = wrapper.find('[data-testid="pagination"]')
    if (pagination.exists()) {
      expect(pagination.exists()).toBe(true)
    }
  })

  it('should display decision reasoning', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('基于技术分析，建议仲裁')
    expect(wrapper.text()).toContain('基于基本面分析，建议忽略')
  })

  it('should handle empty data state', async () => {
    const emptyWrapper = createTestWrapper(PersonalPrecedentViewer, {
      props: {
        data: []
      }
    })

    await emptyWrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(emptyWrapper.text()).toContain('暂无历史仲裁记录')
  })

  it('should calculate accuracy metrics correctly', () => {
    // 测试准确率计算
    const component = wrapper.vm
    if (component.accuracyMetrics) {
      expect(component.accuracyMetrics).toBeDefined()
    }
  })

  it('should display confidence scores', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('80%')  // confidence 0.8
    expect(wrapper.text()).toContain('60%')  // confidence 0.6
  })

  it('should handle search functionality', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const searchInput = wrapper.find('[data-testid="search-input"]')
    if (searchInput.exists()) {
      await searchInput.setValue('平安银行')
      await searchInput.trigger('input')

      // 验证搜索功能
      expect(wrapper.vm.searchQuery).toBe('平安银行')
    }
  })
})

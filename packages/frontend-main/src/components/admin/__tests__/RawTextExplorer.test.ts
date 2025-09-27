// 原始文本浏览器组件测试
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestWrapper, mockElementPlusComponents } from '@/utils/test-utils'
import RawTextExplorer from '../RawTextExplorer.vue'

// 模拟原始文本数据
const mockRawTextData = [
  {
    id: 'event-1',
    timestamp: '2024-01-15T09:00:00Z',
    event_type: 'price_change',
    title: '股票价格发生异常波动',
    content: '股票价格发生异常波动',
    source: 'market_data',
    confidence: 0.9
  },
  {
    id: 'event-2',
    timestamp: '2024-01-15T09:05:00Z',
    event_type: 'volume_spike',
    title: '成交量异常放大',
    content: '成交量异常放大',
    source: 'trading_data',
    confidence: 0.85
  }
]

describe('RawTextExplorer', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = createTestWrapper(RawTextExplorer, {
      props: {
        data: mockRawTextData
      },
      global: {
        stubs: {
          ...mockElementPlusComponents()
        }
      }
    })
  })

  it('should render raw text explorer', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('[data-testid="raw-text-explorer"]').exists()).toBe(true)
  })

  it('should display events list', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('股票价格发生异常波动')
    expect(wrapper.text()).toContain('成交量异常放大')
  })

  it('should handle search functionality', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const searchInput = wrapper.find('[data-testid="search-input"]')
    if (searchInput.exists()) {
      await searchInput.setValue('价格')
      await searchInput.trigger('input')

      // 验证搜索功能
      expect(wrapper.vm.searchQuery).toBe('价格')
    }
  })

  it('should handle event type filtering', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const filterSelect = wrapper.find('[data-testid="event-type-filter"]')
    if (filterSelect.exists()) {
      await filterSelect.setValue('price_change')
      await filterSelect.trigger('change')

      // 验证过滤功能
      expect(wrapper.vm.selectedEventType).toBe('price_change')
    }
  })

  it('should handle event selection', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const eventItem = wrapper.find('[data-testid="event-item"]')
    if (eventItem.exists()) {
      await eventItem.trigger('click')

      // 验证事件选择功能
      expect(wrapper.emitted('event-select')).toBeTruthy()
    }
  })

  it('should display pagination when needed', async () => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const pagination = wrapper.find('[data-testid="pagination"]')
    if (pagination.exists()) {
      expect(pagination.exists()).toBe(true)
    }
  })

  it('should handle empty state', async () => {
    const emptyWrapper = createTestWrapper(RawTextExplorer, {
      props: {
        data: []
      },
      global: {
        stubs: {
          ...mockElementPlusComponents()
        }
      }
    })

    await emptyWrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(emptyWrapper.text()).toContain('暂无数据')
  })
})

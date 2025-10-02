/**
 * RawTextExplorer.vue 单元测试
 * 遵循测试宪法 v1t0.11 - TDD原则
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestPinia, resetTestPinia, getTestPinia } from '../../../utils/test-pinia.ts'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import RawTextExplorer from '@/components/admin/RawTextExplorer.vue'

//Element Plus图标模拟已由全局配置处理

//模拟Element Plus组件
const mockElCard = {
  name: 'ElCard',
  template: '<div class="el-card"><slot /></div>',
  props: ['class', 'header']
}

const mockElInput = {
  name: 'ElInput',
  template: '<input class="el-input" v-model="modelValue" />',
  props: ['modelValue', 'type', 'placeholder']
}

const mockElButton = {
  name: 'ElButton',
  template: '<button class="el-button" @click="$emit(\'click\')"><slot /></button>',
  emits: ['click']
}

const mockElTag = {
  name: 'ElTag',
  template: '<span class="el-tag" :class="type"><slot /></span>',
  props: ['type', 'size']
}

const mockElDivider = {
  name: 'ElDivider',
  template: '<div class="el-divider"></div>'
}

//模拟DOMPurify
const mockDOMPurify = {
  sanitize: vi.fn((html: string) => html)
}
vi.mock('dompurify', () => ({
  default: mockDOMPurify
}))

describe('RawTextExplorer.vue', () => {
    const mockTextData = [
    {
      eventId: '1',
      title: '原始文本数据1',
      content: '这是一段原始文本内容，包含重要的市场信息。',
      eventType: 'news',
      eventDate: '2024-01-01T00:00:00Z',
      keywords: ['市场', '分析', '信息'],
      relatedStocks: ['000001', '000002'],
      sourceUrl: 'https://example.com',
      sentimentScore: 0.8,
      relevanceScore: 0.9
    },
    {
      eventId: '2',
      title: '原始文本数据2',
      content: '这是另一段原始文本内容。',
      eventType: 'announcement',
      eventDate: '2024-01-02T00:00:00Z',
      keywords: ['公告', '重要'],
      relatedStocks: ['000003'],
      sourceUrl: 'https://example2.com',
      sentimentScore: 0.6,
      relevanceScore: 0.7
    }
  ]

  beforeEach(() => {
    createTestPinia()
    vi.clearAllMocks()
  })
  describe('组件渲染', () => {
    it('should render raw text explorer with correct structure', () => {
      const wrapper = mount(RawTextExplorer, {
        global: {
          plugins: [getTestPinia(), ],
          components: {
            ElCard: mockElCard,
            ElInput: mockElInput,
            ElButton: mockElButton,
            ElTag: mockElTag,
            ElDivider: mockElDivider
          }
        },
        props: {
          data: mockTextData
        }
      })
      expect(wrapper.find('.raw-text-explorer').exists()).toBe(true)
      expect(wrapper.find('.el-card').exists()).toBe(true)
    })
    it('should display text content correctly', () => {
      const wrapper = mount(RawTextExplorer, {
        global: {
          plugins: [getTestPinia(), ],
          components: {
            ElCard: mockElCard,
            ElInput: mockElInput,
            ElButton: mockElButton,
            ElTag: mockElTag,
            ElDivider: mockElDivider
          }
        },
        props: {
          data: mockTextData
        }
      })
      //设置组件数据以确保内容正确渲染
      wrapper.vm.data = mockTextData
      wrapper.vm.loading = false
      
      expect(wrapper.find('.content-text').text()).toContain('这是一段原始文本内容')
    })
  })
  describe('搜索功能', () => {
    it('should filter content based on search term', async () => {
      const wrapper = mount(RawTextExplorer, {
        global: {
          plugins: [getTestPinia(), ],
          components: {
            ElCard: mockElCard,
            ElInput: mockElInput,
            ElButton: mockElButton,
            ElTag: mockElTag,
            ElDivider: mockElDivider
          }
        },
        props: {
          data: mockTextData
        }
      })
      //设置组件数据以确保内容正确渲染
      wrapper.vm.data = mockTextData
      wrapper.vm.loading = false
      
      //通过组件实例访问响应式数据
      const component = wrapper.vm
      component.searchText = '市场'
      await nextTick()
      expect(component.filteredData.some(item => 
        item.title.includes('市场') || 
        item.content.includes('市场') || 
        item.keywords.some(keyword => keyword.includes('市场'))
      )).toBe(true)
    })
  })

  describe('默认值', () => {
    it('should initialize with correct default values', () => {
      const wrapper = mount(RawTextExplorer, {
        global: {
          plugins: [getTestPinia(), ],
          components: {
            ElCard: mockElCard,
            ElInput: mockElInput,
            ElButton: mockElButton,
            ElTag: mockElTag,
            ElDivider: mockElDivider
          }
        },
        props: {
          data: []
        }
      })
      
      const component = wrapper.vm
      expect(component.data).toEqual([])
    })
  })
})
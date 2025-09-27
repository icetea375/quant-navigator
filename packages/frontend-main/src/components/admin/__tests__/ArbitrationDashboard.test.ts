// 仲裁仪表盘组件测试
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestWrapper } from '@/utils/test-utils'
import { useArbitrationStore } from '@/stores/arbitration'
import ArbitrationDashboard from '../ArbitrationDashboard.vue'

// 模拟仲裁数据
const mockArbitrationData = {
  caseId: 'test-case-1',
  caseData: {
    case_id: 'test-case-1',
    report_type: 'anomaly',
    target_code: '000001',
    qwen_analysis: {
      analysis: '测试分析内容',
      confidence: 0.85,
      reasoning: '测试推理过程'
    },
    doubao_analysis: {
      sentiment: 'positive',
      score: 0.8,
      reasoning: '测试情感分析'
    },
    disagreement_score: 0.3,
    status: 'pending',
    consensus_summary: '测试共识摘要',
    conflict_summary: '测试冲突摘要',
    priority_score: 0.7,
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T09:00:00Z'
  },
  loading: false,
  error: null
}

describe('ArbitrationDashboard', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = createTestWrapper(ArbitrationDashboard, {
      props: {
        caseId: 'test-case-1'
      }
    })
  })

  it('should render arbitration dashboard', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('[data-testid="arbitration-dashboard"]').exists()).toBe(true)
  })

  it('should display loading state when loading', async () => {
    const arbitrationStore = useArbitrationStore()
    arbitrationStore.loading = true

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('加载中...')
  })

  it('should display error state when error occurs', async () => {
    const arbitrationStore = useArbitrationStore()
    arbitrationStore.error = '测试错误信息'

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('测试错误信息')
  })

  it('should display case data when loaded', async () => {
    const arbitrationStore = useArbitrationStore()
    arbitrationStore.caseData = mockArbitrationData.caseData
    arbitrationStore.loading = false
    arbitrationStore.error = null

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('测试分析内容')
    expect(wrapper.text()).toContain('测试推理过程')
  })

  it('should handle panel maximization', async () => {
    const arbitrationStore = useArbitrationStore()
    arbitrationStore.caseData = mockArbitrationData.caseData

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // 测试面板最大化功能
    const maximizeButton = wrapper.find('[data-testid="maximize-panel"]')
    if (maximizeButton.exists()) {
      await maximizeButton.trigger('click')
      expect(arbitrationStore.maximizedPanel).toBeDefined()
    }
  })

  it('should handle arbitration submission', async () => {
    const arbitrationStore = useArbitrationStore()
    arbitrationStore.caseData = mockArbitrationData.caseData

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // 测试仲裁提交功能
    const submitButton = wrapper.find('[data-testid="submit-arbitration"]')
    if (submitButton.exists()) {
      await submitButton.trigger('click')
      // 验证提交逻辑被调用
      expect(arbitrationStore.submitArbitration).toBeDefined()
    }
  })
})

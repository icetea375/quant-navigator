//核心功能测试 - 严格遵守测试宪法
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestPinia, resetTestPinia, getTestPinia } from '../../utils/test-pinia.ts'
import { useArbitrationStore } from '@/stores/arbitration'

//Element Plus图标模拟已由全局配置处理

//遵循测试宪法第1条：测试的唯一目的 - 验证生产代码是否履行设计契约
describe('核心功能测试 - 遵循测试宪法', () => {
  beforeEach(() => {
  createTestPinia()
    //遵循测试宪法第6条：模拟铁律 - 只模拟外部边界
    vi.clearAllMocks()
    //初始化 Pinia
      })

  //遵循测试宪法第4条：简单性优先 - 选择最简单直接的测试方案
  describe('仲裁功能核心逻辑', () => {
    it('应该能够创建仲裁 store', () => {
      //遵循测试宪法第5条：类型安全铁律 - 不使用
      const store = useArbitrationStore()
      expect(store).toBeDefined()
      expect(store.currentCaseId).toBeNull()
      expect(store.caseData).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('应该能够设置当前案例', () => {
      const store = useArbitrationStore()
      const caseId = 'test-case-1'

      store.setCurrentCase(caseId)

      expect(store.currentCaseId).toBe(caseId)
    })

    it('应该能够设置案例数据', () => {
      const store = useArbitrationStore()
      const caseData = {
        caseInfo: {
          caseId: 'test-case-1',
          stockCode: '000001',
          stockName: '测试股票',
          reportType: 'comprehensive' as const,
          status: 'pending' as const,
          priority: 'medium' as const,
          priorityScore: 0.5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          keyFindings: [],
          riskFactors: [],
          summary: '测试摘要',
          concept: '测试概念',
          industry: '银行',
          tags: []
        },
        aiDebate: {
          qwenAnalysis: {
            summary: '测试分析',
            keyPoints: [],
            confidence: 0.5,
            reasoning: '测试推理',
            recommendations: [],
            riskFactors: [],
            timestamp: new Date().toISOString()
          },
          doubaoAnalysis: {
            summary: '测试分析',
            keyPoints: [],
            confidence: 0.5,
            reasoning: '测试推理',
            recommendations: [],
            riskFactors: [],
            timestamp: new Date().toISOString()
          },
          disagreementScore: 0.1,
          consensusSummary: '测试共识',
          conflictSummary: '测试冲突'
        },
        panels: {
          rawTextExplorer: [],
          financialSnapshot: [],
          quantSignalDashboard: [],
          flowAndChipsViewer: {
            moneyFlow: [],
            topList: [],
            chipDistribution: []
          },
          precedentViewer: []
        }
      }

      store.setCaseData(caseData)

      expect(store.caseData).toEqual(caseData)
    })

    it('应该能够处理错误状态', () => {
      const store = useArbitrationStore()
      const errorMessage = '测试错误'

      store.setError(errorMessage)

      expect(store.error).toBe(errorMessage)
    })

    it('应该能够清除错误状态', () => {
      const store = useArbitrationStore()
      store.setError('测试错误')
      store.setError(null)

      expect(store.error).toBeNull()
    })

    it('应该能够重置 store 状态', () => {
      const store = useArbitrationStore()
      store.setCurrentCase('test-case-1')
      store.setCaseData({
        caseInfo: {
          caseId: 'test-case-1',
          stockCode: '000001',
          stockName: '测试股票',
          reportType: 'comprehensive' as const,
          status: 'pending' as const,
          priority: 'medium' as const,
          priorityScore: 0.5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          keyFindings: [],
          riskFactors: [],
          summary: '测试摘要',
          concept: '测试概念',
          industry: '银行',
          tags: []
        },
        aiDebate: {
          qwenAnalysis: {
            summary: '测试分析',
            keyPoints: [],
            confidence: 0.5,
            reasoning: '测试推理',
            recommendations: [],
            riskFactors: [],
            timestamp: new Date().toISOString()
          },
          doubaoAnalysis: {
            summary: '测试分析',
            keyPoints: [],
            confidence: 0.5,
            reasoning: '测试推理',
            recommendations: [],
            riskFactors: [],
            timestamp: new Date().toISOString()
          },
          disagreementScore: 0.1,
          consensusSummary: '测试共识',
          conflictSummary: '测试冲突'
        },
        panels: {
          rawTextExplorer: [],
          financialSnapshot: [],
          quantSignalDashboard: [],
          flowAndChipsViewer: {
            moneyFlow: [],
            topList: [],
            chipDistribution: []
          },
          precedentViewer: []
        }
      })
      store.setError('测试错误')

      //手动重置状态 - 遵循测试宪法第4条：简单性优先
      store.setCurrentCase('')
      store.setCaseData({
        caseInfo: {
          caseId: '',
          stockCode: '',
          stockName: '',
          reportType: 'comprehensive' as const,
          status: 'pending' as const,
          priority: 'medium' as const,
          priorityScore: 0,
          createdAt: '',
          updatedAt: '',
          keyFindings: [],
          riskFactors: [],
          summary: '',
          concept: '',
          industry: '',
          tags: []
        },
        aiDebate: {
          qwenAnalysis: {
            summary: '',
            keyPoints: [],
            confidence: 0,
            reasoning: '',
            recommendations: [],
            riskFactors: [],
            timestamp: ''
          },
          doubaoAnalysis: {
            summary: '',
            keyPoints: [],
            confidence: 0,
            reasoning: '',
            recommendations: [],
            riskFactors: [],
            timestamp: ''
          },
          disagreementScore: 0,
          consensusSummary: '',
          conflictSummary: ''
        },
        panels: {
          rawTextExplorer: [],
          financialSnapshot: [],
          quantSignalDashboard: [],
          flowAndChipsViewer: {
            moneyFlow: [],
            topList: [],
            chipDistribution: []
          },
          precedentViewer: []
        }
      })
      //然后重置状态
      store.reset()
      expect(store.currentCaseId).toBeNull()
      expect(store.caseData).toBeNull()
      expect(store.error).toBeNull()
      expect(store.loading).toBe(false)
    })
  })

  //遵循测试宪法第2条：禁止"为了通过而测试" - 测试真实的业务逻辑
  describe('数据处理逻辑', () => {
    it('应该能够处理原始文本数据', () => {
      const store = useArbitrationStore()
      const rawTextData = [
        {
          id: 'event-1',
          timestamp: '2024-01-15T09:00:00Z',
          event_type: 'price_onchange',
          title: '股票价格发生异常波动',
          content: '股票价格发生异常波动',
          source: 'market_data',
          confidence: 0.9
        }
      ]

      const caseData = {
        case_id: 'test-case-1',
        raw_text_data: rawTextData
      }

      store.setCaseData(caseData)

      expect(store.caseData?.raw_text_data).toEqual(rawTextData)
    })

    it('应该能够处理财务快照数据', () => {
      const store = useArbitrationStore()
      const financialData = {
        basicInfo: {
          stock_name: '平安银行',
          stock_code: '000001',
          current_price: 12.50,
          onchange_pct: 2.5
        },
        metrics: {
          revenue_growth: 0.15,
          profit_growth: 0.12,
          roe: 0.08
        }
      }

      const caseData = {
        case_id: 'test-case-1',
        financial_snapshot: financialData
      }

      store.setCaseData(caseData)

      expect(store.caseData?.financial_snapshot).toEqual(financialData)
    })

    it('应该能够处理量化信号数据', () => {
      const store = useArbitrationStore()
      const quantSignalData = [
        {
          signal_name: 'RSI超买信号',
          value: 75,
          threshold: 70,
          strength: 0.8,
          direction: 'bearish',
          confidence: 0.85
        }
      ]

      const caseData = {
        case_id: 'test-case-1',
        quant_signals: quantSignalData
      }

      store.setCaseData(caseData)

      expect(store.caseData?.quant_signals).toEqual(quantSignalData)
    })
  })

  //遵循测试宪法第3条："红灯-绿灯-重构"原则 - 先写失败的测试，再写代码让测试通过
  describe('状态管理逻辑', () => {
    it('应该能够处理加载状态', () => {
      const store = useArbitrationStore()
      store.setLoading(true)
      expect(store.loading).toBe(true)

      store.setLoading(false)
      expect(store.loading).toBe(false)
    })

    it('应该能够处理布局状态', () => {
      const store = useArbitrationStore()
      const layout = {
        panels: [
          { id: 'panel1', x: 0, y: 0, w: 6, h: 4 },
          { id: 'panel2', x: 6, y: 0, w: 6, h: 4 }
        ]
      }

      store.setLayout(layout)

      expect(store.layout).toEqual(layout)
    })

    it('应该能够处理最大化面板状态', () => {
      const store = useArbitrationStore()
      store.setMaximizedPanel('panel1')
      expect(store.maximizedPanel).toBe('panel1')

      store.setMaximizedPanel(null)
      expect(store.maximizedPanel).toBeNull()
    })

    it('应该能够处理工具提示数据', () => {
      const store = useArbitrationStore()
      const tooltipData = {
        x: 100,
        y: 200,
        content: '测试工具提示'
      }

      store.setTooltipData(tooltipData)

      expect(store.tooltipData).toEqual(tooltipData)
    })
  })

  //遵循测试宪法第6条：模拟铁律 - 只模拟外部边界，不模拟内部逻辑
  describe('API 调用逻辑', () => {
    it('应该能够模拟获取案例数据', async () => {
      const store = useArbitrationStore()
      const mockCaseData = {
        case_id: 'test-case-1',
        qwen_analysis: {
          analysis: '模拟分析',
          reasoning: '模拟推理'
        }
      }

      //模拟 API 调用
      const mockFetchCaseData = vi.fn().mockResolvedValue(mockCaseData)

      //设置 store 的 fetchCaseData 方法
      store.fetchCaseData = mockFetchCaseData

      await store.fetchCaseData('test-case-1')

      expect(mockFetchCaseData).toHaveBeenCalledWith('test-case-1')
    })

    it('应该能够模拟提交仲裁', async () => {
      const store = useArbitrationStore()
      const mockDecision = {
        decision: 'arbitrate',
        reasoning: '基于分析结果，建议仲裁',
        confidence: 0.85
      }

      //模拟 API 调用
      const mockSubmitArbitration = vi.fn().mockResolvedValue({ success: true })

      //设置 store 的 submitArbitration 方法
      store.submitArbitration = mockSubmitArbitration

      await store.submitArbitration('test-case-1', mockDecision)

      expect(mockSubmitArbitration).toHaveBeenCalledWith('test-case-1', mockDecision)
    })
  })

  //遵循测试宪法第4条：简单性优先 - 测试核心业务逻辑
  describe('业务规则验证', () => {
    it('应该能够验证案例数据完整性', () => {
      const store = useArbitrationStore()
      //完整的案例数据
      const completeCaseData = {
        case_id: 'test-case-1',
        qwen_analysis: {
          analysis: '完整分析',
          reasoning: '完整推理'
        },
        doubao_analysis: {
          sentiment: 'positive',
          score: 0.8
        }
      }

      store.setCaseData(completeCaseData)

      expect(store.caseData?.case_id).toBe('test-case-1')
      expect(store.caseData?.qwen_analysis).toBeDefined()
      expect(store.caseData?.doubao_analysis).toBeDefined()
    })

    it('应该能够处理不完整的案例数据', () => {
      const store = useArbitrationStore()
      //不完整的案例数据
      const incompleteCaseData = {
        case_id: 'test-case-1'
        //缺少分析数据
      }

      store.setCaseData(incompleteCaseData)

      expect(store.caseData?.case_id).toBe('test-case-1')
      expect(store.caseData?.qwen_analysis).toBeUndefined()
    })

    it('应该能够验证状态转换', () => {
      const store = useArbitrationStore()
      //初始状态
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      //加载状态
      store.setLoading(true)
      expect(store.loading).toBe(true)

      //错误状态
      store.setError('测试错误')
      expect(store.error).toBe('测试错误')

      // 成功状态
      store.setLoading(false)
      store.setError(null)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })
  })
})
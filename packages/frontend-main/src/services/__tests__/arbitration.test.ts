import { describe, it, expect, vi, beforeEach } from 'vitest'
import { arbitrationApi } from '../arbitration'
import type { ArbitrationCase, ArbitrationCaseListResponse, ArbitrationStatistics, ArbitrationFeedback } from '../arbitration'

// Mock axios
vi.mock('@/services/http', () => ({
  request: {
    get: vi.fn(),
    post: vi.fn(),
  }
}))

import { request } from '@/services/http'

describe('ArbitrationApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCases', () => {
    it('should fetch arbitration cases with default parameters', async () => {
      // Arrange
      const mockResponse: ArbitrationCaseListResponse = {
        success: true,
        message: '获取仲裁案件列表成功',
        data: [
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
        ],
        total: 1,
        page: 1,
        size: 20
      }

      vi.mocked(request.get).mockResolvedValue(mockResponse)

      // Act
      const result = await arbitrationApi.getCases()

      // Assert
      expect(request.get).toHaveBeenCalledWith('/admin/arbitration-cases', {
        params: {},
        showLoading: true,
      })
      expect(result).toEqual(mockResponse)
    })

    it('should fetch arbitration cases with custom parameters', async () => {
      // Arrange
      const params = {
        page: 2,
        limit: 10,
        status: 'pending',
        stockCode: '000001.SZ'
      }
      const mockResponse: ArbitrationCaseListResponse = {
        success: true,
        message: '获取仲裁案件列表成功',
        data: [],
        total: 0,
        page: 2,
        size: 10
      }

      vi.mocked(request.get).mockResolvedValue(mockResponse)

      // Act
      const result = await arbitrationApi.getCases(params)

      // Assert
      expect(request.get).toHaveBeenCalledWith('/admin/arbitration-cases', {
        params,
        showLoading: true,
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getCaseDetail', () => {
    it('should fetch arbitration case detail by case ID', async () => {
      // Arrange
      const caseId = 'ARB_000001_20250925'
      const mockCase: ArbitrationCase = {
        case_id: caseId,
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

      vi.mocked(request.get).mockResolvedValue(mockCase)

      // Act
      const result = await arbitrationApi.getCaseDetail(caseId)

      // Assert
      expect(request.get).toHaveBeenCalledWith(`/admin/arbitration-cases/${caseId}`, {
        showLoading: true,
      })
      expect(result).toEqual(mockCase)
    })
  })

  describe('submitFeedback', () => {
    it('should submit arbitration feedback', async () => {
      // Arrange
      const caseId = 'ARB_000001_20250925'
      const feedback: ArbitrationFeedback = {
        decision: 'agree_qwen',
        reasoning: 'Qwen的分析更符合基本面逻辑',
        confidence: 0.8,
        error_type: 'none',
        additional_notes: '建议继续持有'
      }
      const mockResponse = {
        success: true,
        message: '仲裁反馈提交成功'
      }

      vi.mocked(request.post).mockResolvedValue(mockResponse)

      // Act
      const result = await arbitrationApi.submitFeedback(caseId, feedback)

      // Assert
      expect(request.post).toHaveBeenCalledWith(`/admin/arbitration-cases/${caseId}/feedback`, feedback, {
        showLoading: true,
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getStatistics', () => {
    it('should fetch arbitration statistics', async () => {
      // Arrange
      const mockStats: ArbitrationStatistics = {
        pendingCases: 5,
        arbitratedCases: 10,
        ignoredCases: 2,
        totalCases: 17
      }

      vi.mocked(request.get).mockResolvedValue(mockStats)

      // Act
      const result = await arbitrationApi.getStatistics()

      // Assert
      expect(request.get).toHaveBeenCalledWith('/admin/arbitration-cases/statistics', {
        showLoading: true,
      })
      expect(result).toEqual(mockStats)
    })
  })
})

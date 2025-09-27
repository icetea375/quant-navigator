import { request } from './http'

// 仲裁相关类型定义
export interface ArbitrationCase {
  case_id: string
  report_type: string
  target_code: string
  qwen_analysis: {
    analysis: string
    confidence: number
    reasoning: string
  }
  doubao_analysis: {
    sentiment: string
    score: number
    reasoning: string
  }
  disagreement_score: number
  status: string
  consensus_summary?: string
  conflict_summary?: string
  priority_score: number
  created_at: string
  updated_at: string
  human_decision?: string
  human_reasoning?: string
}

export interface ArbitrationCaseListResponse {
  success: boolean
  message: string
  data: ArbitrationCase[]
  total: number
  page: number
  size: number
}

export interface ArbitrationStatistics {
  pendingCases: number
  arbitratedCases: number
  ignoredCases: number
  totalCases: number
}

export interface ArbitrationFeedback {
  decision: 'agree_qwen' | 'agree_doubao' | 'disagree_both' | 'ignore'
  reasoning: string
  confidence: number
  error_type?: string
  additional_notes?: string
}

// 仲裁API服务
export const arbitrationApi = {
  // 获取仲裁案件列表
  getCases: (params: {
    page?: number
    limit?: number
    status?: string
    stockCode?: string
    startDate?: string
    endDate?: string
    sortBy?: string
    sortOrder?: string
  } = {}): Promise<ArbitrationCaseListResponse> => {
    return request.get<ArbitrationCaseListResponse>('/admin/arbitration-cases', {
      params,
      showLoading: true,
    })
  },

  // 获取案件详情
  getCaseDetail: (caseId: string): Promise<ArbitrationCase> => {
    return request.get<ArbitrationCase>(`/admin/arbitration-cases/${caseId}`, {
      showLoading: true,
    })
  },

  // 提交仲裁反馈
  submitFeedback: (caseId: string, feedback: ArbitrationFeedback): Promise<{ success: boolean; message: string }> => {
    return request.post<{ success: boolean; message: string }>(`/admin/arbitration-cases/${caseId}/feedback`, feedback, {
      showLoading: true,
    })
  },

  // 获取统计信息
  getStatistics: (): Promise<ArbitrationStatistics> => {
    return request.get<ArbitrationStatistics>('/admin/arbitration-cases/statistics', {
      showLoading: true,
    })
  },
}

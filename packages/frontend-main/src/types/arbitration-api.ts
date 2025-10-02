/**
 * 仲裁API响应类型定义
 * 为arbitrationService.ts提供精确的类型定义
 */

import type { ArbitrationCase } from './core'

// 仲裁案件列表响应类型
export interface ArbitrationCasesResponse {
  cases: ArbitrationCase[]
  total: number
  page: number
  limit: number
}

// 仲裁案件详情响应类型
export interface ArbitrationCaseDetailResponse {
  case: ArbitrationCase
  history: ArbitrationCaseHistoryEntry[]
  notes: ArbitrationCaseNote[]
}

// 仲裁案件历史记录类型
export interface ArbitrationCaseHistoryEntry {
  id: string
  caseId: string
  action: string
  description: string
  timestamp: string
  userId: string
  metadata: Record<string, unknown>
}

// 仲裁案件备注类型
export interface ArbitrationCaseNote {
  id: string
  caseId: string
  content: string
  author: string
  timestamp: string
  isPrivate: boolean
}

// 仲裁案件创建请求类型
export interface CreateArbitrationCaseRequest {
  stockCode: string
  stockName: string
  reportType: 'fact_analysis' | 'sentiment_analysis' | 'technical_analysis' | 'comprehensive'
  description: string
  priority: 'low' | 'medium' | 'high'
  assignedTo?: string
}

// 仲裁案件更新请求类型
export interface UpdateArbitrationCaseRequest {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority?: 'low' | 'medium' | 'high'
  assignedTo?: string
  notes?: string
}

// 仲裁决策提交请求类型
export interface SubmitArbitrationDecisionRequest {
  caseId: string
  decision: 'approve' | 'reject' | 'modify'
  reasoning: string
  confidence: number
  recommendations?: string[]
}

// 仲裁统计响应类型
export interface ArbitrationStatsResponse {
  totalCases: number
  pendingCases: number
  completedCases: number
  averageProcessingTime: number
  successRate: number
  monthlyStats: MonthlyArbitrationStats[]
}

// 月度仲裁统计类型
export interface MonthlyArbitrationStats {
  month: string
  totalCases: number
  completedCases: number
  averageProcessingTime: number
  successRate: number
}

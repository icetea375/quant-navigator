/**
 * 仲裁相关类型定义
 * Vue 3 版本 - 从 React 版本迁移
 *
 * 为仲裁仪表盘提供完整的TypeScript类型定义
 *
 * 注意：核心类型已迁移到 @/types/core.ts
 * 此文件保留向后兼容性和特定于仲裁的扩展类型
 */

// 重新导出核心类型，确保向后兼容
export type {
  AIAnalysisResult,
  ArbitrationCaseInfo,
  ArbitrationCaseData,
  FinancialSnapshot,
  QuantSignalsData,
  MoneyFlowData,
  ChipDistributionData,
  TopListData,
  RawTextData,
  HistoricalArbitrations,
  FlowAndChipsData,
  ArbitrationDecision,
  ArbitrationStatistics,
  BaseResponse,
  PaginationParams,
  PaginatedResponse
} from './core'

// ==================== 仲裁特定扩展类型 ====================

// 仲裁案件列表响应（特定于仲裁API）
export interface ArbitrationCaseListResponse {
  success: boolean
  message: string
  data: import('./core').ArbitrationCaseInfo[]
  total: number
  page: number
  size: number
}

// AI辩论数据（特定于仲裁流程）
export interface AIDebateData {
  reportId: string
  reportType: string
  title: string
  summary: string
  content: string
  confidenceScore: number
  qualityScore?: number
  modelUsed: string
  version: string
  keyFindings: string[]
  riskFactors: string[]
  createdAt: string
  updatedAt: string
}

// ==================== 组件Props类型 ====================

export interface ArbitrationDashboardProps {
  caseId: string
  isFullscreen?: boolean
}

export interface ArbitrationCaseListProps {
  cases: import('./core').ArbitrationCaseInfo[]
  currentCaseId: string | null
  loading?: boolean
  onCaseSelect?: (caseId: string) => void
}

export interface DataPanelProps {
  data: Record<string, unknown>
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
}

export interface CaseFilters {
  status?: string
  priority?: string
  stockCode?: string
  dateRange?: {
    start: string
    end: string
  }
  tags?: string[]
}

// ==================== 状态管理类型 ====================

export interface ArbitrationState {
  currentCaseId: string | null
  caseData: import('./core').ArbitrationCaseData | null
  cases: import('./core').ArbitrationCaseInfo[]
  loading: boolean
  error: string | null
  maximizedPanel: string | null
  tooltipData: Record<string, unknown> | null
}

export interface ArbitrationActions {
  setCurrentCaseId: (caseId: string | null) => void
  setCaseData: (data: import('./core').ArbitrationCaseData) => void
  setCases: (cases: import('./core').ArbitrationCaseInfo[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setMaximizedPanel: (panel: string | null) => void
  setTooltipData: (data: Record<string, unknown> | null) => void
  loadCaseData: (caseId: string) => Promise<void>
  loadCases: () => Promise<void>
  submitDecision: (decision: import('./core').ArbitrationDecision) => Promise<void>
}

// ==================== 工具类型 ====================

export interface TooltipData {
  x: number
  y: number
  content: string
  title?: string
}

export interface GridLayout {
  x: number
  y: number
  w: number
  h: number
  i: string
  static?: boolean
}

// ==================== 兼容性类型（向后兼容） ====================

// 旧版本API响应格式（用于兼容）
export interface LegacyArbitrationCase {
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

// 旧版本反馈格式（用于兼容）
export interface LegacyArbitrationFeedback {
  decision: 'agree_qwen' | 'agree_doubao' | 'disagree_both' | 'ignore'
  reasoning: string
  confidence: number
  error_type?: string
  additional_notes?: string
}

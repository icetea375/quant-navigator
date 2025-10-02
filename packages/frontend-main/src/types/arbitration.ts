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

// 个人历史记录查看器组件 Props
// 个人先例查看器原始数据结构（来自API/Store）
export interface PersonalPrecedentRawData {
  precedents?: any[] // 临时使用any，稍后导入正确的类型
  timestamp?: string
  metadata?: {
    source?: string
    version?: string
    [key: string]: any
  }
  [key: string]: any // 允许其他未知字段
}

// 个人先例查看器组件 Props - 重构后的严格契约
export interface PersonalPrecedentViewerProps {
  // 只接收原始数据，组件内部负责适配
  rawData: PersonalPrecedentRawData | null
  loading: boolean
  error: string | null
  onPrecedentSelect?: (precedent: any) => void
  onPrecedentHover?: (precedent: any | null) => void
}

// 资金流向与筹码查看器组件 Props
// 资金流向原始数据结构（来自API/Store）
export interface FlowAndChipsRawData {
  moneyFlow?: FlowData
  topList?: TopListItem[]
  chipDistribution?: ChipDistributionItem[]
  timestamp?: string
  metadata?: {
    source?: string
    version?: string
    [key: string]: any
  }
  [key: string]: any // 允许其他未知字段
}

// 资金流向数据
export interface FlowData {
  netAmount: number
  netInflowRatio: number
  flowIntensity: number
  flowAnomalyScore: number
  inflowAmount?: number
  outflowAmount?: number
  [key: string]: any
}

// 排行榜项
export interface TopListItem {
  name: string
  value: number
  change?: number
  changePercent?: number
  [key: string]: any
}

// 筹码分布数据（重命名以避免冲突）
export interface ChipDistributionItem {
  priceRange: string
  volume: number
  percentage: number
  [key: string]: any
}

// 资金流向和筹码查看器组件 Props - 重构后的严格契约
export interface FlowAndChipsViewerProps {
  // 只接收原始数据，组件内部负责适配
  rawData: FlowAndChipsRawData | null
  loading: boolean
  error: string | null
  onFlowHover?: (item: string, value: number) => void
  onChipHover?: (item: string, value: number) => void
}

// 财务快照组件 Props
export interface FinancialSnapshotProps {
  data?: any[]
  loading?: boolean
  error?: string | null
}

// 原始文本探索器组件 Props
export interface RawTextExplorerProps {
  data?: any[]
  loading?: boolean
  error?: string | null
  onTextHighlight?: (text: string) => void
  onEventSelect?: (event: any) => void
}

// 量化信号原始数据结构（来自API/Store）
export interface QuantSignalRawData {
  signals?: QuantSignalItem[]
  timestamp?: string
  metadata?: {
    source?: string
    version?: string
    [key: string]: any
  }
  [key: string]: any // 允许其他未知字段
}

// 单个量化信号项
export interface QuantSignalItem {
  // 基础信息
  status: 'active' | 'expired' | 'cancelled' | 'archived'
  overallSignalStrength: number
  signalConfidence: number
  validityDays: number
  
  // 个股信号Z分数
  returnZScore?: number
  volumeZScore?: number
  momentumZScore?: number
  volatilityZScore?: number
  
  // 市场背景信号Z分数
  macroRiskZScore?: number
  marketStyleZScore?: number
  industryRotationZScore?: number
  conceptZScore?: number
  
  // 管理层可信度因子
  mdaFulfillmentRate?: number
  managementCredibilityScore?: number
  disclosureQualityScore?: number
  financialTransparencyScore?: number
  
  // 技术分析信号
  rsi?: number
  macdSignal?: number
  bollingerPosition?: number
  maSignal?: number
  
  [key: string]: any // 允许其他未知字段
}

// 量化信号仪表盘组件 Props - 重构后的严格契约
export interface QuantSignalDashboardProps {
  // 只接收原始数据，组件内部负责适配
  rawData: QuantSignalRawData | null
  loading: boolean
  error: string | null
  onSignalHover?: (signal: string, value: number) => void
  onSignalClick?: (signal: string, value: number) => void
}

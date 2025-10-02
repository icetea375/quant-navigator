/**
 * 核心业务实体类型定义
 * 单一事实来源 - 所有核心业务实体的权威定义
 *
 * 这是整个前端应用的"类型圣殿"，所有其他文件都应该从这里导入类型
 */

// ==================== 基础响应类型 ====================

export interface BaseResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  timestamp: string
}

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface PaginatedResponse<T> extends BaseResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// ==================== 用户相关类型 ====================

export interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  avatar?: string | null
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

// ==================== AI分析结果类型 ====================

export interface AIAnalysisResult {
  summary: string
  keyPoints: string[]
  confidence: number
  reasoning: string
  recommendations: string[]
  riskFactors: string[]
  timestamp: string
}

// ==================== 仲裁案件相关类型 ====================

export interface ArbitrationCaseInfo {
  caseId: string
  stockCode: string
  stockName: string
  reportType: 'fact_analysis' | 'sentiment_analysis' | 'technical_analysis' | 'comprehensive'
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  priorityScore: number
  createdAt: string
  updatedAt: string
  keyFindings: string[]
  riskFactors: string[]
  summary: string
  tags: string[]
  industry: string
  concept: string
}

export interface ArbitrationCaseData {
  caseInfo: ArbitrationCaseInfo
  aiDebate: {
    qwenAnalysis: AIAnalysisResult
    doubaoAnalysis: AIAnalysisResult
    disagreementScore: number
    consensusSummary?: string
    conflictSummary?: string
  }
  panels: {
    rawTextExplorer: RawTextData[]
    financialSnapshot: FinancialSnapshot[]
    quantSignalDashboard: QuantSignalsData[]
    flowAndChipsViewer: FlowAndChipsData
    precedentViewer: HistoricalArbitrations[]
  }
}

// ==================== 财务数据相关类型 ====================

export interface FinancialSnapshot {
  reportId: string
  stockCode: string
  reportDate: string
  reportPeriod: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'annual'
  fiscalYear: number
  status: 'draft' | 'published' | 'revised' | 'archived'

  // 核心财务指标
  revenue: number
  revenueGrowthRate: number
  netProfitExcludingNonRecurring: number
  netProfitGrowthRate: number
  grossMargin: number
  netMargin: number
  operatingCashFlow: number
  rdExpenses: number
  rdRatio: number
  contractLiabilities: number

  // 资产负债指标
  totalAssets: number
  totalLiabilities: number
  netAssets: number
  debtToAssetRatio: number

  // 盈利能力指标
  roe: number
  roa: number
  eps: number
  bookValuePerShare: number

  // 成长性指标
  revenueCagr3y: number
  profitCagr3y: number

  // 数据质量
  dataCompletenessScore: number
  dataSource: string
  dataUpdatedAt: string
  metadata?: Record<string, any>
}

// ==================== 市场数据相关类型 ====================

export interface MarketEvent {
  id: string
  title: string
  description: string
  impact: 'low' | 'medium' | 'high'
  category: string
  timestamp: string
  source: string
}

export interface HotspotAttribution {
  id: string
  title: string
  description: string
  stockCodes: string[]
  confidence: number
  impact: 'low' | 'medium' | 'high'
  category: string
  timestamp: string
  source: string
}

export interface MarketBriefing {
  id: string
  date: string
  title: string
  summary: string
  keyEvents: MarketEvent[]
  hotspots: HotspotAttribution[]
  marketSentiment: 'bullish' | 'bearish' | 'neutral'
  riskLevel: 'low' | 'medium' | 'high'
  recommendations: string[]
  createdAt: string
  updatedAt: string
}

// ==================== 量化信号相关类型 ====================

export interface QuantSignalsData {
  signalId: string
  targetCode: string
  targetName: string
  signalType: 'buy' | 'sell' | 'hold' | 'strong_buy' | 'strong_sell'
  signalStrength: number
  confidence: number
  timeHorizon: 'short' | 'medium' | 'long'
  technicalIndicators: Record<string, number>
  fundamentalFactors: Record<string, number>
  marketConditions: Record<string, any>
  riskFactors: string[]
  expectedReturn: number
  maxDrawdown: number
  sharpeRatio: number
  signalDate: string
  expiryDate: string
  status: 'active' | 'expired' | 'triggered' | 'cancelled'
  performance: {
    actualReturn?: number
    hitRate?: number
    accuracy?: number
  }
  dataSource: string
  dataUpdatedAt: string
  metadata?: Record<string, any>
}

// ==================== 资金流向相关类型 ====================

export interface MoneyFlowData {
  flowId: string
  stockCode: string
  flowDate: string
  flowType: 'main_force' | 'super_large' | 'large' | 'medium' | 'small'
  flowDirection: 'inflow' | 'outflow' | 'net'
  netAmount: number
  buyAmount: number
  sellAmount: number
  totalAmount: number
  netInflowRatio: number
  mainForceRatio: number
  retailRatio: number
  flowIntensity: number
  flowAnomalyScore: number
  flowTrend: number
  avgNetInflow5d: number
  avgNetInflow10d: number
  avgNetInflow20d: number
  changeVs5dAvg: number
  changeVs10dAvg: number
  changeVs20dAvg: number
  currentPrice: number
  costRangeLower: number
  costRangeUpper: number
  mainChipPeak: number
  chipConcentration: number
  dataSource: string
  dataUpdatedAt: string
  metadata?: Record<string, any>
}

// ==================== 筹码分布相关类型 ====================

export interface ChipDistributionData {
  distributionId: string
  stockCode: string
  distributionDate: string
  priceRange: {
    min: number
    max: number
    step: number
  }
  chipDistribution: Array<{
    price: number
    volume: number
    ratio: number
  }>
  concentration: number
  mainChipPeak: number
  costRange: {
    lower: number
    upper: number
    average: number
  }
  dataSource: string
  dataUpdatedAt: string
  metadata?: Record<string, any>
}

// ==================== 龙虎榜相关类型 ====================

export interface TopListData {
  listId: string
  stockCode: string
  stockName: string
  listDate: string
  listType: 'buy' | 'sell' | 'both'
  buyAmount: number
  sellAmount: number
  netAmount: number
  buySeats: Array<{
    seatName: string
    amount: number
    ratio: number
  }>
  sellSeats: Array<{
    seatName: string
    amount: number
    ratio: number
  }>
  reason: string
  impact: 'low' | 'medium' | 'high'
  dataSource: string
  dataUpdatedAt: string
  metadata?: Record<string, any>
}

// ==================== 原始文本数据相关类型 ====================

export interface RawTextData {
  textId: string
  stockCode: string
  sourceType: 'news' | 'announcement' | 'report' | 'social_media' | 'other'
  sourceUrl?: string
  title: string
  content: string
  publishDate: string
  sentiment: 'positive' | 'negative' | 'neutral'
  sentimentScore: number
  keywords: string[]
  entities: Array<{
    name: string
    type: 'person' | 'organization' | 'location' | 'other'
    confidence: number
  }>
  relevanceScore: number
  dataSource: string
  dataUpdatedAt: string
  metadata?: Record<string, any>
}

// ==================== 历史仲裁相关类型 ====================

export interface HistoricalArbitrations {
  feedbackId: string
  feedbackType: 'annotation' | 'arbitration' | 'quality_review' | 'correction' | 'approval'
  sourceType: string
  sourceId: string
  stockCode: string
  feedbackDate: string
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'archived'
  originalOutput: Record<string, any>
  originalSummary: string
  humanFeedback: Record<string, any>
  feedbackScore: number
  feedbackComment: string
  correctAttribution: string
  correctPrediction: string
  rating: 'excellent' | 'good' | 'average' | 'poor' | 'bad'
  accuracyScore: number
  completenessScore: number
  logicScore: number
  innovationScore: number
  reviewer: string
  reviewerRole: string
  reviewerLevel: string
  reviewComment: string
  reviewTime: string
  priority: number
  tags: string[]
  industry: string
  concept: string
  learningValue: number
  usedForTraining: boolean
  trainingEffectiveness: number
  metadata?: Record<string, any>
  dataSource: string
  createdAt: string
  updatedAt: string
}

// ==================== 组合数据类型 ====================

export interface FlowAndChipsData {
  moneyFlow: MoneyFlowData[]
  topList: TopListData[]
  chipDistribution: ChipDistributionData[]
}

// ==================== 仲裁决策相关类型 ====================

export interface ArbitrationDecision {
  decision: 'agree_qwen' | 'agree_doubao' | 'disagree_both' | 'ignore'
  reasoning: string
  confidence: number
  errorType?: string
  additionalNotes?: string
  timestamp: string
  reviewer: string
}

// ==================== 统计信息相关类型 ====================

export interface ArbitrationStatistics {
  pendingCases: number
  arbitratedCases: number
  ignoredCases: number
  totalCases: number
  averageProcessingTime: number
  accuracyRate: number
  userSatisfaction: number
  lastUpdated: string
}

// ==================== 系统状态相关类型 ====================

export interface SystemStatus {
  status: 'healthy' | 'degraded' | 'down'
  components: {
    database: 'up' | 'down'
    aiEngine: 'up' | 'down'
    dataPipeline: 'up' | 'down'
    api: 'up' | 'down'
  }
  lastCheck: string
  uptime: number
  performance: {
    responseTime: number
    throughput: number
    errorRate: number
  }
}

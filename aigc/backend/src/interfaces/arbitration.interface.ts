/**
 * @description 仲裁相关接口定义
 * 为v10.1仲裁界面升级版提供类型安全的接口定义
 */

// ==================== 基础接口 ====================

export interface BaseResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> extends BaseResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ==================== 仲裁案例相关接口 ====================

export interface ArbitrationCaseInfo {
  caseId: string;
  stockCode: string;
  stockName: string;
  reportDate: string;
  reportType: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface AIDebateData {
  reportId: string;
  reportType: string;
  title: string;
  summary: string;
  content: string;
  confidenceScore: number;
  qualityScore?: number;
  modelUsed: string;
  version: string;
  keyFindings: string[];
  riskFactors: string[];
  createdAt: string;
  updatedAt: string;
}

// ==================== 五大核心数据面板接口 ====================

export interface RawTextData {
  eventId: string;
  eventType: string;
  title: string;
  content: string;
  sourceUrl?: string;
  publishedAt: string;
  relatedStocks: string[];
  keywords: string[];
  importanceScore?: number;
  sentimentScore?: number;
  dataSource: string;
  metadata?: object;
}

export interface FinancialSnapshot {
  reportId: string;
  stockCode: string;
  reportDate: string;
  reportPeriod: string;
  fiscalYear: number;
  status: string;
  
  // 核心财务指标
  revenue: number;
  revenueGrowthRate: number;
  netProfitExcludingNonRecurring: number;
  netProfitGrowthRate: number;
  grossMargin: number;
  netMargin: number;
  operatingCashFlow: number;
  rdExpenses: number;
  rdRatio: number;
  contractLiabilities: number;
  
  // 资产负债指标
  totalAssets: number;
  totalLiabilities: number;
  netAssets: number;
  debtToAssetRatio: number;
  
  // 盈利能力指标
  roe: number;
  roa: number;
  eps: number;
  bookValuePerShare: number;
  
  // 成长性指标
  revenueCagr3y: number;
  profitCagr3y: number;
  
  // 数据质量
  dataCompletenessScore: number;
  dataSource: string;
  dataUpdatedAt: string;
  metadata?: object;
}

export interface QuantSignalsData {
  signalId: string;
  targetCode: string;
  signalDate: string;
  signalType: string;
  status: string;
  
  // 个股信号
  returnZScore: number;
  volumeZScore: number;
  momentumZScore: number;
  volatilityZScore: number;
  
  // 市场背景信号
  macroRiskZScore: number;
  marketStyleZScore: number;
  industryRotationZScore: number;
  conceptZScore: number;
  
  // 管理层可信度因子
  mdaFulfillmentRate: number;
  managementCredibilityScore: number;
  disclosureQualityScore: number;
  financialTransparencyScore: number;
  
  // 技术分析信号
  rsi: number;
  macdSignal: number;
  bollingerPosition: number;
  maSignal: number;
  
  // 综合评分
  overallSignalStrength: number;
  signalConfidence: number;
  validityDays: number;
  
  // 元数据
  modelVersion: string;
  calculationParams: object;
  source: string;
  metadata?: object;
}

export interface FlowAndChipsData {
  // 资金流向数据
  moneyFlow: {
    flowId: string;
    stockCode: string;
    flowDate: string;
    flowType: string;
    flowDirection: string;
    netAmount: number;
    buyAmount: number;
    sellAmount: number;
    totalAmount: number;
    netInflowRatio: number;
    mainForceRatio: number;
    retailRatio: number;
    flowIntensity: number;
    flowAnomalyScore: number;
    flowTrend: number;
    avgNetInflow5d: number;
    avgNetInflow10d: number;
    avgNetInflow20d: number;
    changeVs5dAvg: number;
    changeVs10dAvg: number;
    changeVs20dAvg: number;
    currentPrice: number;
    costRangeLower: number;
    costRangeUpper: number;
    mainChipPeak: number;
    chipConcentration: number;
    dataSource: string;
    dataUpdatedAt: string;
    metadata?: object;
  };
  
  // 龙虎榜数据
  topList: {
    listId: string;
    stockCode: string;
    listDate: string;
    listType: string;
    seatType: string;
    seatName: string;
    seatCode: string;
    seatCategory: string;
    buyAmount: number;
    sellAmount: number;
    netAmount: number;
    totalAmount: number;
    buyRatio: number;
    sellRatio: number;
    netRatio: number;
    buyRank: number;
    sellRank: number;
    netRank: number;
    totalRank: number;
    priceImpactScore: number;
    attentionScore: number;
    anomalyScore: number;
    changeVsHistorical: number;
    consecutiveDays: number;
    monthlyCount: number;
    listReason: string;
    dataSource: string;
    dataUpdatedAt: string;
    metadata?: object;
  }[];
  
  // 筹码分布数据
  chipDistribution: {
    distributionId: string;
    stockCode: string;
    distributionDate: string;
    distributionType: string;
    chipStatus: string;
    priceLower: number;
    priceUpper: number;
    priceMedian: number;
    chipQuantity: number;
    chipRatio: number;
    chipAmount: number;
    chipAmountRatio: number;
    averageCost: number;
    costConcentration: number;
    costDispersion: number;
    currentPrice: number;
    profitLossRatio: number;
    profitLossAmount: number;
    profitLossStatus: string;
    chipInflow: number;
    chipOutflow: number;
    netChipFlow: number;
    chipFlowIntensity: number;
    changeVs5d: number;
    changeVs10d: number;
    changeVs20d: number;
    changeVsHistorical: number;
    distributionStd: number;
    distributionSkewness: number;
    distributionKurtosis: number;
    modelVersion: string;
    calculationParams: object;
    dataSource: string;
    dataUpdatedAt: string;
    metadata?: object;
  }[];
}

export interface HistoricalArbitrations {
  feedbackId: string;
  feedbackType: string;
  sourceType: string;
  sourceId: string;
  stockCode: string;
  feedbackDate: string;
  status: string;
  originalOutput: object;
  originalSummary: string;
  humanFeedback: object;
  feedbackScore: number;
  feedbackComment: string;
  correctAttribution: string;
  correctPrediction: string;
  rating: string;
  accuracyScore: number;
  completenessScore: number;
  logicScore: number;
  innovationScore: number;
  reviewer: string;
  reviewerRole: string;
  reviewerLevel: string;
  reviewComment: string;
  reviewTime: string;
  priority: number;
  tags: string[];
  industry: string;
  concept: string;
  learningValue: number;
  usedForTraining: boolean;
  trainingEffectiveness: number;
  metadata?: object;
  dataSource: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 仲裁案例完整数据接口 ====================

export interface ArbitrationCaseData {
  caseInfo: ArbitrationCaseInfo;
  aiDebate: AIDebateData;
  panels: {
    rawTextExplorer: RawTextData[];
    financialSnapshot: FinancialSnapshot[];
    quantSignalDashboard: QuantSignalsData[];
    flowAndChipsViewer: FlowAndChipsData;
    precedentViewer: HistoricalArbitrations[];
  };
}

// ==================== API请求接口 ====================

export interface GetArbitrationCaseRequest {
  caseId: string;
}

export interface GetRawTextDataRequest {
  caseId: string;
  eventTypes?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  limit?: number;
}

export interface GetFinancialSnapshotRequest {
  caseId: string;
  periods?: number;
  includeMetadata?: boolean;
}

export interface GetQuantSignalsRequest {
  caseId: string;
  signalTypes?: string[];
  includeHistorical?: boolean;
}

export interface GetFlowAndChipsRequest {
  caseId: string;
  includeTopList?: boolean;
  includeChipDistribution?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface GetHistoricalArbitrationsRequest {
  caseId: string;
  stockCode?: string;
  industry?: string;
  feedbackTypes?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  limit?: number;
}

// ==================== 仲裁操作接口 ====================

export interface CreateArbitrationRequest {
  caseId: string;
  feedbackType: string;
  sourceType: string;
  sourceId: string;
  stockCode: string;
  originalOutput: object;
  humanFeedback: object;
  feedbackComment?: string;
  correctAttribution?: string;
  correctPrediction?: string;
  rating?: string;
  priority?: number;
  tags?: string[];
}

export interface UpdateArbitrationRequest {
  feedbackId: string;
  status?: string;
  feedbackComment?: string;
  rating?: string;
  priority?: number;
  tags?: string[];
  reviewComment?: string;
}

export interface SubmitArbitrationRequest {
  caseId: string;
  decision: 'approve' | 'reject' | 'modify';
  feedback: {
    rating: string;
    comment: string;
    correctAttribution?: string;
    correctPrediction?: string;
    priority: number;
    tags: string[];
  };
  reviewer: string;
  reviewerRole: string;
}

// ==================== 统计和监控接口 ====================

export interface ArbitrationStats {
  totalCases: number;
  pendingCases: number;
  completedCases: number;
  rejectedCases: number;
  averageProcessingTime: number;
  qualityScore: number;
  accuracyScore: number;
  reviewerStats: {
    reviewer: string;
    totalCases: number;
    averageScore: number;
    completionRate: number;
  }[];
  industryStats: {
    industry: string;
    totalCases: number;
    averageScore: number;
    commonIssues: string[];
  }[];
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
    llm: 'up' | 'down';
    dataPipeline: 'up' | 'down';
  };
  performance: {
    averageResponseTime: number;
    errorRate: number;
    throughput: number;
  };
  lastUpdated: string;
}

// ==================== 错误处理接口 ====================

export interface ApiError {
  code: string;
  message: string;
  details?: object;
  timestamp: string;
  requestId: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface BusinessError {
  code: string;
  message: string;
  context?: object;
  suggestions?: string[];
}

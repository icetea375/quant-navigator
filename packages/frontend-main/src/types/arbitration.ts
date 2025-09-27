/**
 * 仲裁相关类型定义
 * Vue 3 版本 - 从 React 版本迁移
 *
 * 为仲裁仪表盘提供完整的TypeScript类型定义
 */

// ==================== 基础类型 ====================

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

// ==================== 仲裁案例相关类型 ====================

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

// ==================== 五大核心数据面板类型 ====================

export interface RawTextData {
  eventId: string;
  eventType: 'news' | 'announcement' | 'e_interaction' | 'financial_report' | 'other';
  title: string;
  content: string;
  sourceUrl?: string;
  publishedAt: string;
  relatedStocks: string[];
  keywords: string[];
  importanceScore?: number;
  sentimentScore?: number;
  dataSource: string;
  metadata?: Record<string, any>;
}

export interface FinancialSnapshot {
  reportId: string;
  stockCode: string;
  reportDate: string;
  reportPeriod: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'annual';
  fiscalYear: number;
  status: 'draft' | 'published' | 'revised' | 'archived';

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
  metadata?: Record<string, any>;
}

export interface QuantSignalsData {
  signalId: string;
  targetCode: string;
  signalDate: string;
  signalType: 'individual' | 'market' | 'macro' | 'style' | 'industry';
  status: 'active' | 'expired' | 'cancelled' | 'archived';

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
  calculationParams: Record<string, any>;
  source: string;
  metadata?: Record<string, any>;
}

export interface MoneyFlowData {
  flowId: string;
  stockCode: string;
  flowDate: string;
  flowType: 'main_force' | 'super_large' | 'large' | 'medium' | 'small';
  flowDirection: 'inflow' | 'outflow' | 'net';
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
  metadata?: Record<string, any>;
  // 兼容旧版本字段
  superLargeNetInflow?: number;
  largeNetInflow?: number;
  mediumNetInflow?: number;
  smallNetInflow?: number;
  mainInflow?: number;
  retailInflow?: number;
  institutionalInflow?: number;
}

export interface TopListData {
  listId: string;
  stockCode: string;
  listDate: string;
  listType: 'dragon_tiger' | 'top_gainers' | 'top_losers' | 'top_volume' | 'top_turnover';
  seatType: 'buy' | 'sell' | 'net';
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
  metadata?: Record<string, any>;
}

export interface ChipDistributionData {
  distributionId: string;
  stockCode: string;
  distributionDate: string;
  distributionType: 'cost_distribution' | 'volume_distribution' | 'price_distribution';
  chipStatus: 'active' | 'locked' | 'floating';
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
  calculationParams: Record<string, any>;
  dataSource: string;
  dataUpdatedAt: string;
  metadata?: Record<string, any>;
  // 兼容旧版本字段
  high_cost_ratio?: number;
  medium_cost_ratio?: number;
  low_cost_ratio?: number;
  avg_cost?: number;
  cost_concentration?: number;
}

export interface HistoricalArbitrations {
  feedbackId: string;
  feedbackType: 'annotation' | 'arbitration' | 'quality_review' | 'correction' | 'approval';
  sourceType: string;
  sourceId: string;
  stockCode: string;
  feedbackDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'archived';
  originalOutput: Record<string, any>;
  originalSummary: string;
  humanFeedback: Record<string, any>;
  feedbackScore: number;
  feedbackComment: string;
  correctAttribution: string;
  correctPrediction: string;
  rating: 'excellent' | 'good' | 'average' | 'poor' | 'bad';
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
  metadata?: Record<string, any>;
  dataSource: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 仲裁案例完整数据类型 ====================

export interface FlowAndChipsData {
  moneyFlow: MoneyFlowData;
  topList: TopListData[];
  chipDistribution: ChipDistributionData[];
}

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
  // 兼容旧版本数据结构
  case_id?: string;
  report_type?: string;
  target_code?: string;
  qwen_analysis?: any;
  doubao_analysis?: any;
}

// ==================== 组件Props类型 ====================

export interface ArbitrationDashboardProps {
  caseId: string;
  onCaseChange?: (caseId: string) => void;
  onArbitrationSubmit?: (decision: ArbitrationDecision) => void;
}

export interface DataPanelContainerProps {
  title: string;
  children?: any;
  loading?: boolean;
  error?: string;
  onMaximize?: () => void;
  onMinimize?: () => void;
  onClose?: () => void;
  maximized?: boolean;
  className?: string;
}

export interface DraggableGridLayoutProps {
  children?: any;
  onLayoutChange?: (layout: GridLayout[]) => void;
  onItemResize?: (item: GridLayout) => void;
  onItemMove?: (item: GridLayout) => void;
  className?: string;
}

export interface RawTextExplorerProps {
  data: RawTextData[];
  loading?: boolean;
  error?: string;
  onTextHighlight?: (text: string, keywords: string[]) => void;
  onEventSelect?: (event: RawTextData) => void;
}

export interface FinancialSnapshotProps {
  data: FinancialSnapshot[];
  loading?: boolean;
  error?: string;
  onPeriodSelect?: (period: string) => void;
  onMetricHover?: (metric: string, value: number) => void;
}

export interface QuantSignalDashboardProps {
  data: QuantSignalsData[];
  loading?: boolean;
  error?: string;
  onSignalHover?: (signal: string, value: number) => void;
  onSignalClick?: (signal: QuantSignalsData) => void;
}

export interface FlowAndChipsViewerProps {
  data: FlowAndChipsData;
  loading?: boolean;
  error?: string;
  onFlowHover?: (flow: MoneyFlowData) => void;
  onChipHover?: (chip: ChipDistributionData) => void;
}

export interface PersonalPrecedentViewerProps {
  data: HistoricalArbitrations[];
  loading?: boolean;
  error?: string;
  onPrecedentSelect?: (precedent: HistoricalArbitrations) => void;
  onPrecedentHover?: (precedent: HistoricalArbitrations) => void;
}

export interface ArbitrationCaseListProps {
  cases: ArbitrationCaseInfo[];
  loading?: boolean;
  error?: string;
  selectedCaseId?: string;
  onCaseSelect?: (caseId: string) => void;
  onCaseFilter?: (filters: CaseFilters) => void;
}

// ==================== 其他类型 ====================

export interface GridLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}

export interface ArbitrationDecision {
  caseId: string;
  decision: 'approve' | 'reject' | 'modify';
  feedback: {
    rating: 'excellent' | 'good' | 'average' | 'poor' | 'bad';
    comment: string;
    correctAttribution?: string;
    correctPrediction?: string;
    priority: number;
    tags: string[];
  };
  reviewer: string;
  reviewerRole: string;
}

export interface CaseFilters {
  priority?: number[];
  status?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  stockCode?: string;
}

export interface TooltipData {
  title: string;
  content: string;
  position: {
    x: number;
    y: number;
  };
}

// ==================== 状态管理类型 ====================

export interface ArbitrationState {
  currentCaseId: string | null;
  caseData: ArbitrationCaseData | null;
  loading: boolean;
  error: string | null;
  layout: GridLayout[];
  maximizedPanel: string | null;
  tooltipData: TooltipData | null;
}

export interface ArbitrationActions {
  setCurrentCase: (caseId: string) => void;
  setCaseData: (data: ArbitrationCaseData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLayout: (layout: GridLayout[]) => void;
  setMaximizedPanel: (panelId: string | null) => void;
  setTooltipData: (data: TooltipData | null) => void;
  fetchCaseData: (caseId: string) => Promise<void>;
  submitArbitration: (decision: ArbitrationDecision) => Promise<void>;
}

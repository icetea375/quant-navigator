/**
 * 仲裁相关类型定义
 * 这是所有模块关于"仲裁"概念的单一事实来源
 */

// ==================== 枚举类型 ====================

export type ArbitrationStatus = 
  | 'pending'
  | 'in_review'
  | 'resolved'
  | 'rejected';

export type ReportType = 
  | 'fact_analysis'
  | 'sentiment_analysis'
  | 'technical_analysis'
  | 'comprehensive'
  | 'anomaly'
  | 'quarterly'
  | 'interim'
  | 'arbitration_case';

// ==================== 核心接口 ====================

export interface AnalysisResult {
  analysis: string;
  confidence: number;
  reasoning: string;
  key_points: string[];
  recommendations: string[];
  risk_factors: string[];
  timestamp: string;
}

export interface SentimentAnalysis {
  sentiment: string;
  score: number;
  reasoning: string;
  confidence: number;
  timestamp: string;
}

export interface ArbitrationCase {
  case_id: string;
  report_type: ReportType;
  target_code?: string;
  target_name?: string;
  
  // AI分析结果
  qwen_analysis?: AnalysisResult;
  doubao_analysis?: AnalysisResult;
  disagreement_score: number;
  
  // 案件状态
  status: ArbitrationStatus;
  priority: string;
  priority_score: number;
  
  // 时间信息
  created_at: string;
  updated_at?: string;
  report_date: string;
  
  // 内容信息
  key_findings: string[];
  risk_factors: string[];
  summary: string;
  tags: string[];
  industry?: string;
  concept?: string;
  
  // 人工决策
  human_decision?: string;
  human_reasoning?: string;
  human_confidence?: number;
  
  // 元数据
  metadata: Record<string, any>;
}

// ==================== 请求/响应类型 ====================

export interface ArbitrationCaseCreate {
  report_type: ReportType;
  target_code?: string;
  target_name?: string;
  qwen_analysis?: AnalysisResult;
  doubao_analysis?: AnalysisResult;
  report_date: string;
  summary: string;
  key_findings: string[];
  risk_factors: string[];
  tags: string[];
  industry?: string;
  concept?: string;
  metadata: Record<string, any>;
}

export interface ArbitrationCaseUpdate {
  status?: ArbitrationStatus;
  priority?: string;
  priority_score?: number;
  human_decision?: string;
  human_reasoning?: string;
  human_confidence?: number;
  summary?: string;
  key_findings?: string[];
  risk_factors?: string[];
  tags?: string[];
  industry?: string;
  concept?: string;
  metadata?: Record<string, any>;
}

export interface ArbitrationCaseResponse {
  success: boolean;
  message: string;
  data?: ArbitrationCase;
  timestamp: string;
}

export interface ArbitrationCaseListResponse {
  success: boolean;
  message: string;
  data: ArbitrationCase[];
  total: number;
  page: number;
  size: number;
  timestamp: string;
}

// ==================== 统计和决策类型 ====================

export interface ArbitrationStatistics {
  total_cases: number;
  pending_cases: number;
  in_review_cases: number;
  resolved_cases: number;
  rejected_cases: number;
  
  avg_disagreement_score: number;
  avg_processing_time: number;
  
  high_priority_cases: number;
  medium_priority_cases: number;
  low_priority_cases: number;
  
  // 按报告类型统计
  fact_analysis_cases: number;
  sentiment_analysis_cases: number;
  technical_analysis_cases: number;
  comprehensive_cases: number;
  
  // 时间范围
  period_start: string;
  period_end: string;
}

export interface ArbitrationDecision {
  decision_id: string;
  case_id: string;
  decision_type: string;
  decision_content: string;
  reasoning: string;
  confidence: number;
  decision_maker: string;
  decision_time: string;
  metadata: Record<string, any>;
}

// ==================== 前端特定类型 ====================

export interface ArbitrationCaseInfo {
  caseId: string;
  stockCode: string;
  stockName: string;
  reportType: ReportType;
  status: ArbitrationStatus;
  priority: string | number;
  priorityScore: number;
  createdAt: string;
  updatedAt: string;
  reportDate: string;
  keyFindings: string[];
  riskFactors: string[];
  summary: string;
  tags: string[];
  industry: string;
  concept: string;
}

export interface ArbitrationCaseData {
  caseInfo: ArbitrationCaseInfo;
  aiDebate: {
    qwenAnalysis: AnalysisResult;
    doubaoAnalysis: AnalysisResult;
    disagreementScore: number;
    consensusSummary?: string;
    conflictSummary?: string;
  };
  panels: {
    rawTextExplorer: any[];
    financialSnapshot: any[];
    quantSignalDashboard: any[];
    flowAndChipsViewer: any;
    precedentViewer: any[];
  };
  humanDecision?: {
    decision: string;
    reasoning: string;
    confidence: number;
    decisionMaker: string;
    decisionTime: string;
  };
}

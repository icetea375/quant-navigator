// 自动生成的API类型定义
// 生成时间: 1758801938.212003
// 来源: FastAPI OpenAPI规范

export interface AnalysisResult {
  analysis: string;
  confidence: number;
  reasoning: string;
}

export interface ArbitrationCase {
  case_id: string;
  report_type: string;
  target_code?: string;
  qwen_analysis?: string;
  doubao_analysis?: string;
  disagreement_score: number;
  status: string;
  created_at: string;
  updated_at?: string;
  human_decision?: string;
  human_reasoning?: string;
}

export interface ArbitrationCaseListResponse {
  success: boolean;
  message: string;
  data: ArbitrationCase[];
  total: number;
  page: number;
  size: number;
}

export interface ArbitrationCaseResponse {
  success: boolean;
  message: string;
  data?: string;
}

export interface ArbitrationCaseUpdate {
  status?: string;
  human_decision?: string;
  human_reasoning?: string;
}

export interface GeneratedReport {
  report_id: number;
  report_type: string;
  target_code?: string;
  report_date: string;
  content: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface ReportCreate {
  report_type: string;
  target_code?: string;
  report_date: string;
  content: string;
}

export interface ReportListResponse {
  success: boolean;
  message: string;
  data: GeneratedReport[];
  total: number;
  page: number;
  size: number;
}

export interface ReportResponse {
  success: boolean;
  message: string;
  data?: string;
}

export interface ReportUpdate {
  content?: string;
  status?: string;
}

export interface SentimentAnalysis {
  sentiment: string;
  score: number;
  reasoning: string;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export type ArbitrationStatus =
  | 'pending'
  | 'in_review'
  | 'resolved'
  | 'rejected';

export type ReportStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export type ReportType =
  | 'daily_analysis'
  | 'fact_analysis'
  | 'sentiment_analysis'
  | 'arbitration_case';

export interface ArbitrationCase {
  id: string;
  caseId: string;
  reportDate: string;
  stockCode: string;
  qwenReportId: string;
  doubaoReportId: string;
  divergenceScore: number;
  consensusSummary: string;
  conflictSummary: string;
  priorityScore: number;
  status: 'PENDING_HUMAN' | 'IGNORED' | 'ARBITRATED';
  analysisMetadata: Record<string, any>;
  humanDecision: {
    finalRecommendation: string;
    confidenceLevel: number;
    reasoning: string;
    keyDisagreements: string;
    arbitratorId?: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArbitrationCaseListQuery {
  page?: number;
  limit?: number;
  status?: 'PENDING_HUMAN' | 'IGNORED' | 'ARBITRATED';
  stockCode?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'priority_score' | 'created_at' | 'report_date';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ArbitrationCaseListResponse {
  cases: ArbitrationCase[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ArbitrationCaseDetail extends ArbitrationCase {
  qwenReport: {
    id: string;
    content: string;
    summary: string;
    sentimentScore: number;
    keywords: string[];
    entities: string[];
    confidenceScore: number;
    investmentRecommendation: string;
    mdaScores: {
      completenessScore: number;
      consistencyScore: number;
    };
  };
  doubaoReport: {
    id: string;
    content: string;
    summary: string;
    sentimentScore: number;
    keywords: string[];
    entities: string[];
    confidenceScore: number;
    investmentRecommendation: string;
    sentimentAnalysis: {
      sentimentScore: number;
      confidenceLevel: number;
      riskFactors: string[];
      marketConsensus: string;
      contrarianView: string;
      realTimeEvents: string[];
    };
  };
}

export interface HumanArbitrationDecision {
  finalRecommendation: 'BUY' | 'HOLD' | 'SELL';
  confidenceLevel: number;
  reasoning: string;
  keyDisagreements: string;
  arbitratorId?: string;
}

export interface ArbitrationStatusUpdate {
  status: 'IGNORED' | 'ARBITRATED';
  reason?: string;
}

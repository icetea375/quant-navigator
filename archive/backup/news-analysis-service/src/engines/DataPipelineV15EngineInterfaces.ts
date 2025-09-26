/**
 * DataPipeline v1.5 智能引擎数据源对接接口
 * 为三大智能引擎提供专门的数据访问接口
 */

import {
  QuantSignalDataSource,
  HotspotIntelligenceDataSource,
  AttributionDataSource,
  ShenwanIndustryData,
  ShenwanIndustryMemberData,
  ThsConceptData,
  DcConceptData,
  ThsConceptMemberData,
  DcConceptMemberData,
  LongFormNewsData,
  NewsBroadcastData,
  EInteractionData,
  IndexDailyMetricsData,
  MarketDailyStatsData,
  IndexComponentData
} from '../interfaces/DataPipelineV15Interfaces';

// ============================================
// QuantSignalEngine 数据源接口 (骨架)
// ============================================

export interface QuantSignalEngineDataSource {
  /**
   * 获取行业分类数据
   * 严格只读取稳定的行业分类表
   */
  getIndustryClassification(source?: 'Shenwan' | 'Citic'): Promise<ShenwanIndustryData[]>;

  /**
   * 获取行业成分股数据
   * 严格只读取稳定的行业成分股表
   */
  getIndustryMembers(industryCode?: string, source?: 'Shenwan' | 'Citic'): Promise<ShenwanIndustryMemberData[]>;

  /**
   * 获取指数成分和权重数据
   * 用于计算行业轮动和拥挤度
   */
  getIndexComponents(tsCode?: string, tradeDate?: string): Promise<IndexComponentData[]>;

  /**
   * 获取市场宏观统计数据
   * 用于计算风险偏好和市场情绪
   */
  getMarketDailyStats(tradeDate?: string): Promise<MarketDailyStatsData[]>;

  /**
   * 计算行业内相关性
   * 基于稳定的行业分类计算
   */
  calculateIndustryCorrelation(industryCode: string, startDate: string, endDate: string): Promise<{
    correlation_matrix: { [stock1: string]: { [stock2: string]: number } };
    avg_correlation: number;
    max_correlation: number;
    min_correlation: number;
  }>;

  /**
   * 计算行业轮动信号
   * 基于行业分类的轮动分析
   */
  calculateIndustryRotation(startDate: string, endDate: string): Promise<{
    rotation_signals: Array<{
      industry_code: string;
      industry_name: string;
      rotation_strength: number;
      trend_direction: 'up' | 'down' | 'sideways';
      confidence: number;
    }>;
    overall_rotation: 'cyclical' | 'defensive' | 'mixed';
  }>;

  /**
   * 计算行业拥挤度
   * 基于行业成分股的资金流向和估值
   */
  calculateIndustryCrowding(industryCode: string, tradeDate: string): Promise<{
    crowding_score: number;
    factors: {
      valuation_crowding: number;
      momentum_crowding: number;
      sentiment_crowding: number;
    };
    risk_level: 'low' | 'medium' | 'high';
  }>;
}

// ============================================
// HotspotIntelligenceEngine 数据源接口 (神经)
// ============================================

export interface HotspotIntelligenceEngineDataSource {
  /**
   * 获取每日概念板块数据
   * 严格只读取动态的概念板块表
   */
  getDailyConcepts(tradeDate?: string, source?: 'THS' | 'DC'): Promise<(ThsConceptData | DcConceptData)[]>;

  /**
   * 获取每日概念成分股数据
   * 严格只读取动态的概念成分股表
   */
  getDailyConceptMembers(conceptCode?: string, tradeDate?: string, source?: 'THS' | 'DC'): Promise<(ThsConceptMemberData | DcConceptMemberData)[]>;

  /**
   * 获取人气榜单数据
   * 结合dc_hot, ths_hot等人气榜单
   */
  getHotRankings(tradeDate?: string, source?: 'THS' | 'DC'): Promise<Array<{
    stock_code: string;
    stock_name: string;
    hot_rank: number;
    hot_score: number;
    concept_codes: string[];
  }>>;

  /**
   * 获取概念资金流向数据
   * 结合资金流向分析概念热度
   */
  getConceptMoneyFlow(tradeDate?: string): Promise<Array<{
    concept_code: string;
    concept_name: string;
    net_inflow: number;
    net_inflow_rate: number;
    hot_rank: number;
  }>>;

  /**
   * 发现当日市场龙头热点
   * 核心功能：从瞬息万变的概念板块中发现热点
   */
  discoverMarketHotspots(tradeDate?: string): Promise<{
    primary_hotspots: Array<{
      concept_code: string;
      concept_name: string;
      hot_score: number;
      member_count: number;
      avg_pct_chg: number;
      total_amount: number;
      leading_stocks: Array<{
        stock_code: string;
        stock_name: string;
        pct_chg: number;
        amount: number;
      }>;
    }>;
    secondary_hotspots: Array<{
      concept_code: string;
      concept_name: string;
      hot_score: number;
      potential: 'rising' | 'declining' | 'stable';
    }>;
    market_sentiment: 'bullish' | 'bearish' | 'neutral';
  }>;

  /**
   * 分析概念轮动模式
   * 基于动态概念数据分析轮动
   */
  analyzeConceptRotation(days: number = 5): Promise<{
    rotation_pattern: Array<{
      concept_code: string;
      concept_name: string;
      rotation_stage: 'emerging' | 'rising' | 'peaking' | 'declining';
      duration_days: number;
      strength: number;
    }>;
    next_potential: Array<{
      concept_code: string;
      concept_name: string;
      probability: number;
      catalysts: string[];
    }>;
  }>;

  /**
   * 预测概念持续性
   * 基于历史数据预测概念热度持续性
   */
  predictConceptPersistence(conceptCode: string, tradeDate: string): Promise<{
    persistence_score: number;
    duration_forecast: number; // 预计持续天数
    factors: {
      historical_performance: number;
      current_momentum: number;
      market_support: number;
      news_sentiment: number;
    };
    risk_factors: string[];
  }>;
}

// ============================================
// AI_Attribution_Core 数据源接口 (双重融合)
// ============================================

export interface AttributionCoreDataSource {
  /**
   * 获取股票的双重分类信息
   * 同时查询骨架和神经数据
   */
  getStockDualClassification(stockCode: string, tradeDate: string): Promise<{
    // 骨架数据
    industry_info: {
      shenwan: {
        industry_code: string;
        industry_name: string;
        level: string;
        weight?: number;
      }[];
      citic: {
        industry_code: string;
        industry_name: string;
        level: string;
        weight?: number;
      }[];
    };
    // 神经数据
    concept_info: {
      ths: {
        concept_code: string;
        concept_name: string;
        hot_rank?: number;
        weight?: number;
      }[];
      dc: {
        concept_code: string;
        concept_name: string;
        hot_rank?: number;
        weight?: number;
      }[];
    };
  }>;

  /**
   * 获取股票相关的文本证据
   * 获取长篇新闻、新闻联播、e互动问答
   */
  getStockTextualEvidence(stockCode: string, tradeDate: string, days: number = 7): Promise<{
    long_form_news: LongFormNewsData[];
    news_broadcast: NewsBroadcastData[];
    e_interaction: EInteractionData[];
    evidence_summary: {
      total_news: number;
      avg_importance: number;
      avg_sentiment: number;
      key_themes: string[];
      related_concepts: string[];
    };
  }>;

  /**
   * 获取市场背景数据
   * 获取宏观市场数据作为归因背景
   */
  getMarketContext(tradeDate: string): Promise<{
    market_stats: MarketDailyStatsData;
    index_metrics: IndexDailyMetricsData[];
    market_sentiment: {
      overall_sentiment: 'bullish' | 'bearish' | 'neutral';
      risk_appetite: 'high' | 'medium' | 'low';
      volatility_level: 'high' | 'medium' | 'low';
    };
  }>;

  /**
   * 生成综合归因证据包
   * 整合所有数据源生成归因证据
   */
  generateAttributionEvidence(stockCode: string, tradeDate: string): Promise<{
    stock_info: {
      code: string;
      name: string;
      pct_chg: number;
      amount: number;
      volume: number;
    };
    structural_evidence: {
      industry_classification: string[];
      industry_trend: 'up' | 'down' | 'sideways';
      industry_correlation: number;
    };
    catalyst_evidence: {
      active_concepts: string[];
      concept_hot_rank: number;
      concept_momentum: 'rising' | 'declining' | 'stable';
      news_impact: number;
      interaction_impact: number;
    };
    market_context: {
      overall_sentiment: string;
      risk_appetite: string;
      volatility_level: string;
    };
    evidence_strength: {
      structural_strength: number;
      catalyst_strength: number;
      market_support: number;
      overall_confidence: number;
    };
    attribution_hypothesis: {
      primary_drivers: string[];
      secondary_factors: string[];
      risk_factors: string[];
      confidence_level: number;
    };
  }>;

  /**
   * 验证归因假设
   * 基于历史数据验证归因假设的合理性
   */
  validateAttributionHypothesis(hypothesis: {
    primary_drivers: string[];
    secondary_factors: string[];
    stock_code: string;
    trade_date: string;
  }): Promise<{
    validation_score: number;
    historical_precedents: Array<{
      date: string;
      similar_drivers: string[];
      outcome: 'positive' | 'negative' | 'neutral';
      confidence: number;
    }>;
    risk_assessment: {
      overreaction_risk: number;
      trend_reversal_risk: number;
      external_shock_risk: number;
    };
  }>;
}

// ============================================
// 数据源适配器实现
// ============================================

export class QuantSignalEngineDataSourceAdapter implements QuantSignalEngineDataSource {
  constructor(
    private industryFetcher: any,
    private marketStructureFetcher: any
  ) {}

  async getIndustryClassification(source?: 'Shenwan' | 'Citic'): Promise<ShenwanIndustryData[]> {
    if (source === 'Shenwan') {
      return await this.industryFetcher.getShenwanIndustryClassification();
    } else if (source === 'Citic') {
      return await this.industryFetcher.getCiticIndustryClassification();
    } else {
      const [shenwan, citic] = await Promise.all([
        this.industryFetcher.getShenwanIndustryClassification(),
        this.industryFetcher.getCiticIndustryClassification()
      ]);
      return [...shenwan, ...citic];
    }
  }

  async getIndustryMembers(industryCode?: string, source?: 'Shenwan' | 'Citic'): Promise<ShenwanIndustryMemberData[]> {
    if (source === 'Shenwan') {
      return await this.industryFetcher.getShenwanIndustryMembers(industryCode);
    } else if (source === 'Citic') {
      return await this.industryFetcher.getCiticIndustryMembers(industryCode);
    } else {
      const [shenwan, citic] = await Promise.all([
        this.industryFetcher.getShenwanIndustryMembers(industryCode),
        this.industryFetcher.getCiticIndustryMembers(industryCode)
      ]);
      return [...shenwan, ...citic];
    }
  }

  async getIndexComponents(tsCode?: string, tradeDate?: string): Promise<IndexComponentData[]> {
    // 实现获取指数成分和权重的逻辑
    return [];
  }

  async getMarketDailyStats(tradeDate?: string): Promise<MarketDailyStatsData[]> {
    // 实现获取市场统计数据的逻辑
    return [];
  }

  async calculateIndustryCorrelation(industryCode: string, startDate: string, endDate: string): Promise<any> {
    // 实现行业内相关性计算
    return {
      correlation_matrix: {},
      avg_correlation: 0,
      max_correlation: 0,
      min_correlation: 0
    };
  }

  async calculateIndustryRotation(startDate: string, endDate: string): Promise<any> {
    // 实现行业轮动信号计算
    return {
      rotation_signals: [],
      overall_rotation: 'mixed'
    };
  }

  async calculateIndustryCrowding(industryCode: string, tradeDate: string): Promise<any> {
    // 实现行业拥挤度计算
    return {
      crowding_score: 0,
      factors: {
        valuation_crowding: 0,
        momentum_crowding: 0,
        sentiment_crowding: 0
      },
      risk_level: 'medium'
    };
  }
}

export class HotspotIntelligenceEngineDataSourceAdapter implements HotspotIntelligenceEngineDataSource {
  constructor(
    private conceptFetcher: any,
    private moneyFlowFetcher: any
  ) {}

  async getDailyConcepts(tradeDate?: string, source?: 'THS' | 'DC'): Promise<(ThsConceptData | DcConceptData)[]> {
    if (source === 'THS') {
      return await this.conceptFetcher.getThsConcepts(tradeDate);
    } else if (source === 'DC') {
      return await this.conceptFetcher.getDcConcepts(tradeDate);
    } else {
      const [ths, dc] = await Promise.all([
        this.conceptFetcher.getThsConcepts(tradeDate),
        this.conceptFetcher.getDcConcepts(tradeDate)
      ]);
      return [...ths, ...dc];
    }
  }

  async getDailyConceptMembers(conceptCode?: string, tradeDate?: string, source?: 'THS' | 'DC'): Promise<(ThsConceptMemberData | DcConceptMemberData)[]> {
    if (source === 'THS') {
      return await this.conceptFetcher.getThsConceptMembers(conceptCode, tradeDate);
    } else if (source === 'DC') {
      return await this.conceptFetcher.getDcConceptMembers(conceptCode, tradeDate);
    } else {
      const [ths, dc] = await Promise.all([
        this.conceptFetcher.getThsConceptMembers(conceptCode, tradeDate),
        this.conceptFetcher.getDcConceptMembers(conceptCode, tradeDate)
      ]);
      return [...ths, ...dc];
    }
  }

  async getHotRankings(tradeDate?: string, source?: 'THS' | 'DC'): Promise<any[]> {
    // 实现获取人气榜单的逻辑
    return [];
  }

  async getConceptMoneyFlow(tradeDate?: string): Promise<any[]> {
    // 实现获取概念资金流向的逻辑
    return [];
  }

  async discoverMarketHotspots(tradeDate?: string): Promise<any> {
    // 实现发现市场热点的核心逻辑
    return {
      primary_hotspots: [],
      secondary_hotspots: [],
      market_sentiment: 'neutral'
    };
  }

  async analyzeConceptRotation(days: number = 5): Promise<any> {
    // 实现概念轮动分析
    return {
      rotation_pattern: [],
      next_potential: []
    };
  }

  async predictConceptPersistence(conceptCode: string, tradeDate: string): Promise<any> {
    // 实现概念持续性预测
    return {
      persistence_score: 0,
      duration_forecast: 0,
      factors: {
        historical_performance: 0,
        current_momentum: 0,
        market_support: 0,
        news_sentiment: 0
      },
      risk_factors: []
    };
  }
}

export class AttributionCoreDataSourceAdapter implements AttributionCoreDataSource {
  constructor(
    private industryFetcher: any,
    private conceptFetcher: any,
    private textualFetcher: any,
    private marketStructureFetcher: any
  ) {}

  async getStockDualClassification(stockCode: string, tradeDate: string): Promise<any> {
    // 实现获取股票双重分类信息的逻辑
    return {
      industry_info: {
        shenwan: [],
        citic: []
      },
      concept_info: {
        ths: [],
        dc: []
      }
    };
  }

  async getStockTextualEvidence(stockCode: string, tradeDate: string, days: number = 7): Promise<any> {
    // 实现获取股票文本证据的逻辑
    return {
      long_form_news: [],
      news_broadcast: [],
      e_interaction: [],
      evidence_summary: {
        total_news: 0,
        avg_importance: 0,
        avg_sentiment: 0,
        key_themes: [],
        related_concepts: []
      }
    };
  }

  async getMarketContext(tradeDate: string): Promise<any> {
    // 实现获取市场背景数据的逻辑
    return {
      market_stats: {} as MarketDailyStatsData,
      index_metrics: [],
      market_sentiment: {
        overall_sentiment: 'neutral',
        risk_appetite: 'medium',
        volatility_level: 'medium'
      }
    };
  }

  async generateAttributionEvidence(stockCode: string, tradeDate: string): Promise<any> {
    // 实现生成综合归因证据包的核心逻辑
    return {
      stock_info: {
        code: stockCode,
        name: '',
        pct_chg: 0,
        amount: 0,
        volume: 0
      },
      structural_evidence: {
        industry_classification: [],
        industry_trend: 'sideways',
        industry_correlation: 0
      },
      catalyst_evidence: {
        active_concepts: [],
        concept_hot_rank: 0,
        concept_momentum: 'stable',
        news_impact: 0,
        interaction_impact: 0
      },
      market_context: {
        overall_sentiment: 'neutral',
        risk_appetite: 'medium',
        volatility_level: 'medium'
      },
      evidence_strength: {
        structural_strength: 0,
        catalyst_strength: 0,
        market_support: 0,
        overall_confidence: 0
      },
      attribution_hypothesis: {
        primary_drivers: [],
        secondary_factors: [],
        risk_factors: [],
        confidence_level: 0
      }
    };
  }

  async validateAttributionHypothesis(hypothesis: any): Promise<any> {
    // 实现验证归因假设的逻辑
    return {
      validation_score: 0,
      historical_precedents: [],
      risk_assessment: {
        overreaction_risk: 0,
        trend_reversal_risk: 0,
        external_shock_risk: 0
      }
    };
  }
}

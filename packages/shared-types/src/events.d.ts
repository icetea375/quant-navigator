/**
 * 事件相关类型定义 - 量化导航仪项目的核心业务契约
 * 这是所有模块关于"事件"概念的单一事实来源
 */

/**
 * 异常事件接口 - 系统核心业务概念
 * 所有模块必须严格遵循此契约
 */
export interface AnomalyEvent {
  /** 事件唯一标识符 */
  id: string;
  /** 股票代码 */
  stock_code: string;
  /** 时间戳 (毫秒) */
  timestamp: number;
  /** 异常类型 - 严格枚举 */
  anomaly_type: 'price' | 'volume' | 'volatility' | 'correlation';
  /** 严重程度 */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** 描述信息 */
  description: string;
  /** Z分数 */
  z_score: number;
  /** 当前值 */
  current_value: number;
  /** 期望值 */
  expected_value: number;
  /** 偏差值 */
  deviation: number;
  /** 置信度 (0-1) */
  confidence: number;
  /** 上下文信息 */
  context: {
    market_state: string;
    sector_performance: number;
    news_count: number;
    volume_ratio: number;
  };
  /** 元数据 */
  metadata: Record<string, any>;
}

/**
 * 归因结果接口 - 异常事件分析结果
 */
export interface AttributionResult {
  /** 事件ID */
  event_id: string;
  /** 股票代码 */
  stock_code: string;
  /** 时间戳 */
  timestamp: number;
  /** 归因分析结果 */
  attribution: {
    primary_factors: string[];
    secondary_factors: string[];
    confidence_score: number;
    explanation: string;
  };
  /** 置信度 (0-1) */
  confidence: number;
  /** 支持证据 */
  evidence: Array<{
    type: 'news' | 'technical' | 'fundamental' | 'market';
    content: string;
    relevance_score: number;
    source: string;
  }>;
  /** 叙述性描述 */
  narrative: string;
  /** 元数据 */
  metadata: Record<string, any>;
}

/**
 * 处理事件接口 - 已处理的事件
 */
export interface ProcessedEvent {
  /** 事件ID */
  event_id: string;
  /** 事件类型 */
  event_type: 'news' | 'announcement' | 'e_interaction' | 'market_data';
  /** 标题 */
  title: string;
  /** 内容 */
  content: string;
  /** 发布时间 */
  published_at: string;
  /** 相关股票代码列表 */
  related_stocks: string[];
  /** 关键词 */
  keywords: string[];
  /** 情感分数 (-1到1) */
  sentiment_score: number;
  /** 重要性分数 (0-1) */
  importance_score: number;
  /** 状态 */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** 处理结果 */
  processing_result?: {
    extracted_entities: string[];
    sentiment_analysis: {
      sentiment: 'positive' | 'negative' | 'neutral';
      confidence: number;
      scores: {
        positive: number;
        negative: number;
        neutral: number;
      };
    };
    relevance_score: number;
  };
  /** 错误信息 */
  error_message?: string;
  /** 元数据 */
  metadata: Record<string, any>;
}

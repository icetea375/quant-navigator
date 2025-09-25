/**
 * 量化信号相关类型定义
 * 这是所有模块关于"量化信号"概念的单一事实来源
 */

/**
 * 信号类型枚举
 */
export enum SignalType {
  INDIVIDUAL = 'individual',
  MARKET = 'market',
  MACRO = 'macro',
  STYLE = 'style',
  INDUSTRY = 'industry'
}

/**
 * 信号状态枚举
 */
export enum SignalStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived'
}

/**
 * 量化信号接口 - 系统核心业务概念
 */
export interface QuantSignal {
  /** 信号ID */
  signal_id: string;
  /** 目标股票代码 */
  target_code: string;
  /** 信号日期 */
  signal_date: string;
  /** 信号类型 */
  signal_type: SignalType;
  /** 状态 */
  status: SignalStatus;
  /** 收益率Z分数 */
  return_z_score: number;
  /** 成交量Z分数 */
  volume_z_score: number;
  /** 动量Z分数 */
  momentum_z_score: number;
  /** 波动率Z分数 */
  volatility_z_score: number;
  /** 宏观风险Z分数 */
  macro_risk_z_score: number;
  /** 市场风格Z分数 */
  market_style_z_score: number;
  /** 行业轮动Z分数 */
  industry_rotation_z_score: number;
  /** 概念Z分数 */
  concept_z_score: number;
  /** MDA履行率 */
  mda_fulfillment_rate: number;
  /** 管理层可信度分数 */
  management_credibility_score: number;
  /** 披露质量分数 */
  disclosure_quality_score: number;
  /** 财务透明度分数 */
  financial_transparency_score: number;
  /** RSI指标 */
  rsi: number;
  /** MACD信号 */
  macd_signal: number;
  /** 布林带位置 */
  bollinger_position: number;
  /** 移动平均信号 */
  ma_signal: number;
  /** 整体信号强度 */
  overall_signal_strength: number;
  /** 信号置信度 */
  signal_confidence: number;
  /** 有效期天数 */
  validity_days: number;
  /** 模型版本 */
  model_version: string;
  /** 计算参数 */
  calculation_params: Record<string, any>;
  /** 数据源 */
  source: string;
  /** 元数据 */
  metadata: Record<string, any>;
}

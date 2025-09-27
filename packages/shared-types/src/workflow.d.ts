/**
 * 工作流相关类型定义
 * 这是所有模块关于"工作流"概念的单一事实来源
 */

/**
 * 工作流配置接口
 */
export interface WorkflowConfig {
  /** 启用核心宇宙处理 */
  enableCoreUniverse: boolean;
  /** 启用观察宇宙处理 */
  enableObservationUniverse: boolean;
  /** 启用每日提升检查 */
  enableDailyPromotion: boolean;
  /** 启用月度降级检查 */
  enableMonthlyDemotion: boolean;
  /** 核心宇宙最大规模 */
  coreUniverseMaxSize: number;
  /** 观察宇宙最大规模 */
  observationUniverseMaxSize: number;
  /** 提升检查时间 (HH:MM格式) */
  promotionCheckTime: string;
  /** 降级检查时间 (HH:MM格式) */
  demotionCheckTime: string;
}

/**
 * 工作流执行结果接口
 */
export interface WorkflowExecutionResult {
  /** 执行是否成功 */
  success: boolean;
  /** 开始时间 */
  startTime: string;
  /** 结束时间 */
  endTime: string;
  /** 执行时长 (毫秒) */
  duration: number;
  /** 核心宇宙处理数量 */
  coreUniverseProcessed: number;
  /** 观察宇宙处理数量 */
  observationUniverseProcessed: number;
  /** 错误列表 */
  errors: string[];
  /** 警告列表 */
  warnings: string[];
}

/**
 * 归因引擎配置接口
 */
export interface AttributionEngineConfig {
  /** 是否启用 */
  enabled: boolean;
  /** 异常检测配置 */
  anomalyDetection: {
    enabled: boolean;
    zScoreThreshold: number;
    detectionInterval: number;
    maxAnomaliesPerRun: number;
  };
  /** 信号转换配置 */
  signalTranslation: {
    enabled: boolean;
    translationRules: Array<{
      pattern: string;
      replacement: string;
      condition?: string;
    }>;
    outputFormat: 'json' | 'text';
  };
  /** LLM协作配置 */
  llmCollaboration: {
    enabled: boolean;
    providers: string[];
    maxRetries: number;
    timeout: number;
  };
  /** 工作流配置 */
  workflow: {
    enableDailyAttribution: boolean;
    enableAnomalyAttribution: boolean;
    enableHistoricalAttribution: boolean;
    enableCrossValidation: boolean;
  };
  /** 监控配置 */
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    metricsCollection: boolean;
  };
}

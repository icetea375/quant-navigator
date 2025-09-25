// API响应基础类型 - 符合文档规范
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  code?: number
  timestamp?: string
}

// 错误响应类型 - 符合文档规范
export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

// 分页响应类型
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 错误响应类型
export interface ApiError {
  code: string
  message: string
  details?: any
  field?: string
}

// 请求配置类型
export interface RequestConfig {
  timeout?: number
  retries?: number
  retryDelay?: number
  showLoading?: boolean
  showError?: boolean
}

// 文件上传类型
export interface UploadResponse {
  url: string
  filename: string
  size: number
  mimeType: string
}

// 系统状态类型
export interface SystemStatus {
  isRunning: boolean
  lastUpdate: string
  errorCount: number
  warningCount: number
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
}

// 数据管道状态类型
export interface DataPipelineStatus {
  status: 'running' | 'stopped' | 'error'
  processingSpeed: number
  queueLength: number
  successRate: number
  stages: PipelineStage[]
}

export interface PipelineStage {
  name: string
  status: 'completed' | 'running' | 'pending' | 'error'
  duration: number
  progress: number
}

// AI引擎状态类型
export interface AIEngineStatus {
  name: string
  description: string
  status: 'running' | 'stopped' | 'error'
  cpuUsage: number
  memoryUsage: number
  requestCount: number
  lastUpdate: string
}

// 系统配置类型
export interface SystemConfig {
  basic: BasicConfig
  ai: AIConfig
  database: DatabaseConfig
  monitoring: MonitoringConfig
}

export interface BasicConfig {
  systemName: string
  updateFrequency: string
  maxConcurrency: number
  logLevel: string
}

export interface AIConfig {
  modelVersion: string
  confidenceThreshold: number
  maxTokens: number
  temperature: number
}

export interface DatabaseConfig {
  type: string
  host: string
  port: number
  database: string
  poolSize: number
}

export interface MonitoringConfig {
  enabled: boolean
  alertEmail: string
  cpuThreshold: number
  memoryThreshold: number
  diskThreshold: number
}

// 日志条目类型
export interface LogEntry {
  id: string
  level: 'debug' | 'info' | 'warn' | 'error'
  timestamp: string
  source: string
  message: string
  details?: string
  userId?: string
  requestId?: string
}

// ========== 公共API类型定义 ==========

// 市场快报类型 - 符合文档规范
export interface MarketBriefingResponse {
  title: string
  content: string
  publish_time: string
}

// 热点复盘类型 - 符合文档规范
export interface HotspotAttributionResponse {
  hotspot_name: string
  summary: string
  snapshots: Array<{
    timestamp: string
    change_pct: number
    volume: number
    attribution: string
  }>
}

// ========== 私人API类型定义 ==========

// 用户认证响应类型 - 符合文档规范
export interface AuthResponse {
  user: {
    id: string
    username: string
    email: string
    role: 'user' | 'admin'
  }
  token: string
}

// 股票池类型 - 符合文档规范
export interface StockPoolResponse {
  id: string
  name: string
  item_count: number
  items?: Array<{
    id: string
    code: string
    name: string
    type: string
  }>
}

// 股票池条目类型 - 符合文档规范
export interface StockPoolItemResponse {
  id: string
  code: string
  name: string
  type: string
}

// 专属盘前雷达类型 - 符合文档规范
export interface MyBriefingResponse {
  title: string
  content: string
  publish_time: string
  personalized_insights: Array<{
    type: 'risk' | 'opportunity' | 'warning'
    message: string
    confidence: number
  }>
}

// 持仓异动复盘类型 - 符合文档规范
export interface MyAttributionResponse {
  target_name: string
  change_pct: number
  snapshot: {
    timestamp: string
    volume: number
    attribution: string
    confidence: number
  }
}

// ========== 管理员API类型定义 ==========

// 系统状态类型 - 符合文档规范
export interface SystemStatusResponse {
  data_pipeline_status: 'running' | 'stopped' | 'error'
  llm_service_health: 'healthy' | 'degraded' | 'down'
  db_connection: 'connected' | 'disconnected'
  last_update: string
  error_count: number
  warning_count: number
}

// 数据管道日志类型 - 符合文档规范
export interface DataPipelineLogResponse {
  timestamp: string
  level: 'info' | 'warn' | 'error'
  message: string
  details?: any
}

// AI引擎统计类型 - 符合文档规范
export interface AIEngineStatsResponse {
  total_requests: number
  success_rate: number
  p95_latency_ms: number
  error_count: number
  last_request_time: string
}

// 系统配置类型 - 符合文档规范
export interface SystemConfigResponse {
  z_score_threshold: number
  update_frequency: string
  max_concurrency: number
  log_level: string
  [key: string]: any
}

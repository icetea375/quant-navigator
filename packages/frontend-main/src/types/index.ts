/**
 * 类型系统统一导出点
 * 单一事实来源 - 所有类型定义都从这里导出
 *
 * 使用方式：
 * import { User, ArbitrationCaseInfo, FinancialSnapshot } from '@/types'
 *
 * 禁止从其他文件直接导入类型，必须从这里导入
 */

// ==================== 核心业务实体类型 ====================
export * from './core'

// ==================== API 相关类型 ====================
export * from './api'

// ==================== 市场数据相关类型 ====================
export * from './market'

// ==================== 用户相关类型 ====================
export * from './user'

// ==================== 仲裁相关类型（保持向后兼容） ====================
export * from './arbitration'

// ==================== 类型工具函数 ====================

/**
 * 类型守卫：检查对象是否为有效的用户
 */
export function isUser(obj: unknown): obj is import('./core').User {
  return Boolean(obj &&
    typeof (obj as any).id === 'string' &&
    typeof (obj as any).email === 'string' &&
    typeof (obj as any).name === 'string' &&
    ['user', 'admin'].includes((obj as any).role))
}

/**
 * 类型守卫：检查对象是否为有效的仲裁案件信息
 */
export function isArbitrationCaseInfo(obj: unknown): obj is import('./core').ArbitrationCaseInfo {
  return Boolean(obj &&
    typeof (obj as any).caseId === 'string' &&
    typeof (obj as any).stockCode === 'string' &&
    typeof (obj as any).stockName === 'string' &&
    ['fact_analysis', 'sentiment_analysis', 'technical_analysis', 'comprehensive'].includes((obj as any).reportType))
}

/**
 * 类型守卫：检查对象是否为有效的财务快照
 */
export function isFinancialSnapshot(obj: unknown): obj is import('./core').FinancialSnapshot {
  return Boolean(obj &&
    typeof (obj as any).reportId === 'string' &&
    typeof (obj as any).stockCode === 'string' &&
    typeof (obj as any).revenue === 'number' &&
    typeof (obj as any).netProfitExcludingNonRecurring === 'number')
}

/**
 * 类型守卫：检查对象是否为有效的API响应
 */
export function isApiResponse<T>(obj: unknown): obj is import('./core').BaseResponse<T> {
  return Boolean(obj &&
    typeof (obj as any).success === 'boolean' &&
    typeof (obj as any).timestamp === 'string')
}

/**
 * 类型守卫：检查对象是否为有效的分页响应
 */
export function isPaginatedResponse<T>(obj: unknown): obj is import('./core').PaginatedResponse<T> {
  return Boolean(
    isApiResponse<T[]>(obj) &&
    'pagination' in obj &&
    obj.pagination &&
    typeof obj.pagination === 'object' &&
    typeof (obj.pagination as Record<string, unknown>).page === 'number' &&
    typeof (obj.pagination as Record<string, unknown>).total === 'number' &&
    Array.isArray(obj.data)
  )
}

// ==================== 类型转换工具 ====================

/**
 * 将旧版本的仲裁案件数据转换为新版本
 * @param oldCase 旧版本的仲裁案件数据
 * @returns 新版本的仲裁案件信息
 */
export function convertLegacyArbitrationCase(oldCase: Record<string, unknown>): import('./core').ArbitrationCaseInfo {
  return {
    caseId: String(oldCase.case_id || oldCase.id || ''),
    stockCode: String(oldCase.target_code || oldCase.stockCode || ''),
    stockName: String(oldCase.target_name || oldCase.stockName || ''),
    reportType: (oldCase.report_type || 'comprehensive') as 'comprehensive',
    status: (oldCase.status || 'pending') as 'pending',
    priority: (oldCase.priority || 'medium') as 'medium',
    priorityScore: Number(oldCase.priority_score || 0),
    createdAt: String(oldCase.created_at || oldCase.createdAt || new Date().toISOString()),
    updatedAt: String(oldCase.updated_at || oldCase.updatedAt || new Date().toISOString()),
    keyFindings: Array.isArray(oldCase.keyFindings) ? oldCase.keyFindings as string[] : [],
    riskFactors: Array.isArray(oldCase.riskFactors) ? oldCase.riskFactors as string[] : [],
    summary: String(oldCase.summary || oldCase.consensus_summary || ''),
    tags: Array.isArray(oldCase.tags) ? oldCase.tags as string[] : [],
    industry: String(oldCase.industry || ''),
    concept: String(oldCase.concept || '')
  }
}

/**
 * 将旧版本的AI分析结果转换为新版本
 * @param oldAnalysis 旧版本的AI分析结果
 * @returns 新版本的AI分析结果
 */
export function convertLegacyAIAnalysis(oldAnalysis: Record<string, unknown>): import('./core').AIAnalysisResult {
  return {
    summary: String(oldAnalysis.analysis || oldAnalysis.summary || ''),
    keyPoints: Array.isArray(oldAnalysis.keyPoints) ? oldAnalysis.keyPoints as string[] : [],
    confidence: Number(oldAnalysis.confidence || oldAnalysis.score || 0),
    reasoning: String(oldAnalysis.reasoning || ''),
    recommendations: Array.isArray(oldAnalysis.recommendations) ? oldAnalysis.recommendations as string[] : [],
    riskFactors: Array.isArray(oldAnalysis.riskFactors) ? oldAnalysis.riskFactors as string[] : [],
    timestamp: String(oldAnalysis.timestamp || new Date().toISOString())
  }
}

// ==================== 类型常量 ====================

export const USER_ROLES = ['user', 'admin'] as const
export const ARBITRATION_STATUSES = ['pending', 'in_progress', 'completed', 'rejected', 'archived'] as const
export const ARBITRATION_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export const REPORT_TYPES = ['fact_analysis', 'sentiment_analysis', 'technical_analysis', 'comprehensive'] as const
export const MARKET_SENTIMENTS = ['bullish', 'bearish', 'neutral'] as const
export const RISK_LEVELS = ['low', 'medium', 'high'] as const
export const SIGNAL_TYPES = ['buy', 'sell', 'hold', 'strong_buy', 'strong_sell'] as const
export const FLOW_TYPES = ['main_force', 'super_large', 'large', 'medium', 'small'] as const
export const FLOW_DIRECTIONS = ['inflow', 'outflow', 'net'] as const
export const SENTIMENTS = ['positive', 'negative', 'neutral'] as const
export const RATINGS = ['excellent', 'good', 'average', 'poor', 'bad'] as const

// ==================== 类型别名 ====================

export type UserRole = typeof USER_ROLES[number]
export type ArbitrationStatus = typeof ARBITRATION_STATUSES[number]
export type ArbitrationPriority = typeof ARBITRATION_PRIORITIES[number]
export type ReportType = typeof REPORT_TYPES[number]
export type MarketSentiment = typeof MARKET_SENTIMENTS[number]
export type RiskLevel = typeof RISK_LEVELS[number]
export type SignalType = typeof SIGNAL_TYPES[number]
export type FlowType = typeof FLOW_TYPES[number]
export type FlowDirection = typeof FLOW_DIRECTIONS[number]
export type Sentiment = typeof SENTIMENTS[number]
export type Rating = typeof RATINGS[number]

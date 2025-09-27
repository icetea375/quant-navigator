/**
 * 仲裁相关API服务
 * 提供仲裁案件的所有API调用功能
 */

import { request } from '@/services/http'
import { logger } from '@/utils/logger'
import type {
  ArbitrationCaseData,
  ArbitrationCaseInfo,
  ArbitrationDecision,
  ArbitrationCaseListResponse,
  ArbitrationStatistics,
  AIDebateData,
  CaseFilters
} from '@/types/arbitration'

/**
 * 仲裁API服务类
 */
export class ArbitrationService {
  /**
   * 获取仲裁案件列表
   * @param filters 过滤条件
   * @returns 仲裁案件列表响应
   */
  async getCasesList(filters?: CaseFilters): Promise<ArbitrationCaseInfo[]> {
    try {
      const response = await request.get<ArbitrationCaseListResponse>('/admin/arbitration-cases', {
        params: filters || {},
        showLoading: true,
      })
      return response.data || []
    } catch (error) {
      logger.error('获取仲裁案件列表失败:', error)
      throw error
    }
  }

  /**
   * 获取单个仲裁案件详情
   * @param caseId 案件ID
   * @returns 仲裁案件详情
   */
  async getCaseData(caseId: string): Promise<ArbitrationCaseData> {
    try {
      const response = await request.get<ArbitrationCaseData>(`/admin/arbitration-cases/${caseId}`, {
        showLoading: true,
      })
      return response
    } catch (error) {
      logger.error(`获取仲裁案件详情失败 (${caseId}):`, error)
      throw error
    }
  }

  /**
   * 获取仲裁案件列表（向后兼容）
   * @param filters 过滤条件
   * @returns 仲裁案件列表响应
   */
  async getCases(filters?: CaseFilters): Promise<ArbitrationCaseInfo[]> {
    return this.getCasesList(filters)
  }

  /**
   * 获取单个仲裁案件详情（向后兼容）
   * @param caseId 案件ID
   * @returns 仲裁案件详情
   */
  async getCaseDetail(caseId: string): Promise<ArbitrationCaseData> {
    return this.getCaseData(caseId)
  }

  /**
   * 提交仲裁决策
   * @param decision 仲裁决策
   * @returns 提交结果
   */
  async submitArbitration(decision: ArbitrationDecision): Promise<void> {
    try {
      await request.post('/admin/arbitration-cases/decision', decision, {
        showLoading: true,
      })
    } catch (error) {
      logger.error('提交仲裁决策失败:', error)
      throw error
    }
  }

  /**
   * 提交仲裁决策（向后兼容）
   * @param caseId 案件ID
   * @param decision 仲裁决策
   * @returns 提交结果
   */
  async submitDecision(caseId: string, decision: ArbitrationDecision): Promise<void> {
    try {
      await request.post(`/admin/arbitration-cases/${caseId}/decision`, decision, {
        showLoading: true,
      })
    } catch (error) {
      logger.error(`提交仲裁决策失败 (${caseId}):`, error)
      throw error
    }
  }

  /**
   * 获取仲裁统计信息
   * @returns 仲裁统计信息
   */
  async getStatistics(): Promise<ArbitrationStatistics> {
    try {
      const response = await request.get<ArbitrationStatistics>('/admin/arbitration-cases/statistics', {
        showLoading: true,
      })
      return response
    } catch (error) {
      logger.error('获取仲裁统计信息失败:', error)
      throw error
    }
  }

  /**
   * 获取AI辩论数据
   * @param caseId 案件ID
   * @returns AI辩论数据
   */
  async getAIDebate(caseId: string): Promise<AIDebateData> {
    try {
      const response = await request.get<AIDebateData>(`/admin/arbitration-cases/${caseId}/ai-debate`, {
        showLoading: true,
      })
      return response
    } catch (error) {
      logger.error(`获取AI辩论数据失败 (${caseId}):`, error)
      throw error
    }
  }

  /**
   * 更新案件状态
   * @param caseId 案件ID
   * @param status 新状态
   * @returns 更新结果
   */
  async updateCaseStatus(caseId: string, status: string): Promise<void> {
    try {
      await request.patch(`/admin/arbitration-cases/${caseId}/status`, { status }, {
        showLoading: true,
      })
    } catch (error) {
      logger.error(`更新案件状态失败 (${caseId}):`, error)
      throw error
    }
  }

  /**
   * 批量更新案件状态
   * @param caseIds 案件ID列表
   * @param status 新状态
   * @returns 更新结果
   */
  async batchUpdateCaseStatus(caseIds: string[], status: string): Promise<void> {
    try {
      await request.patch('/admin/arbitration-cases/batch-status', {
        caseIds,
        status
      }, {
        showLoading: true,
      })
    } catch (error) {
      logger.error('批量更新案件状态失败:', error)
      throw error
    }
  }

  /**
   * 删除仲裁案件
   * @param caseId 案件ID
   * @returns 删除结果
   */
  async deleteCase(caseId: string): Promise<void> {
    try {
      await request.delete(`/admin/arbitration-cases/${caseId}`, {
        showLoading: true,
      })
    } catch (error) {
      logger.error(`删除仲裁案件失败 (${caseId}):`, error)
      throw error
    }
  }

  /**
   * 导出仲裁案件数据
   * @param filters 过滤条件
   * @param format 导出格式 (csv, excel, pdf)
   * @returns 导出文件URL
   */
  async exportCases(filters?: CaseFilters, format: 'csv' | 'excel' | 'pdf' = 'excel'): Promise<string> {
    try {
      const response = await request.post<{ downloadUrl: string }>('/admin/arbitration-cases/export', {
        filters: filters || {},
        format
      }, {
        showLoading: true,
      })
      return response.downloadUrl
    } catch (error) {
      logger.error('导出仲裁案件数据失败:', error)
      throw error
    }
  }

  /**
   * 获取案件历史记录
   * @param caseId 案件ID
   * @returns 历史记录列表
   */
  async getCaseHistory(caseId: string): Promise<any[]> {
    try {
      const response = await request.get<any[]>(`/admin/arbitration-cases/${caseId}/history`, {
        showLoading: true,
      })
      return response
    } catch (error) {
      logger.error(`获取案件历史记录失败 (${caseId}):`, error)
      throw error
    }
  }

  /**
   * 添加案件备注
   * @param caseId 案件ID
   * @param note 备注内容
   * @returns 添加结果
   */
  async addCaseNote(caseId: string, note: string): Promise<void> {
    try {
      await request.post(`/admin/arbitration-cases/${caseId}/notes`, { note }, {
        showLoading: true,
      })
    } catch (error) {
      logger.error(`添加案件备注失败 (${caseId}):`, error)
      throw error
    }
  }

  /**
   * 获取案件备注列表
   * @param caseId 案件ID
   * @returns 备注列表
   */
  async getCaseNotes(caseId: string): Promise<any[]> {
    try {
      const response = await request.get<any[]>(`/admin/arbitration-cases/${caseId}/notes`, {
        showLoading: true,
      })
      return response
    } catch (error) {
      logger.error(`获取案件备注失败 (${caseId}):`, error)
      throw error
    }
  }
}

// 创建单例实例
export const arbitrationService = new ArbitrationService()

// 导出类型
export type { ArbitrationService as ArbitrationServiceType }

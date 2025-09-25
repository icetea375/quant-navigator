import { request } from './http'
import type { 
  SystemStatusResponse,
  DataPipelineLogResponse,
  AIEngineStatsResponse,
  SystemConfigResponse
} from '@/types/api'

// 管理员API服务 - 符合文档规范
export const adminApi = {
  // ========== 系统状态管理 ==========

  // 获取系统状态
  getSystemStatus: (): Promise<SystemStatusResponse> => {
    return request.get<SystemStatusResponse>('/admin/system-status', {
      showLoading: true,
    })
  },

  // ========== 数据管道监控 ==========

  // 获取数据管道日志
  getDataPipelineLogs: (params: { limit?: number; level?: 'info' | 'warn' | 'error' } = {}): Promise<DataPipelineLogResponse[]> => {
    return request.get<DataPipelineLogResponse[]>('/admin/data-pipeline/logs', {
      params,
      showLoading: true,
    })
  },

  // ========== AI引擎管理 ==========

  // 获取AI引擎统计
  getAIEngineStats: (): Promise<AIEngineStatsResponse> => {
    return request.get<AIEngineStatsResponse>('/admin/ai-engine/stats', {
      showLoading: true,
    })
  },

  // ========== 系统配置管理 ==========

  // 获取系统配置
  getSystemConfig: (): Promise<SystemConfigResponse> => {
    return request.get<SystemConfigResponse>('/admin/config', {
      showLoading: true,
    })
  },

  // 更新系统配置
  updateSystemConfig: (config: Partial<SystemConfigResponse>): Promise<SystemConfigResponse> => {
    return request.patch<SystemConfigResponse>('/admin/config', config, {
      showLoading: true,
    })
  },
}
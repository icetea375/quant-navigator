import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { adminApi } from '@/services/admin'
import { logger } from '@/utils/logger'
import type {
  SystemStatus
} from '@/types/core'
import type {
  DataPipelineStatus,
  AIEngineStatus,
  SystemConfig,
  LogEntry,
  SystemStatusResponse,
  DataPipelineLogResponse,
  AIEngineStatsResponse,
  SystemConfigResponse
} from '@/types/api'

// 移除未使用的接口定义

export const useAdminStore = defineStore('admin', () => {
  // 系统状态
  const systemStatus = ref<SystemStatus | null>(null)
  const dataPipelineStatus = ref<DataPipelineStatus | null>(null)
  const aiEnginesStatus = ref<AIEngineStatus[]>([])
  const systemConfig = ref<SystemConfig | null>(null)
  const logs = ref<LogEntry[]>([])

  // 报告相关状态 - 这些变量暂未使用，已移除

  // 加载状态
  const loading = ref({
    systemStatus: false,
    dataPipeline: false,
    aiEngines: false,
    config: false,
    logs: false,
    reports: false,
    reportDetail: false,
    stats: false
  })

  // 分页信息
  const pagination = ref({
    logs: { page: 1, pageSize: 50, total: 0 },
    reports: { page: 1, pageSize: 20, total: 0 }
  })

  // 计算属性
  const isSystemHealthy = computed(() => {
    if (!systemStatus.value) return false
    return systemStatus.value.status === 'healthy' &&
           (systemStatus.value.performance?.errorRate ?? 0) === 0 &&
           (systemStatus.value.performance?.responseTime ?? 0) < 1000 &&
           (systemStatus.value.performance?.throughput ?? 0) > 0
  })

  const criticalIssues = computed(() => {
    const issues = []
    if ((systemStatus.value?.performance?.errorRate ?? 0) > 0.1) {
      issues.push(`错误率过高: ${((systemStatus.value?.performance?.errorRate ?? 0) * 100).toFixed(1)}%`)
    }
    if ((systemStatus.value?.performance?.responseTime ?? 0) > 2000) {
      issues.push('响应时间过长')
    }
    if ((systemStatus.value?.performance?.throughput ?? 0) < 10) {
      issues.push('吞吐量过低')
    }
    return issues
  })

  // 系统状态管理
  const loadSystemStatus = async () => {
    loading.value.systemStatus = true
    try {
      const data = await adminApi.getSystemStatus()
      systemStatus.value = data as unknown as SystemStatus
    } catch (error) {
      logger.error('Failed to load system status:', error)
      throw error
    } finally {
      loading.value.systemStatus = false
    }
  }

  const updateSystemStatus = async (_status: Partial<SystemStatus>) => {
    try {
      // 注意：adminApi没有updateSystemStatus方法，这里需要根据实际API调整
      logger.warn('updateSystemStatus method not implemented in adminApi')
    } catch (error) {
      logger.error('Failed to update system status:', error)
      throw error
    }
  }

  const restartSystem = async () => {
    try {
      // 注意：adminApi没有restartSystem方法，这里需要根据实际API调整
      logger.warn('restartSystem method not implemented in adminApi')
      // 重新加载状态
      await loadSystemStatus()
    } catch (error) {
      logger.error('Failed to restart system:', error)
      throw error
    }
  }

  const stopSystem = async () => {
    try {
      // 注意：adminApi没有stopSystem方法，这里需要根据实际API调整
      logger.warn('stopSystem method not implemented in adminApi')
      // 重新加载状态
      await loadSystemStatus()
    } catch (error) {
      logger.error('Failed to stop system:', error)
      throw error
    }
  }

  const getHealthCheck = async () => {
    try {
      // 注意：adminApi没有getHealthCheck方法，这里需要根据实际API调整
      logger.warn('getHealthCheck method not implemented in adminApi')
      return { status: 'unknown' }
    } catch (error) {
      logger.error('Failed to get health check:', error)
      throw error
    }
  }

  // 数据管道管理
  const loadDataPipelineStatus = async () => {
    loading.value.dataPipeline = true
    try {
      // 注意：adminApi没有dataPipeline.getStatus方法，使用getDataPipelineLogs代替
      await adminApi.getDataPipelineLogs({ limit: 1 })
      // 这里需要根据实际API响应结构调整
      dataPipelineStatus.value = {
        status: 'running',
        processingSpeed: 0,
        queueLength: 0,
        successRate: 0.95,
        stages: []
      }
    } catch (error) {
      logger.error('Failed to load data pipeline status:', error)
      throw error
    } finally {
      loading.value.dataPipeline = false
    }
  }

  const startDataPipeline = async () => {
    try {
      // 注意：adminApi没有dataPipeline.startPipeline方法
      logger.warn('startDataPipeline method not implemented in adminApi')
      await loadDataPipelineStatus()
    } catch (error) {
      logger.error('Failed to start data pipeline:', error)
      throw error
    }
  }

  const stopDataPipeline = async () => {
    try {
      // 注意：adminApi没有dataPipeline.stopPipeline方法
      logger.warn('stopDataPipeline method not implemented in adminApi')
      await loadDataPipelineStatus()
    } catch (error) {
      logger.error('Failed to stop data pipeline:', error)
      throw error
    }
  }

  const restartDataPipeline = async () => {
    try {
      // 注意：adminApi没有dataPipeline.restartPipeline方法
      logger.warn('restartDataPipeline method not implemented in adminApi')
      await loadDataPipelineStatus()
    } catch (error) {
      logger.error('Failed to restart data pipeline:', error)
      throw error
    }
  }

  const getPipelineMetrics = async (_timeRange = '1h') => {
    try {
      // 注意：adminApi没有dataPipeline.getMetrics方法
      logger.warn('getPipelineMetrics method not implemented in adminApi')
      return { metrics: [] }
    } catch (error) {
      logger.error('Failed to get pipeline metrics:', error)
      throw error
    }
  }

  // AI引擎管理
  const loadAIEnginesStatus = async () => {
    loading.value.aiEngines = true
    try {
      const data = await adminApi.getAIEngineStats()
      // 将AIEngineStatsResponse转换为AIEngineStatus[]
      aiEnginesStatus.value = [{
        name: 'default-engine',
        description: 'Default AI Engine',
        status: 'running',
        cpuUsage: 0,
        memoryUsage: 0,
        requestCount: data.total_requests,
        lastUpdate: data.last_request_time
      }]
    } catch (error) {
      logger.error('Failed to load AI engines status:', error)
      throw error
    } finally {
      loading.value.aiEngines = false
    }
  }

  const startAIEngine = async (_engineName: string) => {
    try {
      // 注意：adminApi没有aiEngines.startEngine方法
      logger.warn('startAIEngine method not implemented in adminApi')
      await loadAIEnginesStatus()
    } catch (error) {
      logger.error('Failed to start AI engine:', error)
      throw error
    }
  }

  const stopAIEngine = async (_engineName: string) => {
    try {
      // 注意：adminApi没有aiEngines.stopEngine方法
      logger.warn('stopAIEngine method not implemented in adminApi')
      await loadAIEnginesStatus()
    } catch (error) {
      logger.error('Failed to stop AI engine:', error)
      throw error
    }
  }

  const restartAIEngine = async (_engineName: string) => {
    try {
      // 注意：adminApi没有aiEngines.restartEngine方法
      logger.warn('restartAIEngine method not implemented in adminApi')
      await loadAIEnginesStatus()
    } catch (error) {
      logger.error('Failed to restart AI engine:', error)
      throw error
    }
  }

  const getEngineMetrics = async (_engineName: string, _timeRange = '1h') => {
    try {
      // 注意：adminApi没有aiEngines.getEngineMetrics方法
      logger.warn('getEngineMetrics method not implemented in adminApi')
      return { metrics: [] }
    } catch (error) {
      logger.error('Failed to get engine metrics:', error)
      throw error
    }
  }

  // 系统配置管理
  const loadSystemConfig = async () => {
    loading.value.config = true
    try {
      const data = await adminApi.getSystemConfig()
      systemConfig.value = data as unknown as SystemConfig
    } catch (error) {
      logger.error('Failed to load system config:', error)
      throw error
    } finally {
      loading.value.config = false
    }
  }

  const updateSystemConfig = async (_config: Partial<SystemConfig>) => {
    try {
      const data = await adminApi.updateSystemConfig(_config as any)
      systemConfig.value = data as unknown as SystemConfig
    } catch (error) {
      logger.error('Failed to update system config:', error)
      throw error
    }
  }

  const resetSystemConfig = async () => {
    try {
      // 注意：adminApi没有resetConfig方法
      logger.warn('resetSystemConfig method not implemented in adminApi')
      await loadSystemConfig()
    } catch (error) {
      logger.error('Failed to reset system config:', error)
      throw error
    }
  }

  const exportConfig = async () => {
    try {
      // 注意：adminApi没有exportConfig方法
      logger.warn('exportConfig method not implemented in adminApi')
      return { config: systemConfig.value }
    } catch (error) {
      logger.error('Failed to export config:', error)
      throw error
    }
  }

  const importConfig = async (_config: SystemConfig) => {
    try {
      // 注意：adminApi没有importConfig方法
      logger.warn('importConfig method not implemented in adminApi')
      await loadSystemConfig()
    } catch (error) {
      logger.error('Failed to import config:', error)
      throw error
    }
  }

  // 日志管理
  const loadLogs = async (searchParams: {
    level?: 'debug' | 'info' | 'warn' | 'error'
    source?: string
    startTime?: string
    endTime?: string
    page?: number
    pageSize?: number
  } = {}) => {
    loading.value.logs = true
    try {
      const data = await adminApi.getDataPipelineLogs({
        limit: searchParams.pageSize || 50,
        level: (searchParams.level || 'info') as 'info' | 'warn' | 'error'
      })
      logs.value = data.map((log: DataPipelineLogResponse) => ({
        id: String(log.timestamp),
        level: log.level,
        timestamp: String(log.timestamp),
        source: 'data-pipeline',
        message: String(log.message),
        details: log.details ? String(log.details) : undefined
      }))
      pagination.value.logs = {
        page: searchParams.page || 1,
        pageSize: searchParams.pageSize || 50,
        total: data.length,
      }
    } catch (error) {
      logger.error('Failed to load logs:', error)
      throw error
    } finally {
      loading.value.logs = false
    }
  }

  const searchLogs = async (_query: string, _params: Record<string, unknown> = {}) => {
    loading.value.logs = true
    try {
      // 注意：adminApi没有logs.searchLogs方法，使用getDataPipelineLogs代替
      logger.warn('searchLogs method not implemented in adminApi')
      const data = await adminApi.getDataPipelineLogs({
        limit: 50,
        level: 'info' as 'info' | 'warn' | 'error'
      })
      logs.value = data.map((log: DataPipelineLogResponse) => ({
        id: String(log.timestamp),
        level: log.level,
        timestamp: String(log.timestamp),
        source: 'data-pipeline',
        message: String(log.message),
        details: log.details ? String(log.details) : undefined
      }))
      pagination.value.logs = {
        page: 1,
        pageSize: 50,
        total: data.length,
      }
    } catch (error) {
      logger.error('Failed to search logs:', error)
      throw error
    } finally {
      loading.value.logs = false
    }
  }

  const clearLogs = async (_olderThan?: string) => {
    try {
      // 注意：adminApi没有logs.clearLogs方法
      logger.warn('clearLogs method not implemented in adminApi')
      await loadLogs()
    } catch (error) {
      logger.error('Failed to clear logs:', error)
      throw error
    }
  }

  const exportLogs = async (_params: Record<string, unknown> = {}) => {
    try {
      // 注意：adminApi没有logs.exportLogs方法
      logger.warn('exportLogs method not implemented in adminApi')
      return { logs: logs.value }
    } catch (error) {
      logger.error('Failed to export logs:', error)
      throw error
    }
  }

  const getLogStats = async (_timeRange = '24h') => {
    try {
      // 注意：adminApi没有logs.getLogStats方法
      logger.warn('getLogStats method not implemented in adminApi')
      return { stats: { total: logs.value.length, errors: 0, warnings: 0 } }
    } catch (error) {
      logger.error('Failed to get log stats:', error)
      throw error
    }
  }

  // 刷新所有数据
  const refreshAllData = async () => {
    const promises = [
      loadSystemStatus(),
      loadDataPipelineStatus(),
      loadAIEnginesStatus(),
      loadSystemConfig(),
      loadLogs(),
    ]

    try {
      await Promise.allSettled(promises)
    } catch (error) {
      logger.error('Failed to refresh all admin data:', error)
    }
  }

  return {
    // 状态
    systemStatus,
    dataPipelineStatus,
    aiEnginesStatus,
    systemConfig,
    logs,
    loading,
    pagination,

    // 计算属性
    isSystemHealthy,
    criticalIssues,

    // 系统状态方法
    loadSystemStatus,
    updateSystemStatus,
    restartSystem,
    stopSystem,
    getHealthCheck,

    // 数据管道方法
    loadDataPipelineStatus,
    startDataPipeline,
    stopDataPipeline,
    restartDataPipeline,
    getPipelineMetrics,

    // AI引擎方法
    loadAIEnginesStatus,
    startAIEngine,
    stopAIEngine,
    restartAIEngine,
    getEngineMetrics,

    // 配置管理方法
    loadSystemConfig,
    updateSystemConfig,
    resetSystemConfig,
    exportConfig,
    importConfig,

    // 日志管理方法
    loadLogs,
    searchLogs,
    clearLogs,
    exportLogs,
    getLogStats,

    // 工具方法
    refreshAllData,
  }
})

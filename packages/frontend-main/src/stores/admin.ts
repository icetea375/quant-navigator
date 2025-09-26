import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { adminApi } from '@/services/admin'
import type {
  SystemStatus,
  DataPipelineStatus,
  AIEngineStatus,
  SystemConfig,
  LogEntry
} from '@/types/api'

export const useAdminStore = defineStore('admin', () => {
  // 系统状态
  const systemStatus = ref<SystemStatus | null>(null)
  const dataPipelineStatus = ref<DataPipelineStatus | null>(null)
  const aiEnginesStatus = ref<AIEngineStatus[]>([])
  const systemConfig = ref<SystemConfig | null>(null)
  const logs = ref<LogEntry[]>([])

  // 加载状态
  const loading = ref({
    systemStatus: false,
    dataPipeline: false,
    aiEngines: false,
    config: false,
    logs: false,
  })

  // 分页信息
  const pagination = ref({
    logs: { page: 1, pageSize: 50, total: 0 },
  })

  // 计算属性
  const isSystemHealthy = computed(() => {
    if (!systemStatus.value) return false
    return systemStatus.value.isRunning &&
           systemStatus.value.errorCount === 0 &&
           systemStatus.value.cpuUsage < 80 &&
           systemStatus.value.memoryUsage < 85
  })

  const criticalIssues = computed(() => {
    const issues = []
    if (systemStatus.value?.errorCount > 0) {
      issues.push(`${systemStatus.value.errorCount} 个系统错误`)
    }
    if (systemStatus.value?.cpuUsage > 90) {
      issues.push('CPU使用率过高')
    }
    if (systemStatus.value?.memoryUsage > 95) {
      issues.push('内存使用率过高')
    }
    return issues
  })

  // 系统状态管理
  const loadSystemStatus = async () => {
    loading.value.systemStatus = true
    try {
      const data = await adminApi.system.getStatus()
      systemStatus.value = data
    } catch (error) {
      console.error('Failed to load system status:', error)
      throw error
    } finally {
      loading.value.systemStatus = false
    }
  }

  const updateSystemStatus = async (status: Partial<SystemStatus>) => {
    try {
      const data = await adminApi.system.updateStatus(status)
      systemStatus.value = data
    } catch (error) {
      console.error('Failed to update system status:', error)
      throw error
    }
  }

  const restartSystem = async () => {
    try {
      await adminApi.system.restartSystem()
      // 重新加载状态
      await loadSystemStatus()
    } catch (error) {
      console.error('Failed to restart system:', error)
      throw error
    }
  }

  const stopSystem = async () => {
    try {
      await adminApi.system.stopSystem()
      // 重新加载状态
      await loadSystemStatus()
    } catch (error) {
      console.error('Failed to stop system:', error)
      throw error
    }
  }

  const getHealthCheck = async () => {
    try {
      return await adminApi.system.getHealthCheck()
    } catch (error) {
      console.error('Failed to get health check:', error)
      throw error
    }
  }

  // 数据管道管理
  const loadDataPipelineStatus = async () => {
    loading.value.dataPipeline = true
    try {
      const data = await adminApi.dataPipeline.getStatus()
      dataPipelineStatus.value = data
    } catch (error) {
      console.error('Failed to load data pipeline status:', error)
      throw error
    } finally {
      loading.value.dataPipeline = false
    }
  }

  const startDataPipeline = async () => {
    try {
      await adminApi.dataPipeline.startPipeline()
      await loadDataPipelineStatus()
    } catch (error) {
      console.error('Failed to start data pipeline:', error)
      throw error
    }
  }

  const stopDataPipeline = async () => {
    try {
      await adminApi.dataPipeline.stopPipeline()
      await loadDataPipelineStatus()
    } catch (error) {
      console.error('Failed to stop data pipeline:', error)
      throw error
    }
  }

  const restartDataPipeline = async () => {
    try {
      await adminApi.dataPipeline.restartPipeline()
      await loadDataPipelineStatus()
    } catch (error) {
      console.error('Failed to restart data pipeline:', error)
      throw error
    }
  }

  const getPipelineMetrics = async (timeRange = '1h') => {
    try {
      return await adminApi.dataPipeline.getMetrics(timeRange)
    } catch (error) {
      console.error('Failed to get pipeline metrics:', error)
      throw error
    }
  }

  // AI引擎管理
  const loadAIEnginesStatus = async () => {
    loading.value.aiEngines = true
    try {
      const data = await adminApi.aiEngines.getStatus()
      aiEnginesStatus.value = data
    } catch (error) {
      console.error('Failed to load AI engines status:', error)
      throw error
    } finally {
      loading.value.aiEngines = false
    }
  }

  const startAIEngine = async (engineName: string) => {
    try {
      await adminApi.aiEngines.startEngine(engineName)
      await loadAIEnginesStatus()
    } catch (error) {
      console.error('Failed to start AI engine:', error)
      throw error
    }
  }

  const stopAIEngine = async (engineName: string) => {
    try {
      await adminApi.aiEngines.stopEngine(engineName)
      await loadAIEnginesStatus()
    } catch (error) {
      console.error('Failed to stop AI engine:', error)
      throw error
    }
  }

  const restartAIEngine = async (engineName: string) => {
    try {
      await adminApi.aiEngines.restartEngine(engineName)
      await loadAIEnginesStatus()
    } catch (error) {
      console.error('Failed to restart AI engine:', error)
      throw error
    }
  }

  const getEngineMetrics = async (engineName: string, timeRange = '1h') => {
    try {
      return await adminApi.aiEngines.getEngineMetrics(engineName, timeRange)
    } catch (error) {
      console.error('Failed to get engine metrics:', error)
      throw error
    }
  }

  // 系统配置管理
  const loadSystemConfig = async () => {
    loading.value.config = true
    try {
      const data = await adminApi.config.getConfig()
      systemConfig.value = data
    } catch (error) {
      console.error('Failed to load system config:', error)
      throw error
    } finally {
      loading.value.config = false
    }
  }

  const updateSystemConfig = async (config: Partial<SystemConfig>) => {
    try {
      const data = await adminApi.config.updateConfig(config)
      systemConfig.value = data
    } catch (error) {
      console.error('Failed to update system config:', error)
      throw error
    }
  }

  const resetSystemConfig = async () => {
    try {
      const data = await adminApi.config.resetConfig()
      systemConfig.value = data
    } catch (error) {
      console.error('Failed to reset system config:', error)
      throw error
    }
  }

  const exportConfig = async () => {
    try {
      return await adminApi.config.exportConfig()
    } catch (error) {
      console.error('Failed to export config:', error)
      throw error
    }
  }

  const importConfig = async (config: SystemConfig) => {
    try {
      await adminApi.config.importConfig(config)
      await loadSystemConfig()
    } catch (error) {
      console.error('Failed to import config:', error)
      throw error
    }
  }

  // 日志管理
  const loadLogs = async (params: {
    level?: 'debug' | 'info' | 'warn' | 'error'
    source?: string
    startTime?: string
    endTime?: string
    page?: number
    pageSize?: number
  } = {}) => {
    loading.value.logs = true
    try {
      const data = await adminApi.logs.getLogs(params)
      logs.value = data.items
      pagination.value.logs = {
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
      }
    } catch (error) {
      console.error('Failed to load logs:', error)
      throw error
    } finally {
      loading.value.logs = false
    }
  }

  const searchLogs = async (query: string, params: any = {}) => {
    loading.value.logs = true
    try {
      const data = await adminApi.logs.searchLogs(query, params)
      logs.value = data.items
      pagination.value.logs = {
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
      }
    } catch (error) {
      console.error('Failed to search logs:', error)
      throw error
    } finally {
      loading.value.logs = false
    }
  }

  const clearLogs = async (olderThan?: string) => {
    try {
      await adminApi.logs.clearLogs(olderThan)
      await loadLogs()
    } catch (error) {
      console.error('Failed to clear logs:', error)
      throw error
    }
  }

  const exportLogs = async (params: any = {}) => {
    try {
      return await adminApi.logs.exportLogs(params)
    } catch (error) {
      console.error('Failed to export logs:', error)
      throw error
    }
  }

  const getLogStats = async (timeRange = '24h') => {
    try {
      return await adminApi.logs.getLogStats(timeRange)
    } catch (error) {
      console.error('Failed to get log stats:', error)
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
      console.error('Failed to refresh all admin data:', error)
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

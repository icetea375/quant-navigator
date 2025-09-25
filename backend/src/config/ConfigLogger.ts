import fs from 'fs'
import path from 'path'

export interface ConfigChangeLog {
  id: string
  timestamp: string
  configType: 'etf' | 'stock' | 'news'
  action: 'create' | 'update' | 'delete' | 'reload'
  changes: {
    before?: any
    after?: any
    fields?: string[]
  }
  operator?: string
  reason?: string
  success: boolean
  error?: string
}

export class ConfigLogger {
  private logDir: string
  private logFile: string

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs')
    this.logFile = path.join(this.logDir, 'config-changes.log')
    this.ensureLogDirectory()
  }

  // 确保日志目录存在
  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true })
    }
  }

  // 记录配置变更
  logConfigChange(log: Omit<ConfigChangeLog, 'id' | 'timestamp'>) {
    const fullLog: ConfigChangeLog = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      ...log
    }

    try {
      // 写入日志文件
      const logLine = JSON.stringify(fullLog) + '\n'
      fs.appendFileSync(this.logFile, logLine, 'utf8')
      
      // 同时输出到控制台
      console.log(`📝 配置变更日志: ${log.configType} ${log.action}`, {
        id: fullLog.id,
        success: log.success,
        fields: log.changes.fields
      })
      
      return fullLog
    } catch (error) {
      console.error('写入配置变更日志失败:', error)
      return null
    }
  }

  // 读取配置变更日志
  getConfigLogs(options: {
    type?: 'etf' | 'stock' | 'news'
    action?: 'create' | 'update' | 'delete' | 'reload'
    limit?: number
    offset?: number
  } = {}) {
    try {
      if (!fs.existsSync(this.logFile)) {
        return { logs: [], total: 0 }
      }

      const logContent = fs.readFileSync(this.logFile, 'utf8')
      const lines = logContent.trim().split('\n').filter(line => line.trim())
      
      let logs: ConfigChangeLog[] = lines.map(line => {
        try {
          return JSON.parse(line) as ConfigChangeLog
        } catch {
          return null
        }
      }).filter(log => log !== null)

      // 过滤
      if (options.type) {
        logs = logs.filter(log => log.configType === options.type)
      }
      if (options.action) {
        logs = logs.filter(log => log.action === options.action)
      }

      // 排序（最新的在前）
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      // 分页
      const total = logs.length
      const offset = options.offset || 0
      const limit = options.limit || 50
      const paginatedLogs = logs.slice(offset, offset + limit)

      return {
        logs: paginatedLogs,
        total,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    } catch (error) {
      console.error('读取配置变更日志失败:', error)
      return { logs: [], total: 0, error: error instanceof Error ? error.message : '未知错误' }
    }
  }

  // 生成日志ID
  private generateLogId(): string {
    return `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 清理旧日志（保留最近N条）
  cleanupOldLogs(keepCount: number = 1000) {
    try {
      const { logs } = this.getConfigLogs({ limit: keepCount })
      const logContent = logs.map(log => JSON.stringify(log)).join('\n') + '\n'
      fs.writeFileSync(this.logFile, logContent, 'utf8')
      console.log(`🧹 已清理配置变更日志，保留最近 ${keepCount} 条记录`)
    } catch (error) {
      console.error('清理配置变更日志失败:', error)
    }
  }
}

// 全局配置日志记录器实例
export const configLogger = new ConfigLogger()

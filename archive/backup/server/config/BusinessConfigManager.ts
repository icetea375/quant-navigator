import { EventEmitter } from 'events'
import fs from 'fs'
import path from 'path'
import { configLogger, ConfigChangeLog } from './ConfigLogger'

export interface ETFConfig {
  name: string
  sector: string
  keywords: string[]
  volatility: 'low' | 'medium' | 'high'
  analysisTemplate?: string
}

export interface StockConfig {
  default_stocks: Array<{
    code: string
    name: string
    sector: string
  }>
  sector_mapping: Record<string, string[]>
}

export interface NewsConfig {
  sources: Record<string, {
    name: string
    enabled: boolean
    priority: number
    keywords: string[]
  }>
  filter_rules: {
    min_length: number
    max_length: number
    required_keywords: string[]
    exclude_keywords?: string[]
  }
}

export class BusinessConfigManager extends EventEmitter {
  private configs = new Map<string, any>()
  private watchers = new Map<string, fs.FSWatcher>()
  private configDir: string
  private previousConfigs = new Map<string, any>() // 存储之前的配置用于比较

  constructor() {
    super()
    this.configDir = path.join(process.cwd(), 'server/config')
    console.log('🔧 初始化业务配置管理器，配置目录:', this.configDir)
    this.initializeConfigs()
    this.startWatching()
  }

  // 初始化所有配置
  private initializeConfigs() {
    const configFiles = {
      etf: 'etf-config.json',
      stock: 'stock-config.json',
      news: 'news-config.json'
    }

    for (const [type, filename] of Object.entries(configFiles)) {
      this.loadConfig(type, filename)
    }
  }

  // 加载配置文件
  private loadConfig(type: string, filename: string): boolean {
    const configPath = path.join(this.configDir, filename)

    try {
      if (!fs.existsSync(configPath)) {
        this.createDefaultConfig(type, filename)
        return false
      }

      const data = fs.readFileSync(configPath, 'utf8')
      const config = JSON.parse(data)

      // 验证配置
      if (this.validateConfig(type, config)) {
        this.configs.set(type, config)
        console.log(`✅ ${type}配置已加载`)
        return true
      } else {
        throw new Error(`配置验证失败: ${type}`)
      }
    } catch (error) {
      console.error(`❌ 加载${type}配置失败:`, error)
      return false
    }
  }

  // 创建默认配置文件
  private createDefaultConfig(type: string, filename: string) {
    const defaultConfigs = {
      etf: {
        "159316": {
          "name": "恒生创新药ETF",
          "sector": "医药生物",
          "keywords": ["创新药", "医药", "生物技术", "港股", "恒生"],
          "volatility": "high"
        },
        "159995": {
          "name": "芯片ETF",
          "sector": "科技",
          "keywords": ["芯片", "半导体", "科技", "AI", "算力"],
          "volatility": "high"
        },
        "512480": {
          "name": "半导体ETF",
          "sector": "科技",
          "keywords": ["半导体", "芯片", "科技", "制造", "设备"],
          "volatility": "high"
        },
        "159819": {
          "name": "人工智能ETF",
          "sector": "AI",
          "keywords": ["人工智能", "AI", "机器学习", "算法", "数据"],
          "volatility": "high"
        },
        "515030": {
          "name": "新能源车ETF",
          "sector": "新能源",
          "keywords": ["新能源", "电动车", "电池", "充电", "智能驾驶"],
          "volatility": "high"
        },
        "512880": {
          "name": "证券ETF",
          "sector": "金融",
          "keywords": ["证券", "金融", "券商", "资本市场", "交易"],
          "volatility": "medium"
        },
        "512800": {
          "name": "银行ETF",
          "sector": "金融",
          "keywords": ["银行", "金融", "信贷", "利率", "货币政策"],
          "volatility": "low"
        },
        "518880": {
          "name": "黄金ETF",
          "sector": "贵金属",
          "keywords": ["黄金", "贵金属", "避险", "通胀", "美元"],
          "volatility": "medium"
        }
      },
      stock: {
        "default_stocks": [
          {"code": "603259", "name": "药明康德", "sector": "医药生物"},
          {"code": "002594", "name": "比亚迪", "sector": "新能源"},
          {"code": "09926", "name": "康方生物", "sector": "医药生物"},
          {"code": "300750", "name": "宁德时代", "sector": "新能源"}
        ],
        "sector_mapping": {
          "医药生物": ["603259", "09926"],
          "新能源": ["002594", "300750"],
          "科技": ["300750", "002415"],
          "金融": ["000001", "600036"]
        }
      },
      news: {
        "sources": {
          "xueqiu": {
            "name": "雪球",
            "enabled": true,
            "priority": 1,
            "keywords": ["股票", "投资", "财经", "ETF"]
          },
          "eastmoney": {
            "name": "东方财富",
            "enabled": true,
            "priority": 2,
            "keywords": ["财经", "股市", "基金", "投资"]
          }
        },
        "filter_rules": {
          "min_length": 50,
          "max_length": 5000,
          "required_keywords": ["股票", "ETF", "投资", "财经"],
          "exclude_keywords": ["广告", "推广", "营销"]
        }
      }
    }

    const configPath = path.join(this.configDir, filename)
    const defaultConfig = defaultConfigs[type] || {}

    fs.writeFileSync(
      configPath,
      JSON.stringify(defaultConfig, null, 2),
      'utf8'
    )
    console.log(`📝 已创建默认${type}配置文件`)
  }

  // 验证配置格式
  private validateConfig(type: string, config: any): boolean {
    switch (type) {
      case 'etf':
        return this.validateETFConfig(config)
      case 'stock':
        return this.validateStockConfig(config)
      case 'news':
        return this.validateNewsConfig(config)
      default:
        return false
    }
  }

  private validateETFConfig(config: any): boolean {
    if (typeof config !== 'object' || config === null) {
      return false
    }

    for (const [etfCode, etfConfig] of Object.entries(config)) {
      if (!this.isValidETFConfig(etfConfig)) {
        console.error(`ETF配置验证失败: ${etfCode}`)
        return false
      }
    }
    return true
  }

  private isValidETFConfig(config: any): boolean {
    return (
      typeof config === 'object' &&
      typeof config.name === 'string' &&
      typeof config.sector === 'string' &&
      Array.isArray(config.keywords) &&
      ['low', 'medium', 'high'].includes(config.volatility)
    )
  }

  private validateStockConfig(config: any): boolean {
    return (
      typeof config === 'object' &&
      Array.isArray(config.default_stocks) &&
      typeof config.sector_mapping === 'object'
    )
  }

  private validateNewsConfig(config: any): boolean {
    return (
      typeof config === 'object' &&
      typeof config.sources === 'object' &&
      typeof config.filter_rules === 'object'
    )
  }

  // 配置变更回调
  private onConfigChange(type: string, filename: string) {
    console.log(`🔄 检测到${type}配置变更，正在重新加载...`)

    const previousConfig = this.previousConfigs.get(type)
    const beforeConfig = previousConfig ? JSON.parse(JSON.stringify(previousConfig)) : null

    if (this.loadConfig(type, filename)) {
      const afterConfig = this.configs.get(type)

      // 记录配置变更日志
      this.logConfigChange(type, beforeConfig, afterConfig, 'reload')

      // 清除相关缓存
      this.clearRelatedCache(type)
      this.emit('configUpdated', { type, config: afterConfig })
      console.log(`✅ ${type}配置已热重载`)

      // 更新之前的配置
      this.previousConfigs.set(type, JSON.parse(JSON.stringify(afterConfig)))
    } else {
      // 记录配置加载失败日志
      this.logConfigChange(type, beforeConfig, null, 'reload', false, '配置加载失败')
    }
  }

  // 清除相关缓存
  private clearRelatedCache(type: string) {
    try {
      switch (type) {
        case 'etf':
          this.clearETFAnalysisCache()
          break
        case 'stock':
          this.clearStockCache()
          break
        case 'news':
          this.clearNewsCache()
          break
      }
      console.log(`🗑️ 已清除${type}相关缓存`)
    } catch (error) {
      console.error(`❌ 清除${type}缓存失败:`, error)
    }
  }

  // 清除ETF分析缓存
  private clearETFAnalysisCache() {
    // 通知ETF新闻分析API清除缓存
    this.emit('clearETFCache')
  }

  // 清除股票相关缓存
  private clearStockCache() {
    // 通知股票相关API清除缓存
    this.emit('clearStockCache')
  }

  // 清除新闻源相关缓存
  private clearNewsCache() {
    // 通知新闻源相关API清除缓存
    this.emit('clearNewsCache')
  }

  // 记录配置变更日志
  private logConfigChange(
    configType: 'etf' | 'stock' | 'news',
    beforeConfig: any,
    afterConfig: any,
    action: 'create' | 'update' | 'delete' | 'reload',
    success: boolean = true,
    error?: string
  ) {
    try {
      const changes = this.calculateConfigChanges(beforeConfig, afterConfig)

      configLogger.logConfigChange({
        configType,
        action,
        changes,
        success,
        error,
        operator: 'system',
        reason: '配置文件变更'
      })
    } catch (logError) {
      console.error('记录配置变更日志失败:', logError)
    }
  }

  // 计算配置变更差异
  private calculateConfigChanges(before: any, after: any) {
    if (!before && !after) {
      return { before: null, after: null, fields: [] }
    }

    if (!before) {
      return { before: null, after, fields: ['all'] }
    }

    if (!after) {
      return { before, after: null, fields: ['all'] }
    }

    const changedFields: string[] = []

    // 简单的字段变更检测
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      changedFields.push('content')
    }

    return {
      before: before,
      after: after,
      fields: changedFields
    }
  }

  // 文件监听
  private startWatching() {
    const configFiles = {
      'etf-config.json': 'etf',
      'stock-config.json': 'stock',
      'news-config.json': 'news'
    }

    for (const [filename, type] of Object.entries(configFiles)) {
      const configPath = path.join(this.configDir, filename)
      if (fs.existsSync(configPath)) {
        this.watchFile(type, filename, configPath)
      }
    }
  }

  private watchFile(type: string, filename: string, configPath: string) {
    const watcher = fs.watchFile(configPath, (curr, prev) => {
      if (curr.mtime > prev.mtime) {
        console.log(`📁 检测到文件变更: ${filename}`)
        this.onConfigChange(type, filename)
      }
    })

    this.watchers.set(filename, watcher)
    console.log(`👀 开始监听配置文件: ${filename}`)
  }

  // 获取ETF配置
  getETFConfig(etfCode: string): ETFConfig {
    const etfConfigs = this.configs.get('etf') || {}
    const config = etfConfigs[etfCode] || {
      name: 'ETF',
      sector: '未知',
      keywords: ['市场', '投资', '基金'],
      volatility: 'medium'
    }
    console.log(`📊 获取ETF配置 ${etfCode}:`, config)
    return config
  }

  // 获取所有ETF配置
  getAllETFConfigs(): Record<string, ETFConfig> {
    return this.configs.get('etf') || {}
  }

  // 获取股票配置
  getStockConfig(): StockConfig {
    return this.configs.get('stock') || { default_stocks: [], sector_mapping: {} }
  }

  // 获取新闻源配置
  getNewsConfig(): NewsConfig {
    return this.configs.get('news') || { sources: {}, filter_rules: {} }
  }

  // 获取配置状态
  getConfigStatus() {
    return {
      etf: this.configs.has('etf'),
      stock: this.configs.has('stock'),
      news: this.configs.has('news'),
      lastUpdated: new Date().toISOString()
    }
  }

  // 停止监听
  stopWatching() {
    for (const [filename, watcher] of this.watchers) {
      fs.unwatchFile(filename)
      console.log(`⏹️ 停止监听配置文件: ${filename}`)
    }
    this.watchers.clear()
  }
}

// 全局配置管理器实例
export const businessConfigManager = new BusinessConfigManager()

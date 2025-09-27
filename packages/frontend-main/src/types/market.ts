// 重新导出核心类型，确保向后兼容
export type {
  MarketEvent,
  HotspotAttribution,
  MarketBriefing
} from './core'

// ==================== 市场特定扩展类型 ====================

export interface StockPool {
  id: string
  name: string
  description: string
  symbols: string[]
  createdAt: string
  updatedAt: string
}

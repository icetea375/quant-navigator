import api from './index'
import type { MarketBriefing, MarketEvent, HotspotAttribution } from '@/types/market'

// 公共API - 市场雷达
export const marketApi = {
  // 获取市场简报
  getMarketBriefing: (date?: string) => 
    api.get<MarketBriefing>('/public/market-briefing', { params: { date } }),

  // 获取盘前高能事件
  getPreMarketEvents: (date?: string) => 
    api.get<MarketEvent[]>('/public/pre-market-events', { params: { date } }),

  // 获取盘后热点复盘
  getPostMarketHotspots: (date?: string) => 
    api.get<HotspotAttribution[]>('/public/post-market-hotspots', { params: { date } }),
}

// 私人API - AI投研助理
export const privateApi = {
  // 获取专属盘前雷达
  getMyBriefing: (date?: string) => 
    api.get<MarketBriefing>('/private/my-briefing', { params: { date } }),

  // 获取持仓异动归因
  getMyAttributions: (date?: string) => 
    api.get<HotspotAttribution[]>('/private/my-attributions', { params: { date } }),

  // 获取股票池列表
  getStockPools: () => 
    api.get('/private/stock-pools'),

  // 创建股票池
  createStockPool: (data: { name: string; description: string; symbols: string[] }) => 
    api.post('/private/stock-pools', data),

  // 更新股票池
  updateStockPool: (id: string, data: { name: string; description: string; symbols: string[] }) => 
    api.put(`/private/stock-pools/${id}`, data),

  // 删除股票池
  deleteStockPool: (id: string) => 
    api.delete(`/private/stock-pools/${id}`),
}

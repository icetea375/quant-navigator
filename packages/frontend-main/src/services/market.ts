import { request } from './http'
import { publicApi } from './public'
import { privateApi as privateApiService } from './private'
import type { MarketBriefing, MarketEvent, HotspotAttribution, StockPool } from '@/types/market'
import type { PaginatedResponse } from '@/types/core'
import type { MyAttributionResponse, StockPoolResponse } from '@/types/api'

// 市场API服务 - 整合公共和私人API
export const marketApi = {
  // 获取市场简报 - 使用公共API
  getMarketBriefing: (date?: string): Promise<MarketBriefing> => {
    return publicApi.getMarketBriefing(date).then(response => ({
      id: 'default',
      title: '市场简报',
      date: response.publish_time,
      keyEvents: [],
      marketSentiment: 'neutral',
      summary: response.content,
      events: [],
      hotspots: [],
      riskLevel: 'medium',
      recommendations: [],
      createdAt: response.publish_time,
      updatedAt: response.publish_time
    }))
  },

  // 获取盘前高能事件
  getPreMarketEvents: (date?: string, page = 1, pageSize = 20): Promise<PaginatedResponse<MarketEvent>> => {
    return request.get<PaginatedResponse<MarketEvent>>('/public/pre-market-events', {
      params: { date, page, pageSize },
      showLoading: true,
    })
  },

  // 获取盘后热点复盘
  getPostMarketHotspots: (date?: string, page = 1, pageSize = 20): Promise<PaginatedResponse<HotspotAttribution>> => {
    return request.get<PaginatedResponse<HotspotAttribution>>('/public/post-market-hotspots', {
      params: { date, page, pageSize },
      showLoading: true,
    }).then(response => ({
      success: true,
      data: response.data || [],
      pagination: {
        page: response.pagination?.page || page,
        limit: response.pagination?.limit || pageSize,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 0,
        hasNext: response.pagination?.hasNext || false,
        hasPrev: response.pagination?.hasPrev || false
      },
      timestamp: new Date().toISOString()
    }))
  },

  // 获取市场概览
  getMarketOverview: (): Promise<{
    marketStatus: string
    majorIndices: Array<{
      name: string
      value: number
      change: number
      changePercent: number
    }>
    hotSectors: Array<{
      name: string
      changePercent: number
      volume: number
    }>
  }> => {
    return request.get('/public/market-overview', { showLoading: true })
  },

  // 搜索股票
  searchStocks: (query: string): Promise<Array<{
    symbol: string
    name: string
    exchange: string
    currentPrice: number
    change: number
    changePercent: number
  }>> => {
    return request.get('/public/search-stocks', {
      params: { q: query },
      showLoading: false,
    })
  },

  // 获取股票详情
  getStockDetails: (symbol: string): Promise<{
    symbol: string
    name: string
    currentPrice: number
    change: number
    changePercent: number
    volume: number
    marketCap: number
    pe: number
    pb: number
    description: string
    news: Array<{
      title: string
      summary: string
      publishedAt: string
      source: string
    }>
  }> => {
    return request.get(`/public/stocks/${symbol}`, { showLoading: true })
  },
}

// 私人API - AI投研助理
export const privateApi = {
  // 获取专属盘前雷达 - 使用新的API结构
  getMyBriefing: (date?: string): Promise<MarketBriefing> => {
    return privateApiService.getMyBriefing(date).then(response => ({
      id: 'default',
      title: '专属盘前雷达',
      date: response.publish_time,
      keyEvents: [],
      marketSentiment: 'neutral',
      summary: response.content,
      events: [],
      hotspots: [],
      riskLevel: 'medium',
      recommendations: [],
      createdAt: response.publish_time,
      updatedAt: response.publish_time
    }))
  },

  // 获取持仓异动归因 - 使用新的API结构
  getMyAttributions: (date?: string): Promise<PaginatedResponse<HotspotAttribution>> => {
    return privateApiService.getMyAttribution(date).then((response: MyAttributionResponse[]) => ({
      success: true,
      data: response.map((item: MyAttributionResponse) => ({
        id: String(item.target_name),
        title: String(item.target_name),
        description: item.snapshot?.attribution || '',
        stockCodes: [String(item.target_name)],
        impact: 'medium' as const,
        confidence: item.snapshot?.confidence || 0,
        timestamp: item.snapshot?.timestamp || new Date().toISOString(),
        change: 0,
        changePercent: Number(item.change_pct) || 0,
        volume: item.snapshot?.volume || 0,
        attribution: item.snapshot?.attribution || '',
        category: 'market',
        source: 'ai_analysis'
      })),
      pagination: {
        page: 1,
        limit: response.length,
        total: response.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      },
      timestamp: new Date().toISOString()
    }))
  },

  // 获取AI投资建议
  getAIAdvice: (context?: {
    riskTolerance?: 'low' | 'medium' | 'high'
    investmentHorizon?: 'short' | 'medium' | 'long'
    focusAreas?: string[]
  }): Promise<{
    advice: string
    confidence: number
    reasoning: string[]
    riskLevel: 'low' | 'medium' | 'high'
    suggestedActions: Array<{
      action: string
      priority: 'high' | 'medium' | 'low'
      reasoning: string
    }>
  }> => {
    return request.post('/private/ai-advice', context, { showLoading: true })
  },

  // 获取个人投资组合概览
  getPortfolioOverview: (): Promise<{
    totalValue: number
    totalChange: number
    totalChangePercent: number
    positions: Array<{
      symbol: string
      name: string
      quantity: number
      currentPrice: number
      totalValue: number
      change: number
      changePercent: number
      weight: number
    }>
    performance: {
      daily: number
      weekly: number
      monthly: number
      yearly: number
    }
  }> => {
    return request.get('/private/portfolio/overview', { showLoading: true })
  },

  // 获取股票池列表 - 使用新的API结构
  getStockPools: (): Promise<PaginatedResponse<StockPool>> => {
    return privateApiService.getStockPools().then((response: StockPoolResponse[]) => ({
      success: true,
      data: response.map((pool: StockPoolResponse) => ({
        id: String(pool.id),
        name: String(pool.name),
        description: '',
        symbols: pool.items?.map((item) => item.code) || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })),
      pagination: {
        page: 1,
        limit: response.length,
        total: response.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      },
      timestamp: new Date().toISOString()
    }))
  },

  // 创建股票池 - 使用新的API结构
  createStockPool: (data: { name: string; description: string; symbols: string[] }): Promise<StockPool> => {
    return privateApiService.createStockPool({ name: data.name }).then((response: StockPoolResponse) => ({
      id: String(response.id),
      name: String(response.name),
      description: data.description,
      symbols: data.symbols,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))
  },

  // 更新股票池
  updateStockPool: (id: string, data: { name: string; description: string; symbols: string[] }): Promise<StockPool> => {
    return request.put<StockPool>(`/private/stock-pools/${id}`, data, { showLoading: true })
  },

  // 删除股票池
  deleteStockPool: (id: string): Promise<void> => {
    return request.delete<void>(`/private/stock-pools/${id}`, { showLoading: true })
  },

  // 获取股票池详情
  getStockPoolDetails: (id: string): Promise<StockPool & {
    performance: {
      totalReturn: number
      totalReturnPercent: number
      volatility: number
      sharpeRatio: number
    }
    positions: Array<{
      symbol: string
      name: string
      currentPrice: number
      change: number
      changePercent: number
      weight: number
    }>
  }> => {
    return request.get(`/private/stock-pools/${id}`, { showLoading: true })
  },

  // 添加股票到池
  addStockToPool: (poolId: string, symbol: string): Promise<void> => {
    return request.post<void>(`/private/stock-pools/${poolId}/stocks`, { symbol }, { showLoading: true })
  },

  // 从池中移除股票
  removeStockFromPool: (poolId: string, symbol: string): Promise<void> => {
    return request.delete<void>(`/private/stock-pools/${poolId}/stocks/${symbol}`, { showLoading: true })
  },

  // 获取个人设置
  getPersonalSettings: (): Promise<{
    riskTolerance: 'low' | 'medium' | 'high'
    investmentHorizon: 'short' | 'medium' | 'long'
    notificationSettings: {
      email: boolean
      sms: boolean
      push: boolean
    }
    watchlist: string[]
  }> => {
    return request.get('/private/settings', { showLoading: true })
  },

  // 更新个人设置
  updatePersonalSettings: (data: Record<string, unknown>): Promise<void> => {
    return request.put<void>('/private/settings', data, { showLoading: true })
  },
}

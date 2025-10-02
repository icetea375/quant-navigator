import { request } from './http'
import type {
  MarketBriefingResponse,
  HotspotAttributionResponse
} from '@/types/api'

// 公共API服务 - 符合文档规范
export const publicApi = {
  // 获取市场快报
  getMarketBriefing: (date?: string): Promise<MarketBriefingResponse> => {
    return request.get<MarketBriefingResponse>('/public/market-briefing', {
      params: { date },
      showLoading: true,
    })
  },

  // 获取热点复盘
  getHotspotAttribution: (date?: string): Promise<HotspotAttributionResponse[]> => {
    return request.get<HotspotAttributionResponse[]>('/public/hotspot-attribution', {
      params: { date },
      showLoading: true,
    })
  },
}

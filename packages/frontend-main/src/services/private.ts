import { request } from './http'
import type { 
  StockPoolResponse, 
  StockPoolItemResponse,
  MyBriefingResponse,
  MyAttributionResponse
} from '@/types/api'

// 私人API服务 - 符合文档规范
export const privateApi = {
  // ========== 股票池管理 ==========
  
  // 获取所有股票池
  getStockPools: (): Promise<StockPoolResponse[]> => {
    return request.get<StockPoolResponse[]>('/private/stock-pools', {
      showLoading: true,
    })
  },

  // 创建股票池
  createStockPool: (data: { name: string }): Promise<StockPoolResponse> => {
    return request.post<StockPoolResponse>('/private/stock-pools', data, {
      showLoading: true,
    })
  },

  // 获取单个股票池详情
  getStockPoolDetails: (poolId: string): Promise<StockPoolResponse> => {
    return request.get<StockPoolResponse>(`/private/stock-pools/${poolId}`, {
      showLoading: true,
    })
  },

  // 添加股票池条目
  addStockPoolItem: (poolId: string, data: { code: string; name: string; type: string }): Promise<StockPoolItemResponse> => {
    return request.post<StockPoolItemResponse>(`/private/stock-pools/${poolId}/items`, data, {
      showLoading: true,
    })
  },

  // 删除股票池条目
  deleteStockPoolItem: (itemId: string): Promise<{ message: string }> => {
    return request.delete<{ message: string }>(`/private/stock-pools/items/${itemId}`, {
      showLoading: true,
    })
  },

  // ========== 个性化分析 ==========

  // 获取专属盘前雷达
  getMyBriefing: (date?: string): Promise<MyBriefingResponse> => {
    return request.get<MyBriefingResponse>('/private/my-briefing', {
      params: { date },
      showLoading: true,
    })
  },

  // 获取持仓异动复盘
  getMyAttribution: (date?: string): Promise<MyAttributionResponse[]> => {
    return request.get<MyAttributionResponse[]>('/private/my-attribution', {
      params: { date },
      showLoading: true,
    })
  },
}

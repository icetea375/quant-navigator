import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { marketApi, privateApi } from '@/services/market'
import { logger } from '@/utils/logger'
import type { MarketBriefing, MarketEvent, HotspotAttribution, StockPool } from '@/types/market'

export const useMarketStore = defineStore('market', () => {
  // 公共市场数据
  const marketBriefing = ref<MarketBriefing | null>(null)
  const preMarketEvents = ref<MarketEvent[]>([])
  const postMarketHotspots = ref<HotspotAttribution[]>([])
  const marketOverview = ref<any>(null)

  // 私人数据
  const myBriefing = ref<MarketBriefing | null>(null)
  const myAttributions = ref<HotspotAttribution[]>([])
  const stockPools = ref<StockPool[]>([])
  const portfolioOverview = ref<any>(null)
  const aiAdvice = ref<any>(null)

  // 加载状态
  const loading = ref({
    marketBriefing: false,
    preMarketEvents: false,
    postMarketHotspots: false,
    marketOverview: false,
    myBriefing: false,
    myAttributions: false,
    stockPools: false,
    portfolioOverview: false,
    aiAdvice: false,
  })

  // 分页信息
  const pagination = ref({
    preMarketEvents: { page: 1, pageSize: 20, total: 0 },
    postMarketHotspots: { page: 1, pageSize: 20, total: 0 },
    myAttributions: { page: 1, pageSize: 20, total: 0 },
    stockPools: { page: 1, pageSize: 20, total: 0 },
  })

  // 计算属性
  const hasMarketData = computed(() => !!marketBriefing.value)
  const hasPersonalData = computed(() => !!myBriefing.value)
  const totalStockPools = computed(() => stockPools.value.length)

  // 公共市场数据方法
  const loadMarketBriefing = async (date?: string) => {
    loading.value.marketBriefing = true
    try {
      const data = await marketApi.getMarketBriefing(date)
      marketBriefing.value = data
    } catch (error) {
      logger.error('Failed to load market briefing:', error)
      throw error
    } finally {
      loading.value.marketBriefing = false
    }
  }

  const loadPreMarketEvents = async (date?: string, page = 1, pageSize = 20) => {
    loading.value.preMarketEvents = true
    try {
      const data = await marketApi.getPreMarketEvents(date, page, pageSize)
      preMarketEvents.value = data.data || []
      pagination.value.preMarketEvents = {
        page: data.pagination.page,
        pageSize: data.pagination.limit,
        total: data.pagination.total,
      }
    } catch (error) {
      logger.error('Failed to load pre-market events:', error)
      throw error
    } finally {
      loading.value.preMarketEvents = false
    }
  }

  const loadPostMarketHotspots = async (date?: string, page = 1, pageSize = 20) => {
    loading.value.postMarketHotspots = true
    try {
      const data = await marketApi.getPostMarketHotspots(date, page, pageSize)
      postMarketHotspots.value = data.data || []
      pagination.value.postMarketHotspots = {
        page: data.pagination.page,
        pageSize: data.pagination.limit,
        total: data.pagination.total,
      }
    } catch (error) {
      logger.error('Failed to load post-market hotspots:', error)
      throw error
    } finally {
      loading.value.postMarketHotspots = false
    }
  }

  const loadMarketOverview = async () => {
    loading.value.marketOverview = true
    try {
      const data = await marketApi.getMarketOverview()
      marketOverview.value = data
    } catch (error) {
      logger.error('Failed to load market overview:', error)
      throw error
    } finally {
      loading.value.marketOverview = false
    }
  }

  const searchStocks = async (query: string) => {
    try {
      return await marketApi.searchStocks(query)
    } catch (error) {
      logger.error('Failed to search stocks:', error)
      throw error
    }
  }

  const getStockDetails = async (symbol: string) => {
    try {
      return await marketApi.getStockDetails(symbol)
    } catch (error) {
      logger.error('Failed to get stock details:', error)
      throw error
    }
  }

  // 私人数据方法
  const loadMyBriefing = async (date?: string) => {
    loading.value.myBriefing = true
    try {
      const data = await privateApi.getMyBriefing(date)
      myBriefing.value = data
    } catch (error) {
      logger.error('Failed to load my briefing:', error)
      throw error
    } finally {
      loading.value.myBriefing = false
    }
  }

  const loadMyAttributions = async (date?: string, page = 1, pageSize = 20) => {
    loading.value.myAttributions = true
    try {
      const data = await privateApi.getMyAttributions(date)
      myAttributions.value = data.data || []
      pagination.value.myAttributions = {
        page: data.pagination.page,
        pageSize: data.pagination.limit,
        total: data.pagination.total,
      }
    } catch (error) {
      logger.error('Failed to load my attributions:', error)
      throw error
    } finally {
      loading.value.myAttributions = false
    }
  }

  const loadStockPools = async (page = 1, pageSize = 20) => {
    loading.value.stockPools = true
    try {
      const data = await privateApi.getStockPools()
      stockPools.value = data.data || []
      pagination.value.stockPools = {
        page: data.pagination.page,
        pageSize: data.pagination.limit,
        total: data.pagination.total,
      }
    } catch (error) {
      logger.error('Failed to load stock pools:', error)
      throw error
    } finally {
      loading.value.stockPools = false
    }
  }

  const loadPortfolioOverview = async () => {
    loading.value.portfolioOverview = true
    try {
      const data = await privateApi.getPortfolioOverview()
      portfolioOverview.value = data
    } catch (error) {
      logger.error('Failed to load portfolio overview:', error)
      throw error
    } finally {
      loading.value.portfolioOverview = false
    }
  }

  const getAIAdvice = async (context?: Record<string, unknown>) => {
    loading.value.aiAdvice = true
    try {
      const data = await privateApi.getAIAdvice(context)
      aiAdvice.value = data
      return data
    } catch (error) {
      logger.error('Failed to get AI advice:', error)
      throw error
    } finally {
      loading.value.aiAdvice = false
    }
  }

  // 股票池管理方法
  const createStockPool = async (data: { name: string; description: string; symbols: string[] }) => {
    try {
      const newPool = await privateApi.createStockPool(data)
      stockPools.value.unshift(newPool)
      return newPool
    } catch (error) {
      logger.error('Failed to create stock pool:', error)
      throw error
    }
  }

  const updateStockPool = async (id: string, data: { name: string; description: string; symbols: string[] }) => {
    try {
      const updatedPool = await privateApi.updateStockPool(id, data)
      const index = stockPools.value.findIndex(pool => pool.id === id)
      if (index !== -1) {
        stockPools.value[index] = updatedPool
      }
      return updatedPool
    } catch (error) {
      logger.error('Failed to update stock pool:', error)
      throw error
    }
  }

  const deleteStockPool = async (id: string) => {
    try {
      await privateApi.deleteStockPool(id)
      const index = stockPools.value.findIndex(pool => pool.id === id)
      if (index !== -1) {
        stockPools.value.splice(index, 1)
      }
    } catch (error) {
      logger.error('Failed to delete stock pool:', error)
      throw error
    }
  }

  const getStockPoolDetails = async (id: string) => {
    try {
      return await privateApi.getStockPoolDetails(id)
    } catch (error) {
      logger.error('Failed to get stock pool details:', error)
      throw error
    }
  }

  // 刷新所有数据
  const refreshAllData = async () => {
    const promises = []

    // 刷新公共数据
    promises.push(loadMarketBriefing())
    promises.push(loadPreMarketEvents())
    promises.push(loadPostMarketHotspots())
    promises.push(loadMarketOverview())

    // 刷新私人数据（如果已登录）
    const token = localStorage.getItem('token')
    if (token) {
      promises.push(loadMyBriefing())
      promises.push(loadMyAttributions())
      promises.push(loadStockPools())
      promises.push(loadPortfolioOverview())
    }

    try {
      await Promise.allSettled(promises)
    } catch (error) {
      logger.error('Failed to refresh all data:', error)
    }
  }

  // 清除所有数据
  const clearAllData = () => {
    marketBriefing.value = null
    preMarketEvents.value = []
    postMarketHotspots.value = []
    marketOverview.value = null
    myBriefing.value = null
    myAttributions.value = []
    stockPools.value = []
    portfolioOverview.value = null
    aiAdvice.value = null
  }

  return {
    // 状态
    marketBriefing,
    preMarketEvents,
    postMarketHotspots,
    marketOverview,
    myBriefing,
    myAttributions,
    stockPools,
    portfolioOverview,
    aiAdvice,
    loading,
    pagination,

    // 计算属性
    hasMarketData,
    hasPersonalData,
    totalStockPools,

    // 公共数据方法
    loadMarketBriefing,
    loadPreMarketEvents,
    loadPostMarketHotspots,
    loadMarketOverview,
    searchStocks,
    getStockDetails,

    // 私人数据方法
    loadMyBriefing,
    loadMyAttributions,
    loadStockPools,
    loadPortfolioOverview,
    getAIAdvice,

    // 股票池管理
    createStockPool,
    updateStockPool,
    deleteStockPool,
    getStockPoolDetails,

    // 工具方法
    refreshAllData,
    clearAllData,
  }
})

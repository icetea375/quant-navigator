// API服务测试
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { publicApi, privateApi, adminApi, authApi } from '@/services'
import { mockApiResponse, mockApiError } from '@/utils/test-utils'

// 模拟fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// 创建模拟响应工厂
const createMockResponse = (data: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
  headers: new Headers(),
  statusText: ok ? 'OK' : 'Error'
} as Response)

describe('API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 设置默认的成功响应
    mockFetch.mockResolvedValue(createMockResponse(mockApiResponse({})))

    // 模拟全局fetch
    global.fetch = mockFetch
  })

  describe('Public API', () => {
    it('should fetch market briefing', async () => {
      const mockData = {
        title: '今日市场快报',
        content: '市场整体表现平稳',
        publish_time: '2024-01-15T09:00:00Z'
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockApiResponse(mockData)))

      const result = await publicApi.getMarketBriefing()
      expect(result).toEqual(mockData)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/public/market-briefing'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Object)
        })
      )
    })

    it('should fetch hotspot attribution', async () => {
      const mockData = [
        {
          hotspot_name: '新能源板块',
          summary: '政策利好推动上涨',
          snapshots: [
            {
              timestamp: '2024-01-15T09:00:00Z',
              change_pct: 3.2,
              volume: 1000000,
              attribution: '政策利好 + 资金流入'
            }
          ]
        }
      ]

      mockFetch.mockResolvedValueOnce(createMockResponse(mockApiResponse(mockData)))

      const result = await publicApi.getHotspotAttribution()
      expect(result).toEqual(mockData)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/public/hotspot-attribution'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Object)
        })
      )
    })
  })

  describe('Private API', () => {
    it('should fetch stock pools', async () => {
      const mockData = [
        {
          id: '1',
          name: '我的股票池',
          item_count: 2,
          items: [
            { id: '1', code: '000001', name: '平安银行', type: 'stock' }
          ]
        }
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse(mockData))
      } as Response)

      const result = await privateApi.getStockPools()
      expect(result).toEqual(mockData)
    })

    it('should create stock pool', async () => {
      const mockData = {
        id: '1',
        name: '新股票池',
        item_count: 0
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse(mockData))
      } as Response)

      const result = await privateApi.createStockPool({ name: '新股票池' })
      expect(result).toEqual(mockData)
    })
  })

  describe('Admin API', () => {
    it('should fetch system status', async () => {
      const mockData = {
        data_pipeline_status: 'running',
        llm_service_health: 'healthy',
        db_connection: 'connected',
        last_update: '2024-01-15T09:00:00Z',
        error_count: 0,
        warning_count: 2
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse(mockData))
      } as Response)

      const result = await adminApi.getSystemStatus()
      expect(result).toEqual(mockData)
    })

    it('should fetch AI engine stats', async () => {
      const mockData = {
        total_requests: 1000,
        success_rate: 0.95,
        p95_latency_ms: 200,
        error_count: 50,
        last_request_time: '2024-01-15T09:00:00Z'
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse(mockData))
      } as Response)

      const result = await adminApi.getAIEngineStats()
      expect(result).toEqual(mockData)
    })
  })

  describe('Auth API', () => {
    it('should login user', async () => {
      const mockData = {
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'user'
        },
        token: 'mock-jwt-token'
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse(mockData))
      } as Response)

      const result = await authApi.login({
        username: 'testuser',
        password: 'password123'
      })
      expect(result).toEqual(mockData)
    })

    it('should register user', async () => {
      const mockData = {
        user: {
          id: '1',
          username: 'newuser',
          email: 'new@example.com',
          role: 'user'
        },
        token: 'mock-jwt-token'
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse(mockData))
      } as Response)

      const result = await authApi.register({
        username: 'newuser',
        password: 'password123',
        email: 'new@example.com'
      })
      expect(result).toEqual(mockData)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(publicApi.getMarketBriefing()).rejects.toThrow()
    })

    it('should handle API errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(mockApiError('API_ERROR', 'API error'))
      } as Response)

      await expect(publicApi.getMarketBriefing()).rejects.toThrow()
    })

    it('should handle 401 unauthorized', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve(mockApiError('UNAUTHORIZED', 'Unauthorized'))
      } as Response)

      await expect(privateApi.getStockPools()).rejects.toThrow()
    })

    it('should handle 403 forbidden', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve(mockApiError('FORBIDDEN', 'Forbidden'))
      } as Response)

      await expect(adminApi.getSystemStatus()).rejects.toThrow()
    })
  })
})

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage, ElLoading } from 'element-plus'
import { logger } from '@/utils/logger'
import type { ApiResponse, ApiError, RequestConfig } from '@/types/api'

// 扩展AxiosRequestConfig接口
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  showLoading?: boolean
  showError?: boolean
  metadata?: {
    startTime: number
  }
}

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求计数器，用于控制loading显示
let requestCount = 0
let loadingInstance: ReturnType<typeof ElLoading.service> | null = null

// 显示loading
const showLoading = () => {
  if (requestCount === 0) {
    loadingInstance = ElLoading.service({
      lock: true,
      text: '加载中...',
      background: 'rgba(0, 0, 0, 0.7)',
    })
  }
  requestCount++
}

// 隐藏loading
const hideLoading = () => {
  requestCount--
  if (requestCount <= 0) {
    requestCount = 0
    if (loadingInstance) {
      loadingInstance.close()
      loadingInstance = null
    }
  }
}

// 请求拦截器
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 添加认证token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      } as any
    }

    // 显示loading
    const shouldShowLoading = (config as ExtendedAxiosRequestConfig).showLoading !== false
    if (shouldShowLoading) {
      showLoading()
    }

    // 添加请求时间戳
    (config as ExtendedAxiosRequestConfig).metadata = { startTime: Date.now() }

    return config
  },
  (error) => {
    hideLoading()
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    hideLoading()

    // 计算请求耗时
    const startTime = (response.config as ExtendedAxiosRequestConfig).metadata?.startTime
    if (startTime) {
      const duration = Date.now() - startTime
      logger.info(`API请求耗时: ${duration}ms - ${response.config.url}`)
    }

    // 统一处理响应数据
    const { data } = response
    if (data.success === false) {
      const error: ApiError = {
        code: String(data.code || 'UNKNOWN_ERROR'),
        message: String(data.message || '请求失败'),
        details: data.data,
      }
      return Promise.reject(error)
    }

    return data.data
  },
  (error) => {
    hideLoading()

    // 处理网络错误
    if (!error.response) {
      const networkError: ApiError = {
        code: 'NETWORK_ERROR',
        message: '网络连接失败，请检查网络设置',
      }
      ElMessage.error(networkError.message)
      return Promise.reject(networkError)
    }

    const { status, data } = error.response
    let errorMessage = '请求失败'

    switch (status) {
      case 401:
        // 未授权，清除本地存储并跳转到登录页
        localStorage.removeItem('token')
        localStorage.removeItem('userRole')
        localStorage.removeItem('userInfo')
        window.location.href = '/login'
        return Promise.reject({
          code: 'UNAUTHORIZED',
          message: '登录已过期，请重新登录',
        })

      case 403:
        errorMessage = '没有权限访问此资源'
        break

      case 404:
        errorMessage = '请求的资源不存在'
        break

      case 422:
        errorMessage = data?.message || '请求参数错误'
        break

      case 429:
        errorMessage = '请求过于频繁，请稍后再试'
        break

      case 500:
        errorMessage = '服务器内部错误'
        break

      case 502:
        errorMessage = '网关错误'
        break

      case 503:
        errorMessage = '服务暂时不可用'
        break

      default:
        errorMessage = data?.message || `请求失败 (${status})`
    }

    const apiError: ApiError = {
      code: (data as any)?.code || `HTTP_${status}`,
      message: errorMessage,
      details: data,
    }

    // 显示错误消息
    if (error.config?.showError !== false) {
      ElMessage.error(apiError.message)
    }

    return Promise.reject(apiError)
  }
)

// 重试机制
const retryRequest = async (config: ExtendedAxiosRequestConfig, retries: number = 3): Promise<any> => {
  try {
    return await api(config)
  } catch (error: unknown) {
    if (retries > 0 && (error as Record<string, unknown>).code === 'NETWORK_ERROR') {
      logger.warn(`请求失败，${retries}次重试机会`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      return retryRequest(config, retries - 1)
    }
    throw error
  }
}

// 封装的请求方法
export const request = {
  get: <T = unknown>(url: string, config?: RequestConfig & ExtendedAxiosRequestConfig): Promise<T> => {
    return retryRequest({ ...config, method: 'GET', url })
  },

  post: <T = unknown>(url: string, data?: unknown, config?: RequestConfig & ExtendedAxiosRequestConfig): Promise<T> => {
    return retryRequest({ ...config, method: 'POST', url, data })
  },

  put: <T = unknown>(url: string, data?: unknown, config?: RequestConfig & ExtendedAxiosRequestConfig): Promise<T> => {
    return retryRequest({ ...config, method: 'PUT', url, data })
  },

  delete: <T = unknown>(url: string, config?: RequestConfig & ExtendedAxiosRequestConfig): Promise<T> => {
    return retryRequest({ ...config, method: 'DELETE', url })
  },

  patch: <T = unknown>(url: string, data?: unknown, config?: RequestConfig & ExtendedAxiosRequestConfig): Promise<T> => {
    return retryRequest({ ...config, method: 'PATCH', url, data })
  },

  upload: <T = unknown>(url: string, file: File, config?: RequestConfig & ExtendedAxiosRequestConfig): Promise<T> => {
    const formData = new FormData()
    formData.append('file', file)
    return retryRequest({
      ...config,
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    })
  },
}

export default api

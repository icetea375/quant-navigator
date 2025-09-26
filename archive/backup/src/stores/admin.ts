/**
 * Admin Store - AI训练中心状态管理
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface ReportSummary {
  reportId: string
  stockCode: string
  stockName: string
  reportDate: string
  summary: string
  feedbackStatus: 'pending' | 'good' | 'partial' | 'bad'
  reportType: string
  title: string
}

export interface ReportDetail {
  reportId: string
  title: string
  contentMarkdown: string
  evidencePayload: any
  reportType: string
  targetCode: string
  reportDate: string
  attributionFactors: any
  confidenceScore: number
  supportingEvidence: any
}

export interface FeedbackStats {
  totalReports: number
  pendingReviews: number
  goodReviews: number
  partialReviews: number
  badReviews: number
  averageRating: number
}

export const useAdminStore = defineStore('admin', () => {
  // 状态
  const reports = ref<ReportSummary[]>([])
  const selectedReport = ref<ReportDetail | null>(null)
  const stats = ref<FeedbackStats>({
    totalReports: 0,
    pendingReviews: 0,
    goodReviews: 0,
    partialReviews: 0,
    badReviews: 0,
    averageRating: 0
  })

  const currentFilters = ref<any>({})
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false
  })

  // 计算属性
  const pendingCount = computed(() => stats.value.pendingReviews)
  const accuracyRate = computed(() => {
    const totalRated = stats.value.goodReviews + stats.value.partialReviews + stats.value.badReviews
    return totalRated > 0 ? (stats.value.goodReviews / totalRated * 100).toFixed(1) : '0.0'
  })

  // 方法
  const fetchReports = async (filters: any = {}) => {
    try {
      currentFilters.value = { ...filters }
      pagination.value.page = 1

      const params = new URLSearchParams({
        ...filters,
        limit: pagination.value.limit.toString(),
        offset: '0'
      })

      const response = await fetch(`/api/v1/admin/reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('获取报告列表失败')
      }

      const data = await response.json()

      if (data.success) {
        reports.value = data.data.reports
        pagination.value.total = data.data.total
        pagination.value.hasMore = reports.value.length < pagination.value.total
      } else {
        throw new Error(data.error || '获取报告列表失败')
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
      throw error
    }
  }

  const loadMoreReports = async () => {
    try {
      const nextPage = pagination.value.page + 1
      const offset = (nextPage - 1) * pagination.value.limit

      const params = new URLSearchParams({
        ...currentFilters.value,
        limit: pagination.value.limit.toString(),
        offset: offset.toString()
      })

      const response = await fetch(`/api/v1/admin/reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('加载更多报告失败')
      }

      const data = await response.json()

      if (data.success) {
        reports.value.push(...data.data.reports)
        pagination.value.page = nextPage
        pagination.value.hasMore = reports.value.length < pagination.value.total
      } else {
        throw new Error(data.error || '加载更多报告失败')
      }
    } catch (error) {
      console.error('Failed to load more reports:', error)
      throw error
    }
  }

  const fetchReportDetail = async (reportId: string) => {
    try {
      const response = await fetch(`/api/v1/admin/reports/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('获取报告详情失败')
      }

      const data = await response.json()

      if (data.success) {
        selectedReport.value = data.data
      } else {
        throw new Error(data.error || '获取报告详情失败')
      }
    } catch (error) {
      console.error('Failed to fetch report detail:', error)
      throw error
    }
  }

  const submitFeedback = async (feedback: any) => {
    try {
      const response = await fetch('/api/v1/admin/feedback', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedback)
      })

      if (!response.ok) {
        throw new Error('提交反馈失败')
      }

      const data = await response.json()

      if (data.success) {
        // 更新本地状态
        const reportIndex = reports.value.findIndex(r => r.reportId === feedback.reportId)
        if (reportIndex !== -1) {
          reports.value[reportIndex].feedbackStatus = feedback.rating.toLowerCase()
        }

        // 刷新统计
        await fetchStats()

        return data.data
      } else {
        throw new Error(data.error || '提交反馈失败')
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      throw error
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v1/admin/stats', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('获取统计信息失败')
      }

      const data = await response.json()

      if (data.success) {
        stats.value = data.data
      } else {
        throw new Error(data.error || '获取统计信息失败')
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      throw error
    }
  }

  const clearSelectedReport = () => {
    selectedReport.value = null
  }

  const resetPagination = () => {
    pagination.value = {
      page: 1,
      limit: 20,
      total: 0,
      hasMore: false
    }
  }

  // 辅助函数
  const getAuthToken = (): string => {
    // 从localStorage或其他地方获取JWT token
    return localStorage.getItem('authToken') || ''
  }

  return {
    // 状态
    reports,
    selectedReport,
    stats,
    currentFilters,
    pagination,

    // 计算属性
    pendingCount,
    accuracyRate,

    // 方法
    fetchReports,
    loadMoreReports,
    fetchReportDetail,
    submitFeedback,
    fetchStats,
    clearSelectedReport,
    resetPagination
  }
})

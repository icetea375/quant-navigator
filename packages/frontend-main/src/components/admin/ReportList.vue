<template>
  <div class="report-list">
    <!-- 列表头部 -->
    <div class="list-header">
      <h3>报告列表</h3>
      <div class="list-stats">
        共 {{ props.total }} 条记录
      </div>
    </div>

    <!-- 加载状态 -->
    <div
      v-if="props.loading"
      class="loading-state"
    >
      <div class="spinner" />
      <p>加载中...</p>
    </div>

    <!-- 空状态 -->
    <div
      v-else-if="reports.length === 0"
      class="empty-state"
    >
      <div class="empty-icon">
        📄
      </div>
      <p>暂无报告数据</p>
    </div>

    <!-- 报告列表 -->
    <div
      v-else
      class="report-items"
    >
      <div
        v-for="report in reports"
        :key="report.reportId"
        class="report-item"
        :class="{
          'selected': props.selectedReportId === report.reportId,
          'pending': report.feedbackStatus === 'pending',
          'good': report.feedbackStatus === 'good',
          'partial': report.feedbackStatus === 'partial',
          'bad': report.feedbackStatus === 'bad'
        }"
        @click="handleReportSelect(report.reportId)"
      >
        <!-- 状态指示器 -->
        <div class="status-indicator">
          <div
            class="status-dot"
            :class="report.feedbackStatus"
          />
        </div>

        <!-- 报告信息 -->
        <div class="report-info">
          <div class="report-header">
            <span class="stock-name">{{ report.stockName }}</span>
            <span class="stock-code">{{ report.stockCode }}</span>
            <span class="report-type">{{ getReportTypeLabel(report.reportType) }}</span>
          </div>

          <div class="report-summary">
            {{ report.summary || '暂无摘要' }}
          </div>

          <div class="report-meta">
            <span class="report-date">{{ formatDate(report.reportDate) }}</span>
            <span class="feedback-status">{{ getStatusLabel(report.feedbackStatus) }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="report-actions">
          <button
            class="action-btn"
            @click.stop="handleReportSelect(report.reportId)"
          >
            查看详情
          </button>
        </div>
      </div>
    </div>

    <!-- 加载更多 -->
    <div
      v-if="props.hasMore && !props.loading"
      class="load-more"
    >
      <button
        class="load-more-btn"
        @click="handleLoadMore"
      >
        加载更多
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// computed 未使用，已移除

// 接口定义
interface Report {
  reportId: string
  stockCode: string
  stockName: string
  reportDate: string
  summary: string
  feedbackStatus: 'pending' | 'good' | 'partial' | 'bad'
  reportType: string
  title: string
}

// Props
interface Props {
  reports: Report[]
  loading?: boolean
  selectedReportId?: string | null
  total?: number
  hasMore?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  selectedReportId: null,
  total: 0,
  hasMore: false
})

// Emits
const emit = defineEmits<{
  reportSelect: [reportId: string]
  loadMore: []
}>()

// 方法
const handleReportSelect = (reportId: string) => {
  emit('reportSelect', reportId)
}

const handleLoadMore = () => {
  emit('loadMore')
}

const getReportTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    'anomaly_snapshot': '异动快照',
    'daily_brief': '市场快报',
    'attribution_analysis': '归因分析'
  }
  return typeMap[type] || type
}

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    'pending': '待审核',
    'good': '准确',
    'partial': '部分准确',
    'bad': '错误'
  }
  return statusMap[status] || status
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}
</script>

<style scoped>
.report-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
}

.list-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.list-stats {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #7f8c8d;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 10px;
}

.report-items {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.report-item {
  display: flex;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.report-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transform: translateY(-1px);
}

.report-item.selected {
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.report-item.pending {
  border-left: 4px solid #f39c12;
}

.report-item.good {
  border-left: 4px solid #27ae60;
}

.report-item.partial {
  border-left: 4px solid #e67e22;
}

.report-item.bad {
  border-left: 4px solid #e74c3c;
}

.status-indicator {
  margin-right: 15px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #bdc3c7;
}

.status-dot.pending {
  background: #f39c12;
}

.status-dot.good {
  background: #27ae60;
}

.status-dot.partial {
  background: #e67e22;
}

.status-dot.bad {
  background: #e74c3c;
}

.report-info {
  flex: 1;
  min-width: 0;
}

.report-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.stock-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1rem;
}

.stock-code {
  color: #7f8c8d;
  font-size: 0.9rem;
  background: #ecf0f1;
  padding: 2px 6px;
  border-radius: 4px;
}

.report-type {
  color: #3498db;
  font-size: 0.8rem;
  background: #e8f4fd;
  padding: 2px 6px;
  border-radius: 4px;
}

.report-summary {
  color: #555;
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.report-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #7f8c8d;
}

.feedback-status {
  font-weight: 500;
}

.report-actions {
  margin-left: 15px;
}

.action-btn {
  padding: 6px 12px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background: #2980b9;
}

.load-more {
  padding: 20px;
  text-align: center;
  border-top: 1px solid #e0e0e0;
}

.load-more-btn {
  padding: 10px 20px;
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.load-more-btn:hover {
  background: #7f8c8d;
}

@media (max-width: 768px) {
  .report-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .report-header {
    flex-wrap: wrap;
  }

  .report-actions {
    margin-left: 0;
    margin-top: 10px;
    width: 100%;
  }

  .action-btn {
    width: 100%;
  }
}
</style>

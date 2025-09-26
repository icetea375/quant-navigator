<template>
  <div class="ai-training-center">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>AI训练中心</h1>
      <p class="subtitle">人机协同的智能进化平台</p>
    </div>

    <!-- 统计概览 -->
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-number">{{ stats.totalReports }}</div>
        <div class="stat-label">总报告数</div>
      </div>
      <div class="stat-card pending">
        <div class="stat-number">{{ stats.pendingReviews }}</div>
        <div class="stat-label">待审核</div>
      </div>
      <div class="stat-card good">
        <div class="stat-number">{{ stats.goodReviews }}</div>
        <div class="stat-label">准确</div>
      </div>
      <div class="stat-card partial">
        <div class="stat-number">{{ stats.partialReviews }}</div>
        <div class="stat-label">部分准确</div>
      </div>
      <div class="stat-card bad">
        <div class="stat-number">{{ stats.badReviews }}</div>
        <div class="stat-label">错误</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ stats.averageRating.toFixed(1) }}</div>
        <div class="stat-label">平均评分</div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧报告列表 -->
      <div class="left-panel">
        <!-- 筛选栏 -->
        <FilterBar
          @filter-change="handleFilterChange"
          :loading="loading"
        />

        <!-- 报告列表 -->
        <ReportList
          :reports="reports"
          :loading="loading"
          :selected-report-id="selectedReportId"
          @report-select="handleReportSelect"
          @load-more="handleLoadMore"
        />
      </div>

      <!-- 右侧标注面板 -->
      <div class="right-panel">
        <AnnotationPanel
          :report="selectedReport"
          :loading="reportLoading"
          @feedback-submit="handleFeedbackSubmit"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import FilterBar from '../components/admin/FilterBar.vue'
import ReportList from '../components/admin/ReportList.vue'
import AnnotationPanel from '../components/admin/AnnotationPanel.vue'
import { useAdminStore } from '../stores/admin'

const adminStore = useAdminStore()

// 响应式数据
const loading = ref(false)
const reportLoading = ref(false)
const selectedReportId = ref<string | null>(null)

// 计算属性
const reports = computed(() => adminStore.reports)
const selectedReport = computed(() => adminStore.selectedReport)
const stats = computed(() => adminStore.stats)

// 方法
const handleFilterChange = async (filters: any) => {
  loading.value = true
  try {
    await adminStore.fetchReports(filters)
  } finally {
    loading.value = false
  }
}

const handleReportSelect = async (reportId: string) => {
  selectedReportId.value = reportId
  reportLoading.value = true
  try {
    await adminStore.fetchReportDetail(reportId)
  } finally {
    reportLoading.value = false
  }
}

const handleLoadMore = async () => {
  loading.value = true
  try {
    await adminStore.loadMoreReports()
  } finally {
    loading.value = false
  }
}

const handleFeedbackSubmit = async (feedback: any) => {
  try {
    await adminStore.submitFeedback(feedback)
    // 刷新当前报告状态
    if (selectedReportId.value) {
      await adminStore.fetchReportDetail(selectedReportId.value)
    }
    // 刷新报告列表
    await adminStore.fetchReports()
  } catch (error) {
    console.error('提交反馈失败:', error)
  }
}

// 生命周期
onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      adminStore.fetchStats(),
      adminStore.fetchReports()
    ])
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.ai-training-center {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-header h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 1.1rem;
  color: #7f8c8d;
  margin: 0;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card.pending {
  border-left: 4px solid #f39c12;
}

.stat-card.good {
  border-left: 4px solid #27ae60;
}

.stat-card.partial {
  border-left: 4px solid #e67e22;
}

.stat-card.bad {
  border-left: 4px solid #e74c3c;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9rem;
  color: #7f8c8d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  height: calc(100vh - 200px);
}

.left-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
}

.right-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
}

@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
    height: auto;
  }

  .left-panel,
  .right-panel {
    min-height: 500px;
  }
}
</style>

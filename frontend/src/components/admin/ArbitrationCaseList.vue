<template>
  <div class="arbitration-case-list">
    <!-- 页面标题和统计信息 -->
    <div class="list-header">
      <div class="header-content">
        <h1>⚖️ AI仲裁案件管理</h1>
        <p class="subtitle">智能仲裁预处理 - 人类智慧决策</p>
      </div>
      
      <!-- 统计卡片 -->
      <div class="stats-cards">
        <div class="stat-card pending">
          <div class="stat-icon">⏳</div>
          <div class="stat-content">
            <div class="stat-number">{{ statistics.pendingCases }}</div>
            <div class="stat-label">待仲裁</div>
          </div>
        </div>
        <div class="stat-card arbitrated">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-number">{{ statistics.arbitratedCases }}</div>
            <div class="stat-label">已仲裁</div>
          </div>
        </div>
        <div class="stat-card ignored">
          <div class="stat-icon">❌</div>
          <div class="stat-content">
            <div class="stat-number">{{ statistics.ignoredCases }}</div>
            <div class="stat-label">已忽略</div>
          </div>
        </div>
        <div class="stat-card total">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-number">{{ statistics.totalCases }}</div>
            <div class="stat-label">总计</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选和搜索栏 -->
    <div class="filter-section">
      <div class="filter-controls">
        <div class="filter-group">
          <label>状态筛选</label>
          <select v-model="filters.status" @change="loadCases">
            <option value="">全部状态</option>
            <option value="PENDING_HUMAN">待仲裁</option>
            <option value="ARBITRATED">已仲裁</option>
            <option value="IGNORED">已忽略</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>股票代码</label>
          <input 
            v-model="filters.stockCode" 
            type="text" 
            placeholder="输入股票代码"
            @input="debouncedLoadCases"
          />
        </div>
        
        <div class="filter-group">
          <label>日期范围</label>
          <div class="date-range">
            <input 
              v-model="filters.startDate" 
              type="date" 
              @change="loadCases"
            />
            <span>至</span>
            <input 
              v-model="filters.endDate" 
              type="date" 
              @change="loadCases"
            />
          </div>
        </div>
        
        <div class="filter-group">
          <label>排序方式</label>
          <select v-model="filters.sortBy" @change="loadCases">
            <option value="priority_score">优先级</option>
            <option value="created_at">创建时间</option>
            <option value="report_date">报告日期</option>
          </select>
          <select v-model="filters.sortOrder" @change="loadCases">
            <option value="DESC">降序</option>
            <option value="ASC">升序</option>
          </select>
        </div>
      </div>
      
      <div class="action-buttons">
        <button @click="refreshCases" class="refresh-btn" :disabled="loading">
          🔄 刷新
        </button>
        <button @click="batchIgnore" class="batch-ignore-btn" :disabled="!selectedCases.length">
          ❌ 批量忽略 ({{ selectedCases.length }})
        </button>
      </div>
    </div>

    <!-- 案件列表 -->
    <div class="cases-section">
      <div class="cases-header">
        <h2>案件列表</h2>
        <div class="pagination-info">
          显示 {{ pagination.start }} - {{ pagination.end }} 条，共 {{ pagination.total }} 条
        </div>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <!-- 案件卡片列表 -->
      <div v-else-if="cases.length > 0" class="cases-grid">
        <div 
          v-for="caseItem in cases" 
          :key="caseItem.id"
          class="case-card"
          :class="{
            'selected': selectedCases.includes(caseItem.id),
            'pending': caseItem.status === 'PENDING_HUMAN',
            'arbitrated': caseItem.status === 'ARBITRATED',
            'ignored': caseItem.status === 'IGNORED'
          }"
          @click="toggleSelection(caseItem.id)"
        >
          <!-- 选择框 -->
          <div class="selection-checkbox">
            <input 
              type="checkbox" 
              :checked="selectedCases.includes(caseItem.id)"
              @click.stop="toggleSelection(caseItem.id)"
            />
          </div>
          
          <!-- 案件头部信息 -->
          <div class="case-header">
            <div class="case-title">
              <span class="stock-code">{{ caseItem.stockCode }}</span>
              <span class="case-id">{{ caseItem.caseId }}</span>
            </div>
            <div class="case-meta">
              <span class="report-date">{{ formatDate(caseItem.reportDate) }}</span>
              <span class="status-badge" :class="caseItem.status">
                {{ getStatusText(caseItem.status) }}
              </span>
            </div>
          </div>
          
          <!-- 优先级和分歧度 -->
          <div class="case-metrics">
            <div class="metric-item">
              <span class="metric-label">优先级</span>
              <div class="metric-bar">
                <div 
                  class="metric-fill priority" 
                  :style="{ width: (caseItem.priorityScore * 100) + '%' }"
                ></div>
              </div>
              <span class="metric-value">{{ Math.round(caseItem.priorityScore * 100) }}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">分歧度</span>
              <div class="metric-bar">
                <div 
                  class="metric-fill divergence" 
                  :style="{ width: (caseItem.divergenceScore * 100) + '%' }"
                ></div>
              </div>
              <span class="metric-value">{{ Math.round(caseItem.divergenceScore * 100) }}%</span>
            </div>
          </div>
          
          <!-- 共识和争议摘要 -->
          <div class="case-summary">
            <div class="summary-item">
              <h4>🤝 共识点</h4>
              <p>{{ truncateText(caseItem.consensusSummary, 100) }}</p>
            </div>
            <div class="summary-item">
              <h4>⚡ 争议点</h4>
              <p>{{ truncateText(caseItem.conflictSummary, 100) }}</p>
            </div>
          </div>
          
          <!-- 操作按钮 -->
          <div class="case-actions">
            <button 
              @click.stop="viewCaseDetail(caseItem)" 
              class="view-btn"
            >
              👁️ 查看详情
            </button>
            <button 
              v-if="caseItem.status === 'PENDING_HUMAN'"
              @click.stop="arbitrateCase(caseItem)" 
              class="arbitrate-btn"
            >
              ⚖️ 开始仲裁
            </button>
            <button 
              v-if="caseItem.status === 'PENDING_HUMAN'"
              @click.stop="ignoreCase(caseItem)" 
              class="ignore-btn"
            >
              ❌ 忽略
            </button>
          </div>
          
          <!-- 创建时间 -->
          <div class="case-footer">
            <span class="created-time">
              创建于 {{ formatDateTime(caseItem.createdAt) }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>暂无案件</h3>
        <p>当前筛选条件下没有找到案件</p>
        <button @click="clearFilters" class="clear-filters-btn">
          清除筛选条件
        </button>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="pagination.totalPages > 1" class="pagination">
      <button 
        @click="goToPage(pagination.page - 1)" 
        :disabled="pagination.page <= 1"
        class="page-btn"
      >
        上一页
      </button>
      
      <div class="page-numbers">
        <button 
          v-for="page in visiblePages" 
          :key="page"
          @click="goToPage(page)"
          :class="{ active: page === pagination.page }"
          class="page-number"
        >
          {{ page }}
        </button>
      </div>
      
      <button 
        @click="goToPage(pagination.page + 1)" 
        :disabled="pagination.page >= pagination.totalPages"
        class="page-btn"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

// 类型定义
interface ArbitrationCase {
  id: string
  caseId: string
  reportDate: string
  stockCode: string
  qwenReportId: string
  doubaoReportId: string
  divergenceScore: number
  consensusSummary: string
  conflictSummary: string
  priorityScore: number
  status: 'PENDING_HUMAN' | 'ARBITRATED' | 'IGNORED'
  analysisMetadata: Record<string, any>
  humanDecision: any
  createdAt: string
  updatedAt: string
}

interface Statistics {
  totalCases: number
  pendingCases: number
  arbitratedCases: number
  ignoredCases: number
  averageProcessingTime: number
}

interface Filters {
  status: string
  stockCode: string
  startDate: string
  endDate: string
  sortBy: string
  sortOrder: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  start: number
  end: number
}

// 响应式数据
const router = useRouter()
const loading = ref(false)
const cases = ref<ArbitrationCase[]>([])
const selectedCases = ref<string[]>([])
const statistics = ref<Statistics>({
  totalCases: 0,
  pendingCases: 0,
  arbitratedCases: 0,
  ignoredCases: 0,
  averageProcessingTime: 0
})

const filters = reactive<Filters>({
  status: '',
  stockCode: '',
  startDate: '',
  endDate: '',
  sortBy: 'priority_score',
  sortOrder: 'DESC'
})

const pagination = reactive<Pagination>({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  start: 0,
  end: 0
})

// 计算属性
const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, pagination.page - 2)
  const end = Math.min(pagination.totalPages, pagination.page + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// 防抖加载
let loadTimeout: NodeJS.Timeout | null = null
const debouncedLoadCases = () => {
  if (loadTimeout) clearTimeout(loadTimeout)
  loadTimeout = setTimeout(() => {
    loadCases()
  }, 500)
}

// 方法
const loadCases = async () => {
  loading.value = true
  try {
    const queryParams = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
      ...filters
    })
    
    const response = await fetch(`/api/v1/admin/arbitration-cases?${queryParams}`)
    const data = await response.json()
    
    cases.value = data.cases
    pagination.total = data.total
    pagination.totalPages = data.totalPages
    pagination.start = (pagination.page - 1) * pagination.limit + 1
    pagination.end = Math.min(pagination.page * pagination.limit, pagination.total)
    
  } catch (error) {
    console.error('加载案件列表失败:', error)
  } finally {
    loading.value = false
  }
}

const loadStatistics = async () => {
  try {
    const response = await fetch('/api/v1/admin/arbitration-cases/statistics')
    statistics.value = await response.json()
  } catch (error) {
    console.error('加载统计信息失败:', error)
  }
}

const refreshCases = () => {
  loadCases()
  loadStatistics()
}

const toggleSelection = (caseId: string) => {
  const index = selectedCases.value.indexOf(caseId)
  if (index > -1) {
    selectedCases.value.splice(index, 1)
  } else {
    selectedCases.value.push(caseId)
  }
}

const batchIgnore = async () => {
  if (!selectedCases.value.length) return
  
  const confirmed = confirm(`确定要忽略选中的 ${selectedCases.value.length} 个案件吗？`)
  if (!confirmed) return
  
  try {
    const response = await fetch('/api/v1/admin/arbitration-cases/batch-ignore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        caseIds: selectedCases.value,
        reason: '批量忽略'
      })
    })
    
    if (response.ok) {
      selectedCases.value = []
      refreshCases()
    }
  } catch (error) {
    console.error('批量忽略失败:', error)
  }
}

const viewCaseDetail = (caseItem: ArbitrationCase) => {
  router.push(`/admin/arbitration/${caseItem.caseId}`)
}

const arbitrateCase = (caseItem: ArbitrationCase) => {
  router.push(`/admin/arbitration/${caseItem.caseId}/arbitrate`)
}

const ignoreCase = async (caseItem: ArbitrationCase) => {
  const confirmed = confirm(`确定要忽略案件 ${caseItem.caseId} 吗？`)
  if (!confirmed) return
  
  try {
    const response = await fetch(`/api/v1/admin/arbitration-cases/${caseItem.caseId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'IGNORED',
        reason: '手动忽略'
      })
    })
    
    if (response.ok) {
      refreshCases()
    }
  } catch (error) {
    console.error('忽略案件失败:', error)
  }
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= pagination.totalPages) {
    pagination.page = page
    loadCases()
  }
}

const clearFilters = () => {
  filters.status = ''
  filters.stockCode = ''
  filters.startDate = ''
  filters.endDate = ''
  pagination.page = 1
  loadCases()
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const getStatusText = (status: string) => {
  const statusMap = {
    'PENDING_HUMAN': '待仲裁',
    'ARBITRATED': '已仲裁',
    'IGNORED': '已忽略'
  }
  return statusMap[status] || status
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 监听筛选条件变化
watch(filters, () => {
  pagination.page = 1
  loadCases()
}, { deep: true })

// 生命周期
onMounted(() => {
  loadCases()
  loadStatistics()
})
</script>

<style scoped>
.arbitration-case-list {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.list-header {
  margin-bottom: 30px;
}

.header-content {
  text-align: center;
  margin-bottom: 20px;
}

.header-content h1 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.subtitle {
  color: #7f8c8d;
  font-size: 16px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-card.pending {
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
}

.stat-card.arbitrated {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
}

.stat-card.ignored {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.stat-card.total {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.stat-icon {
  font-size: 32px;
  margin-right: 15px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.filter-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.filter-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-weight: bold;
  color: #2c3e50;
}

.filter-group input,
.filter-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-range span {
  color: #7f8c8d;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
}

.refresh-btn,
.batch-ignore-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn {
  background-color: #3498db;
  color: white;
}

.refresh-btn:hover:not(:disabled) {
  background-color: #2980b9;
}

.batch-ignore-btn {
  background-color: #e74c3c;
  color: white;
}

.batch-ignore-btn:hover:not(:disabled) {
  background-color: #c0392b;
}

.batch-ignore-btn:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.cases-section {
  margin-bottom: 30px;
}

.cases-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.cases-header h2 {
  color: #2c3e50;
  margin: 0;
}

.pagination-info {
  color: #7f8c8d;
  font-size: 14px;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.cases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.case-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.case-card:hover {
  border-color: #3498db;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.case-card.selected {
  border-color: #e74c3c;
  background-color: #fdf2f2;
}

.case-card.pending {
  border-left: 4px solid #f39c12;
}

.case-card.arbitrated {
  border-left: 4px solid #27ae60;
}

.case-card.ignored {
  border-left: 4px solid #e74c3c;
}

.selection-checkbox {
  position: absolute;
  top: 15px;
  right: 15px;
}

.case-header {
  margin-bottom: 15px;
}

.case-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.stock-code {
  font-size: 20px;
  font-weight: bold;
  color: #2c3e50;
}

.case-id {
  font-size: 12px;
  color: #7f8c8d;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
}

.case-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.report-date {
  color: #7f8c8d;
  font-size: 14px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.status-badge.PENDING_HUMAN {
  background-color: #f39c12;
  color: white;
}

.status-badge.ARBITRATED {
  background-color: #27ae60;
  color: white;
}

.status-badge.IGNORED {
  background-color: #e74c3c;
  color: white;
}

.case-metrics {
  margin-bottom: 15px;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.metric-label {
  min-width: 60px;
  font-size: 12px;
  color: #7f8c8d;
}

.metric-bar {
  flex: 1;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.metric-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.metric-fill.priority {
  background-color: #3498db;
}

.metric-fill.divergence {
  background-color: #e74c3c;
}

.metric-value {
  min-width: 40px;
  text-align: right;
  font-size: 12px;
  font-weight: bold;
}

.case-summary {
  margin-bottom: 15px;
}

.summary-item {
  margin-bottom: 10px;
}

.summary-item h4 {
  font-size: 12px;
  color: #2c3e50;
  margin: 0 0 5px 0;
}

.summary-item p {
  font-size: 12px;
  color: #7f8c8d;
  margin: 0;
  line-height: 1.4;
}

.case-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.case-actions button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-btn {
  background-color: #3498db;
  color: white;
}

.view-btn:hover {
  background-color: #2980b9;
}

.arbitrate-btn {
  background-color: #27ae60;
  color: white;
}

.arbitrate-btn:hover {
  background-color: #229954;
}

.ignore-btn {
  background-color: #e74c3c;
  color: white;
}

.ignore-btn:hover {
  background-color: #c0392b;
}

.case-footer {
  border-top: 1px solid #e0e0e0;
  padding-top: 10px;
}

.created-time {
  font-size: 11px;
  color: #bdc3c7;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state h3 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.empty-state p {
  color: #7f8c8d;
  margin-bottom: 20px;
}

.clear-filters-btn {
  padding: 10px 20px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.clear-filters-btn:hover {
  background-color: #2980b9;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 30px;
}

.page-btn,
.page-number {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled),
.page-number:hover {
  background-color: #f8f9fa;
}

.page-btn:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
  opacity: 0.5;
}

.page-number.active {
  background-color: #3498db;
  color: white;
  border-color: #3498db;
}

.page-numbers {
  display: flex;
  gap: 5px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-controls {
    grid-template-columns: 1fr;
  }
  
  .cases-grid {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    justify-content: stretch;
  }
  
  .action-buttons button {
    flex: 1;
  }
}
</style>

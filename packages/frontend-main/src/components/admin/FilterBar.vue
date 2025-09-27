<template>
  <div class="filter-bar">
    <div class="filter-row">
      <!-- 时间范围选择器 -->
      <div class="filter-group">
        <label>时间范围</label>
        <select
          v-model="filters.dateRange"
          @change="handleFilterChange"
        >
          <option value="7">
            过去7天
          </option>
          <option value="1">
            昨天
          </option>
          <option value="30">
            过去30天
          </option>
          <option value="custom">
            自定义
          </option>
        </select>
      </div>

      <!-- 自定义日期范围 -->
      <div
        v-if="filters.dateRange === 'custom'"
        class="filter-group"
      >
        <label>开始日期</label>
        <input
          v-model="filters.startDate"
          type="date"
          @change="handleFilterChange"
        >
      </div>

      <div
        v-if="filters.dateRange === 'custom'"
        class="filter-group"
      >
        <label>结束日期</label>
        <input
          v-model="filters.endDate"
          type="date"
          @change="handleFilterChange"
        >
      </div>

      <!-- 报告类型筛选 -->
      <div class="filter-group">
        <label>报告类型</label>
        <select
          v-model="filters.reportType"
          @change="handleFilterChange"
        >
          <option value="">
            全部
          </option>
          <option value="anomaly_snapshot">
            异动归因快照
          </option>
          <option value="daily_brief">
            每日市场快报
          </option>
          <option value="attribution_analysis">
            归因分析
          </option>
        </select>
      </div>

      <!-- 审核状态筛选 -->
      <div class="filter-group">
        <label>审核状态</label>
        <select
          v-model="filters.feedbackStatus"
          @change="handleFilterChange"
        >
          <option value="">
            全部
          </option>
          <option value="pending">
            待审核
          </option>
          <option value="good">
            准确
          </option>
          <option value="partial">
            部分准确
          </option>
          <option value="bad">
            错误
          </option>
        </select>
      </div>

      <!-- 股票代码搜索 -->
      <div class="filter-group">
        <label>股票代码</label>
        <input
          v-model="filters.stockCode"
          type="text"
          placeholder="输入股票代码"
          @input="handleStockCodeChange"
        >
      </div>

      <!-- 重置按钮 -->
      <div class="filter-group">
        <button
          class="reset-btn"
          @click="resetFilters"
        >
          重置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

// Props
interface Props {
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits
const emit = defineEmits<{
  filterChange: [filters: any]
}>()

// 响应式数据
const filters = ref({
  dateRange: '7',
  startDate: '',
  endDate: '',
  reportType: '',
  feedbackStatus: '',
  stockCode: ''
})

// 计算属性
const computedFilters = computed(() => {
  const result: any = {}

  if (filters.value.dateRange === 'custom') {
    if (filters.value.startDate) {
      result.startDate = filters.value.startDate
    }
    if (filters.value.endDate) {
      result.endDate = filters.value.endDate
    }
  } else {
    const days = parseInt(filters.value.dateRange)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    result.startDate = startDate.toISOString().split('T')[0]
    result.endDate = endDate.toISOString().split('T')[0]
  }

  if (filters.value.reportType) {
    result.reportType = filters.value.reportType
  }

  if (filters.value.feedbackStatus) {
    result.feedbackStatus = filters.value.feedbackStatus
  }

  if (filters.value.stockCode) {
    result.stockCode = filters.value.stockCode
  }

  return result
})

// 方法
const handleFilterChange = () => {
  emit('filterChange', computedFilters.value)
}

const handleStockCodeChange = debounce(() => {
  handleFilterChange()
}, 500)

const resetFilters = () => {
  filters.value = {
    dateRange: '7',
    startDate: '',
    endDate: '',
    reportType: '',
    feedbackStatus: '',
    stockCode: ''
  }
  handleFilterChange()
}

// 防抖函数
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
</script>

<style scoped>
.filter-bar {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
}

.filter-row {
  display: flex;
  gap: 20px;
  align-items: end;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 120px;
}

.filter-group label {
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 5px;
  font-weight: 500;
}

.filter-group select,
.filter-group input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.filter-group select:focus,
.filter-group input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.reset-btn {
  padding: 8px 16px;
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.reset-btn:hover {
  background: #7f8c8d;
}

@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    min-width: auto;
  }
}
</style>

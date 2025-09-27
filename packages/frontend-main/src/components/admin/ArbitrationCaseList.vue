<template>
  <el-card class="case-list-card">
    <template #header>
      <h3>仲裁案例列表</h3>
    </template>

    <div class="case-list">
      <div
        v-for="caseItem in cases"
        :key="caseItem.caseId"
        :class="['case-item', { active: currentCaseId === caseItem.caseId }]"
        @click="handleCaseSelect(caseItem.caseId)"
      >
        <div class="case-info">
          <div class="case-header">
            <span class="stock-name">{{ caseItem.stockName }}</span>
            <el-tag
              :type="getCaseStatusType(caseItem.status)"
              size="small"
            >
              {{ getCaseStatusLabel(caseItem.status) }}
            </el-tag>
          </div>
          <div class="case-meta">
            <span class="stock-code">{{ caseItem.stockCode }}</span>
            <span class="report-date">{{ formatDate(caseItem.reportDate) }}</span>
          </div>
        </div>
        <div class="case-priority">
          <el-tag
            :type="getPriorityType(caseItem.priority)"
            size="small"
          >
            P{{ caseItem.priority }}
          </el-tag>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ArbitrationCaseInfo } from '@/types/arbitration'

// ==================== Props ====================
interface Props {
  cases: ArbitrationCaseInfo[]
  currentCaseId: string | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// ==================== Emits ====================
interface Emits {
  (e: 'case-select', caseId: string): void
}

const emit = defineEmits<Emits>()

// ==================== Methods ====================
const handleCaseSelect = (caseId: string) => {
  emit('case-select', caseId)
}

const getCaseStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'warning',
    in_progress: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return statusMap[status] || 'info'
}

const getCaseStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

const getPriorityType = (priority: number) => {
  if (priority <= 2) return 'danger'
  if (priority <= 4) return 'warning'
  return 'info'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.case-list-card {
  height: 100%;
}

.case-list {
  max-height: 600px;
  overflow-y: auto;
}

.case-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.case-item:hover {
  background-color: #f5f7fa;
  border-color: #409eff;
}

.case-item.active {
  background-color: #ecf5ff;
  border-color: #409eff;
}

.case-info {
  flex: 1;
}

.case-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.stock-name {
  font-weight: 500;
  color: #303133;
}

.case-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

.stock-code {
  font-family: 'Courier New', monospace;
}

.case-priority {
  margin-left: 12px;
}
</style>

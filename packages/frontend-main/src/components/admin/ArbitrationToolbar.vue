<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <h2 class="dashboard-title">
        AI治理中心 - 仲裁仪表盘
      </h2>
      <el-tag
        v-if="currentCase"
        type="info"
      >
        当前案例: {{ currentCase.stockName }} ({{ currentCase.stockCode }})
      </el-tag>
    </div>

    <div class="toolbar-right">
      <el-button
        type="primary"
        :icon="Refresh"
        :loading="loading"
        @click="handleRefresh"
      >
        刷新数据
      </el-button>

      <el-button
        type="default"
        :icon="Setting"
        @click="handleSettings"
      >
        设置
      </el-button>

      <el-button
        type="default"
        :icon="isFullscreen ? 'FullScreenExit' : 'FullScreen'"
        @click="handleToggleFullscreen"
      >
        {{ isFullscreen ? '退出全屏' : '全屏' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Refresh, Setting } from '@element-plus/icons-vue'
import type { ArbitrationCaseInfo } from '@/types/arbitration'

// ==================== Props ====================
interface Props {
  currentCase: ArbitrationCaseInfo | null
  loading?: boolean
  isFullscreen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  isFullscreen: false
})

// ==================== Emits ====================
interface Emits {
  (e: 'refresh'): void
  (e: 'settings'): void
  (e: 'toggle-fullscreen'): void
}

const emit = defineEmits<Emits>()

// ==================== Methods ====================
const handleRefresh = () => {
  emit('refresh')
}

const handleSettings = () => {
  emit('settings')
}

const handleToggleFullscreen = () => {
  emit('toggle-fullscreen')
}
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.dashboard-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>

<template>
  <div class="system-brain-console">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>系统大脑控制台</h1>
      <p>监控和管理量化分析系统的运行状态</p>
    </div>

    <!-- 系统状态概览 -->
    <el-row
      :gutter="20"
      class="status-overview"
    >
      <el-col
        :xs="24"
        :sm="12"
        :md="6"
      >
        <el-card class="status-card">
          <div class="status-item">
            <div class="status-icon running">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="status-content">
              <div class="status-title">
                系统状态
              </div>
              <div
                class="status-value"
                :class="systemStatus.isRunning ? 'success' : 'error'"
              >
                {{ systemStatus.isRunning ? '运行中' : '已停止' }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col
        :xs="24"
        :sm="12"
        :md="6"
      >
        <el-card class="status-card">
          <div class="status-item">
            <div class="status-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="status-content">
              <div class="status-title">
                最后更新
              </div>
              <div class="status-value">
                {{ formatTime(systemStatus.lastUpdate) }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col
        :xs="24"
        :sm="12"
        :md="6"
      >
        <el-card class="status-card">
          <div class="status-item">
            <div class="status-icon error">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="status-content">
              <div class="status-title">
                错误数量
              </div>
              <div class="status-value error">
                {{ systemStatus.errorCount }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col
        :xs="24"
        :sm="12"
        :md="6"
      >
        <el-card class="status-card">
          <div class="status-item">
            <div class="status-icon warning">
              <el-icon><InfoFilled /></el-icon>
            </div>
            <div class="status-content">
              <div class="status-title">
                警告数量
              </div>
              <div class="status-value warning">
                {{ systemStatus.warningCount }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 功能模块 -->
    <el-row
      :gutter="20"
      class="modules-section"
    >
      <el-col
        :xs="24"
        :md="12"
      >
        <el-card class="module-card">
          <template #header>
            <div class="card-header">
              <h3>数据管道监控</h3>
              <el-button
                type="primary"
                size="small"
                @click="refreshDataPipeline"
              >
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <DataPipelineMonitor />
        </el-card>
      </el-col>

      <el-col
        :xs="24"
        :md="12"
      >
        <el-card class="module-card">
          <template #header>
            <div class="card-header">
              <h3>AI引擎状态</h3>
              <el-button
                type="primary"
                size="small"
                @click="refreshAIEngines"
              >
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <AIEngineMonitor />
        </el-card>
      </el-col>
    </el-row>

    <!-- 系统配置 -->
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <h3>系统配置</h3>
          <div class="header-actions">
            <el-button
              type="primary"
              size="small"
              @click="saveConfig"
            >
              <el-icon><Check /></el-icon>
              保存配置
            </el-button>
            <el-button
              size="small"
              @click="resetConfig"
            >
              <el-icon><RefreshLeft /></el-icon>
              重置
            </el-button>
          </div>
        </div>
      </template>
      <SystemConfigPanel />
    </el-card>

    <!-- 日志监控 -->
    <el-card class="logs-card">
      <template #header>
        <div class="card-header">
          <h3>系统日志</h3>
          <div class="header-actions">
            <el-select
              v-model="logLevel"
              placeholder="日志级别"
              size="small"
              style="width: 120px; margin-right: 10px;"
            >
              <el-option
                label="全部"
                value="all"
              />
              <el-option
                label="错误"
                value="error"
              />
              <el-option
                label="警告"
                value="warning"
              />
              <el-option
                label="信息"
                value="info"
              />
            </el-select>
            <el-button
              type="primary"
              size="small"
              @click="refreshLogs"
            >
              <el-icon><Refresh /></el-icon>
              刷新日志
            </el-button>
          </div>
        </div>
      </template>
      <SystemLogsPanel :log-level="logLevel" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import DataPipelineMonitor from '@/components/admin/DataPipelineMonitor.vue'
import AIEngineMonitor from '@/components/admin/AIEngineMonitor.vue'
import SystemConfigPanel from '@/components/admin/SystemConfigPanel.vue'
import SystemLogsPanel from '@/components/admin/SystemLogsPanel.vue'
import {
  CircleCheck, Clock, Warning, InfoFilled, Refresh,
  Check, RefreshLeft
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const adminStore = useAdminStore()

const systemStatus = ref({
  isRunning: true,
  lastUpdate: new Date().toISOString(),
  errorCount: 0,
  warningCount: 2
})

const logLevel = ref('all')

const formatTime = (dateString: string) => {
  return dayjs(dateString).format('MM-DD HH:mm:ss')
}

const refreshDataPipeline = () => {
  // TODO: 刷新数据管道状态
  console.log('Refreshing data pipeline...')
}

const refreshAIEngines = () => {
  // TODO: 刷新AI引擎状态
  console.log('Refreshing AI engines...')
}

const saveConfig = () => {
  // TODO: 保存系统配置
  console.log('Saving config...')
}

const resetConfig = () => {
  // TODO: 重置系统配置
  console.log('Resetting config...')
}

const refreshLogs = () => {
  // TODO: 刷新系统日志
  console.log('Refreshing logs...')
}

onMounted(() => {
  // 初始化系统状态
  adminStore.updateSystemStatus(systemStatus.value)
})
</script>

<style scoped>
.system-brain-console {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-header h1 {
  font-size: 32px;
  color: #333;
  margin-bottom: 10px;
}

.page-header p {
  color: #666;
  font-size: 16px;
}

.status-overview {
  margin-bottom: 30px;
}

.status-card {
  height: 100%;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.status-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.status-icon.running {
  background: #67c23a;
}

.status-icon.error {
  background: #f56c6c;
}

.status-icon.warning {
  background: #e6a23c;
}

.status-content {
  flex: 1;
}

.status-title {
  font-size: 14px;
  color: #999;
  margin-bottom: 5px;
}

.status-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.status-value.success {
  color: #67c23a;
}

.status-value.error {
  color: #f56c6c;
}

.status-value.warning {
  color: #e6a23c;
}

.modules-section {
  margin-bottom: 30px;
}

.module-card,
.config-card,
.logs-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

@media (max-width: 768px) {
  .system-brain-console {
    padding: 10px;
  }

  .page-header h1 {
    font-size: 24px;
  }

  .status-item {
    flex-direction: column;
    text-align: center;
  }

  .header-actions {
    flex-direction: column;
    gap: 5px;
  }
}
</style>

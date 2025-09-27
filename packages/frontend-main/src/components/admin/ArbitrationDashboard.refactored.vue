<template>
  <div
    class="arbitration-dashboard"
    data-testid="arbitration-dashboard"
  >
    <!-- 顶部工具栏 -->
    <ArbitrationToolbar
      :current-case="currentCase"
      :loading="loading"
      :is-fullscreen="isFullscreen"
      @refresh="handleRefresh"
      @settings="handleSettings"
      @toggle-fullscreen="handleToggleFullscreen"
    />

    <!-- 案例选择侧边栏 -->
    <div
      v-if="!isFullscreen"
      class="sidebar"
    >
      <ArbitrationCaseList
        :cases="cases"
        :current-case-id="currentCaseId"
        :loading="loading"
        @case-select="handleCaseSelect"
      />
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 加载状态 -->
      <div
        v-if="loading"
        class="loading-container"
        data-testid="loading"
      >
        <el-skeleton
          :rows="4"
          animated
        />
        <p class="loading-text">
          加载中...
        </p>
      </div>

      <!-- 错误状态 -->
      <el-alert
        v-else-if="error"
        type="error"
        :title="error"
        show-icon
        closable
        data-testid="error"
        @close="handleErrorClose"
      />

      <!-- 数据面板区域 -->
      <DataPanelContainer
        v-else-if="caseData"
        :case-data="caseData"
        :loading="loading"
        :error="error"
        :maximized-panel="maximizedPanel"
        @toggle-maximize="handleToggleMaximize"
        @close-panel="handleClosePanel"
        @text-highlight="handleTextHighlight"
        @event-select="handleEventSelect"
        @period-select="handlePeriodSelect"
        @metric-hover="handleMetricHover"
        @signal-hover="handleSignalHover"
        @signal-click="handleSignalClick"
        @flow-hover="handleFlowHover"
        @chip-hover="handleChipHover"
        @precedent-select="handlePrecedentSelect"
        @precedent-hover="handlePrecedentHover"
      />

      <!-- 空状态 -->
      <el-empty
        v-else
        description="请选择一个仲裁案例"
        data-testid="empty"
      />
    </div>

    <!-- 仲裁决策弹窗 -->
    <ArbitrationDecisionDialog
      v-model:visible="showArbitrationDialog"
      :submitting="submittingDecision"
      @submit="handleSubmitDecision"
      @cancel="handleCancelDecision"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useArbitrationStore } from '@/stores/arbitration'
import ArbitrationToolbar from './ArbitrationToolbar.vue'
import ArbitrationCaseList from './ArbitrationCaseList.vue'
import DataPanelContainer from './DataPanelContainer.vue'
import ArbitrationDecisionDialog from './ArbitrationDecisionDialog.vue'

// ==================== Props ====================
interface Props {
  caseId?: string
}

const props = defineProps<Props>()

// ==================== Store ====================
const arbitrationStore = useArbitrationStore()

// ==================== State ====================
const isFullscreen = ref(false)
const showArbitrationDialog = ref(false)
const submittingDecision = ref(false)

// ==================== Computed ====================
const currentCaseId = computed(() => arbitrationStore.currentCaseId)
const currentCase = computed(() => arbitrationStore.currentCase)
const caseData = computed(() => arbitrationStore.caseData)
const loading = computed(() => arbitrationStore.loading)
const error = computed(() => arbitrationStore.error)
const cases = computed(() => arbitrationStore.cases)
const maximizedPanel = computed(() => arbitrationStore.maximizedPanel)

// ==================== Methods ====================
const handleRefresh = async () => {
  if (currentCaseId.value) {
    await arbitrationStore.fetchCaseData(currentCaseId.value)
  } else {
    await arbitrationStore.fetchCases()
  }
}

const handleSettings = () => {
  ElMessage.info('设置功能待实现')
}

const handleToggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const handleCaseSelect = async (caseId: string) => {
  await arbitrationStore.fetchCaseData(caseId)
}

const handleToggleMaximize = (panelId: string) => {
  arbitrationStore.setMaximizedPanel(
    maximizedPanel.value === panelId ? null : panelId
  )
}

const handleClosePanel = (panelId: string) => {
  if (maximizedPanel.value === panelId) {
    arbitrationStore.setMaximizedPanel(null)
  }
}

const handleTextHighlight = (text: string, keywords: string[]) => {
  console.log('文本高亮:', text, keywords)
}

const handleEventSelect = (event: any) => {
  console.log('选择事件:', event)
}

const handlePeriodSelect = (period: string) => {
  console.log('选择期间:', period)
}

const handleMetricHover = (metric: string, value: number) => {
  console.log('指标悬浮:', metric, value)
}

const handleSignalHover = (signal: string, value: number) => {
  console.log('信号悬浮:', signal, value)
}

const handleSignalClick = (signal: any) => {
  console.log('点击信号:', signal)
}

const handleFlowHover = (flow: any) => {
  console.log('资金流向悬浮:', flow)
}

const handleChipHover = (chip: any) => {
  console.log('筹码悬浮:', chip)
}

const handlePrecedentSelect = (precedent: any) => {
  console.log('选择先例:', precedent)
}

const handlePrecedentHover = (precedent: any) => {
  console.log('先例悬浮:', precedent)
}

const handleErrorClose = () => {
  arbitrationStore.clearError()
}

const handleSubmitDecision = async (form: any) => {
  try {
    submittingDecision.value = true
    await arbitrationStore.submitArbitration(form)
    ElMessage.success('仲裁决策提交成功')
    showArbitrationDialog.value = false
  } catch (err) {
    ElMessage.error('提交失败，请重试')
  } finally {
    submittingDecision.value = false
  }
}

const handleCancelDecision = () => {
  showArbitrationDialog.value = false
}

// ==================== Lifecycle ====================
onMounted(async () => {
  await arbitrationStore.fetchCases()
  arbitrationStore.loadLayoutFromStorage()
})

// ==================== Watchers ====================
watch(maximizedPanel, (newPanel) => {
  arbitrationStore.setMaximizedPanel(newPanel)
})
</script>

<style scoped>
.arbitration-dashboard {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.sidebar {
  width: 300px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.loading-container {
  padding: 40px;
  text-align: center;
}

.loading-text {
  margin-top: 16px;
  color: #909399;
}
</style>

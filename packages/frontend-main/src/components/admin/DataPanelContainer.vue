<template>
  <div
    class="panels-container"
    data-testid="content"
  >
    <!-- 五大数据面板 -->
    <el-row
      :gutter="16"
      class="panels-grid"
    >
      <!-- 原始文本浏览器 -->
      <el-col :span="12">
        <el-card class="panel-card">
          <template #header>
            <div class="panel-header">
              <h4>原始文本浏览器</h4>
              <div class="panel-actions">
                <el-button
                  type="text"
                  :icon="isMaximized('raw-text') ? 'Minus' : 'Plus'"
                  @click="handleToggleMaximize('raw-text')"
                />
                <el-button
                  type="text"
                  icon="Close"
                  @click="handleClosePanel('raw-text')"
                />
              </div>
            </div>
          </template>
          <RawTextExplorer
            :data="caseData?.panels?.rawTextExplorer || []"
            :loading="loading"
            :error="error ?? undefined"
            @text-highlight="handleTextHighlight"
            @event-select="handleEventSelect"
          />
        </el-card>
      </el-col>

      <!-- 财务数据快照 -->
      <el-col :span="12">
        <el-card class="panel-card">
          <template #header>
            <div class="panel-header">
              <h4>财务数据快照</h4>
              <div class="panel-actions">
                <el-button
                  type="text"
                  :icon="isMaximized('financial') ? 'Minus' : 'Plus'"
                  @click="handleToggleMaximize('financial')"
                />
                <el-button
                  type="text"
                  icon="Close"
                  @click="handleClosePanel('financial')"
                />
              </div>
            </div>
          </template>
          <FinancialSnapshot
            :data="caseData?.panels?.financialSnapshot || []"
            :loading="loading"
            :error="error ?? undefined"
            @period-select="handlePeriodSelect"
            @metric-hover="handleMetricHover"
          />
        </el-card>
      </el-col>

      <!-- 量化信号仪表盘 -->
      <el-col :span="12">
        <el-card class="panel-card">
          <template #header>
            <div class="panel-header">
              <h4>量化信号仪表盘</h4>
              <div class="panel-actions">
                <el-button
                  type="text"
                  :icon="isMaximized('quant') ? 'Minus' : 'Plus'"
                  @click="handleToggleMaximize('quant')"
                />
                <el-button
                  type="text"
                  icon="Close"
                  @click="handleClosePanel('quant')"
                />
              </div>
            </div>
          </template>
          <QuantSignalDashboard
            :data="caseData?.panels?.quantSignalDashboard || []"
            :loading="loading"
            :error="error ?? undefined"
            @signal-hover="handleSignalHover"
            @signal-click="handleSignalClick"
          />
        </el-card>
      </el-col>

      <!-- 资金流向和筹码查看器 -->
      <el-col :span="12">
        <el-card class="panel-card">
          <template #header>
            <div class="panel-header">
              <h4>资金流向和筹码查看器</h4>
              <div class="panel-actions">
                <el-button
                  type="text"
                  :icon="isMaximized('flow') ? 'Minus' : 'Plus'"
                  @click="handleToggleMaximize('flow')"
                />
                <el-button
                  type="text"
                  icon="Close"
                  @click="handleClosePanel('flow')"
                />
              </div>
            </div>
          </template>
          <FlowAndChipsViewer
            :data="caseData?.panels?.flowAndChipsViewer || {}"
            :loading="loading"
            :error="error ?? undefined"
            @flow-hover="handleFlowHover"
            @chip-hover="handleChipHover"
          />
        </el-card>
      </el-col>

      <!-- 个人先例查看器 -->
      <el-col :span="24">
        <el-card class="panel-card">
          <template #header>
            <div class="panel-header">
              <h4>个人先例查看器</h4>
              <div class="panel-actions">
                <el-button
                  type="text"
                  :icon="isMaximized('precedents') ? 'Minus' : 'Plus'"
                  @click="handleToggleMaximize('precedents')"
                />
                <el-button
                  type="text"
                  icon="Close"
                  @click="handleClosePanel('precedents')"
                />
              </div>
            </div>
          </template>
          <PersonalPrecedentViewer
            :data="caseData?.panels?.precedentViewer || []"
            :loading="loading"
            :error="error ?? undefined"
            @precedent-select="handlePrecedentSelect"
            @precedent-hover="handlePrecedentHover"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import RawTextExplorer from './RawTextExplorer.vue'
import FinancialSnapshot from './FinancialSnapshot.vue'
import QuantSignalDashboard from './QuantSignalDashboard.vue'
import FlowAndChipsViewer from './FlowAndChipsViewer.vue'
import PersonalPrecedentViewer from './PersonalPrecedentViewer.vue'
import type { ArbitrationCaseData } from '@/types'

// ==================== 类型定义 ====================
// Import the correct types from arbitration types
import type {
  RawTextData,
  QuantSignalsData,
  MoneyFlowData,
  ChipDistributionData,
  HistoricalArbitrations
} from '@/types'

// ==================== Props ====================
interface Props {
  caseData: ArbitrationCaseData
  loading?: boolean
  error?: string | null
  maximizedPanel?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  maximizedPanel: null
})

// ==================== Emits ====================
interface Emits {
  (e: 'toggle-maximize', panelId: string): void
  (e: 'close-panel', panelId: string): void
  (e: 'text-highlight', text: string, keywords: string[]): void
  (e: 'event-select', event: RawTextData): void
  (e: 'period-select', period: string): void
  (e: 'metric-hover', metric: string, value: number): void
  (e: 'signal-hover', signal: string, value: number): void
  (e: 'signal-click', signal: QuantSignalsData): void
  (e: 'flow-hover', flow: MoneyFlowData): void
  (e: 'chip-hover', chip: ChipDistributionData): void
  (e: 'precedent-select', precedent: HistoricalArbitrations): void
  (e: 'precedent-hover', precedent: HistoricalArbitrations): void
}

const emit = defineEmits<Emits>()

// ==================== Methods ====================
const isMaximized = (panelId: string) => {
  return props.maximizedPanel === panelId
}

const handleToggleMaximize = (panelId: string) => {
  emit('toggle-maximize', panelId)
}

const handleClosePanel = (panelId: string) => {
  emit('close-panel', panelId)
}

const handleTextHighlight = (text: string, keywords: string[]) => {
  emit('text-highlight', text, keywords)
}

const handleEventSelect = (event: RawTextData) => {
  emit('event-select', event)
}

const handlePeriodSelect = (period: string) => {
  emit('period-select', period)
}

const handleMetricHover = (metric: string, value: number) => {
  emit('metric-hover', metric, value)
}

const handleSignalHover = (signal: string, value: number) => {
  emit('signal-hover', signal, value)
}

const handleSignalClick = (signal: QuantSignalsData) => {
  emit('signal-click', signal)
}

const handleFlowHover = (flow: MoneyFlowData) => {
  emit('flow-hover', flow)
}

const handleChipHover = (chip: ChipDistributionData) => {
  emit('chip-hover', chip)
}

const handlePrecedentSelect = (precedent: HistoricalArbitrations) => {
  emit('precedent-select', precedent)
}

const handlePrecedentHover = (precedent: HistoricalArbitrations) => {
  emit('precedent-hover', precedent)
}
</script>

<style scoped>
.panels-container {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.panels-grid {
  height: 100%;
}

.panel-card {
  height: 100%;
  margin-bottom: 16px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.panel-actions {
  display: flex;
  gap: 4px;
}
</style>

<template>
  <div class="arbitration-dashboard">
    <!-- 顶部工具栏 -->
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
          @click="toggleFullscreen"
        >
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </el-button>
      </div>
    </div>

    <!-- 案例选择侧边栏 -->
    <div
      v-if="!isFullscreen"
      class="sidebar"
    >
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
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 加载状态 -->
      <div
        v-if="loading"
        class="loading-container"
      >
        <el-skeleton
          :rows="4"
          animated
        />
      </div>

      <!-- 错误状态 -->
      <el-alert
        v-else-if="error"
        type="error"
        :title="error"
        show-icon
        closable
        @close="handleErrorClose"
      />

      <!-- 数据面板区域 -->
      <div
        v-else-if="caseData"
        class="panels-container"
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
                      @click="togglePanelMaximize('raw-text')"
                    />
                    <el-button
                      type="text"
                      icon="Close"
                      @click="closePanel('raw-text')"
                    />
                  </div>
                </div>
              </template>
              <RawTextExplorer
                :data="caseData.panels.rawTextExplorer"
                :loading="loading"
                :error="error"
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
                      @click="togglePanelMaximize('financial')"
                    />
                    <el-button
                      type="text"
                      icon="Close"
                      @click="closePanel('financial')"
                    />
                  </div>
                </div>
              </template>
              <FinancialSnapshot
                :data="caseData.panels.financialSnapshot"
                :loading="loading"
                :error="error"
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
                      @click="togglePanelMaximize('quant')"
                    />
                    <el-button
                      type="text"
                      icon="Close"
                      @click="closePanel('quant')"
                    />
                  </div>
                </div>
              </template>
              <QuantSignalDashboard
                :data="caseData.panels.quantSignalDashboard"
                :loading="loading"
                :error="error"
                @signal-hover="handleSignalHover"
                @signal-click="handleSignalClick"
              />
            </el-card>
          </el-col>

          <!-- 资金流向与筹码查看器 -->
          <el-col :span="12">
            <el-card class="panel-card">
              <template #header>
                <div class="panel-header">
                  <h4>资金流向与筹码查看器</h4>
                  <div class="panel-actions">
                    <el-button
                      type="text"
                      :icon="isMaximized('flow') ? 'Minus' : 'Plus'"
                      @click="togglePanelMaximize('flow')"
                    />
                    <el-button
                      type="text"
                      icon="Close"
                      @click="closePanel('flow')"
                    />
                  </div>
                </div>
              </template>
              <FlowAndChipsViewer
                :data="caseData.panels.flowAndChipsViewer"
                :loading="loading"
                :error="error"
                @flow-hover="handleFlowHover"
                @chip-hover="handleChipHover"
              />
            </el-card>
          </el-col>

          <!-- 历史仲裁记录 -->
          <el-col :span="24">
            <el-card class="panel-card">
              <template #header>
                <div class="panel-header">
                  <h4>历史仲裁记录</h4>
                  <div class="panel-actions">
                    <el-button
                      type="text"
                      :icon="isMaximized('precedents') ? 'Minus' : 'Plus'"
                      @click="togglePanelMaximize('precedents')"
                    />
                    <el-button
                      type="text"
                      icon="Close"
                      @click="closePanel('precedents')"
                    />
                  </div>
                </div>
              </template>
              <PersonalPrecedentViewer
                :data="caseData.panels.precedentViewer"
                :loading="loading"
                :error="error"
                @precedent-select="handlePrecedentSelect"
                @precedent-hover="handlePrecedentHover"
              />
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 空状态 -->
      <el-empty
        v-else
        description="请选择一个仲裁案例"
      />
    </div>

    <!-- 仲裁决策弹窗 -->
    <el-dialog
      v-model="showArbitrationDialog"
      title="仲裁决策"
      width="600px"
      :before-close="handleDialogClose"
    >
      <div class="arbitration-form">
        <el-form
          :model="arbitrationForm"
          label-width="100px"
        >
          <el-form-item label="决策结果">
            <el-radio-group v-model="arbitrationForm.decision">
              <el-radio value="approve">
                通过
              </el-radio>
              <el-radio value="reject">
                拒绝
              </el-radio>
              <el-radio value="modify">
                修改
              </el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="评级">
            <el-rate
              v-model="arbitrationForm.rating"
              :colors="['#f56c6c', '#e6a23c', '#67c23a']"
            />
          </el-form-item>

          <el-form-item label="评论">
            <el-input
              v-model="arbitrationForm.comment"
              type="textarea"
              :rows="4"
              placeholder="请输入仲裁评论..."
            />
          </el-form-item>

          <el-form-item label="标签">
            <el-select
              v-model="arbitrationForm.tags"
              multiple
              placeholder="选择标签"
            >
              <el-option
                label="高质量"
                value="high_quality"
              />
              <el-option
                label="需要改进"
                value="needs_improvement"
              />
              <el-option
                label="数据准确"
                value="data_accurate"
              />
              <el-option
                label="逻辑清晰"
                value="logic_clear"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="showArbitrationDialog = false">
          取消
        </el-button>
        <el-button
          type="primary"
          @click="submitArbitration"
        >
          提交决策
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, Setting } from '@element-plus/icons-vue';
import { useArbitrationStore } from '@/stores/arbitration';
import RawTextExplorer from './RawTextExplorer.vue';
import FinancialSnapshot from './FinancialSnapshot.vue';
import QuantSignalDashboard from './QuantSignalDashboard.vue';
import FlowAndChipsViewer from './FlowAndChipsViewer.vue';
import PersonalPrecedentViewer from './PersonalPrecedentViewer.vue';
import type { ArbitrationDecision } from '@/types/arbitration';

// ==================== 响应式数据 ====================
const isFullscreen = ref(false);
const maximizedPanel = ref<string | null>(null);
const showArbitrationDialog = ref(false);
const arbitrationForm = ref({
  decision: 'approve',
  rating: 5,
  comment: '',
  tags: [] as string[]
});

// ==================== Store ====================
const arbitrationStore = useArbitrationStore();

// ==================== 计算属性 ====================
const currentCaseId = computed(() => arbitrationStore.currentCaseId);
const currentCase = computed(() => arbitrationStore.currentCase);
const caseData = computed(() => arbitrationStore.caseData);
const loading = computed(() => arbitrationStore.loading);
const error = computed(() => arbitrationStore.error);
const cases = computed(() => arbitrationStore.cases);

// ==================== 方法 ====================
const handleRefresh = async () => {
  if (currentCaseId.value) {
    await arbitrationStore.fetchCaseData(currentCaseId.value);
    ElMessage.success('数据已刷新');
  }
};

const handleSettings = () => {
  ElMessage.info('设置功能待实现');
};

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

const handleCaseSelect = async (caseId: string) => {
  await arbitrationStore.fetchCaseData(caseId);
};

const isMaximized = (panelId: string) => {
  return maximizedPanel.value === panelId;
};

const togglePanelMaximize = (panelId: string) => {
  maximizedPanel.value = maximizedPanel.value === panelId ? null : panelId;
};

const closePanel = (panelId: string) => {
  // 关闭面板逻辑
  ElMessage.info(`关闭 ${panelId} 面板`);
};

const handleTextHighlight = (text: string, keywords: string[]) => {
  console.log('文本高亮:', text, keywords);
};

const handleEventSelect = (event: any) => {
  console.log('选择事件:', event);
};

const handlePeriodSelect = (period: string) => {
  console.log('选择期间:', period);
};

const handleMetricHover = (metric: string, value: number) => {
  console.log('指标悬浮:', metric, value);
};

const handleSignalHover = (signal: string, value: number) => {
  console.log('信号悬浮:', signal, value);
};

const handleSignalClick = (signal: any) => {
  console.log('点击信号:', signal);
};

const handleFlowHover = (flow: any) => {
  console.log('资金流向悬浮:', flow);
};

const handleChipHover = (chip: any) => {
  console.log('筹码悬浮:', chip);
};

const handlePrecedentSelect = (precedent: any) => {
  console.log('选择先例:', precedent);
};

const handlePrecedentHover = (precedent: any) => {
  console.log('先例悬浮:', precedent);
};

const getCaseStatusType = (status: string) => {
  const types: Record<string, string> = {
    pending: 'warning',
    in_progress: 'primary',
    completed: 'success',
    rejected: 'danger'
  };
  return types[status] || 'info';
};

const getCaseStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成',
    rejected: '已拒绝'
  };
  return labels[status] || status;
};

const getPriorityType = (priority: number) => {
  if (priority >= 3) return 'danger';
  if (priority >= 2) return 'warning';
  return 'success';
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN');
};

const handleErrorClose = () => {
  arbitrationStore.clearError();
};

const handleDialogClose = () => {
  showArbitrationDialog.value = false;
  arbitrationForm.value = {
    decision: 'approve',
    rating: 5,
    comment: '',
    tags: []
  };
};

const submitArbitration = async () => {
  if (!currentCaseId.value) return;

  const decision: ArbitrationDecision = {
    caseId: currentCaseId.value,
    decision: arbitrationForm.value.decision as 'approve' | 'reject' | 'modify',
    feedback: {
      rating: ['excellent', 'good', 'average', 'poor', 'bad'][arbitrationForm.value.rating - 1] as any,
      comment: arbitrationForm.value.comment,
      priority: 1,
      tags: arbitrationForm.value.tags
    },
    reviewer: '当前用户',
    reviewerRole: '仲裁员'
  };

  try {
    await arbitrationStore.submitArbitration(decision);
    ElMessage.success('仲裁决策提交成功');
    showArbitrationDialog.value = false;
  } catch (err) {
    ElMessage.error('提交失败，请重试');
  }
};

// ==================== 生命周期 ====================
onMounted(async () => {
  await arbitrationStore.fetchCases();
  arbitrationStore.loadLayoutFromStorage();
});

// ==================== 监听器 ====================
watch(maximizedPanel, (newPanel) => {
  arbitrationStore.setMaximizedPanel(newPanel);
});
</script>

<style scoped>
.arbitration-dashboard {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.dashboard-title {
  margin: 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.sidebar {
  width: 300px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  overflow-y: auto;
}

.case-list-card {
  height: 100%;
  border: none;
  border-radius: 0;
}

.case-list-card h3 {
  margin: 0;
  color: #333;
}

.case-list {
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.case-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.case-item:hover {
  background: #f0f9ff;
  border-color: #409eff;
}

.case-item.active {
  background: #e6f7ff;
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
  color: #333;
}

.case-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.loading-container {
  padding: 40px;
}

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
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.panel-actions {
  display: flex;
  gap: 4px;
}

.arbitration-form {
  padding: 16px 0;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .sidebar {
    width: 250px;
  }
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .toolbar-left,
  .toolbar-right {
    justify-content: center;
  }

  .sidebar {
    width: 100%;
    height: 200px;
  }

  .main-content {
    height: calc(100vh - 200px);
  }
}

/* 滚动条样式 */
.case-list::-webkit-scrollbar,
.panels-container::-webkit-scrollbar {
  width: 6px;
}

.case-list::-webkit-scrollbar-track,
.panels-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.case-list::-webkit-scrollbar-thumb,
.panels-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.case-list::-webkit-scrollbar-thumb:hover,
.panels-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>

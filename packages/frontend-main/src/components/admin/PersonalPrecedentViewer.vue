<template>
  <div
    class="personal-precedent-viewer"
    data-testid="precedent-viewer"
  >
    <!-- 筛选和排序工具栏 -->
    <div class="toolbar">
      <el-select
        v-model="filterType"
        placeholder="反馈类型"
        clearable
        class="filter-select"
      >
        <el-option
          v-for="type in feedbackTypes"
          :key="type.value"
          :label="type.label"
          :value="type.value"
        />
      </el-select>

      <el-select
        v-model="sortBy"
        placeholder="排序方式"
        class="sort-select"
      >
        <el-option
          label="按日期"
          value="date"
        />
        <el-option
          label="按评分"
          value="score"
        />
        <el-option
          label="按学习价值"
          value="learning"
        />
      </el-select>

      <el-button
        type="primary"
        :icon="Filter"
        @click="handleFilter"
      >
        筛选
      </el-button>
    </div>

    <!-- 统计信息 -->
    <div class="stats">
      <el-tag type="info">
        总计: {{ (props.data || []).length }} 条
      </el-tag>
      <el-tag type="success">
        显示: {{ filteredData.length }} 条
      </el-tag>
      <el-tag
        v-if="selectedPrecedent"
        type="warning"
      >
        已选择: 1 条
      </el-tag>
    </div>

    <!-- 历史仲裁记录列表 -->
    <div class="precedent-list">
      <el-card
        v-for="precedent in filteredData"
        :key="precedent.feedbackId"
        :class="['precedent-card', { selected: selectedPrecedent === precedent.feedbackId }]"
        @click="handlePrecedentSelect(precedent)"
        @mouseenter="handlePrecedentHover(precedent)"
      >
        <template #header>
          <div class="card-header">
            <div class="precedent-info">
              <el-tag
                :type="getFeedbackTypeColor(precedent.feedbackType)"
                size="small"
              >
                {{ getFeedbackTypeLabel(precedent.feedbackType) }}
              </el-tag>
              <span class="precedent-date">{{ formatDate(precedent.feedbackDate) }}</span>
            </div>
            <div class="precedent-scores">
              <el-rate
                v-model="precedent.rating"
                disabled
                :colors="['#f56c6c', '#e6a23c', '#67c23a']"
              />
              <span class="score-text">{{ precedent.feedbackScore.toFixed(1) }}分</span>
            </div>
          </div>
        </template>

        <div class="card-content">
          <div class="precedent-summary">
            <h4 class="summary-title">
              {{ precedent.originalSummary }}
            </h4>
            <p class="summary-content">
              {{ precedent.feedbackComment }}
            </p>
          </div>

          <div class="precedent-metrics">
            <div class="metric-row">
              <div class="metric-item">
                <span class="metric-label">准确度:</span>
                <el-progress
                  :percentage="precedent.accuracyScore * 100"
                  :color="getScoreColor(precedent.accuracyScore)"
                  :show-text="false"
                />
                <span class="metric-value">{{ (precedent.accuracyScore * 100).toFixed(1) }}%</span>
              </div>
            </div>

            <div class="metric-row">
              <div class="metric-item">
                <span class="metric-label">完整性:</span>
                <el-progress
                  :percentage="precedent.completenessScore * 100"
                  :color="getScoreColor(precedent.completenessScore)"
                  :show-text="false"
                />
                <span class="metric-value">{{ (precedent.completenessScore * 100).toFixed(1) }}%</span>
              </div>
            </div>

            <div class="metric-row">
              <div class="metric-item">
                <span class="metric-label">逻辑性:</span>
                <el-progress
                  :percentage="precedent.logicScore * 100"
                  :color="getScoreColor(precedent.logicScore)"
                  :show-text="false"
                />
                <span class="metric-value">{{ (precedent.logicScore * 100).toFixed(1) }}%</span>
              </div>
            </div>
          </div>

          <div class="precedent-tags">
            <el-tag
              v-for="tag in precedent.tags"
              :key="tag"
              size="small"
              type="info"
            >
              {{ tag }}
            </el-tag>
          </div>

          <div class="precedent-meta">
            <div class="meta-item">
              <span class="meta-label">股票代码:</span>
              <el-tag size="small">
                {{ precedent.stockCode }}
              </el-tag>
            </div>
            <div class="meta-item">
              <span class="meta-label">行业:</span>
              <span class="meta-value">{{ precedent.industry }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">概念:</span>
              <span class="meta-value">{{ precedent.concept }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">学习价值:</span>
              <el-tag
                :type="getLearningValueType(precedent.learningValue)"
                size="small"
              >
                {{ (precedent.learningValue * 100).toFixed(1) }}%
              </el-tag>
            </div>
          </div>

          <div class="precedent-actions">
            <el-button
              type="primary"
              size="small"
              :icon="View"
              @click.stop="viewPrecedentDetails(precedent)"
            >
              查看详情
            </el-button>
            <el-button
              type="default"
              size="small"
              :icon="Star"
              @click.stop="togglePrecedentFavorite(precedent)"
            >
              {{ precedent.usedForTraining ? '已收藏' : '收藏' }}
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 空状态 -->
    <el-empty
      v-if="!loading && filteredData.length === 0"
      description="暂无历史仲裁记录"
    />

    <!-- 加载状态 -->
    <div
      v-if="loading"
      class="loading"
    >
      <el-skeleton
        :rows="3"
        animated
      />
    </div>

    <!-- 错误状态 -->
    <el-alert
      v-if="error"
      type="error"
      :title="error"
      show-icon
      closable
      @close="handleErrorClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { logger } from "@/utils/logger"
import { ElMessage } from 'element-plus';
import { Filter, View, Star } from '@element-plus/icons-vue';
import type { PersonalPrecedentViewerProps, HistoricalArbitrations } from '@/types/arbitration';

// ==================== Props ====================
const props = withDefaults(defineProps<PersonalPrecedentViewerProps>(), {
  loading: false,
  error: null,
  onPrecedentSelect: () => {},
  onPrecedentHover: () => {}
});

// ==================== 响应式数据 ====================
const selectedPrecedent = ref<string | null>(null);
const filterType = ref('all');
const sortBy = ref('date');

// ==================== 计算属性 ====================
const feedbackTypes = computed(() => {
  const types = Array.from(new Set((props.data || []).map(item => item.feedbackType)));
  return types.map(type => ({
    value: type,
    label: getFeedbackTypeLabel(type)
  }));
});

const filteredData = computed(() => {
  let filtered = props.data || [];

  if (filterType.value !== 'all') {
    filtered = filtered.filter(item => item.feedbackType === filterType.value);
  }

  // 排序
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'date':
        return new Date(b.feedbackDate).getTime() - new Date(a.feedbackDate).getTime();
      case 'score':
        return b.feedbackScore - a.feedbackScore;
      case 'learning':
        return b.learningValue - a.learningValue;
      default:
        return 0;
    }
  });

  return filtered;
});

// ==================== 方法 ====================
const getFeedbackTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    annotation: '标注',
    arbitration: '仲裁',
    quality_review: '质量审核',
    correction: '修正',
    approval: '审批'
  };
  return labels[type] || type;
};

const getFeedbackTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    annotation: 'primary',
    arbitration: 'success',
    quality_review: 'warning',
    correction: 'danger',
    approval: 'info'
  };
  return colors[type] || 'info';
};

const getScoreColor = (score: number) => {
  if (score >= 0.8) return '#67c23a';
  if (score >= 0.6) return '#e6a23c';
  return '#f56c6c';
};

const getLearningValueType = (value: number) => {
  if (value >= 0.8) return 'success';
  if (value >= 0.6) return 'warning';
  return 'danger';
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN');
};

const handleFilter = () => {
  // 触发过滤逻辑
  logger.log('应用过滤条件');
};

const handlePrecedentSelect = (precedent: HistoricalArbitrations) => {
  selectedPrecedent.value = precedent.feedbackId;
  props.onPrecedentSelect?.(precedent);
};

const handlePrecedentHover = (precedent: HistoricalArbitrations) => {
  props.onPrecedentHover?.(precedent);
};

const viewPrecedentDetails = (precedent: HistoricalArbitrations) => {
  // 查看详情逻辑
  logger.log('查看仲裁记录详情:', precedent);
  ElMessage.info('查看详情功能待实现');
};

const togglePrecedentFavorite = (precedent: HistoricalArbitrations) => {
  // 收藏/取消收藏逻辑
  logger.log('切换收藏状态:', precedent);
  ElMessage.success(precedent.usedForTraining ? '已取消收藏' : '已收藏');
};

const handleErrorClose = () => {
  // 错误处理逻辑
};
</script>

<style scoped>
.personal-precedent-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 6px;
}

.filter-select,
.sort-select {
  width: 120px;
}

.stats {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.precedent-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

.precedent-card {
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.precedent-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.precedent-card.selected {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.precedent-info {
  display: flex;
  gap: 8px;
  align-items: center;
}

.precedent-date {
  color: #666;
  font-size: 12px;
}

.precedent-scores {
  display: flex;
  gap: 8px;
  align-items: center;
}

.score-text {
  font-size: 12px;
  color: #666;
}

.card-content {
  padding: 0;
}

.precedent-summary {
  margin-bottom: 16px;
}

.summary-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.summary-content {
  margin: 0;
  line-height: 1.6;
  color: #666;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.precedent-metrics {
  margin-bottom: 16px;
}

.metric-row {
  margin-bottom: 8px;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.metric-label {
  font-size: 12px;
  color: #666;
  min-width: 60px;
}

.metric-value {
  font-size: 12px;
  color: #333;
  min-width: 40px;
  text-align: right;
}

.precedent-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 16px;
}

.precedent-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-label {
  font-size: 12px;
  color: #666;
}

.meta-value {
  font-size: 12px;
  color: #333;
}

.precedent-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.loading {
  padding: 20px;
}

/* 滚动条样式 */
.precedent-list::-webkit-scrollbar {
  width: 6px;
}

.precedent-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.precedent-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.precedent-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>

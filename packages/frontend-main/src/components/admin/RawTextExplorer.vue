<template>
  <div
    class="raw-text-explorer"
    data-testid="raw-text-explorer"
  >
    <!-- 搜索和过滤工具栏 -->
    <div class="toolbar">
      <el-input
        v-model="searchText"
        placeholder="搜索标题、内容或关键词..."
        clearable
        class="search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <el-select
        v-model="eventTypeFilter"
        placeholder="事件类型"
        clearable
        class="filter-select"
      >
        <el-option
          v-for="type in eventTypes"
          :key="type.value"
          :label="type.label"
          :value="type.value"
        />
      </el-select>

      <el-button
        type="primary"
        :icon="Filter"
        @click="handleFilter"
      >
        过滤
      </el-button>
    </div>

    <!-- 数据统计 -->
    <div class="stats">
      <el-tag type="info">
        总计: {{ data.length }} 条
      </el-tag>
      <el-tag type="success">
        显示: {{ filteredData.length }} 条
      </el-tag>
      <el-tag
        v-if="highlightedKeywords.length > 0"
        type="warning"
      >
        高亮: {{ highlightedKeywords.length }} 个关键词
      </el-tag>
    </div>

    <!-- 数据列表 -->
    <div class="data-list">
      <el-card
        v-for="item in filteredData"
        :key="item.eventId"
        :class="['event-card', { selected: selectedEvent === item.eventId }]"
        @click="handleEventSelect(item)"
      >
        <template #header>
          <div class="card-header">
            <div class="event-info">
              <el-tag
                :type="getEventTypeColor(item.eventType)"
                size="small"
              >
                {{ getEventTypeLabel(item.eventType) }}
              </el-tag>
              <span class="event-date">{{ formatDate(item.publishedAt) }}</span>
            </div>
            <div class="event-scores">
              <el-tag
                v-if="item.importanceScore"
                :type="getScoreType(item.importanceScore)"
                size="small"
              >
                重要性: {{ (item.importanceScore * 100).toFixed(1) }}%
              </el-tag>
              <el-tag
                v-if="item.sentimentScore"
                :type="getSentimentType(item.sentimentScore)"
                size="small"
              >
                情感: {{ (item.sentimentScore * 100).toFixed(1) }}%
              </el-tag>
            </div>
          </div>
        </template>

        <div class="card-content">
          <h4 class="event-title">
            {{ item.title }}
          </h4>

          <div class="event-content">
            <p class="content-text">
              {{ highlightText(item.content, searchText) }}
            </p>
          </div>

          <div class="event-meta">
            <div class="keywords">
              <el-tag
                v-for="keyword in item.keywords"
                :key="keyword"
                :class="{ highlighted: highlightedKeywords.includes(keyword) }"
                size="small"
                @click.stop="handleKeywordHighlight(keyword)"
              >
                {{ keyword }}
              </el-tag>
            </div>

            <div class="related-stocks">
              <el-tag
                v-for="stock in item.relatedStocks"
                :key="stock"
                type="info"
                size="small"
              >
                {{ stock }}
              </el-tag>
            </div>
          </div>

          <div class="event-actions">
            <el-button
              v-if="item.sourceUrl"
              type="primary"
              size="small"
              :icon="Link"
              @click.stop="openSourceUrl(item.sourceUrl)"
            >
              查看原文
            </el-button>
            <el-button
              type="default"
              size="small"
              :icon="Edit"
              @click.stop="handleTextHighlight(item)"
            >
              高亮分析
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 空状态 -->
    <el-empty
      v-if="!loading && filteredData.length === 0"
      description="暂无数据"
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
import { ref, computed, watch } from 'vue';
import { logger } from "@/utils/logger"
import { ElMessage } from 'element-plus';
import { Search, Filter, Edit, Link } from '@element-plus/icons-vue';
import type { RawTextExplorerProps, RawTextData } from '@/types/arbitration';

// ==================== Props ====================
const props = withDefaults(defineProps<RawTextExplorerProps>(), {
  loading: false,
  error: null,
  onTextHighlight: () => {},
  onEventSelect: () => {}
});

// ==================== 响应式数据 ====================
const searchText = ref('');
const eventTypeFilter = ref('all');
const selectedEvent = ref<string | null>(null);
const highlightedKeywords = ref<string[]>([]);

// ==================== 计算属性 ====================
const filteredData = computed(() => {
  return props.data.filter(item => {
    const matchesSearch = !searchText.value ||
      item.title.toLowerCase().includes(searchText.value.toLowerCase()) ||
      item.content.toLowerCase().includes(searchText.value.toLowerCase()) ||
      item.keywords.some(keyword => keyword.toLowerCase().includes(searchText.value.toLowerCase()));

    const matchesType = eventTypeFilter.value === 'all' || item.eventType === eventTypeFilter.value;

    return matchesSearch && matchesType;
  });
});

const eventTypes = computed(() => {
  const types = Array.from(new Set(props.data.map(item => item.eventType)));
  return types.map(type => ({
    value: type,
    label: getEventTypeLabel(type)
  }));
});

// ==================== 方法 ====================
const getEventTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    news: '新闻',
    announcement: '公告',
    e_interaction: 'e互动',
    financial_report: '财报',
    other: '其他'
  };
  return labels[type] || type;
};

const getEventTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    news: 'primary',
    announcement: 'success',
    e_interaction: 'warning',
    financial_report: 'danger',
    other: 'info'
  };
  return colors[type] || 'info';
};

const getScoreType = (score: number) => {
  if (score >= 0.8) return 'success';
  if (score >= 0.6) return 'warning';
  return 'danger';
};

const getSentimentType = (score: number) => {
  if (score >= 0.6) return 'success';
  if (score >= 0.4) return 'warning';
  return 'danger';
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN');
};

const highlightText = (text: string, searchText: string) => {
  if (!searchText) return text;

  const regex = new RegExp(`(${searchText})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

const handleFilter = () => {
  // 触发过滤逻辑
  logger.log('应用过滤条件');
};

const handleEventSelect = (event: RawTextData) => {
  selectedEvent.value = event.eventId;
  props.onEventSelect?.(event);
};

const handleKeywordHighlight = (keyword: string) => {
  if (highlightedKeywords.value.includes(keyword)) {
    highlightedKeywords.value = highlightedKeywords.value.filter(k => k !== keyword);
  } else {
    highlightedKeywords.value.push(keyword);
  }
};

const handleTextHighlight = (event: RawTextData) => {
  props.onTextHighlight?.(event.content, event.keywords);
  ElMessage.success('已高亮显示关键词');
};

const openSourceUrl = (url: string) => {
  window.open(url, '_blank');
};

const handleErrorClose = () => {
  // 错误处理逻辑
};

// ==================== 监听器 ====================
watch(searchText, () => {
  // 搜索文本变化时的处理
});

watch(eventTypeFilter, () => {
  // 事件类型过滤变化时的处理
});
</script>

<style scoped>
.raw-text-explorer {
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

.search-input {
  flex: 1;
  max-width: 300px;
}

.filter-select {
  width: 120px;
}

.stats {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.data-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

.event-card {
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.event-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.event-card.selected {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.event-info {
  display: flex;
  gap: 8px;
  align-items: center;
}

.event-date {
  color: #666;
  font-size: 12px;
}

.event-scores {
  display: flex;
  gap: 4px;
}

.card-content {
  padding: 0;
}

.event-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.event-content {
  margin-bottom: 12px;
}

.content-text {
  margin: 0;
  line-height: 1.6;
  color: #666;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.content-text :deep(mark) {
  background-color: #fff3cd;
  padding: 2px 4px;
  border-radius: 2px;
}

.event-meta {
  margin-bottom: 12px;
}

.keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.keywords .el-tag {
  cursor: pointer;
  transition: all 0.3s ease;
}

.keywords .el-tag.highlighted {
  background-color: #409eff;
  color: white;
}

.related-stocks {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.event-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.loading {
  padding: 20px;
}

/* 滚动条样式 */
.data-list::-webkit-scrollbar {
  width: 6px;
}

.data-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.data-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.data-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>

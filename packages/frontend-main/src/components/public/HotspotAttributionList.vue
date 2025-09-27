<template>
  <div class="hotspot-list">
    <div
      v-if="props.events.length === 0"
      class="empty-state"
    >
      <el-empty description="暂无数据" />
    </div>

    <div
      v-else
      class="events-grid"
    >
      <div
        v-for="event in props.events"
        :key="event.id"
        class="event-card"
        :class="getEventClass(event)"
      >
        <div class="event-header">
          <div class="event-title">
            {{ 'title' in event ? event.title : event.name }}
          </div>
          <div class="event-meta">
            <el-tag
              v-if="'importance' in event"
              :type="getImportanceType(event.importance)"
              size="small"
            >
              {{ getImportanceText(event.importance) }}
            </el-tag>
            <el-tag
              v-if="'impact' in event"
              :type="getImpactType(event.impact)"
              size="small"
            >
              {{ getImpactText(event.impact) }}
            </el-tag>
            <el-tag
              v-if="'symbol' in event"
              type="info"
              size="small"
            >
              {{ event.symbol }}
            </el-tag>
          </div>
        </div>

        <div class="event-content">
          <p class="event-description">
            {{ 'description' in event ? event.description : event.attribution }}
          </p>

          <div class="event-details">
            <div class="detail-item">
              <el-icon><Calendar /></el-icon>
              <span>{{ formatTime(event.timestamp) }}</span>
            </div>
            <div class="detail-item">
              <el-icon><Link /></el-icon>
              <span>{{ 'source' in event ? event.source : '热点归因' }}</span>
            </div>
            <div class="detail-item">
              <el-icon><PriceTag /></el-icon>
              <span>{{ 'category' in event ? event.category : `涨跌幅: ${event.changePercent}%` }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// computed 未使用，已移除
import type { MarketEvent, HotspotAttribution } from '@/types/market'
import { Calendar, Link, PriceTag } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

interface Props {
  events: (MarketEvent | HotspotAttribution)[]
}

const props = defineProps<Props>()

const getEventClass = (event: MarketEvent | HotspotAttribution) => {
  if ('importance' in event && 'impact' in event) {
    return `importance-${event.importance} impact-${event.impact}`
  }
  return 'hotspot-item'
}

const getImportanceType = (importance: string) => {
  switch (importance) {
    case 'high': return 'danger'
    case 'medium': return 'warning'
    case 'low': return 'info'
    default: return 'info'
  }
}

const getImportanceText = (importance: string) => {
  switch (importance) {
    case 'high': return '高重要'
    case 'medium': return '中重要'
    case 'low': return '低重要'
    default: return '未知'
  }
}

const getImpactType = (impact: string) => {
  switch (impact) {
    case 'positive': return 'success'
    case 'negative': return 'danger'
    case 'neutral': return 'info'
    default: return 'info'
  }
}

const getImpactText = (impact: string) => {
  switch (impact) {
    case 'positive': return '正面'
    case 'negative': return '负面'
    case 'neutral': return '中性'
    default: return '未知'
  }
}

const formatTime = (timestamp: string) => {
  return dayjs(timestamp).format('MM-DD HH:mm')
}
</script>

<style scoped>
.hotspot-list {
  min-height: 200px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.event-card {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
}

.event-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.event-card.importance-high {
  border-left: 4px solid #f56c6c;
}

.event-card.importance-medium {
  border-left: 4px solid #e6a23c;
}

.event-card.importance-low {
  border-left: 4px solid #909399;
}

.event-card.impact-positive {
  border-left-color: #67c23a;
}

.event-card.impact-negative {
  border-left-color: #f56c6c;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.event-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  flex: 1;
  margin-right: 15px;
}

.event-meta {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.event-content {
  color: #666;
}

.event-description {
  line-height: 1.6;
  margin-bottom: 15px;
  font-size: 14px;
}

.event-details {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  font-size: 12px;
  color: #999;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.hotspot-item {
  border-left: 4px solid #409eff;
}

@media (max-width: 768px) {
  .events-grid {
    grid-template-columns: 1fr;
  }

  .event-header {
    flex-direction: column;
    gap: 10px;
  }

  .event-meta {
    align-self: flex-start;
  }

  .event-details {
    flex-direction: column;
    gap: 8px;
  }
}
</style>

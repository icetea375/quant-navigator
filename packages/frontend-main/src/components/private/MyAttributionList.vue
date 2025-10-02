<template>
  <div class="my-attribution-list">
    <div
      v-if="props.attributions.length === 0"
      class="empty-state"
    >
      <el-empty description="暂无持仓异动数据" />
    </div>

    <div
      v-else
      class="attributions-grid"
    >
      <div
        v-for="attribution in props.attributions"
        :key="attribution.id"
        class="attribution-card"
        :class="getAttributionClass(attribution)"
      >
        <div class="attribution-header">
          <div class="stock-info">
            <div class="stock-symbol">
              {{ attribution.symbol }}
            </div>
            <div class="stock-name">
              {{ attribution.name }}
            </div>
          </div>
          <div class="price-change">
            <div
              class="change-value"
              :class="getChangeClass(attribution.change)"
            >
              {{ attribution.change > 0 ? '+' : '' }}{{ attribution.change.toFixed(2) }}
            </div>
            <div
              class="change-percent"
              :class="getChangeClass(attribution.changePercent)"
            >
              {{ attribution.changePercent > 0 ? '+' : '' }}{{ attribution.changePercent.toFixed(2) }}%
            </div>
          </div>
        </div>

        <div class="attribution-content">
          <div class="attribution-text">
            <h5>归因分析</h5>
            <p>{{ attribution.attribution }}</p>
          </div>

          <div class="attribution-meta">
            <div class="meta-item">
              <el-icon><TrendCharts /></el-icon>
              <span>置信度: {{ (attribution.confidence * 100).toFixed(1) }}%</span>
            </div>
            <div class="meta-item">
              <el-icon><DataAnalysis /></el-icon>
              <span>成交量: {{ formatVolume(attribution.volume) }}</span>
            </div>
            <div class="meta-item">
              <el-icon><Clock /></el-icon>
              <span>{{ formatTime(attribution.timestamp) }}</span>
            </div>
          </div>

          <div class="attribution-actions">
            <el-button
              size="small"
              type="primary"
              @click="viewDetails(attribution)"
            >
              查看详情
            </el-button>
            <el-button
              size="small"
              @click="addToWatchlist(attribution)"
            >
              加入关注
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// computed 未使用，已移除
import type { HotspotAttribution } from '@/types/market'
import { TrendCharts, DataAnalysis, Clock } from '@element-plus/icons-vue'
import { logger } from "@/utils/logger"
import dayjs from 'dayjs'

interface Props {
  attributions: HotspotAttribution[]
}

const props = defineProps<Props>()

const getAttributionClass = (attribution: HotspotAttribution) => {
  if (attribution.changePercent > 5) return 'high-gain'
  if (attribution.changePercent < -5) return 'high-loss'
  if (attribution.changePercent > 0) return 'gain'
  return 'loss'
}

const getChangeClass = (value: number) => {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}

const formatVolume = (volume: number) => {
  if (volume >= 100000000) {
    return (volume / 100000000).toFixed(1) + '亿'
  } else if (volume >= 10000) {
    return (volume / 10000).toFixed(1) + '万'
  }
  return volume.toString()
}

const formatTime = (timestamp: string) => {
  return dayjs(timestamp).format('MM-DD HH:mm')
}

const viewDetails = (attribution: HotspotAttribution) => {
  // TODO: 实现查看详情功能
  logger.log('View details for:', attribution.symbol)
}

const addToWatchlist = (attribution: HotspotAttribution) => {
  // TODO: 实现加入关注功能
  logger.log('Add to watchlist:', attribution.symbol)
}
</script>

<style scoped>
.my-attribution-list {
  min-height: 200px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.attributions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.attribution-card {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.attribution-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.attribution-card.high-gain {
  border-left: 4px solid #67c23a;
  background: linear-gradient(135deg, #f0f9ff 0%, #e8f5e8 100%);
}

.attribution-card.high-loss {
  border-left: 4px solid #f56c6c;
  background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
}

.attribution-card.gain {
  border-left: 4px solid #67c23a;
}

.attribution-card.loss {
  border-left: 4px solid #f56c6c;
}

.attribution-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.stock-info {
  flex: 1;
}

.stock-symbol {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.stock-name {
  font-size: 14px;
  color: #666;
}

.price-change {
  text-align: right;
}

.change-value {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 4px;
}

.change-percent {
  font-size: 14px;
  font-weight: 600;
}

.positive {
  color: #67c23a;
}

.negative {
  color: #f56c6c;
}

.neutral {
  color: #909399;
}

.attribution-content {
  color: #666;
}

.attribution-text {
  margin-bottom: 15px;
}

.attribution-text h5 {
  color: #333;
  margin-bottom: 8px;
  font-size: 14px;
}

.attribution-text p {
  line-height: 1.6;
  font-size: 14px;
}

.attribution-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 15px;
  font-size: 12px;
  color: #999;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.attribution-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .attributions-grid {
    grid-template-columns: 1fr;
  }

  .attribution-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .price-change {
    text-align: left;
  }

  .attribution-meta {
    flex-direction: column;
    gap: 8px;
  }

  .attribution-actions {
    justify-content: stretch;
  }

  .attribution-actions .el-button {
    flex: 1;
  }
}
</style>

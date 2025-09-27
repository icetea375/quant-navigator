<template>
  <el-card
    v-loading="loading"
    class="briefing-card"
  >
    <template #header>
      <div class="card-header">
        <h3>市场简报</h3>
        <el-tag
          type="success"
          size="small"
        >
          实时更新
        </el-tag>
      </div>
    </template>

    <div class="briefing-content">
      <div class="summary-section">
        <h4>今日市场概览</h4>
        <p class="summary-text">
          {{ briefing.summary || '正在加载市场数据...' }}
        </p>
      </div>

      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">
            {{ briefing.events?.length || 0 }}
          </div>
          <div class="stat-label">
            重要事件
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-value">
            {{ briefing.hotspots?.length || 0 }}
          </div>
          <div class="stat-label">
            热点股票
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-value">
            {{ getHighImpactCount() }}
          </div>
          <div class="stat-label">
            高影响事件
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-value">
            {{ getPositiveCount() }}
          </div>
          <div class="stat-label">
            正面影响
          </div>
        </div>
      </div>

      <div class="update-time">
        <el-icon><Clock /></el-icon>
        <span>最后更新: {{ formatTime(briefing.date) }}</span>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { logger } from "@/utils/logger"
import { marketApi } from '@/services/market'
import type { MarketBriefing } from '@/types/market'
import { Clock } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const briefing = ref<MarketBriefing>({
  date: new Date().toISOString(),
  events: [],
  hotspots: [],
  summary: ''
})

const loading = ref(false)

const getHighImpactCount = () => {
  return briefing.value.events?.filter(event => event.importance === 'high').length || 0
}

const getPositiveCount = () => {
  return briefing.value.events?.filter(event => event.impact === 'positive').length || 0
}

const formatTime = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

const loadBriefing = async () => {
  loading.value = true
  try {
    const data = await marketApi.getMarketBriefing()
    briefing.value = data
  } catch (error) {
    logger.error('Failed to load market briefing:', error)
    briefing.value.summary = '数据加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadBriefing()
})
</script>

<style scoped>
.briefing-card {
  margin-bottom: 30px;
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

.briefing-content {
  padding: 20px 0;
}

.summary-section {
  margin-bottom: 30px;
}

.summary-section h4 {
  color: #333;
  margin-bottom: 15px;
  font-size: 18px;
}

.summary-text {
  color: #666;
  line-height: 1.6;
  font-size: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.update-time {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #999;
  font-size: 14px;
  justify-content: center;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-value {
    font-size: 24px;
  }
}
</style>

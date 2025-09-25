<template>
  <div class="my-briefing-card">
    <div class="briefing-header">
      <h4>个性化市场分析</h4>
      <el-tag type="success" size="small">专属定制</el-tag>
    </div>
    
    <div class="briefing-content">
      <div class="summary-section">
        <p class="summary-text">{{ briefing.summary || '正在生成个性化分析...' }}</p>
      </div>
      
      <div class="personalized-stats">
        <div class="stat-item">
          <div class="stat-value">{{ getRelevantEventsCount() }}</div>
          <div class="stat-label">相关事件</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ getHighConfidenceCount() }}</div>
          <div class="stat-label">高置信度</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ getRiskLevel() }}</div>
          <div class="stat-label">风险等级</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ getOpportunityScore() }}</div>
          <div class="stat-label">机会评分</div>
        </div>
      </div>
      
      <div class="personalized-insights">
        <h5>个性化洞察</h5>
        <ul class="insights-list">
          <li v-for="insight in personalizedInsights" :key="insight.id" class="insight-item">
            <el-icon :class="insight.type">
              <component :is="insight.icon" />
            </el-icon>
            <span>{{ insight.text }}</span>
          </li>
        </ul>
      </div>
      
      <div class="update-info">
        <el-icon><Clock /></el-icon>
        <span>基于您的持仓生成于 {{ formatTime(briefing.date) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MarketBriefing } from '@/types/market'
import { Clock, TrendCharts, Warning, Trophy, InfoFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

interface Props {
  briefing: MarketBriefing
}

const props = defineProps<Props>()

const getRelevantEventsCount = () => {
  return props.briefing.events?.length || 0
}

const getHighConfidenceCount = () => {
  return props.briefing.hotspots?.filter(h => h.confidence > 0.8).length || 0
}

const getRiskLevel = () => {
  const highRiskEvents = props.briefing.events?.filter(e => e.impact === 'negative' && e.importance === 'high').length || 0
  if (highRiskEvents > 3) return '高'
  if (highRiskEvents > 1) return '中'
  return '低'
}

const getOpportunityScore = () => {
  const positiveEvents = props.briefing.events?.filter(e => e.impact === 'positive').length || 0
  const totalEvents = props.briefing.events?.length || 1
  return Math.round((positiveEvents / totalEvents) * 100)
}

const personalizedInsights = computed(() => {
  const insights = []
  
  // 基于事件生成洞察
  if (props.briefing.events?.length) {
    const highImpactEvents = props.briefing.events.filter(e => e.importance === 'high')
    if (highImpactEvents.length > 0) {
      insights.push({
        id: 'high-impact',
        type: 'warning',
        icon: 'Warning',
        text: `发现 ${highImpactEvents.length} 个高影响事件，建议密切关注`
      })
    }
  }
  
  // 基于热点生成洞察
  if (props.briefing.hotspots?.length) {
    const highConfidenceHotspots = props.briefing.hotspots.filter(h => h.confidence > 0.8)
    if (highConfidenceHotspots.length > 0) {
      insights.push({
        id: 'high-confidence',
        type: 'success',
        icon: 'Trophy',
        text: `识别出 ${highConfidenceHotspots.length} 个高置信度投资机会`
      })
    }
  }
  
  // 基于市场趋势生成洞察
  const positiveEvents = props.briefing.events?.filter(e => e.impact === 'positive').length || 0
  const negativeEvents = props.briefing.events?.filter(e => e.impact === 'negative').length || 0
  
  if (positiveEvents > negativeEvents) {
    insights.push({
      id: 'positive-trend',
      type: 'success',
      icon: 'TrendCharts',
      text: '市场情绪偏向积极，建议适度增加风险敞口'
    })
  } else if (negativeEvents > positiveEvents) {
    insights.push({
      id: 'negative-trend',
      type: 'warning',
      icon: 'Warning',
      text: '市场情绪偏向谨慎，建议降低风险敞口'
    })
  }
  
  // 默认洞察
  if (insights.length === 0) {
    insights.push({
      id: 'default',
      type: 'info',
      icon: 'InfoFilled',
      text: '市场相对平稳，建议保持当前投资策略'
    })
  }
  
  return insights
})

const formatTime = (dateString: string) => {
  return dayjs(dateString).format('MM-DD HH:mm')
}
</script>

<style scoped>
.my-briefing-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 20px;
}

.briefing-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.briefing-header h4 {
  font-size: 20px;
  margin: 0;
}

.briefing-content {
  color: white;
}

.summary-section {
  margin-bottom: 30px;
}

.summary-text {
  font-size: 16px;
  line-height: 1.8;
  opacity: 0.95;
}

.personalized-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-item {
  text-align: center;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.8;
}

.personalized-insights {
  margin-bottom: 25px;
}

.personalized-insights h5 {
  font-size: 16px;
  margin-bottom: 15px;
  opacity: 0.9;
}

.insights-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.insight-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  font-size: 14px;
  opacity: 0.9;
}

.insight-item .el-icon {
  font-size: 16px;
}

.insight-item .el-icon.warning {
  color: #ffd700;
}

.insight-item .el-icon.success {
  color: #90ee90;
}

.insight-item .el-icon.info {
  color: #87ceeb;
}

.update-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  opacity: 0.7;
  justify-content: center;
}

@media (max-width: 768px) {
  .my-briefing-card {
    padding: 20px;
  }
  
  .personalized-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .briefing-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}
</style>


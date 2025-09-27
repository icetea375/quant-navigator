<template>
  <div class="risk-factor-analysis">
    <h3>⚠️ 风险因子分析</h3>
    <p class="description">
      全面分析各类风险因子，为仲裁决策提供风险控制依据
    </p>

    <div class="analysis-content">
      <!-- 风险概览 -->
      <div class="risk-overview">
        <h4>📊 风险概览</h4>
        <div class="risk-summary">
          <div class="summary-card">
            <div class="summary-title">
              总体风险等级
            </div>
            <div
              class="summary-value"
              :class="getRiskLevelClass(riskData.overallRisk)"
            >
              {{ getRiskLevelText(riskData.overallRisk) }}
            </div>
            <div class="summary-score">
              {{ riskData.overallRisk }}/100
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-title">
              风险变化趋势
            </div>
            <div
              class="summary-value"
              :class="getTrendClass(riskData.riskTrend)"
            >
              {{ getTrendText(riskData.riskTrend) }}
            </div>
            <div class="summary-score">
              {{ riskData.riskChange }}%
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-title">
              关键风险数量
            </div>
            <div class="summary-value">
              {{ riskData.criticalRisks }}
            </div>
            <div class="summary-score">
              个
            </div>
          </div>
        </div>
      </div>

      <!-- 风险分类分析 -->
      <div class="risk-categories">
        <h4>🔍 风险分类分析</h4>
        <div class="categories-grid">
          <div
            v-for="(category, index) in riskCategories"
            :key="index"
            class="category-card"
            :class="getCategoryClass(category.level)"
          >
            <div class="category-header">
              <div class="category-icon">
                {{ category.icon }}
              </div>
              <div class="category-title">
                {{ category.name }}
              </div>
              <div
                class="category-level"
                :class="getLevelClass(category.level)"
              >
                {{ getLevelText(category.level) }}
              </div>
            </div>

            <div class="category-content">
              <div class="risk-score">
                <span class="score-label">风险评分:</span>
                <span class="score-value">{{ category.score }}/100</span>
                <div class="score-bar">
                  <div
                    class="score-fill"
                    :style="{ width: category.score + '%' }"
                  />
                </div>
              </div>

              <div class="risk-factors">
                <div class="factors-title">
                  主要风险因子:
                </div>
                <div class="factors-list">
                  <span
                    v-for="(factor, factorIndex) in category.factors"
                    :key="factorIndex"
                    class="factor-tag"
                    :class="getFactorClass(factor.impact)"
                  >
                    {{ factor.name }}
                  </span>
                </div>
              </div>

              <div class="risk-description">
                {{ category.description }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 风险事件追踪 -->
      <div class="risk-events">
        <h4>📰 风险事件追踪</h4>
        <div class="events-list">
          <div
            v-for="(event, index) in riskEvents"
            :key="index"
            class="event-card"
            :class="event.severity"
          >
            <div class="event-header">
              <div class="event-title">
                {{ event.title }}
              </div>
              <div
                class="event-severity"
                :class="getSeverityClass(event.severity)"
              >
                {{ getSeverityText(event.severity) }}
              </div>
            </div>

            <div class="event-content">
              <div class="event-description">
                {{ event.description }}
              </div>
              <div class="event-meta">
                <span class="event-time">{{ formatTime(event.time) }}</span>
                <span class="event-source">{{ event.source }}</span>
                <span class="event-impact">影响度: {{ event.impact }}/10</span>
              </div>
            </div>

            <div class="event-actions">
              <button class="action-btn primary">
                查看详情
              </button>
              <button class="action-btn secondary">
                标记处理
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 风险预警 -->
      <div class="risk-alerts">
        <h4>🚨 风险预警</h4>
        <div class="alerts-list">
          <div
            v-for="(alert, index) in riskAlerts"
            :key="index"
            class="alert-item"
            :class="alert.type"
          >
            <div class="alert-icon">
              {{ getAlertIcon(alert.type) }}
            </div>
            <div class="alert-content">
              <div class="alert-title">
                {{ alert.title }}
              </div>
              <div class="alert-description">
                {{ alert.description }}
              </div>
              <div class="alert-time">
                {{ formatTime(alert.time) }}
              </div>
            </div>
            <div class="alert-actions">
              <button class="alert-btn">
                处理
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 风险缓解建议 -->
      <div class="risk-mitigation">
        <h4>💡 风险缓解建议</h4>
        <div class="mitigation-suggestions">
          <div
            v-for="(suggestion, index) in mitigationSuggestions"
            :key="index"
            class="suggestion-card"
            :class="suggestion.priority"
          >
            <div class="suggestion-header">
              <div class="suggestion-title">
                {{ suggestion.title }}
              </div>
              <div
                class="suggestion-priority"
                :class="getPriorityClass(suggestion.priority)"
              >
                {{ getPriorityText(suggestion.priority) }}
              </div>
            </div>

            <div class="suggestion-content">
              <div class="suggestion-description">
                {{ suggestion.description }}
              </div>
              <div class="suggestion-actions">
                <div class="action-item">
                  <span class="action-label">预期效果:</span>
                  <span class="action-value">{{ suggestion.expectedEffect }}</span>
                </div>
                <div class="action-item">
                  <span class="action-label">实施难度:</span>
                  <span class="action-value">{{ suggestion.difficulty }}</span>
                </div>
                <div class="action-item">
                  <span class="action-label">时间成本:</span>
                  <span class="action-value">{{ suggestion.timeCost }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { logger } from "@/utils/logger"

interface Props {
  stockCode: string
  reportDate: string
  arbitrationCase: any
}

const props = defineProps<Props>()

// 风险数据（模拟数据）
const riskData = ref({
  overallRisk: 65,
  riskTrend: 'up',
  riskChange: 12.5,
  criticalRisks: 3
})

// 风险分类
const riskCategories = ref([
  {
    name: '市场风险',
    icon: '📈',
    level: 'medium',
    score: 68,
    factors: [
      { name: '市场波动', impact: 'high' },
      { name: '流动性风险', impact: 'medium' },
      { name: '汇率风险', impact: 'low' }
    ],
    description: '市场整体波动性增加，流动性有所收紧'
  },
  {
    name: '信用风险',
    icon: '💳',
    level: 'low',
    score: 35,
    factors: [
      { name: '违约风险', impact: 'low' },
      { name: '评级下调', impact: 'low' }
    ],
    description: '信用状况良好，违约风险较低'
  },
  {
    name: '操作风险',
    icon: '⚙️',
    level: 'high',
    score: 78,
    factors: [
      { name: '系统故障', impact: 'high' },
      { name: '人为错误', impact: 'medium' },
      { name: '流程缺陷', impact: 'high' }
    ],
    description: '系统稳定性存在隐患，操作流程需要优化'
  },
  {
    name: '流动性风险',
    icon: '💧',
    level: 'medium',
    score: 55,
    factors: [
      { name: '资金缺口', impact: 'medium' },
      { name: '资产变现', impact: 'low' }
    ],
    description: '流动性状况一般，需要关注资金管理'
  }
])

// 风险事件
const riskEvents = ref([
  {
    title: '系统异常导致交易中断',
    description: '交易系统出现技术故障，导致部分交易无法正常执行',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000),
    source: '系统监控',
    severity: 'high',
    impact: 8
  },
  {
    title: '市场大幅波动',
    description: '受外部因素影响，市场出现剧烈波动',
    time: new Date(Date.now() - 4 * 60 * 60 * 1000),
    source: '市场数据',
    severity: 'medium',
    impact: 6
  },
  {
    title: '监管政策变化',
    description: '监管部门发布新的政策规定，可能影响业务开展',
    time: new Date(Date.now() - 6 * 60 * 60 * 1000),
    source: '监管公告',
    severity: 'low',
    impact: 4
  }
])

// 风险预警
const riskAlerts = ref([
  {
    type: 'critical',
    title: '高风险预警',
    description: '操作风险评分超过75分，建议立即采取缓解措施',
    time: new Date(Date.now() - 1 * 60 * 60 * 1000)
  },
  {
    type: 'warning',
    title: '中等风险提醒',
    description: '市场风险持续上升，需要密切关注市场变化',
    time: new Date(Date.now() - 3 * 60 * 60 * 1000)
  }
])

// 缓解建议
const mitigationSuggestions = ref([
  {
    title: '加强系统监控',
    description: '部署更完善的系统监控工具，提高故障检测和响应能力',
    priority: 'high',
    expectedEffect: '降低系统故障风险30%',
    difficulty: '中等',
    timeCost: '2-3周'
  },
  {
    title: '优化操作流程',
    description: '重新设计关键业务流程，减少人为操作环节',
    priority: 'high',
    expectedEffect: '减少操作错误50%',
    difficulty: '较高',
    timeCost: '1-2个月'
  },
  {
    title: '增加风险对冲',
    description: '通过金融衍生品对冲市场风险敞口',
    priority: 'medium',
    expectedEffect: '降低市场风险20%',
    difficulty: '中等',
    timeCost: '1周'
  }
])

// 方法
const getRiskLevelClass = (score: number) => {
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

const getRiskLevelText = (score: number) => {
  if (score >= 80) return '极高'
  if (score >= 60) return '高'
  if (score >= 40) return '中等'
  return '低'
}

const getTrendClass = (trend: string) => {
  return trend === 'up' ? 'trend-up' : trend === 'down' ? 'trend-down' : 'trend-stable'
}

const getTrendText = (trend: string) => {
  const texts: Record<string, string> = {
    up: '上升',
    down: '下降',
    stable: '稳定'
  }
  return texts[trend] || '未知'
}

const getCategoryClass = (level: string) => {
  return `category-${level}`
}

const getLevelClass = (level: string) => {
  return `level-${level}`
}

const getLevelText = (level: string) => {
  const texts: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return texts[level as keyof typeof texts] || '未知'
}

const getFactorClass = (impact: string) => {
  return `factor-${impact}`
}

const getSeverityClass = (severity: string) => {
  return `severity-${severity}`
}

const getSeverityText = (severity: string) => {
  const texts: Record<string, string> = {
    high: '严重',
    medium: '中等',
    low: '轻微'
  }
  return texts[severity as keyof typeof texts] || '未知'
}

const getAlertIcon = (type: string) => {
  const icons: Record<string, string> = {
    critical: '🔴',
    warning: '🟡',
    info: '🔵'
  }
  return icons[type] || '⚪'
}

const getPriorityClass = (priority: string) => {
  return `priority-${priority}`
}

const getPriorityText = (priority: string) => {
  const texts: Record<string, string> = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  }
  return texts[priority] || '未知'
}

const formatTime = (time: Date) => {
  return time.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 生命周期
onMounted(() => {
  logger.log(`加载股票 ${props.stockCode} 在 ${props.reportDate} 的风险因子分析数据`)
})
</script>

<style scoped>
.risk-factor-analysis {
  padding: 20px;
}

.risk-factor-analysis h3 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.description {
  color: #7f8c8d;
  margin-bottom: 20px;
  font-size: 14px;
}

.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.risk-overview h4,
.risk-categories h4,
.risk-events h4,
.risk-alerts h4,
.risk-mitigation h4 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 16px;
}

.risk-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.summary-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.summary-title {
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 10px;
}

.summary-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.summary-value.critical {
  color: #e74c3c;
}

.summary-value.high {
  color: #f39c12;
}

.summary-value.medium {
  color: #3498db;
}

.summary-value.low {
  color: #27ae60;
}

.summary-value.trend-up {
  color: #e74c3c;
}

.summary-value.trend-down {
  color: #27ae60;
}

.summary-value.trend-stable {
  color: #7f8c8d;
}

.summary-score {
  font-size: 12px;
  color: #7f8c8d;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.category-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.category-card.category-high {
  border-left: 4px solid #e74c3c;
}

.category-card.category-medium {
  border-left: 4px solid #f39c12;
}

.category-card.category-low {
  border-left: 4px solid #27ae60;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.category-icon {
  font-size: 20px;
}

.category-title {
  flex: 1;
  font-weight: bold;
  color: #2c3e50;
}

.category-level {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.category-level.level-high {
  background: #f8d7da;
  color: #721c24;
}

.category-level.level-medium {
  background: #fff3cd;
  color: #856404;
}

.category-level.level-low {
  background: #d4edda;
  color: #155724;
}

.category-content {
  padding: 15px;
}

.risk-score {
  margin-bottom: 15px;
}

.score-label {
  font-size: 12px;
  color: #7f8c8d;
  margin-right: 10px;
}

.score-value {
  font-weight: bold;
  color: #2c3e50;
  margin-right: 10px;
}

.score-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 5px;
}

.score-fill {
  height: 100%;
  background: #3498db;
  transition: width 0.3s ease;
}

.risk-factors {
  margin-bottom: 15px;
}

.factors-title {
  font-size: 12px;
  color: #7f8c8d;
  margin-bottom: 8px;
}

.factors-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.factor-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.factor-tag.factor-high {
  background: #f8d7da;
  color: #721c24;
}

.factor-tag.factor-medium {
  background: #fff3cd;
  color: #856404;
}

.factor-tag.factor-low {
  background: #d4edda;
  color: #155724;
}

.risk-description {
  font-size: 14px;
  color: #555;
  line-height: 1.4;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.event-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.event-card.high {
  border-left: 4px solid #e74c3c;
}

.event-card.medium {
  border-left: 4px solid #f39c12;
}

.event-card.low {
  border-left: 4px solid #27ae60;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.event-title {
  font-weight: bold;
  color: #2c3e50;
}

.event-severity {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.event-severity.severity-high {
  background: #f8d7da;
  color: #721c24;
}

.event-severity.severity-medium {
  background: #fff3cd;
  color: #856404;
}

.event-severity.severity-low {
  background: #d4edda;
  color: #155724;
}

.event-content {
  padding: 15px;
}

.event-description {
  font-size: 14px;
  color: #555;
  margin-bottom: 10px;
  line-height: 1.4;
}

.event-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #7f8c8d;
}

.event-actions {
  padding: 15px;
  background: #f8f9fa;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn.primary {
  background: #3498db;
  color: white;
}

.action-btn.primary:hover {
  background: #2980b9;
}

.action-btn.secondary {
  background: #95a5a6;
  color: white;
}

.action-btn.secondary:hover {
  background: #7f8c8d;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid;
}

.alert-item.critical {
  background: #fdf2f2;
  border-left-color: #e74c3c;
}

.alert-item.warning {
  background: #fef9e7;
  border-left-color: #f39c12;
}

.alert-item.info {
  background: #e3f2fd;
  border-left-color: #3498db;
}

.alert-icon {
  font-size: 20px;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.alert-description {
  font-size: 14px;
  color: #555;
  margin-bottom: 5px;
}

.alert-time {
  font-size: 12px;
  color: #7f8c8d;
}

.alert-actions {
  display: flex;
  gap: 10px;
}

.alert-btn {
  padding: 6px 12px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.alert-btn:hover {
  background: #2980b9;
}

.mitigation-suggestions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.suggestion-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.suggestion-card.high {
  border-left: 4px solid #e74c3c;
}

.suggestion-card.medium {
  border-left: 4px solid #f39c12;
}

.suggestion-card.low {
  border-left: 4px solid #27ae60;
}

.suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.suggestion-title {
  font-weight: bold;
  color: #2c3e50;
}

.suggestion-priority {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.suggestion-priority.priority-high {
  background: #f8d7da;
  color: #721c24;
}

.suggestion-priority.priority-medium {
  background: #fff3cd;
  color: #856404;
}

.suggestion-priority.priority-low {
  background: #d4edda;
  color: #155724;
}

.suggestion-content {
  padding: 15px;
}

.suggestion-description {
  font-size: 14px;
  color: #555;
  margin-bottom: 15px;
  line-height: 1.4;
}

.suggestion-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.action-label {
  color: #7f8c8d;
}

.action-value {
  color: #2c3e50;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .risk-summary,
  .categories-grid,
  .mitigation-suggestions {
    grid-template-columns: 1fr;
  }

  .event-meta {
    flex-direction: column;
    gap: 5px;
  }

  .event-actions {
    flex-direction: column;
  }

  .alert-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .alert-actions {
    margin-top: 10px;
  }
}
</style>

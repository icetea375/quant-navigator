<template>
  <div class="market-sentiment-monitor">
    <h3>😊 市场情绪监控</h3>
    <p class="description">实时监控市场情绪变化，为仲裁决策提供情绪面参考</p>

    <div class="monitor-content">
      <!-- 情绪指标概览 -->
      <div class="sentiment-overview">
        <h4>📊 情绪指标概览</h4>
        <div class="sentiment-metrics">
          <div class="metric-card">
            <div class="metric-title">整体情绪指数</div>
            <div class="metric-value" :class="getSentimentClass(sentimentData.overallSentiment)">
              {{ sentimentData.overallSentiment }}
            </div>
            <div class="metric-description">{{ getSentimentDescription(sentimentData.overallSentiment) }}</div>
          </div>

          <div class="metric-card">
            <div class="metric-title">恐慌指数 (VIX)</div>
            <div class="metric-value" :class="getVIXClass(sentimentData.vix)">
              {{ sentimentData.vix }}
            </div>
            <div class="metric-description">{{ getVIXDescription(sentimentData.vix) }}</div>
          </div>

          <div class="metric-card">
            <div class="metric-title">贪婪指数</div>
            <div class="metric-value" :class="getGreedClass(sentimentData.greedIndex)">
              {{ sentimentData.greedIndex }}
            </div>
            <div class="metric-description">{{ getGreedDescription(sentimentData.greedIndex) }}</div>
          </div>
        </div>
      </div>

      <!-- 情绪来源分析 -->
      <div class="sentiment-sources">
        <h4>🔍 情绪来源分析</h4>
        <div class="sources-grid">
          <div class="source-card">
            <div class="source-title">新闻情绪</div>
            <div class="source-score" :class="getScoreClass(sentimentData.newsSentiment)">
              {{ sentimentData.newsSentiment }}
            </div>
            <div class="source-trend" :class="getTrendClass(sentimentData.newsTrend)">
              {{ getTrendText(sentimentData.newsTrend) }}
            </div>
          </div>

          <div class="source-card">
            <div class="source-title">社交媒体</div>
            <div class="source-score" :class="getScoreClass(sentimentData.socialSentiment)">
              {{ sentimentData.socialSentiment }}
            </div>
            <div class="source-trend" :class="getTrendClass(sentimentData.socialTrend)">
              {{ getTrendText(sentimentData.socialTrend) }}
            </div>
          </div>

          <div class="source-card">
            <div class="source-title">分析师观点</div>
            <div class="source-score" :class="getScoreClass(sentimentData.analystSentiment)">
              {{ sentimentData.analystSentiment }}
            </div>
            <div class="source-trend" :class="getTrendClass(sentimentData.analystTrend)">
              {{ getTrendText(sentimentData.analystTrend) }}
            </div>
          </div>

          <div class="source-card">
            <div class="source-title">机构资金</div>
            <div class="source-score" :class="getScoreClass(sentimentData.institutionalSentiment)">
              {{ sentimentData.institutionalSentiment }}
            </div>
            <div class="source-trend" :class="getTrendClass(sentimentData.institutionalTrend)">
              {{ getTrendText(sentimentData.institutionalTrend) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 情绪事件追踪 -->
      <div class="sentiment-events">
        <h4>📰 情绪事件追踪</h4>
        <div class="events-timeline">
          <div
            v-for="(event, index) in sentimentEvents"
            :key="index"
            class="event-item"
            :class="event.impact"
          >
            <div class="event-time">{{ formatTime(event.time) }}</div>
            <div class="event-content">
              <div class="event-title">{{ event.title }}</div>
              <div class="event-description">{{ event.description }}</div>
              <div class="event-impact">
                影响程度: {{ event.impactLevel }}/10
                <div class="impact-bar">
                  <div
                    class="impact-fill"
                    :style="{ width: (event.impactLevel * 10) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
            <div class="event-sentiment" :class="getEventSentimentClass(event.sentiment)">
              {{ event.sentiment }}
            </div>
          </div>
        </div>
      </div>

      <!-- 情绪预测 -->
      <div class="sentiment-prediction">
        <h4>🔮 情绪预测</h4>
        <div class="prediction-content">
          <div class="prediction-chart">
            <h5>未来7天情绪预测</h5>
            <div class="chart-container">
              <div class="prediction-line">
                <div
                  v-for="(point, index) in sentimentPrediction"
                  :key="index"
                  class="prediction-point"
                  :style="{
                    left: (index * 14.28) + '%',
                    bottom: (point.value * 2) + 'px'
                  }"
                  :class="getPredictionClass(point.value)"
                ></div>
              </div>
              <div class="prediction-labels">
                <div class="label">今天</div>
                <div class="label">+3天</div>
                <div class="label">+7天</div>
              </div>
            </div>
          </div>

          <div class="prediction-summary">
            <h5>预测摘要</h5>
            <div class="summary-item">
              <span class="label">趋势方向:</span>
              <span class="value" :class="getTrendClass(predictionSummary.trend)">
                {{ getTrendText(predictionSummary.trend) }}
              </span>
            </div>
            <div class="summary-item">
              <span class="label">预期变化:</span>
              <span class="value">{{ predictionSummary.expectedChange }}</span>
            </div>
            <div class="summary-item">
              <span class="label">置信度:</span>
              <span class="value">{{ predictionSummary.confidence }}%</span>
            </div>
            <div class="summary-item">
              <span class="label">关键风险:</span>
              <span class="value">{{ predictionSummary.keyRisks }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
  stockCode: string
  reportDate: string
}

const props = defineProps<Props>()

// 情绪数据（模拟数据）
const sentimentData = ref({
  overallSentiment: 65,
  vix: 18.5,
  greedIndex: 72,
  newsSentiment: 68,
  newsTrend: 'up',
  socialSentiment: 62,
  socialTrend: 'stable',
  analystSentiment: 75,
  analystTrend: 'up',
  institutionalSentiment: 58,
  institutionalTrend: 'down'
})

// 情绪事件
const sentimentEvents = ref([
  {
    time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
    title: '重大利好消息发布',
    description: '公司宣布与知名企业达成战略合作协议',
    sentiment: 'positive',
    impact: 'high',
    impactLevel: 8
  },
  {
    time: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4小时前
    title: '分析师上调评级',
    description: '多家券商将目标价上调至20元',
    sentiment: 'positive',
    impact: 'medium',
    impactLevel: 6
  },
  {
    time: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6小时前
    title: '市场担忧情绪',
    description: '行业政策不确定性增加',
    sentiment: 'negative',
    impact: 'medium',
    impactLevel: 5
  }
])

// 情绪预测
const sentimentPrediction = ref([
  { value: 65 },
  { value: 68 },
  { value: 72 },
  { value: 70 },
  { value: 75 },
  { value: 78 },
  { value: 80 }
])

const predictionSummary = ref({
  trend: 'up',
  expectedChange: '+15点',
  confidence: 78,
  keyRisks: '政策变化、市场波动'
})

// 方法
const getSentimentClass = (score: number) => {
  if (score >= 70) return 'positive'
  if (score >= 40) return 'neutral'
  return 'negative'
}

const getSentimentDescription = (score: number) => {
  if (score >= 70) return '市场情绪乐观'
  if (score >= 40) return '市场情绪中性'
  return '市场情绪悲观'
}

const getVIXClass = (vix: number) => {
  if (vix >= 30) return 'high'
  if (vix >= 20) return 'medium'
  return 'low'
}

const getVIXDescription = (vix: number) => {
  if (vix >= 30) return '恐慌情绪严重'
  if (vix >= 20) return '恐慌情绪适中'
  return '恐慌情绪较低'
}

const getGreedClass = (greed: number) => {
  if (greed >= 70) return 'high'
  if (greed >= 40) return 'medium'
  return 'low'
}

const getGreedDescription = (greed: number) => {
  if (greed >= 70) return '贪婪情绪高涨'
  if (greed >= 40) return '贪婪情绪适中'
  return '贪婪情绪较低'
}

const getScoreClass = (score: number) => {
  if (score >= 60) return 'positive'
  if (score >= 40) return 'neutral'
  return 'negative'
}

const getTrendClass = (trend: string) => {
  return trend === 'up' ? 'trend-up' : trend === 'down' ? 'trend-down' : 'trend-stable'
}

const getTrendText = (trend: string) => {
  const texts = {
    up: '上升',
    down: '下降',
    stable: '稳定'
  }
  return texts[trend] || '未知'
}

const getEventSentimentClass = (sentiment: string) => {
  return sentiment === 'positive' ? 'positive' : sentiment === 'negative' ? 'negative' : 'neutral'
}

const getPredictionClass = (value: number) => {
  if (value >= 70) return 'high'
  if (value >= 40) return 'medium'
  return 'low'
}

const formatTime = (time: Date) => {
  return time.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 生命周期
onMounted(() => {
  console.log(`加载股票 ${props.stockCode} 在 ${props.reportDate} 的市场情绪数据`)
})
</script>

<style scoped>
.market-sentiment-monitor {
  padding: 20px;
}

.market-sentiment-monitor h3 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.description {
  color: #7f8c8d;
  margin-bottom: 20px;
  font-size: 14px;
}

.monitor-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.sentiment-overview h4,
.sentiment-sources h4,
.sentiment-events h4,
.sentiment-prediction h4 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 16px;
}

.sentiment-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.metric-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.metric-title {
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 10px;
}

.metric-value {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 10px;
}

.metric-value.positive {
  color: #27ae60;
}

.metric-value.negative {
  color: #e74c3c;
}

.metric-value.neutral {
  color: #f39c12;
}

.metric-value.high {
  color: #e74c3c;
}

.metric-value.medium {
  color: #f39c12;
}

.metric-value.low {
  color: #27ae60;
}

.metric-description {
  font-size: 12px;
  color: #7f8c8d;
}

.sources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.source-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  text-align: center;
}

.source-title {
  font-size: 14px;
  color: #2c3e50;
  margin-bottom: 10px;
  font-weight: bold;
}

.source-score {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
}

.source-score.positive {
  color: #27ae60;
}

.source-score.negative {
  color: #e74c3c;
}

.source-score.neutral {
  color: #f39c12;
}

.source-trend {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.source-trend.trend-up {
  background: #d4edda;
  color: #155724;
}

.source-trend.trend-down {
  background: #f8d7da;
  color: #721c24;
}

.source-trend.trend-stable {
  background: #e2e3e5;
  color: #383d41;
}

.events-timeline {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.event-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid;
}

.event-item.high {
  background: #fdf2f2;
  border-left-color: #e74c3c;
}

.event-item.medium {
  background: #fef9e7;
  border-left-color: #f39c12;
}

.event-item.low {
  background: #e8f5e8;
  border-left-color: #27ae60;
}

.event-time {
  font-size: 12px;
  color: #7f8c8d;
  min-width: 60px;
  margin-top: 2px;
}

.event-content {
  flex: 1;
}

.event-title {
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.event-description {
  font-size: 14px;
  color: #555;
  margin-bottom: 10px;
  line-height: 1.4;
}

.event-impact {
  font-size: 12px;
  color: #7f8c8d;
  display: flex;
  align-items: center;
  gap: 10px;
}

.impact-bar {
  flex: 1;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.impact-fill {
  height: 100%;
  background: #3498db;
  transition: width 0.3s ease;
}

.event-sentiment {
  font-size: 20px;
  margin-top: 2px;
}

.event-sentiment.positive {
  color: #27ae60;
}

.event-sentiment.negative {
  color: #e74c3c;
}

.event-sentiment.neutral {
  color: #7f8c8d;
}

.prediction-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
}

.prediction-chart h5,
.prediction-summary h5 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 14px;
}

.chart-container {
  position: relative;
  height: 200px;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 20px;
}

.prediction-line {
  position: relative;
  height: 160px;
  width: 100%;
}

.prediction-point {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transform: translate(-50%, 50%);
}

.prediction-point.high {
  background: #27ae60;
}

.prediction-point.medium {
  background: #f39c12;
}

.prediction-point.low {
  background: #e74c3c;
}

.prediction-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 12px;
  color: #7f8c8d;
}

.prediction-summary {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.summary-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.summary-item .label {
  font-size: 14px;
  color: #7f8c8d;
}

.summary-item .value {
  font-size: 14px;
  font-weight: bold;
  color: #2c3e50;
}

.summary-item .value.trend-up {
  color: #27ae60;
}

.summary-item .value.trend-down {
  color: #e74c3c;
}

.summary-item .value.trend-stable {
  color: #f39c12;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sentiment-metrics,
  .sources-grid {
    grid-template-columns: 1fr;
  }

  .prediction-content {
    grid-template-columns: 1fr;
  }

  .event-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .event-time {
    min-width: auto;
  }
}
</style>

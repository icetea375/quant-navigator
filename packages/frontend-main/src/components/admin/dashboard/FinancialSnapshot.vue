<template>
  <div class="financial-snapshot">
    <h3>💰 财务快照</h3>
    <p class="description">
      基于最新财务数据的深度分析，为仲裁决策提供财务依据
    </p>

    <div class="snapshot-content">
      <!-- 财务指标概览 -->
      <div class="financial-overview">
        <h4>📊 财务指标概览</h4>
        <div class="metrics-grid">
          <div class="metric-card revenue">
            <div class="metric-icon">
              💰
            </div>
            <div class="metric-content">
              <div class="metric-label">
                营业收入
              </div>
              <div class="metric-value">
                {{ financialData.revenue || 'N/A' }}
              </div>
              <div
                class="metric-change"
                :class="getChangeClass(financialData.revenueChange)"
              >
                {{ formatChange(financialData.revenueChange) }}
              </div>
            </div>
          </div>

          <div class="metric-card profit">
            <div class="metric-icon">
              📈
            </div>
            <div class="metric-content">
              <div class="metric-label">
                净利润
              </div>
              <div class="metric-value">
                {{ financialData.profit || 'N/A' }}
              </div>
              <div
                class="metric-change"
                :class="getChangeClass(financialData.profitChange)"
              >
                {{ formatChange(financialData.profitChange) }}
              </div>
            </div>
          </div>

          <div class="metric-card assets">
            <div class="metric-icon">
              🏦
            </div>
            <div class="metric-content">
              <div class="metric-label">
                总资产
              </div>
              <div class="metric-value">
                {{ financialData.totalAssets || 'N/A' }}
              </div>
              <div
                class="metric-change"
                :class="getChangeClass(financialData.assetsChange)"
              >
                {{ formatChange(financialData.assetsChange) }}
              </div>
            </div>
          </div>

          <div class="metric-card debt">
            <div class="metric-icon">
              📉
            </div>
            <div class="metric-content">
              <div class="metric-label">
                负债率
              </div>
              <div class="metric-value">
                {{ financialData.debtRatio || 'N/A' }}%
              </div>
              <div
                class="metric-change"
                :class="getChangeClass(financialData.debtRatioChange)"
              >
                {{ formatChange(financialData.debtRatioChange) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 盈利能力分析 -->
      <div class="profitability-analysis">
        <h4>💹 盈利能力分析</h4>
        <div class="profitability-metrics">
          <div class="metric-item">
            <span class="metric-label">毛利率</span>
            <div class="metric-bar">
              <div
                class="metric-fill"
                :style="{ width: Math.min((financialData.grossMargin || 0) * 2, 100) + '%' }"
              />
            </div>
            <span class="metric-value">{{ financialData.grossMargin || 0 }}%</span>
          </div>

          <div class="metric-item">
            <span class="metric-label">净利率</span>
            <div class="metric-bar">
              <div
                class="metric-fill"
                :style="{ width: Math.min((financialData.netMargin || 0) * 5, 100) + '%' }"
              />
            </div>
            <span class="metric-value">{{ financialData.netMargin || 0 }}%</span>
          </div>

          <div class="metric-item">
            <span class="metric-label">ROE</span>
            <div class="metric-bar">
              <div
                class="metric-fill"
                :style="{ width: Math.min((financialData.roe || 0) * 2, 100) + '%' }"
              />
            </div>
            <span class="metric-value">{{ financialData.roe || 0 }}%</span>
          </div>

          <div class="metric-item">
            <span class="metric-label">ROA</span>
            <div class="metric-bar">
              <div
                class="metric-fill"
                :style="{ width: Math.min((financialData.roa || 0) * 3, 100) + '%' }"
              />
            </div>
            <span class="metric-value">{{ financialData.roa || 0 }}%</span>
          </div>
        </div>
      </div>

      <!-- 财务健康度评估 -->
      <div class="financial-health">
        <h4>🏥 财务健康度评估</h4>
        <div class="health-scores">
          <div class="score-card">
            <div class="score-title">
              流动性评分
            </div>
            <div
              class="score-circle"
              :class="getScoreClass(financialData.liquidityScore)"
            >
              <div class="score-value">
                {{ financialData.liquidityScore || 0 }}
              </div>
            </div>
            <div class="score-description">
              基于流动比率和速动比率
            </div>
          </div>

          <div class="score-card">
            <div class="score-title">
              偿债能力评分
            </div>
            <div
              class="score-circle"
              :class="getScoreClass(financialData.solvencyScore)"
            >
              <div class="score-value">
                {{ financialData.solvencyScore || 0 }}
              </div>
            </div>
            <div class="score-description">
              基于资产负债率和利息保障倍数
            </div>
          </div>

          <div class="score-card">
            <div class="score-title">
              盈利能力评分
            </div>
            <div
              class="score-circle"
              :class="getScoreClass(financialData.profitabilityScore)"
            >
              <div class="score-value">
                {{ financialData.profitabilityScore || 0 }}
              </div>
            </div>
            <div class="score-description">
              基于ROE、ROA和净利率
            </div>
          </div>

          <div class="score-card">
            <div class="score-title">
              成长性评分
            </div>
            <div
              class="score-circle"
              :class="getScoreClass(financialData.growthScore)"
            >
              <div class="score-value">
                {{ financialData.growthScore || 0 }}
              </div>
            </div>
            <div class="score-description">
              基于营收和利润增长率
            </div>
          </div>
        </div>
      </div>

      <!-- 财务风险提示 -->
      <div class="financial-risks">
        <h4>⚠️ 财务风险提示</h4>
        <div class="risk-list">
          <div
            v-for="(risk, index) in financialRisks"
            :key="index"
            class="risk-item"
            :class="risk.level"
          >
            <div class="risk-icon">
              {{ getRiskIcon(risk.level) }}
            </div>
            <div class="risk-content">
              <div class="risk-title">
                {{ risk.title }}
              </div>
              <div class="risk-description">
                {{ risk.description }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 财务趋势分析 -->
      <div class="financial-trends">
        <h4>📈 财务趋势分析</h4>
        <div class="trend-charts">
          <div class="trend-chart">
            <h5>营收趋势</h5>
            <div class="chart-placeholder">
              <p>营收增长趋势图</p>
              <div
                class="trend-indicator"
                :class="getTrendClass(financialData.revenueTrend)"
              >
                {{ getTrendText(financialData.revenueTrend) }}
              </div>
            </div>
          </div>

          <div class="trend-chart">
            <h5>利润趋势</h5>
            <div class="chart-placeholder">
              <p>利润增长趋势图</p>
              <div
                class="trend-indicator"
                :class="getTrendClass(financialData.profitTrend)"
              >
                {{ getTrendText(financialData.profitTrend) }}
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

interface Props {
  stockCode: string
  reportDate: string
}

const props = defineProps<Props>()

// 财务数据（模拟数据）
const financialData = ref({
  revenue: '125.6亿',
  revenueChange: 12.5,
  profit: '18.9亿',
  profitChange: 8.3,
  totalAssets: '456.7亿',
  assetsChange: 5.2,
  debtRatio: 35.8,
  debtRatioChange: -2.1,
  grossMargin: 42.3,
  netMargin: 15.1,
  roe: 18.7,
  roa: 12.4,
  liquidityScore: 85,
  solvencyScore: 78,
  profitabilityScore: 92,
  growthScore: 76,
  revenueTrend: 'up',
  profitTrend: 'up'
})

// 财务风险列表
const financialRisks = ref([
  {
    level: 'high',
    title: '负债率偏高',
    description: '当前负债率为35.8%，接近行业警戒线，需关注偿债能力'
  },
  {
    level: 'medium',
    title: '现金流波动',
    description: '近季度现金流出现波动，需关注经营稳定性'
  },
  {
    level: 'low',
    title: '应收账款增加',
    description: '应收账款较上期增加8%，需关注回款风险'
  }
])

// 方法
const getChangeClass = (change: number) => {
  if (change > 0) return 'positive'
  if (change < 0) return 'negative'
  return 'neutral'
}

const formatChange = (change: number) => {
  if (change > 0) return `+${change}%`
  if (change < 0) return `${change}%`
  return '0%'
}

const getScoreClass = (score: number) => {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'fair'
  return 'poor'
}

const getRiskIcon = (level: string) => {
  const icons: Record<string, string> = {
    high: '🔴',
    medium: '🟡',
    low: '🟢'
  }
  return icons[level] || '⚪'
}

const getTrendClass = (trend: string) => {
  return trend === 'up' ? 'trend-up' : trend === 'down' ? 'trend-down' : 'trend-stable'
}

const getTrendText = (trend: string) => {
  const texts: Record<string, string> = {
    up: '上升趋势',
    down: '下降趋势',
    stable: '稳定趋势'
  }
  return texts[trend] || '未知趋势'
}

// 生命周期
onMounted(() => {
  // 这里可以调用API获取真实的财务数据
  console.log(`加载股票 ${props.stockCode} 在 ${props.reportDate} 的财务数据`)
})
</script>

<style scoped>
.financial-snapshot {
  padding: 20px;
}

.financial-snapshot h3 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.description {
  color: #7f8c8d;
  margin-bottom: 20px;
  font-size: 14px;
}

.snapshot-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.financial-overview h4,
.profitability-analysis h4,
.financial-health h4,
.financial-risks h4,
.financial-trends h4 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 16px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.metric-icon {
  font-size: 32px;
}

.metric-content {
  flex: 1;
}

.metric-label {
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 5px;
}

.metric-value {
  font-size: 20px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.metric-change {
  font-size: 12px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
}

.metric-change.positive {
  background: #d4edda;
  color: #155724;
}

.metric-change.negative {
  background: #f8d7da;
  color: #721c24;
}

.metric-change.neutral {
  background: #e2e3e5;
  color: #383d41;
}

.profitability-metrics {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.metric-label {
  min-width: 80px;
  font-size: 14px;
  color: #2c3e50;
}

.metric-bar {
  flex: 1;
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}

.metric-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  transition: width 0.3s ease;
}

.metric-value {
  min-width: 60px;
  text-align: right;
  font-weight: bold;
  color: #2c3e50;
}

.health-scores {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.score-card {
  text-align: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.score-title {
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 15px;
}

.score-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
  font-size: 24px;
  font-weight: bold;
  color: white;
}

.score-circle.excellent {
  background: #27ae60;
}

.score-circle.good {
  background: #3498db;
}

.score-circle.fair {
  background: #f39c12;
}

.score-circle.poor {
  background: #e74c3c;
}

.score-description {
  font-size: 12px;
  color: #7f8c8d;
}

.risk-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.risk-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid;
}

.risk-item.high {
  background: #fdf2f2;
  border-left-color: #e74c3c;
}

.risk-item.medium {
  background: #fef9e7;
  border-left-color: #f39c12;
}

.risk-item.low {
  background: #e8f5e8;
  border-left-color: #27ae60;
}

.risk-icon {
  font-size: 20px;
  margin-top: 2px;
}

.risk-content {
  flex: 1;
}

.risk-title {
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.risk-description {
  font-size: 14px;
  color: #555;
  line-height: 1.4;
}

.trend-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.trend-chart {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.trend-chart h5 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 14px;
}

.chart-placeholder {
  height: 200px;
  background: #f8f9fa;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #7f8c8d;
}

.trend-indicator {
  margin-top: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.trend-indicator.trend-up {
  background: #d4edda;
  color: #155724;
}

.trend-indicator.trend-down {
  background: #f8d7da;
  color: #721c24;
}

.trend-indicator.trend-stable {
  background: #e2e3e5;
  color: #383d41;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .metrics-grid,
  .health-scores,
  .trend-charts {
    grid-template-columns: 1fr;
  }

  .metric-card {
    flex-direction: column;
    text-align: center;
  }

  .metric-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .metric-label {
    min-width: auto;
  }
}
</style>

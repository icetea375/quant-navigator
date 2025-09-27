<template>
  <div class="technical-analysis">
    <h3>📈 技术指标分析</h3>
    <p class="description">
      基于技术指标的综合分析，为仲裁决策提供技术面支撑
    </p>

    <div class="analysis-content">
      <!-- 主要技术指标 -->
      <div class="main-indicators">
        <h4>📊 主要技术指标</h4>
        <div class="indicators-grid">
          <div class="indicator-card">
            <div class="indicator-title">
              移动平均线
            </div>
            <div class="indicator-values">
              <div class="value-item">
                <span class="label">MA5:</span>
                <span
                  class="value"
                  :class="getTrendClass(technicalData.ma5Trend)"
                >{{ technicalData.ma5 }}</span>
              </div>
              <div class="value-item">
                <span class="label">MA20:</span>
                <span
                  class="value"
                  :class="getTrendClass(technicalData.ma20Trend)"
                >{{ technicalData.ma20 }}</span>
              </div>
              <div class="value-item">
                <span class="label">MA60:</span>
                <span
                  class="value"
                  :class="getTrendClass(technicalData.ma60Trend)"
                >{{ technicalData.ma60 }}</span>
              </div>
            </div>
          </div>

          <div class="indicator-card">
            <div class="indicator-title">
              相对强弱指数 (RSI)
            </div>
            <div class="rsi-container">
              <div
                class="rsi-value"
                :class="getRSIClass(technicalData.rsi)"
              >
                {{ technicalData.rsi }}
              </div>
              <div class="rsi-bar">
                <div
                  class="rsi-fill"
                  :style="{ width: technicalData.rsi + '%' }"
                />
              </div>
              <div class="rsi-status">
                {{ getRSIStatus(technicalData.rsi) }}
              </div>
            </div>
          </div>

          <div class="indicator-card">
            <div class="indicator-title">
              MACD
            </div>
            <div class="macd-container">
              <div class="macd-values">
                <div class="value-item">
                  <span class="label">DIF:</span>
                  <span class="value">{{ technicalData.macdDIF }}</span>
                </div>
                <div class="value-item">
                  <span class="label">DEA:</span>
                  <span class="value">{{ technicalData.macdDEA }}</span>
                </div>
                <div class="value-item">
                  <span class="label">MACD:</span>
                  <span
                    class="value"
                    :class="technicalData.macd > 0 ? 'positive' : 'negative'"
                  >{{ technicalData.macd }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="indicator-card">
            <div class="indicator-title">
              布林带
            </div>
            <div class="bollinger-container">
              <div class="bollinger-band">
                <span class="band-label">上轨:</span>
                <span class="band-value">{{ technicalData.bollingerUpper }}</span>
              </div>
              <div class="bollinger-band">
                <span class="band-label">中轨:</span>
                <span class="band-value">{{ technicalData.bollingerMiddle }}</span>
              </div>
              <div class="bollinger-band">
                <span class="band-label">下轨:</span>
                <span class="band-value">{{ technicalData.bollingerLower }}</span>
              </div>
              <div class="bollinger-position">
                当前位置: {{ getBollingerPosition() }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 技术信号 -->
      <div class="technical-signals">
        <h4>🚦 技术信号</h4>
        <div class="signals-grid">
          <div
            v-for="(signal, index) in technicalSignals"
            :key="index"
            class="signal-item"
            :class="signal.type"
          >
            <div class="signal-icon">
              {{ getSignalIcon(signal.type) }}
            </div>
            <div class="signal-content">
              <div class="signal-title">
                {{ signal.title }}
              </div>
              <div class="signal-description">
                {{ signal.description }}
              </div>
              <div class="signal-strength">
                强度: {{ signal.strength }}/10
                <div class="strength-bar">
                  <div
                    class="strength-fill"
                    :style="{ width: (signal.strength * 10) + '%' }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 支撑阻力位 -->
      <div class="support-resistance">
        <h4>🎯 支撑阻力位</h4>
        <div class="sr-levels">
          <div class="level-group">
            <h5>阻力位</h5>
            <div class="level-list">
              <div
                v-for="(level, index) in resistanceLevels"
                :key="index"
                class="level-item resistance"
              >
                <span class="level-price">{{ level.price }}</span>
                <span class="level-strength">强度: {{ level.strength }}</span>
              </div>
            </div>
          </div>

          <div class="level-group">
            <h5>支撑位</h5>
            <div class="level-list">
              <div
                v-for="(level, index) in supportLevels"
                :key="index"
                class="level-item support"
              >
                <span class="level-price">{{ level.price }}</span>
                <span class="level-strength">强度: {{ level.strength }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 技术形态识别 -->
      <div class="pattern-recognition">
        <h4>🔍 技术形态识别</h4>
        <div class="patterns-grid">
          <div
            v-for="(pattern, index) in technicalPatterns"
            :key="index"
            class="pattern-card"
            :class="pattern.confidence > 70 ? 'high-confidence' : pattern.confidence > 40 ? 'medium-confidence' : 'low-confidence'"
          >
            <div class="pattern-icon">
              {{ getPatternIcon(pattern.type) }}
            </div>
            <div class="pattern-content">
              <div class="pattern-name">
                {{ pattern.name }}
              </div>
              <div class="pattern-description">
                {{ pattern.description }}
              </div>
              <div class="pattern-confidence">
                置信度: {{ pattern.confidence }}%
                <div class="confidence-bar">
                  <div
                    class="confidence-fill"
                    :style="{ width: pattern.confidence + '%' }"
                  />
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
}

const props = defineProps<Props>()

// 技术数据（模拟数据）
const technicalData = ref({
  ma5: 15.23,
  ma5Trend: 'up',
  ma20: 14.87,
  ma20Trend: 'up',
  ma60: 14.45,
  ma60Trend: 'up',
  rsi: 68.5,
  macdDIF: 0.12,
  macdDEA: 0.08,
  macd: 0.08,
  bollingerUpper: 16.45,
  bollingerMiddle: 15.20,
  bollingerLower: 13.95,
  currentPrice: 15.38
})

// 技术信号
const technicalSignals = ref([
  {
    type: 'buy',
    title: '金叉信号',
    description: 'MA5上穿MA20，形成金叉，短期看涨',
    strength: 8
  },
  {
    type: 'buy',
    title: 'MACD金叉',
    description: 'MACD柱状图由负转正，多头力量增强',
    strength: 7
  },
  {
    type: 'warning',
    title: 'RSI超买',
    description: 'RSI接近70，存在短期回调风险',
    strength: 6
  },
  {
    type: 'sell',
    title: '布林带压力',
    description: '价格接近布林带上轨，面临阻力',
    strength: 5
  }
])

// 支撑阻力位
const resistanceLevels = ref([
  { price: 16.20, strength: 8 },
  { price: 16.80, strength: 6 },
  { price: 17.50, strength: 9 }
])

const supportLevels = ref([
  { price: 14.80, strength: 7 },
  { price: 14.20, strength: 9 },
  { price: 13.60, strength: 8 }
])

// 技术形态
const technicalPatterns = ref([
  {
    type: 'triangle',
    name: '上升三角形',
    description: '价格在上升趋势中形成三角形整理',
    confidence: 75
  },
  {
    type: 'flag',
    name: '旗形整理',
    description: '短期整理形态，通常为继续信号',
    confidence: 65
  },
  {
    type: 'head_shoulders',
    name: '头肩顶',
    description: '反转形态，需谨慎观察',
    confidence: 45
  }
])

// 方法
const getTrendClass = (trend: string) => {
  return trend === 'up' ? 'trend-up' : trend === 'down' ? 'trend-down' : 'trend-stable'
}

const getRSIClass = (rsi: number) => {
  if (rsi > 70) return 'overbought'
  if (rsi < 30) return 'oversold'
  return 'normal'
}

const getRSIStatus = (rsi: number) => {
  if (rsi > 70) return '超买'
  if (rsi < 30) return '超卖'
  return '正常'
}

const getBollingerPosition = () => {
  const price = technicalData.value.currentPrice
  const upper = technicalData.value.bollingerUpper
  const lower = technicalData.value.bollingerLower

  if (price > upper) return '上轨上方'
  if (price < lower) return '下轨下方'
  return '轨道内'
}

const getSignalIcon = (type: string) => {
  const icons: Record<string, string> = {
    buy: '🟢',
    sell: '🔴',
    warning: '🟡',
    neutral: '⚪'
  }
  return icons[type] || '⚪'
}

const getPatternIcon = (type: string) => {
  const icons: Record<string, string> = {
    triangle: '🔺',
    flag: '🏁',
    head_shoulders: '👤',
    double_top: '⛰️',
    double_bottom: '🏔️'
  }
  return icons[type as keyof typeof icons] || '📊'
}

// 生命周期
onMounted(() => {
  logger.log(`加载股票 ${props.stockCode} 在 ${props.reportDate} 的技术分析数据`)
})
</script>

<style scoped>
.technical-analysis {
  padding: 20px;
}

.technical-analysis h3 {
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

.main-indicators h4,
.technical-signals h4,
.support-resistance h4,
.pattern-recognition h4 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 16px;
}

.indicators-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.indicator-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.indicator-title {
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 14px;
}

.indicator-values {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.value-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-size: 12px;
  color: #7f8c8d;
}

.value {
  font-weight: bold;
  font-size: 14px;
}

.value.trend-up {
  color: #27ae60;
}

.value.trend-down {
  color: #e74c3c;
}

.value.trend-stable {
  color: #7f8c8d;
}

.rsi-container {
  text-align: center;
}

.rsi-value {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 10px;
}

.rsi-value.overbought {
  color: #e74c3c;
}

.rsi-value.oversold {
  color: #27ae60;
}

.rsi-value.normal {
  color: #3498db;
}

.rsi-bar {
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
}

.rsi-fill {
  height: 100%;
  background: linear-gradient(90deg, #27ae60, #f39c12, #e74c3c);
  transition: width 0.3s ease;
}

.rsi-status {
  font-size: 12px;
  color: #7f8c8d;
}

.macd-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.macd-values {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.value.positive {
  color: #27ae60;
}

.value.negative {
  color: #e74c3c;
}

.bollinger-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bollinger-band {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.band-label {
  font-size: 12px;
  color: #7f8c8d;
}

.band-value {
  font-weight: bold;
  font-size: 14px;
  color: #2c3e50;
}

.bollinger-position {
  margin-top: 10px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  text-align: center;
  font-size: 12px;
  color: #2c3e50;
}

.signals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
}

.signal-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid;
}

.signal-item.buy {
  background: #e8f5e8;
  border-left-color: #27ae60;
}

.signal-item.sell {
  background: #fdf2f2;
  border-left-color: #e74c3c;
}

.signal-item.warning {
  background: #fef9e7;
  border-left-color: #f39c12;
}

.signal-item.neutral {
  background: #f8f9fa;
  border-left-color: #7f8c8d;
}

.signal-icon {
  font-size: 20px;
  margin-top: 2px;
}

.signal-content {
  flex: 1;
}

.signal-title {
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.signal-description {
  font-size: 14px;
  color: #555;
  margin-bottom: 10px;
  line-height: 1.4;
}

.signal-strength {
  font-size: 12px;
  color: #7f8c8d;
  display: flex;
  align-items: center;
  gap: 10px;
}

.strength-bar {
  flex: 1;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  background: #3498db;
  transition: width 0.3s ease;
}

.sr-levels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.level-group h5 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 14px;
}

.level-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.level-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-radius: 4px;
}

.level-item.resistance {
  background: #fdf2f2;
  border-left: 3px solid #e74c3c;
}

.level-item.support {
  background: #e8f5e8;
  border-left: 3px solid #27ae60;
}

.level-price {
  font-weight: bold;
  color: #2c3e50;
}

.level-strength {
  font-size: 12px;
  color: #7f8c8d;
}

.patterns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.pattern-card {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.pattern-card.high-confidence {
  background: #e8f5e8;
  border-color: #27ae60;
}

.pattern-card.medium-confidence {
  background: #fef9e7;
  border-color: #f39c12;
}

.pattern-card.low-confidence {
  background: #fdf2f2;
  border-color: #e74c3c;
}

.pattern-icon {
  font-size: 24px;
  margin-top: 2px;
}

.pattern-content {
  flex: 1;
}

.pattern-name {
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.pattern-description {
  font-size: 14px;
  color: #555;
  margin-bottom: 10px;
  line-height: 1.4;
}

.pattern-confidence {
  font-size: 12px;
  color: #7f8c8d;
  display: flex;
  align-items: center;
  gap: 10px;
}

.confidence-bar {
  flex: 1;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  background: #3498db;
  transition: width 0.3s ease;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .indicators-grid,
  .signals-grid,
  .patterns-grid {
    grid-template-columns: 1fr;
  }

  .sr-levels {
    grid-template-columns: 1fr;
  }

  .signal-strength,
  .pattern-confidence {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}
</style>

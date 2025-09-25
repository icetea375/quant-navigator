<template>
  <div class="dual-brain-arbitration-dashboard">
    <!-- 页面标题 -->
    <div class="dashboard-header">
      <h1>🧠 双脑分治仲裁仪表盘</h1>
      <p class="subtitle">Qwen事实归因流 vs 豆包舆情感知流 - 人类智慧仲裁</p>
    </div>

    <!-- 待仲裁案件列表 -->
    <div class="pending-cases-section">
      <h2>📋 待仲裁案件</h2>
      <div class="cases-grid">
        <div 
          v-for="case in pendingCases" 
          :key="case.id"
          class="case-card"
          :class="{ 'selected': selectedCase?.id === case.id }"
          @click="selectCase(case)"
        >
          <div class="case-header">
            <span class="stock-code">{{ case.stock_code }}</span>
            <span class="trade-date">{{ case.trade_date }}</span>
            <span class="status-badge" :class="case.status">{{ case.status }}</span>
          </div>
          <div class="case-info">
            <div class="analyzer-info">
              <span class="qwen-info">Qwen: {{ case.qwen_confidence }}%</span>
              <span class="doubao-info">豆包: {{ case.doubao_confidence }}%</span>
            </div>
            <div class="days-pending">
              待处理: {{ case.days_pending }}天
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 双报告对比分析区域 -->
    <div v-if="selectedCase" class="comparison-section">
      <div class="comparison-header">
        <h2>🔍 双脑报告对比分析</h2>
        <div class="case-details">
          <span class="stock-code">{{ selectedCase.stock_code }}</span>
          <span class="trade-date">{{ selectedCase.trade_date }}</span>
        </div>
      </div>

      <!-- 左右分栏对比 -->
      <div class="dual-report-comparison">
        <!-- 左侧：Qwen事实归因报告 -->
        <div class="report-panel qwen-panel">
          <div class="panel-header">
            <h3>🧠 Qwen事实归因流</h3>
            <div class="analyzer-badge qwen-badge">
              <span class="analyzer-type">事实归因</span>
              <span class="confidence">{{ qwenReport?.confidence_score || 0 }}%</span>
            </div>
          </div>
          
          <div class="report-content">
            <!-- 执行摘要 -->
            <div class="report-section">
              <h4>📊 执行摘要</h4>
              <div class="content-box">
                {{ qwenReport?.executive_summary || '暂无数据' }}
              </div>
            </div>

            <!-- 关键发现 -->
            <div class="report-section">
              <h4>🔍 关键发现</h4>
              <div class="findings-list">
                <div 
                  v-for="(finding, index) in qwenReport?.key_findings || []" 
                  :key="index"
                  class="finding-item"
                >
                  {{ finding }}
                </div>
              </div>
            </div>

            <!-- MD&A验证结果 -->
            <div class="report-section">
              <h4>📋 MD&A验证结果</h4>
              <div class="mda-scores">
                <div class="score-item">
                  <span class="score-label">完整性</span>
                  <div class="score-bar">
                    <div 
                      class="score-fill" 
                      :style="{ width: (qwenReport?.mda_scores?.completeness_score || 0) + '%' }"
                    ></div>
                  </div>
                  <span class="score-value">{{ qwenReport?.mda_scores?.completeness_score || 0 }}%</span>
                </div>
                <div class="score-item">
                  <span class="score-label">一致性</span>
                  <div class="score-bar">
                    <div 
                      class="score-fill" 
                      :style="{ width: (qwenReport?.mda_scores?.consistency_score || 0) + '%' }"
                    ></div>
                  </div>
                  <span class="score-value">{{ qwenReport?.mda_scores?.consistency_score || 0 }}%</span>
                </div>
              </div>
            </div>

            <!-- 投资建议 -->
            <div class="report-section">
              <h4>💼 投资建议</h4>
              <div class="recommendation-box" :class="qwenReport?.investment_recommendation?.toLowerCase()">
                {{ qwenReport?.investment_recommendation || 'HOLD' }}
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：豆包舆情感知报告 -->
        <div class="report-panel doubao-panel">
          <div class="panel-header">
            <h3>🌊 豆包舆情感知流</h3>
            <div class="analyzer-badge doubao-badge">
              <span class="analyzer-type">舆情感知</span>
              <span class="confidence">{{ doubaoReport?.sentiment_analysis?.confidence_level * 100 || 0 }}%</span>
            </div>
          </div>
          
          <div class="report-content">
            <!-- 情绪分析 -->
            <div class="report-section">
              <h4>😊 情绪分析</h4>
              <div class="sentiment-score">
                <div class="sentiment-gauge">
                  <div 
                    class="gauge-fill" 
                    :class="getSentimentClass(doubaoReport?.sentiment_analysis?.sentiment_score)"
                    :style="{ width: Math.abs(doubaoReport?.sentiment_analysis?.sentiment_score || 0) + '%' }"
                  ></div>
                </div>
                <span class="sentiment-value">{{ doubaoReport?.sentiment_analysis?.sentiment_score || 0 }}</span>
              </div>
            </div>

            <!-- 风险因素 -->
            <div class="report-section">
              <h4>⚠️ 风险因素</h4>
              <div class="risk-factors">
                <div 
                  v-for="(risk, index) in doubaoReport?.sentiment_analysis?.risk_factors || []" 
                  :key="index"
                  class="risk-item"
                >
                  {{ risk }}
                </div>
              </div>
            </div>

            <!-- 市场共识 vs 反向观点 -->
            <div class="report-section">
              <h4>🔄 市场共识 vs 反向观点</h4>
              <div class="consensus-comparison">
                <div class="consensus-box">
                  <h5>市场共识</h5>
                  <p>{{ doubaoReport?.sentiment_analysis?.market_consensus || '暂无数据' }}</p>
                </div>
                <div class="contrarian-box">
                  <h5>反向观点</h5>
                  <p>{{ doubaoReport?.sentiment_analysis?.contrarian_view || '暂无数据' }}</p>
                </div>
              </div>
            </div>

            <!-- 实时事件影响 -->
            <div class="report-section">
              <h4>⚡ 实时事件影响</h4>
              <div class="real-time-events">
                <div 
                  v-for="(event, index) in doubaoReport?.sentiment_analysis?.real_time_events || []" 
                  :key="index"
                  class="event-item"
                >
                  {{ event }}
                </div>
              </div>
            </div>

            <!-- 投资建议 -->
            <div class="report-section">
              <h4>💼 投资建议</h4>
              <div class="recommendation-box" :class="doubaoReport?.investment_implications?.position_recommendation?.toLowerCase()">
                {{ doubaoReport?.investment_implications?.position_recommendation || 'HOLD' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 对比分析结果 -->
      <div class="comparison-analysis">
        <h3>📊 对比分析结果</h3>
        <div class="comparison-metrics">
          <div class="metric-item">
            <span class="metric-label">投资建议一致性</span>
            <div class="metric-bar">
              <div 
                class="metric-fill" 
                :style="{ width: getRecommendationConsistency() + '%' }"
              ></div>
            </div>
            <span class="metric-value">{{ getRecommendationConsistency() }}%</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">风险认知差异</span>
            <div class="metric-bar">
              <div 
                class="metric-fill" 
                :style="{ width: getRiskDifference() + '%' }"
              ></div>
            </div>
            <span class="metric-value">{{ getRiskDifference() }}%</span>
          </div>
        </div>
      </div>

      <!-- 人类仲裁决策区域 -->
      <div class="arbitration-decision">
        <h3>⚖️ 人类仲裁决策</h3>
        <div class="decision-form">
          <div class="form-group">
            <label>最终投资建议</label>
            <select v-model="arbitrationDecision.finalRecommendation">
              <option value="BUY">买入 (BUY)</option>
              <option value="HOLD">持有 (HOLD)</option>
              <option value="SELL">卖出 (SELL)</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>置信度评估</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              v-model="arbitrationDecision.confidenceLevel"
              class="confidence-slider"
            />
            <span class="confidence-display">{{ arbitrationDecision.confidenceLevel }}%</span>
          </div>
          
          <div class="form-group">
            <label>仲裁理由</label>
            <textarea 
              v-model="arbitrationDecision.reasoning"
              placeholder="请详细说明您的仲裁理由..."
              rows="4"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>关键分歧点</label>
            <textarea 
              v-model="arbitrationDecision.keyDisagreements"
              placeholder="记录两个AI分析的关键分歧点..."
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-actions">
            <button 
              @click="submitArbitrationDecision"
              class="submit-btn"
              :disabled="!isDecisionValid"
            >
              提交仲裁决策
            </button>
            <button @click="resetDecision" class="reset-btn">
              重置
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// 类型定义
interface PendingCase {
  id: number
  stock_code: string
  trade_date: string
  status: string
  qwen_confidence: number
  doubao_confidence: number
  days_pending: number
}

interface QwenReport {
  id: string
  executive_summary: string
  key_findings: string[]
  mda_scores: {
    completeness_score: number
    consistency_score: number
  }
  investment_recommendation: string
  confidence_score: number
}

interface DoubaoReport {
  id: string
  sentiment_analysis: {
    sentiment_score: number
    confidence_level: number
    risk_factors: string[]
    market_consensus: string
    contrarian_view: string
    real_time_events: string[]
  }
  investment_implications: {
    position_recommendation: string
  }
}

interface ArbitrationDecision {
  finalRecommendation: string
  confidenceLevel: number
  reasoning: string
  keyDisagreements: string
}

// 响应式数据
const router = useRouter()
const loading = ref(false)
const pendingCases = ref<PendingCase[]>([])
const selectedCase = ref<PendingCase | null>(null)
const qwenReport = ref<QwenReport | null>(null)
const doubaoReport = ref<DoubaoReport | null>(null)

const arbitrationDecision = reactive<ArbitrationDecision>({
  finalRecommendation: 'HOLD',
  confidenceLevel: 75,
  reasoning: '',
  keyDisagreements: ''
})

// 计算属性
const isDecisionValid = computed(() => {
  return arbitrationDecision.reasoning.trim().length > 0
})

// 方法
const loadPendingCases = async () => {
  loading.value = true
  try {
    // 模拟API调用
    const response = await fetch('/api/arbitration/pending-cases')
    pendingCases.value = await response.json()
  } catch (error) {
    console.error('加载待仲裁案件失败:', error)
  } finally {
    loading.value = false
  }
}

const selectCase = async (case: PendingCase) => {
  selectedCase.value = case
  loading.value = true
  
  try {
    // 加载Qwen报告
    const qwenResponse = await fetch(`/api/reports/${case.qwen_report_id}`)
    qwenReport.value = await qwenResponse.json()
    
    // 加载豆包报告
    const doubaoResponse = await fetch(`/api/reports/${case.doubao_report_id}`)
    doubaoReport.value = await doubaoResponse.json()
  } catch (error) {
    console.error('加载报告失败:', error)
  } finally {
    loading.value = false
  }
}

const getSentimentClass = (score: number) => {
  if (score > 50) return 'positive'
  if (score < -50) return 'negative'
  return 'neutral'
}

const getRecommendationConsistency = () => {
  if (!qwenReport.value || !doubaoReport.value) return 0
  
  const qwenRec = qwenReport.value.investment_recommendation
  const doubaoRec = doubaoReport.value.investment_implications.position_recommendation
  
  return qwenRec === doubaoRec ? 100 : 0
}

const getRiskDifference = () => {
  if (!qwenReport.value || !doubaoReport.value) return 0
  
  const qwenRisk = qwenReport.value.mda_scores?.completeness_score || 0
  const doubaoRisk = Math.abs(doubaoReport.value.sentiment_analysis?.sentiment_score || 0)
  
  return Math.abs(qwenRisk - doubaoRisk)
}

const submitArbitrationDecision = async () => {
  if (!selectedCase.value) return
  
  loading.value = true
  try {
    const response = await fetch(`/api/arbitration/${selectedCase.value.id}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(arbitrationDecision)
    })
    
    if (response.ok) {
      // 重新加载案件列表
      await loadPendingCases()
      selectedCase.value = null
      resetDecision()
    }
  } catch (error) {
    console.error('提交仲裁决策失败:', error)
  } finally {
    loading.value = false
  }
}

const resetDecision = () => {
  arbitrationDecision.finalRecommendation = 'HOLD'
  arbitrationDecision.confidenceLevel = 75
  arbitrationDecision.reasoning = ''
  arbitrationDecision.keyDisagreements = ''
}

// 生命周期
onMounted(() => {
  loadPendingCases()
})
</script>

<style scoped>
.dual-brain-arbitration-dashboard {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 30px;
}

.dashboard-header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.subtitle {
  color: #7f8c8d;
  font-size: 16px;
}

.pending-cases-section {
  margin-bottom: 30px;
}

.cases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.case-card {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.case-card:hover {
  border-color: #3498db;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.case-card.selected {
  border-color: #e74c3c;
  background-color: #fdf2f2;
}

.case-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.stock-code {
  font-weight: bold;
  font-size: 18px;
  color: #2c3e50;
}

.trade-date {
  color: #7f8c8d;
  font-size: 14px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.status-badge.pending_arbitration {
  background-color: #f39c12;
  color: white;
}

.case-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.analyzer-info {
  display: flex;
  gap: 15px;
}

.qwen-info {
  color: #3498db;
  font-weight: bold;
}

.doubao-info {
  color: #e74c3c;
  font-weight: bold;
}

.days-pending {
  color: #7f8c8d;
  font-size: 14px;
}

.comparison-section {
  margin-top: 30px;
}

.comparison-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.dual-report-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.report-panel {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.qwen-panel {
  border-color: #3498db;
}

.doubao-panel {
  border-color: #e74c3c;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.qwen-panel .panel-header {
  background-color: #ebf3fd;
}

.doubao-panel .panel-header {
  background-color: #fdf2f2;
}

.analyzer-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
}

.qwen-badge {
  background-color: #3498db;
  color: white;
}

.doubao-badge {
  background-color: #e74c3c;
  color: white;
}

.report-content {
  padding: 20px;
  max-height: 600px;
  overflow-y: auto;
}

.report-section {
  margin-bottom: 20px;
}

.report-section h4 {
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 16px;
}

.content-box {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid #3498db;
}

.findings-list, .risk-factors, .real-time-events {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.finding-item, .risk-item, .event-item {
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  border-left: 3px solid #e74c3c;
}

.mda-scores {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.score-label {
  min-width: 60px;
  font-size: 14px;
}

.score-bar {
  flex: 1;
  height: 20px;
  background-color: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background-color: #3498db;
  transition: width 0.3s ease;
}

.score-value {
  min-width: 40px;
  text-align: right;
  font-weight: bold;
}

.sentiment-score {
  display: flex;
  align-items: center;
  gap: 15px;
}

.sentiment-gauge {
  flex: 1;
  height: 30px;
  background-color: #e0e0e0;
  border-radius: 15px;
  overflow: hidden;
  position: relative;
}

.gauge-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.gauge-fill.positive {
  background-color: #27ae60;
}

.gauge-fill.negative {
  background-color: #e74c3c;
}

.gauge-fill.neutral {
  background-color: #f39c12;
}

.sentiment-value {
  font-size: 24px;
  font-weight: bold;
  min-width: 60px;
  text-align: center;
}

.consensus-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.consensus-box, .contrarian-box {
  padding: 15px;
  border-radius: 6px;
}

.consensus-box {
  background-color: #e8f5e8;
  border-left: 4px solid #27ae60;
}

.contrarian-box {
  background-color: #fdf2f2;
  border-left: 4px solid #e74c3c;
}

.recommendation-box {
  padding: 15px;
  border-radius: 6px;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.recommendation-box.buy {
  background-color: #27ae60;
}

.recommendation-box.hold {
  background-color: #f39c12;
}

.recommendation-box.sell {
  background-color: #e74c3c;
}

.comparison-analysis {
  margin: 30px 0;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.comparison-metrics {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 15px;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.metric-label {
  min-width: 150px;
  font-weight: bold;
}

.metric-bar {
  flex: 1;
  height: 20px;
  background-color: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}

.metric-fill {
  height: 100%;
  background-color: #3498db;
  transition: width 0.3s ease;
}

.metric-value {
  min-width: 50px;
  text-align: right;
  font-weight: bold;
}

.arbitration-decision {
  margin-top: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #2c3e50;
}

.decision-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: bold;
  color: #2c3e50;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.confidence-slider {
  width: 100%;
}

.confidence-display {
  text-align: center;
  font-weight: bold;
  color: #3498db;
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 20px;
}

.submit-btn, .reset-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn {
  background-color: #27ae60;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background-color: #229954;
}

.submit-btn:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.reset-btn {
  background-color: #95a5a6;
  color: white;
}

.reset-btn:hover {
  background-color: #7f8c8d;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dual-report-comparison {
    grid-template-columns: 1fr;
  }
  
  .decision-form {
    grid-template-columns: 1fr;
  }
  
  .consensus-comparison {
    grid-template-columns: 1fr;
  }
}
</style>

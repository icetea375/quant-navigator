<template>
  <div class="arbitration-case-detail">
    <!-- 页面头部 -->
    <div class="detail-header">
      <div class="header-content">
        <button
          class="back-btn"
          @click="goBack"
        >
          ← 返回列表
        </button>
        <div class="case-info">
          <h1>{{ caseDetail?.stockCode }} - {{ caseDetail?.caseId }}</h1>
          <div class="case-meta">
            <span class="report-date">{{ formatDate(caseDetail?.reportDate || '') }}</span>
            <span
              class="status-badge"
              :class="caseDetail?.status"
            >
              {{ getStatusText(caseDetail?.status || '') }}
            </span>
          </div>
        </div>
      </div>

      <!-- 优先级和分歧度指标 -->
      <div class="case-metrics">
        <div class="metric-card">
          <div class="metric-label">
            优先级
          </div>
          <div class="metric-value">
            {{ Math.round((caseDetail?.priorityScore || 0) * 100) }}%
          </div>
          <div class="metric-bar">
            <div
              class="metric-fill priority"
              :style="{ width: (caseDetail?.priorityScore || 0) * 100 + '%' }"
            />
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">
            分歧度
          </div>
          <div class="metric-value">
            {{ Math.round((caseDetail?.divergenceScore || 0) * 100) }}%
          </div>
          <div class="metric-bar">
            <div
              class="metric-fill divergence"
              :style="{ width: (caseDetail?.divergenceScore || 0) * 100 + '%' }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div
      v-if="loading"
      class="loading-state"
    >
      <div class="loading-spinner" />
      <p>加载案件详情中...</p>
    </div>

    <!-- 案件详情内容 -->
    <div
      v-else-if="caseDetail"
      class="detail-content"
    >
      <!-- 核心争议摘要 -->
      <div class="conflict-summary-section">
        <h2>⚡ 核心争议摘要</h2>
        <div class="summary-cards">
          <div class="summary-card consensus">
            <h3>🤝 AI共识点</h3>
            <p>{{ caseDetail.consensusSummary }}</p>
          </div>
          <div class="summary-card conflict">
            <h3>⚡ 核心争议</h3>
            <p>{{ caseDetail.conflictSummary }}</p>
          </div>
        </div>
      </div>

      <!-- 双脑报告对比 -->
      <div class="dual-report-comparison">
        <h2>🧠 双脑报告对比分析</h2>

        <!-- 左右分栏布局 -->
        <div class="comparison-layout">
          <!-- 左侧：Qwen事实归因报告 -->
          <div
            class="report-panel qwen-panel"
            data-testid="qwen-panel"
          >
            <div class="panel-header">
              <h3>🧠 Qwen事实归因流</h3>
              <div class="analyzer-badge qwen-badge">
                <span class="analyzer-type">事实归因</span>
                <span
                  class="confidence"
                  data-testid="qwen-confidence"
                >{{ Math.round((caseDetail.qwenReport?.confidenceScore || 0) * 100) }}%</span>
              </div>
            </div>

            <div
              class="report-content"
              data-testid="qwen-analysis"
            >
              <!-- 执行摘要 -->
              <div class="report-section">
                <h4>📊 执行摘要</h4>
                <div class="content-box">
                  {{ caseDetail.qwenReport?.summary || '暂无数据' }}
                </div>
              </div>

              <!-- 关键发现 -->
              <div class="report-section">
                <h4>🔍 关键发现</h4>
                <div class="findings-list">
                  <div
                    v-for="(finding, index) in caseDetail.qwenReport?.keywords || []"
                    :key="index"
                    class="finding-item"
                  >
                    {{ finding }}
                  </div>
                </div>
              </div>

              <!-- 情感分析 -->
              <div class="report-section">
                <h4>📈 情感分析</h4>
                <div class="sentiment-score">
                  <div class="sentiment-gauge">
                    <div
                      class="gauge-fill"
                      :class="getSentimentClass(caseDetail.qwenReport?.sentimentScore)"
                      :style="{ width: Math.abs(caseDetail.qwenReport?.sentimentScore || 0) * 100 + '%' }"
                    />
                  </div>
                  <span class="sentiment-value">{{ Math.round((caseDetail.qwenReport?.sentimentScore || 0) * 100) }}</span>
                </div>
              </div>

              <!-- 投资建议 -->
              <div class="report-section">
                <h4>💼 投资建议</h4>
                <div
                  class="recommendation-box"
                  :class="caseDetail.qwenReport?.investmentRecommendation?.toLowerCase()"
                >
                  {{ caseDetail.qwenReport?.investmentRecommendation || 'HOLD' }}
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：豆包舆情感知报告 -->
          <div
            class="report-panel doubao-panel"
            data-testid="doubao-panel"
          >
            <div class="panel-header">
              <h3>🌊 豆包舆情感知流</h3>
              <div class="analyzer-badge doubao-badge">
                <span class="analyzer-type">舆情感知</span>
                <span
                  class="confidence"
                  data-testid="doubao-confidence"
                >{{ Math.round((caseDetail.doubaoReport?.confidenceScore || 0) * 100) }}%</span>
              </div>
            </div>

            <div
              class="report-content"
              data-testid="doubao-analysis"
            >
              <!-- 执行摘要 -->
              <div class="report-section">
                <h4>📊 执行摘要</h4>
                <div class="content-box">
                  {{ caseDetail.doubaoReport?.content || '暂无数据' }}
                </div>
              </div>

              <!-- 情绪分析 -->
              <div class="report-section">
                <h4>😊 情绪分析</h4>
                <div class="sentiment-score">
                  <div class="sentiment-gauge">
                    <div
                      class="gauge-fill"
                      :class="getSentimentClass(caseDetail.doubaoReport?.sentimentScore)"
                      :style="{ width: Math.abs(caseDetail.doubaoReport?.sentimentScore || 0) * 100 + '%' }"
                    />
                  </div>
                  <span class="sentiment-value">{{ Math.round((caseDetail.doubaoReport?.sentimentScore || 0) * 100) }}</span>
                </div>
              </div>

              <!-- 风险因素 -->
              <div class="report-section">
                <h4>⚠️ 风险因素</h4>
                <div class="risk-factors">
                  <div
                    v-for="(risk, index) in caseDetail.doubaoReport?.sentimentAnalysis?.riskFactors || []"
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
                    <p>{{ caseDetail.doubaoReport?.sentimentAnalysis?.marketConsensus || '暂无数据' }}</p>
                  </div>
                  <div class="contrarian-box">
                    <h5>反向观点</h5>
                    <p>{{ caseDetail.doubaoReport?.sentimentAnalysis?.contrarianView || '暂无数据' }}</p>
                  </div>
                </div>
              </div>

              <!-- 实时事件影响 -->
              <div class="report-section">
                <h4>⚡ 实时事件影响</h4>
                <div class="real-time-events">
                  <div
                    v-for="(event, index) in caseDetail.doubaoReport?.sentimentAnalysis?.realTimeEvents || []"
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
                <div
                  class="recommendation-box"
                  :class="caseDetail.doubaoReport?.investmentRecommendation?.toLowerCase()"
                >
                  {{ caseDetail.doubaoReport?.investmentRecommendation || 'HOLD' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 对比分析结果 -->
      <div class="comparison-analysis">
        <h2>📊 对比分析结果</h2>
        <div class="comparison-metrics">
          <div class="metric-item">
            <span class="metric-label">投资建议一致性</span>
            <div class="metric-bar">
              <div
                class="metric-fill"
                :style="{ width: getRecommendationConsistency() + '%' }"
              />
            </div>
            <span class="metric-value">{{ getRecommendationConsistency() }}%</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">情感差异度</span>
            <div class="metric-bar">
              <div
                class="metric-fill"
                :style="{ width: getSentimentDifference() + '%' }"
              />
            </div>
            <span class="metric-value">{{ getSentimentDifference() }}%</span>
          </div>
        </div>
      </div>

      <!-- 人类仲裁决策区域 -->
      <div
        v-if="caseDetail.status === 'PENDING_HUMAN'"
        class="arbitration-decision"
      >
        <h2>⚖️ 人类仲裁决策</h2>
        <div
          class="decision-form"
          data-testid="arbitration-decision-form"
        >
          <div class="form-group">
            <label>最终投资建议</label>
            <select
              v-model="arbitrationDecision.finalRecommendation"
              data-testid="final-recommendation-select"
            >
              <option value="BUY">
                买入 (BUY)
              </option>
              <option value="HOLD">
                持有 (HOLD)
              </option>
              <option value="SELL">
                卖出 (SELL)
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>置信度评估</label>
            <div class="confidence-input">
              <input
                v-model="arbitrationDecision.confidenceLevel"
                type="range"
                min="0"
                max="100"
                class="confidence-slider"
                data-testid="confidence-slider"
              >
              <span class="confidence-display">{{ arbitrationDecision.confidenceLevel }}%</span>
            </div>
          </div>

          <div class="form-group full-width">
            <label>仲裁理由</label>
            <textarea
              v-model="arbitrationDecision.reasoning"
              placeholder="请详细说明您的仲裁理由..."
              rows="4"
              data-testid="reasoning-textarea"
            />
          </div>

          <div class="form-group full-width">
            <label>关键分歧点</label>
            <textarea
              v-model="arbitrationDecision.keyDisagreements"
              placeholder="记录两个AI分析的关键分歧点..."
              rows="3"
              data-testid="key-disagreements-textarea"
            />
          </div>

          <div class="form-actions">
            <button
              class="submit-btn"
              :disabled="!isDecisionValid"
              data-testid="submit-arbitration-button"
              @click="submitArbitrationDecision"
            >
              提交仲裁决策
            </button>
            <button
              class="reset-btn"
              @click="resetDecision"
            >
              重置
            </button>
            <button
              class="ignore-btn"
              @click="ignoreCase"
            >
              忽略此案件
            </button>
          </div>
        </div>
      </div>

      <!-- 已仲裁决策显示 -->
      <div
        v-else-if="caseDetail.humanDecision"
        class="arbitration-result"
      >
        <h2>⚖️ 仲裁决策结果</h2>
        <div class="decision-result">
          <div class="decision-summary">
            <div class="decision-item">
              <span class="label">最终建议:</span>
              <span
                class="value recommendation"
                :class="caseDetail.humanDecision.finalRecommendation.toLowerCase()"
              >
                {{ caseDetail.humanDecision.finalRecommendation }}
              </span>
            </div>
            <div class="decision-item">
              <span class="label">置信度:</span>
              <span class="value">{{ caseDetail.humanDecision.confidenceLevel }}%</span>
            </div>
            <div class="decision-item">
              <span class="label">仲裁时间:</span>
              <span class="value">{{ formatDateTime(caseDetail.updatedAt) }}</span>
            </div>
          </div>
          <div class="decision-reasoning">
            <h4>仲裁理由</h4>
            <p>{{ caseDetail.humanDecision.reasoning }}</p>
            <h4>关键分歧点</h4>
            <p>{{ caseDetail.humanDecision.keyDisagreements }}</p>
          </div>
        </div>
      </div>

      <!-- 数据分析Tab区域 -->
      <div class="analysis-tabs-section">
        <h2>📊 数据分析</h2>

        <!-- Tab选项卡式关联信息聚合区 -->
        <div class="dashboard-tabs">
          <div class="tab-header">
            <button
              v-for="(tab, index) in analysisTabs"
              :key="index"
              :class="['tab-button', { active: activeAnalysisTab === index }]"
              @click="activeAnalysisTab = index"
            >
              <span class="tab-icon">{{ tab.icon }}</span>
              <span class="tab-label">{{ tab.label }}</span>
            </button>
          </div>

          <div class="tab-content">
            <!-- 原始文本探索器 -->
            <div
              v-if="activeAnalysisTab === 0"
              class="tab-panel"
            >
              <TextComparisonViewer
                :stock-code="caseDetail?.stockCode || ''"
                :report-date="caseDetail?.reportDate || ''"
                :qwen-report="caseDetail?.qwenReport"
                :doubao-report="caseDetail?.doubaoReport"
              />
            </div>

            <!-- 财务快照 -->
            <div
              v-if="activeAnalysisTab === 1"
              class="tab-panel"
            >
              <FinancialOverview
                :stock-code="caseDetail?.stockCode || ''"
                :report-date="caseDetail?.reportDate || ''"
              />
            </div>

            <!-- 技术指标分析 -->
            <div
              v-if="activeAnalysisTab === 2"
              class="tab-panel"
            >
              <TechnicalAnalysis
                :stock-code="caseDetail?.stockCode || ''"
                :report-date="caseDetail?.reportDate || ''"
              />
            </div>

            <!-- 市场情绪监控 -->
            <div
              v-if="activeAnalysisTab === 3"
              class="tab-panel"
            >
              <MarketSentimentMonitor
                :stock-code="caseDetail?.stockCode || ''"
                :report-date="caseDetail?.reportDate || ''"
              />
            </div>

            <!-- 风险因子分析 -->
            <div
              v-if="activeAnalysisTab === 4"
              class="tab-panel"
            >
              <RiskFactorAnalysis
                :stock-code="caseDetail?.stockCode || ''"
                :report-date="caseDetail?.reportDate || ''"
                :arbitration-case="caseDetail"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div
      v-else
      class="error-state"
    >
      <div class="error-icon">
        ❌
      </div>
      <h3>案件不存在</h3>
      <p>请求的案件不存在或已被删除</p>
      <button
        class="back-btn"
        @click="goBack"
      >
        返回列表
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { logger } from '@/utils/logger'
import TextComparisonViewer from './dashboard/TextComparisonViewer.vue'
import FinancialOverview from './dashboard/FinancialOverview.vue'
import TechnicalAnalysis from './dashboard/TechnicalAnalysis.vue'
import MarketSentimentMonitor from './dashboard/MarketSentimentMonitor.vue'
import RiskFactorAnalysis from './dashboard/RiskFactorAnalysis.vue'

// 类型定义
interface ArbitrationCaseDetail {
  id: string
  caseId: string
  reportDate: string
  stockCode: string
  qwenReportId: string
  doubaoReportId: string
  divergenceScore: number
  consensusSummary: string
  conflictSummary: string
  priorityScore: number
  status: 'PENDING_HUMAN' | 'ARBITRATED' | 'IGNORED'
  analysisMetadata: Record<string, string | number | boolean>
  humanDecision: {
    finalRecommendation: string
    confidenceLevel: number
    reasoning: string
    keyDisagreements: string
    arbitratorId?: string
  } | null
  qwenReport: {
    id: string
    content: string
    summary: string
    sentimentScore: number
    keywords: string[]
    entities: string[]
    confidenceScore: number
    investmentRecommendation: string
    mdaScores: {
      completenessScore: number
      consistencyScore: number
    }
  }
  doubaoReport: {
    id: string
    content: string
    summary: string
    sentimentScore: number
    keywords: string[]
    entities: string[]
    confidenceScore: number
    investmentRecommendation: string
    sentimentAnalysis: {
      sentimentScore: number
      confidenceLevel: number
      riskFactors: string[]
      marketConsensus: string
      contrarianView: string
      realTimeEvents: string[]
    }
  }
  createdAt: string
  updatedAt: string
}

interface ArbitrationDecision {
  finalRecommendation: string
  confidenceLevel: number
  reasoning: string
  keyDisagreements: string
}

// 响应式数据
const router = useRouter()
const route = useRoute()
const loading = ref(false)
const caseDetail = ref<ArbitrationCaseDetail | null>(null)
const activeAnalysisTab = ref(0)

// 分析Tab配置
const analysisTabs = [
  { icon: '📄', label: '原始文本探索器' },
  { icon: '💰', label: '财务快照' },
  { icon: '📈', label: '技术指标分析' },
  { icon: '😊', label: '市场情绪监控' },
  { icon: '⚠️', label: '风险因子分析' }
]

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
const loadCaseDetail = async () => {
  const caseId = route.params.caseId as string
  if (!caseId) return

  loading.value = true
  try {
    const response = await fetch(`/api/v1/admin/arbitration-cases/${caseId}`)
    if (response.ok) {
      const result = await response.json()
      // 适配Sprint 1 API响应格式
      if (result.success && result.data) {
        caseDetail.value = {
          id: result.data.id,
          caseId: result.data.case_id,
          reportDate: result.data.trade_date,
          stockCode: result.data.stock_code,
          qwenReportId: result.data.qwen_report_id,
          doubaoReportId: result.data.doubao_report_id,
          divergenceScore: result.data.divergence_score,
          consensusSummary: result.data.consensus_summary,
          conflictSummary: result.data.conflict_summary,
          priorityScore: result.data.priority_score,
          status: result.data.status,
          analysisMetadata: result.data.analysis_metadata,
          humanDecision: result.data.human_decision ? {
            finalRecommendation: result.data.final_recommendation,
            confidenceLevel: Math.round(result.data.final_confidence * 100),
            reasoning: result.data.human_decision,
            keyDisagreements: result.data.conflict_summary,
            arbitratorId: result.data.human_arbitrator_id
          } : null,
          qwenReport: {
            id: result.data.qwen_report_id,
            content: result.data.qwen_analysis?.analysis || '',
            summary: result.data.qwen_analysis?.summary || '',
            sentimentScore: result.data.qwen_analysis?.sentiment_score || 0,
            keywords: result.data.qwen_analysis?.keywords || [],
            entities: result.data.qwen_analysis?.entities || [],
            confidenceScore: result.data.qwen_analysis?.confidence || 0,
            investmentRecommendation: 'HOLD', // 默认值，实际应该从API获取
            mdaScores: {
              completenessScore: 0.8,
              consistencyScore: 0.7
            }
          },
          doubaoReport: {
            id: result.data.doubao_report_id,
            content: result.data.doubao_analysis?.analysis || '',
            summary: result.data.doubao_analysis?.summary || '',
            sentimentScore: result.data.doubao_analysis?.sentiment_score || 0,
            keywords: result.data.doubao_analysis?.keywords || [],
            entities: result.data.doubao_analysis?.entities || [],
            confidenceScore: result.data.doubao_analysis?.confidence || 0,
            investmentRecommendation: 'HOLD', // 默认值，实际应该从API获取
            sentimentAnalysis: {
              sentimentScore: result.data.doubao_analysis?.sentiment_score || 0,
              confidenceLevel: result.data.doubao_analysis?.confidence || 0,
              riskFactors: [],
              marketConsensus: '',
              contrarianView: '',
              realTimeEvents: []
            }
          },
          createdAt: result.data.created_at,
          updatedAt: result.data.updated_at
        }
      } else {
        caseDetail.value = null
      }
    } else {
      caseDetail.value = null
    }
  } catch (error) {
    logger.error('加载案件详情失败:', error)
    caseDetail.value = null
  } finally {
    loading.value = false
  }
}

const submitArbitrationDecision = async () => {
  if (!caseDetail.value || !isDecisionValid.value) return

  loading.value = true
  try {
    const response = await fetch(`/api/v1/admin/arbitration-cases/${caseDetail.value.caseId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        arbitrator_id: 'admin_001', // 临时硬编码，实际应该从用户认证获取
        final_recommendation: arbitrationDecision.finalRecommendation,
        final_confidence: arbitrationDecision.confidenceLevel / 100, // 转换为0-1范围
        human_decision: arbitrationDecision.reasoning,
        decision_factors: {
          key_disagreements: arbitrationDecision.keyDisagreements,
          decision_time_minutes: 30, // 临时硬编码
          ai_summary_quality: 4,
          priority_accuracy: 4,
          divergence_analysis_quality: 4,
          overall_satisfaction: 4
        }
      })
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        // 显示成功消息
        const successMessage = document.createElement('div')
        successMessage.setAttribute('data-testid', 'success-message')
        successMessage.textContent = '仲裁判决提交成功！'
        successMessage.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 15px; border-radius: 5px; z-index: 9999;'
        document.body.appendChild(successMessage)

        // 3秒后移除消息并跳转
        setTimeout(() => {
          document.body.removeChild(successMessage)
          router.push('/admin/arbitration')
        }, 3000)
      } else {
        alert(`提交失败: ${result.message}`)
      }
    } else {
      const errorData = await response.json()
      alert(`提交失败: ${errorData.detail || '未知错误'}`)
    }
  } catch (error) {
    logger.error('提交仲裁决策失败:', error)
    alert('提交仲裁决策失败，请重试')
  } finally {
    loading.value = false
  }
}

const ignoreCase = async () => {
  if (!caseDetail.value) return

  const confirmed = confirm(`确定要忽略案件 ${caseDetail.value.caseId} 吗？`)
  if (!confirmed) return

  loading.value = true
  try {
    const response = await fetch(`/api/v1/admin/arbitration-cases/${caseDetail.value.caseId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'IGNORED',
        reason: '手动忽略'
      })
    })

    if (response.ok) {
      alert('案件已忽略')
      // 跳转回案件列表页面
      router.push('/admin/arbitration')
    }
  } catch (error) {
    logger.error('忽略案件失败:', error)
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

const goBack = () => {
  router.push('/admin/arbitration')
}

const getSentimentClass = (score: number) => {
  if (score > 0.5) return 'positive'
  if (score < -0.5) return 'negative'
  return 'neutral'
}

const getRecommendationConsistency = () => {
  if (!caseDetail.value?.qwenReport || !caseDetail.value?.doubaoReport) return 0

  const qwenRec = caseDetail.value.qwenReport.investmentRecommendation
  const doubaoRec = caseDetail.value.doubaoReport.investmentRecommendation

  return qwenRec === doubaoRec ? 100 : 0
}

const getSentimentDifference = () => {
  if (!caseDetail.value?.qwenReport || !caseDetail.value?.doubaoReport) return 0

  const qwenSentiment = Math.abs(caseDetail.value.qwenReport.sentimentScore || 0)
  const doubaoSentiment = Math.abs(caseDetail.value.doubaoReport.sentimentScore || 0)

  return Math.round(Math.abs(qwenSentiment - doubaoSentiment) * 100)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'PENDING_HUMAN': '待仲裁',
    'ARBITRATED': '已仲裁',
    'IGNORED': '已忽略'
  }
  return statusMap[status] || status
}

// 生命周期
onMounted(() => {
  loadCaseDetail()
})
</script>

<style scoped>
.arbitration-case-detail {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.detail-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 30px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.back-btn {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.case-info h1 {
  margin: 0 0 10px 0;
  font-size: 28px;
}

.case-meta {
  display: flex;
  align-items: center;
  gap: 15px;
}

.report-date {
  font-size: 16px;
  opacity: 0.9;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.status-badge.PENDING_HUMAN {
  background-color: #f39c12;
}

.status-badge.ARBITRATED {
  background-color: #27ae60;
}

.status-badge.IGNORED {
  background-color: #e74c3c;
}

.case-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.metric-card {
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.metric-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
}

.metric-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.metric-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.metric-fill.priority {
  background: #3498db;
}

.metric-fill.divergence {
  background: #e74c3c;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.conflict-summary-section {
  margin-bottom: 30px;
}

.conflict-summary-section h2 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.summary-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.summary-card {
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid;
}

.summary-card.consensus {
  background: #e8f5e8;
  border-left-color: #27ae60;
}

.summary-card.conflict {
  background: #fdf2f2;
  border-left-color: #e74c3c;
}

.summary-card h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.summary-card p {
  margin: 0;
  line-height: 1.6;
  color: #555;
}

.dual-report-comparison {
  margin-bottom: 30px;
}

.dual-report-comparison h2 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.comparison-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
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

.findings-list,
.risk-factors,
.real-time-events {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.finding-item,
.risk-item,
.event-item {
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  border-left: 3px solid #e74c3c;
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

.consensus-box,
.contrarian-box {
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

.arbitration-decision,
.arbitration-result {
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

.form-group.full-width {
  grid-column: 1 / -1;
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

.confidence-input {
  display: flex;
  align-items: center;
  gap: 15px;
}

.confidence-slider {
  flex: 1;
}

.confidence-display {
  min-width: 50px;
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

.submit-btn,
.reset-btn,
.ignore-btn {
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

.ignore-btn {
  background-color: #e74c3c;
  color: white;
}

.ignore-btn:hover {
  background-color: #c0392b;
}

.decision-result {
  margin-top: 20px;
}

.decision-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.decision-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.decision-item .label {
  font-size: 12px;
  color: #7f8c8d;
  text-transform: uppercase;
}

.decision-item .value {
  font-size: 16px;
  font-weight: bold;
}

.decision-item .value.recommendation {
  padding: 4px 8px;
  border-radius: 4px;
  color: white;
  text-align: center;
}

.decision-item .value.recommendation.buy {
  background-color: #27ae60;
}

.decision-item .value.recommendation.hold {
  background-color: #f39c12;
}

.decision-item .value.recommendation.sell {
  background-color: #e74c3c;
}

.decision-reasoning h4 {
  color: #2c3e50;
  margin: 20px 0 10px 0;
}

.decision-reasoning p {
  margin: 0 0 15px 0;
  line-height: 1.6;
  color: #555;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .comparison-layout {
    grid-template-columns: 1fr;
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }

  .decision-form {
    grid-template-columns: 1fr;
  }

  .consensus-comparison {
    grid-template-columns: 1fr;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .case-metrics {
    grid-template-columns: 1fr;
  }
}

/* 数据分析Tab样式 */
.analysis-tabs-section {
  margin-top: 30px;
}

.analysis-tabs-section h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 20px;
}

.dashboard-tabs {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.tab-header {
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 15px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 3px solid transparent;
}

.tab-button:hover {
  background: #e9ecef;
}

.tab-button.active {
  background: white;
  border-bottom-color: #3498db;
  color: #3498db;
  font-weight: bold;
}

.tab-icon {
  font-size: 16px;
}

.tab-label {
  font-size: 14px;
}

.tab-content {
  min-height: 400px;
}

.tab-panel {
  padding: 20px;
}
</style>

<template>
  <div class="annotation-panel">
    <!-- 空状态 -->
    <div v-if="!report" class="empty-state">
      <div class="empty-icon">📋</div>
      <p>请选择一个报告进行标注</p>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载报告详情中...</p>
    </div>

    <!-- 报告详情和标注表单 -->
    <div v-else class="panel-content">
      <!-- 报告头部 -->
      <div class="report-header">
        <h3>{{ report.title || '报告详情' }}</h3>
        <div class="report-meta">
          <span class="report-id">ID: {{ report.reportId }}</span>
          <span class="report-date">{{ formatDate(report.reportDate) }}</span>
        </div>
      </div>

      <!-- 报告内容 -->
      <div class="report-content">
        <div class="content-section">
          <h4>核心结论</h4>
          <div class="content-text" v-html="formatMarkdown(report.contentMarkdown)"></div>
        </div>

        <!-- 证据链展示 -->
        <div v-if="report.evidencePayload" class="content-section">
          <h4>证据链</h4>
          <div class="evidence-chain">
            <div class="evidence-item" v-for="(evidence, index) in getEvidenceItems()" :key="index">
              <div class="evidence-header">
                <span class="evidence-type">{{ evidence.type }}</span>
                <span class="evidence-confidence">置信度: {{ evidence.confidence }}%</span>
              </div>
              <div class="evidence-content">{{ evidence.content }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 标注表单 -->
      <div class="annotation-form">
        <h4>专家标注</h4>

        <form @submit.prevent="handleSubmit">
          <!-- 质量评级 -->
          <div class="form-group">
            <label class="form-label">质量评级 *</label>
            <div class="rating-options">
              <label class="rating-option good">
                <input
                  type="radio"
                  v-model="feedback.rating"
                  value="GOOD"
                  required
                />
                <span class="rating-icon">🟢</span>
                <span class="rating-text">准确</span>
              </label>

              <label class="rating-option partial">
                <input
                  type="radio"
                  v-model="feedback.rating"
                  value="PARTIAL"
                />
                <span class="rating-icon">🟠</span>
                <span class="rating-text">部分准确</span>
              </label>

              <label class="rating-option bad">
                <input
                  type="radio"
                  v-model="feedback.rating"
                  value="BAD"
                />
                <span class="rating-icon">🔴</span>
                <span class="rating-text">错误</span>
              </label>
            </div>
          </div>

          <!-- 错误类型（仅在评级为部分准确或错误时显示） -->
          <div v-if="feedback.rating === 'PARTIAL' || feedback.rating === 'BAD'" class="form-group">
            <label class="form-label">错误类型</label>
            <div class="error-types">
              <label class="error-type-option">
                <input
                  type="checkbox"
                  v-model="feedback.errorTypes"
                  value="MISSING_KEY_INFO"
                />
                <span>遗漏关键信息</span>
              </label>

              <label class="error-type-option">
                <input
                  type="checkbox"
                  v-model="feedback.errorTypes"
                  value="FACTUAL_ERROR"
                />
                <span>事实判断错误</span>
              </label>

              <label class="error-type-option">
                <input
                  type="checkbox"
                  v-model="feedback.errorTypes"
                  value="CAUSAL_FALLACY"
                />
                <span>因果逻辑混乱</span>
              </label>

              <label class="error-type-option">
                <input
                  type="checkbox"
                  v-model="feedback.errorTypes"
                  value="EXPRESSION_POOR"
                />
                <span>表达方式不佳</span>
              </label>
            </div>
          </div>

          <!-- 专家意见 -->
          <div class="form-group">
            <label class="form-label">专家意见 *</label>
            <textarea
              v-model="feedback.correctReasonText"
              placeholder="请提供正确的分析或改进建议..."
              rows="4"
              required
              class="form-textarea"
            ></textarea>
          </div>

          <!-- 提交按钮 -->
          <div class="form-actions">
            <button
              type="button"
              @click="resetForm"
              class="btn btn-secondary"
            >
              重置
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="btn btn-primary"
            >
              {{ submitting ? '提交中...' : '提交反馈' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

// 接口定义
interface Report {
  reportId: string
  title: string
  contentMarkdown: string
  evidencePayload: any
  reportType: string
  targetCode: string
  reportDate: string
  attributionFactors: any
  confidenceScore: number
  supportingEvidence: any
}

interface Feedback {
  rating: 'GOOD' | 'PARTIAL' | 'BAD' | ''
  errorTypes: string[]
  correctReasonText: string
}

// Props
interface Props {
  report: Report | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits
const emit = defineEmits<{
  feedbackSubmit: [feedback: any]
}>()

// 响应式数据
const submitting = ref(false)
const feedback = reactive<Feedback>({
  rating: '',
  errorTypes: [],
  correctReasonText: ''
})

// 方法
const handleSubmit = async () => {
  if (!props.report || !feedback.rating || !feedback.correctReasonText.trim()) {
    return
  }

  submitting.value = true
  try {
    const feedbackData = {
      reportId: props.report.reportId,
      rating: feedback.rating,
      errorTypes: feedback.errorTypes,
      correctReasonText: feedback.correctReasonText.trim()
    }

    await emit('feedbackSubmit', feedbackData)
    resetForm()
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  feedback.rating = ''
  feedback.errorTypes = []
  feedback.correctReasonText = ''
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatMarkdown = (markdown: string) => {
  // 简单的markdown渲染（实际项目中应该使用专业的markdown库）
  return markdown
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

const getEvidenceItems = () => {
  if (!props.report?.evidencePayload) return []

  const evidence = props.report.evidencePayload
  const items = []

  if (evidence.attributionFactors) {
    items.push({
      type: '归因因子',
      confidence: Math.round((evidence.confidenceScore || 0) * 100),
      content: JSON.stringify(evidence.attributionFactors, null, 2)
    })
  }

  if (evidence.supportingEvidence) {
    items.push({
      type: '支持证据',
      confidence: 85,
      content: JSON.stringify(evidence.supportingEvidence, null, 2)
    })
  }

  return items
}
</script>

<style scoped>
.annotation-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.empty-state,
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #7f8c8d;
  flex: 1;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 10px;
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.report-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
}

.report-header h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.report-meta {
  display: flex;
  gap: 20px;
  font-size: 0.9rem;
  color: #7f8c8d;
}

.report-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.content-section {
  margin-bottom: 30px;
}

.content-section h4 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 1.1rem;
  border-bottom: 2px solid #3498db;
  padding-bottom: 5px;
}

.content-text {
  line-height: 1.6;
  color: #555;
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid #3498db;
}

.evidence-chain {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.evidence-item {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.evidence-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.evidence-type {
  font-weight: 600;
  color: #2c3e50;
}

.evidence-confidence {
  font-size: 0.9rem;
  color: #7f8c8d;
}

.evidence-content {
  padding: 15px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  background: white;
  white-space: pre-wrap;
  word-break: break-all;
}

.annotation-form {
  border-top: 1px solid #e0e0e0;
  padding: 20px;
  background: #fafafa;
}

.annotation-form h4 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
}

.rating-options {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.rating-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.rating-option:hover {
  border-color: #3498db;
}

.rating-option input[type="radio"] {
  margin: 0;
}

.rating-option input[type="radio"]:checked + .rating-icon + .rating-text {
  font-weight: 600;
}

.rating-option.good input[type="radio"]:checked {
  background: #27ae60;
}

.rating-option.partial input[type="radio"]:checked {
  background: #e67e22;
}

.rating-option.bad input[type="radio"]:checked {
  background: #e74c3c;
}

.rating-icon {
  font-size: 1.2rem;
}

.rating-text {
  font-size: 0.9rem;
}

.error-types {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.error-type-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.error-type-option:hover {
  border-color: #3498db;
  background: #f8f9fa;
}

.error-type-option input[type="checkbox"] {
  margin: 0;
}

.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  line-height: 1.4;
  resize: vertical;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-primary:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .rating-options {
    flex-direction: column;
  }

  .error-types {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>

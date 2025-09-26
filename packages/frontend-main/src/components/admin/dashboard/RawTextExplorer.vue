<template>
  <div class="raw-text-explorer">
    <h3>📄 原始文本探索器</h3>
    <p class="description">深入分析双脑报告的原始文本内容，提取关键信息和模式</p>

    <div class="explorer-content">
      <!-- 文本对比视图 -->
      <div class="text-comparison">
        <div class="text-panel qwen-text">
          <h4>🧠 Qwen事实归因报告</h4>
          <div class="text-content">
            <div class="text-header">
              <span class="text-length">{{ qwenReport?.content?.length || 0 }} 字符</span>
              <span class="text-confidence">置信度: {{ Math.round((qwenReport?.confidenceScore || 0) * 100) }}%</span>
            </div>
            <div class="text-body">
              <pre>{{ qwenReport?.content || '暂无内容' }}</pre>
            </div>
          </div>
        </div>

        <div class="text-panel doubao-text">
          <h4>🌊 豆包舆情感知报告</h4>
          <div class="text-content">
            <div class="text-header">
              <span class="text-length">{{ doubaoReport?.content?.length || 0 }} 字符</span>
              <span class="text-confidence">置信度: {{ Math.round((doubaoReport?.confidenceScore || 0) * 100) }}%</span>
            </div>
            <div class="text-body">
              <pre>{{ doubaoReport?.content || '暂无内容' }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- 关键词分析 -->
      <div class="keyword-analysis">
        <h4>🔍 关键词分析</h4>
        <div class="keywords-grid">
          <div class="keyword-section">
            <h5>Qwen关键词</h5>
            <div class="keyword-tags">
              <span
                v-for="(keyword, index) in qwenReport?.keywords || []"
                :key="index"
                class="keyword-tag qwen-tag"
              >
                {{ keyword }}
              </span>
            </div>
          </div>

          <div class="keyword-section">
            <h5>豆包关键词</h5>
            <div class="keyword-tags">
              <span
                v-for="(keyword, index) in doubaoReport?.keywords || []"
                :key="index"
                class="keyword-tag doubao-tag"
              >
                {{ keyword }}
              </span>
            </div>
          </div>
        </div>

        <!-- 关键词重叠分析 -->
        <div class="keyword-overlap">
          <h5>关键词重叠分析</h5>
          <div class="overlap-metrics">
            <div class="metric">
              <span class="metric-label">重叠关键词:</span>
              <span class="metric-value">{{ getOverlapKeywords().length }} 个</span>
            </div>
            <div class="metric">
              <span class="metric-label">重叠率:</span>
              <span class="metric-value">{{ getOverlapRate() }}%</span>
            </div>
          </div>
          <div class="overlap-keywords">
            <span
              v-for="keyword in getOverlapKeywords()"
              :key="keyword"
              class="keyword-tag overlap-tag"
            >
              {{ keyword }}
            </span>
          </div>
        </div>
      </div>

      <!-- 实体识别 -->
      <div class="entity-analysis">
        <h4>🏷️ 实体识别</h4>
        <div class="entities-grid">
          <div class="entity-section">
            <h5>Qwen识别的实体</h5>
            <div class="entity-tags">
              <span
                v-for="(entity, index) in qwenReport?.entities || []"
                :key="index"
                class="entity-tag qwen-entity"
              >
                {{ entity }}
              </span>
            </div>
          </div>

          <div class="entity-section">
            <h5>豆包识别的实体</h5>
            <div class="entity-tags">
              <span
                v-for="(entity, index) in doubaoReport?.entities || []"
                :key="index"
                class="entity-tag doubao-entity"
              >
                {{ entity }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 文本相似度分析 -->
      <div class="similarity-analysis">
        <h4>📊 文本相似度分析</h4>
        <div class="similarity-metrics">
          <div class="metric-card">
            <div class="metric-title">余弦相似度</div>
            <div class="metric-value">{{ getCosineSimilarity() }}%</div>
            <div class="metric-bar">
              <div
                class="metric-fill"
                :style="{ width: getCosineSimilarity() + '%' }"
              ></div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-title">Jaccard相似度</div>
            <div class="metric-value">{{ getJaccardSimilarity() }}%</div>
            <div class="metric-bar">
              <div
                class="metric-fill"
                :style="{ width: getJaccardSimilarity() + '%' }"
              ></div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-title">编辑距离</div>
            <div class="metric-value">{{ getEditDistance() }}</div>
            <div class="metric-description">越小越相似</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  stockCode: string
  reportDate: string
  qwenReport: any
  doubaoReport: any
}

const props = defineProps<Props>()

// 计算关键词重叠
const getOverlapKeywords = () => {
  if (!props.qwenReport?.keywords || !props.doubaoReport?.keywords) return []

  const qwenKeywords = new Set(props.qwenReport.keywords.map((k: string) => k.toLowerCase()))
  const doubaoKeywords = new Set(props.doubaoReport.keywords.map((k: string) => k.toLowerCase()))

  return Array.from(qwenKeywords).filter(keyword => doubaoKeywords.has(keyword))
}

// 计算重叠率
const getOverlapRate = () => {
  if (!props.qwenReport?.keywords || !props.doubaoReport?.keywords) return 0

  const qwenKeywords = new Set(props.qwenReport.keywords.map((k: string) => k.toLowerCase()))
  const doubaoKeywords = new Set(props.doubaoReport.keywords.map((k: string) => k.toLowerCase()))
  const overlap = getOverlapKeywords().length

  const union = new Set([...qwenKeywords, ...doubaoKeywords]).size
  return union > 0 ? Math.round((overlap / union) * 100) : 0
}

// 计算余弦相似度（简化版）
const getCosineSimilarity = () => {
  if (!props.qwenReport?.content || !props.doubaoReport?.content) return 0

  // 简化的余弦相似度计算
  const qwenWords = props.qwenReport.content.toLowerCase().split(/\s+/)
  const doubaoWords = props.doubaoReport.content.toLowerCase().split(/\s+/)

  const qwenWordCount = new Map()
  const doubaoWordCount = new Map()

  qwenWords.forEach(word => {
    qwenWordCount.set(word, (qwenWordCount.get(word) || 0) + 1)
  })

  doubaoWords.forEach(word => {
    doubaoWordCount.set(word, (doubaoWordCount.get(word) || 0) + 1)
  })

  const allWords = new Set([...qwenWordCount.keys(), ...doubaoWordCount.keys()])
  let dotProduct = 0
  let qwenNorm = 0
  let doubaoNorm = 0

  allWords.forEach(word => {
    const qwenCount = qwenWordCount.get(word) || 0
    const doubaoCount = doubaoWordCount.get(word) || 0

    dotProduct += qwenCount * doubaoCount
    qwenNorm += qwenCount * qwenCount
    doubaoNorm += doubaoCount * doubaoCount
  })

  if (qwenNorm === 0 || doubaoNorm === 0) return 0

  const similarity = dotProduct / (Math.sqrt(qwenNorm) * Math.sqrt(doubaoNorm))
  return Math.round(similarity * 100)
}

// 计算Jaccard相似度
const getJaccardSimilarity = () => {
  if (!props.qwenReport?.keywords || !props.doubaoReport?.keywords) return 0

  const qwenKeywords = new Set(props.qwenReport.keywords.map((k: string) => k.toLowerCase()))
  const doubaoKeywords = new Set(props.doubaoReport.keywords.map((k: string) => k.toLowerCase()))

  const intersection = new Set([...qwenKeywords].filter(x => doubaoKeywords.has(x)))
  const union = new Set([...qwenKeywords, ...doubaoKeywords])

  return union.size > 0 ? Math.round((intersection.size / union.size) * 100) : 0
}

// 计算编辑距离（简化版）
const getEditDistance = () => {
  if (!props.qwenReport?.content || !props.doubaoReport?.content) return 0

  const str1 = props.qwenReport.content.toLowerCase()
  const str2 = props.doubaoReport.content.toLowerCase()

  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      )
    }
  }

  return matrix[str2.length][str1.length]
}
</script>

<style scoped>
.raw-text-explorer {
  padding: 20px;
}

.raw-text-explorer h3 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.description {
  color: #7f8c8d;
  margin-bottom: 20px;
  font-size: 14px;
}

.explorer-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.text-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.text-panel {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.qwen-text {
  border-color: #3498db;
}

.doubao-text {
  border-color: #e74c3c;
}

.text-panel h4 {
  margin: 0;
  padding: 15px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  font-size: 16px;
}

.qwen-text h4 {
  background: #ebf3fd;
}

.doubao-text h4 {
  background: #fdf2f2;
}

.text-content {
  padding: 15px;
}

.text-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 12px;
  color: #7f8c8d;
}

.text-body {
  max-height: 300px;
  overflow-y: auto;
}

.text-body pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  color: #555;
}

.keyword-analysis h4,
.entity-analysis h4,
.similarity-analysis h4 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 16px;
}

.keywords-grid,
.entities-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.keyword-section,
.entity-section {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
}

.keyword-section h5,
.entity-section h5 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 14px;
}

.keyword-tags,
.entity-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword-tag,
.entity-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.keyword-tag.qwen-tag,
.entity-tag.qwen-entity {
  background: #3498db;
  color: white;
}

.keyword-tag.doubao-tag,
.entity-tag.doubao-entity {
  background: #e74c3c;
  color: white;
}

.keyword-tag.overlap-tag {
  background: #27ae60;
  color: white;
}

.keyword-overlap {
  background: #e8f5e8;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid #27ae60;
}

.keyword-overlap h5 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 14px;
}

.overlap-metrics {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.metric-label {
  font-size: 12px;
  color: #7f8c8d;
}

.metric-value {
  font-size: 16px;
  font-weight: bold;
  color: #27ae60;
}

.overlap-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.similarity-metrics {
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
}

.metric-title {
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 10px;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 10px;
}

.metric-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.metric-fill {
  height: 100%;
  background: #3498db;
  transition: width 0.3s ease;
}

.metric-description {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 5px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .text-comparison,
  .keywords-grid,
  .entities-grid {
    grid-template-columns: 1fr;
  }

  .similarity-metrics {
    grid-template-columns: 1fr;
  }

  .overlap-metrics {
    flex-direction: column;
    gap: 10px;
  }
}
</style>

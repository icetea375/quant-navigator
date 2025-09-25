<template>
  <div class="super-dashboard">
    <h2>📊 超级仪表盘</h2>
    
    <!-- Tab选项卡式关联信息聚合区 -->
    <div class="dashboard-tabs">
      <div class="tab-header">
        <button 
          v-for="(tab, index) in tabs" 
          :key="index"
          :class="['tab-button', { active: activeTab === index }]"
          @click="activeTab = index"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>
      
      <div class="tab-content">
        <!-- 原始文本探索器 -->
        <div v-if="activeTab === 0" class="tab-panel">
          <RawTextExplorer 
            :stockCode="stockCode"
            :reportDate="reportDate"
            :qwenReport="qwenReport"
            :doubaoReport="doubaoReport"
          />
        </div>
        
        <!-- 财务快照 -->
        <div v-if="activeTab === 1" class="tab-panel">
          <FinancialSnapshot 
            :stockCode="stockCode"
            :reportDate="reportDate"
          />
        </div>
        
        <!-- 技术指标分析 -->
        <div v-if="activeTab === 2" class="tab-panel">
          <TechnicalAnalysis 
            :stockCode="stockCode"
            :reportDate="reportDate"
          />
        </div>
        
        <!-- 市场情绪监控 -->
        <div v-if="activeTab === 3" class="tab-panel">
          <MarketSentimentMonitor 
            :stockCode="stockCode"
            :reportDate="reportDate"
          />
        </div>
        
        <!-- 风险因子分析 -->
        <div v-if="activeTab === 4" class="tab-panel">
          <RiskFactorAnalysis 
            :stockCode="stockCode"
            :reportDate="reportDate"
            :arbitrationCase="arbitrationCase"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import RawTextExplorer from './dashboard/RawTextExplorer.vue'
import FinancialSnapshot from './dashboard/FinancialSnapshot.vue'
import TechnicalAnalysis from './dashboard/TechnicalAnalysis.vue'
import MarketSentimentMonitor from './dashboard/MarketSentimentMonitor.vue'
import RiskFactorAnalysis from './dashboard/RiskFactorAnalysis.vue'

interface Props {
  stockCode: string
  reportDate: string
  qwenReport: any
  doubaoReport: any
  arbitrationCase: any
}

const props = defineProps<Props>()

const activeTab = ref(0)

const tabs = [
  { icon: '📄', label: '原始文本探索器' },
  { icon: '💰', label: '财务快照' },
  { icon: '📈', label: '技术指标分析' },
  { icon: '😊', label: '市场情绪监控' },
  { icon: '⚠️', label: '风险因子分析' }
]
</script>

<style scoped>
.super-dashboard {
  margin-top: 30px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.super-dashboard h2 {
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

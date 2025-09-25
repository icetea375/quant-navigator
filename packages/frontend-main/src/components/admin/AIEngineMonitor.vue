<template>
  <div class="ai-engine-monitor">
    <div class="engines-grid">
      <div 
        v-for="engine in aiEngines" 
        :key="engine.name"
        class="engine-card"
        :class="engine.status"
      >
        <div class="engine-header">
          <div class="engine-info">
            <h4>{{ engine.name }}</h4>
            <p>{{ engine.description }}</p>
          </div>
          <div class="engine-status">
            <el-tag :type="getStatusType(engine.status)" size="small">
              {{ getStatusText(engine.status) }}
            </el-tag>
          </div>
        </div>
        
        <div class="engine-metrics">
          <div class="metric">
            <span class="metric-label">CPU使用率</span>
            <div class="metric-bar">
              <div 
                class="metric-fill" 
                :style="{ width: engine.cpuUsage + '%' }"
                :class="getUsageClass(engine.cpuUsage)"
              ></div>
            </div>
            <span class="metric-value">{{ engine.cpuUsage }}%</span>
          </div>
          
          <div class="metric">
            <span class="metric-label">内存使用率</span>
            <div class="metric-bar">
              <div 
                class="metric-fill" 
                :style="{ width: engine.memoryUsage + '%' }"
                :class="getUsageClass(engine.memoryUsage)"
              ></div>
            </div>
            <span class="metric-value">{{ engine.memoryUsage }}%</span>
          </div>
          
          <div class="metric">
            <span class="metric-label">处理请求</span>
            <span class="metric-value">{{ engine.requestCount }}/分钟</span>
          </div>
        </div>
        
        <div class="engine-actions">
          <el-button 
            size="small" 
            :type="engine.status === 'running' ? 'danger' : 'primary'"
            @click="toggleEngine(engine)"
          >
            {{ engine.status === 'running' ? '停止' : '启动' }}
          </el-button>
          <el-button size="small" @click="viewEngineLogs(engine)">
            查看日志
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const aiEngines = ref([
  {
    name: 'LightGBM引擎',
    description: '第一层机器学习预测',
    status: 'running',
    cpuUsage: 45,
    memoryUsage: 62,
    requestCount: 120
  },
  {
    name: 'FinBERT引擎',
    description: '第二层情感分析',
    status: 'running',
    cpuUsage: 38,
    memoryUsage: 55,
    requestCount: 95
  },
  {
    name: 'LLaMA3引擎',
    description: '第三层大语言模型',
    status: 'stopped',
    cpuUsage: 0,
    memoryUsage: 12,
    requestCount: 0
  },
  {
    name: '归因引擎',
    description: '市场异动归因分析',
    status: 'running',
    cpuUsage: 28,
    memoryUsage: 41,
    requestCount: 78
  }
])

const getStatusType = (status: string) => {
  switch (status) {
    case 'running': return 'success'
    case 'stopped': return 'info'
    case 'error': return 'danger'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'running': return '运行中'
    case 'stopped': return '已停止'
    case 'error': return '错误'
    default: return '未知'
  }
}

const getUsageClass = (usage: number) => {
  if (usage > 80) return 'high'
  if (usage > 60) return 'medium'
  return 'low'
}

const toggleEngine = (engine: any) => {
  engine.status = engine.status === 'running' ? 'stopped' : 'running'
  if (engine.status === 'stopped') {
    engine.cpuUsage = 0
    engine.requestCount = 0
  } else {
    engine.cpuUsage = Math.floor(Math.random() * 50) + 20
    engine.requestCount = Math.floor(Math.random() * 100) + 50
  }
  ElMessage.success(`${engine.name} ${engine.status === 'running' ? '已启动' : '已停止'}`)
}

const viewEngineLogs = (engine: any) => {
  ElMessage.info(`查看 ${engine.name} 日志`)
}

onMounted(() => {
  // 模拟实时更新
  setInterval(() => {
    aiEngines.value.forEach(engine => {
      if (engine.status === 'running') {
        engine.cpuUsage = Math.max(0, engine.cpuUsage + (Math.random() - 0.5) * 10)
        engine.memoryUsage = Math.max(0, engine.memoryUsage + (Math.random() - 0.5) * 5)
        engine.requestCount = Math.max(0, engine.requestCount + Math.floor((Math.random() - 0.5) * 20))
      }
    })
  }, 5000)
})
</script>

<style scoped>
.ai-engine-monitor {
  padding: 20px 0;
}

.engines-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.engine-card {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.engine-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.engine-card.running {
  border-left: 4px solid #67c23a;
}

.engine-card.stopped {
  border-left: 4px solid #909399;
}

.engine-card.error {
  border-left: 4px solid #f56c6c;
}

.engine-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.engine-info h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 16px;
}

.engine-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.engine-metrics {
  margin-bottom: 20px;
}

.metric {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.metric-label {
  font-size: 12px;
  color: #999;
  min-width: 80px;
}

.metric-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.metric-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.metric-fill.low {
  background: #67c23a;
}

.metric-fill.medium {
  background: #e6a23c;
}

.metric-fill.high {
  background: #f56c6c;
}

.metric-value {
  font-size: 12px;
  color: #333;
  font-weight: 600;
  min-width: 40px;
  text-align: right;
}

.engine-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .engines-grid {
    grid-template-columns: 1fr;
  }
  
  .engine-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .metric {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .metric-bar {
    width: 100%;
  }
  
  .engine-actions {
    justify-content: stretch;
  }
  
  .engine-actions .el-button {
    flex: 1;
  }
}
</style>


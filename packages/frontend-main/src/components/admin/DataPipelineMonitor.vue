<template>
  <div class="data-pipeline-monitor">
    <div class="pipeline-status">
      <div
        class="status-indicator"
        :class="pipelineStatus.status"
      >
        <el-icon><component :is="getStatusIcon(pipelineStatus.status)" /></el-icon>
        <span>{{ getStatusText(pipelineStatus.status) }}</span>
      </div>
    </div>

    <div class="pipeline-metrics">
      <div class="metric-item">
        <div class="metric-label">
          处理速度
        </div>
        <div class="metric-value">
          {{ pipelineStatus.processingSpeed }}/秒
        </div>
      </div>
      <div class="metric-item">
        <div class="metric-label">
          队列长度
        </div>
        <div class="metric-value">
          {{ pipelineStatus.queueLength }}
        </div>
      </div>
      <div class="metric-item">
        <div class="metric-label">
          成功率
        </div>
        <div class="metric-value">
          {{ pipelineStatus.successRate }}%
        </div>
      </div>
    </div>

    <div class="pipeline-stages">
      <h4>处理阶段</h4>
      <div class="stages-list">
        <div
          v-for="stage in pipelineStages"
          :key="stage.name"
          class="stage-item"
          :class="stage.status"
        >
          <div class="stage-info">
            <span class="stage-name">{{ stage.name }}</span>
            <span class="stage-time">{{ stage.duration }}ms</span>
          </div>
          <div class="stage-status">
            <el-icon><component :is="getStageIcon(stage.status)" /></el-icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const pipelineStatus = ref({
  status: 'running', // running, stopped, error
  processingSpeed: 150,
  queueLength: 23,
  successRate: 98.5
})

const pipelineStages = ref([
  { name: '数据获取', status: 'completed', duration: 120 },
  { name: '数据清洗', status: 'running', duration: 85 },
  { name: '特征提取', status: 'pending', duration: 0 },
  { name: '模型预测', status: 'pending', duration: 0 },
  { name: '结果输出', status: 'pending', duration: 0 }
])

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'running': return 'CircleCheck'
    case 'stopped': return 'Clock'
    case 'error': return 'Warning'
    default: return 'Clock'
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

const getStageIcon = (status: string) => {
  switch (status) {
    case 'completed': return 'CircleCheck'
    case 'running': return 'Clock'
    case 'pending': return 'Clock'
    case 'error': return 'Warning'
    default: return 'Clock'
  }
}

onMounted(() => {
  // 模拟实时更新
  setInterval(() => {
    pipelineStatus.value.processingSpeed = Math.floor(Math.random() * 50) + 100
    pipelineStatus.value.queueLength = Math.floor(Math.random() * 20) + 10
  }, 3000)
})
</script>

<style scoped>
.data-pipeline-monitor {
  padding: 20px 0;
}

.pipeline-status {
  margin-bottom: 20px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  border-radius: 6px;
  font-weight: 600;
}

.status-indicator.running {
  background: #f0f9ff;
  color: #67c23a;
  border: 1px solid #b3e19d;
}

.status-indicator.stopped {
  background: #f4f4f5;
  color: #909399;
  border: 1px solid #d3d4d6;
}

.status-indicator.error {
  background: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fbc4c4;
}

.pipeline-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 25px;
}

.metric-item {
  text-align: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.metric-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 5px;
}

.metric-value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.pipeline-stages h4 {
  color: #333;
  margin-bottom: 15px;
  font-size: 16px;
}

.stages-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stage-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
}

.stage-item.completed {
  background: #f0f9ff;
  border-color: #b3e19d;
}

.stage-item.running {
  background: #fff7e6;
  border-color: #ffd591;
}

.stage-item.pending {
  background: #f4f4f5;
  border-color: #d3d4d6;
}

.stage-item.error {
  background: #fef0f0;
  border-color: #fbc4c4;
}

.stage-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stage-name {
  font-weight: 600;
  color: #333;
}

.stage-time {
  font-size: 12px;
  color: #666;
}

.stage-status {
  color: #999;
}

.stage-item.completed .stage-status {
  color: #67c23a;
}

.stage-item.running .stage-status {
  color: #e6a23c;
}

.stage-item.error .stage-status {
  color: #f56c6c;
}

@media (max-width: 768px) {
  .pipeline-metrics {
    grid-template-columns: 1fr;
  }

  .stage-item {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
}
</style>

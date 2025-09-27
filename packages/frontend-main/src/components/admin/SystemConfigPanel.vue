<template>
  <div class="system-config-panel">
    <el-tabs
      v-model="activeTab"
      type="card"
    >
      <el-tab-pane
        label="基础配置"
        name="basic"
      >
        <el-form
          :model="basicConfig"
          label-width="120px"
        >
          <el-form-item label="系统名称">
            <el-input v-model="basicConfig.systemName" />
          </el-form-item>
          <el-form-item label="数据更新频率">
            <el-select v-model="basicConfig.updateFrequency">
              <el-option
                label="实时"
                value="realtime"
              />
              <el-option
                label="每分钟"
                value="1min"
              />
              <el-option
                label="每5分钟"
                value="5min"
              />
              <el-option
                label="每15分钟"
                value="15min"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="最大并发数">
            <el-input-number
              v-model="basicConfig.maxConcurrency"
              :min="1"
              :max="100"
            />
          </el-form-item>
          <el-form-item label="日志级别">
            <el-select v-model="basicConfig.logLevel">
              <el-option
                label="DEBUG"
                value="debug"
              />
              <el-option
                label="INFO"
                value="info"
              />
              <el-option
                label="WARN"
                value="warn"
              />
              <el-option
                label="ERROR"
                value="error"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane
        label="AI配置"
        name="ai"
      >
        <el-form
          :model="aiConfig"
          label-width="120px"
        >
          <el-form-item label="模型版本">
            <el-select v-model="aiConfig.modelVersion">
              <el-option
                label="v1.0"
                value="v1.0"
              />
              <el-option
                label="v1.1"
                value="v1.1"
              />
              <el-option
                label="v2.0"
                value="v2.0"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="置信度阈值">
            <el-slider
              v-model="aiConfig.confidenceThreshold"
              :min="0"
              :max="1"
              :step="0.1"
            />
            <span class="slider-value">{{ aiConfig.confidenceThreshold }}</span>
          </el-form-item>
          <el-form-item label="最大Token数">
            <el-input-number
              v-model="aiConfig.maxTokens"
              :min="1000"
              :max="10000"
            />
          </el-form-item>
          <el-form-item label="温度参数">
            <el-slider
              v-model="aiConfig.temperature"
              :min="0"
              :max="2"
              :step="0.1"
            />
            <span class="slider-value">{{ aiConfig.temperature }}</span>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane
        label="数据库配置"
        name="database"
      >
        <el-form
          :model="dbConfig"
          label-width="120px"
        >
          <el-form-item label="数据库类型">
            <el-select v-model="dbConfig.type">
              <el-option
                label="PostgreSQL"
                value="postgresql"
              />
              <el-option
                label="MySQL"
                value="mysql"
              />
              <el-option
                label="MongoDB"
                value="mongodb"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="连接地址">
            <el-input v-model="dbConfig.host" />
          </el-form-item>
          <el-form-item label="端口">
            <el-input-number
              v-model="dbConfig.port"
              :min="1"
              :max="65535"
            />
          </el-form-item>
          <el-form-item label="数据库名">
            <el-input v-model="dbConfig.database" />
          </el-form-item>
          <el-form-item label="连接池大小">
            <el-input-number
              v-model="dbConfig.poolSize"
              :min="1"
              :max="100"
            />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane
        label="监控配置"
        name="monitoring"
      >
        <el-form
          :model="monitoringConfig"
          label-width="120px"
        >
          <el-form-item label="监控开关">
            <el-switch v-model="monitoringConfig.enabled" />
          </el-form-item>
          <el-form-item label="告警邮箱">
            <el-input v-model="monitoringConfig.alertEmail" />
          </el-form-item>
          <el-form-item label="CPU阈值">
            <el-slider
              v-model="monitoringConfig.cpuThreshold"
              :min="0"
              :max="100"
            />
            <span class="slider-value">{{ monitoringConfig.cpuThreshold }}%</span>
          </el-form-item>
          <el-form-item label="内存阈值">
            <el-slider
              v-model="monitoringConfig.memoryThreshold"
              :min="0"
              :max="100"
            />
            <span class="slider-value">{{ monitoringConfig.memoryThreshold }}%</span>
          </el-form-item>
          <el-form-item label="磁盘阈值">
            <el-slider
              v-model="monitoringConfig.diskThreshold"
              :min="0"
              :max="100"
            />
            <span class="slider-value">{{ monitoringConfig.diskThreshold }}%</span>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const activeTab = ref('basic')

const basicConfig = reactive({
  systemName: '量化导航仪',
  updateFrequency: '5min',
  maxConcurrency: 10,
  logLevel: 'info'
})

const aiConfig = reactive({
  modelVersion: 'v2.0',
  confidenceThreshold: 0.8,
  maxTokens: 4000,
  temperature: 0.7
})

const dbConfig = reactive({
  type: 'postgresql',
  host: 'localhost',
  port: 5432,
  database: 'quant_navigator',
  poolSize: 20
})

const monitoringConfig = reactive({
  enabled: true,
  alertEmail: 'admin@example.com',
  cpuThreshold: 80,
  memoryThreshold: 85,
  diskThreshold: 90
})
</script>

<style scoped>
.system-config-panel {
  padding: 20px 0;
}

.slider-value {
  margin-left: 10px;
  color: #666;
  font-size: 14px;
}

:deep(.el-tabs__content) {
  padding: 20px 0;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-slider) {
  margin: 10px 0;
}
</style>

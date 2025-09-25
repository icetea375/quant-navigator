<template>
  <div class="system-logs-panel">
    <div class="logs-controls">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索日志..."
        prefix-icon="Search"
        clearable
        style="width: 300px; margin-right: 10px;"
      />
      <el-button @click="clearLogs">
        <el-icon><Delete /></el-icon>
        清空日志
      </el-button>
      <el-button @click="exportLogs">
        <el-icon><Download /></el-icon>
        导出日志
      </el-button>
    </div>
    
    <div class="logs-container">
      <div v-if="filteredLogs.length === 0" class="empty-logs">
        <el-empty description="暂无日志数据" />
      </div>
      
      <div v-else class="logs-list">
        <div 
          v-for="log in filteredLogs" 
          :key="log.id"
          class="log-item"
          :class="log.level"
        >
          <div class="log-header">
            <div class="log-level">
              <el-tag :type="getLevelType(log.level)" size="small">
                {{ log.level.toUpperCase() }}
              </el-tag>
            </div>
            <div class="log-time">{{ formatTime(log.timestamp) }}</div>
            <div class="log-source">{{ log.source }}</div>
          </div>
          
          <div class="log-content">
            <div class="log-message">{{ log.message }}</div>
            <div v-if="log.details" class="log-details">
              <el-button 
                type="text" 
                size="small" 
                @click="toggleDetails(log.id)"
              >
                {{ expandedLogs.includes(log.id) ? '隐藏详情' : '显示详情' }}
              </el-button>
              <div v-if="expandedLogs.includes(log.id)" class="details-content">
                <pre>{{ log.details }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="logs-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="totalLogs"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Download } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

interface LogEntry {
  id: string
  level: 'debug' | 'info' | 'warn' | 'error'
  timestamp: string
  source: string
  message: string
  details?: string
}

const props = defineProps<{
  logLevel: string
}>()

const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const expandedLogs = ref<string[]>([])

const logs = ref<LogEntry[]>([])

const filteredLogs = computed(() => {
  let filtered = logs.value

  // 按日志级别过滤
  if (props.logLevel !== 'all') {
    filtered = filtered.filter(log => log.level === props.logLevel)
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(log => 
      log.message.toLowerCase().includes(keyword) ||
      log.source.toLowerCase().includes(keyword) ||
      log.details?.toLowerCase().includes(keyword)
    )
  }

  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filtered.slice(start, end)
})

const totalLogs = computed(() => {
  let filtered = logs.value

  if (props.logLevel !== 'all') {
    filtered = filtered.filter(log => log.level === props.logLevel)
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(log => 
      log.message.toLowerCase().includes(keyword) ||
      log.source.toLowerCase().includes(keyword) ||
      log.details?.toLowerCase().includes(keyword)
    )
  }

  return filtered.length
})

const getLevelType = (level: string) => {
  switch (level) {
    case 'error': return 'danger'
    case 'warn': return 'warning'
    case 'info': return 'primary'
    case 'debug': return 'info'
    default: return 'info'
  }
}

const formatTime = (timestamp: string) => {
  return dayjs(timestamp).format('MM-DD HH:mm:ss.SSS')
}

const toggleDetails = (logId: string) => {
  const index = expandedLogs.value.indexOf(logId)
  if (index > -1) {
    expandedLogs.value.splice(index, 1)
  } else {
    expandedLogs.value.push(logId)
  }
}

const clearLogs = () => {
  logs.value = []
  ElMessage.success('日志已清空')
}

const exportLogs = () => {
  const logText = logs.value.map(log => 
    `[${formatTime(log.timestamp)}] ${log.level.toUpperCase()} [${log.source}] ${log.message}`
  ).join('\n')
  
  const blob = new Blob([logText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `system-logs-${dayjs().format('YYYY-MM-DD-HH-mm-ss')}.txt`
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('日志导出成功')
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

const generateMockLogs = () => {
  const levels = ['debug', 'info', 'warn', 'error'] as const
  const sources = ['DataPipeline', 'AIEngine', 'Database', 'API', 'Scheduler']
  const messages = [
    '数据管道处理完成',
    'AI模型预测成功',
    '数据库连接异常',
    'API请求超时',
    '定时任务执行失败',
    '用户登录成功',
    '系统启动完成',
    '内存使用率过高',
    '磁盘空间不足',
    '网络连接中断'
  ]

  const mockLogs: LogEntry[] = []
  
  for (let i = 0; i < 100; i++) {
    const level = levels[Math.floor(Math.random() * levels.length)]
    const source = sources[Math.floor(Math.random() * sources.length)]
    const message = messages[Math.floor(Math.random() * messages.length)]
    
    mockLogs.push({
      id: `log-${i}`,
      level,
      timestamp: dayjs().subtract(i * 2, 'minute').toISOString(),
      source,
      message,
      details: level === 'error' ? `错误详情: ${message}\n堆栈信息: Error at line ${Math.floor(Math.random() * 1000)}\n调用链: main -> process -> handle` : undefined
    })
  }
  
  logs.value = mockLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

onMounted(() => {
  generateMockLogs()
})
</script>

<style scoped>
.system-logs-panel {
  padding: 20px 0;
}

.logs-controls {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 10px;
}

.logs-container {
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafafa;
}

.empty-logs {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.logs-list {
  padding: 10px;
}

.log-item {
  background: white;
  border-radius: 6px;
  margin-bottom: 10px;
  padding: 15px;
  border-left: 4px solid #e4e7ed;
  transition: all 0.3s ease;
}

.log-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.log-item.error {
  border-left-color: #f56c6c;
  background: #fef0f0;
}

.log-item.warn {
  border-left-color: #e6a23c;
  background: #fdf6ec;
}

.log-item.info {
  border-left-color: #409eff;
  background: #ecf5ff;
}

.log-item.debug {
  border-left-color: #909399;
  background: #f4f4f5;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
}

.log-level {
  flex-shrink: 0;
}

.log-time {
  font-size: 12px;
  color: #666;
  font-family: monospace;
}

.log-source {
  font-size: 12px;
  color: #999;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
}

.log-content {
  color: #333;
}

.log-message {
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 10px;
}

.log-details {
  border-top: 1px solid #f0f0f0;
  padding-top: 10px;
}

.details-content {
  margin-top: 10px;
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.details-content pre {
  margin: 0;
  font-size: 12px;
  color: #666;
  white-space: pre-wrap;
  word-break: break-all;
}

.logs-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .logs-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .logs-controls .el-input {
    width: 100% !important;
    margin-right: 0 !important;
    margin-bottom: 10px;
  }
  
  .log-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .log-time {
    order: 1;
  }
  
  .log-source {
    order: 2;
  }
}
</style>


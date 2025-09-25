<template>
  <div class="my-assistant">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>AI投研助理</h1>
      <p>基于您的持仓和偏好，提供个性化的投资分析</p>
    </div>

    <!-- 专属盘前雷达 -->
    <el-card class="section-card" v-loading="briefingLoading">
      <template #header>
        <div class="card-header">
          <h3>专属盘前雷达</h3>
          <el-button type="primary" size="small" @click="refreshBriefing">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>
      <MyBriefingCard :briefing="myBriefing" />
    </el-card>

    <!-- 持仓异动归因 -->
    <el-card class="section-card" v-loading="attributionsLoading">
      <template #header>
        <div class="card-header">
          <h3>持仓异动归因</h3>
          <div class="header-actions">
            <el-select v-model="selectedDate" placeholder="选择日期" size="small" style="width: 150px; margin-right: 10px;">
              <el-option
                v-for="date in dateOptions"
                :key="date.value"
                :label="date.label"
                :value="date.value"
              />
            </el-select>
            <el-button type="primary" size="small" @click="refreshAttributions">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>
      <MyAttributionList :attributions="myAttributions" />
    </el-card>

    <!-- 投资建议 -->
    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <h3>AI投资建议</h3>
          <el-button type="primary" size="small" @click="generateAdvice">
            <el-icon><MagicStick /></el-icon>
            生成建议
          </el-button>
        </div>
      </template>
      <div class="advice-content">
        <div v-if="aiAdvice" class="advice-text">
          <p>{{ aiAdvice }}</p>
        </div>
        <div v-else class="no-advice">
          <el-empty description="暂无AI建议，点击上方按钮生成" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { privateApi } from '@/services/market'
import type { MarketBriefing, HotspotAttribution } from '@/types/market'
import MyBriefingCard from '@/components/private/MyBriefingCard.vue'
import MyAttributionList from '@/components/private/MyAttributionList.vue'
import { Refresh, MagicStick } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const myBriefing = ref<MarketBriefing>({
  date: new Date().toISOString(),
  events: [],
  hotspots: [],
  summary: ''
})

const myAttributions = ref<HotspotAttribution[]>([])
const aiAdvice = ref('')
const briefingLoading = ref(false)
const attributionsLoading = ref(false)
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))

const dateOptions = computed(() => {
  const options = []
  for (let i = 0; i < 7; i++) {
    const date = dayjs().subtract(i, 'day')
    options.push({
      label: date.format('MM-DD'),
      value: date.format('YYYY-MM-DD')
    })
  }
  return options
})

const loadMyBriefing = async () => {
  briefingLoading.value = true
  try {
    const data = await privateApi.getMyBriefing(selectedDate.value)
    myBriefing.value = data
  } catch (error) {
    console.error('Failed to load my briefing:', error)
  } finally {
    briefingLoading.value = false
  }
}

const loadMyAttributions = async () => {
  attributionsLoading.value = true
  try {
    const data = await privateApi.getMyAttributions(selectedDate.value)
    myAttributions.value = data
  } catch (error) {
    console.error('Failed to load my attributions:', error)
  } finally {
    attributionsLoading.value = false
  }
}

const refreshBriefing = () => {
  loadMyBriefing()
}

const refreshAttributions = () => {
  loadMyAttributions()
}

const generateAdvice = async () => {
  try {
    // TODO: 调用AI建议生成API
    aiAdvice.value = '基于当前市场分析，建议关注科技板块的成长股，同时保持对传统制造业的谨慎态度。建议仓位控制在70%左右，留出30%现金等待更好的入场时机。'
  } catch (error) {
    console.error('Failed to generate advice:', error)
  }
}

onMounted(() => {
  loadMyBriefing()
  loadMyAttributions()
})
</script>

<style scoped>
.my-assistant {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 10px;
}

.page-header p {
  color: #666;
  font-size: 16px;
}

.section-card {
  margin-bottom: 30px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  align-items: center;
}

.advice-content {
  min-height: 200px;
}

.advice-text {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  line-height: 1.8;
  color: #333;
}

.no-advice {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .page-header h1 {
    font-size: 24px;
  }
}
</style>


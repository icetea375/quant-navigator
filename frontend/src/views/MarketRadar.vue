<template>
  <div class="market-radar">
    <!-- 导航栏 -->
    <el-header class="header">
      <div class="header-content">
        <div class="logo">
          <el-icon><TrendCharts /></el-icon>
          <span>量化导航仪</span>
        </div>
        <div class="nav-menu">
          <el-button type="text" @click="$router.push('/')">首页</el-button>
          <el-button type="text" @click="$router.push('/login')" v-if="!authStore.isAuthenticated">登录</el-button>
          <el-dropdown v-else>
            <el-button type="text">
              {{ authStore.user?.name }}
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="$router.push('/private')">我的助理</el-dropdown-item>
                <el-dropdown-item @click="authStore.logout()">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <el-main class="main-content">
      <div class="container">
        <!-- 页面标题 -->
        <div class="page-header">
          <h1>市场雷达</h1>
          <p>实时监控市场动态，智能识别投资机会</p>
        </div>

        <!-- 市场简报卡片 -->
        <MarketBriefingCard />

        <!-- 盘前高能事件 -->
        <el-card class="section-card" v-loading="eventsLoading">
          <template #header>
            <div class="card-header">
              <h3>盘前高能事件</h3>
              <el-button type="primary" size="small" @click="refreshEvents">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <HotspotAttributionList :events="preMarketEvents" />
        </el-card>

        <!-- 盘后热点复盘 -->
        <el-card class="section-card" v-loading="hotspotsLoading">
          <template #header>
            <div class="card-header">
              <h3>盘后热点复盘</h3>
              <el-button type="primary" size="small" @click="refreshHotspots">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <HotspotAttributionList :events="postMarketHotspots" />
        </el-card>
      </div>
    </el-main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { marketApi } from '@/services/market'
import type { MarketEvent, HotspotAttribution } from '@/types/market'
import MarketBriefingCard from '@/components/public/MarketBriefingCard.vue'
import HotspotAttributionList from '@/components/public/HotspotAttributionList.vue'
import { TrendCharts, ArrowDown, Refresh } from '@element-plus/icons-vue'

const authStore = useAuthStore()

const preMarketEvents = ref<MarketEvent[]>([])
const postMarketHotspots = ref<HotspotAttribution[]>([])
const eventsLoading = ref(false)
const hotspotsLoading = ref(false)

const loadPreMarketEvents = async () => {
  eventsLoading.value = true
  try {
    const data = await marketApi.getPreMarketEvents()
    preMarketEvents.value = data
  } catch (error) {
    console.error('Failed to load pre-market events:', error)
  } finally {
    eventsLoading.value = false
  }
}

const loadPostMarketHotspots = async () => {
  hotspotsLoading.value = true
  try {
    const data = await marketApi.getPostMarketHotspots()
    postMarketHotspots.value = data
  } catch (error) {
    console.error('Failed to load post-market hotspots:', error)
  } finally {
    hotspotsLoading.value = false
  }
}

const refreshEvents = () => {
  loadPreMarketEvents()
}

const refreshHotspots = () => {
  loadPostMarketHotspots()
}

onMounted(() => {
  loadPreMarketEvents()
  loadPostMarketHotspots()
})
</script>

<style scoped>
.market-radar {
  min-height: 100vh;
  background: #f5f7fa;
}

.header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
}

.nav-menu {
  display: flex;
  gap: 20px;
  align-items: center;
}

.main-content {
  padding: 40px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 36px;
  color: #333;
  margin-bottom: 10px;
}

.page-header p {
  font-size: 18px;
  color: #666;
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

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 28px;
  }
  
  .page-header p {
    font-size: 16px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}
</style>


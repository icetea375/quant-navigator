<template>
  <div class="home">
    <!-- 导航栏 -->
    <el-header class="header">
      <div class="header-content">
        <div class="logo">
          <el-icon><TrendCharts /></el-icon>
          <span>量化导航仪</span>
        </div>
        <div class="nav-menu">
          <el-button type="text" @click="$router.push('/market-radar')">市场雷达</el-button>
          <el-button type="text" @click="$router.push('/login')" v-if="!authStore.isAuthenticated">登录</el-button>
          <el-button type="text" @click="$router.push('/register')" v-if="!authStore.isAuthenticated">注册</el-button>
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

    <!-- 主要内容 -->
    <el-main class="main-content">
      <!-- 英雄区域 -->
      <section class="hero">
        <div class="hero-content">
          <h1 class="hero-title">智能量化投资导航</h1>
          <p class="hero-subtitle">基于AI的市场分析，为您的投资决策提供专业指导</p>
          <div class="hero-actions">
            <el-button type="primary" size="large" @click="$router.push('/market-radar')">
              体验市场雷达
            </el-button>
            <el-button size="large" @click="$router.push('/login')" v-if="!authStore.isAuthenticated">
              立即登录
            </el-button>
          </div>
        </div>
      </section>

      <!-- 功能特色 -->
      <section class="features">
        <div class="container">
          <h2 class="section-title">核心功能</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">
                <el-icon><Monitor /></el-icon>
              </div>
              <h3>市场雷达</h3>
              <p>实时监控市场动态，智能识别投资机会和风险信号</p>
              <el-button type="text" @click="$router.push('/market-radar')">了解更多</el-button>
            </div>
            <div class="feature-card">
              <div class="feature-icon">
                <el-icon><User /></el-icon>
              </div>
              <h3>AI投研助理</h3>
              <p>个性化投资分析，基于您的持仓提供专业建议</p>
              <el-button type="text" @click="$router.push('/login')">立即体验</el-button>
            </div>
            <div class="feature-card">
              <div class="feature-icon">
                <el-icon><DataAnalysis /></el-icon>
              </div>
              <h3>智能归因</h3>
              <p>深度分析市场异动原因，提供科学的投资洞察</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 数据展示 -->
      <section class="stats">
        <div class="container">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number">99.9%</div>
              <div class="stat-label">系统可用性</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">10K+</div>
              <div class="stat-label">实时数据点</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">500+</div>
              <div class="stat-label">监控股票</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">24/7</div>
              <div class="stat-label">智能监控</div>
            </div>
          </div>
        </div>
      </section>
    </el-main>

    <!-- 页脚 -->
    <el-footer class="footer">
      <div class="container">
        <p>&copy; 2024 量化导航仪. 专业的AI投资分析平台</p>
      </div>
    </el-footer>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { TrendCharts, ArrowDown, Monitor, User, DataAnalysis } from '@element-plus/icons-vue'

const authStore = useAuthStore()
</script>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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
  flex: 1;
  padding: 0;
}

.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 100px 0;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.hero-title {
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 20px;
}

.hero-subtitle {
  font-size: 20px;
  margin-bottom: 40px;
  opacity: 0.9;
}

.hero-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.features {
  padding: 80px 0;
  background: #f8f9fa;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.section-title {
  text-align: center;
  font-size: 36px;
  margin-bottom: 60px;
  color: #333;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 40px;
}

.feature-card {
  background: white;
  padding: 40px 30px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 20px;
}

.feature-card h3 {
  font-size: 24px;
  margin-bottom: 15px;
  color: #333;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 20px;
}

.stats {
  padding: 80px 0;
  background: #333;
  color: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 40px;
  text-align: center;
}

.stat-item {
  padding: 20px;
}

.stat-number {
  font-size: 48px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 16px;
  opacity: 0.8;
}

.footer {
  background: #333;
  color: white;
  text-align: center;
  padding: 20px 0;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 36px;
  }

  .hero-subtitle {
    font-size: 18px;
  }

  .hero-actions {
    flex-direction: column;
    align-items: center;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>

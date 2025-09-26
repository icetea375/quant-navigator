<template>
  <div class="private-layout">
    <!-- 侧边栏 -->
    <el-aside :width="sidebarWidth" class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <el-icon><TrendCharts /></el-icon>
          <span v-show="!collapsed">量化导航仪</span>
        </div>
        <el-button
          type="text"
          @click="toggleSidebar"
          class="collapse-btn"
        >
          <el-icon>
            <component :is="collapsed ? 'Expand' : 'Fold'" />
          </el-icon>
        </el-button>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :unique-opened="true"
        router
        class="sidebar-menu"
      >
        <el-menu-item index="/private/assistant">
          <el-icon><User /></el-icon>
          <template #title>AI投研助理</template>
        </el-menu-item>
        <el-menu-item index="/private/stock-pool">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>股票池管理</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <div class="main-container">
      <!-- 顶部导航 -->
      <el-header class="top-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-button type="text" @click="$router.push('/market-radar')">
            <el-icon><Monitor /></el-icon>
            市场雷达
          </el-button>

          <el-dropdown>
            <el-button type="text">
              <el-avatar :size="32" :src="userAvatar">
                {{ authStore.user?.name?.charAt(0) }}
              </el-avatar>
              <span class="user-name">{{ authStore.user?.name }}</span>
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="showProfile = true">
                  <el-icon><User /></el-icon>
                  个人资料
                </el-dropdown-item>
                <el-dropdown-item @click="showSettings = true">
                  <el-icon><Setting /></el-icon>
                  设置
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 页面内容 -->
      <el-main class="page-content">
        <router-view />
      </el-main>
    </div>

    <!-- 个人资料对话框 -->
    <el-dialog v-model="showProfile" title="个人资料" width="500px">
      <div class="profile-content">
        <el-form :model="profileForm" label-width="80px">
          <el-form-item label="姓名">
            <el-input v-model="profileForm.name" disabled />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="profileForm.email" disabled />
          </el-form-item>
          <el-form-item label="角色">
            <el-tag :type="profileForm.role === 'admin' ? 'danger' : 'primary'">
              {{ profileForm.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </el-form-item>
          <el-form-item label="注册时间">
            <el-input :value="formatDate(profileForm.createdAt)" disabled />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showProfile = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 设置对话框 -->
    <el-dialog v-model="showSettings" title="设置" width="500px">
      <div class="settings-content">
        <el-form :model="settingsForm" label-width="100px">
          <el-form-item label="主题">
            <el-radio-group v-model="settingsForm.theme">
              <el-radio label="light">浅色</el-radio>
              <el-radio label="dark">深色</el-radio>
              <el-radio label="auto">跟随系统</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="语言">
            <el-select v-model="settingsForm.language">
              <el-option label="简体中文" value="zh-CN" />
              <el-option label="English" value="en-US" />
            </el-select>
          </el-form-item>
          <el-form-item label="通知">
            <el-switch v-model="settingsForm.notifications" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showSettings = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  TrendCharts, Expand, Fold, User, DataAnalysis, Monitor,
  ArrowDown, Setting, SwitchButton
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const collapsed = ref(false)
const showProfile = ref(false)
const showSettings = ref(false)

const sidebarWidth = computed(() => collapsed.value ? '64px' : '200px')

const activeMenu = computed(() => route.path)

const currentPageTitle = computed(() => {
  const titleMap: Record<string, string> = {
    '/private/assistant': 'AI投研助理',
    '/private/stock-pool': '股票池管理'
  }
  return titleMap[route.path] || '私人版'
})

const userAvatar = ref('')

const profileForm = reactive({
  name: '',
  email: '',
  role: '',
  createdAt: ''
})

const settingsForm = reactive({
  theme: 'light',
  language: 'zh-CN',
  notifications: true
})

const toggleSidebar = () => {
  collapsed.value = !collapsed.value
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    authStore.logout()
    ElMessage.success('已退出登录')
    router.push('/')
  } catch {
    // 用户取消
  }
}

const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

const saveSettings = () => {
  // TODO: 保存设置到后端
  ElMessage.success('设置已保存')
  showSettings.value = false
}

onMounted(() => {
  if (authStore.user) {
    profileForm.name = authStore.user.name
    profileForm.email = authStore.user.email
    profileForm.role = authStore.user.role
    profileForm.createdAt = authStore.user.createdAt
  }
})
</script>

<style scoped>
.private-layout {
  display: flex;
  height: 100vh;
  background: #f5f7fa;
}

.sidebar {
  background: #304156;
  transition: width 0.3s ease;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #434a50;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-size: 18px;
  font-weight: bold;
  white-space: nowrap;
}

.collapse-btn {
  color: white;
  font-size: 16px;
}

.sidebar-menu {
  border: none;
  background: #304156;
}

.sidebar-menu .el-menu-item {
  color: #bfcbd9;
}

.sidebar-menu .el-menu-item:hover {
  background: #263445;
  color: white;
}

.sidebar-menu .el-menu-item.is-active {
  background: #409eff;
  color: white;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-header {
  background: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-name {
  margin-left: 8px;
  margin-right: 4px;
}

.page-content {
  padding: 20px;
  overflow-y: auto;
}

.profile-content,
.settings-content {
  padding: 20px 0;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar:not(.collapsed) {
    transform: translateX(0);
  }

  .main-container {
    width: 100%;
  }

  .user-name {
    display: none;
  }
}
</style>

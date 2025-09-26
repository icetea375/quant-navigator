import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@views/Home.vue'),
    meta: { title: '量化导航仪' }
  },
  {
    path: '/market-radar',
    name: 'MarketRadar',
    component: () => import('@views/MarketRadar.vue'),
    meta: { title: '市场雷达' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@views/auth/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@views/auth/Register.vue'),
    meta: { title: '注册' }
  },
  {
    path: '/private',
    name: 'Private',
    component: () => import('@views/private/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'PrivateDefault',
        redirect: '/private/assistant'
      },
      {
        path: 'assistant',
        name: 'MyAssistant',
        component: () => import('@views/private/MyAssistant.vue'),
        meta: { title: 'AI投研助理' }
      },
      {
        path: 'stock-pool',
        name: 'StockPoolManager',
        component: () => import('@views/private/StockPoolManager.vue'),
        meta: { title: '股票池管理' }
      }
    ]
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@views/admin/SystemBrainConsole.vue'),
    meta: { title: '系统大脑控制台', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/arbitration',
    name: 'ArbitrationList',
    component: () => import('@components/admin/ArbitrationCaseList.vue'),
    meta: { title: 'AI仲裁案件管理', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/arbitration/:caseId',
    name: 'ArbitrationDetail',
    component: () => import('@components/admin/ArbitrationCaseDetail.vue'),
    meta: { title: '仲裁案件详情', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/arbitration/:caseId/arbitrate',
    name: 'ArbitrationArbitrate',
    component: () => import('@components/admin/ArbitrationCaseDetail.vue'),
    meta: { title: '仲裁决策', requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 量化导航仪`
  }

  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('token')
    if (!token) {
      next('/login')
      return
    }
  }

  // 检查是否需要管理员权限
  if (to.meta.requiresAdmin) {
    const userRole = localStorage.getItem('userRole')
    if (userRole !== 'admin') {
      next('/')
      return
    }
  }

  next()
})

export default router

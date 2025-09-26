import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/services/auth'
import type { User, LoginRequest, RegisterRequest } from '@/types/user'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoading = ref(false)
  const lastActivity = ref<number>(Date.now())

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // 初始化用户信息
  const initializeUser = async () => {
    if (token.value && !user.value) {
      try {
        const userData = await authApi.getCurrentUser()
        user.value = userData
        localStorage.setItem('userInfo', JSON.stringify(userData))
      } catch (error) {
        console.error('Failed to get current user:', error)
        logout()
      }
    }
  }

  const login = async (email: string, password: string) => {
    isLoading.value = true
    try {
      const loginData: LoginRequest = { email, password }
      const response = await authApi.login(loginData)

      token.value = response.token
      user.value = response.user
      lastActivity.value = Date.now()

      // 保存到本地存储
      localStorage.setItem('token', response.token)
      localStorage.setItem('userRole', response.user.role)
      localStorage.setItem('userInfo', JSON.stringify(response.user))

      return { success: true }
    } catch (error: any) {
      console.error('Login error:', error)
      return {
        success: false,
        error: error.message || '登录失败，请检查邮箱和密码'
      }
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData: RegisterRequest) => {
    isLoading.value = true
    try {
      const response = await authApi.register(userData)

      token.value = response.token
      user.value = response.user
      lastActivity.value = Date.now()

      // 保存到本地存储
      localStorage.setItem('token', response.token)
      localStorage.setItem('userRole', response.user.role)
      localStorage.setItem('userInfo', JSON.stringify(response.user))

      return { success: true }
    } catch (error: any) {
      console.error('Register error:', error)
      return {
        success: false,
        error: error.message || '注册失败，请稍后重试'
      }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      // 调用后端登出接口
      if (token.value) {
        await authApi.logout()
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // 清除本地状态
      user.value = null
      token.value = null
      lastActivity.value = 0

      // 清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('userRole')
      localStorage.removeItem('userInfo')
    }
  }

  const refreshToken = async () => {
    if (!token.value) return false

    try {
      const response = await authApi.refreshToken()
      token.value = response.token
      localStorage.setItem('token', response.token)
      lastActivity.value = Date.now()
      return true
    } catch (error) {
      console.error('Token refresh error:', error)
      logout()
      return false
    }
  }

  const updateProfile = async (profileData: Partial<User>) => {
    if (!user.value) return { success: false, error: '用户未登录' }

    try {
      const updatedUser = await authApi.updateProfile(profileData)
      user.value = updatedUser
      localStorage.setItem('userInfo', JSON.stringify(updatedUser))
      return { success: true }
    } catch (error: any) {
      console.error('Update profile error:', error)
      return {
        success: false,
        error: error.message || '更新失败，请稍后重试'
      }
    }
  }

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      await authApi.changePassword({ oldPassword, newPassword })
      return { success: true }
    } catch (error: any) {
      console.error('Change password error:', error)
      return {
        success: false,
        error: error.message || '密码修改失败，请检查原密码'
      }
    }
  }

  const validateToken = async () => {
    if (!token.value) return false

    try {
      const response = await authApi.validateToken()
      if (response.valid && response.user) {
        user.value = response.user
        localStorage.setItem('userInfo', JSON.stringify(response.user))
        return true
      } else {
        logout()
        return false
      }
    } catch (error) {
      console.error('Token validation error:', error)
      logout()
      return false
    }
  }

  // 检查用户是否长时间未活动
  const checkInactivity = () => {
    const now = Date.now()
    const inactiveTime = now - lastActivity.value
    const maxInactiveTime = 30 * 60 * 1000 // 30分钟

    if (inactiveTime > maxInactiveTime && isAuthenticated.value) {
      console.log('用户长时间未活动，自动登出')
      logout()
    }
  }

  // 更新活动时间
  const updateActivity = () => {
    lastActivity.value = Date.now()
  }

  // 演示模式登录 - 用于测试
  const demoLogin = () => {
    const demoUser = {
      id: 'demo_001',
      email: 'demo@quant-navigator.com',
      name: '演示用户',
      role: 'admin',
      avatar: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const demoToken = 'demo_token_' + Date.now()

    user.value = demoUser
    token.value = demoToken
    lastActivity.value = Date.now()

    // 保存到本地存储
    localStorage.setItem('token', demoToken)
    localStorage.setItem('userRole', 'admin')
    localStorage.setItem('userInfo', JSON.stringify(demoUser))

    return { success: true }
  }

  // 初始化时检查本地存储的用户信息
  const initFromStorage = () => {
    const storedUserInfo = localStorage.getItem('userInfo')
    if (storedUserInfo && token.value) {
      try {
        user.value = JSON.parse(storedUserInfo)
      } catch (error) {
        console.error('Failed to parse stored user info:', error)
        logout()
      }
    }
  }

  return {
    user,
    token,
    isLoading,
    lastActivity,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    changePassword,
    validateToken,
    initializeUser,
    checkInactivity,
    updateActivity,
    initFromStorage,
    demoLogin,
  }
})

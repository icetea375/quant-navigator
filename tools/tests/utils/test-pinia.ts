/**
 * 统一的测试Pinia管理工具
 * 解决测试中Pinia实例管理混乱的问题
 * 
 * 注意：现在推荐使用 createTestWrapper 进行组件测试
 * 这个文件主要用于向后兼容和特殊场景
 */

import { createPinia, setActivePinia, type Pinia } from 'pinia'

let currentPinia: Pinia | null = null

/**
 * 创建新的测试Pinia实例
 * 每次调用都会创建全新的实例，确保测试隔离
 */
export const createTestPinia = (): Pinia => {
  // 清理之前的实例
  if (currentPinia) {
    resetTestPinia()
  }
  
  currentPinia = createPinia()
  setActivePinia(currentPinia)
  return currentPinia
}

/**
 * 重置当前测试Pinia实例
 * 清理所有store状态，但不销毁实例
 */
export const resetTestPinia = () => {
  if (currentPinia) {
    // 清理所有store状态
    currentPinia._s.forEach(store => {
      // 优先使用store的reset方法（如果存在）
      if (store.reset && typeof store.reset === 'function') {
        store.reset()
      } else if (store.$reset) {
        // 回退到Pinia的$reset方法
        store.$reset()
      }
    })
    
    // 清空状态
    if (currentPinia.state.value) {
      Object.keys(currentPinia.state.value).forEach(key => {
        currentPinia.state.value[key] = {}
      })
    }
  }
}

/**
 * 销毁当前测试Pinia实例
 * 完全清理实例，用于测试结束后的清理
 */
export const destroyTestPinia = () => {
  if (currentPinia) {
    resetTestPinia()
    currentPinia = null
  }
}

/**
 * 获取当前测试Pinia实例
 * 如果不存在则创建新的
 */
export const getTestPinia = (): Pinia => {
  if (!currentPinia) {
    return createTestPinia()
  }
  return currentPinia
}

/**
 * 检查是否有活跃的Pinia实例
 */
export const hasActivePinia = (): boolean => {
  return currentPinia !== null
}

/**
 * 创建测试组件的标准配置
 */
export const createTestMountOptions = (additionalOptions: any = {}) => {
  const pinia = getTestPinia()
  
  return {
    global: {
      plugins: [pinia],
      ...additionalOptions.global
    },
    ...additionalOptions
  }
}

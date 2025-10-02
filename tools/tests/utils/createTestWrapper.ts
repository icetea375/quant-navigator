/**
 * 统一的测试包装器 - "无菌手术室"核心
 * 
 * 这个函数是我们所有组件测试的唯一入口，确保：
 * 1. 统一的Vue应用实例配置
 * 2. 完整的插件注册（Router, Pinia, Element Plus）
 * 3. 测试隔离性保证
 * 4. 与生产环境最大程度同构
 */

import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import ElementPlus from 'element-plus'
import { vi } from 'vitest'
import type { Component } from 'vue'

// 创建统一的路由实例
const createTestRouter = (): Router => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        name: 'home',
        component: { template: '<div>Home</div>' }
      },
      {
        path: '/private',
        name: 'private',
        component: { template: '<div>Private</div>' },
        children: [
          {
            path: 'assistant',
            name: 'assistant',
            component: { template: '<div>My Assistant</div>' }
          },
          {
            path: 'stock-pool',
            name: 'stock-pool',
            component: { template: '<div>Stock Pool</div>' }
          },
          {
            path: 'settings',
            name: 'settings',
            component: { template: '<div>Settings</div>' }
          }
        ]
      },
      {
        path: '/login',
        name: 'login',
        component: { template: '<div>Login</div>' }
      },
      {
        path: '/register',
        name: 'register',
        component: { template: '<div>Register</div>' }
      }
    ]
  })
}

// 创建统一的Pinia实例
const createTestPinia = (): Pinia => {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

// 统一的Element Plus配置
const elementPlusConfig = {
  // 只保留必要的全局配置，其他由组件自己处理
  size: 'default' as const,
  zIndex: 2000
}

// 统一的全局stubs配置
const defaultStubs = {
  // 只stub真正需要简化的组件
  'router-link': { template: '<a><slot /></a>' },
  'router-view': { template: '<div class="router-view"><slot /></div>' },
  'transition': { template: '<div><slot /></div>' },
  'transition-group': { template: '<div><slot /></div>' },
  // 保留一些Element Plus图标的简化版本
  'el-icon': { template: '<i class="el-icon"><slot /></i>' }
}

// 统一的全局mocks配置
const defaultMocks = {
  $t: (key: string) => key,
  $tc: (key: string) => key,
  $te: (key: string) => true,
  $d: (value: unknown) => value,
  $n: (value: unknown) => value,
  // Element Plus消息
  $message: {
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    error: vi.fn()
  },
  // Element Plus通知
  $notify: {
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    error: vi.fn()
  },
  // Element Plus消息框
  $msgbox: {
    alert: vi.fn(),
    confirm: vi.fn(),
    prompt: vi.fn()
  },
  // Element Plus加载
  $loading: {
    service: vi.fn(() => ({
      close: vi.fn()
    }))
  }
}

/**
 * 创建测试包装器 - 无菌手术室入口
 * 
 * @param component 要测试的Vue组件
 * @param options 测试选项
 * @returns VueWrapper实例
 */
export function createTestWrapper<T = any>(
  component: Component,
  options: {
    props?: Record<string, any>
    slots?: Record<string, any>
    global?: {
      plugins?: any[]
      components?: Record<string, any>
      stubs?: Record<string, any>
      mocks?: Record<string, any>
      provide?: Record<string, any>
    }
    attachTo?: HTMLElement
    shallow?: boolean
  } = {}
): VueWrapper<T> {
  // 1. 创建全新的Pinia实例（确保测试隔离）
  const pinia = createTestPinia()
  
  // 2. 创建路由实例
  const router = createTestRouter()
  
  // 3. 合并全局配置
  const globalConfig = {
    plugins: [
      pinia,
      router,
      [ElementPlus, elementPlusConfig],
      ...(options.global?.plugins || [])
    ],
    components: {
      ...(options.global?.components || {})
    },
    stubs: {
      ...defaultStubs,
      ...(options.global?.stubs || {})
    },
    mocks: {
      ...defaultMocks,
      ...(options.global?.mocks || {})
    },
    provide: {
      ...(options.global?.provide || {})
    }
  }

  // 4. 创建wrapper
  const wrapper = mount(component, {
    global: globalConfig,
    props: options.props || {},
    slots: options.slots || {},
    attachTo: options.attachTo,
    shallow: options.shallow || false
  })

  // 5. 设置路由为当前路径（模拟真实环境）
  if (router) {
    router.push('/')
  }

  return wrapper
}

/**
 * 创建带特定路由的测试包装器
 * 
 * @param component 要测试的Vue组件
 * @param routePath 初始路由路径
 * @param options 测试选项
 * @returns VueWrapper实例
 */
export function createTestWrapperWithRoute<T = any>(
  component: Component,
  routePath: string = '/',
  options: Parameters<typeof createTestWrapper>[1] = {}
): VueWrapper<T> {
  const wrapper = createTestWrapper(component, options)
  
  // 设置路由路径
  if (wrapper.vm.$router) {
    wrapper.vm.$router.push(routePath)
  }
  
  return wrapper
}

/**
 * 创建带特定Pinia store的测试包装器
 * 
 * @param component 要测试的Vue组件
 * @param storeSetup store设置函数
 * @param options 测试选项
 * @returns VueWrapper实例
 */
export function createTestWrapperWithStore<T = any>(
  component: Component,
  storeSetup: (pinia: Pinia) => void,
  options: Parameters<typeof createTestWrapper>[1] = {}
): VueWrapper<T> {
  const wrapper = createTestWrapper(component, options)
  
  // 设置store
  const pinia = wrapper.vm.$pinia
  if (pinia && storeSetup) {
    storeSetup(pinia)
  }
  
  return wrapper
}

/**
 * 清理测试环境
 * 在测试结束后调用，确保环境干净
 */
export function cleanupTestEnvironment() {
  // 清理所有mocks
  vi.clearAllMocks()
  
  // 清理DOM
  document.body.innerHTML = ''
  
  // 清理localStorage和sessionStorage
  localStorage.clear()
  sessionStorage.clear()
}

// 导出类型
export type { Router, Pinia }
export { createTestRouter, createTestPinia }

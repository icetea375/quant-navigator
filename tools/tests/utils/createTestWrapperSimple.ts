/**
 * 简化的测试包装器 - "无菌手术室"核心（Vue Router支持版）
 * 
 * 这个版本包含完整的Vue Router支持，解决Layout组件的路由注入问题
 */

import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import ElementPlus from 'element-plus'
import { vi } from 'vitest'
import type { Component } from 'vue'
import { inject } from 'vue'

// Vue Router的injection keys - 使用与Vue Router 4.5.1匹配的Symbol keys
const routerKey = Symbol('router')
const routeLocationKey = Symbol('route location')

// 全局Vue Router mock - 必须在文件顶部定义
const mockRoute = {
  path: '/',
  name: 'home',
  params: {},
  query: {},
  hash: '',
  fullPath: '/',
  matched: [],
  meta: {}
}

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  resolve: vi.fn(),
  getRoutes: vi.fn(() => []),
  hasRoute: vi.fn(() => false),
  addRoute: vi.fn(),
  removeRoute: vi.fn(),
  beforeEach: vi.fn(),
  beforeResolve: vi.fn(),
  afterEach: vi.fn(),
  onError: vi.fn(),
  isReady: vi.fn(() => Promise.resolve()),
  currentRoute: { value: mockRoute }
}

// 全局mock Vue Router的composables
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => mockRoute),
  useRouter: vi.fn(() => mockRouter),
  createRouter: vi.fn(() => mockRouter),
  createMemoryHistory: vi.fn(() => ({})),
  createWebHistory: vi.fn(() => ({})),
  // 导出Symbol keys
  routerKey: routerKey,
  routeLocationKey: routeLocationKey
}))

// 创建统一的Pinia实例
const createTestPinia = (): Pinia => {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

// 统一的Element Plus配置
const elementPlusConfig = {
  size: 'default' as const,
  zIndex: 2000
}

// 统一的全局stubs配置
const defaultStubs = {
  'router-link': { template: '<a><slot /></a>' },
  'router-view': { template: '<div class="router-view"><slot /></div>' },
  'transition': { template: '<div><slot /></div>' },
  'transition-group': { template: '<div><slot /></div>' },
  'el-icon': { template: '<i class="el-icon"><slot /></i>' },
  // 特殊处理Element Plus的Tooltip相关组件，避免Teleport问题
  'el-tooltip': { template: '<div class="el-tooltip"><slot /></div>' },
  'el-popper': { template: '<div class="el-popper"><slot /></div>' },
  'el-tooltip-content': { template: '<div class="el-tooltip-content"><slot /></div>' },
  'el-select-dropdown': { template: '<div class="el-select-dropdown"><slot /></div>' },
  // Element Plus菜单组件stubs
  'el-menu': { 
    template: '<div class="el-menu"><slot /></div>',
    provide() {
      return {
        rootMenu: {
          props: {},
          addMenuItem: () => {},
          removeMenuItem: () => {},
          openMenu: () => {},
          closeMenu: () => {}
        }
      }
    }
  },
  'el-menu-item': { template: '<div class="el-menu-item"><slot /></div>' },
  'el-submenu': { template: '<div class="el-submenu"><slot /></div>' },
  // Element Plus对话框组件stubs
  'el-dialog': { template: '<div class="el-dialog" v-if="modelValue"><slot /></div>', props: ['modelValue'] },
  // Element Plus下拉菜单组件stubs
  'el-dropdown': { template: '<div class="el-dropdown"><slot /></div>' },
  'el-dropdown-menu': { template: '<div class="el-dropdown-menu"><slot /></div>' },
  'el-dropdown-item': { template: '<div class="el-dropdown-item"><slot /></div>' }
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
      close: vi.fn(),
      setText: vi.fn(),
      setSpinner: vi.fn(),
      setBackgroundColor: vi.fn(),
      setCustomClass: vi.fn(),
      setTarget: vi.fn(),
      setBody: vi.fn(),
      setLock: vi.fn()
    }))
  },
  // 路由mock
  $route: mockRoute,
  $router: mockRouter
}

let currentPinia: Pinia | null = null

/**
 * 创建测试包装器 - 无菌手术室入口（Vue Router支持版）
 * 
 * @param component 要测试的Vue组件
 * @param options Vue Test Utils的mount选项
 * @returns VueWrapper实例
 */
export function createTestWrapper<T extends Component>(
  component: T,
  options: {
    props?: Record<string, any>
    attrs?: Record<string, any>
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
  currentPinia = createTestPinia()
  
  // 2. 合并全局配置
  const globalConfig = {
    plugins: [
      currentPinia,
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
      // 提供Vue Router的依赖注入 - 使用正确的Symbol keys
      [routerKey]: mockRouter,
      [routeLocationKey]: mockRoute,
      // 也提供$route和$router作为备用
      $route: mockRoute,
      $router: mockRouter,
      ...(options.global?.provide || {})
    }
  }

  // 3. 创建wrapper
  const wrapper = mount(component, {
    global: globalConfig,
    props: options.props || {},
    attrs: options.attrs || {},
    slots: options.slots || {},
    attachTo: options.attachTo,
    shallow: options.shallow,
  });

  return wrapper;
}

/**
 * 创建带有特定路由的测试包装器
 * 
 * @param component 要测试的Vue组件
 * @param initialRoute 初始路由路径
 * @param options Vue Test Utils的mount选项
 * @returns VueWrapper实例
 */
export function createTestWrapperWithRoute<T extends Component>(
  component: T,
  initialRoute: string,
  options: Parameters<typeof createTestWrapper>[1] = {}
): VueWrapper<T> {
  // 每次调用都重置路由mock
  mockRoute.path = initialRoute;
  mockRouter.currentRoute.value = { ...mockRoute }; // 更新currentRoute的值

  // 合并路由mock到全局mocks
  const mergedOptions = {
    ...options,
    global: {
      ...options.global,
      mocks: {
        ...defaultMocks,
        ...options.global?.mocks,
        $route: mockRoute,
        $router: mockRouter,
      },
      provide: {
        ...options.global?.provide,
        $route: mockRoute,
        $router: mockRouter,
      }
    },
  };

  return createTestWrapper(component, mergedOptions);
}

// 重置Pinia store的辅助函数
const resetPiniaStore = (piniaInstance: Pinia) => {
  piniaInstance._s.forEach(store => {
    if (store.reset && typeof store.reset === 'function') {
      store.reset();
    } else if (store.$reset) {
      store.$reset();
    }
  });
  if (piniaInstance.state.value) {
    Object.keys(piniaInstance.state.value).forEach(key => {
      piniaInstance.state.value[key] = {};
    });
  }
};

export function cleanupTestEnvironment() {
  vi.clearAllMocks();
  if (currentPinia) {
    resetPiniaStore(currentPinia);
    currentPinia = null; // 确保下次创建新的Pinia实例
  }
  // 重置路由mock的状态
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRoute.path = '/';
  mockRouter.currentRoute.value = { ...mockRoute };
}

// 导出路由mock和Symbol keys供测试使用
export { mockRoute, mockRouter, routerKey, routeLocationKey }
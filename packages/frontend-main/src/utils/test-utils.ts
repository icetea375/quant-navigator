// 测试工具函数
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import type { App } from 'vue'

// 测试路由
const createTestRouter = () => {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/login', component: { template: '<div>Login</div>' } },
      { path: '/market-radar', component: { template: '<div>Market Radar</div>' } },
      { path: '/private', component: { template: '<div>Private</div>' } },
      { path: '/admin', component: { template: '<div>Admin</div>' } },
    ],
  })
}

// 测试Pinia store
const createTestPinia = () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

// 全局测试配置
export const createTestApp = () => {
  const app = {
    use: vi.fn(),
    mount: vi.fn(),
  } as unknown as App

  return app
}

// 测试包装器工厂
export const createTestWrapper = (component: any, options: any = {}) => {
  const router = createTestRouter()
  const pinia = createTestPinia()

  const defaultOptions = {
    global: {
      plugins: [router, pinia, ElementPlus],
      stubs: {
        'router-link': true,
        'router-view': true,
      },
    },
  }

  return mount(component, { ...defaultOptions, ...options })
}

// 模拟API响应
export const mockApiResponse = <T>(data: T, success = true) => ({
  success,
  data,
  message: success ? 'Success' : 'Error',
  timestamp: new Date().toISOString(),
})

// 模拟API错误
export const mockApiError = (code = 'TEST_ERROR', message = 'Test error') => ({
  success: false,
  error: {
    code,
    message,
  },
})

// 模拟用户数据
export const mockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  role: 'user' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// 模拟市场数据
export const mockMarketData = {
  briefing: {
    title: '今日市场快报',
    content: '市场整体表现平稳，科技股领涨。',
    publish_time: new Date().toISOString(),
  },
  hotspots: [
    {
      hotspot_name: '新能源板块',
      summary: '政策利好推动新能源板块上涨',
      snapshots: [
        {
          timestamp: new Date().toISOString(),
          change_pct: 3.2,
          volume: 1000000,
          attribution: '政策利好 + 资金流入',
        },
      ],
    },
  ],
}

// 模拟股票池数据
export const mockStockPools = [
  {
    id: '1',
    name: '我的股票池',
    item_count: 2,
    items: [
      { id: '1', code: '000001', name: '平安银行', type: 'stock' },
      { id: '2', code: '000002', name: '万科A', type: 'stock' },
    ],
  },
]

// 模拟系统状态
export const mockSystemStatus = {
  data_pipeline_status: 'running' as const,
  llm_service_health: 'healthy' as const,
  db_connection: 'connected' as const,
  last_update: new Date().toISOString(),
  error_count: 0,
  warning_count: 2,
}

// 等待异步操作
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 等待Vue更新
export const waitForVueUpdate = async (wrapper: VueWrapper) => {
  await wrapper.vm.$nextTick()
  await waitFor(0)
}

// 模拟localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
  }
}

// 模拟fetch
export const mockFetch = (response: any, ok = true) => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    } as Response)
  )
}

// 模拟Element Plus组件
export const mockElementPlusComponents = () => {
  return {
    'el-button': { template: '<button><slot /></button>' },
    'el-input': { template: '<input v-model="modelValue" />' },
    'el-form': { template: '<form><slot /></form>' },
    'el-form-item': { template: '<div><slot /></div>' },
    'el-card': { template: '<div class="el-card"><slot /></div>' },
    'el-table': {
      template: '<table><slot /></table>',
      props: ['data', 'columns']
    },
    'el-table-column': {
      template: '<td><slot :row="{}" /></td>',
      props: ['prop', 'label', 'width']
    },
    'el-pagination': { template: '<div class="el-pagination"></div>' },
    'el-loading': { template: '<div v-if="loading">Loading...</div>' },
    'el-message': { template: '<div></div>' },
    'el-dialog': { template: '<div v-if="visible"><slot /></div>' },
    'el-empty': {
      template: '<div class="el-empty"><slot>{{ description }}</slot></div>',
      props: ['description']
    },
    'el-alert': {
      template: '<div class="el-alert" :class="type"><slot>{{ title }}</slot></div>',
      props: ['type', 'title', 'show-icon', 'closable']
    },
    'el-statistic': {
      template: '<div class="el-statistic"><div class="el-statistic__title">{{ title }}</div><div class="el-statistic__content">{{ value }}{{ suffix }}</div></div>',
      props: ['title', 'value', 'suffix', 'precision']
    },
  }
}

// 测试数据生成器
export const testDataGenerator = {
  // 生成随机字符串
  randomString: (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  // 生成随机数字
  randomNumber: (min = 0, max = 100) => {
    return Math.floor(Math.random() * (max - min + 1)) + min
  },

  // 生成随机日期
  randomDate: (start = new Date(2020, 0, 1), end = new Date()) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  },

  // 生成随机邮箱
  randomEmail: () => {
    return `${testDataGenerator.randomString(8)}@${testDataGenerator.randomString(5)}.com`
  },

  // 生成随机股票代码
  randomStockCode: () => {
    const prefix = testDataGenerator.randomNumber(0, 9).toString()
    const suffix = testDataGenerator.randomNumber(100000, 999999).toString()
    return prefix + suffix
  },
}

// 测试断言工具
export const testAssertions = {
  // 检查组件是否渲染
  isRendered: (wrapper: VueWrapper, selector: string) => {
    return wrapper.find(selector).exists()
  },

  // 检查文本内容
  hasText: (wrapper: VueWrapper, text: string) => {
    return wrapper.text().includes(text)
  },

  // 检查类名
  hasClass: (wrapper: VueWrapper, className: string) => {
    return wrapper.classes().includes(className)
  },

  // 检查属性
  hasAttribute: (wrapper: VueWrapper, attribute: string, value?: string) => {
    const element = wrapper.element as HTMLElement
    if (value) {
      return element.getAttribute(attribute) === value
    }
    return element.hasAttribute(attribute)
  },

  // 检查事件是否触发
  hasEmitted: (wrapper: VueWrapper, event: string) => {
    return wrapper.emitted(event)
  },
}

// 测试环境设置
export const setupTestEnvironment = () => {
  // 设置全局测试变量
  global.vi = global.vi || {}

  // 模拟console方法
  global.console = {
    ...console,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }

  // 模拟localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage(),
    writable: true,
  })

  // 模拟sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: mockLocalStorage(),
    writable: true,
  })

  // 模拟IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // 模拟ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
}

// 清理测试环境
export const cleanupTestEnvironment = () => {
  // 清理DOM
  document.body.innerHTML = ''

  // 清理localStorage
  localStorage.clear()

  // 清理sessionStorage
  sessionStorage.clear()

  // 重置所有mock
  vi.clearAllMocks()
}

// 测试套件工具
export const testSuite = {
  // 创建测试套件
  create: (name: string, tests: () => void) => {
    describe(name, () => {
      beforeEach(() => {
        setupTestEnvironment()
      })

      afterEach(() => {
        cleanupTestEnvironment()
      })

      tests()
    })
  },

  // 创建异步测试套件
  createAsync: (name: string, tests: () => Promise<void>) => {
    describe(name, () => {
      beforeEach(async () => {
        setupTestEnvironment()
      })

      afterEach(async () => {
        cleanupTestEnvironment()
      })

      tests()
    })
  },
}

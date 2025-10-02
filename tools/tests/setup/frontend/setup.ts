// 测试环境设置
import { config } from '@vue/test-utils'
import { vi } from 'vitest'
// import { createPinia } from 'pinia' // 不再需要，使用独立的测试实例
// 导入测试工具
import { setupTestEnvironment } from '../../../../tools/scripts/test-utils'

// 设置测试环境
setupTestEnvironment()

// 修复Vue Router在测试环境中的问题
// 模拟history.state，解决Cannot read properties of undefined (reading 'state')错误
Object.defineProperty(window, 'history', {
  value: {
    ...window.history,
    state: {},
    pushState: vi.fn(),
    replaceState: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn()
  },
  writable: true
})

// 修复VueUse兼容性问题 - 模拟IntersectionObserver
// 浏览器环境兼容性
const globalObj = typeof global !== 'undefined' ? global : window

window.IntersectionObserver = vi.fn().mockImplementation((callback, options = {}) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: options.root || null,
  rootMargin: options.rootMargin || '0px',
  thresholds: options.thresholds || [0],
}))

// 模拟ResizeObserver
window.ResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// 模拟MutationObserver
window.MutationObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
}))

// 模拟PerformanceObserver
window.PerformanceObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
}))

// 模拟Web Animations API
window.Animation = vi.fn().mockImplementation(() => ({
  play: vi.fn(),
  pause: vi.fn(),
  cancel: vi.fn(),
  finish: vi.fn(),
  reverse: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

// 模拟requestIdleCallback
window.requestIdleCallback = vi.fn((callback) => {
  return setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 50 }), 0)
})

window.cancelIdleCallback = vi.fn((id) => {
  clearTimeout(id)
})

// 模拟IntersectionObserverEntry
window.IntersectionObserverEntry = class IntersectionObserverEntry {
  constructor(public target: Element, public isIntersecting: boolean) {}
  get boundingClientRect() { return { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 } }
  get intersectionRect() { return { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 } }
  get rootBounds() { return { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 } }
  get intersectionRatio() { return 0 }
  get time() { return 0 }
}

// 模拟window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// 模拟window.getComputedStyle（遵循测试宪法第6条：只模拟外部边界）
Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: vi.fn(() => ({
    getPropertyValue: vi.fn((prop: string) => {
      // 为 Element Plus Loading 服务提供必要的样式值
      if (prop === 'z-index') return '9999'
      if (prop === 'position') return 'fixed'
      if (prop === 'display') return 'block'
      return ''
    }),
    setProperty: vi.fn(),
    removeProperty: vi.fn()
  })),
})

// 模拟document.documentElement
Object.defineProperty(document, 'documentElement', {
  value: {
    clientWidth: 1024,
    clientHeight: 768,
    scrollTop: 0,
    scrollLeft: 0,
  },
})

// 模拟document.head（vue-echarts需要）
Object.defineProperty(document, 'head', {
  value: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    insertBefore: vi.fn(),
    insertAdjacentElement: vi.fn((position: string, element: any) => {
      // 模拟insertAdjacentElement方法，确保参数类型正确
      if (element && typeof element === 'object') {
        return true
      }
      return false
    }),
    insertAdjacentHTML: vi.fn(),
    insertAdjacentText: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    getElementsByTagName: vi.fn(() => []),
    getElementsByClassName: vi.fn(() => []),
    getElementById: vi.fn(),
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    hasAttribute: vi.fn(() => false),
    style: {},
    nodeType: 1,
    nodeName: 'HEAD',
    parentNode: document.documentElement,
    childNodes: [],
    firstChild: null,
    lastChild: null,
    nextSibling: null,
    previousSibling: null,
    ownerDocument: document
  },
})

// 遵循测试宪法第6条：只模拟外部边界，不模拟内部逻辑
// 让jsdom提供完整的DOM实现，我们只添加必要的Canvas支持

// 模拟document.body（Element Plus Loading 服务需要）
Object.defineProperty(document, 'body', {
  value: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    insertBefore: vi.fn(),
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    style: {
      position: 'relative',
      zIndex: '1',
      overflow: 'visible',
      marginTop: '0px',
      marginLeft: '0px',
      marginRight: '0px',
      marginBottom: '0px'
    },
    getBoundingClientRect: vi.fn(() => ({
      top: 0,
      left: 0,
      bottom: 768,
      right: 1024,
      width: 1024,
      height: 768
    })),
    scrollTop: 0,
    scrollLeft: 0,
    scrollHeight: 768,
    scrollWidth: 1024
  },
})

// 不模拟vue-echarts和echarts库（遵循测试宪法第6条：不模拟内部逻辑）
// 让这些组件正常工作，只模拟它们依赖的外部边界（DOM API）

// 模拟DOM尺寸API（ECharts需要）
Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  value: 800,
  writable: true
})
Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
  value: 600,
  writable: true
})
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  value: 800,
  writable: true
})
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  value: 600,
  writable: true
})
Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  value: vi.fn(() => ({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
    x: 0,
    y: 0
  }))
})

// 注意：不再使用全局Pinia实例
// 每个测试文件应该使用 createTestPinia() 创建独立的实例
// 这样可以确保测试隔离性

// 全局配置
config.window.stubs = {
  'router-link': true,
  'router-view': true,
  'transition': true,
  'transition-group': true,
}

// 导出测试桩供测试文件使用
export const defaultStubs = {
  // 路由相关
  'router-link': { template: '<a><slot /></a>' },
  'router-view': { template: '<div class="router-view"><slot /></div>' },
  
  // 过渡动画
  'transition': { template: '<div><slot /></div>' },
  'transition-group': { template: '<div><slot /></div>' },
  
  // Element Plus 基础组件
  'el-button': { template: '<button><slot /></button>' },
  'el-input': { template: '<input v-model="modelValue" />' },
  'el-form': { template: '<form><slot /></form>' },
  'el-form-item': { template: '<div><slot /></div>' },
  'el-card': { template: '<div class="el-card"><slot /></div>' },
  'el-table': { template: '<table><slot /></table>' },
  'el-pagination': { template: '<div class="el-pagination"></div>' },
  'el-loading': { template: '<div v-if="loading">Loading...</div>' },
  'el-message': { template: '<div></div>' },
  'el-dialog': { template: '<div v-if="visible"><slot /></div>' },
  'el-icon': { template: '<i><slot /></i>' },
  'el-tooltip': { template: '<div><slot /></div>' },
  'el-popover': { template: '<div><slot /></div>' },
  'el-dropdown': { template: '<div><slot /></div>' },
  'el-menu': { template: '<div><slot /></div>' },
  'el-menu-item': { template: '<div><slot /></div>' },
  'el-submenu': { template: '<div><slot /></div>' },
  'el-breadcrumb': { template: '<div><slot /></div>' },
  'el-breadcrumb-item': { template: '<span><slot /></span>' },
  'el-tabs': { template: '<div><slot /></div>' },
  'el-tab-pane': { template: '<div><slot /></div>' },
  'el-collapse': { template: '<div><slot /></div>' },
  'el-collapse-item': { template: '<div><slot /></div>' },
  'el-accordion': { template: '<div><slot /></div>' },
  'el-accordion-item': { template: '<div><slot /></div>' },
  'el-timeline': { template: '<div><slot /></div>' },
  'el-timeline-item': { template: '<div><slot /></div>' },
  'el-steps': { template: '<div><slot /></div>' },
  'el-step': { template: '<div><slot /></div>' },
  'el-progress': { template: '<div><slot /></div>' },
  'el-badge': { template: '<div><slot /></div>' },
  'el-avatar': { template: '<div><slot /></div>' },
  'el-empty': { template: '<div><slot /></div>' },
  'el-result': { template: '<div><slot /></div>' },
  'el-skeleton': { template: '<div><slot /></div>' },
  'el-skeleton-item': { template: '<div><slot /></div>' },
  'el-backtop': { template: '<div><slot /></div>' },
  'el-affix': { template: '<div><slot /></div>' },
  'el-anchor': { template: '<div><slot /></div>' },
  'el-anchor-link': { template: '<div><slot /></div>' },
  'el-page-header': { template: '<div><slot /></div>' },
  'el-divider': { template: '<div><slot /></div>' },
  'el-space': { template: '<div><slot /></div>' },
  'el-row': { template: '<div><slot /></div>' },
  'el-col': { template: '<div><slot /></div>' },
  'el-container': { template: '<div><slot /></div>' },
  'el-header': { template: '<div><slot /></div>' },
  'el-aside': { template: '<div><slot /></div>' },
  'el-main': { template: '<div><slot /></div>' },
  'el-footer': { template: '<div><slot /></div>' },
  'el-scrollbar': { template: '<div><slot /></div>' },
  'el-watermark': { template: '<div><slot /></div>' },
  'el-calendar': { template: '<div><slot /></div>' },
  'el-date-picker': { template: '<input />' },
  'el-time-picker': { template: '<input />' },
  'el-time-select': { template: '<select><slot /></select>' },
  'el-color-picker': { template: '<input />' },
  'el-transfer': { template: '<div><slot /></div>' },
  'el-tree': { template: '<div><slot /></div>' },
  'el-tree-select': { template: '<select><slot /></select>' },
  'el-cascader': { template: '<select><slot /></select>' },
  'el-select': { template: '<select><slot /></select>' },
  'el-option': { template: '<option><slot /></option>' },
  'el-option-group': { template: '<optgroup><slot /></optgroup>' },
  'el-checkbox': { template: '<input type="checkbox" />' },
  'el-checkbox-group': { template: '<div><slot /></div>' },
  'el-radio': { template: '<input type="radio" />' },
  'el-radio-group': { template: '<div><slot /></div>' },
  'el-radio-button': { template: '<button><slot /></button>' },
  'el-switch': { template: '<input type="checkbox" />' },
  'el-slider': { template: '<input type="range" />' },
  'el-rate': { template: '<div><slot /></div>' },
  'el-upload': { template: '<div><slot /></div>' },
  'el-upload-dragger': { template: '<div><slot /></div>' },
  'el-upload-list': { template: '<div><slot /></div>' },
  'el-upload-list-item': { template: '<div><slot /></div>' },
  'el-image': { template: '<img />' },
  'el-image-viewer': { template: '<div><slot /></div>' },
  'el-carousel': { template: '<div><slot /></div>' },
  'el-carousel-item': { template: '<div><slot /></div>' },
  'el-drawer': { template: '<div v-if="visible"><slot /></div>' },
  'el-popconfirm': { template: '<div><slot /></div>' },
  'el-alert': { template: '<div><slot /></div>' },
  'el-notification': { template: '<div><slot /></div>' },
  'el-message-box': { template: '<div><slot /></div>' },
  'el-loading-directive': { template: '<div><slot /></div>' },
  
  // 自定义组件
  'ArbitrationDashboard': { template: '<div data-testid="arbitration-dashboard"><slot /></div>' },
  'ArbitrationToolbar': { template: '<div data-testid="arbitration-toolbar"><slot /></div>' },
  'ArbitrationCaseList': { template: '<div data-testid="arbitration-case-list"><slot /></div>' },
  'DataPanelContainer': { template: '<div data-testid="data-panel-container"><slot /></div>' },
  'RawTextExplorer': { template: '<div data-testid="raw-text-explorer"><slot /></div>' },
  'FinancialSnapshot': { template: '<div data-testid="financial-snapshot"><slot /></div>' },
  'QuantSignalDashboard': { template: '<div data-testid="quant-signal-dashboard"><slot /></div>' },
  'FlowAndChipsViewer': { template: '<div data-testid="flow-and-chips-viewer"><slot /></div>' },
  'PersonalPrecedentViewer': { template: '<div data-testid="personal-precedent-viewer"><slot /></div>' },
  'ArbitrationDecisionDialog': { template: '<div data-testid="arbitration-decision-dialog"><slot /></div>' },
}

// 模拟Element Plus
config.window.components = {
  'el-button': { template: '<button><slot /></button>' },
  'el-input': { template: '<input v-model="modelValue" />' },
  'el-form': { template: '<form><slot /></form>' },
  'el-form-item': { template: '<div><slot /></div>' },
  'el-card': { template: '<div class="el-card"><slot /></div>' },
  'el-table': { template: '<table><slot /></table>' },
  'el-pagination': { template: '<div class="el-pagination"></div>' },
  'el-loading': { template: '<div v-if="loading">Loading...</div>' },
  'el-message': { template: '<div></div>' },
  'el-dialog': { template: '<div v-if="visible"><slot /></div>' },
  'el-icon': { template: '<i><slot /></i>' },
  'el-tooltip': { template: '<div><slot /></div>' },
  'el-popover': { template: '<div><slot /></div>' },
  'el-dropdown': { template: '<div><slot /></div>' },
  'el-menu': { template: '<div><slot /></div>' },
  'el-menu-item': { template: '<div><slot /></div>' },
  'el-submenu': { template: '<div><slot /></div>' },
  'el-breadcrumb': { template: '<div><slot /></div>' },
  'el-breadcrumb-item': { template: '<span><slot /></span>' },
  'el-tabs': { template: '<div><slot /></div>' },
  'el-tab-pane': { template: '<div><slot /></div>' },
  'el-collapse': { template: '<div><slot /></div>' },
  'el-collapse-item': { template: '<div><slot /></div>' },
  'el-accordion': { template: '<div><slot /></div>' },
  'el-accordion-item': { template: '<div><slot /></div>' },
  'el-timeline': { template: '<div><slot /></div>' },
  'el-timeline-item': { template: '<div><slot /></div>' },
  'el-steps': { template: '<div><slot /></div>' },
  'el-step': { template: '<div><slot /></div>' },
  'el-progress': { template: '<div><slot /></div>' },
  'el-badge': { template: '<div><slot /></div>' },
  'el-avatar': { template: '<div><slot /></div>' },
  'el-empty': { template: '<div><slot /></div>' },
  'el-result': { template: '<div><slot /></div>' },
  'el-skeleton': { template: '<div><slot /></div>' },
  'el-skeleton-item': { template: '<div><slot /></div>' },
  'el-backtop': { template: '<div><slot /></div>' },
  'el-affix': { template: '<div><slot /></div>' },
  'el-anchor': { template: '<div><slot /></div>' },
  'el-anchor-link': { template: '<div><slot /></div>' },
  'el-page-header': { template: '<div><slot /></div>' },
  'el-divider': { template: '<div><slot /></div>' },
  'el-space': { template: '<div><slot /></div>' },
  'el-row': { template: '<div><slot /></div>' },
  'el-col': { template: '<div><slot /></div>' },
  'el-container': { template: '<div><slot /></div>' },
  'el-header': { template: '<div><slot /></div>' },
  'el-aside': { template: '<div><slot /></div>' },
  'el-main': { template: '<div><slot /></div>' },
  'el-footer': { template: '<div><slot /></div>' },
  'el-scrollbar': { template: '<div><slot /></div>' },
  'el-watermark': { template: '<div><slot /></div>' },
  'el-calendar': { template: '<div><slot /></div>' },
  'el-date-picker': { template: '<input />' },
  'el-time-picker': { template: '<input />' },
  'el-time-select': { template: '<select><slot /></select>' },
  'el-color-picker': { template: '<input />' },
  'el-transfer': { template: '<div><slot /></div>' },
  'el-tree': { template: '<div><slot /></div>' },
  'el-tree-select': { template: '<select><slot /></select>' },
  'el-cascader': { template: '<select><slot /></select>' },
  'el-select': { template: '<select><slot /></select>' },
  'el-option': { template: '<option><slot /></option>' },
  'el-option-group': { template: '<optgroup><slot /></optgroup>' },
  'el-checkbox': { template: '<input type="checkbox" />' },
  'el-checkbox-group': { template: '<div><slot /></div>' },
  'el-radio': { template: '<input type="radio" />' },
  'el-radio-group': { template: '<div><slot /></div>' },
  'el-radio-button': { template: '<button><slot /></button>' },
  'el-switch': { template: '<input type="checkbox" />' },
  'el-slider': { template: '<input type="range" />' },
  'el-rate': { template: '<div><slot /></div>' },
  'el-upload': { template: '<div><slot /></div>' },
  'el-upload-dragger': { template: '<div><slot /></div>' },
  'el-upload-list': { template: '<div><slot /></div>' },
  'el-upload-list-item': { template: '<div><slot /></div>' },
  'el-image': { template: '<img />' },
  'el-image-viewer': { template: '<div><slot /></div>' },
  'el-carousel': { template: '<div><slot /></div>' },
  'el-carousel-item': { template: '<div><slot /></div>' },
  'el-drawer': { template: '<div v-if="visible"><slot /></div>' },
  'el-popconfirm': { template: '<div><slot /></div>' },
  'el-alert': { template: '<div><slot /></div>' },
  'el-notification': { template: '<div><slot /></div>' },
  'el-message-box': { template: '<div><slot /></div>' },
  'el-loading-directive': { template: '<div><slot /></div>' },
}

// 模拟全局属性
config.window.mocks = {
  $t: (key: string) => key,
  $tc: (key: string) => key,
  $te: (key: string) => true,
  $d: (value: unknown) => value,
  $n: (value: unknown) => value,
}

// 模拟路由
config.window.mocks.$route = {
  path: '/',
  name: 'home',
  params: {},
  query: {},
  hash: '',
  fullPath: '/',
  matched: [],
  meta: {},
}

config.window.mocks.$router = {
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
}

// 模拟Element Plus消息
config.window.mocks.$message = {
  success: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
}

// 模拟Element Plus通知
config.window.mocks.$notify = {
  success: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
}

// 模拟Element Plus消息框
config.window.mocks.$msgbox = {
  alert: vi.fn(),
  confirm: vi.fn(),
  prompt: vi.fn(),
}

// 模拟Element Plus加载
config.window.mocks.$loading = {
  service: vi.fn(() => ({
    close: vi.fn(),
  })),
}

// 模拟 Element Plus Loading 服务（遵循测试宪法第6条：只模拟外部边界）
const mockLoadingService = vi.fn(() => ({
  close: vi.fn(),
  setText: vi.fn(),
  setSpinner: vi.fn(),
  setBackgroundColor: vi.fn(),
  setCustomClass: vi.fn(),
  setTarget: vi.fn(),
  setBody: vi.fn(),
  setLock: vi.fn(),
  // 模拟 Element Plus Loading 服务需要的内部结构
  vm: {
    zIndex: {
      nextZIndex: vi.fn(() => 9999)
    },
    _: {
      exposed: {
        zIndex: {
          nextZIndex: vi.fn(() => 9999)
        }
      }
    }
  },
  originalPosition: { value: 'static' },
  originalOverflow: { value: 'visible' },
  $el: {
    style: {}
  }
}))

// 模拟 ElLoading
window.ElLoading = {
  service: mockLoadingService
}

// 模拟 HTTP 请求（遵循测试宪法第6条：只模拟外部边界）
// 直接模拟整个 HTTP 服务以避免 Element Plus Loading 服务调用
vi.mock('@/services/http', () => ({
  request: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} }))
  }
}))

// 模拟 axios 以避免真实网络请求
window.axios = {
  create: vi.fn(() => ({
    request: vi.fn(() => Promise.resolve({ data: {} })),
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() }
    }
  })),
  defaults: {
    baseURL: '',
    timeout: 5000,
    headers: {}
  }
}

// 模拟 XMLHttpRequest（jsdom 环境需要）
window.XMLHttpRequest = vi.fn(() => ({
  open: vi.fn(),
  send: vi.fn(),
  setRequestHeader: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 4,
  status: 200,
  responseText: '{}',
  response: '{}'
}))

// 模拟Element Plus弹窗
config.window.mocks.$popover = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus工具提示
config.window.mocks.$tooltip = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus下拉菜单
config.window.mocks.$dropdown = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus菜单
config.window.mocks.$menu = {
  open: vi.fn(),
  close: vi.fn(),
}

// 模拟Element Plus面包屑
config.window.mocks.$breadcrumb = {
  add: vi.fn(),
  remove: vi.fn(),
}

// 模拟Element Plus标签页
config.window.mocks.$tabs = {
  add: vi.fn(),
  remove: vi.fn(),
}

// 模拟Element Plus折叠面板
config.window.mocks.$collapse = {
  open: vi.fn(),
  close: vi.fn(),
}

// 模拟Element Plus手风琴
config.window.mocks.$accordion = {
  open: vi.fn(),
  close: vi.fn(),
}

// 模拟Element Plus时间线
config.window.mocks.$timeline = {
  add: vi.fn(),
  remove: vi.fn(),
}

// 模拟Element Plus步骤条
config.window.mocks.$steps = {
  next: vi.fn(),
  prev: vi.fn(),
  goTo: vi.fn(),
}

// 模拟Element Plus进度条
config.window.mocks.$progress = {
  start: vi.fn(),
  finish: vi.fn(),
}

// 模拟Element Plus徽章
config.window.mocks.$badge = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus头像
config.window.mocks.$avatar = {
  load: vi.fn(),
  error: vi.fn(),
}

// 模拟Element Plus空状态
config.window.mocks.$empty = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus结果页
config.window.mocks.$result = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus骨架屏
config.window.mocks.$skeleton = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus回到顶部
config.window.mocks.$backtop = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus固钉
config.window.mocks.$affix = {
  update: vi.fn(),
}

// 模拟Element Plus锚点
config.window.mocks.$anchor = {
  scrollTo: vi.fn(),
}

// 模拟Element Plus锚点链接
config.window.mocks.$anchorLink = {
  scrollTo: vi.fn(),
}

// 模拟Element Plus页面头部
config.window.mocks.$pageHeader = {
  goBack: vi.fn(),
}

// 模拟Element Plus分割线
config.window.mocks.$divider = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus间距
config.window.mocks.$space = {
  update: vi.fn(),
}

// 模拟Element Plus行
config.window.mocks.$row = {
  update: vi.fn(),
}

// 模拟Element Plus列
config.window.mocks.$col = {
  update: vi.fn(),
}

// 模拟Element Plus容器
config.window.mocks.$container = {
  update: vi.fn(),
}

// 模拟Element Plus头部
config.window.mocks.$header = {
  update: vi.fn(),
}

// 模拟Element Plus侧边栏
config.window.mocks.$aside = {
  update: vi.fn(),
}

// 模拟Element Plus主体
config.window.mocks.$main = {
  update: vi.fn(),
}

// 模拟Element Plus底部
config.window.mocks.$footer = {
  update: vi.fn(),
}

// 模拟Element Plus滚动条
config.window.mocks.$scrollbar = {
  update: vi.fn(),
}

// 模拟Element Plus水印
config.window.mocks.$watermark = {
  update: vi.fn(),
}

// 模拟Element Plus日历
config.window.mocks.$calendar = {
  update: vi.fn(),
}

// 模拟Element Plus日期选择器
config.window.mocks.$datePicker = {
  focus: vi.fn(),
  blur: vi.fn(),
}

// 模拟Element Plus时间选择器
config.window.mocks.$timePicker = {
  focus: vi.fn(),
  blur: vi.fn(),
}

// 模拟Element Plus时间选择
config.window.mocks.$timeSelect = {
  focus: vi.fn(),
  blur: vi.fn(),
}

// 模拟Element Plus颜色选择器
config.window.mocks.$colorPicker = {
  focus: vi.fn(),
  blur: vi.fn(),
}

// 模拟Element Plus穿梭框
config.window.mocks.$transfer = {
  update: vi.fn(),
}

// 模拟Element Plus树
config.window.mocks.$tree = {
  update: vi.fn(),
}

// 模拟Element Plus树选择器
config.window.mocks.$treeSelect = {
  focus: vi.fn(),
  blur: vi.fn(),
}

// 模拟Element Plus级联选择器
config.window.mocks.$cascader = {
  focus: vi.fn(),
  blur: vi.fn(),
}

// 模拟Element Plus选择器
config.window.mocks.$select = {
  focus: vi.fn(),
  blur: vi.fn(),
}

// 模拟Element Plus选项
config.window.mocks.$option = {
  update: vi.fn(),
}

// 模拟Element Plus选项组
config.window.mocks.$optionGroup = {
  update: vi.fn(),
}

// 模拟Element Plus复选框
config.window.mocks.$checkbox = {
  focus: vi.fn(),
  blur: vi.fn(),
}

// 模拟Element Plus复选框组
config.window.mocks.$checkboxGroup = {
  update: vi.fn(),
}

// 模拟Element Plus单选框
config.window.mocks.$radio = {
  focus: vi.fn(),
  blur: vi.fn(),
}

// 模拟Element Plus单选框组
config.window.mocks.$radioGroup = {
  update: vi.fn(),
}

// 模拟Element Plus单选框按钮
config.window.mocks.$radioButton = {
  focus: vi.fn(),
  blur: vi.fn(),
}

// 模拟Element Plus开关
config.window.mocks.$switch = {
  focus: vi.fn(),
  blur: vi.fn(),
}

// 模拟Element Plus滑块
config.window.mocks.$slider = {
  focus: vi.fn(),
  blur: vi.fn(),
}

// 模拟Element Plus评分
config.window.mocks.$rate = {
  update: vi.fn(),
}

// 模拟Element Plus上传
config.window.mocks.$upload = {
  upload: vi.fn(),
  abort: vi.fn(),
  clearFiles: vi.fn(),
  clearFilesList: vi.fn(),
  submit: vi.fn(),
}

// 模拟Element Plus上传拖拽
config.window.mocks.$uploadDragger = {
  update: vi.fn(),
}

// 模拟Element Plus上传列表
config.window.mocks.$uploadList = {
  update: vi.fn(),
}

// 模拟Element Plus上传列表项
config.window.mocks.$uploadListItem = {
  update: vi.fn(),
}

// 模拟Element Plus图片
config.window.mocks.$image = {
  load: vi.fn(),
  error: vi.fn(),
}

// 模拟Element Plus图片查看器
config.window.mocks.$imageViewer = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus轮播图
config.window.mocks.$carousel = {
  next: vi.fn(),
  prev: vi.fn(),
  goTo: vi.fn(),
}

// 模拟Element Plus轮播图项
config.window.mocks.$carouselItem = {
  update: vi.fn(),
}

// 模拟Element Plus抽屉
config.window.mocks.$drawer = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus气泡确认框
config.window.mocks.$popconfirm = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus警告
config.window.mocks.$alert = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus通知
config.window.mocks.$notification = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus消息框
config.window.mocks.$msgbox = {
  alert: vi.fn(),
  confirm: vi.fn(),
  prompt: vi.fn(),
}

// 模拟Element Plus加载指令
config.window.mocks.$loadingDirective = {
  show: vi.fn(),
  hide: vi.fn(),
}

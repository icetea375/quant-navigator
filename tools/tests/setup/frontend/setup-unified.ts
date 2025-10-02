/**
 * 统一的测试环境设置 - "无菌手术室"基础设施
 * 
 * 这个文件替代了原来复杂的setup.ts，提供：
 * 1. 简化的全局mock配置
 * 2. 与createTestWrapper的完美配合
 * 3. 最小化的环境污染
 */

import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// 设置测试环境
import { setupTestEnvironment } from '../../../../tools/scripts/test-utils'
setupTestEnvironment()

// ==================== 全局Mock配置 ====================

// 修复Vue Router在测试环境中的问题
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

// 模拟浏览器API - 浏览器环境兼容
const globalObj = typeof global !== 'undefined' ? global : window

globalObj.IntersectionObserver = vi.fn().mockImplementation((callback, options = {}) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: options.root || null,
  rootMargin: options.rootMargin || '0px',
  thresholds: options.thresholds || [0],
}))

globalObj.ResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

globalObj.MutationObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
}))

globalObj.PerformanceObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
}))

// 模拟Web Animations API
globalObj.Animation = vi.fn().mockImplementation(() => ({
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
globalObj.requestIdleCallback = vi.fn((callback) => {
  return setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 50 }), 0)
})

globalObj.cancelIdleCallback = vi.fn((id) => {
  clearTimeout(id)
})

// 确保window.setTimeout和clearTimeout都正确设置
// Element Plus的Alert组件需要这些函数
if (typeof window.setTimeout === 'undefined') {
  window.setTimeout = globalObj.setTimeout
}
if (typeof window.clearTimeout === 'undefined') {
  window.clearTimeout = globalObj.clearTimeout
}

// 确保这些函数在全局作用域也可用
if (typeof globalObj.setTimeout === 'undefined') {
  globalObj.setTimeout = setTimeout
}
if (typeof globalObj.clearTimeout === 'undefined') {
  globalObj.clearTimeout = clearTimeout
}

// 模拟IntersectionObserverEntry
globalObj.IntersectionObserverEntry = class IntersectionObserverEntry {
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
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// 模拟window.getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: vi.fn(() => ({
    getPropertyValue: vi.fn((prop: string) => {
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

// 模拟document.head
Object.defineProperty(document, 'head', {
  value: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    insertBefore: vi.fn(),
    insertAdjacentElement: vi.fn((position: string, element: any) => {
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

// 模拟document.body
Object.defineProperty(document, 'body', {
  value: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    insertBefore: vi.fn(),
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    querySelector: vi.fn(() => null),
    querySelectorAll: vi.fn(() => []),
    getElementsByTagName: vi.fn(() => []),
    getElementsByClassName: vi.fn(() => []),
    getElementById: vi.fn(() => null),
    // 关键修复：添加classList支持，解决Element Plus Dialog的hasClass问题
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      toggle: vi.fn(),
      contains: vi.fn(() => false), // 默认返回false，避免contains错误
      item: vi.fn(),
      toString: vi.fn(() => ''),
      value: '',
      length: 0
    },
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

// 模拟DOM尺寸API
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

// ==================== 简化的全局配置 ====================

// 全局stubs - 只保留真正需要的
// 浏览器环境兼容性
if (config.window) {
  config.window.stubs = {
    'router-link': true,
    'router-view': true,
    'transition': true,
    'transition-group': true,
  }
}

// 全局mocks - 只保留基础功能
// 浏览器环境兼容性
if (config.window) {
  config.window.mocks = {
    $t: (key: string) => key,
    $tc: (key: string) => key,
    $te: (key: string) => true,
    $d: (value: unknown) => value,
    $n: (value: unknown) => value,
  }
}

// 模拟HTTP请求
vi.mock('@/services/http', () => ({
  request: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} }))
  }
}))

// 模拟axios
globalObj.axios = {
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

// 完全模拟Popper.js - 解决instanceof问题
// 增强版模拟，支持我们伪造的几何信息
vi.mock('@sxzz/popperjs-es', () => ({
  createPopper: vi.fn((reference, popper, options) => {
    // 模拟Popper实例，支持我们伪造的几何信息
    const mockPopper = {
      setOptions: vi.fn((newOptions) => {
        // 模拟setOptions，确保不会抛出错误
        return Promise.resolve()
      }),
      destroy: vi.fn(),
      forceUpdate: vi.fn(() => {
        // 模拟forceUpdate，使用我们伪造的几何信息
        return Promise.resolve()
      }),
      update: vi.fn(() => {
        // 模拟update，使用我们伪造的几何信息
        return Promise.resolve()
      }),
      // 添加一些Popper.js可能需要的属性
      state: {
        elements: {
          reference: reference,
          popper: popper
        },
        options: options || {}
      }
    }
    return mockPopper
  }),
  detectOverflow: vi.fn((state, options) => {
    // 返回模拟的overflow检测结果
    return {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }
  }),
  popperGenerator: vi.fn((options) => {
    return vi.fn((reference, popper, config) => {
      return {
        setOptions: vi.fn(),
        destroy: vi.fn(),
        forceUpdate: vi.fn(),
        update: vi.fn()
      }
    })
  }),
  defaultModifiers: [],
  default: {
    createPopper: vi.fn((reference, popper, options) => {
      return {
        setOptions: vi.fn(),
        destroy: vi.fn(),
        forceUpdate: vi.fn(),
        update: vi.fn()
      }
    }),
    detectOverflow: vi.fn(() => ({})),
    popperGenerator: vi.fn(() => vi.fn()),
    defaultModifiers: []
  }
}))

// 模拟Popper.js的构造函数和类型检查
globalObj.Popper = class MockPopper {
  constructor() {
    this.setOptions = vi.fn()
    this.destroy = vi.fn()
    this.forceUpdate = vi.fn()
    this.update = vi.fn()
  }
}

// 确保instanceof检查通过
Object.defineProperty(globalObj, 'Popper', {
  value: class MockPopper {
    constructor() {
      this.setOptions = vi.fn()
      this.destroy = vi.fn()
      this.forceUpdate = vi.fn()
      this.update = vi.fn()
    }
  },
  writable: true
})

// ==================== 战场环境升级完成 ====================
// happy-dom 自带更完备的物理引擎，无需手动伪造时空
// 所有 DOM 几何 API 和异步调度 API 都由 happy-dom 原生提供

// 模拟XMLHttpRequest
globalObj.XMLHttpRequest = vi.fn(() => ({
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

// 模拟Element Plus Loading服务
const mockLoadingService = vi.fn(() => ({
  close: vi.fn(),
  setText: vi.fn(),
  setSpinner: vi.fn(),
  setBackgroundColor: vi.fn(),
  setCustomClass: vi.fn(),
  setTarget: vi.fn(),
  setBody: vi.fn(),
  setLock: vi.fn(),
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

globalObj.ElLoading = {
  service: mockLoadingService
}

// 为Element Plus的Teleport创建目标容器
const createTeleportTargets = () => {
  // 创建Element Plus Popper容器 - 支持动态ID
  const createPopperContainer = (id: string) => {
    if (!document.getElementById(id)) {
      const container = document.createElement('div')
      container.id = id
      container.style.position = 'absolute'
      container.style.top = '0'
      container.style.left = '0'
      container.style.zIndex = '2000'
      container.style.pointerEvents = 'none'
      document.body.appendChild(container)
    }
  }
  
  // 创建固定的Teleport目标
  const fixedTargets = [
    'el-popper-container',
    'el-select-dropdown',
    'el-tooltip-container',
    'el-dropdown-menu-container'
  ]
  
  fixedTargets.forEach(id => createPopperContainer(id))
  
  // 创建一些常见的动态ID
  for (let i = 0; i < 10; i++) {
    createPopperContainer(`el-popper-container-${2000 + i}`)
  }
}

// 在测试环境中创建Teleport目标
createTeleportTargets()

// 监听DOM变化，动态创建新的Teleport目标
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      // 检查是否有新的Teleport目标需求
      const allElements = document.querySelectorAll('[data-popper-placement]')
      allElements.forEach((el) => {
        const popperId = el.getAttribute('data-popper-placement')
        if (popperId && popperId.includes('el-popper-container-')) {
          const containerId = popperId.split(' ')[0]
          if (!document.getElementById(containerId)) {
            const container = document.createElement('div')
            container.id = containerId
            container.style.position = 'absolute'
            container.style.top = '0'
            container.style.left = '0'
            container.style.zIndex = '2000'
            container.style.pointerEvents = 'none'
            document.body.appendChild(container)
          }
        }
      })
    }
  })
})

// 开始观察DOM变化
observer.observe(document.body, {
  childList: true,
  subtree: true
})

console.log('🏗️ 无菌手术室基础设施已就绪 - 统一测试环境配置完成')

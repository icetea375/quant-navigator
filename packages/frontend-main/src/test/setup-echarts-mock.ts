// ECharts 测试环境模拟
// 在浏览器环境中，跳过模拟，使用真实的ECharts

// 检查是否在浏览器环境中
if (typeof window !== 'undefined' && typeof global === 'undefined') {
  // 浏览器环境：跳过所有模拟
  console.log('Browser environment detected, skipping ECharts mocks')
} else {
  // Node.js环境：进行模拟
  const { vi } = require('vitest')

// 模拟 ECharts 实例
const mockEChartsInstance = {
  setOption: vi.fn(),
  resize: vi.fn(),
  dispose: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  getOption: vi.fn(() => ({})),
  getWidth: vi.fn(() => 300),
  getHeight: vi.fn(() => 150),
  getDom: vi.fn(() => document.createElement('div')),
  getZr: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    refresh: vi.fn()
  }))
}

// 模拟 ECharts 主函数
const mockECharts = vi.fn(() => mockEChartsInstance) as any

// 模拟 ECharts 工具函数
mockECharts.init = vi.fn(() => mockEChartsInstance)
mockECharts.dispose = vi.fn()
mockECharts.getInstanceByDom = vi.fn(() => mockEChartsInstance)
mockECharts.registerTheme = vi.fn()
mockECharts.registerMap = vi.fn()
mockECharts.getMap = vi.fn()

// 模拟 ECharts 常量
mockECharts.EVENT = {
  CLICK: 'click',
  DBLCLICK: 'dblclick',
  MOUSEDOWN: 'mousedown',
  MOUSEUP: 'mouseup',
  MOUSEMOVE: 'mousemove',
  MOUSEOVER: 'mouseover',
  MOUSEOUT: 'mouseout',
  GLOBALOUT: 'globalout',
  CONTEXTMENU: 'contextmenu',
  FOCUS: 'focus',
  BLUR: 'blur',
  SELECTED: 'selected',
    UNSELECTED: 'unselected'
  }

// 模拟 vue-echarts
const mockVueEcharts = {
  name: 'v-chart',
  props: {
    option: Object,
    theme: String,
    initOpts: Object,
    group: String,
    autoresize: Boolean,
    loading: Boolean,
    loadingOpts: Object,
    manualUpdate: Boolean
  },
  setup: vi.fn(() => ({
    chart: mockEChartsInstance,
    resize: vi.fn(),
    dispose: vi.fn(),
    getOption: vi.fn(() => ({}))
  }))
}

// 设置全局模拟
global.echarts = mockECharts
global.VueECharts = mockVueEcharts

// 模拟模块导入
vi.mock('echarts', () => ({
  default: mockECharts,
  ...mockECharts
}))

vi.mock('vue-echarts', () => ({
  default: mockVueEcharts,
  use: vi.fn(() => mockEChartsInstance)
}))
}

// 导出空的模拟对象（浏览器环境兼容）
export const mockECharts = {}
export const mockEChartsInstance = {}
export const mockVueEcharts = {}
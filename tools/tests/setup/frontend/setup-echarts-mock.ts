// ECharts 测试环境模拟
import { vi } from 'vitest'

// 模拟 WebKitCSSMatrix（zrender需要检测这个）
class MockWebKitCSSMatrix {
  constructor(matrix?: string) {
    this.m11 = 1
    this.m12 = 0
    this.m13 = 0
    this.m14 = 0
    this.m21 = 0
    this.m22 = 1
    this.m23 = 0
    this.m24 = 0
    this.m31 = 0
    this.m32 = 0
    this.m33 = 1
    this.m34 = 0
    this.m41 = 0
    this.m42 = 0
    this.m43 = 0
    this.m44 = 1
  }
  
  m11: number
  m12: number
  m13: number
  m14: number
  m21: number
  m22: number
  m23: number
  m24: number
  m31: number
  m32: number
  m33: number
  m34: number
  m41: number
  m42: number
  m43: number
  m44: number
  
  // 模拟方法
  multiply = vi.fn(() => new MockWebKitCSSMatrix())
  inverse = vi.fn(() => new MockWebKitCSSMatrix())
  translate = vi.fn(() => new MockWebKitCSSMatrix())
  scale = vi.fn(() => new MockWebKitCSSMatrix())
  rotate = vi.fn(() => new MockWebKitCSSMatrix())
  rotateAxisAngle = vi.fn(() => new MockWebKitCSSMatrix())
  skewX = vi.fn(() => new MockWebKitCSSMatrix())
  skewY = vi.fn(() => new MockWebKitCSSMatrix())
  toString = vi.fn(() => 'matrix(1, 0, 0, 1, 0, 0)')
}

// 在全局作用域中定义WebKitCSSMatrix - 浏览器环境兼容
const globalObj = typeof global !== 'undefined' ? global : window

Object.defineProperty(globalObj, 'WebKitCSSMatrix', {
  value: MockWebKitCSSMatrix,
  writable: true,
  configurable: true
})

// 模拟 zrender 环境检测
Object.defineProperty(globalObj, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (compatible; Test Environment)',
    platform: 'Test Platform',
    vendor: 'Test Vendor',
    appName: 'Test App',
    appVersion: '1.0.0',
    product: 'Test Product',
    productSub: 'Test Product Sub',
    vendorSub: 'Test Vendor Sub',
    language: 'en-US',
    languages: ['en-US'],
    onLine: true,
    cookieEnabled: true,
    doNotTrack: '1',
    hardwareConcurrency: 4,
    maxTouchPoints: 0,
    webdriver: false
  },
  writable: true
})

// 创建模拟的CSS样式对象，包含zrender需要的所有CSS属性
const createMockStyle = () => {
  const styleProperties = {
    // 基础CSS属性
    display: '',
    position: '',
    top: '',
    left: '',
    right: '',
    bottom: '',
    width: '',
    height: '',
    margin: '',
    padding: '',
    border: '',
    background: '',
    color: '',
    fontSize: '',
    fontFamily: '',
    fontWeight: '',
    textAlign: '',
    verticalAlign: '',
    opacity: '',
    visibility: '',
    overflow: '',
    zIndex: '',
    
    // 变换相关属性（zrender需要检测这些）
    transform: '',
    transformOrigin: '',
    transformStyle: '',
    perspective: '',
    perspectiveOrigin: '',
    backfaceVisibility: '',
    
    // Mozilla特定属性（zrender需要检测MozPerspective）
    MozPerspective: '',
    MozTransform: '',
    MozTransformOrigin: '',
    MozTransformStyle: '',
    MozBackfaceVisibility: '',
    
    // WebKit特定属性
    WebkitTransform: '',
    WebkitTransformOrigin: '',
    WebkitTransformStyle: '',
    WebkitPerspective: '',
    WebkitBackfaceVisibility: '',
    
    // IE特定属性
    msTransform: '',
    msTransformOrigin: '',
    msTransformStyle: '',
    msPerspective: '',
    msBackfaceVisibility: '',
    
    // 其他可能需要的属性
    transition: '',
    animation: '',
    filter: '',
    clipPath: '',
    mask: ''
  }
  
  const style = {
    ...styleProperties,
    // 方法
    getPropertyValue: vi.fn((prop: string) => styleProperties[prop as keyof typeof styleProperties] || ''),
    setProperty: vi.fn((prop: string, value: string) => {
      (styleProperties as Record<string, string>)[prop] = value
    }),
    removeProperty: vi.fn((prop: string) => {
      delete (styleProperties as Record<string, string>)[prop]
    }),
    item: vi.fn((index: number) => Object.keys(styleProperties)[index] || ''),
    getPropertyPriority: vi.fn(() => ''),
    getPropertyShorthand: vi.fn(() => ''),
    isPropertyImplicit: vi.fn(() => false),
    length: Object.keys(styleProperties).length
  }
  
  // 添加in操作符支持
  return new Proxy(style, {
    has(target, prop) {
      return prop in target || prop in Object.prototype
    }
  })
}

// 创建模拟的DOM元素（遵循测试宪法第4条：简单性优先）
const createMockElement = (tagName: string, namespace?: string) => {
  const element = {
    tagName: tagName.toUpperCase(),
    namespaceURI: namespace,
    style: createMockStyle(),
    getBoundingClientRect: vi.fn(() => ({
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      width: 300,
      height: 150
    })),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    insertBefore: vi.fn(),
    replaceChild: vi.fn(),
    cloneNode: vi.fn(),
    hasChildNodes: vi.fn(() => false),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    getElementsByTagName: vi.fn(() => []),
    getElementsByClassName: vi.fn(() => []),
    getElementById: vi.fn(),
    createTextNode: vi.fn((text: string) => ({ textContent: text, nodeType: 3 })),
    createDocumentFragment: vi.fn(() => ({})),
    createComment: vi.fn((text: string) => ({ textContent: text, nodeType: 8 })),
    // DOM元素必需的方法
    setAttribute: vi.fn((name: string, value: string) => {
      // 简单实现：直接设置属性
      element[name] = value
    }),
    getAttribute: vi.fn((name: string) => element[name]),
    removeAttribute: vi.fn((name: string) => {
      delete element[name]
    }),
    hasAttribute: vi.fn((name: string) => name in element),
    setAttributeNS: vi.fn(),
    getAttributeNS: vi.fn(),
    removeAttributeNS: vi.fn(),
    hasAttributeNS: vi.fn(() => false),
    getElementsByTagNameNS: vi.fn(() => []),
    matches: vi.fn(() => false),
    closest: vi.fn(),
    insertAdjacentElement: vi.fn(),
    insertAdjacentHTML: vi.fn(),
    insertAdjacentText: vi.fn(),
    scrollIntoView: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    click: vi.fn(),
    dispatchEvent: vi.fn(() => true),
    // zrender 需要的属性（简单实现）
    width: 300,
    height: 150,
    offsetWidth: 300,
    offsetHeight: 150,
    clientWidth: 300,
    clientHeight: 150,
    scrollWidth: 300,
    scrollHeight: 150,
    nodeType: 1,
    nodeName: tagName.toUpperCase(),
    parentNode: null,
    childNodes: [],
    firstChild: null,
    lastChild: null,
    nextSibling: null,
    previousSibling: null,
    ownerDocument: window.document,
    // DOM 创建方法
    createElement: vi.fn((tagName: string) => createMockElement(tagName)),
    createElementNS: vi.fn((namespace: string, tagName: string) => createMockElement(tagName, namespace))
  }
  
  return element
}

// 模拟 window 对象 - 浏览器环境兼容性
// 在浏览器环境中，window 对象已经存在，不需要重新定义
if (typeof globalObj.window === 'undefined') {
  Object.defineProperty(globalObj, 'window', {
  value: {
    navigator: window.navigator,
    document: window.document,
    location: { 
      href: 'http://localhost',
      protocol: 'http:',
      host: 'localhost',
      hostname: 'localhost',
      port: '',
      pathname: '/',
      search: '',
      hash: ''
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getComputedStyle: vi.fn(() => ({
      getPropertyValue: vi.fn(() => ''),
      setProperty: vi.fn(),
      removeProperty: vi.fn()
    })),
    getBoundingClientRect: vi.fn(() => ({
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      width: 0,
      height: 0
    })),
    innerWidth: 1024,
    innerHeight: 768,
    outerWidth: 1024,
    outerHeight: 768,
    devicePixelRatio: 1,
    screen: {
      width: 1024,
      height: 768,
      availWidth: 1024,
      availHeight: 768,
      colorDepth: 24,
      pixelDepth: 24
    },
    // 添加WebKitCSSMatrix支持
    WebKitCSSMatrix: MockWebKitCSSMatrix
  },
  writable: true
  })
}

// 只模拟document.documentElement.style，不重新定义整个document对象
// 符合测试宪法第6条：只模拟外部边界，不模拟内部逻辑
if (window.document && window.document.documentElement) {
  window.document.documentElement.style = createMockStyle()
}

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
  getDom: vi.fn(() => createMockElement('div')),
  getZr: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    refresh: vi.fn()
  }))
}

// 模拟 ECharts 主函数
const mockECharts = vi.fn(() => mockEChartsInstance) as typeof import('echarts')

// 模拟 ECharts 工具函数
mockECharts.init = vi.fn(() => mockEChartsInstance)
mockECharts.dispose = vi.fn()
mockECharts.getInstanceByDom = vi.fn(() => mockEChartsInstance)
mockECharts.registerTheme = vi.fn()
mockECharts.registerMap = vi.fn()
mockECharts.getMap = vi.fn()
mockECharts.registerTransform = vi.fn()
mockECharts.registerAction = vi.fn()
mockECharts.registerProcessor = vi.fn()
mockECharts.registerPreprocessor = vi.fn()
mockECharts.registerPostprocessor = vi.fn()
mockECharts.registerLayout = vi.fn()
mockECharts.registerVisual = vi.fn()
mockECharts.registerModel = vi.fn()
mockECharts.registerView = vi.fn()
mockECharts.registerComponent = vi.fn()
mockECharts.registerSeries = vi.fn()
mockECharts.registerChart = vi.fn()
mockECharts.registerCoordinateSystem = vi.fn()

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
  UNSELECTED: 'unselected',
  SELECTED_CHANGED: 'selectedChanged',
  HOVER_LINK: 'hoverLink',
  BRUSH: 'brush',
  BRUSH_SELECTED: 'brushSelected',
  BRUSH_END: 'brushEnd',
  BRUSH_END_EMPTY: 'brushEndEmpty',
  TAKE_GLOBAL_CURSOR: 'takeGlobalCursor',
  GLOBAL_CURSOR_TAKEN: 'globalCursorTaken',
  ZR_KEY_EVENT: 'zr:keyEvent',
  ZR_MOUSE_EVENT: 'zr:mouseEvent',
  ZR_TOUCH_EVENT: 'zr:touchEvent',
  ZR_GESTURE_EVENT: 'zr:gestureEvent',
  ZR_ANIMATION_FRAME: 'zr:animationFrame',
  ZR_ANIMATION_FINISH: 'zr:animationFinish',
  ZR_ANIMATION_DELAY: 'zr:animationDelay',
  ZR_ANIMATION_CANCEL: 'zr:animationCancel',
  ZR_ANIMATION_RESTART: 'zr:animationRestart',
  ZR_ANIMATION_PAUSE: 'zr:animationPause',
  ZR_ANIMATION_RESUME: 'zr:animationResume',
  ZR_ANIMATION_STOP: 'zr:animationStop',
  ZR_ANIMATION_START: 'zr:animationStart',
  ZR_ANIMATION_END: 'zr:animationEnd',
  ZR_ANIMATION_UPDATE: 'zr:animationUpdate',
  ZR_ANIMATION_STEP: 'zr:animationStep',
  ZR_ANIMATION_COMPLETE: 'zr:animationComplete',
  ZR_ANIMATION_DISPOSE: 'zr:animationDispose',
  ZR_ANIMATION_CREATE: 'zr:animationCreate',
  ZR_ANIMATION_DESTROY: 'zr:animationDestroy',
  ZR_ANIMATION_INIT: 'zr:animationInit',
  ZR_ANIMATION_RESET: 'zr:animationReset',
  ZR_ANIMATION_CLEAR: 'zr:animationClear',
  ZR_ANIMATION_FILL: 'zr:animationFill',
  ZR_ANIMATION_STROKE: 'zr:animationStroke',
  ZR_ANIMATION_FILL_STROKE: 'zr:animationFillStroke',
  ZR_ANIMATION_FILL_STROKE_FILL: 'zr:animationFillStrokeFill',
  ZR_ANIMATION_FILL_STROKE_FILL_STROKE: 'zr:animationFillStrokeFillStroke'
}

// 模拟 ECharts 工具函数
mockECharts.util = {
  createCanvas: vi.fn(() => createMockElement('canvas')),
  createImage: vi.fn(() => new Image()),
  createSVG: vi.fn(() => createMockElement('svg')),
  createVML: vi.fn(() => createMockElement('div')),
  createOffscreenCanvas: vi.fn(() => new OffscreenCanvas(300, 150)),
  createImageData: vi.fn(() => new ImageData(300, 150)),
  createImageBitmap: vi.fn(() => Promise.resolve(new ImageBitmap())),
  createBlob: vi.fn(() => new Blob()),
  createURL: vi.fn(() => 'blob:mock-url'),
  revokeURL: vi.fn(),
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
  createElement: vi.fn((tagName: string) => createMockElement(tagName)),
  createElementNS: vi.fn((namespace: string, tagName: string) => createMockElement(tagName, namespace)),
  createTextNode: vi.fn((text: string) => document.createTextNode(text)),
  createComment: vi.fn((text: string) => document.createComment(text)),
  createDocumentFragment: vi.fn(() => document.createDocumentFragment()),
  createRange: vi.fn(() => document.createRange()),
  createTreeWalker: vi.fn(() => document.createTreeWalker(document)),
  createNodeIterator: vi.fn(() => document.createNodeIterator(document)),
  createXPathEvaluator: vi.fn(() => document.createXPathEvaluator()),
  createXPathResult: vi.fn(() => document.createXPathResult()),
  createXPathNSResolver: vi.fn(() => document.createXPathNSResolver()),
  createXPathExpression: vi.fn(() => document.createXPathExpression()),
  createXPathException: vi.fn(() => document.createXPathException()),
  createXPathNamespace: vi.fn(() => document.createXPathNamespace()),
  createXPathNamespaceResolver: vi.fn(() => document.createXPathNamespaceResolver())
}

// 模拟 ECharts 主题
mockECharts.registerTheme('test-theme', {
  color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: 'sans-serif',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: 'normal'
  },
  title: {
    textStyle: {
      color: '#464646',
      fontSize: 18,
      fontWeight: 'bolder'
    },
    subtextStyle: {
      color: '#6E7079'
    }
  },
  line: {
    itemStyle: {
      borderWidth: 1
    },
    lineStyle: {
      width: 2
    },
    symbolSize: 4,
    symbol: 'emptyCircle',
    smooth: false
  },
  radar: {
    itemStyle: {
      borderWidth: 1
    },
    lineStyle: {
      width: 2
    },
    symbolSize: 4,
    symbol: 'emptyCircle',
    smooth: false
  },
  bar: {
    itemStyle: {
      barBorderWidth: 0,
      barBorderColor: '#ccc'
    }
  },
  pie: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc'
    }
  },
  scatter: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc'
    }
  },
  boxplot: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc'
    }
  },
  parallel: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc'
    }
  },
  sankey: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc'
    }
  },
  funnel: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc'
    }
  },
  gauge: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc'
    }
  },
  candlestick: {
    itemStyle: {
      color: '#e6a0d2',
      color0: 'transparent',
      borderColor: '#d680bc',
      borderColor0: '#8fd3e8',
      borderWidth: 1
    }
  },
  graph: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc'
    },
    lineStyle: {
      width: 1,
      color: '#aaa'
    },
    symbolSize: 4,
    symbol: 'emptyCircle',
    smooth: false,
    color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],
    label: {
      color: '#eee'
    },
    emphasis: {
      itemStyle: {
        borderColor: '#fff'
      },
      lineStyle: {
        color: '#aaa'
      }
    }
  },
  map: {
    itemStyle: {
      areaColor: '#eee',
      borderColor: '#444',
      borderWidth: 0.5
    },
    label: {
      color: '#000'
    },
    emphasis: {
      itemStyle: {
        areaColor: 'rgba(255,215,0,0.8)',
        borderColor: '#444',
        borderWidth: 1
      },
      label: {
        color: 'rgb(100,0,0)'
      }
    }
  },
  geo: {
    itemStyle: {
      areaColor: '#eee',
      borderColor: '#444',
      borderWidth: 0.5
    },
    label: {
      color: '#000'
    },
    emphasis: {
      itemStyle: {
        areaColor: 'rgba(255,215,0,0.8)',
        borderColor: '#444',
        borderWidth: 1
      },
      label: {
        color: 'rgb(100,0,0)'
      }
    }
  },
  categoryAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#6E7079'
      }
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#6E7079'
      }
    },
    axisLabel: {
      show: true,
      color: '#6E7079'
    },
    splitLine: {
      show: false,
      lineStyle: {
        color: ['#E5EAF2']
      }
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)']
      }
    }
  },
  valueAxis: {
    axisLine: {
      show: false,
      lineStyle: {
        color: '#6E7079'
      }
    },
    axisTick: {
      show: false,
      lineStyle: {
        color: '#6E7079'
      }
    },
    axisLabel: {
      show: true,
      color: '#6E7079'
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: ['#E5EAF2']
      }
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)']
      }
    }
  },
  logAxis: {
    axisLine: {
      show: false,
      lineStyle: {
        color: '#6E7079'
      }
    },
    axisTick: {
      show: false,
      lineStyle: {
        color: '#6E7079'
      }
    },
    axisLabel: {
      show: true,
      color: '#6E7079'
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: ['#E5EAF2']
      }
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)']
      }
    }
  },
  timeAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#6E7079'
      }
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#6E7079'
      }
    },
    axisLabel: {
      show: true,
      color: '#6E7079'
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: ['#E5EAF2']
      }
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)']
      }
    }
  },
  toolbox: {
    iconStyle: {
      borderColor: '#999'
    },
    emphasis: {
      iconStyle: {
        borderColor: '#666'
      }
    }
  },
  legend: {
    textStyle: {
      color: '#333'
    }
  },
  tooltip: {
    backgroundColor: 'rgba(50,50,50,0.7)',
    borderColor: '#333',
    borderWidth: 0,
    textStyle: {
      color: '#fff'
    },
    axisPointer: {
      lineStyle: {
        color: '#ccc',
        width: 1
      },
      crossStyle: {
        color: '#ccc',
        width: 1
      }
    }
  },
  timeline: {
    lineStyle: {
      color: '#DAE1F5',
      width: 2
    },
    itemStyle: {
      color: '#4C565E',
      borderWidth: 1
    },
    controlStyle: {
      color: '#4C565E',
      borderColor: '#4C565E',
      borderWidth: 1
    },
    checkpointStyle: {
      color: '#316bf3',
      borderColor: 'rgba(49,107,243,0.2)'
    },
    label: {
      color: '#4C565E'
    },
    emphasis: {
      itemStyle: {
        color: '#A4B1DA'
      },
      controlStyle: {
        color: '#A4B1DA',
        borderColor: '#A4B1DA',
        borderWidth: 1
      },
      label: {
        color: '#A4B1DA'
      }
    }
  },
  visualMap: {
    color: ['#bf444c', '#d88273', '#f6e199', '#91cf60', '#1e88e5']
  },
  dataZoom: {
    handleSize: '100%',
    textStyle: {
      color: '#333'
    }
  },
  markPoint: {
    label: {
      color: '#eee'
    },
    emphasis: {
      label: {
        color: '#eee'
      }
    }
  }
})

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
globalObj.echarts = mockECharts
globalObj.VueECharts = mockVueEcharts

// 模拟模块导入
vi.mock('echarts', () => ({
  default: mockECharts,
  ...mockECharts
}))

vi.mock('echarts/core', () => ({
  use: vi.fn(() => mockEChartsInstance)
}))

vi.mock('echarts/renderers', () => ({
  CanvasRenderer: vi.fn()
}))

vi.mock('echarts/charts', () => ({
  LineChart: vi.fn(),
  BarChart: vi.fn()
}))

vi.mock('echarts/components', () => ({
  TitleComponent: vi.fn(),
  TooltipComponent: vi.fn(),
  LegendComponent: vi.fn(),
  GridComponent: vi.fn(),
  DataZoomComponent: vi.fn(),
  VisualMapComponent: vi.fn(),
  TimelineComponent: vi.fn(),
  CalendarComponent: vi.fn(),
  GraphicComponent: vi.fn(),
  ToolboxComponent: vi.fn(),
  MarkPointComponent: vi.fn(),
  MarkLineComponent: vi.fn(),
  MarkAreaComponent: vi.fn(),
  SingleAxisComponent: vi.fn(),
  BrushComponent: vi.fn(),
  TransformComponent: vi.fn()
}))

vi.mock('vue-echarts', () => ({
  default: mockVueEcharts,
  use: vi.fn(() => mockEChartsInstance)
}))

// 模拟 vue-echarts 的内部依赖
vi.mock('vue-echarts/node_modules/.pnpm/rollup-plugin-styles@4.0.0_rollup@2.79.1/node_modules/rollup-plugin-styles/dist/runtime/inject-css.js', () => ({
  default: vi.fn()
}))

// 模拟 zrender
vi.mock('zrender', () => ({
  default: {
    init: vi.fn(() => mockEChartsInstance),
    dispose: vi.fn(),
    registerPainter: vi.fn(),
    registerShape: vi.fn(),
    registerPath: vi.fn(),
    registerImage: vi.fn(),
    registerText: vi.fn(),
    registerGroup: vi.fn(),
    registerCircle: vi.fn(),
    registerEllipse: vi.fn(),
    registerSector: vi.fn(),
    registerPolygon: vi.fn(),
    registerPolyline: vi.fn(),
    registerRect: vi.fn(),
    registerLine: vi.fn(),
    registerBezierCurve: vi.fn(),
    registerArc: vi.fn(),
    registerCubicBezierCurve: vi.fn(),
    registerQuadraticBezierCurve: vi.fn(),
    registerCubicBezierCurve2: vi.fn(),
    registerCubicBezierCurve3: vi.fn(),
    registerCubicBezierCurve4: vi.fn(),
    registerCubicBezierCurve5: vi.fn(),
    registerCubicBezierCurve6: vi.fn(),
    registerCubicBezierCurve7: vi.fn(),
    registerCubicBezierCurve8: vi.fn(),
    registerCubicBezierCurve9: vi.fn(),
    registerCubicBezierCurve10: vi.fn()
  }
}))

// 模拟 rollup-plugin-styles
vi.mock('rollup-plugin-styles', () => ({
  default: vi.fn()
}))

export { mockECharts, mockEChartsInstance, mockVueEcharts }
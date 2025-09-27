// ECharts 测试环境模拟
import { vi } from 'vitest'

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
const mockECharts = vi.fn(() => mockEChartsInstance)

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
mockECharts.registerTransform = vi.fn()
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
  createCanvas: vi.fn(() => document.createElement('canvas')),
  createImage: vi.fn(() => new Image()),
  createSVG: vi.fn(() => document.createElementNS('http://www.w3.org/2000/svg', 'svg')),
  createVML: vi.fn(() => document.createElement('div')),
  createOffscreenCanvas: vi.fn(() => new OffscreenCanvas(300, 150)),
  createImageData: vi.fn(() => new ImageData(300, 150)),
  createImageBitmap: vi.fn(() => Promise.resolve(new ImageBitmap())),
  createBlob: vi.fn(() => new Blob()),
  createURL: vi.fn(() => 'blob:mock-url'),
  revokeURL: vi.fn(),
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
  createElement: vi.fn((tagName: string) => document.createElement(tagName)),
  createElementNS: vi.fn((namespace: string, tagName: string) => document.createElementNS(namespace, tagName)),
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
  createXPathNamespaceResolver: vi.fn(() => document.createXPathNamespaceResolver()),
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

export { mockECharts, mockEChartsInstance, mockVueEcharts }

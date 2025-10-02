// Canvas 测试环境配置
import { vi } from 'vitest'

// 模拟 Canvas API
const mockCanvas = {
         getContext: vi.fn(() => ({
           clearRect: vi.fn(),
           fillRect: vi.fn(),
           strokeRect: vi.fn(),
           beginPath: vi.fn(),
           closePath: vi.fn(),
           moveTo: vi.fn(),
           lineTo: vi.fn(),
           arc: vi.fn(),
           rect: vi.fn(),
           clip: vi.fn(), // ECharts 需要
           fill: vi.fn(),
           stroke: vi.fn(),
           save: vi.fn(),
           restore: vi.fn(),
           translate: vi.fn(),
           rotate: vi.fn(),
           scale: vi.fn(),
           measureText: vi.fn(() => ({ width: 100 })),
           fillText: vi.fn(),
           strokeText: vi.fn(),
           createLinearGradient: vi.fn(() => ({
             addColorStop: vi.fn()
           })),
           createRadialGradient: vi.fn(() => ({
             addColorStop: vi.fn()
           })),
           createPattern: vi.fn(),
           drawImage: vi.fn(),
           getImageData: vi.fn(() => ({
             data: new Uint8ClampedArray(4)
           })),
           putImageData: vi.fn(),
           setLineDash: vi.fn(),
           getLineDash: vi.fn(() => []),
           setTransform: vi.fn(),
           resetTransform: vi.fn(),
           transform: vi.fn(),
           // ECharts 需要的额外方法
           quadraticCurveTo: vi.fn(),
           bezierCurveTo: vi.fn(),
           arcTo: vi.fn(),
           ellipse: vi.fn(),
           isPointInPath: vi.fn(() => false),
           isPointInStroke: vi.fn(() => false),
           createImageData: vi.fn(() => ({
             data: new Uint8ClampedArray(4),
             width: 1,
             height: 1
           })),
           // 属性
           globalAlpha: 1,
           globalCompositeOperation: 'source-over',
           fillStyle: '#000000',
           strokeStyle: '#000000',
           lineWidth: 1,
           lineCap: 'butt',
           lineJoin: 'miter',
           miterLimit: 10,
           shadowOffsetX: 0,
           shadowOffsetY: 0,
           shadowBlur: 0,
           shadowColor: 'rgba(0, 0, 0, 0)',
           font: '10px sans-serif',
           textAlign: 'start',
           textBaseline: 'alphabetic',
           direction: 'inherit'
         })),
  toDataURL: vi.fn(() => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='),
  toBlob: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  // DOM 方法 - ECharts 需要这些方法
  setAttribute: vi.fn(),
  getAttribute: vi.fn(),
  removeAttribute: vi.fn(),
  hasAttribute: vi.fn(() => false),
  setAttributeNS: vi.fn(),
  getAttributeNS: vi.fn(),
  removeAttributeNS: vi.fn(),
  hasAttributeNS: vi.fn(() => false),
  appendChild: vi.fn(),
  removeChild: vi.fn(),
  insertBefore: vi.fn(),
  replaceChild: vi.fn(),
  cloneNode: vi.fn(() => mockCanvas),
  // DOM 属性
  width: 300,
  height: 150,
  style: {},
  className: '',
  id: '',
  nodeType: 1,
  parentNode: null,
  childNodes: [],
  firstChild: null,
  lastChild: null,
  nextSibling: null,
  previousSibling: null,
  ownerDocument: document,
         // 客户端尺寸 - ECharts 需要非零尺寸
         clientWidth: 800,
         clientHeight: 600,
         offsetWidth: 800,
         offsetHeight: 600,
         scrollWidth: 800,
         scrollHeight: 600,
         // 添加更多尺寸属性
         getBoundingClientRect: vi.fn(() => ({
           width: 800,
           height: 600,
           top: 0,
           left: 0,
           right: 800,
           bottom: 600,
           x: 0,
           y: 0
         }))
}

// 模拟 HTMLCanvasElement
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: mockCanvas.getContext
})

Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  value: mockCanvas.toDataURL
})

Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
  value: mockCanvas.toBlob
})

// 模拟 Canvas 相关属性
Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
  value: 300,
  writable: true
})

Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
  value: 150,
  writable: true
})

// 在浏览器环境中，这些API已经存在，不需要模拟
// 只在非浏览器环境中模拟
if (typeof global !== 'undefined') {
  // 模拟 ImageData
  global.ImageData = class ImageData {
    constructor(public data: Uint8ClampedArray, public width: number, public height: number, public colorSpace = 'srgb') {}
  } as any

  // 模拟 OffscreenCanvas
  global.OffscreenCanvas = class OffscreenCanvas {
    constructor(public width: number, public height: number) {}
    getContext = mockCanvas.getContext
    toDataURL = mockCanvas.toDataURL
    toBlob = mockCanvas.toBlob
    oncontextlost = null
    oncontextrestored = null
    convertToBlob = vi.fn()
    transferToImageBitmap = vi.fn()
  } as any

  // 模拟 requestAnimationFrame
  global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    return setTimeout(callback, 16)
  })

  global.cancelAnimationFrame = vi.fn((id: number) => {
    clearTimeout(id)
  })

  // 模拟 ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))

  // 模拟 IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))

  // 模拟 MutationObserver
  global.MutationObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(() => [])
  }))

  // 模拟 getComputedStyle
  global.getComputedStyle = vi.fn(() => ({
    getPropertyValue: vi.fn(() => ''),
    setProperty: vi.fn(),
    removeProperty: vi.fn()
  })) as any

  // 模拟 matchMedia
  global.matchMedia = vi.fn(() => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))

  // 模拟 URL.createObjectURL
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  global.URL.revokeObjectURL = vi.fn()
}

// 模拟 createElement 以返回模拟的 Canvas
const originalCreateElement = document.createElement
document.createElement = vi.fn((tagName: string) => {
  if (tagName.toLowerCase() === 'canvas') {
    // 创建一个真实的DOM元素，然后添加Canvas方法
    const realElement = originalCreateElement.call(document, tagName)
    
    // 只添加非只读的属性和方法
    Object.keys(mockCanvas).forEach(key => {
      if (key !== 'tagName' && key !== 'nodeName' && key !== 'nodeType') {
        try {
          (realElement as any)[key] = (mockCanvas as any)[key]
        } catch (e) {
          // 忽略只读属性的错误
        }
      }
    })
    
    return realElement as HTMLCanvasElement
  }
  return originalCreateElement.call(document, tagName)
})

export { mockCanvas }

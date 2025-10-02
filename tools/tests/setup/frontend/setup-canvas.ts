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
  width: 300,
  height: 150,
  style: {}
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

// 模拟 ImageData - 浏览器环境兼容
const globalObj = typeof global !== 'undefined' ? global : window

globalObj.ImageData = class ImageData {
  constructor(public data: Uint8ClampedArray, public width: number, public height: number, public colorSpace = 'srgb') {}
} as typeof ImageData

// 模拟 OffscreenCanvas
globalObj.OffscreenCanvas = class OffscreenCanvas {
  constructor(public width: number, public height: number) {}
  getContext = mockCanvas.getContext
  toDataURL = mockCanvas.toDataURL
  toBlob = mockCanvas.toBlob
  oncontextlost = null
  oncontextrestored = null
  convertToBlob = vi.fn()
  transferToImageBitmap = vi.fn()
} as typeof OffscreenCanvas

// 模拟 requestAnimationFrame
globalObj.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  return setTimeout(callback, 16)
})

globalObj.cancelAnimationFrame = vi.fn((id: number) => {
  clearTimeout(id)
})

// 模拟 ResizeObserver
globalObj.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// 模拟 IntersectionObserver
globalObj.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// 模拟 MutationObserver
globalObj.MutationObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => [])
}))

// getComputedStyle 已在 setup.ts 中统一配置，避免重复定义

// 模拟 matchMedia
globalObj.matchMedia = vi.fn(() => ({
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
globalObj.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
globalObj.URL.revokeObjectURL = vi.fn()

// 遵循测试宪法第6条：只模拟外部边界（Canvas API）
// 完善Canvas 2D上下文的rect方法模拟

// 获取Canvas 2D上下文时，确保包含rect方法
const originalGetContext = HTMLCanvasElement.prototype.getContext
HTMLCanvasElement.prototype.getContext = function(contextType: string) {
  if (contextType === '2d') {
    const ctx = originalGetContext.call(this, contextType) || {}
    
    // 确保rect方法存在（zrender需要）
    if (!ctx.rect) {
      ctx.rect = vi.fn((x: number, y: number, width: number, height: number) => {
        // 模拟rect方法，遵循测试宪法第6条：只模拟外部边界
        return true
      })
    }
    
    // 确保clip方法存在（zrender需要）
    if (!ctx.clip) {
      ctx.clip = vi.fn(() => {
        // 模拟clip方法，遵循测试宪法第6条：只模拟外部边界
        return true
      })
    }
    
    return ctx
  }
  
  return originalGetContext.call(this, contextType)
}

export { mockCanvas }

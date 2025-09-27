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

// 模拟 ImageData
global.ImageData = class ImageData {
  constructor(public data: Uint8ClampedArray, public width: number, public height: number) {}
}

// 模拟 OffscreenCanvas
global.OffscreenCanvas = class OffscreenCanvas {
  constructor(public width: number, public height: number) {}
  getContext = mockCanvas.getContext
  toDataURL = mockCanvas.toDataURL
  toBlob = mockCanvas.toBlob
}

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
}))

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

// 模拟 createElement 以返回模拟的 Canvas
const originalCreateElement = document.createElement
document.createElement = vi.fn((tagName: string) => {
  if (tagName.toLowerCase() === 'canvas') {
    return mockCanvas as HTMLCanvasElement
  }
  return originalCreateElement.call(document, tagName)
})

export { mockCanvas }

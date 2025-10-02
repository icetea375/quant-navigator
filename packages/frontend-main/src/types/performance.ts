/**
 * 性能监控相关类型定义
 * 为performance.ts提供精确的类型定义
 */

// 性能资源时间类型
export interface PerformanceResourceTiming extends PerformanceEntry {
  transferSize: number
  encodedBodySize: number
  decodedBodySize: number
  responseStart: number
  responseEnd: number
  requestStart: number
  connectStart: number
  connectEnd: number
  domainLookupStart: number
  domainLookupEnd: number
  redirectStart: number
  redirectEnd: number
  secureConnectionStart: number
}

// 内存信息类型
export interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

// 性能指标类型
export interface PerformanceMetrics {
  loadTime: number
  domContentLoaded: number
  firstPaint: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  firstInputDelay: number
  cumulativeLayoutShift: number
}

// 资源加载时间类型
export interface ResourceTiming {
  name: string
  duration: number
  size: number
}

// 长任务类型
export interface LongTask extends PerformanceEntry {
  duration: number
  startTime: number
  name: string
}

// 性能观察器配置类型
export interface PerformanceObserverConfig {
  entryTypes: string[]
  buffered?: boolean
}

// 性能工具接口类型
export interface PerformanceTools {
  getMetrics: () => PerformanceMetrics
  getMemoryInfo: () => MemoryInfo | null
  getResourceTiming: (resourceName: string) => ResourceTiming[]
  observeLongTasks: (callback: (task: LongTask) => void) => PerformanceObserver | null
}

// 代码分割工具类型
export interface CodeSplittingTools {
  loadModule: <T>(modulePath: string) => Promise<T>
  preloadModule: (modulePath: string) => Promise<void>
  isModuleLoaded: (modulePath: string) => boolean
}

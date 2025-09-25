// 性能优化工具
import { nextTick } from 'vue'

// 防抖函数
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }

    const callNow = immediate && !timeout

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)

    if (callNow) func(...args)
  }
}

// 节流函数
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// 懒加载图片
export const lazyLoadImage = (img: HTMLImageElement, src: string) => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          img.src = src
          observer.unobserve(img)
        }
      })
    },
    { threshold: 0.1 }
  )

  observer.observe(img)
}

// 虚拟滚动配置
export const virtualScrollConfig = {
  itemHeight: 50,
  containerHeight: 400,
  overscan: 5,
}

// 图片压缩
export const compressImage = (
  file: File,
  maxWidth = 800,
  maxHeight = 600,
  quality = 0.8
): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      let { width, height } = img

      // 计算新尺寸
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height

      ctx?.drawImage(img, 0, 0, width, height)
      canvas.toBlob(resolve, 'image/jpeg', quality)
    }

    img.src = URL.createObjectURL(file)
  })
}

// 内存使用监控
export const memoryMonitor = {
  getMemoryInfo: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
      }
    }
    return null
  },

  logMemoryUsage: () => {
    const memory = memoryMonitor.getMemoryInfo()
    if (memory) {
      console.log(`内存使用: ${memory.used}MB / ${memory.total}MB (限制: ${memory.limit}MB)`)
    }
  },
}

// 性能指标收集
export const performanceMetrics = {
  // 页面加载时间
  getPageLoadTime: () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      total: navigation.loadEventEnd - navigation.fetchStart,
    }
  },

  // 资源加载时间
  getResourceTiming: (resourceName: string) => {
    const resources = performance.getEntriesByName(resourceName)
    return resources.map((resource) => ({
      name: resource.name,
      duration: resource.duration,
      size: (resource as any).transferSize || 0,
    }))
  },

  // 长任务检测
  observeLongTasks: (callback: (task: PerformanceEntry) => void) => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(callback)
      })
      observer.observe({ entryTypes: ['longtask'] })
      return observer
    }
    return null
  },
}

// 代码分割工具
export const codeSplitting = {
  // 动态导入组件
  loadComponent: async (componentPath: string) => {
    try {
      const module = await import(/* @vite-ignore */ componentPath)
      return module.default || module
    } catch (error) {
      console.error(`Failed to load component: ${componentPath}`, error)
      return null
    }
  },

  // 预加载组件
  preloadComponent: (componentPath: string) => {
    const link = document.createElement('link')
    link.rel = 'modulepreload'
    link.href = componentPath
    document.head.appendChild(link)
  },
}

// 缓存管理
export const cacheManager = {
  // 内存缓存
  memoryCache: new Map<string, { data: any; timestamp: number; ttl: number }>(),

  set: (key: string, data: any, ttl = 300000) => { // 默认5分钟
    cacheManager.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  },

  get: (key: string) => {
    const item = cacheManager.memoryCache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > item.ttl) {
      cacheManager.memoryCache.delete(key)
      return null
    }

    return item.data
  },

  clear: () => {
    cacheManager.memoryCache.clear()
  },

  // 清理过期缓存
  cleanup: () => {
    const now = Date.now()
    for (const [key, item] of cacheManager.memoryCache.entries()) {
      if (now - item.timestamp > item.ttl) {
        cacheManager.memoryCache.delete(key)
      }
    }
  },
}

// 批量操作优化
export const batchOperations = {
  // 批量DOM更新
  batchDOMUpdates: (updates: (() => void)[]) => {
    nextTick(() => {
      updates.forEach(update => update())
    })
  },

  // 批量API请求
  batchAPIRequests: async <T>(
    requests: (() => Promise<T>)[],
    batchSize = 5
  ): Promise<T[]> => {
    const results: T[] = []
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize)
      const batchResults = await Promise.allSettled(batch.map(req => req()))
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        }
      })
    }
    
    return results
  },
}

// 性能优化建议
export const performanceTips = {
  // 检查大图片
  checkLargeImages: () => {
    const images = document.querySelectorAll('img')
    const largeImages: HTMLImageElement[] = []
    
    images.forEach(img => {
      if (img.naturalWidth > 1920 || img.naturalHeight > 1080) {
        largeImages.push(img)
      }
    })
    
    if (largeImages.length > 0) {
      console.warn(`发现 ${largeImages.length} 张大图片，建议优化`)
    }
    
    return largeImages
  },

  // 检查未使用的CSS
  checkUnusedCSS: () => {
    const stylesheets = document.styleSheets
    let unusedRules = 0
    
    Array.from(stylesheets).forEach(sheet => {
      try {
        const rules = sheet.cssRules || sheet.rules
        Array.from(rules).forEach(rule => {
          if (rule.type === CSSRule.STYLE_RULE) {
            const styleRule = rule as CSSStyleRule
            const selector = styleRule.selectorText
            if (selector && !document.querySelector(selector)) {
              unusedRules++
            }
          }
        })
      } catch (e) {
        // 跨域样式表无法访问
      }
    })
    
    if (unusedRules > 0) {
      console.warn(`发现 ${unusedRules} 条未使用的CSS规则`)
    }
  },

  // 检查内存泄漏
  checkMemoryLeaks: () => {
    const memory = memoryMonitor.getMemoryInfo()
    if (memory && memory.used > memory.limit * 0.8) {
      console.warn('内存使用率过高，可能存在内存泄漏')
    }
  },
}

// 初始化性能监控
export const initPerformanceMonitoring = () => {
  // 定期清理缓存
  setInterval(cacheManager.cleanup, 60000) // 每分钟清理一次

  // 监控长任务
  performanceMetrics.observeLongTasks((task) => {
    console.warn(`检测到长任务: ${task.duration}ms`)
  })

  // 页面卸载时清理
  window.addEventListener('beforeunload', () => {
    cacheManager.clear()
  })
}


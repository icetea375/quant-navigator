// 测试工具函数 - 遵循测试宪法第16条：工具文件必须放在 tools/scripts/ 目录
// 遵循测试宪法第6条：只模拟外部边界，不模拟内部逻辑
// 遵循测试宪法第4条：简单性优先，选择"足够好"的解决方案

/**
 * 设置测试环境
 * 遵循测试宪法第6条：只模拟外部边界
 * 遵循测试宪法第4条：简单性优先 - 不依赖复杂的Vue Router
 */
export function setupTestEnvironment() {
  // 简单的测试环境设置，不依赖外部包
  console.log('测试环境已设置')
  return {}
}

/**
 * 创建测试包装器
 * 遵循测试宪法第7条：断言必须"精确且有意义"
 * 遵循测试宪法第4条：简单性优先
 */
export function createTestWrapper(component: any, options: any = {}) {
  return {
    component,
    options: {
      ...options
    }
  }
}

/**
 * 模拟API响应
 * 遵循测试宪法第6条：只模拟外部边界
 */
export function mockApiResponse(data: any, delay = 0) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}

/**
 * 模拟API错误
 * 遵循测试宪法第6条：只模拟外部边界
 */
export function mockApiError(message: string) {
  return Promise.reject(new Error(message))
}
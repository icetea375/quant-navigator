// API测试工具
import { publicApi, privateApi, adminApi, authApi } from '@/services'

// API测试配置
export const API_TEST_CONFIG = {
  // 测试用户凭据
  testUser: {
    username: 'testuser',
    password: 'testpass123',
    email: 'test@example.com'
  },
  
  // API端点测试
  endpoints: {
    public: [
      { name: '获取市场快报', method: () => publicApi.getMarketBriefing() },
      { name: '获取热点复盘', method: () => publicApi.getHotspotAttribution() }
    ],
    private: [
      { name: '获取股票池列表', method: () => privateApi.getStockPools() },
      { name: '获取专属盘前雷达', method: () => privateApi.getMyBriefing() },
      { name: '获取持仓异动复盘', method: () => privateApi.getMyAttribution() }
    ],
    admin: [
      { name: '获取系统状态', method: () => adminApi.getSystemStatus() },
      { name: '获取AI引擎统计', method: () => adminApi.getAIEngineStats() },
      { name: '获取系统配置', method: () => adminApi.getSystemConfig() }
    ]
  }
}

// API连接测试
export const testApiConnection = async () => {
  console.log('🔍 开始API连接测试...')
  
  const results = {
    public: [] as Array<{ name: string; success: boolean; error?: string }>,
    private: [] as Array<{ name: string; success: boolean; error?: string }>,
    admin: [] as Array<{ name: string; success: boolean; error?: string }>
  }

  // 测试公共API
  console.log('📡 测试公共API...')
  for (const endpoint of API_TEST_CONFIG.endpoints.public) {
    try {
      await endpoint.method()
      results.public.push({ name: endpoint.name, success: true })
      console.log(`✅ ${endpoint.name}`)
    } catch (error: any) {
      results.public.push({ name: endpoint.name, success: false, error: error.message })
      console.log(`❌ ${endpoint.name}: ${error.message}`)
    }
  }

  // 测试私人API（需要先登录）
  console.log('🔐 测试私人API...')
  try {
    // 尝试登录
    await authApi.login(API_TEST_CONFIG.testUser)
    console.log('✅ 用户登录成功')
    
    for (const endpoint of API_TEST_CONFIG.endpoints.private) {
      try {
        await endpoint.method()
        results.private.push({ name: endpoint.name, success: true })
        console.log(`✅ ${endpoint.name}`)
      } catch (error: any) {
        results.private.push({ name: endpoint.name, success: false, error: error.message })
        console.log(`❌ ${endpoint.name}: ${error.message}`)
      }
    }
  } catch (error: any) {
    console.log(`❌ 用户登录失败: ${error.message}`)
    results.private = API_TEST_CONFIG.endpoints.private.map(endpoint => ({
      name: endpoint.name,
      success: false,
      error: '登录失败'
    }))
  }

  // 测试管理员API
  console.log('👑 测试管理员API...')
  for (const endpoint of API_TEST_CONFIG.endpoints.admin) {
    try {
      await endpoint.method()
      results.admin.push({ name: endpoint.name, success: true })
      console.log(`✅ ${endpoint.name}`)
    } catch (error: any) {
      results.admin.push({ name: endpoint.name, success: false, error: error.message })
      console.log(`❌ ${endpoint.name}: ${error.message}`)
    }
  }

  // 输出测试结果
  console.log('\n📊 API测试结果汇总:')
  console.log('公共API:', results.public.filter(r => r.success).length, '/', results.public.length)
  console.log('私人API:', results.private.filter(r => r.success).length, '/', results.private.length)
  console.log('管理员API:', results.admin.filter(r => r.success).length, '/', results.admin.length)

  return results
}

// 模拟数据生成器（用于开发测试）
export const generateMockData = {
  marketBriefing: () => ({
    title: '今日市场快报',
    content: '市场整体表现平稳，科技股领涨，建议关注新能源板块。',
    publish_time: new Date().toISOString()
  }),

  hotspotAttribution: () => [
    {
      hotspot_name: '新能源板块',
      summary: '政策利好推动新能源板块上涨',
      snapshots: [
        {
          timestamp: new Date().toISOString(),
          change_pct: 3.2,
          volume: 1000000,
          attribution: '政策利好 + 资金流入'
        }
      ]
    }
  ],

  stockPool: () => ({
    id: '1',
    name: '我的股票池',
    item_count: 5,
    items: [
      { id: '1', code: '000001', name: '平安银行', type: 'stock' },
      { id: '2', code: '000002', name: '万科A', type: 'stock' }
    ]
  }),

  myBriefing: () => ({
    title: '您的专属盘前雷达',
    content: '基于您的持仓分析，今日重点关注科技和消费板块。',
    publish_time: new Date().toISOString(),
    personalized_insights: [
      {
        type: 'opportunity' as const,
        message: '您持有的科技股有望受益于政策利好',
        confidence: 0.85
      }
    ]
  }),

  myAttribution: () => [
    {
      target_name: '平安银行',
      change_pct: 2.5,
      snapshot: {
        timestamp: new Date().toISOString(),
        volume: 500000,
        attribution: '业绩超预期 + 资金净流入',
        confidence: 0.78
      }
    }
  ],

  systemStatus: () => ({
    data_pipeline_status: 'running' as const,
    llm_service_health: 'healthy' as const,
    db_connection: 'connected' as const,
    last_update: new Date().toISOString(),
    error_count: 0,
    warning_count: 2
  })
}

// 开发环境API模拟
export const enableApiMocking = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🎭 启用API模拟模式')
    
    // 这里可以集成mock服务，如MSW (Mock Service Worker)
    // 或者简单的拦截器来返回模拟数据
  }
}


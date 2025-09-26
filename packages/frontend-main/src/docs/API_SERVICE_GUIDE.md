# API服务使用指南

## 📋 概述

本文档详细说明了量化导航仪前端应用的API服务实现，完全符合RESTful最佳实践和项目文档规范。

## 🏗️ 架构设计

### 1. API分层结构

```
src/services/
├── index.ts          # 统一导出和基础配置
├── public.ts         # 公共API服务
├── private.ts        # 私人API服务
├── admin.ts          # 管理员API服务
├── auth.ts           # 认证API服务
└── market.ts         # 市场数据API服务（整合版）
```

### 2. 类型定义

```
src/types/
├── api.ts            # API响应和请求类型
├── user.ts           # 用户相关类型
└── market.ts         # 市场数据相关类型
```

## 🔧 核心功能

### 1. 统一的HTTP客户端

- **自动认证**: 自动添加JWT Token到请求头
- **错误处理**: 统一的错误处理和用户提示
- **加载状态**: 自动管理loading状态
- **重试机制**: 网络错误自动重试
- **请求拦截**: 统一的请求和响应拦截

### 2. 类型安全

- **完整的TypeScript类型定义**
- **API响应类型验证**
- **请求参数类型检查**
- **编译时错误检测**

### 3. 模块化设计

- **按功能模块分离API服务**
- **清晰的职责划分**
- **易于维护和扩展**

## 📚 API服务详解

### 1. 公共API (`publicApi`)

无需认证的公共接口，服务于市场雷达页面。

```typescript
import { publicApi } from '@/services'

// 获取市场快报
const briefing = await publicApi.getMarketBriefing('2024-01-15')

// 获取热点复盘
const hotspots = await publicApi.getHotspotAttribution('2024-01-15')
```

**特点:**
- 无需认证
- 数据公开
- 响应快速

### 2. 私人API (`privateApi`)

需要JWT认证的私人接口，服务于AI投研助理功能。

```typescript
import { privateApi } from '@/services'

// 股票池管理
const pools = await privateApi.getStockPools()
const newPool = await privateApi.createStockPool({ name: '我的股票池' })

// 个性化分析
const myBriefing = await privateApi.getMyBriefing()
const myAttribution = await privateApi.getMyAttribution()
```

**特点:**
- 需要JWT认证
- 个性化数据
- 用户权限控制

### 3. 管理员API (`adminApi`)

需要管理员权限的接口，服务于系统大脑控制台。

```typescript
import { adminApi } from '@/services'

// 系统状态
const status = await adminApi.getSystemStatus()

// 数据管道监控
const logs = await adminApi.getDataPipelineLogs({ limit: 100 })

// 系统配置
const config = await adminApi.getSystemConfig()
await adminApi.updateSystemConfig({ z_score_threshold: 3.0 })
```

**特点:**
- 需要管理员权限
- 系统级操作
- 高权限控制

### 4. 认证API (`authApi`)

用户认证相关接口。

```typescript
import { authApi } from '@/services'

// 用户注册
const registerResult = await authApi.register({
  username: 'testuser',
  password: 'password123',
  email: 'test@example.com'
})

// 用户登录
const loginResult = await authApi.login({
  username: 'testuser',
  password: 'password123'
})
```

## 🛠️ 使用示例

### 1. 在Vue组件中使用

```vue
<template>
  <div>
    <el-button @click="loadMarketData" :loading="loading">
      加载市场数据
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { publicApi } from '@/services'

const loading = ref(false)

const loadMarketData = async () => {
  loading.value = true
  try {
    const briefing = await publicApi.getMarketBriefing()
    console.log('市场快报:', briefing)
  } catch (error) {
    console.error('加载失败:', error)
  } finally {
    loading.value = false
  }
}
</script>
```

### 2. 在Pinia Store中使用

```typescript
import { defineStore } from 'pinia'
import { publicApi, privateApi } from '@/services'

export const useMarketStore = defineStore('market', () => {
  const marketData = ref(null)
  const loading = ref(false)

  const loadMarketData = async () => {
    loading.value = true
    try {
      const data = await publicApi.getMarketBriefing()
      marketData.value = data
    } catch (error) {
      console.error('Failed to load market data:', error)
    } finally {
      loading.value = false
    }
  }

  return {
    marketData,
    loading,
    loadMarketData
  }
})
```

### 3. 错误处理

```typescript
import { publicApi } from '@/services'

try {
  const data = await publicApi.getMarketBriefing()
} catch (error) {
  // 错误已经被拦截器处理，这里可以添加额外的错误处理逻辑
  if (error.code === 'NETWORK_ERROR') {
    // 处理网络错误
  } else if (error.code === 'UNAUTHORIZED') {
    // 处理认证错误
  }
}
```

## 🔍 API测试

### 1. 使用测试工具

```typescript
import { testApiConnection, generateMockData } from '@/utils/api-test'

// 测试API连接
const results = await testApiConnection()
console.log('测试结果:', results)

// 生成模拟数据
const mockBriefing = generateMockData.marketBriefing()
```

### 2. 开发环境模拟

```typescript
import { enableApiMocking } from '@/utils/api-test'

// 在开发环境中启用API模拟
if (process.env.NODE_ENV === 'development') {
  enableApiMocking()
}
```

## 📖 API文档

### 1. 生成API文档

```typescript
import { generateApiDocs, exportApiDocsAsMarkdown } from '@/utils/api-docs'

// 生成API文档
const docs = generateApiDocs()

// 导出为Markdown
const markdown = exportApiDocsAsMarkdown()
console.log(markdown)
```

### 2. 查看API文档

API文档包含以下内容：
- 完整的接口定义
- 请求参数说明
- 响应格式示例
- 错误码说明
- 认证方式说明

## 🚀 最佳实践

### 1. 错误处理

- 使用try-catch包装API调用
- 根据错误类型进行不同处理
- 向用户显示友好的错误信息

### 2. 加载状态

- 使用loading状态提升用户体验
- 避免重复请求
- 合理设置超时时间

### 3. 缓存策略

- 对不经常变化的数据进行缓存
- 使用适当的缓存过期时间
- 避免缓存敏感数据

### 4. 类型安全

- 始终使用TypeScript类型
- 验证API响应数据
- 使用类型断言时要谨慎

## 🔧 配置说明

### 1. 环境变量

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_DATA_SERVICE_URL=http://localhost:8000
```

### 2. 请求配置

```typescript
// 自定义请求配置
const data = await publicApi.getMarketBriefing({
  showLoading: false,  // 不显示loading
  timeout: 5000,       // 5秒超时
  retries: 2           // 重试2次
})
```

## 📝 注意事项

1. **认证状态**: 确保在调用私人API前用户已登录
2. **权限检查**: 管理员API需要管理员权限
3. **错误处理**: 始终处理API调用可能的错误
4. **性能优化**: 避免频繁的API调用，使用适当的缓存
5. **类型安全**: 保持TypeScript类型的准确性

## 🆘 故障排除

### 常见问题

1. **401 Unauthorized**: 检查JWT Token是否有效
2. **403 Forbidden**: 检查用户权限是否足够
3. **网络错误**: 检查网络连接和后端服务状态
4. **类型错误**: 检查API响应类型定义是否正确

### 调试技巧

1. 使用浏览器开发者工具查看网络请求
2. 检查控制台错误信息
3. 使用API测试工具验证接口
4. 查看后端服务日志

---

**更新时间**: 2024年1月
**版本**: v1.0.0
**维护者**: 开发团队

// API服务统一导出
export { request } from './http'
export { publicApi } from './public'
export { privateApi } from './private'
export { adminApi } from './admin'
export { authApi } from './auth'
export { marketApi, privateApi as marketPrivateApi } from './market'
export { arbitrationService as arbitrationApi } from './api/arbitrationService'

// 重新导出类型
export type * from '@/types/api'
export type * from '@/types/user'
export type * from '@/types/market'
export type * from '@/types/arbitration'

// 解决AuthResponse重复导出问题
export type { AuthResponse as AuthApiResponse } from '@/types/api'

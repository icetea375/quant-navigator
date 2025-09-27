// 重新导出核心类型，确保向后兼容
export type { User, LoginRequest } from './core'

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

// AuthResponse 使用 api.ts 中的定义

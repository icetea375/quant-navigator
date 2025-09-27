import { request } from './http'
import type { User } from '@/types/user'
import type { AuthResponse } from '@/types/api'

// 认证API服务 - 符合文档规范
export const authApi = {
  // 用户注册 - 符合文档规范
  register: (data: { username: string; password: string; email?: string }): Promise<AuthResponse> => {
    return request.post<AuthResponse>('/private/auth/register', data)
  },

  // 用户登录 - 符合文档规范
  login: (data: { username: string; password: string }): Promise<AuthResponse> => {
    return request.post<AuthResponse>('/private/auth/login', data)
  },

  // 刷新token
  refreshToken: (): Promise<{ token: string }> => {
    return request.post<{ token: string }>('/auth/refresh')
  },

  // 登出
  logout: (): Promise<void> => {
    return request.post<void>('/auth/logout')
  },

  // 获取当前用户信息
  getCurrentUser: (): Promise<User> => {
    return request.get<User>('/auth/me')
  },

  // 更新用户信息
  updateProfile: (data: Partial<User>): Promise<User> => {
    return request.put<User>('/auth/profile', data)
  },

  // 修改密码
  changePassword: (data: { oldPassword: string; newPassword: string }): Promise<void> => {
    return request.put<void>('/auth/password', data)
  },

  // 忘记密码
  forgotPassword: (email: string): Promise<void> => {
    return request.post<void>('/auth/forgot-password', { email })
  },

  // 重置密码
  resetPassword: (data: { token: string; password: string }): Promise<void> => {
    return request.post<void>('/auth/reset-password', data)
  },

  // 验证邮箱
  verifyEmail: (token: string): Promise<void> => {
    return request.post<void>('/auth/verify-email', { token })
  },

  // 重新发送验证邮件
  resendVerification: (): Promise<void> => {
    return request.post<void>('/auth/resend-verification')
  },

  // 检查token有效性
  validateToken: (): Promise<{ valid: boolean; user?: User }> => {
    return request.get<{ valid: boolean; user?: User }>('/auth/validate')
  },
}

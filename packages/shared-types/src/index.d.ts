/**
 * 共享类型库入口文件
 * 量化导航仪项目的类型契约宪法
 * 
 * 这是所有模块关于业务数据结构的单一事实来源
 * 任何模块都必须通过此文件导入共享类型定义
 */

// 导出事件相关类型
export * from './events';

// 导出量化信号相关类型
export * from './quant-signals';

// 导出工作流相关类型
export * from './workflow';

// 导出通用类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DatabaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface ConfigItem extends DatabaseEntity {
  config_id: string;
  config_type: string;
  config_key: string;
  config_value: string;
  description: string;
  is_active: boolean;
  version: number;
}

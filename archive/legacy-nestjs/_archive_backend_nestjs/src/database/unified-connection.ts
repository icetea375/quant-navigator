/**
 * 统一数据库连接
 * 支持SQLite和PostgreSQL的统一接口
 */

import { DatabaseAdapter } from './database-adapter';
import { logger } from '../utils/logger';

export class UnifiedDatabaseConnection {
  private static instance: UnifiedDatabaseConnection;
  private adapter: DatabaseAdapter;

  constructor() {
    // 强制使用PostgreSQL
    this.adapter = new DatabaseAdapter({
      type: 'postgresql',
      postgresql: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'news_analysis',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password'
      }
    });
  }

  public static getInstance(): UnifiedDatabaseConnection {
    if (!UnifiedDatabaseConnection.instance) {
      UnifiedDatabaseConnection.instance = new UnifiedDatabaseConnection();
    }
    return UnifiedDatabaseConnection.instance;
  }

  /**
   * 获取数据库连接
   */
  public getConnection(): any {
    return this.adapter.getConnection();
  }

  /**
   * 执行查询
   */
  public async query(text: string, params?: any[]): Promise<any> {
    return await this.adapter.query(text, params);
  }

  /**
   * 开始事务
   */
  public async beginTransaction(): Promise<any> {
    return await this.adapter.beginTransaction();
  }

  /**
   * 提交事务
   */
  public async commitTransaction(transaction: any): Promise<void> {
    return await this.adapter.commitTransaction(transaction);
  }

  /**
   * 回滚事务
   */
  public async rollbackTransaction(transaction: any): Promise<void> {
    return await this.adapter.rollbackTransaction(transaction);
  }

  /**
   * 关闭连接
   */
  public async close(): Promise<void> {
    return await this.adapter.close();
  }

  /**
   * 健康检查
   */
  public async healthCheck(): Promise<boolean> {
    return await this.adapter.healthCheck();
  }

  /**
   * 获取当前数据库类型
   */
  public getCurrentType(): 'sqlite' | 'postgresql' {
    return this.adapter.getCurrentType();
  }

  /**
   * 切换数据库类型
   */
  public switchDatabase(type: 'sqlite' | 'postgresql'): void {
    this.adapter.switchDatabase(type);
  }

  /**
   * 执行SQLite查询（兼容性方法）
   */
  public async querySQLite(text: string, params?: any[]): Promise<any> {
    const originalType = this.getCurrentType();
    this.switchDatabase('sqlite');
    try {
      return await this.query(text, params);
    } finally {
      this.switchDatabase(originalType);
    }
  }

  /**
   * 执行PostgreSQL查询（兼容性方法）
   */
  public async queryPostgres(text: string, params?: any[]): Promise<any> {
    const originalType = this.getCurrentType();
    this.switchDatabase('postgresql');
    try {
      return await this.query(text, params);
    } finally {
      this.switchDatabase(originalType);
    }
  }
}

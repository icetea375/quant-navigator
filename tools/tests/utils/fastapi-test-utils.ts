/**
 * FastAPI 测试工具函数
 * 为 FastAPI + Python 后端提供专用的测试辅助工具
 */

import { TestClient } from 'fastapi/testclient';
import { FastAPI } from 'fastapi';

export interface FastAPITestConfig {
  baseUrl: string;
  host: string;
  port: number;
  healthEndpoint: string;
  docsEndpoint: string;
  redocEndpoint: string;
}

export class FastAPITestUtils {
  private config: FastAPITestConfig;
  private client: TestClient | null = null;

  constructor(config?: Partial<FastAPITestConfig>) {
    this.config = {
      baseUrl: process.env.API_BASE_URL || 'http://localhost:8000',
      host: process.env.FASTAPI_HOST || 'localhost',
      port: parseInt(process.env.FASTAPI_PORT || '8000'),
      healthEndpoint: '/health',
      docsEndpoint: '/docs',
      redocEndpoint: '/redoc',
      ...config
    };
  }

  /**
   * 创建 FastAPI 测试客户端
   */
  createTestClient(app: FastAPI): TestClient {
    this.client = new TestClient(app);
    return this.client;
  }

  /**
   * 等待 FastAPI 服务启动
   */
  async waitForService(timeout = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(`${this.config.baseUrl}${this.config.healthEndpoint}`);
        if (response.ok) {
          console.log('✅ FastAPI 服务已启动');
          return true;
        }
      } catch (error) {
        // 服务未启动，继续等待
      }
      await this.sleep(1000);
    }
    
    throw new Error(`FastAPI 服务启动超时 (${timeout}ms)`);
  }

  /**
   * 检查服务健康状态
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}${this.config.healthEndpoint}`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * 创建测试数据
   */
  createTestData(type: string, overrides: Record<string, any> = {}): any {
    const baseData = {
      // 用户数据
      user: {
        id: 'test-user-id',
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        created_at: new Date().toISOString(),
        ...overrides
      },

      // 股票数据
      stock: {
        code: '000001',
        name: '平安银行',
        market: 'SZ',
        industry: '银行',
        created_at: new Date().toISOString(),
        ...overrides
      },

      // 报告数据
      report: {
        id: 'test-report-id',
        stock_code: '000001.SZ',
        date: '2025-01-17',
        content: 'Test report content',
        report_type: 'fact_analysis',
        created_at: new Date().toISOString(),
        ...overrides
      },

      // 仲裁案件数据
      arbitration_case: {
        case_id: 'ARB_000001_20250117',
        report_type: 'fact_analysis',
        target_code: '000001.SZ',
        qwen_analysis: {
          analysis: '基于财务数据分析，该股票基本面表现稳定',
          confidence: 0.85,
          reasoning: '基本面稳定，建议持有'
        },
        doubao_analysis: {
          sentiment: 'positive',
          score: 0.75,
          reasoning: '市场情绪谨慎，建议观望'
        },
        disagreement_score: 0.65,
        status: 'pending',
        consensus_summary: '两家AI均认为公司有投资价值',
        conflict_summary: 'Qwen侧重基本面，豆包侧重短期市场情绪',
        priority_score: 0.72,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides
      },

      // 认证数据
      auth: {
        username: 'testuser',
        password: 'testpassword123',
        email: 'test@example.com',
        ...overrides
      }
    };

    return baseData[type] || overrides;
  }

  /**
   * 创建测试用户
   */
  async createTestUser(userData?: any): Promise<any> {
    const user = this.createTestData('user', userData);
    
    try {
      const response = await fetch(`${this.config.baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });

      if (response.ok) {
        return await response.json();
      } else {
        // 如果用户已存在，尝试登录
        return await this.loginTestUser(user);
      }
    } catch (error) {
      console.warn('创建测试用户失败:', error);
      return user;
    }
  }

  /**
   * 登录测试用户
   */
  async loginTestUser(userData?: any): Promise<any> {
    const auth = this.createTestData('auth', userData);
    
    try {
      const response = await fetch(`${this.config.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auth)
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('登录测试用户失败:', error);
    }
    
    return null;
  }

  /**
   * 清理测试数据
   */
  async cleanupTestData(): Promise<void> {
    try {
      await fetch(`${this.config.baseUrl}/test/cleanup`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.warn('清理测试数据失败:', error);
    }
  }

  /**
   * 创建测试案件
   */
  async createTestCase(caseData?: any): Promise<any> {
    const case_ = this.createTestData('arbitration_case', caseData);
    
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/admin/arbitration-cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(case_)
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('创建测试案件失败:', error);
    }
    
    return case_;
  }

  /**
   * 获取测试案件列表
   */
  async getTestCases(params?: any): Promise<any> {
    const queryParams = new URLSearchParams(params || {}).toString();
    const url = `${this.config.baseUrl}/api/v1/admin/arbitration-cases${queryParams ? `?${queryParams}` : ''}`;
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('获取测试案件失败:', error);
    }
    
    return { cases: [], total: 0 };
  }

  /**
   * 等待异步操作
   */
  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 生成随机测试ID
   */
  generateTestId(prefix = 'TEST'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 验证 FastAPI 响应格式
   */
  validateFastAPIResponse(response: any): boolean {
    return response && typeof response === 'object';
  }

  /**
   * 获取配置信息
   */
  getConfig(): FastAPITestConfig {
    return { ...this.config };
  }

  /**
   * 关闭测试客户端
   */
  close(): void {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
  }
}

// 导出默认实例
export const fastapiTestUtils = new FastAPITestUtils();

// 导出便捷函数
export const createFastAPITestUtils = (config?: Partial<FastAPITestConfig>) => 
  new FastAPITestUtils(config);

export const waitForFastAPIService = (timeout?: number) => 
  fastapiTestUtils.waitForService(timeout);

export const createTestData = (type: string, overrides?: Record<string, any>) => 
  fastapiTestUtils.createTestData(type, overrides);

export const createTestUser = (userData?: any) => 
  fastapiTestUtils.createTestUser(userData);

export const cleanupTestData = () => 
  fastapiTestUtils.cleanupTestData();

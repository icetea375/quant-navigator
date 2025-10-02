/**
 * E2E测试全局设置
 * 符合"测试宪法"第3.3条要求
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 开始E2E测试全局设置...');

  // 启动浏览器
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // 等待前端服务启动
    console.log('⏳ 等待前端服务启动...');
    await page.goto(process.env.E2E_BASE_URL || 'http://localhost:3000');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    console.log('✅ 前端服务已启动');

    // 等待后端API服务启动
    console.log('⏳ 等待后端API服务启动...');
    const apiResponse = await page.request.get(`${process.env.API_BASE_URL || 'http://localhost:3001'}/api/health`);
    if (apiResponse.ok()) {
      console.log('✅ 后端API服务已启动');
    } else {
      throw new Error('后端API服务启动失败');
    }

    // 等待数据库连接
    console.log('⏳ 等待数据库连接...');
    const dbResponse = await page.request.get(`${process.env.API_BASE_URL || 'http://localhost:3001'}/api/health/db`);
    if (dbResponse.ok()) {
      console.log('✅ 数据库连接正常');
    } else {
      throw new Error('数据库连接失败');
    }

    // 清理测试数据
    console.log('🧹 清理测试数据...');
    await page.request.delete(`${process.env.API_BASE_URL || 'http://localhost:3001'}/api/test/cleanup`);
    console.log('✅ 测试数据清理完成');

    // 创建测试用户（如果需要）
    console.log('👤 创建测试用户...');
    await createTestUser(page);
    console.log('✅ 测试用户创建完成');

    console.log('🎉 E2E测试全局设置完成！');

  } catch (error) {
    console.error('❌ E2E测试全局设置失败:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function createTestUser(page: { goto: (url: string) => Promise<void>; fill: (selector: string, value: string) => Promise<void>; click: (selector: string) => Promise<void>; waitForSelector: (selector: string) => Promise<void> }) {
  try {
    // 创建测试用户
    const userData = {
      username: 'e2e-test-user',
      email: 'e2e-test@example.com',
      password: 'test-password-123',
      role: 'admin'
    };

    const response = await page.request.post(`${process.env.API_BASE_URL || 'http://localhost:3001'}/api/auth/register`, {
      data: userData
    });

    if (!response.ok()) {
      // 如果用户已存在，尝试登录
      const loginResponse = await page.request.post(`${process.env.API_BASE_URL || 'http://localhost:3001'}/api/auth/login`, {
        data: {
          username: userData.username,
          password: userData.password
        }
      });

      if (!loginResponse.ok()) {
        throw new Error('无法创建或登录测试用户');
      }
    }
  } catch (error) {
    console.log('测试用户创建/登录失败，继续执行测试:', error);
  }
}

export default globalSetup;

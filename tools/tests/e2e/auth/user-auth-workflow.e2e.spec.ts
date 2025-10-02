/**
 * 用户注册/登录流程端到端测试
 * 符合"测试宪法"第3.3条要求
 * 测试用户认证完整流程
 */

import { test, expect, Page } from '@playwright/test';

// 测试配置
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// 测试数据
const testUser = {
  email: 'e2e-test@example.com',
  password: 'TestPassword123!',
  name: 'E2E Test User'
};

const invalidUser = {
  email: 'invalid-email',
  password: '123',
  name: 'Invalid User'
};

test.describe('用户注册/登录流程E2E测试', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    // 创建新的浏览器页面
    page = await browser.newPage();

    // 设置视口大小
    await page.setViewportSize({ width: 1920, height: 1080 });

    // 清理测试数据
    await cleanupTestData(page);
  });

  test.afterEach(async () => {
    // 清理测试数据
    await cleanupTestData(page);
    await page.close();
  });

  test('应该能够完成完整的用户注册流程', async () => {
    // 步骤1: 导航到注册页面
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');

    // 步骤2: 验证注册页面加载
    await expect(page.locator('[data-testid="register-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="register-form"]')).toBeVisible();

    // 步骤3: 填写注册表单
    await page.locator('[data-testid="email-input"]').fill(testUser.email);
    await page.locator('[data-testid="password-input"]').fill(testUser.password);
    await page.locator('[data-testid="confirm-password-input"]').fill(testUser.password);
    await page.locator('[data-testid="name-input"]').fill(testUser.name);

    // 步骤4: 提交注册表单
    await page.locator('[data-testid="register-button"]').click();

    // 步骤5: 验证注册成功
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('注册成功');

    // 步骤6: 验证自动跳转到登录页面或仪表盘
    await page.waitForURL(/\/login|\/private/, { timeout: 10000 });

    // 步骤7: 验证用户已登录（如果跳转到仪表盘）
    if (page.url().includes('/private')) {
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-name"]')).toContainText(testUser.name);
    }
  });

  test('应该能够完成完整的用户登录流程', async () => {
    // 步骤1: 创建测试用户
    await createTestUser(page);

    // 步骤2: 导航到登录页面
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // 步骤3: 验证登录页面加载
    await expect(page.locator('[data-testid="login-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    // 步骤4: 填写登录表单
    await page.locator('[data-testid="email-input"]').fill(testUser.email);
    await page.locator('[data-testid="password-input"]').fill(testUser.password);

    // 步骤5: 提交登录表单
    await page.locator('[data-testid="login-button"]').click();

    // 步骤6: 验证登录成功
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('登录成功');

    // 步骤7: 验证跳转到仪表盘
    await page.waitForURL(/\/private/, { timeout: 10000 });

    // 步骤8: 验证用户信息显示
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-name"]')).toContainText(testUser.name);

    // 步骤9: 验证登录状态持久化
    await page.reload();
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('应该能够处理注册表单验证错误', async () => {
    // 导航到注册页面
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');

    // 测试空表单提交
    await page.locator('[data-testid="register-button"]').click();

    // 验证必填字段错误
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirm-password-error"]')).toBeVisible();

    // 测试无效邮箱格式
    await page.locator('[data-testid="email-input"]').fill(invalidUser.email);
    await page.locator('[data-testid="password-input"]').fill(testUser.password);
    await page.locator('[data-testid="confirm-password-input"]').fill(testUser.password);
    await page.locator('[data-testid="name-input"]').fill(testUser.name);
    await page.locator('[data-testid="register-button"]').click();

    // 验证邮箱格式错误
    await expect(page.locator('[data-testid="email-error"]')).toContainText('请输入正确的邮箱格式');

    // 测试密码长度不足
    await page.locator('[data-testid="email-input"]').fill(testUser.email);
    await page.locator('[data-testid="password-input"]').fill(invalidUser.password);
    await page.locator('[data-testid="confirm-password-input"]').fill(invalidUser.password);
    await page.locator('[data-testid="register-button"]').click();

    // 验证密码长度错误
    await expect(page.locator('[data-testid="password-error"]')).toContainText('密码长度不能少于6位');

    // 测试密码确认不匹配
    await page.locator('[data-testid="password-input"]').fill(testUser.password);
    await page.locator('[data-testid="confirm-password-input"]').fill('DifferentPassword123!');
    await page.locator('[data-testid="register-button"]').click();

    // 验证密码确认错误
    await expect(page.locator('[data-testid="confirm-password-error"]')).toContainText('两次输入的密码不一致');
  });

  test('应该能够处理登录表单验证错误', async () => {
    // 导航到登录页面
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // 测试空表单提交
    await page.locator('[data-testid="login-button"]').click();

    // 验证必填字段错误
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();

    // 测试无效邮箱格式
    await page.locator('[data-testid="email-input"]').fill(invalidUser.email);
    await page.locator('[data-testid="password-input"]').fill(testUser.password);
    await page.locator('[data-testid="login-button"]').click();

    // 验证邮箱格式错误
    await expect(page.locator('[data-testid="email-error"]')).toContainText('请输入正确的邮箱格式');

    // 测试密码长度不足
    await page.locator('[data-testid="email-input"]').fill(testUser.email);
    await page.locator('[data-testid="password-input"]').fill(invalidUser.password);
    await page.locator('[data-testid="login-button"]').click();

    // 验证密码长度错误
    await expect(page.locator('[data-testid="password-error"]')).toContainText('密码长度不能少于6位');
  });

  test('应该能够处理登录失败情况', async () => {
    // 导航到登录页面
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // 使用不存在的用户凭据
    await page.locator('[data-testid="email-input"]').fill('nonexistent@example.com');
    await page.locator('[data-testid="password-input"]').fill('WrongPassword123!');
    await page.locator('[data-testid="login-button"]').click();

    // 验证登录失败错误
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('用户名或密码错误');

    // 使用错误的密码
    await createTestUser(page);
    await page.locator('[data-testid="email-input"]').fill(testUser.email);
    await page.locator('[data-testid="password-input"]').fill('WrongPassword123!');
    await page.locator('[data-testid="login-button"]').click();

    // 验证密码错误
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('用户名或密码错误');
  });

  test('应该能够处理网络错误', async () => {
    // 模拟网络错误
    await page.route('**/api/auth/**', route => {
      route.abort('failed');
    });

    // 测试注册网络错误
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="email-input"]').fill(testUser.email);
    await page.locator('[data-testid="password-input"]').fill(testUser.password);
    await page.locator('[data-testid="confirm-password-input"]').fill(testUser.password);
    await page.locator('[data-testid="name-input"]').fill(testUser.name);
    await page.locator('[data-testid="register-button"]').click();

    // 验证网络错误处理
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('网络错误');

    // 测试登录网络错误
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="email-input"]').fill(testUser.email);
    await page.locator('[data-testid="password-input"]').fill(testUser.password);
    await page.locator('[data-testid="login-button"]').click();

    // 验证网络错误处理
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('网络错误');
  });

  test('应该能够完成用户登出流程', async () => {
    // 创建测试用户并登录
    await createTestUser(page);
    await loginUser(page);

    // 验证用户已登录
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    // 点击用户菜单
    await page.locator('[data-testid="user-menu"]').click();

    // 点击登出按钮
    await page.locator('[data-testid="logout-button"]').click();

    // 验证登出成功
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('已退出登录');

    // 验证跳转到登录页面
    await page.waitForURL(/\/login/, { timeout: 10000 });

    // 验证用户菜单不再显示
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
  });

  test('应该能够处理演示登录功能', async () => {
    // 导航到登录页面
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // 点击演示登录按钮
    await page.locator('[data-testid="demo-login-button"]').click();

    // 验证演示登录成功
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('演示登录成功');

    // 验证跳转到仲裁页面
    await page.waitForURL(/\/admin\/arbitration/, { timeout: 10000 });

    // 验证用户已登录
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('应该能够记住登录状态', async () => {
    // 创建测试用户并登录
    await createTestUser(page);
    await loginUser(page);

    // 验证用户已登录
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    // 刷新页面
    await page.reload();

    // 验证登录状态仍然保持
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    // 关闭并重新打开浏览器标签页
    await page.close();
    page = await page.context().newPage();
    await page.goto(`${BASE_URL}/private`);

    // 验证登录状态仍然保持
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
});

// 辅助函数
async function createTestUser(page: Page) {
  // 通过API创建测试用户
  const response = await page.request.post(`${API_BASE_URL}/api/auth/register`, {
    data: {
      username: testUser.email,
      email: testUser.email,
      password: testUser.password,
      name: testUser.name
    }
  });

  if (!response.ok()) {
    // 如果用户已存在，尝试登录
    const loginResponse = await page.request.post(`${API_BASE_URL}/api/auth/login`, {
      data: {
        username: testUser.email,
        password: testUser.password
      }
    });

    if (!loginResponse.ok()) {
      throw new Error('无法创建或登录测试用户');
    }
  }
}

async function loginUser(page: Page) {
  // 导航到登录页面
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  // 填写登录表单
  await page.locator('[data-testid="email-input"]').fill(testUser.email);
  await page.locator('[data-testid="password-input"]').fill(testUser.password);

  // 提交登录表单
  await page.locator('[data-testid="login-button"]').click();

  // 等待登录成功
  await page.waitForURL(/\/private/, { timeout: 10000 });
}

async function cleanupTestData(page: Page) {
  // 清理测试数据
  try {
    await page.request.delete(`${API_BASE_URL}/api/test/cleanup`);
  } catch (error) {
    console.log('清理测试数据失败:', error);
  }
}

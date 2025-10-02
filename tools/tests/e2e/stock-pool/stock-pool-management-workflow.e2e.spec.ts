/**
 * 股票池管理流程端到端测试
 * 符合"测试宪法"第3.3条要求
 * 测试股票池管理功能的完整工作流
 */

import { test, expect, Page } from '@playwright/test';

// 测试配置
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// 测试数据
const testStockPool = {
  name: 'E2E测试股票池',
  description: '这是一个用于E2E测试的股票池',
  symbols: ['000001.SZ', '000002.SZ', '600000.SH']
};

const testStockPool2 = {
  name: 'E2E测试股票池2',
  description: '这是第二个用于E2E测试的股票池',
  symbols: ['000858.SZ', '002415.SZ']
};

test.describe('股票池管理流程E2E测试', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    // 创建新的浏览器页面
    page = await browser.newPage();

    // 设置视口大小
    await page.setViewportSize({ width: 1920, height: 1080 });

    // 登录用户
    await loginUser(page);

    // 清理测试数据
    await cleanupTestData(page);
  });

  test.afterEach(async () => {
    // 清理测试数据
    await cleanupTestData(page);
    await page.close();
  });

  test('应该能够完成完整的股票池管理工作流', async () => {
    // 步骤1: 导航到股票池管理页面
    await page.goto(`${BASE_URL}/private/stock-pool-manager`);
    await page.waitForLoadState('networkidle');

    // 步骤2: 验证股票池管理页面加载
    await expect(page.locator('[data-testid="stock-pool-manager-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="page-title"]')).toContainText('股票池管理');

    // 步骤3: 验证空状态显示
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-message"]')).toContainText('暂无股票池');

    // 步骤4: 点击创建股票池按钮
    await page.locator('[data-testid="create-pool-button"]').click();

    // 步骤5: 验证创建对话框显示
    await expect(page.locator('[data-testid="pool-form-dialog"]')).toBeVisible();
    await expect(page.locator('[data-testid="pool-form-title"]')).toContainText('创建股票池');

    // 步骤6: 填写股票池表单
    await page.locator('[data-testid="pool-name-input"]').fill(testStockPool.name);
    await page.locator('[data-testid="pool-description-input"]').fill(testStockPool.description);

    // 步骤7: 添加股票代码
    for (const symbol of testStockPool.symbols) {
      await page.locator('[data-testid="symbol-input"]').fill(symbol);
      await page.locator('[data-testid="add-symbol-button"]').click();
    }

    // 步骤8: 验证股票代码已添加
    await expect(page.locator('[data-testid="symbol-tag"]')).toHaveCount(testStockPool.symbols.length);
    for (const symbol of testStockPool.symbols) {
      await expect(page.locator('[data-testid="symbol-tag"]')).toContainText(symbol);
    }

    // 步骤9: 提交表单
    await page.locator('[data-testid="save-pool-button"]').click();

    // 步骤10: 验证创建成功
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('股票池创建成功');

    // 步骤11: 验证股票池出现在列表中
    await expect(page.locator('[data-testid="pool-card"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="pool-name"]')).toContainText(testStockPool.name);
    await expect(page.locator('[data-testid="pool-description"]')).toContainText(testStockPool.description);
    await expect(page.locator('[data-testid="pool-symbol-count"]')).toContainText(`${testStockPool.symbols.length}只股票`);

    // 步骤12: 点击股票池查看详情
    await page.locator('[data-testid="pool-card"]').first().click();

    // 步骤13: 验证股票池详情显示
    await expect(page.locator('[data-testid="pool-detail-dialog"]')).toBeVisible();
    await expect(page.locator('[data-testid="pool-detail-name"]')).toContainText(testStockPool.name);
    await expect(page.locator('[data-testid="pool-detail-description"]')).toContainText(testStockPool.description);

    // 步骤14: 验证股票列表显示
    await expect(page.locator('[data-testid="stock-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="stock-item"]')).toHaveCount(testStockPool.symbols.length);

    // 步骤15: 关闭详情对话框
    await page.locator('[data-testid="close-pool-detail"]').click();

    // 步骤16: 编辑股票池
    await page.locator('[data-testid="edit-pool-button"]').first().click();

    // 步骤17: 验证编辑表单预填充
    await expect(page.locator('[data-testid="pool-name-input"]')).toHaveValue(testStockPool.name);
    await expect(page.locator('[data-testid="pool-description-input"]')).toHaveValue(testStockPool.description);

    // 步骤18: 修改股票池信息
    const updatedName = testStockPool.name + ' (已编辑)';
    await page.locator('[data-testid="pool-name-input"]').fill(updatedName);
    await page.locator('[data-testid="pool-description-input"]').fill(testStockPool.description + ' (已编辑)');

    // 步骤19: 添加新股票
    await page.locator('[data-testid="symbol-input"]').fill('600036.SH');
    await page.locator('[data-testid="add-symbol-button"]').click();

    // 步骤20: 移除一个股票
    await page.locator('[data-testid="symbol-tag"]').first().locator('[data-testid="remove-symbol"]').click();

    // 步骤21: 保存修改
    await page.locator('[data-testid="save-pool-button"]').click();

    // 步骤22: 验证更新成功
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('股票池更新成功');

    // 步骤23: 验证更新后的信息
    await expect(page.locator('[data-testid="pool-name"]')).toContainText(updatedName);
    await expect(page.locator('[data-testid="pool-symbol-count"]')).toContainText('3只股票');

    // 步骤24: 删除股票池
    await page.locator('[data-testid="delete-pool-button"]').first().click();

    // 步骤25: 确认删除
    await expect(page.locator('[data-testid="delete-confirm-dialog"]')).toBeVisible();
    await page.locator('[data-testid="confirm-delete-button"]').click();

    // 步骤26: 验证删除成功
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('股票池删除成功');

    // 步骤27: 验证股票池已从列表中移除
    await expect(page.locator('[data-testid="pool-card"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
  });

  test('应该能够处理股票池表单验证', async () => {
    // 导航到股票池管理页面
    await page.goto(`${BASE_URL}/private/stock-pool-manager`);
    await page.waitForLoadState('networkidle');

    // 点击创建股票池按钮
    await page.locator('[data-testid="create-pool-button"]').click();

    // 测试空表单提交
    await page.locator('[data-testid="save-pool-button"]').click();

    // 验证必填字段错误
    await expect(page.locator('[data-testid="pool-name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="pool-name-error"]')).toContainText('请输入股票池名称');

    await expect(page.locator('[data-testid="symbols-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="symbols-error"]')).toContainText('请至少添加一个股票代码');

    // 测试名称长度不足
    await page.locator('[data-testid="pool-name-input"]').fill('A');
    await page.locator('[data-testid="save-pool-button"]').click();

    // 验证名称长度错误
    await expect(page.locator('[data-testid="pool-name-error"]')).toContainText('名称长度不能少于2个字符');

    // 测试无效股票代码格式
    await page.locator('[data-testid="pool-name-input"]').fill('测试股票池');
    await page.locator('[data-testid="symbol-input"]').fill('INVALID');
    await page.locator('[data-testid="add-symbol-button"]').click();

    // 验证股票代码格式错误
    await expect(page.locator('[data-testid="symbol-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="symbol-error"]')).toContainText('请输入有效的股票代码格式');

    // 测试重复股票代码
    await page.locator('[data-testid="symbol-input"]').fill('000001.SZ');
    await page.locator('[data-testid="add-symbol-button"]').click();
    await page.locator('[data-testid="symbol-input"]').fill('000001.SZ');
    await page.locator('[data-testid="add-symbol-button"]').click();

    // 验证重复股票代码错误
    await expect(page.locator('[data-testid="symbol-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="symbol-error"]')).toContainText('股票代码已存在');
  });

  test('应该能够处理股票池搜索和过滤', async () => {
    // 创建多个测试股票池
    await createMultipleTestPools(page);

    // 导航到股票池管理页面
    await page.goto(`${BASE_URL}/private/stock-pool-manager`);
    await page.waitForLoadState('networkidle');

    // 验证所有股票池显示
    await expect(page.locator('[data-testid="pool-card"]')).toHaveCount(2);

    // 按名称搜索
    await page.locator('[data-testid="search-input"]').fill('E2E测试股票池1');
    await page.locator('[data-testid="search-button"]').click();

    // 验证搜索结果
    await expect(page.locator('[data-testid="pool-card"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="pool-name"]')).toContainText('E2E测试股票池1');

    // 清除搜索
    await page.locator('[data-testid="clear-search-button"]').click();

    // 验证所有股票池重新显示
    await expect(page.locator('[data-testid="pool-card"]')).toHaveCount(2);

    // 按描述搜索
    await page.locator('[data-testid="search-input"]').fill('第二个');
    await page.locator('[data-testid="search-button"]').click();

    // 验证搜索结果
    await expect(page.locator('[data-testid="pool-card"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="pool-description"]')).toContainText('第二个');
  });

  test('应该能够处理股票池性能数据', async () => {
    // 创建测试股票池
    await createTestPool(page);

    // 导航到股票池管理页面
    await page.goto(`${BASE_URL}/private/stock-pool-manager`);
    await page.waitForLoadState('networkidle');

    // 点击股票池查看详情
    await page.locator('[data-testid="pool-card"]').first().click();

    // 验证性能数据区域
    await expect(page.locator('[data-testid="performance-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-return"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-return-percent"]')).toBeVisible();
    await expect(page.locator('[data-testid="volatility"]')).toBeVisible();
    await expect(page.locator('[data-testid="sharpe-ratio"]')).toBeVisible();

    // 验证性能数据格式
    const totalReturn = await page.locator('[data-testid="total-return"]').textContent();
    expect(totalReturn).toMatch(/^-?\d+\.\d+$/);

    const totalReturnPercent = await page.locator('[data-testid="total-return-percent"]').textContent();
    expect(totalReturnPercent).toMatch(/^-?\d+\.\d+%$/);

    const volatility = await page.locator('[data-testid="volatility"]').textContent();
    expect(volatility).toMatch(/^\d+\.\d+%$/);

    const sharpeRatio = await page.locator('[data-testid="sharpe-ratio"]').textContent();
    expect(sharpeRatio).toMatch(/^-?\d+\.\d+$/);
  });

  test('应该能够处理股票池操作权限', async () => {
    // 创建测试股票池
    await createTestPool(page);

    // 导航到股票池管理页面
    await page.goto(`${BASE_URL}/private/stock-pool-manager`);
    await page.waitForLoadState('networkidle');

    // 验证操作按钮存在
    await expect(page.locator('[data-testid="edit-pool-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="delete-pool-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-pool-detail-button"]')).toBeVisible();

    // 点击编辑按钮
    await page.locator('[data-testid="edit-pool-button"]').first().click();

    // 验证编辑表单可访问
    await expect(page.locator('[data-testid="pool-form-dialog"]')).toBeVisible();
    await expect(page.locator('[data-testid="pool-name-input"]')).toBeEditable();
    await expect(page.locator('[data-testid="pool-description-input"]')).toBeEditable();

    // 取消编辑
    await page.locator('[data-testid="cancel-edit-button"]').click();

    // 点击删除按钮
    await page.locator('[data-testid="delete-pool-button"]').first().click();

    // 验证删除确认对话框
    await expect(page.locator('[data-testid="delete-confirm-dialog"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirm-delete-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="cancel-delete-button"]')).toBeVisible();

    // 取消删除
    await page.locator('[data-testid="cancel-delete-button"]').click();
  });

  test('应该能够处理网络错误', async () => {
    // 模拟网络错误
    await page.route('**/api/private/stock-pools**', route => {
      route.abort('failed');
    });

    // 导航到股票池管理页面
    await page.goto(`${BASE_URL}/private/stock-pool-manager`);
    await page.waitForLoadState('networkidle');

    // 验证错误状态显示
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('网络错误');

    // 验证重试按钮
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

    // 点击重试按钮
    await page.locator('[data-testid="retry-button"]').click();

    // 验证重试操作
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
  });

  test('应该能够处理数据加载状态', async () => {
    // 导航到股票池管理页面
    await page.goto(`${BASE_URL}/private/stock-pool-manager`);
    await page.waitForLoadState('networkidle');

    // 验证初始加载状态
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();

    // 等待加载完成
    await page.waitForSelector('[data-testid="loading-indicator"]', { state: 'hidden', timeout: 10000 });

    // 验证加载状态消失
    await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible();
  });
});

// 辅助函数
async function loginUser(page: Page) {
  // 导航到登录页面
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  // 使用演示登录
  await page.locator('[data-testid="demo-login-button"]').click();

  // 等待登录成功
  await page.waitForURL(/\/private/, { timeout: 10000 });
}

async function createTestPool(page: Page) {
  // 通过API创建测试股票池
  const response = await page.request.post(`${API_BASE_URL}/api/private/stock-pools`, {
    data: testStockPool
  });

  expect(response.ok()).toBeTruthy();
}

async function createMultipleTestPools(page: Page) {
  const pools = [
    { ...testStockPool, name: 'E2E测试股票池1', description: '第一个测试股票池' },
    { ...testStockPool2, name: 'E2E测试股票池2', description: '第二个测试股票池' }
  ];

  for (const pool of pools) {
    await page.request.post(`${API_BASE_URL}/api/private/stock-pools`, {
      data: pool
    });
  }
}

async function cleanupTestData(page: Page) {
  // 清理测试数据
  try {
    await page.request.delete(`${API_BASE_URL}/api/test/cleanup`);
  } catch (error) {
    console.log('清理测试数据失败:', error);
  }
}

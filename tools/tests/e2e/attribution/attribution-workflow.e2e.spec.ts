/**
 * 异常事件归因流程端到端测试
 * 符合"测试宪法"第3.3条要求
 * 测试异常事件的归因流程
 */

import { test, expect, Page } from '@playwright/test';

// 测试配置
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// 测试数据
const testEvent = {
  eventId: 'event-001',
  stockCode: '000001.SZ',
  eventType: 'news',
  title: '测试新闻事件',
  content: '这是一个测试新闻事件，用于验证归因流程',
  publishedAt: '2024-10-28T09:00:00Z',
  sourceUrl: 'https://example.com/news/001'
};

test.describe('异常事件归因流程E2E测试', () => {
  let page: Page;

  test.beforeEach(async ({ browser }: { browser: any }) => {
    // 创建新的浏览器页面
    page = await browser.newPage();
    
    // 设置视口大小
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // 导航到事件归因页面
    await page.goto(`${BASE_URL}/admin/events/attribution`);
    
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    // 清理测试数据
    await cleanupTestData(page);
    await page.close();
  });

  test('应该能够完成完整的事件归因流程', async () => {
    // 步骤1: 验证事件归因页面加载
    await expect(page.locator('[data-testid="attribution-dashboard-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="events-list"]')).toBeVisible();

    // 步骤2: 创建测试事件
    await createTestEvent(page);

    // 步骤3: 验证事件出现在列表中
    await expect(page.locator('[data-testid="event-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="event-title"]')).toContainText(testEvent.title);
    await expect(page.locator('[data-testid="event-stock-code"]')).toContainText(testEvent.stockCode);

    // 步骤4: 点击事件进入详情页面
    await page.locator('[data-testid="event-item"]').first().click();
    
    // 步骤5: 验证事件详情显示
    await expect(page.locator('[data-testid="event-detail"]')).toBeVisible();
    await expect(page.locator('[data-testid="event-content"]')).toContainText(testEvent.content);
    await expect(page.locator('[data-testid="event-source-url"]')).toContainText(testEvent.sourceUrl);

    // 步骤6: 启动归因分析
    await page.locator('[data-testid="start-attribution-button"]').click();

    // 步骤7: 验证分析进度
    await expect(page.locator('[data-testid="analysis-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="analysis-status"]')).toContainText('分析中');

    // 步骤8: 等待分析完成
    await page.waitForSelector('[data-testid="analysis-complete"]', { timeout: 30000 });

    // 步骤9: 验证归因结果
    await expect(page.locator('[data-testid="attribution-result"]')).toBeVisible();
    await expect(page.locator('[data-testid="attribution-confidence"]')).toBeVisible();
    await expect(page.locator('[data-testid="attribution-reasoning"]')).toBeVisible();

    // 步骤10: 验证归因因子
    await expect(page.locator('[data-testid="attribution-factors"]')).toBeVisible();
    const factorCount = await page.locator('[data-testid="factor-item"]').count();
    expect(factorCount).toBeGreaterThan(0);

    // 步骤11: 保存归因结果
    await page.locator('[data-testid="save-attribution-button"]').click();

    // 步骤12: 验证保存成功
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('归因结果已保存');
  });

  test('应该能够处理归因分析失败', async () => {
    // 创建测试事件
    await createTestEvent(page);
    await page.locator('[data-testid="event-item"]').first().click();

    // 模拟分析失败
    await page.route('**/api/attribution/analyze', (route: any) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: '分析服务暂时不可用' })
      });
    });

    // 启动归因分析
    await page.locator('[data-testid="start-attribution-button"]').click();

    // 验证错误处理
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('分析服务暂时不可用');
  });

  test('应该能够重新分析事件', async () => {
    // 创建测试事件并完成一次分析
    await createTestEvent(page);
    await page.locator('[data-testid="event-item"]').first().click();
    await page.locator('[data-testid="start-attribution-button"]').click();
    await page.waitForSelector('[data-testid="analysis-complete"]', { timeout: 30000 });

    // 点击重新分析按钮
    await page.locator('[data-testid="reanalyze-button"]').click();

    // 验证重新分析开始
    await expect(page.locator('[data-testid="analysis-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="analysis-status"]')).toContainText('重新分析中');
  });

  test('应该能够导出归因报告', async () => {
    // 创建测试事件并完成分析
    await createTestEvent(page);
    await page.locator('[data-testid="event-item"]').first().click();
    await page.locator('[data-testid="start-attribution-button"]').click();
    await page.waitForSelector('[data-testid="analysis-complete"]', { timeout: 30000 });

    // 点击导出按钮
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="export-report-button"]').click();
    
    // 验证下载开始
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/attribution-report-.*\.pdf/);
  });

  test('应该能够过滤和搜索事件', async () => {
    // 创建多个测试事件
    await createMultipleTestEvents(page);

    // 按股票代码过滤
    await page.locator('[data-testid="stock-code-filter"]').fill('000001');
    await page.locator('[data-testid="apply-filter-button"]').click();

    // 验证过滤结果
    await expect(page.locator('[data-testid="event-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="event-stock-code"]')).toContainText('000001');

    // 按事件类型过滤
    await page.locator('[data-testid="event-type-filter"]').selectOption('news');
    await page.locator('[data-testid="apply-filter-button"]').click();

    // 验证过滤结果
    await expect(page.locator('[data-testid="event-item"]')).toHaveCount(1);

    // 搜索事件
    await page.locator('[data-testid="search-input"]').fill('测试新闻');
    await page.locator('[data-testid="search-button"]').click();

    // 验证搜索结果
    await expect(page.locator('[data-testid="event-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="event-title"]')).toContainText('测试新闻');
  });
});

// 辅助函数
async function createTestEvent(page: Page) {
  // 通过API创建测试事件
  const response = await page.request.post(`${API_BASE_URL}/api/events`, {
    data: testEvent
  });
  
  expect(response.ok()).toBeTruthy();
  
  // 等待事件出现在列表中
  await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });
}

async function createMultipleTestEvents(page: Page) {
  const events = [
    { ...testEvent, eventId: 'event-001', stockCode: '000001.SZ', title: '测试新闻事件1' },
    { ...testEvent, eventId: 'event-002', stockCode: '000002.SZ', title: '测试新闻事件2' },
    { ...testEvent, eventId: 'event-003', stockCode: '000001.SZ', title: '测试公告事件', eventType: 'announcement' }
  ];

  for (const event of events) {
    await page.request.post(`${API_BASE_URL}/api/events`, {
      data: event
    });
  }

  // 等待所有事件出现在列表中
  await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });
}

async function cleanupTestData(page: Page) {
  // 清理测试数据
  try {
    await page.request.delete(`${API_BASE_URL}/api/test/cleanup`);
  } catch (error) {
    console.log('清理测试数据失败:', error);
  }
}

/**
 * 市场雷达完整流程端到端测试
 * 符合"测试宪法"第3.3条要求
 * 测试市场雷达功能的完整工作流
 */

import { test, expect, Page } from '@playwright/test';

// 测试配置
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// 测试数据
const testMarketEvent = {
  id: 'event-001',
  stockCode: '000001.SZ',
  eventType: 'news',
  title: '测试市场事件',
  content: '这是一个测试市场事件，用于验证市场雷达功能',
  publishedAt: '2024-10-28T09:00:00Z',
  sourceUrl: 'https://example.com/news/001',
  impact: 'high',
  sentiment: 'positive'
};

const testHotspot = {
  id: 'hotspot-001',
  stockCode: '000002.SZ',
  title: '测试热点事件',
  description: '这是一个测试热点事件，用于验证热点复盘功能',
  attribution: {
    primaryReason: '政策利好',
    confidence: 0.85,
    factors: ['政策支持', '资金流入', '技术突破']
  },
  performance: {
    priceChange: 0.05,
    volumeChange: 2.3,
    marketCap: 1000000000
  }
};

test.describe('市场雷达完整流程E2E测试', () => {
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

  test('应该能够完成完整的市场雷达工作流', async () => {
    // 步骤1: 导航到市场雷达页面
    await page.goto(`${BASE_URL}/market-radar`);
    await page.waitForLoadState('networkidle');

    // 步骤2: 验证市场雷达页面加载
    await expect(page.locator('[data-testid="market-radar-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="market-briefing-card"]')).toBeVisible();

    // 步骤3: 验证市场简报卡片显示
    await expect(page.locator('[data-testid="briefing-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="briefing-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="briefing-timestamp"]')).toBeVisible();

    // 步骤4: 验证盘前高能事件区域
    await expect(page.locator('[data-testid="pre-market-events-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="pre-market-events-title"]')).toContainText('盘前高能事件');

    // 步骤5: 创建测试市场事件
    await createTestMarketEvent(page);

    // 步骤6: 刷新盘前事件
    await page.locator('[data-testid="refresh-events-button"]').click();

    // 步骤7: 验证事件出现在列表中
    await expect(page.locator('[data-testid="event-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="event-title"]')).toContainText(testMarketEvent.title);
    await expect(page.locator('[data-testid="event-stock-code"]')).toContainText(testMarketEvent.stockCode);

    // 步骤8: 点击事件查看详情
    await page.locator('[data-testid="event-item"]').first().click();

    // 步骤9: 验证事件详情显示
    await expect(page.locator('[data-testid="event-detail-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="event-detail-title"]')).toContainText(testMarketEvent.title);
    await expect(page.locator('[data-testid="event-detail-content"]')).toContainText(testMarketEvent.content);
    await expect(page.locator('[data-testid="event-detail-source"]')).toContainText(testMarketEvent.sourceUrl);

    // 步骤10: 关闭事件详情
    await page.locator('[data-testid="close-event-detail"]').click();

    // 步骤11: 验证盘后热点复盘区域
    await expect(page.locator('[data-testid="post-market-hotspots-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="post-market-hotspots-title"]')).toContainText('盘后热点复盘');

    // 步骤12: 创建测试热点事件
    await createTestHotspot(page);

    // 步骤13: 刷新热点事件
    await page.locator('[data-testid="refresh-hotspots-button"]').click();

    // 步骤14: 验证热点事件出现在列表中
    await expect(page.locator('[data-testid="hotspot-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="hotspot-title"]')).toContainText(testHotspot.title);
    await expect(page.locator('[data-testid="hotspot-stock-code"]')).toContainText(testHotspot.stockCode);

    // 步骤15: 点击热点事件查看详情
    await page.locator('[data-testid="hotspot-item"]').first().click();

    // 步骤16: 验证热点详情显示
    await expect(page.locator('[data-testid="hotspot-detail-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="hotspot-detail-title"]')).toContainText(testHotspot.title);
    await expect(page.locator('[data-testid="attribution-primary-reason"]')).toContainText(testHotspot.attribution.primaryReason);
    await expect(page.locator('[data-testid="attribution-confidence"]')).toContainText(`${Math.round(testHotspot.attribution.confidence * 100)}%`);

    // 步骤17: 验证归因因子显示
    await expect(page.locator('[data-testid="attribution-factors"]')).toBeVisible();
    const factorCount = await page.locator('[data-testid="factor-item"]').count();
    expect(factorCount).toBe(testHotspot.attribution.factors.length);

    // 步骤18: 验证性能指标显示
    await expect(page.locator('[data-testid="performance-metrics"]')).toBeVisible();
    await expect(page.locator('[data-testid="price-change"]')).toContainText(`${(testHotspot.performance.priceChange * 100).toFixed(2)}%`);
    await expect(page.locator('[data-testid="volume-change"]')).toContainText(`${testHotspot.performance.volumeChange}x`);

    // 步骤19: 关闭热点详情
    await page.locator('[data-testid="close-hotspot-detail"]').click();
  });

  test('应该能够处理市场事件过滤和搜索', async () => {
    // 导航到市场雷达页面
    await page.goto(`${BASE_URL}/market-radar`);
    await page.waitForLoadState('networkidle');

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

    // 按影响程度过滤
    await page.locator('[data-testid="impact-filter"]').selectOption('high');
    await page.locator('[data-testid="apply-filter-button"]').click();

    // 验证过滤结果
    await expect(page.locator('[data-testid="event-item"]')).toHaveCount(1);

    // 搜索事件
    await page.locator('[data-testid="search-input"]').fill('测试市场事件');
    await page.locator('[data-testid="search-button"]').click();

    // 验证搜索结果
    await expect(page.locator('[data-testid="event-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="event-title"]')).toContainText('测试市场事件');

    // 清除过滤器
    await page.locator('[data-testid="clear-filters-button"]').click();

    // 验证所有事件显示
    await expect(page.locator('[data-testid="event-item"]')).toHaveCount(3);
  });

  test('应该能够处理热点事件排序', async () => {
    // 导航到市场雷达页面
    await page.goto(`${BASE_URL}/market-radar`);
    await page.waitForLoadState('networkidle');

    // 创建多个测试热点
    await createMultipleTestHotspots(page);

    // 按置信度排序
    await page.locator('[data-testid="sort-by-confidence"]').click();

    // 验证排序结果
    const confidenceValues = await page.locator('[data-testid="hotspot-confidence"]').allTextContents();
    const sortedConfidences = [...confidenceValues].sort((a, b) => parseFloat(b) - parseFloat(a));
    expect(confidenceValues).toEqual(sortedConfidences);

    // 按价格变化排序
    await page.locator('[data-testid="sort-by-price-change"]').click();

    // 验证排序结果
    const priceChangeValues = await page.locator('[data-testid="hotspot-price-change"]').allTextContents();
    const sortedPriceChanges = [...priceChangeValues].sort((a, b) => parseFloat(b) - parseFloat(a));
    expect(priceChangeValues).toEqual(sortedPriceChanges);

    // 按时间排序
    await page.locator('[data-testid="sort-by-time"]').click();

    // 验证排序结果
    const timeValues = await page.locator('[data-testid="hotspot-time"]').allTextContents();
    const sortedTimes = [...timeValues].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    expect(timeValues).toEqual(sortedTimes);
  });

  test('应该能够处理数据加载状态', async () => {
    // 导航到市场雷达页面
    await page.goto(`${BASE_URL}/market-radar`);
    await page.waitForLoadState('networkidle');

    // 验证初始加载状态
    await expect(page.locator('[data-testid="events-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="hotspots-loading"]')).toBeVisible();

    // 等待加载完成
    await page.waitForSelector('[data-testid="events-loading"]', { state: 'hidden', timeout: 10000 });
    await page.waitForSelector('[data-testid="hotspots-loading"]', { state: 'hidden', timeout: 10000 });

    // 验证加载状态消失
    await expect(page.locator('[data-testid="events-loading"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="hotspots-loading"]')).not.toBeVisible();
  });

  test('应该能够处理数据加载错误', async () => {
    // 模拟API错误
    await page.route('**/api/market/events**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: '服务器内部错误' })
      });
    });

    await page.route('**/api/market/hotspots**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: '服务器内部错误' })
      });
    });

    // 导航到市场雷达页面
    await page.goto(`${BASE_URL}/market-radar`);
    await page.waitForLoadState('networkidle');

    // 验证错误状态显示
    await expect(page.locator('[data-testid="events-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="events-error"]')).toContainText('服务器内部错误');

    await expect(page.locator('[data-testid="hotspots-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="hotspots-error"]')).toContainText('服务器内部错误');

    // 验证重试按钮
    await expect(page.locator('[data-testid="retry-events-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-hotspots-button"]')).toBeVisible();
  });

  test('应该能够处理空数据状态', async () => {
    // 导航到市场雷达页面
    await page.goto(`${BASE_URL}/market-radar`);
    await page.waitForLoadState('networkidle');

    // 等待加载完成
    await page.waitForSelector('[data-testid="events-loading"]', { state: 'hidden', timeout: 10000 });
    await page.waitForSelector('[data-testid="hotspots-loading"]', { state: 'hidden', timeout: 10000 });

    // 验证空状态显示
    await expect(page.locator('[data-testid="events-empty-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="events-empty-message"]')).toContainText('暂无盘前高能事件');

    await expect(page.locator('[data-testid="hotspots-empty-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="hotspots-empty-message"]')).toContainText('暂无盘后热点事件');
  });

  test('应该能够处理实时数据更新', async () => {
    // 导航到市场雷达页面
    await page.goto(`${BASE_URL}/market-radar`);
    await page.waitForLoadState('networkidle');

    // 等待初始数据加载
    await page.waitForSelector('[data-testid="events-loading"]', { state: 'hidden', timeout: 10000 });

    // 创建新事件
    await createTestMarketEvent(page);

    // 等待自动刷新（如果有的话）
    await page.waitForTimeout(2000);

    // 手动刷新
    await page.locator('[data-testid="refresh-events-button"]').click();

    // 验证新事件出现
    await expect(page.locator('[data-testid="event-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="event-title"]')).toContainText(testMarketEvent.title);
  });
});

// 辅助函数
async function createTestMarketEvent(page: Page) {
  // 通过API创建测试市场事件
  const response = await page.request.post(`${API_BASE_URL}/api/market/events`, {
    data: testMarketEvent
  });

  expect(response.ok()).toBeTruthy();
}

async function createTestHotspot(page: Page) {
  // 通过API创建测试热点事件
  const response = await page.request.post(`${API_BASE_URL}/api/market/hotspots`, {
    data: testHotspot
  });

  expect(response.ok()).toBeTruthy();
}

async function createMultipleTestEvents(page: Page) {
  const events = [
    { ...testMarketEvent, id: 'event-001', stockCode: '000001.SZ', title: '测试市场事件1' },
    { ...testMarketEvent, id: 'event-002', stockCode: '000002.SZ', title: '测试市场事件2', eventType: 'announcement' },
    { ...testMarketEvent, id: 'event-003', stockCode: '000001.SZ', title: '测试市场事件3', impact: 'medium' }
  ];

  for (const event of events) {
    await page.request.post(`${API_BASE_URL}/api/market/events`, {
      data: event
    });
  }

  // 等待所有事件出现在列表中
  await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });
}

async function createMultipleTestHotspots(page: Page) {
  const hotspots = [
    { ...testHotspot, id: 'hotspot-001', stockCode: '000001.SZ', title: '测试热点1', attribution: { ...testHotspot.attribution, confidence: 0.9 } },
    { ...testHotspot, id: 'hotspot-002', stockCode: '000002.SZ', title: '测试热点2', attribution: { ...testHotspot.attribution, confidence: 0.7 } },
    { ...testHotspot, id: 'hotspot-003', stockCode: '000003.SZ', title: '测试热点3', attribution: { ...testHotspot.attribution, confidence: 0.8 } }
  ];

  for (const hotspot of hotspots) {
    await page.request.post(`${API_BASE_URL}/api/market/hotspots`, {
      data: hotspot
    });
  }

  // 等待所有热点出现在列表中
  await page.waitForSelector('[data-testid="hotspot-item"]', { timeout: 10000 });
}

async function cleanupTestData(page: Page) {
  // 清理测试数据
  try {
    await page.request.delete(`${API_BASE_URL}/api/test/cleanup`);
  } catch (error) {
    console.log('清理测试数据失败:', error);
  }
}

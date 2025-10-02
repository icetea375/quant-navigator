/**
 * 仲裁工作流端到端测试
 * 符合"测试宪法"第3.3条要求
 * 测试AI治理中心的仲裁流程
 */

import { test, expect, Page } from '@playwright/test';

// 测试配置
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// 测试数据
const testCase = {
  stockCode: '000001.SZ',
  tradeDate: '2024-10-28',
  qwenReport: {
    recommendation: '看涨',
    confidence: 85,
    reasoning: '基于技术分析，该股票具有上涨潜力'
  },
  doubaoReport: {
    recommendation: '看跌',
    confidence: 72,
    reasoning: '市场情绪偏悲观，存在下行风险'
  }
};

test.describe('仲裁工作流E2E测试', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    // 创建新的浏览器页面
    page = await browser.newPage();

    // 设置视口大小
    await page.setViewportSize({ width: 1920, height: 1080 });

    // 导航到仲裁仪表盘
    await page.goto(`${BASE_URL}/admin/governance/arbitration`);

    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    // 清理测试数据
    await cleanupTestData(page);
    await page.close();
  });

  test('应该能够完成完整的仲裁工作流', async () => {
    // 步骤1: 验证仲裁仪表盘加载
    await expect(page.locator('[data-testid="arbitration-dashboard-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-cases-section"]')).toBeVisible();

    // 步骤2: 创建测试仲裁案件
    await createTestArbitrationCase(page);

    // 步骤3: 验证案件出现在待仲裁列表中
    await expect(page.locator('[data-testid="case-card"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="case-stock-code"]')).toContainText(testCase.stockCode);
    await expect(page.locator('[data-testid="case-trade-date"]')).toContainText(testCase.tradeDate);

    // 步骤4: 点击案件进入详情页面
    await page.locator('[data-testid="case-card"]').first().click();

    // 步骤5: 验证双报告对比区域显示
    await expect(page.locator('[data-testid="comparison-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="qwen-report"]')).toBeVisible();
    await expect(page.locator('[data-testid="doubao-report"]')).toBeVisible();

    // 步骤6: 验证Qwen报告内容
    await expect(page.locator('[data-testid="qwen-recommendation"]')).toContainText(testCase.qwenReport.recommendation);
    await expect(page.locator('[data-testid="qwen-confidence"]')).toContainText(`${testCase.qwenReport.confidence}%`);
    await expect(page.locator('[data-testid="qwen-reasoning"]')).toContainText(testCase.qwenReport.reasoning);

    // 步骤7: 验证豆包报告内容
    await expect(page.locator('[data-testid="doubao-recommendation"]')).toContainText(testCase.doubaoReport.recommendation);
    await expect(page.locator('[data-testid="doubao-confidence"]')).toContainText(`${testCase.doubaoReport.confidence}%`);
    await expect(page.locator('[data-testid="doubao-reasoning"]')).toContainText(testCase.doubaoReport.reasoning);

    // 步骤8: 填写仲裁决策表单
    await fillArbitrationForm(page);

    // 步骤9: 提交仲裁决策
    await page.locator('[data-testid="submit-arbitration-button"]').click();

    // 步骤10: 验证提交成功
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('仲裁决策已提交');

    // 步骤11: 验证案件状态更新
    await expect(page.locator('[data-testid="case-status"]')).toContainText('已完成');
  });

  test('应该能够处理仲裁表单验证', async () => {
    // 创建测试案件
    await createTestArbitrationCase(page);
    await page.locator('[data-testid="case-card"]').first().click();

    // 尝试提交空表单
    await page.locator('[data-testid="submit-arbitration-button"]').click();

    // 验证必填字段错误
    await expect(page.locator('[data-testid="final-recommendation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="reasoning-error"]')).toBeVisible();

    // 填写无效的置信度
    await page.locator('[data-testid="confidence-level-input"]').fill('150');
    await page.locator('[data-testid="submit-arbitration-button"]').click();

    // 验证置信度错误
    await expect(page.locator('[data-testid="confidence-level-error"]')).toBeVisible();
  });

  test('应该能够处理网络错误', async () => {
    // 模拟网络错误
    await page.route('**/api/arbitration/**', route => {
      route.abort('failed');
    });

    // 创建测试案件
    await createTestArbitrationCase(page);
    await page.locator('[data-testid="case-card"]').first().click();

    // 填写表单并提交
    await fillArbitrationForm(page);
    await page.locator('[data-testid="submit-arbitration-button"]').click();

    // 验证错误处理
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('网络错误');
  });

  test('应该能够处理空案件列表', async () => {
    // 验证空状态显示
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-message"]')).toContainText('暂无待仲裁案件');
  });

  test('应该能够刷新案件列表', async () => {
    // 点击刷新按钮
    await page.locator('[data-testid="refresh-cases-button"]').click();

    // 验证刷新操作
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible();
  });
});

// 辅助函数
async function createTestArbitrationCase(page: Page) {
  // 通过API创建测试案件
  const response = await page.request.post(`${API_BASE_URL}/api/dual-brain/analyze`, {
    data: {
      stock_code: testCase.stockCode,
      trade_date: testCase.tradeDate
    }
  });

  expect(response.ok()).toBeTruthy();

  // 等待案件出现在列表中
  await page.waitForSelector('[data-testid="case-card"]', { timeout: 10000 });
}

async function fillArbitrationForm(page: Page) {
  // 选择最终推荐
  await page.locator('[data-testid="final-recommendation-看涨"]').click();

  // 填写置信度
  await page.locator('[data-testid="confidence-level-input"]').fill('85');

  // 填写推理过程
  await page.locator('[data-testid="reasoning-textarea"]').fill('基于综合分析，该股票具有上涨潜力');

  // 填写关键分歧
  await page.locator('[data-testid="key-disagreements-textarea"]').fill('技术面与情绪面存在分歧');
}

async function cleanupTestData(page: Page) {
  // 清理测试数据
  try {
    await page.request.delete(`${API_BASE_URL}/api/test/cleanup`);
  } catch (error) {
    console.log('清理测试数据失败:', error);
  }
}

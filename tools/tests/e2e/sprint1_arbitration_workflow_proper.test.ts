import { test, expect } from '@playwright/test';

/**
 * Sprint 1 E2E测试 - 按照测试宪法要求
 * 第3条："红灯-绿灯-重构"原则 - 这是红灯阶段（会失败的测试）
 */

test.describe('Sprint 1: 核心价值闭环(MVP) - 仲裁工作流', () => {
  test.beforeEach(async ({ page }) => {
    // 确保在真实环境中测试，不使用任何Mock
    await page.goto('http://localhost:3000/login');
  });

  test('作为仲裁官，我能在页面上并列查看Qwen和豆包对同一个案件的分析报告', async ({ page }) => {
    // 第6条：断言必须"精确且有意义"

    // 1. 登录系统
    await page.click('[data-testid="demo-login-button"]');
    await expect(page).toHaveURL(/.*admin\/arbitration/);

    // 2. 验证案件列表页面加载
    await expect(page.locator('h1')).toContainText('AI仲裁案件管理');
    await expect(page.locator('[data-testid="case-list"]')).toBeVisible();

    // 3. 点击第一个案件的"查看详情"按钮
    const firstCase = page.locator('[data-testid="case-card"]').first();
    await expect(firstCase).toBeVisible();
    await firstCase.locator('button:has-text("查看详情")').click();

    // 4. 验证双脑报告对比页面
    await expect(page.locator('h1')).toContainText('AI仲裁案件管理');
    await expect(page.locator('[data-testid="qwen-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="doubao-panel"]')).toBeVisible();

    // 5. 验证Qwen事实归因报告内容
    const qwenPanel = page.locator('[data-testid="qwen-panel"]');
    await expect(qwenPanel.locator('h3')).toContainText('Qwen事实归因流');
    await expect(qwenPanel.locator('[data-testid="qwen-analysis"]')).toContainText(/基于财务数据|营收增长|利润率/);
    await expect(qwenPanel.locator('[data-testid="qwen-confidence"]')).toContainText(/\d+%/);

    // 6. 验证豆包舆情感知报告内容
    const doubaoPanel = page.locator('[data-testid="doubao-panel"]');
    await expect(doubaoPanel.locator('h3')).toContainText('豆包舆情感知流');
    await expect(doubaoPanel.locator('[data-testid="doubao-analysis"]')).toContainText(/市场情绪|投资者|媒体/);
    await expect(doubaoPanel.locator('[data-testid="doubao-confidence"]')).toContainText(/\d+%/);
  });

  test('作为仲裁官，在对比完报告后，我能提交我的最终判决', async ({ page }) => {
    // 第6条：断言必须"精确且有意义"

    // 1. 登录并进入案件详情
    await page.click('[data-testid="demo-login-button"]');
    await page.locator('[data-testid="case-card"]').first().locator('button:has-text("查看详情")').click();

    // 2. 验证仲裁决策表单存在
    await expect(page.locator('[data-testid="arbitration-decision-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="final-recommendation-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="confidence-slider"]')).toBeVisible();
    await expect(page.locator('[data-testid="reasoning-textarea"]')).toBeVisible();

    // 3. 填写仲裁决策表单
    await page.selectOption('[data-testid="final-recommendation-select"]', 'BUY');
    await page.fill('[data-testid="reasoning-textarea"]', '基于双脑分析，Qwen基本面强劲，豆包情绪积极，建议买入');
    await page.fill('[data-testid="key-disagreements-textarea"]', 'Qwen侧重长期价值，豆包关注短期情绪');
    await page.locator('[data-testid="confidence-slider"]').fill('85');

    // 4. 提交仲裁决策
    await page.click('[data-testid="submit-arbitration-button"]');

    // 5. 验证提交成功
    await expect(page.locator('[data-testid="success-message"]')).toContainText('仲裁判决提交成功');

    // 6. 验证自动跳转回案件列表
    await expect(page).toHaveURL(/.*admin\/arbitration/);

    // 7. 验证案件状态已更新
    await expect(page.locator('[data-testid="case-status"]').first()).toContainText('已仲裁');
  });

  test('作为系统，每日自动为异常股票生成双脑报告', async ({ page }) => {
    // 第6条：断言必须"精确且有意义"

    // 1. 验证案件列表中有数据
    await page.click('[data-testid="demo-login-button"]');
    await expect(page.locator('[data-testid="case-list"]')).toBeVisible();

    // 2. 验证案件数据完整性
    const caseCards = page.locator('[data-testid="case-card"]');
    await expect(caseCards).toHaveCount(1);

    // 3. 验证每个案件都有必要的数据
    const firstCase = caseCards.first();
    await expect(firstCase.locator('[data-testid="case-id"]')).toContainText('ARB_');
    await expect(firstCase.locator('[data-testid="stock-code"]')).toContainText('.SZ');
    await expect(firstCase.locator('[data-testid="priority-score"]')).toContainText(/\d+%/);
    await expect(firstCase.locator('[data-testid="divergence-score"]')).toContainText(/\d+%/);

    // 4. 验证案件详情页面数据完整性
    await firstCase.locator('button:has-text("查看详情")').click();
    await expect(page.locator('[data-testid="qwen-analysis"]')).toContainText(/基于财务数据|营收增长|利润率/);
    await expect(page.locator('[data-testid="doubao-analysis"]')).toContainText(/市场情绪|投资者|媒体/);
  });
});

/**
 * AI训练中心完整流程E2E测试
 * 
 * 遵循测试宪法第3条："红灯-绿灯-重构"原则
 * 遵循测试宪法第3.3条：E2E测试的"有限真实性"原则
 * 
 * 测试目标：验证从"查看AI生成报告"到"提交人工标注反馈"的完整工作流
 * 
 * 测试场景：
 * 1. 访问AI训练中心页面
 * 2. 查看报告列表和筛选功能
 * 3. 选择报告进行标注
 * 4. 提交标注反馈
 * 5. 验证反馈已保存
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

test.describe('AI训练中心完整流程E2E测试', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    // 遵循测试宪法第3.3条：准生产环境
    page = await browser.newPage();
    
    // 设置测试环境变量
    await page.addInitScript(() => {
      window.localStorage.setItem('test-mode', 'true');
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('作为管理员，我能在AI训练中心完成完整的报告标注工作流', async () => {
    // 遵循测试宪法第7条：断言必须"精确且有意义"
    
    // 步骤1：访问AI训练中心页面
    await page.goto(`${BASE_URL}/admin/ai-training`);
    await expect(page).toHaveURL(/.*admin\/ai-training/);
    
    // 验证页面标题和核心元素
    await expect(page.locator('[data-testid="ai-training-center-title"]')).toContainText('AI训练中心');
    await expect(page.locator('[data-testid="report-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="annotation-panel"]')).toBeVisible();

    // 步骤2：测试报告筛选功能
    await test.step('测试报告筛选功能', async () => {
      // 点击筛选按钮
      await page.click('[data-testid="filter-button"]');
      
      // 设置筛选条件
      await page.selectOption('[data-testid="report-type-filter"]', 'quantitative');
      await page.selectOption('[data-testid="status-filter"]', 'pending');
      
      // 应用筛选
      await page.click('[data-testid="apply-filter-button"]');
      
      // 验证筛选结果
      await expect(page.locator('[data-testid="report-list"] .report-item')).toHaveCount(2);
    });

    // 步骤3：选择报告进行标注
    await test.step('选择报告进行标注', async () => {
      // 点击第一个报告
      await page.click('[data-testid="report-item-0"]');
      
      // 验证报告详情加载
      await expect(page.locator('[data-testid="report-detail"]')).toBeVisible();
      await expect(page.locator('[data-testid="report-content"]')).toContainText('量化分析报告');
      
      // 验证标注面板激活
      await expect(page.locator('[data-testid="annotation-panel"]')).toHaveClass(/active/);
    });

    // 步骤4：提交标注反馈
    await test.step('提交标注反馈', async () => {
      // 选择标注类型
      await page.click('[data-testid="annotation-type-good"]');
      
      // 填写标注内容
      await page.fill('[data-testid="annotation-content"]', '报告质量很高，分析逻辑清晰，数据支撑充分');
      
      // 设置评分
      await page.fill('[data-testid="annotation-score"]', '9');
      
      // 添加标签
      await page.click('[data-testid="add-tag-button"]');
      await page.fill('[data-testid="tag-input"]', '高质量');
      await page.press('[data-testid="tag-input"]', 'Enter');
      
      // 提交反馈
      await page.click('[data-testid="submit-annotation-button"]');
      
      // 验证提交成功
      await expect(page.locator('[data-testid="success-message"]')).toContainText('标注反馈已提交');
    });

    // 步骤5：验证反馈已保存
    await test.step('验证反馈已保存', async () => {
      // 刷新页面验证数据持久化
      await page.reload();
      
      // 验证报告状态已更新
      await expect(page.locator('[data-testid="report-item-0"]')).toHaveClass(/annotated/);
      
      // 验证统计信息更新
      await expect(page.locator('[data-testid="total-annotations"]')).toContainText('1');
      await expect(page.locator('[data-testid="average-score"]')).toContainText('9.0');
    });
  });

  test('作为管理员，我能在AI训练中心处理标注错误和异常情况', async () => {
    // 遵循测试宪法第7条：测试异常情况
    
    await page.goto(`${BASE_URL}/admin/ai-training`);
    
    // 测试空报告列表
    await test.step('处理空报告列表', async () => {
      // 模拟空数据状态
      await page.evaluate(() => {
        window.localStorage.setItem('mock-empty-reports', 'true');
      });
      
      await page.reload();
      
      // 验证空状态显示
      await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
      await expect(page.locator('[data-testid="empty-message"]')).toContainText('暂无待标注报告');
    });

    // 测试网络错误处理
    await test.step('处理网络错误', async () => {
      // 模拟网络错误
      await page.route('**/api/reports/**', route => route.abort());
      
      await page.click('[data-testid="refresh-button"]');
      
      // 验证错误处理
      await expect(page.locator('[data-testid="error-message"]')).toContainText('网络连接失败');
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    // 测试标注验证
    await test.step('测试标注验证', async () => {
      // 恢复正常数据
      await page.evaluate(() => {
        window.localStorage.removeItem('mock-empty-reports');
      });
      
      await page.reload();
      
      // 尝试提交空标注
      await page.click('[data-testid="report-item-0"]');
      await page.click('[data-testid="submit-annotation-button"]');
      
      // 验证验证错误
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('请选择标注类型');
    });
  });

  test('作为管理员，我能在AI训练中心使用高级筛选和搜索功能', async () => {
    // 遵循测试宪法第4条：简单性优先，测试核心功能
    
    await page.goto(`${BASE_URL}/admin/ai-training`);
    
    // 测试搜索功能
    await test.step('测试搜索功能', async () => {
      await page.fill('[data-testid="search-input"]', '量化分析');
      await page.press('[data-testid="search-input"]', 'Enter');
      
      // 验证搜索结果
      await expect(page.locator('[data-testid="report-list"] .report-item')).toHaveCount(1);
      await expect(page.locator('[data-testid="report-item-0"]')).toContainText('量化分析');
    });

    // 测试高级筛选
    await test.step('测试高级筛选', async () => {
      await page.click('[data-testid="advanced-filter-button"]');
      
      // 设置日期范围
      await page.fill('[data-testid="start-date"]', '2024-01-01');
      await page.fill('[data-testid="end-date"]', '2024-12-31');
      
      // 设置评分范围
      await page.fill('[data-testid="min-score"]', '7');
      await page.fill('[data-testid="max-score"]', '10');
      
      // 应用筛选
      await page.click('[data-testid="apply-advanced-filter"]');
      
      // 验证筛选结果
      await expect(page.locator('[data-testid="filter-results-count"]')).toContainText('筛选结果：3条');
    });

    // 测试排序功能
    await test.step('测试排序功能', async () => {
      // 按评分排序
      await page.click('[data-testid="sort-by-score"]');
      
      // 验证排序结果
      const scores = await page.locator('[data-testid="report-score"]').allTextContents();
      const sortedScores = [...scores].sort((a, b) => parseFloat(b) - parseFloat(a));
      expect(scores).toEqual(sortedScores);
    });
  });


  test('作为管理员，我能在AI训练中心管理标注模板和批量操作', async () => {
    // 遵循测试宪法第4条：简单性优先，测试核心功能
    
    await page.goto(`${BASE_URL}/admin/ai-training`);
    
    // 测试标注模板管理
    await test.step('测试标注模板管理', async () => {
      // 创建新模板
      await page.click('[data-testid="templates-tab"]');
      await page.click('[data-testid="create-template-button"]');
      
      await page.fill('[data-testid="template-name-input"]', '标准量化报告模板');
      await page.fill('[data-testid="template-description-input"]', '用于量化分析报告的标准标注模板');
      
      // 配置模板字段
      await page.check('[data-testid="template-field-accuracy"]');
      await page.check('[data-testid="template-field-relevance"]');
      await page.check('[data-testid="template-field-clarity"]');
      
      // 保存模板
      await page.click('[data-testid="save-template-button"]');
      await expect(page.locator('[data-testid="template-save-success"]')).toContainText('模板已保存');
    });

    // 测试批量标注操作
    await test.step('测试批量标注操作', async () => {
      // 返回报告列表
      await page.click('[data-testid="reports-tab"]');
      
      // 选择多个报告
      await page.check('[data-testid="report-item-0"] [data-testid="select-checkbox"]');
      await page.check('[data-testid="report-item-1"] [data-testid="select-checkbox"]');
      
      // 批量标注
      await page.click('[data-testid="batch-annotate-button"]');
      await expect(page.locator('[data-testid="batch-annotation-modal"]')).toBeVisible();
      
      // 选择标注模板
      await page.selectOption('[data-testid="annotation-template-select"]', '标准量化报告模板');
      
      // 设置批量标注内容
      await page.fill('[data-testid="batch-annotation-text"]', '批量标注：报告质量良好');
      await page.click('[data-testid="apply-batch-annotation-button"]');
      
      // 验证批量标注成功
      await expect(page.locator('[data-testid="batch-annotation-success"]')).toContainText('批量标注完成');
    });

    // 测试标注统计和导出
    await test.step('测试标注统计和导出', async () => {
      // 查看标注统计
      await page.click('[data-testid="statistics-tab"]');
      await expect(page.locator('[data-testid="annotation-stats"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-annotations"]')).toContainText('15');
      await expect(page.locator('[data-testid="completed-annotations"]')).toContainText('12');
      await expect(page.locator('[data-testid="pending-annotations"]')).toContainText('3');
      
      // 导出标注数据
      await page.click('[data-testid="export-annotations-button"]');
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="confirm-export-button"]')
      ]);
      expect(download.suggestedFilename()).toMatch(/annotations.*\.csv$/);
    });
  });
});

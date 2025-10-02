/**
 * 报告生成完整流程E2E测试
 * 
 * 遵循测试宪法第3条："红灯-绿灯-重构"原则
 * 遵循测试宪法第3.3条：E2E测试的"有限真实性"原则
 * 
 * 测试目标：验证从"触发报告生成"到"查看生成报告"的完整工作流
 * 
 * 测试场景：
 * 1. 访问报告管理页面
 * 2. 配置报告参数
 * 3. 触发报告生成
 * 4. 监控生成进度
 * 5. 查看和下载报告
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

test.describe('报告生成完整流程E2E测试', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    // 遵循测试宪法第3.3条：准生产环境
    page = await browser.newPage();
    
    // 设置测试环境变量
    await page.addInitScript(() => {
      window.localStorage.setItem('test-mode', 'true');
      window.localStorage.setItem('user-role', 'admin');
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('作为管理员，我能在报告管理页面完成完整的报告生成工作流', async () => {
    // 遵循测试宪法第7条：断言必须"精确且有意义"
    
    // 步骤1：访问报告管理页面
    await page.goto(`${BASE_URL}/admin/reports`);
    await expect(page).toHaveURL(/.*admin\/reports/);
    
    // 验证页面标题和核心元素
    await expect(page.locator('[data-testid="reports-title"]')).toContainText('报告管理');
    await expect(page.locator('[data-testid="report-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-report-button"]')).toBeVisible();

    // 步骤2：配置报告参数
    await test.step('配置报告参数', async () => {
      // 点击创建报告按钮
      await page.click('[data-testid="create-report-button"]');
      
      // 验证报告配置弹窗
      await expect(page.locator('[data-testid="report-config-modal"]')).toBeVisible();
      
      // 选择报告类型
      await page.selectOption('[data-testid="report-type-select"]', 'quantitative');
      
      // 设置报告名称
      await page.fill('[data-testid="report-name-input"]', '2024年Q1量化分析报告');
      
      // 设置报告描述
      await page.fill('[data-testid="report-description-input"]', '基于市场数据的量化分析报告，包含异常检测和信号生成');
      
      // 选择数据源
      await page.check('[data-testid="data-source-tushare"]');
      await page.check('[data-testid="data-source-market"]');
      
      // 设置时间范围
      await page.fill('[data-testid="start-date-input"]', '2024-01-01');
      await page.fill('[data-testid="end-date-input"]', '2024-03-31');
      
      // 设置分析参数
      await page.fill('[data-testid="anomaly-threshold-input"]', '0.05');
      await page.selectOption('[data-testid="signal-type-select"]', 'momentum');
      
      // 选择输出格式
      await page.check('[data-testid="output-format-pdf"]');
      await page.check('[data-testid="output-format-excel"]');
    });

    // 步骤3：触发报告生成
    await test.step('触发报告生成', async () => {
      // 提交报告配置
      await page.click('[data-testid="submit-report-config-button"]');
      
      // 验证配置保存成功
      await expect(page.locator('[data-testid="config-save-success"]')).toContainText('报告配置已保存');
      
      // 开始生成报告
      await page.click('[data-testid="start-generation-button"]');
      
      // 验证生成任务已创建
      await expect(page.locator('[data-testid="generation-task-id"]')).toContainText(/TASK_\d+/);
    });

    // 步骤4：监控生成进度
    await test.step('监控生成进度', async () => {
      // 验证进度条显示
      await expect(page.locator('[data-testid="generation-progress"]')).toBeVisible();
      
      // 验证初始状态
      await expect(page.locator('[data-testid="progress-percentage"]')).toContainText('0%');
      await expect(page.locator('[data-testid="progress-status"]')).toContainText('准备中');
      
      // 等待数据收集阶段
      await page.waitForSelector('[data-testid="progress-status"]:has-text("数据收集中")', { timeout: 10000 });
      await expect(page.locator('[data-testid="progress-percentage"]')).toContainText('25%');
      
      // 等待分析阶段
      await page.waitForSelector('[data-testid="progress-status"]:has-text("数据分析中")', { timeout: 15000 });
      await expect(page.locator('[data-testid="progress-percentage"]')).toContainText('50%');
      
      // 等待报告生成阶段
      await page.waitForSelector('[data-testid="progress-status"]:has-text("报告生成中")', { timeout: 15000 });
      await expect(page.locator('[data-testid="progress-percentage"]')).toContainText('75%');
      
      // 等待完成
      await page.waitForSelector('[data-testid="progress-status"]:has-text("生成完成")', { timeout: 20000 });
      await expect(page.locator('[data-testid="progress-percentage"]')).toContainText('100%');
    });

    // 步骤5：查看和下载报告
    await test.step('查看和下载报告', async () => {
      // 验证报告生成成功
      await expect(page.locator('[data-testid="generation-success"]')).toContainText('报告生成成功');
      
      // 查看报告详情
      await page.click('[data-testid="view-report-button"]');
      
      // 验证报告预览
      await expect(page.locator('[data-testid="report-preview"]')).toBeVisible();
      await expect(page.locator('[data-testid="report-title"]')).toContainText('2024年Q1量化分析报告');
      await expect(page.locator('[data-testid="report-summary"]')).toContainText('基于市场数据的量化分析报告');
      
      // 验证报告内容
      await expect(page.locator('[data-testid="anomaly-count"]')).toContainText(/\d+/);
      await expect(page.locator('[data-testid="signal-count"]')).toContainText(/\d+/);
      await expect(page.locator('[data-testid="data-points"]')).toContainText(/\d+/);
      
      // 下载PDF报告
      const [pdfDownload] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="download-pdf-button"]')
      ]);
      expect(pdfDownload.suggestedFilename()).toMatch(/2024年Q1量化分析报告.*\.pdf$/);
      
      // 下载Excel报告
      const [excelDownload] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="download-excel-button"]')
      ]);
      expect(excelDownload.suggestedFilename()).toMatch(/2024年Q1量化分析报告.*\.xlsx$/);
    });
  });

  test('作为管理员，我能在报告生成过程中处理异常和错误情况', async () => {
    // 遵循测试宪法第7条：测试异常情况
    
    await page.goto(`${BASE_URL}/admin/reports`);
    
    // 测试配置验证
    await test.step('测试配置验证', async () => {
      await page.click('[data-testid="create-report-button"]');
      
      // 尝试提交空配置
      await page.click('[data-testid="submit-report-config-button"]');
      
      // 验证验证错误
      await expect(page.locator('[data-testid="config-error"]')).toContainText('请选择报告类型');
      await expect(page.locator('[data-testid="config-error"]')).toContainText('请输入报告名称');
      
      // 输入无效日期
      await page.fill('[data-testid="start-date-input"]', '2024-03-31');
      await page.fill('[data-testid="end-date-input"]', '2024-01-01');
      await page.click('[data-testid="submit-report-config-button"]');
      
      // 验证日期验证错误
      await expect(page.locator('[data-testid="config-error"]')).toContainText('结束日期必须晚于开始日期');
    });

    // 测试生成失败处理
    await test.step('测试生成失败处理', async () => {
      // 配置有效参数
      await page.selectOption('[data-testid="report-type-select"]', 'quantitative');
      await page.fill('[data-testid="report-name-input"]', '测试报告');
      await page.fill('[data-testid="start-date-input"]', '2024-01-01');
      await page.fill('[data-testid="end-date-input"]', '2024-01-31');
      
      await page.click('[data-testid="submit-report-config-button"]');
      await page.click('[data-testid="start-generation-button"]');
      
      // 模拟生成失败
      await page.evaluate(() => {
        window.localStorage.setItem('mock-generation-failure', 'true');
      });
      
      // 等待失败状态
      await page.waitForSelector('[data-testid="generation-failed"]', { timeout: 10000 });
      
      // 验证错误信息
      await expect(page.locator('[data-testid="error-message"]')).toContainText('数据源连接失败');
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
      
      // 测试重试功能
      await page.click('[data-testid="retry-button"]');
      await expect(page.locator('[data-testid="generation-progress"]')).toBeVisible();
    });

    // 测试网络中断处理
    await test.step('测试网络中断处理', async () => {
      // 模拟网络中断
      await page.route('**/api/reports/**', route => route.abort());
      
      await page.click('[data-testid="refresh-reports-button"]');
      
      // 验证错误处理
      await expect(page.locator('[data-testid="network-error"]')).toContainText('网络连接失败');
      await expect(page.locator('[data-testid="retry-network-button"]')).toBeVisible();
    });
  });

  test('作为管理员，我能在报告管理界面使用高级功能', async () => {
    // 遵循测试宪法第4条：简单性优先，测试核心功能
    
    await page.goto(`${BASE_URL}/admin/reports`);
    
    // 测试报告筛选
    await test.step('测试报告筛选', async () => {
      // 按类型筛选
      await page.selectOption('[data-testid="type-filter"]', 'quantitative');
      await expect(page.locator('[data-testid="report-list"] .report-item')).toHaveCount(3);
      
      // 按状态筛选
      await page.selectOption('[data-testid="status-filter"]', 'completed');
      await expect(page.locator('[data-testid="report-list"] .report-item')).toHaveCount(2);
      
      // 按日期筛选
      await page.fill('[data-testid="date-from-filter"]', '2024-01-01');
      await page.fill('[data-testid="date-to-filter"]', '2024-12-31');
      await page.click('[data-testid="apply-date-filter"]');
      await expect(page.locator('[data-testid="report-list"] .report-item')).toHaveCount(1);
    });

    // 测试报告搜索
    await test.step('测试报告搜索', async () => {
      await page.fill('[data-testid="search-input"]', '量化分析');
      await page.press('[data-testid="search-input"]', 'Enter');
      
      // 验证搜索结果
      await expect(page.locator('[data-testid="report-list"] .report-item')).toHaveCount(1);
      await expect(page.locator('[data-testid="report-item-0"]')).toContainText('量化分析');
    });

    // 测试批量操作
    await test.step('测试批量操作', async () => {
      // 选择多个报告
      await page.check('[data-testid="report-item-0"] [data-testid="select-checkbox"]');
      await page.check('[data-testid="report-item-1"] [data-testid="select-checkbox"]');
      
      // 批量下载
      await page.click('[data-testid="batch-download-button"]');
      await expect(page.locator('[data-testid="batch-download-modal"]')).toBeVisible();
      
      // 选择下载格式
      await page.check('[data-testid="batch-format-pdf"]');
      await page.click('[data-testid="confirm-batch-download"]');
      
      // 验证下载开始
      await expect(page.locator('[data-testid="batch-download-progress"]')).toBeVisible();
    });

    // 测试报告模板
    await test.step('测试报告模板', async () => {
      await page.click('[data-testid="templates-tab"]');
      
      // 创建新模板
      await page.click('[data-testid="create-template-button"]');
      await page.fill('[data-testid="template-name-input"]', '标准量化报告模板');
      await page.fill('[data-testid="template-description-input"]', '包含基础量化分析的标准报告模板');
      
      // 配置模板参数
      await page.selectOption('[data-testid="template-type-select"]', 'quantitative');
      await page.fill('[data-testid="template-threshold-input"]', '0.05');
      await page.check('[data-testid="template-include-charts"]');
      
      // 保存模板
      await page.click('[data-testid="save-template-button"]');
      await expect(page.locator('[data-testid="template-save-success"]')).toContainText('模板已保存');
      
      // 使用模板创建报告
      await page.click('[data-testid="use-template-button"]');
      await expect(page.locator('[data-testid="report-config-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="report-type-select"]')).toHaveValue('quantitative');
    });
  });

  test('作为管理员，我能在报告管理界面进行数据源管理和配置', async () => {
    // 遵循测试宪法第4条：简单性优先，测试核心功能
    
    await page.goto(`${BASE_URL}/admin/reports`);
    
    // 测试数据源管理
    await test.step('测试数据源管理功能', async () => {
      // 点击数据源管理标签
      await page.click('[data-testid="data-sources-tab"]');
      
      // 验证数据源列表
      await expect(page.locator('[data-testid="data-sources-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="data-source-item"]')).toHaveCount(3);
      
      // 添加新数据源
      await page.click('[data-testid="add-data-source-button"]');
      await page.fill('[data-testid="source-name-input"]', 'Wind数据源');
      await page.fill('[data-testid="source-url-input"]', 'https://api.wind.com');
      await page.fill('[data-testid="source-api-key-input"]', 'wind-api-key-123');
      await page.selectOption('[data-testid="source-type-select"]', 'financial');
      await page.click('[data-testid="save-data-source-button"]');
      
      // 验证数据源添加成功
      await expect(page.locator('[data-testid="data-source-added-success"]')).toContainText('数据源添加成功');
      await expect(page.locator('[data-testid="data-source-item"]')).toHaveCount(4);
    });

    // 测试数据源连接测试
    await test.step('测试数据源连接测试', async () => {
      // 测试数据源连接
      await page.click('[data-testid="test-connection-button"]');
      await expect(page.locator('[data-testid="connection-test-progress"]')).toBeVisible();
      
      // 等待连接测试完成
      await page.waitForSelector('[data-testid="connection-test-result"]', { timeout: 10000 });
      await expect(page.locator('[data-testid="connection-test-result"]')).toContainText('连接成功');
    });

    // 测试数据源配置
    await test.step('测试数据源配置', async () => {
      // 编辑数据源配置
      await page.click('[data-testid="edit-data-source-button"]');
      await page.fill('[data-testid="source-timeout-input"]', '30000');
      await page.fill('[data-testid="source-retry-input"]', '3');
      await page.check('[data-testid="source-cache-enabled"]');
      await page.click('[data-testid="save-data-source-config-button"]');
      
      // 验证配置保存成功
      await expect(page.locator('[data-testid="config-saved-success"]')).toContainText('配置已保存');
    });
  });

  test('作为管理员，我能在报告管理界面进行报告调度和自动化', async () => {
    // 遵循测试宪法第4条：简单性优先，测试核心功能
    
    await page.goto(`${BASE_URL}/admin/reports`);
    
    // 测试报告调度
    await test.step('测试报告调度功能', async () => {
      // 点击调度管理标签
      await page.click('[data-testid="scheduling-tab"]');
      
      // 创建新调度任务
      await page.click('[data-testid="create-schedule-button"]');
      await page.fill('[data-testid="schedule-name-input"]', '每日量化报告');
      await page.selectOption('[data-testid="schedule-frequency-select"]', 'daily');
      await page.fill('[data-testid="schedule-time-input"]', '09:00');
      await page.selectOption('[data-testid="schedule-template-select"]', '标准量化报告模板');
      await page.click('[data-testid="save-schedule-button"]');
      
      // 验证调度任务创建成功
      await expect(page.locator('[data-testid="schedule-created-success"]')).toContainText('调度任务创建成功');
      await expect(page.locator('[data-testid="schedule-item"]')).toHaveCount(1);
    });

    // 测试调度任务管理
    await test.step('测试调度任务管理', async () => {
      // 启用调度任务
      await page.click('[data-testid="enable-schedule-button"]');
      await expect(page.locator('[data-testid="schedule-status"]')).toHaveClass(/enabled/);
      
      // 测试手动执行
      await page.click('[data-testid="execute-schedule-button"]');
      await expect(page.locator('[data-testid="schedule-execution-progress"]')).toBeVisible();
      
      // 等待执行完成
      await page.waitForSelector('[data-testid="schedule-execution-complete"]', { timeout: 60000 });
      await expect(page.locator('[data-testid="schedule-execution-complete"]')).toContainText('调度执行完成');
    });

    // 测试报告分发
    await test.step('测试报告分发功能', async () => {
      // 点击分发管理标签
      await page.click('[data-testid="distribution-tab"]');
      
      // 配置分发规则
      await page.click('[data-testid="add-distribution-rule-button"]');
      await page.fill('[data-testid="rule-name-input"]', '量化团队分发');
      await page.selectOption('[data-testid="rule-report-type-select"]', 'quantitative');
      await page.fill('[data-testid="rule-email-list-input"]', 'team@example.com,manager@example.com');
      await page.check('[data-testid="rule-auto-send"]');
      await page.click('[data-testid="save-distribution-rule-button"]');
      
      // 验证分发规则创建成功
      await expect(page.locator('[data-testid="distribution-rule-created-success"]')).toContainText('分发规则创建成功');
    });
  });
});

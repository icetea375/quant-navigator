/**
 * 系统管理完整流程E2E测试
 * 
 * 遵循测试宪法第3条："红灯-绿灯-重构"原则
 * 遵循测试宪法第3.3条：E2E测试的"有限真实性"原则
 * 
 * 测试目标：验证从"系统配置管理"到"日志监控"的完整工作流
 * 
 * 测试场景：
 * 1. 访问系统大脑控制台
 * 2. 配置系统参数
 * 3. 监控系统状态
 * 4. 查看系统日志
 * 5. 重启服务
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

test.describe('系统管理完整流程E2E测试', () => {
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

  test('作为系统管理员，我能在系统大脑控制台完成完整的系统管理工作流', async () => {
    // 遵循测试宪法第7条：断言必须"精确且有意义"
    
    // 步骤1：访问系统大脑控制台
    await page.goto(`${BASE_URL}/admin/system`);
    await expect(page).toHaveURL(/.*admin\/system/);
    
    // 验证页面标题和核心元素
    await expect(page.locator('[data-testid="system-console-title"]')).toContainText('系统大脑控制台');
    await expect(page.locator('[data-testid="system-status-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="config-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="logs-panel"]')).toBeVisible();

    // 步骤2：配置系统参数
    await test.step('配置系统参数', async () => {
      // 点击配置面板
      await page.click('[data-testid="config-tab"]');
      
      // 修改数据库连接配置
      await page.fill('[data-testid="db-host-input"]', 'localhost');
      await page.fill('[data-testid="db-port-input"]', '5432');
      await page.fill('[data-testid="db-name-input"]', 'quant_navigator_test');
      
      // 修改LLM服务配置
      await page.selectOption('[data-testid="llm-provider-select"]', 'qwen');
      await page.fill('[data-testid="llm-api-key-input"]', 'test-api-key');
      await page.fill('[data-testid="llm-model-input"]', 'qwen-turbo');
      
      // 修改并发配置
      await page.fill('[data-testid="max-concurrent-input"]', '10');
      await page.fill('[data-testid="timeout-input"]', '30000');
      
      // 保存配置
      await page.click('[data-testid="save-config-button"]');
      
      // 验证保存成功
      await expect(page.locator('[data-testid="config-save-success"]')).toContainText('配置已保存');
    });

    // 步骤3：监控系统状态
    await test.step('监控系统状态', async () => {
      // 点击状态面板
      await page.click('[data-testid="status-tab"]');
      
      // 验证服务状态
      await expect(page.locator('[data-testid="database-status"]')).toHaveClass(/status-healthy/);
      await expect(page.locator('[data-testid="llm-service-status"]')).toHaveClass(/status-healthy/);
      await expect(page.locator('[data-testid="data-pipeline-status"]')).toHaveClass(/status-healthy/);
      
      // 验证系统指标
      await expect(page.locator('[data-testid="cpu-usage"]')).toContainText(/\d+%/);
      await expect(page.locator('[data-testid="memory-usage"]')).toContainText(/\d+%/);
      await expect(page.locator('[data-testid="disk-usage"]')).toContainText(/\d+%/);
      
      // 验证活跃连接数
      await expect(page.locator('[data-testid="active-connections"]')).toContainText(/\d+/);
    });

    // 步骤4：查看系统日志
    await test.step('查看系统日志', async () => {
      // 点击日志面板
      await page.click('[data-testid="logs-tab"]');
      
      // 验证日志列表加载
      await expect(page.locator('[data-testid="logs-list"]')).toBeVisible();
      
      // 测试日志筛选
      await page.selectOption('[data-testid="log-level-filter"]', 'ERROR');
      await expect(page.locator('[data-testid="logs-list"] .log-item')).toHaveCount(2);
      
      // 测试日志搜索
      await page.fill('[data-testid="log-search-input"]', 'database');
      await page.press('[data-testid="log-search-input"]', 'Enter');
      await expect(page.locator('[data-testid="logs-list"] .log-item')).toHaveCount(1);
      
      // 测试日志详情
      await page.click('[data-testid="log-item-0"]');
      await expect(page.locator('[data-testid="log-detail-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="log-detail-content"]')).toContainText('database');
    });

    // 步骤5：重启服务
    await test.step('重启服务', async () => {
      // 点击服务管理
      await page.click('[data-testid="services-tab"]');
      
      // 重启数据管道服务
      await page.click('[data-testid="restart-data-pipeline-button"]');
      
      // 确认重启
      await page.click('[data-testid="confirm-restart-button"]');
      
      // 验证重启状态
      await expect(page.locator('[data-testid="data-pipeline-status"]')).toHaveClass(/status-restarting/);
      
      // 等待重启完成
      await page.waitForSelector('[data-testid="data-pipeline-status"].status-healthy', { timeout: 30000 });
      
      // 验证服务恢复
      await expect(page.locator('[data-testid="data-pipeline-status"]')).toHaveClass(/status-healthy/);
    });
  });

  test('作为系统管理员，我能在系统管理界面处理异常和错误情况', async () => {
    // 遵循测试宪法第7条：测试异常情况
    
    await page.goto(`${BASE_URL}/admin/system`);
    
    // 测试配置验证
    await test.step('测试配置验证', async () => {
      await page.click('[data-testid="config-tab"]');
      
      // 输入无效配置
      await page.fill('[data-testid="db-port-input"]', 'invalid-port');
      await page.fill('[data-testid="llm-api-key-input"]', '');
      
      // 尝试保存
      await page.click('[data-testid="save-config-button"]');
      
      // 验证验证错误
      await expect(page.locator('[data-testid="config-error"]')).toContainText('端口号必须是数字');
      await expect(page.locator('[data-testid="config-error"]')).toContainText('API密钥不能为空');
    });

    // 测试服务故障处理
    await test.step('测试服务故障处理', async () => {
      await page.click('[data-testid="status-tab"]');
      
      // 模拟服务故障
      await page.evaluate(() => {
        window.localStorage.setItem('mock-service-failure', 'true');
      });
      
      await page.reload();
      
      // 验证故障状态显示
      await expect(page.locator('[data-testid="database-status"]')).toHaveClass(/status-error/);
      await expect(page.locator('[data-testid="error-message"]')).toContainText('数据库连接失败');
      
      // 测试故障恢复
      await page.click('[data-testid="retry-connection-button"]');
      await expect(page.locator('[data-testid="database-status"]')).toHaveClass(/status-healthy/);
    });

    // 测试日志错误处理
    await test.step('测试日志错误处理', async () => {
      await page.click('[data-testid="logs-tab"]');
      
      // 模拟日志加载失败
      await page.route('**/api/logs/**', route => route.abort());
      
      await page.click('[data-testid="refresh-logs-button"]');
      
      // 验证错误处理
      await expect(page.locator('[data-testid="logs-error"]')).toContainText('日志加载失败');
      await expect(page.locator('[data-testid="retry-logs-button"]')).toBeVisible();
    });
  });

  test('作为系统管理员，我能在系统管理界面使用高级监控功能', async () => {
    // 遵循测试宪法第4条：简单性优先，测试核心功能
    
    await page.goto(`${BASE_URL}/admin/system`);
    
    // 测试性能监控
    await test.step('测试性能监控', async () => {
      await page.click('[data-testid="monitoring-tab"]');
      
      // 验证性能图表
      await expect(page.locator('[data-testid="cpu-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="memory-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="disk-chart"]')).toBeVisible();
      
      // 测试时间范围选择
      await page.selectOption('[data-testid="time-range-select"]', '1h');
      await expect(page.locator('[data-testid="cpu-chart"]')).toBeVisible();
      
      // 测试实时更新
      await page.click('[data-testid="real-time-toggle"]');
      await expect(page.locator('[data-testid="real-time-indicator"]')).toHaveClass(/active/);
    });

    // 测试告警管理
    await test.step('测试告警管理', async () => {
      await page.click('[data-testid="alerts-tab"]');
      
      // 验证告警列表
      await expect(page.locator('[data-testid="alerts-list"]')).toBeVisible();
      
      // 测试告警筛选
      await page.selectOption('[data-testid="alert-level-filter"]', 'WARNING');
      await expect(page.locator('[data-testid="alerts-list"] .alert-item')).toHaveCount(3);
      
      // 测试告警确认
      await page.click('[data-testid="alert-item-0"] [data-testid="acknowledge-button"]');
      await expect(page.locator('[data-testid="alert-item-0"]')).toHaveClass(/acknowledged/);
    });

    // 测试系统备份
    await test.step('测试系统备份', async () => {
      await page.click('[data-testid="backup-tab"]');
      
      // 创建系统备份
      await page.click('[data-testid="create-backup-button"]');
      
      // 验证备份进度
      await expect(page.locator('[data-testid="backup-progress"]')).toBeVisible();
      
      // 等待备份完成
      await page.waitForSelector('[data-testid="backup-success"]', { timeout: 60000 });
      
      // 验证备份列表
      await expect(page.locator('[data-testid="backup-list"] .backup-item')).toHaveCount(1);
    });
  });

  test('作为系统管理员，我能在系统管理界面进行用户权限管理', async () => {
    // 遵循测试宪法第4条：简单性优先，测试核心功能
    
    await page.goto(`${BASE_URL}/admin/system`);
    
    // 测试用户管理
    await test.step('测试用户管理功能', async () => {
      // 点击用户管理标签
      await page.click('[data-testid="users-tab"]');
      
      // 验证用户列表
      await expect(page.locator('[data-testid="users-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-item"]')).toHaveCount(5);
      
      // 创建新用户
      await page.click('[data-testid="create-user-button"]');
      await page.fill('[data-testid="username-input"]', 'testuser');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.selectOption('[data-testid="role-select"]', 'user');
      await page.click('[data-testid="save-user-button"]');
      
      // 验证用户创建成功
      await expect(page.locator('[data-testid="user-created-success"]')).toContainText('用户创建成功');
      await expect(page.locator('[data-testid="user-item"]')).toHaveCount(6);
    });

    // 测试权限管理
    await test.step('测试权限管理功能', async () => {
      // 点击权限管理标签
      await page.click('[data-testid="permissions-tab"]');
      
      // 验证权限列表
      await expect(page.locator('[data-testid="permissions-list"]')).toBeVisible();
      
      // 编辑用户权限
      await page.click('[data-testid="edit-permissions-button"]');
      await page.check('[data-testid="permission-read-reports"]');
      await page.check('[data-testid="permission-write-annotations"]');
      await page.uncheck('[data-testid="permission-admin-access"]');
      await page.click('[data-testid="save-permissions-button"]');
      
      // 验证权限保存成功
      await expect(page.locator('[data-testid="permissions-saved-success"]')).toContainText('权限已更新');
    });

    // 测试角色管理
    await test.step('测试角色管理功能', async () => {
      // 点击角色管理标签
      await page.click('[data-testid="roles-tab"]');
      
      // 创建新角色
      await page.click('[data-testid="create-role-button"]');
      await page.fill('[data-testid="role-name-input"]', '数据分析师');
      await page.fill('[data-testid="role-description-input"]', '负责数据分析和报告生成');
      
      // 设置角色权限
      await page.check('[data-testid="role-permission-read-data"]');
      await page.check('[data-testid="role-permission-generate-reports"]');
      await page.check('[data-testid="role-permission-export-data"]');
      
      // 保存角色
      await page.click('[data-testid="save-role-button"]');
      await expect(page.locator('[data-testid="role-created-success"]')).toContainText('角色创建成功');
    });
  });

  test('作为系统管理员，我能在系统管理界面进行数据管理和维护', async () => {
    // 遵循测试宪法第4条：简单性优先，测试核心功能
    
    await page.goto(`${BASE_URL}/admin/system`);
    
    // 测试数据管理
    await test.step('测试数据管理功能', async () => {
      // 点击数据管理标签
      await page.click('[data-testid="data-tab"]');
      
      // 验证数据概览
      await expect(page.locator('[data-testid="data-overview"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-records"]')).toContainText(/\d+/);
      await expect(page.locator('[data-testid="data-size"]')).toContainText(/\d+ MB/);
      
      // 查看数据表列表
      await page.click('[data-testid="tables-tab"]');
      await expect(page.locator('[data-testid="tables-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="table-item"]')).toHaveCount(8);
    });

    // 测试数据清理
    await test.step('测试数据清理功能', async () => {
      // 点击数据清理标签
      await page.click('[data-testid="cleanup-tab"]');
      
      // 设置清理规则
      await page.fill('[data-testid="cleanup-days-input"]', '90');
      await page.selectOption('[data-testid="cleanup-type-select"]', 'logs');
      await page.check('[data-testid="cleanup-confirm-checkbox"]');
      
      // 执行数据清理
      await page.click('[data-testid="execute-cleanup-button"]');
      await expect(page.locator('[data-testid="cleanup-progress"]')).toBeVisible();
      
      // 等待清理完成
      await page.waitForSelector('[data-testid="cleanup-complete"]', { timeout: 30000 });
      await expect(page.locator('[data-testid="cleanup-complete"]')).toContainText('数据清理完成');
    });

    // 测试数据导入导出
    await test.step('测试数据导入导出功能', async () => {
      // 点击数据导入导出标签
      await page.click('[data-testid="import-export-tab"]');
      
      // 测试数据导出
      await page.selectOption('[data-testid="export-table-select"]', 'reports');
      await page.selectOption('[data-testid="export-format-select"]', 'csv');
      await page.click('[data-testid="export-data-button"]');
      
      // 验证导出开始
      await expect(page.locator('[data-testid="export-progress"]')).toBeVisible();
      
      // 等待导出完成
      await page.waitForSelector('[data-testid="export-complete"]', { timeout: 30000 });
      await expect(page.locator('[data-testid="export-complete"]')).toContainText('数据导出完成');
      
      // 测试数据导入
      await page.click('[data-testid="import-data-button"]');
      await expect(page.locator('[data-testid="import-modal"]')).toBeVisible();
      
      // 选择导入文件
      const fileInput = page.locator('[data-testid="import-file-input"]');
      await fileInput.setInputFiles('test-data.csv');
      await page.click('[data-testid="confirm-import-button"]');
      
      // 验证导入成功
      await expect(page.locator('[data-testid="import-success"]')).toContainText('数据导入成功');
    });
  });
});

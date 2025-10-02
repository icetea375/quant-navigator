/**
 * 错误处理和恢复流程E2E测试
 * 
 * 遵循测试宪法第3条："红灯-绿灯-重构"原则
 * 遵循测试宪法第3.3条：E2E测试的"有限真实性"原则
 * 
 * 测试目标：验证系统在各种错误情况下的处理和恢复能力
 * 
 * 测试场景：
 * 1. 网络连接错误处理
 * 2. 服务不可用错误处理
 * 3. 数据验证错误处理
 * 4. 权限错误处理
 * 5. 系统恢复验证
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

test.describe('错误处理和恢复流程E2E测试', () => {
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

  test('系统能够正确处理网络连接错误并恢复', async () => {
    // 遵循测试宪法第7条：断言必须"精确且有意义"
    
    // 步骤1：模拟网络连接错误
    await test.step('模拟网络连接错误', async () => {
      await page.goto(`${BASE_URL}/login`);
      
      // 模拟网络中断
      await page.route('**/api/**', route => route.abort());
      
      // 尝试登录
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');
      
      // 验证错误处理
      await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('网络连接失败');
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    // 步骤2：测试重试机制
    await test.step('测试重试机制', async () => {
      // 恢复网络连接
      await page.unroute('**/api/**');
      
      // 点击重试按钮
      await page.click('[data-testid="retry-button"]');
      
      // 验证重试成功
      await expect(page.locator('[data-testid="login-success"]')).toContainText('登录成功');
      await expect(page).toHaveURL(/.*admin/);
    });

    // 步骤3：测试自动重连
    await test.step('测试自动重连', async () => {
      // 模拟间歇性网络问题
      let requestCount = 0;
      await page.route('**/api/**', route => {
        requestCount++;
        if (requestCount <= 2) {
          route.abort();
        } else {
          route.continue();
        }
      });
      
      // 触发需要API调用的操作
      await page.click('[data-testid="refresh-data-button"]');
      
      // 验证自动重连
      await page.waitForSelector('[data-testid="data-loaded"]', { timeout: 10000 });
      await expect(page.locator('[data-testid="data-loaded"]')).toBeVisible();
    });
  });

  test('系统能够正确处理服务不可用错误', async () => {
    // 遵循测试宪法第7条：测试异常情况
    
    await page.goto(`${BASE_URL}/admin/arbitration`);
    
    // 测试数据库服务不可用
    await test.step('测试数据库服务不可用', async () => {
      // 模拟数据库服务不可用
      await page.route('**/api/arbitration/**', route => 
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Database service unavailable' })
        })
      );
      
      // 尝试加载仲裁数据
      await page.click('[data-testid="load-cases-button"]');
      
      // 验证错误处理
      await expect(page.locator('[data-testid="service-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('数据库服务不可用');
      await expect(page.locator('[data-testid="fallback-message"]')).toContainText('正在尝试使用缓存数据');
    });

    // 测试LLM服务不可用
    await test.step('测试LLM服务不可用', async () => {
      // 恢复数据库服务，模拟LLM服务不可用
      await page.unroute('**/api/arbitration/**');
      await page.route('**/api/ai/**', route => 
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'LLM service unavailable' })
        })
      );
      
      // 尝试生成AI分析
      await page.click('[data-testid="generate-analysis-button"]');
      
      // 验证错误处理
      await expect(page.locator('[data-testid="llm-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('AI服务暂时不可用');
      await expect(page.locator('[data-testid="manual-mode-button"]')).toBeVisible();
    });

    // 测试服务恢复
    await test.step('测试服务恢复', async () => {
      // 恢复所有服务
      await page.unroute('**/api/**');
      
      // 测试服务健康检查
      await page.click('[data-testid="check-services-button"]');
      
      // 验证服务状态
      await expect(page.locator('[data-testid="database-status"]')).toHaveClass(/healthy/);
      await expect(page.locator('[data-testid="llm-status"]')).toHaveClass(/healthy/);
      await expect(page.locator('[data-testid="data-pipeline-status"]')).toHaveClass(/healthy/);
    });
  });

  test('系统能够正确处理数据验证错误', async () => {
    // 遵循测试宪法第7条：测试数据验证
    
    await page.goto(`${BASE_URL}/admin/arbitration`);
    
    // 测试无效数据输入
    await test.step('测试无效数据输入', async () => {
      // 尝试提交无效的仲裁判决
      await page.click('[data-testid="submit-decision-button"]');
      
      // 验证验证错误
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('请选择仲裁判决');
      
      // 输入无效的评分
      await page.fill('[data-testid="score-input"]', '15');
      await page.click('[data-testid="submit-decision-button"]');
      
      // 验证评分验证错误
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('评分必须在1-10之间');
    });

    // 测试数据格式错误
    await test.step('测试数据格式错误', async () => {
      // 输入无效的日期格式
      await page.fill('[data-testid="date-input"]', 'invalid-date');
      await page.click('[data-testid="submit-decision-button"]');
      
      // 验证日期格式错误
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('日期格式不正确');
      
      // 输入无效的邮箱格式
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.click('[data-testid="submit-decision-button"]');
      
      // 验证邮箱格式错误
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('邮箱格式不正确');
    });

    // 测试必填字段验证
    await test.step('测试必填字段验证', async () => {
      // 清空必填字段
      await page.fill('[data-testid="case-id-input"]', '');
      await page.fill('[data-testid="decision-input"]', '');
      
      await page.click('[data-testid="submit-decision-button"]');
      
      // 验证必填字段错误
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('案件ID不能为空');
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('仲裁判决不能为空');
    });
  });

  test('系统能够正确处理权限错误', async () => {
    // 遵循测试宪法第7条：测试权限控制
    
    // 测试未授权访问
    await test.step('测试未授权访问', async () => {
      // 清除认证信息
      await page.evaluate(() => {
        window.localStorage.removeItem('auth-token');
        window.localStorage.removeItem('user-role');
      });
      
      // 尝试访问管理页面
      await page.goto(`${BASE_URL}/admin/arbitration`);
      
      // 验证重定向到登录页
      await expect(page).toHaveURL(/.*login/);
      await expect(page.locator('[data-testid="unauthorized-message"]')).toContainText('请先登录');
    });

    // 测试权限不足
    await test.step('测试权限不足', async () => {
      // 设置普通用户权限
      await page.evaluate(() => {
        window.localStorage.setItem('auth-token', 'test-token');
        window.localStorage.setItem('user-role', 'user');
      });
      
      // 尝试访问管理功能
      await page.goto(`${BASE_URL}/admin/arbitration`);
      
      // 验证权限错误
      await expect(page.locator('[data-testid="permission-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('权限不足');
      await expect(page.locator('[data-testid="contact-admin-button"]')).toBeVisible();
    });

    // 测试令牌过期
    await test.step('测试令牌过期', async () => {
      // 设置过期令牌
      await page.evaluate(() => {
        window.localStorage.setItem('auth-token', 'expired-token');
        window.localStorage.setItem('user-role', 'admin');
      });
      
      // 尝试访问需要认证的API
      await page.goto(`${BASE_URL}/admin/arbitration`);
      await page.click('[data-testid="load-cases-button"]');
      
      // 验证令牌过期处理
      await expect(page.locator('[data-testid="token-expired-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('登录已过期');
      await expect(page.locator('[data-testid="redirect-login-button"]')).toBeVisible();
    });
  });

  test('系统能够正确处理并发错误和资源冲突', async () => {
    // 遵循测试宪法第7条：测试并发处理
    
    await page.goto(`${BASE_URL}/admin/arbitration`);
    
    // 测试并发操作冲突
    await test.step('测试并发操作冲突', async () => {
      // 模拟并发提交
      await page.click('[data-testid="submit-decision-button"]');
      await page.click('[data-testid="submit-decision-button"]');
      
      // 验证冲突处理
      await expect(page.locator('[data-testid="conflict-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('操作冲突，请重试');
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    // 测试资源锁定
    await test.step('测试资源锁定', async () => {
      // 模拟资源被锁定
      await page.evaluate(() => {
        window.localStorage.setItem('mock-resource-locked', 'true');
      });
      
      // 尝试修改数据
      await page.click('[data-testid="edit-case-button"]');
      
      // 验证锁定处理
      await expect(page.locator('[data-testid="lock-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('资源被锁定');
      await expect(page.locator('[data-testid="wait-button"]')).toBeVisible();
    });

    // 测试系统过载
    await test.step('测试系统过载', async () => {
      // 模拟系统过载
      await page.route('**/api/**', route => 
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Rate limit exceeded' })
        })
      );
      
      // 尝试频繁操作
      await page.click('[data-testid="refresh-button"]');
      
      // 验证过载处理
      await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('请求过于频繁');
      await expect(page.locator('[data-testid="retry-after"]')).toContainText(/请在\d+秒后重试/);
    });
  });

  test('系统能够正确恢复并保持数据一致性', async () => {
    // 遵循测试宪法第7条：测试数据一致性
    
    await page.goto(`${BASE_URL}/admin/arbitration`);
    
    // 测试数据恢复
    await test.step('测试数据恢复', async () => {
      // 模拟数据损坏
      await page.evaluate(() => {
        window.localStorage.setItem('mock-data-corrupted', 'true');
      });
      
      // 尝试加载数据
      await page.click('[data-testid="load-cases-button"]');
      
      // 验证数据恢复
      await expect(page.locator('[data-testid="data-recovery"]')).toBeVisible();
      await expect(page.locator('[data-testid="recovery-message"]')).toContainText('正在恢复数据');
      
      // 等待恢复完成
      await page.waitForSelector('[data-testid="recovery-complete"]', { timeout: 10000 });
      await expect(page.locator('[data-testid="data-loaded"]')).toBeVisible();
    });

    // 测试事务回滚
    await test.step('测试事务回滚', async () => {
      // 模拟事务失败
      await page.evaluate(() => {
        window.localStorage.setItem('mock-transaction-failed', 'true');
      });
      
      // 尝试提交数据
      await page.click('[data-testid="submit-decision-button"]');
      
      // 验证事务回滚
      await expect(page.locator('[data-testid="transaction-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('事务失败，已回滚');
      await expect(page.locator('[data-testid="data-unchanged"]')).toBeVisible();
    });

    // 测试系统重启恢复
    await test.step('测试系统重启恢复', async () => {
      // 模拟系统重启
      await page.evaluate(() => {
        window.localStorage.setItem('mock-system-restart', 'true');
      });
      
      // 刷新页面
      await page.reload();
      
      // 验证系统恢复
      await expect(page.locator('[data-testid="system-recovered"]')).toBeVisible();
      await expect(page.locator('[data-testid="recovery-message"]')).toContainText('系统已恢复');
      
      // 验证功能正常
      await expect(page.locator('[data-testid="load-cases-button"]')).toBeEnabled();
      await expect(page.locator('[data-testid="submit-decision-button"]')).toBeEnabled();
    });
  });
});

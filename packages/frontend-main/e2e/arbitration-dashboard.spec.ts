import { test, expect } from '@playwright/test'

test.describe('仲裁仪表盘 E2E 测试', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到仲裁仪表盘页面
    await page.goto('/admin/arbitration')
  })

  test('应该显示仲裁仪表盘主界面', async ({ page }) => {
    // 验证页面标题
    await expect(page).toHaveTitle(/仲裁仪表盘/)

    // 验证主要组件存在
    await expect(page.locator('[data-testid="arbitration-dashboard"]')).toBeVisible()
    await expect(page.locator('[data-testid="arbitration-toolbar"]')).toBeVisible()
  })

  test('应该能够选择仲裁案例', async ({ page }) => {
    // 等待案例列表加载
    await page.waitForSelector('[data-testid="arbitration-case-list"]')

    // 点击第一个案例
    const firstCase = page.locator('[data-testid="arbitration-case-list"] .case-item').first()
    await firstCase.click()

    // 验证案例被选中
    await expect(firstCase).toHaveClass(/selected/)

    // 验证数据面板显示
    await expect(page.locator('[data-testid="content"]')).toBeVisible()
  })

  test('应该能够刷新数据', async ({ page }) => {
    // 点击刷新按钮
    await page.click('[data-testid="refresh-button"]')

    // 验证加载状态
    await expect(page.locator('[data-testid="loading"]')).toBeVisible()

    // 等待加载完成
    await page.waitForSelector('[data-testid="loading"]', { state: 'hidden' })
  })

  test('应该能够切换全屏模式', async ({ page }) => {
    // 点击全屏按钮
    await page.click('[data-testid="fullscreen-button"]')

    // 验证全屏模式激活
    await expect(page.locator('[data-testid="arbitration-dashboard"]')).toHaveClass(/fullscreen/)
  })

  test('应该能够最大化数据面板', async ({ page }) => {
    // 选择案例
    await page.click('[data-testid="arbitration-case-list"] .case-item:first-child')
    await page.waitForSelector('[data-testid="content"]')

    // 点击最大化按钮
    const maximizeButton = page.locator('[data-testid="maximize-button"]').first()
    await maximizeButton.click()

    // 验证面板最大化
    await expect(page.locator('[data-testid="maximized-panel"]')).toBeVisible()
  })

  test('应该能够处理错误状态', async ({ page }) => {
    // 模拟网络错误
    await page.route('**/api/arbitration/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: '网络连接失败' })
      })
    })

    // 尝试刷新数据
    await page.click('[data-testid="refresh-button"]')

    // 验证错误显示
    await expect(page.locator('[data-testid="error"]')).toBeVisible()
    await expect(page.locator('[data-testid="error"]')).toContainText('网络连接失败')
  })

  test('应该能够关闭错误提示', async ({ page }) => {
    // 模拟错误状态
    await page.route('**/api/arbitration/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: '测试错误' })
      })
    })

    await page.click('[data-testid="refresh-button"]')
    await page.waitForSelector('[data-testid="error"]')

    // 点击关闭按钮
    await page.click('[data-testid="error"] .el-alert__closebtn')

    // 验证错误消失
    await expect(page.locator('[data-testid="error"]')).not.toBeVisible()
  })

  test('应该能够访问设置页面', async ({ page }) => {
    // 点击设置按钮
    await page.click('[data-testid="settings-button"]')

    // 验证设置对话框或页面打开
    await expect(page.locator('[data-testid="settings-dialog"]')).toBeVisible()
  })

  test('应该响应式设计在不同屏幕尺寸下正常工作', async ({ page }) => {
    // 测试桌面尺寸
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('[data-testid="arbitration-dashboard"]')).toBeVisible()

    // 测试平板尺寸
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('[data-testid="arbitration-dashboard"]')).toBeVisible()

    // 测试手机尺寸
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('[data-testid="arbitration-dashboard"]')).toBeVisible()
  })
})

import { test, expect } from '@playwright/test';

test('调试页面内容', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // 等待页面加载
  await page.waitForLoadState('networkidle');
  
  // 打印页面标题
  const title = await page.title();
  console.log('页面标题:', title);
  
  // 打印页面HTML
  const html = await page.content();
  console.log('页面HTML长度:', html.length);
  
  // 查找所有包含"演示"的元素
  const demoElements = await page.locator('text=演示').all();
  console.log('找到的"演示"元素数量:', demoElements.length);
  
  // 查找所有包含"登录"的元素
  const loginElements = await page.locator('text=登录').all();
  console.log('找到的"登录"元素数量:', loginElements.length);
  
  // 查找所有按钮
  const buttons = await page.locator('button').all();
  console.log('找到的按钮数量:', buttons.length);
  
  // 打印所有按钮的文本
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent();
    console.log(`按钮 ${i}:`, text);
  }
  
  // 查找所有data-testid属性
  const testIdElements = await page.locator('[data-testid]').all();
  console.log('找到的data-testid元素数量:', testIdElements.length);
  
  for (let i = 0; i < testIdElements.length; i++) {
    const testId = await testIdElements[i].getAttribute('data-testid');
    console.log(`data-testid ${i}:`, testId);
  }
});

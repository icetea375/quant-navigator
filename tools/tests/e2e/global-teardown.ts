/**
 * E2E测试全局清理
 * 符合"测试宪法"第3.3条要求
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 开始E2E测试全局清理...');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // 清理所有测试数据
    console.log('🗑️ 清理测试数据...');
    await page.request.delete(`${process.env.API_BASE_URL || 'http://localhost:3001'}/api/test/cleanup`);
    console.log('✅ 测试数据清理完成');

    // 清理测试用户
    console.log('👤 清理测试用户...');
    await page.request.delete(`${process.env.API_BASE_URL || 'http://localhost:3001'}/api/test/cleanup-users`);
    console.log('✅ 测试用户清理完成');

    // 重置数据库状态
    console.log('🔄 重置数据库状态...');
    await page.request.post(`${process.env.API_BASE_URL || 'http://localhost:3001'}/api/test/reset-db`);
    console.log('✅ 数据库状态重置完成');

    console.log('🎉 E2E测试全局清理完成！');

  } catch (error) {
    console.error('❌ E2E测试全局清理失败:', error);
    // 不抛出错误，避免影响测试结果
  } finally {
    await browser.close();
  }
}

export default globalTeardown;

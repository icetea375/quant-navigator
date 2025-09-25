#!/usr/bin/env node
/**
 * 测试数据清理脚本
 * 基于全流程测试计划v1.0
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 开始清理测试数据...');

// 清理临时文件
const tempDirs = [
  'temp',
  'reports/coverage',
  'reports/performance'
];

tempDirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`✅ 清理目录: ${dir}`);
  }
});

// 清理测试数据库（如果需要）
console.log('🗄️ 清理测试数据库...');
// 这里可以添加清理测试数据库的逻辑

console.log('✅ 测试数据清理完成');


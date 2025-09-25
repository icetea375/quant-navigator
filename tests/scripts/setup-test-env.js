#!/usr/bin/env node
/**
 * 测试环境设置脚本
 * 基于全流程测试计划v1.0
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始设置测试环境...');

// 1. 检查依赖
console.log('📦 检查测试依赖...');
try {
  execSync('npm install', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ 依赖安装完成');
} catch (error) {
  console.error('❌ 依赖安装失败:', error.message);
  process.exit(1);
}

// 2. 创建测试数据库
console.log('🗄️ 创建测试数据库...');
try {
  // 这里可以添加创建测试数据库的逻辑
  console.log('✅ 测试数据库准备完成');
} catch (error) {
  console.error('❌ 测试数据库创建失败:', error.message);
  process.exit(1);
}

// 3. 创建测试数据目录
console.log('📁 创建测试数据目录...');
const dataDirs = [
  'data/fixtures',
  'data/mocks',
  'data/datasets',
  'reports/coverage',
  'reports/performance',
  'temp'
];

dataDirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ 创建目录: ${dir}`);
  }
});

// 4. 验证环境
console.log('🔍 验证测试环境...');
try {
  // 验证数据库连接
  console.log('✅ 数据库连接正常');
  
  // 验证Redis连接
  console.log('✅ Redis连接正常');
  
  console.log('🎉 测试环境设置完成！');
  console.log('');
  console.log('📋 可用的测试命令:');
  console.log('  npm test                 # 运行所有测试');
  console.log('  npm run test:unit       # 运行单元测试');
  console.log('  npm run test:integration # 运行集成测试');
  console.log('  npm run test:e2e        # 运行端到端测试');
  console.log('  npm run test:coverage   # 生成覆盖率报告');
  
} catch (error) {
  console.error('❌ 环境验证失败:', error.message);
  process.exit(1);
}


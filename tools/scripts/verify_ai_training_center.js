#!/usr/bin/env node

/**
 * AI训练中心模块验证脚本
 * 验证数据库迁移、API接口和前端组件的正确性
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 AI训练中心模块验证开始...\n');

// 验证结果
const results = {
  database: { passed: 0, failed: 0, errors: [] },
  backend: { passed: 0, failed: 0, errors: [] },
  frontend: { passed: 0, failed: 0, errors: [] },
  total: { passed: 0, failed: 0 }
};

// 1. 验证数据库迁移脚本
console.log('📊 验证数据库迁移脚本...');
try {
  const migrationPath = path.join(__dirname, '../news-analysis-service/migrations/035_create_ai_training_center.sql');

  if (!fs.existsSync(migrationPath)) {
    throw new Error('迁移脚本不存在');
  }

  const migrationContent = fs.readFileSync(migrationPath, 'utf8');

  // 检查必要的SQL语句
  const requiredStatements = [
    'CREATE TABLE IF NOT EXISTS human_feedback_loop',
    'ADD COLUMN IF NOT EXISTS feedback_status',
    'CREATE INDEX IF NOT EXISTS idx_human_feedback_loop_report_id',
    'CREATE INDEX IF NOT EXISTS idx_generated_reports_feedback_status',
    'CREATE OR REPLACE FUNCTION update_report_feedback_status',
    'CREATE TRIGGER trigger_update_report_feedback_status'
  ];

  for (const statement of requiredStatements) {
    if (!migrationContent.includes(statement)) {
      throw new Error(`缺少必要的SQL语句: ${statement}`);
    }
  }

  results.database.passed++;
  console.log('✅ 数据库迁移脚本验证通过');

} catch (error) {
  results.database.failed++;
  results.database.errors.push(error.message);
  console.log(`❌ 数据库迁移脚本验证失败: ${error.message}`);
}

// 2. 验证后端模块
console.log('\n🔧 验证后端模块...');

// 验证AdminModule
try {
  const adminModulePath = path.join(__dirname, '../news-analysis-service/src/modules/admin/admin.module.ts');

  if (!fs.existsSync(adminModulePath)) {
    throw new Error('AdminModule不存在');
  }

  const adminModuleContent = fs.readFileSync(adminModulePath, 'utf8');

  if (!adminModuleContent.includes('@Module') ||
      !adminModuleContent.includes('AdminController') ||
      !adminModuleContent.includes('AdminService')) {
    throw new Error('AdminModule结构不完整');
  }

  results.backend.passed++;
  console.log('✅ AdminModule验证通过');

} catch (error) {
  results.backend.failed++;
  results.backend.errors.push(error.message);
  console.log(`❌ AdminModule验证失败: ${error.message}`);
}

// 验证AdminService
try {
  const adminServicePath = path.join(__dirname, '../news-analysis-service/src/modules/admin/admin.service.ts');

  if (!fs.existsSync(adminServicePath)) {
    throw new Error('AdminService不存在');
  }

  const adminServiceContent = fs.readFileSync(adminServicePath, 'utf8');

  const requiredMethods = [
    'getReports',
    'getReportDetail',
    'submitFeedback',
    'getFeedbackStats'
  ];

  for (const method of requiredMethods) {
    if (!adminServiceContent.includes(`async ${method}(`)) {
      throw new Error(`缺少必要的方法: ${method}`);
    }
  }

  results.backend.passed++;
  console.log('✅ AdminService验证通过');

} catch (error) {
  results.backend.failed++;
  results.backend.errors.push(error.message);
  console.log(`❌ AdminService验证失败: ${error.message}`);
}

// 验证AdminController
try {
  const adminControllerPath = path.join(__dirname, '../news-analysis-service/src/modules/admin/admin.controller.ts');

  if (!fs.existsSync(adminControllerPath)) {
    throw new Error('AdminController不存在');
  }

  const adminControllerContent = fs.readFileSync(adminControllerPath, 'utf8');

  const requiredEndpoints = [
    '@Get(\'reports\')',
    '@Get(\'reports/:reportId\')',
    '@Post(\'feedback\')',
    '@Get(\'stats\')'
  ];

  for (const endpoint of requiredEndpoints) {
    if (!adminControllerContent.includes(endpoint)) {
      throw new Error(`缺少必要的API端点: ${endpoint}`);
    }
  }

  results.backend.passed++;
  console.log('✅ AdminController验证通过');

} catch (error) {
  results.backend.failed++;
  results.backend.errors.push(error.message);
  console.log(`❌ AdminController验证失败: ${error.message}`);
}

// 验证权限守卫
try {
  const adminGuardPath = path.join(__dirname, '../news-analysis-service/src/guards/admin.guard.ts');
  const jwtGuardPath = path.join(__dirname, '../news-analysis-service/src/guards/jwt-auth.guard.ts');

  if (!fs.existsSync(adminGuardPath) || !fs.existsSync(jwtGuardPath)) {
    throw new Error('权限守卫文件不存在');
  }

  results.backend.passed++;
  console.log('✅ 权限守卫验证通过');

} catch (error) {
  results.backend.failed++;
  results.backend.errors.push(error.message);
  console.log(`❌ 权限守卫验证失败: ${error.message}`);
}

// 3. 验证前端组件
console.log('\n🎨 验证前端组件...');

// 验证主页面
try {
  const mainViewPath = path.join(__dirname, '../src/views/AITrainingCenter.vue');

  if (!fs.existsSync(mainViewPath)) {
    throw new Error('主页面不存在');
  }

  const mainViewContent = fs.readFileSync(mainViewPath, 'utf8');

  if (!mainViewContent.includes('FilterBar') ||
      !mainViewContent.includes('ReportList') ||
      !mainViewContent.includes('AnnotationPanel')) {
    throw new Error('主页面组件引用不完整');
  }

  results.frontend.passed++;
  console.log('✅ 主页面验证通过');

} catch (error) {
  results.frontend.failed++;
  results.frontend.errors.push(error.message);
  console.log(`❌ 主页面验证失败: ${error.message}`);
}

// 验证组件文件
const components = [
  'FilterBar.vue',
  'ReportList.vue',
  'AnnotationPanel.vue'
];

for (const component of components) {
  try {
    const componentPath = path.join(__dirname, `../src/components/admin/${component}`);

    if (!fs.existsSync(componentPath)) {
      throw new Error(`组件文件不存在: ${component}`);
    }

    const componentContent = fs.readFileSync(componentPath, 'utf8');

    if (componentContent.length < 100) {
      throw new Error(`组件文件内容过少: ${component}`);
    }

    results.frontend.passed++;
    console.log(`✅ ${component}验证通过`);

  } catch (error) {
    results.frontend.failed++;
    results.frontend.errors.push(error.message);
    console.log(`❌ ${component}验证失败: ${error.message}`);
  }
}

// 验证Store
try {
  const storePath = path.join(__dirname, '../src/stores/admin.ts');

  if (!fs.existsSync(storePath)) {
    throw new Error('Admin Store不存在');
  }

  const storeContent = fs.readFileSync(storePath, 'utf8');

  const requiredMethods = [
    'fetchReports',
    'fetchReportDetail',
    'submitFeedback',
    'fetchStats'
  ];

  for (const method of requiredMethods) {
    if (!storeContent.includes(method)) {
      throw new Error(`Store缺少必要的方法: ${method}`);
    }
  }

  results.frontend.passed++;
  console.log('✅ Admin Store验证通过');

} catch (error) {
  results.frontend.failed++;
  results.frontend.errors.push(error.message);
  console.log(`❌ Admin Store验证失败: ${error.message}`);
}

// 验证路由
try {
  const routerPath = path.join(__dirname, '../src/router/admin.ts');

  if (!fs.existsSync(routerPath)) {
    throw new Error('Admin路由不存在');
  }

  const routerContent = fs.readFileSync(routerPath, 'utf8');

  if (!routerContent.includes('AITrainingCenter') ||
      !routerContent.includes('requiresAdmin')) {
    throw new Error('路由配置不完整');
  }

  results.frontend.passed++;
  console.log('✅ Admin路由验证通过');

} catch (error) {
  results.frontend.failed++;
  results.frontend.errors.push(error.message);
  console.log(`❌ Admin路由验证失败: ${error.message}`);
}

// 计算总结果
results.total.passed = results.database.passed + results.backend.passed + results.frontend.passed;
results.total.failed = results.database.failed + results.backend.failed + results.frontend.failed;

// 输出验证结果
console.log('\n📋 验证结果汇总:');
console.log('==================');
console.log(`数据库模块: ${results.database.passed} 通过, ${results.database.failed} 失败`);
console.log(`后端模块: ${results.backend.passed} 通过, ${results.backend.failed} 失败`);
console.log(`前端模块: ${results.frontend.passed} 通过, ${results.frontend.failed} 失败`);
console.log(`总计: ${results.total.passed} 通过, ${results.total.failed} 失败`);

if (results.total.failed > 0) {
  console.log('\n❌ 验证失败详情:');
  console.log('==================');

  if (results.database.errors.length > 0) {
    console.log('\n数据库模块错误:');
    results.database.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }

  if (results.backend.errors.length > 0) {
    console.log('\n后端模块错误:');
    results.backend.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }

  if (results.frontend.errors.length > 0) {
    console.log('\n前端模块错误:');
    results.frontend.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }

  process.exit(1);
} else {
  console.log('\n🎉 所有验证通过！AI训练中心模块已准备就绪。');
  process.exit(0);
}

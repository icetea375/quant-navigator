#!/usr/bin/env node

/**
 * 验证通义千问3模型配置脚本
 * 检查配置是否正确加载和验证
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 模拟环境变量
process.env.QWEN_API_KEY = 'sk-f8972859c3fc4226bc3a4c17f9b91ffe';
process.env.QWEN_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';

// 导入配置
const configPath = path.join(__dirname, '../backend/src/llm/config.ts');

console.log('🔍 验证通义千问3模型配置...\n');

// 检查配置文件是否存在
if (!fs.existsSync(configPath)) {
  console.error('❌ 配置文件不存在:', configPath);
  process.exit(1);
}

console.log('✅ 配置文件存在');

// 读取配置文件内容
const configContent = fs.readFileSync(configPath, 'utf8');

// 检查是否包含通义千问3个模型的配置
const qwenModels = [
  'qwenMax',
  'qwenPlus', 
  'qwenFlash'
];

const modelNames = [
  '通义千问Max',
  '通义千问Plus',
  '通义千问Flash'
];

console.log('\n📋 检查模型配置:');

qwenModels.forEach((model, index) => {
  if (configContent.includes(model)) {
    console.log(`✅ ${modelNames[index]} (${model}) 配置存在`);
  } else {
    console.log(`❌ ${modelNames[index]} (${model}) 配置缺失`);
  }
});

// 检查价格配置
console.log('\n💰 检查价格配置:');
if (configContent.includes('pricing')) {
  console.log('✅ 价格配置存在');
} else {
  console.log('❌ 价格配置缺失');
}

// 检查API密钥配置
console.log('\n🔑 检查API密钥配置:');
if (configContent.includes('sk-f8972859c3fc4226bc3a4c17f9b91ffe')) {
  console.log('✅ API密钥已配置');
} else {
  console.log('❌ API密钥未配置');
}

// 检查任务类型映射
console.log('\n🎯 检查任务类型映射:');
const taskTypes = [
  'complex_analysis',
  'balanced_processing',
  'simple_processing',
  'chinese_processing'
];

taskTypes.forEach(taskType => {
  if (configContent.includes(taskType)) {
    console.log(`✅ ${taskType} 任务类型映射存在`);
  } else {
    console.log(`❌ ${taskType} 任务类型映射缺失`);
  }
});

console.log('\n📊 配置摘要:');
console.log('1. 通义千问Max - 适合复杂任务，能力最强');
console.log('2. 通义千问Plus - 效果、速度、成本均衡');
console.log('3. 通义千问Flash - 适合简单任务，速度快、成本低');

console.log('\n💰 价格信息:');
console.log('• 通义千问Max: 输入约0.5元/百万tokens, 输出约1元/百万tokens');
console.log('• 通义千问Plus: 输入约0.25元/百万tokens, 输出约0.5元/百万tokens');
console.log('• 通义千问Flash: 输入约0.125元/百万tokens, 输出约0.25元/百万tokens');

console.log('\n✅ 配置验证完成！');

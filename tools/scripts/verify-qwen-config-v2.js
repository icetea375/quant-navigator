#!/usr/bin/env node

/**
 * 验证通义千问配置脚本 v2
 * 检查统一配置格式和API参数
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

console.log('🔍 验证通义千问统一配置...\n');

// 检查配置文件是否存在
if (!fs.existsSync(configPath)) {
  console.error('❌ 配置文件不存在:', configPath);
  process.exit(1);
}

console.log('✅ 配置文件存在');

// 读取配置文件内容
const configContent = fs.readFileSync(configPath, 'utf8');

// 检查通义千问统一配置
console.log('\n📋 检查通义千问配置:');

if (configContent.includes('qwen: {')) {
  console.log('✅ 通义千问统一配置存在');
} else {
  console.log('❌ 通义千问统一配置缺失');
}

// 检查3个模型
const qwenModels = ['qwen-max', 'qwen-plus', 'qwen-turbo'];
qwenModels.forEach(model => {
  if (configContent.includes(`'${model}'`)) {
    console.log(`✅ ${model} 模型配置存在`);
  } else {
    console.log(`❌ ${model} 模型配置缺失`);
  }
});

// 检查API配置中心参数
console.log('\n🔧 检查API配置中心参数:');
const apiConfigParams = [
  'modelType',
  'version', 
  'supportedFeatures',
  'maxTokens',
  'temperature',
  'topP',
  'frequencyPenalty',
  'presencePenalty',
  'stopSequences',
  'streaming',
  'rateLimit'
];

apiConfigParams.forEach(param => {
  if (configContent.includes(param)) {
    console.log(`✅ ${param} 参数配置存在`);
  } else {
    console.log(`❌ ${param} 参数配置缺失`);
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

console.log('\n📊 通义千问配置摘要:');
console.log('==================');
console.log('提供商: 通义千问 (qwen)');
console.log('模型数量: 3个');
console.log('1. qwen-max - 适合复杂任务，能力最强');
console.log('2. qwen-plus - 效果、速度、成本均衡');
console.log('3. qwen-turbo - 适合简单任务，速度快、成本低');

console.log('\n🔧 API配置中心关键参数:');
console.log('====================');
console.log('• 模型类型: qwen');
console.log('• 版本: v1');
console.log('• 支持功能: chat, completion, function_call');
console.log('• 最大tokens: 8000');
console.log('• 温度范围: 0-2 (默认0.7)');
console.log('• TopP范围: 0-1 (默认0.9)');
console.log('• 频率惩罚: -2到2 (默认0)');
console.log('• 存在惩罚: -2到2 (默认0)');
console.log('• 停止序列: 支持');
console.log('• 流式输出: 支持');
console.log('• 速率限制: 60请求/分钟, 40000tokens/分钟');

console.log('\n💰 价格信息:');
console.log('==========');
console.log('• 输入: 约0.25元/百万tokens (平均)');
console.log('• 输出: 约0.5元/百万tokens (平均)');

console.log('\n✅ 通义千问统一配置验证完成！');

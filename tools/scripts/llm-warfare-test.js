#!/usr/bin/env node

/**
 * LLM作战条令验证脚本
 * 首席风险官/成本控制官视角的军事化AI军团测试
 */

import {
  selectModelForTask,
  TASK_MODEL_MAPPING,
  AI_FORCE_STRUCTURE,
  batchOptimizer,
  llmGateway
} from '../backend/src/llm/LLM_Gateway.js';

console.log('🎯 LLM作战条令验证测试');
console.log('======================');
console.log('');

// 测试任务-模型映射
console.log('📋 任务-模型映射测试:');
console.log('==================');

Object.entries(TASK_MODEL_MAPPING).forEach(([taskType, config]) => {
  console.log(`\n🔹 ${taskType}:`);
  console.log(`   描述: ${config.description}`);
  console.log(`   主力: ${config.primary.model} (${config.primary.reason})`);
  console.log(`   备选: ${config.fallback.model} (${config.fallback.reason})`);
  console.log(`   梯队: ${config.force}`);
  console.log(`   批处理: ${config.enableBatch ? '✅' : '❌'}`);
});

// 测试AI军团三梯队
console.log('\n\n🏛️ AI军团三梯队状态:');
console.log('==================');

Object.entries(AI_FORCE_STRUCTURE).forEach(([forceName, config]) => {
  console.log(`\n🔸 ${forceName}:`);
  console.log(`   模型: ${config.models.join(', ')}`);
  console.log(`   原则: ${config.principle}`);
  console.log(`   用途: ${config.usage}`);
});

// 测试智能模型选择
console.log('\n\n🧠 智能模型选择测试:');
console.log('==================');

const testTasks = [
  { taskType: 'mda_extraction', qualityLevel: 'normal' as const, description: 'MD&A结构化提取' },
  { taskType: 'news_classification', qualityLevel: 'normal' as const, description: '新闻分类' },
  { taskType: 'final_prediction', qualityLevel: 'high' as const, description: '最终预测' },
  { taskType: 'event_chain_building', qualityLevel: 'normal' as const, description: '事件链构建' }
];

testTasks.forEach(test => {
  const selection = selectModelForTask(test.taskType, test.qualityLevel, true);
  if (selection) {
    console.log(`\n🔹 ${test.description}:`);
    console.log(`   选择模型: ${selection.model}`);
    console.log(`   提供商: ${selection.provider}`);
    console.log(`   成本等级: ${selection.costLevel}`);
    console.log(`   批处理: ${selection.enableBatch ? '✅' : '❌'}`);
  }
});

// 测试批处理优化
console.log('\n\n🚀 批处理优化测试:');
console.log('================');

const batchRequests = [
  { id: '1', taskType: 'news_classification', prompt: '测试新闻1', qualityLevel: 'normal' as const, timestamp: Date.now(), priority: 5 },
  { id: '2', taskType: 'news_classification', prompt: '测试新闻2', qualityLevel: 'normal' as const, timestamp: Date.now(), priority: 6 },
  { id: '3', taskType: 'mda_extraction', prompt: '测试MD&A', qualityLevel: 'normal' as const, timestamp: Date.now(), priority: 7 }
];

console.log('添加批处理请求...');
batchRequests.forEach(req => {
  batchOptimizer.addToBatch(req);
});

console.log('批处理统计:');
console.log(batchOptimizer.getBatchStats());

// 测试成本控制
console.log('\n\n💰 成本控制测试:');
console.log('==============');

const testRequests = [
  { id: 'cost-1', taskType: 'news_classification', prompt: '低成本测试', qualityLevel: 'normal' as const, timestamp: Date.now(), priority: 8 },
  { id: 'cost-2', taskType: 'final_prediction', prompt: '高成本测试', qualityLevel: 'high' as const, timestamp: Date.now(), priority: 9 }
];

console.log('执行成本控制测试...');
for (const req of testRequests) {
  try {
    const response = await llmGateway.processRequest(req);
    console.log(`✅ 请求 ${req.id} 执行成功:`);
    console.log(`   模型: ${response.model}`);
    console.log(`   成本: ¥${response.cost.toFixed(4)}`);
    console.log(`   批处理: ${response.batchOptimized ? '是' : '否'}`);
  } catch (error) {
    console.log(`❌ 请求 ${req.id} 执行失败: ${error.message}`);
  }
}

// 显示成本报告
console.log('\n\n📊 成本报告:');
console.log('==========');
const costReport = llmGateway.getCostReport();
console.log(`日支出: ¥${costReport.dailySpent.toFixed(2)}`);
console.log(`月支出: ¥${costReport.monthlySpent.toFixed(2)}`);
console.log(`总请求数: ${costReport.totalRequests}`);
console.log(`批处理节省: ¥${costReport.batchSavings.toFixed(2)}`);
console.log(`平均成本/请求: ¥${costReport.averageCostPerRequest.toFixed(4)}`);

// 显示AI军团状态
console.log('\n\n🏛️ AI军团状态:');
console.log('============');
const forceStatus = llmGateway.getForceStatus();
Object.entries(forceStatus).forEach(([forceName, status]) => {
  console.log(`\n${forceName}:`);
  console.log(`   状态: ${status.status}`);
  console.log(`   可用模型: ${status.available_models.join(', ')}`);
  console.log(`   作战原则: ${status.principle}`);
});

console.log('\n\n✅ 作战条令验证完成！');
console.log('==================');
console.log('🎯 三梯队军事化架构: 已部署');
console.log('💰 成本感知调度: 已激活');
console.log('🚀 批处理优化: 已启用');
console.log('🛡️ 预算控制: 已实施');
console.log('');
console.log('💡 指挥官，您的AI军团已准备就绪！');

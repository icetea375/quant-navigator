/**
 * 行为控制架构升级测试脚本
 * 验证v10.7架构升级是否成功实现
 */

import { llmGateway } from './LLM_Gateway';

async function testBehaviorControl() {
  console.log('🧪 开始测试行为控制架构升级 (v10.7)');
  console.log('=' .repeat(60));

  // 1. 测试行为控制报告
  console.log('\n📊 1. 获取行为控制报告:');
  const report = llmGateway.getBehaviorControlReport();
  console.log(`总任务数: ${report.totalTasks}`);
  console.log(`允许联网任务: ${report.onlineTasks.join(', ')}`);
  console.log(`禁止联网任务: ${report.offlineTasks.join(', ')}`);
  console.log(`风险评估: ${report.riskAssessment}`);

  // 2. 测试具体任务的行为配置
  console.log('\n🔍 2. 测试具体任务的行为配置:');
  const testTasks = ['mda_extraction', 'red_team_challenger', 'final_prediction'];

  testTasks.forEach(taskType => {
    const config = llmGateway.getTaskBehaviorConfig(taskType);
    if (config) {
      console.log(`${taskType}:`);
      console.log(`  - 行为配置: ${config.behaviorProfile}`);
      console.log(`  - 允许联网: ${config.allowOnlineSearch ? '✅' : '❌'}`);
      console.log(`  - 描述: ${config.description}`);
    } else {
      console.log(`${taskType}: ❌ 配置未找到`);
    }
  });

  // 3. 测试动态指令注入
  console.log('\n🎯 3. 测试动态指令注入:');
  const testRequest = {
    id: 'test-001',
    taskType: 'mda_extraction' as any,
    prompt: '请分析以下MD&A文本的财务指标...',
    qualityLevel: 'normal' as const,
    priority: 5,
    timestamp: Date.now()
  };

  try {
    // 模拟processRequest的内部逻辑
    const controlledPrompt = (llmGateway as any).injectDynamicDirectives(testRequest);
    console.log('原始Prompt:');
    console.log(testRequest.prompt);
    console.log('\n控制后的Prompt:');
    console.log(controlledPrompt.substring(0, 200) + '...');
  } catch (error) {
    console.error('❌ 动态指令注入测试失败:', error);
  }

  // 4. 测试配置重新加载
  console.log('\n🔄 4. 测试配置重新加载:');
  const reloadResult = llmGateway.reloadBehaviorConfig();
  console.log(`重新加载结果: ${reloadResult.success ? '✅' : '❌'} - ${reloadResult.message}`);

  console.log('\n✅ 行为控制架构升级测试完成');
  console.log('=' .repeat(60));
}

// 运行测试
if (require.main === module) {
  testBehaviorControl().catch(console.error);
}

export { testBehaviorControl };

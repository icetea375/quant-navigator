/**
 * LLM_Gateway - 智能成本感知的调度中枢
 * 首席风险官/成本控制官视角的军事化AI军团管理
 */

import {
  selectModelForTask,
  TASK_MODEL_MAPPING,
  AI_FORCE_STRUCTURE,
  batchOptimizer,
  BatchRequest,
  getModelPricing,
  calculateCost
} from './config';
import * as fs from 'fs';
import * as path from 'path';

export interface LLMRequest {
  id: string;
  taskType: keyof typeof TASK_MODEL_MAPPING;
  prompt: string;
  qualityLevel: 'normal' | 'high';
  priority: number;
  timestamp: number;
  context?: any;
}

export interface LLMResponse {
  id: string;
  content: string;
  model: string;
  provider: string;
  cost: number;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  responseTime: number;
  qualityLevel: 'normal' | 'high';
  batchOptimized: boolean;
}

export interface CostMetrics {
  dailySpent: number;
  monthlySpent: number;
  totalRequests: number;
  batchSavings: number;
  averageCostPerRequest: number;
  costByTaskType: { [taskType: string]: number };
  costByModel: { [model: string]: number };
}

interface BehaviorProfile {
  description: string;
  allow_online_search: boolean;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  system_instruction: string;
}

interface TaskMapping {
  description: string;
  provider: string;
  behavior_profile: string;
}

interface BehaviorConfig {
  providers: Record<string, any>;
  task_mapping: Record<string, TaskMapping>;
  behavior_profiles: Record<string, BehaviorProfile>;
}

export class LLM_Gateway {
  private costMetrics: CostMetrics;
  private dailyBudget: number = 1000;
  private monthlyBudget: number = 30000;
  private requestHistory: LLMRequest[] = [];
  private responseHistory: LLMResponse[] = [];
  private behaviorConfig: BehaviorConfig | null = null;

  constructor() {
    this.costMetrics = {
      dailySpent: 0,
      monthlySpent: 0,
      totalRequests: 0,
      batchSavings: 0,
      averageCostPerRequest: 0,
      costByTaskType: {},
      costByModel: {}
    };
    this.loadBehaviorConfig();
  }

  /**
   * 加载行为配置
   */
  private loadBehaviorConfig(): void {
    try {
      const configPath = '/Users/pengcheng/Documents/papa/config/services/llm.json';
      const configData = fs.readFileSync(configPath, 'utf8');
      this.behaviorConfig = JSON.parse(configData);
      console.log('✅ 行为配置加载成功 (v10.7架构升级)');
    } catch (error) {
      console.error('❌ 加载行为配置失败:', error);
      this.behaviorConfig = null;
    }
  }

  /**
   * 核心方法：智能成本感知的请求处理（v10.7架构升级）
   */
  async processRequest(request: LLMRequest): Promise<LLMResponse> {
    console.log(`🚀 开始处理请求: ${request.taskType} (v10.7行为控制架构)`);

    // 1. 成本预算检查
    if (!this.checkBudgetLimits(request)) {
      throw new Error('预算超限，请求被拒绝');
    }

    // 2. 行为控制：构建带有运行时指令的Prompt
    const controlledPrompt = this.injectDynamicDirectives(request);

    // 3. 智能模型选择
    const modelSelection = selectModelForTask(
      request.taskType,
      request.qualityLevel,
      true // 启用批处理优化
    );

    if (!modelSelection) {
      throw new Error(`无法为任务类型 ${request.taskType} 找到合适的模型`);
    }

    // 4. 成本预估（基于行为控制后的Prompt）
    const estimatedCost = this.estimateCost(request, modelSelection);

    // 5. 成本控制决策
    if (!this.approveCost(estimatedCost, request.priority)) {
      // 降级处理：降低质量等级或选择更便宜的模型
      const downgradedSelection = this.downgradeRequest(request);
      return this.executeRequest(request, downgradedSelection);
    }

    // 6. 执行请求（批处理或立即执行）
    return this.executeRequest(request, modelSelection);
  }

  /**
   * 【核心变更】动态指令注入 - 重新夺回对AI行为的控制权
   */
  private injectDynamicDirectives(request: LLMRequest): string {
    if (!this.behaviorConfig) {
      console.warn('⚠️ 行为配置未加载，使用原始Prompt');
      return request.prompt;
    }

    // 获取任务配置
    const taskConfig = this.behaviorConfig.task_mapping[request.taskType];
    if (!taskConfig) {
      console.warn(`⚠️ 未找到任务 ${request.taskType} 的配置，使用原始Prompt`);
      return request.prompt;
    }

    // 获取行为配置
    const behaviorProfile = this.behaviorConfig.behavior_profiles[taskConfig.behavior_profile];
    if (!behaviorProfile) {
      console.warn(`⚠️ 未找到行为配置 ${taskConfig.behavior_profile}，使用原始Prompt`);
      return request.prompt;
    }

    // 构建系统级指令
    let systemDirective = '';

    if (behaviorProfile.allow_online_search === false) {
      systemDirective = `【最高优先级指令】本次任务为内部数据分析，你被严格禁止使用任何外部搜索或联网功能。你必须、且只能、完全基于我在此次对话中提供给你的上下文信息进行回答。任何试图获取外部信息的行为都是被禁止的。

【成本控制指令】
- 本次任务成本预算：严格限制在内部数据处理范围内
- 禁止任何可能触发联网搜索的行为
- 如果遇到需要外部信息的情况，请明确说明"基于提供的信息无法完成此分析"

`;
    } else if (behaviorProfile.allow_online_search === true) {
      systemDirective = `【最高优先级指令】本次任务需要你结合实时信息，你被授权使用外部搜索功能来补充你的知识。在你的回答中，请明确引用你搜索到的关键信息来源。

【联网授权指令】
- 本次任务已授权使用外部搜索功能
- 请在回答中明确标注信息来源
- 优先使用权威、可信的信息源

`;
    }

    // 将系统指令强势插入到用户Prompt的最顶端
    const finalPrompt = systemDirective + request.prompt;

    console.log(`🎯 动态指令注入完成: ${behaviorProfile.allow_online_search ? '允许联网' : '禁止联网'}`);
    return finalPrompt;
  }

  /**
   * 检查预算限制
   */
  private checkBudgetLimits(request: LLMRequest): boolean {
    const today = new Date().toDateString();
    const thisMonth = new Date().toISOString().slice(0, 7);

    // 检查日预算
    if (this.costMetrics.dailySpent >= this.dailyBudget) {
      console.warn('⚠️ 日预算已超限，拒绝请求');
      return false;
    }

    // 检查月预算
    if (this.costMetrics.monthlySpent >= this.monthlyBudget) {
      console.warn('⚠️ 月预算已超限，拒绝请求');
      return false;
    }

    return true;
  }

  /**
   * 成本预估
   */
  private estimateCost(request: LLMRequest, modelSelection: any): number {
    // 基于历史数据估算token数量
    const estimatedInputTokens = Math.ceil(request.prompt.length / 4); // 粗略估算
    const estimatedOutputTokens = 500; // 基于任务类型估算

    const pricing = getModelPricing(modelSelection.provider, modelSelection.model);
    if (!pricing) {
      return 0;
    }

    const inputCost = estimatedInputTokens * pricing.inputPrice / 1000000;
    const outputCost = estimatedOutputTokens * pricing.outputPrice / 1000000;

    return inputCost + outputCost;
  }

  /**
   * 成本审批
   */
  private approveCost(estimatedCost: number, priority: number): boolean {
    // 高优先级请求更容易通过
    const approvalThreshold = priority > 8 ? 0.8 : 0.5;

    // 检查是否超过预算的警告阈值
    const budgetUsage = this.costMetrics.dailySpent / this.dailyBudget;

    if (budgetUsage > 0.9) {
      // 预算紧张，只批准高优先级请求
      return priority > 7;
    } else if (budgetUsage > 0.7) {
      // 预算警告，提高审批门槛
      return priority > 6;
    }

    return true;
  }

  /**
   * 降级处理
   */
  private downgradeRequest(request: LLMRequest): any {
    console.log(`🔄 降级处理请求: ${request.taskType}`);

    // 降低质量等级
    const downgradedQualityLevel = request.qualityLevel === 'high' ? 'normal' : 'normal';

    // 选择更便宜的模型
    const downgradedSelection = selectModelForTask(
      request.taskType,
      downgradedQualityLevel,
      true
    );

    return downgradedSelection;
  }

  /**
   * 执行请求
   */
  private async executeRequest(request: LLMRequest, modelSelection: any): Promise<LLMResponse> {
    const startTime = Date.now();

    // 获取控制后的Prompt
    const controlledPrompt = this.injectDynamicDirectives(request);

    // 检查是否支持批处理
    if (modelSelection.enableBatch) {
      return this.executeBatchRequest(request, modelSelection, controlledPrompt);
    } else {
      return this.executeImmediateRequest(request, modelSelection, controlledPrompt);
    }
  }

  /**
   * 执行批处理请求
   */
  private async executeBatchRequest(request: LLMRequest, modelSelection: any, controlledPrompt: string): Promise<LLMResponse> {
    console.log(`🚀 批处理请求: ${request.taskType} -> ${modelSelection.model}`);

    const batchRequest: BatchRequest = {
      id: request.id,
      taskType: request.taskType,
      prompt: controlledPrompt, // 使用控制后的Prompt
      qualityLevel: request.qualityLevel,
      timestamp: request.timestamp,
      priority: request.priority
    };

    // 添加到批处理队列
    const batchId = await batchOptimizer.addToBatch(batchRequest);

    // 模拟批处理执行（实际应该等待批处理完成）
    const response: LLMResponse = {
      id: request.id,
      content: `批处理响应: ${controlledPrompt.substring(0, 100)}...`,
      model: modelSelection.model,
      provider: modelSelection.provider,
      cost: this.estimateCost(request, modelSelection) * 0.5, // 批处理50%折扣
      tokens: {
        input: Math.ceil(controlledPrompt.length / 4),
        output: 500,
        total: Math.ceil(controlledPrompt.length / 4) + 500
      },
      responseTime: Date.now() - request.timestamp,
      qualityLevel: request.qualityLevel,
      batchOptimized: true
    };

    this.updateCostMetrics(response);
    return response;
  }

  /**
   * 执行立即请求
   */
  private async executeImmediateRequest(request: LLMRequest, modelSelection: any, controlledPrompt: string): Promise<LLMResponse> {
    console.log(`⚡ 立即执行请求: ${request.taskType} -> ${modelSelection.model}`);

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const response: LLMResponse = {
      id: request.id,
      content: `立即响应: ${controlledPrompt.substring(0, 100)}...`,
      model: modelSelection.model,
      provider: modelSelection.provider,
      cost: this.estimateCost(request, modelSelection),
      tokens: {
        input: Math.ceil(controlledPrompt.length / 4),
        output: 500,
        total: Math.ceil(controlledPrompt.length / 4) + 500
      },
      responseTime: Date.now() - request.timestamp,
      qualityLevel: request.qualityLevel,
      batchOptimized: false
    };

    this.updateCostMetrics(response);
    return response;
  }

  /**
   * 更新成本指标
   */
  private updateCostMetrics(response: LLMResponse): void {
    this.costMetrics.dailySpent += response.cost;
    this.costMetrics.monthlySpent += response.cost;
    this.costMetrics.totalRequests += 1;
    this.costMetrics.averageCostPerRequest = this.costMetrics.dailySpent / this.costMetrics.totalRequests;

    // 更新按任务类型的成本
    if (!this.costMetrics.costByTaskType[response.model]) {
      this.costMetrics.costByTaskType[response.model] = 0;
    }
    this.costMetrics.costByTaskType[response.model] += response.cost;

    // 更新按模型的成本
    if (!this.costMetrics.costByModel[response.model]) {
      this.costMetrics.costByModel[response.model] = 0;
    }
    this.costMetrics.costByModel[response.model] += response.cost;

    // 记录批处理节省
    if (response.batchOptimized) {
      this.costMetrics.batchSavings += response.cost;
    }
  }

  /**
   * 获取成本报告
   */
  getCostReport(): CostMetrics {
    return { ...this.costMetrics };
  }

  /**
   * 获取AI军团状态
   */
  getForceStatus(): any {
    return {
      strategic_force: {
        status: '待命',
        available_models: AI_FORCE_STRUCTURE.STRATEGIC_FORCE.models,
        principle: AI_FORCE_STRUCTURE.STRATEGIC_FORCE.principle
      },
      tactical_force: {
        status: '活跃',
        available_models: AI_FORCE_STRUCTURE.TACTICAL_FORCE.models,
        principle: AI_FORCE_STRUCTURE.TACTICAL_FORCE.principle
      },
      rapid_response_force: {
        status: '高频使用',
        available_models: AI_FORCE_STRUCTURE.RAPID_RESPONSE_FORCE.models,
        principle: AI_FORCE_STRUCTURE.RAPID_RESPONSE_FORCE.principle
      }
    };
  }

  /**
   * 获取批处理统计
   */
  getBatchStats(): any {
    return batchOptimizer.getBatchStats();
  }

  /**
   * 重置成本指标（每日/每月）
   */
  resetCostMetrics(period: 'daily' | 'monthly'): void {
    if (period === 'daily') {
      this.costMetrics.dailySpent = 0;
    } else if (period === 'monthly') {
      this.costMetrics.monthlySpent = 0;
      this.costMetrics.costByTaskType = {};
      this.costMetrics.costByModel = {};
    }
  }

  /**
   * 获取行为控制报告
   */
  getBehaviorControlReport(): {
    onlineTasks: string[];
    offlineTasks: string[];
    riskAssessment: string;
    totalTasks: number;
  } {
    if (!this.behaviorConfig) {
      return {
        onlineTasks: [],
        offlineTasks: [],
        riskAssessment: '❌ 行为配置未加载',
        totalTasks: 0
      };
    }

    const onlineTasks: string[] = [];
    const offlineTasks: string[] = [];

    Object.entries(this.behaviorConfig.task_mapping).forEach(([taskType, config]) => {
      const behaviorProfile = this.behaviorConfig.behavior_profiles[config.behavior_profile];
      if (behaviorProfile?.allow_online_search) {
        onlineTasks.push(taskType);
      } else {
        offlineTasks.push(taskType);
      }
    });

    const totalTasks = onlineTasks.length + offlineTasks.length;
    const onlineRatio = onlineTasks.length / totalTasks;

    let riskAssessment = '';
    if (onlineRatio > 0.5) {
      riskAssessment = '⚠️ 高风险：超过50%的任务允许联网，可能导致成本失控';
    } else if (onlineRatio > 0.3) {
      riskAssessment = '⚠️ 中风险：30-50%的任务允许联网，需要密切监控成本';
    } else {
      riskAssessment = '✅ 低风险：大部分任务限制在内部数据，成本可控';
    }

    return {
      onlineTasks,
      offlineTasks,
      riskAssessment,
      totalTasks
    };
  }

  /**
   * 重新加载行为配置（支持热更新）
   */
  reloadBehaviorConfig(): { success: boolean; message: string } {
    try {
      this.loadBehaviorConfig();
      return { success: true, message: '行为配置重新加载成功' };
    } catch (error) {
      return { success: false, message: `重新加载失败: ${error}` };
    }
  }

  /**
   * 获取任务行为配置
   */
  getTaskBehaviorConfig(taskType: string): {
    behaviorProfile: string;
    allowOnlineSearch: boolean;
    description: string;
  } | null {
    if (!this.behaviorConfig) return null;

    const taskConfig = this.behaviorConfig.task_mapping[taskType];
    if (!taskConfig) return null;

    const behaviorProfile = this.behaviorConfig.behavior_profiles[taskConfig.behavior_profile];
    if (!behaviorProfile) return null;

    return {
      behaviorProfile: taskConfig.behavior_profile,
      allowOnlineSearch: behaviorProfile.allow_online_search,
      description: behaviorProfile.description
    };
  }
}

// 全局LLM_Gateway实例
export const llmGateway = new LLM_Gateway();

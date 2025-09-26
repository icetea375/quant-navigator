/**
 * 简单双LLM协作系统集成器
 * 遵循智能分析系统开发实施指南的命名规范
 */

import { DatabaseConnection } from '../database/connection';
import { Redis } from 'ioredis';
import { BaseErrorHandler } from '../utils/BaseErrorHandler';
import { BaseConfigValidator } from '../utils/BaseConfigValidator';
import { logger } from '../utils/logger';
import { SimpleLLMCollaborationCoordinator, CollaborationConfig, CollaborationTask } from './SimpleLLMCollaborationCoordinator';
import { SimpleToolCallCoordinator, ToolCallConfig, ToolDefinition } from './SimpleToolCallCoordinator';
import { SimpleWebSearchCoordinator, WebSearchConfig, SearchQuery } from './SimpleWebSearchSearchCoordinator';

export interface DualLLMConfig {
  enabled: boolean;
  collaboration: CollaborationConfig;
  toolCalls: ToolCallConfig;
  webSearch: WebSearchConfig;
  workflow: {
    enableHistoricalAttribution: boolean;
    enableDailyNewsProcessing: boolean;
    enableTimelineConstruction: boolean;
    enableCrossValidation: boolean;
    enableParallelProcessing: boolean;
  };
  optimization: {
    enableCaching: boolean;
    enableLoadBalancing: boolean;
    enableFailover: boolean;
    enablePerformanceMonitoring: boolean;
  };
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    metricsCollection: boolean;
  };
}

export interface WorkflowTask {
  id: string;
  type: 'historical_attribution' | 'daily_news_processing' | 'timeline_construction';
  input: any;
  output?: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  steps: WorkflowStep[];
  currentStep?: number;
  confidence: number;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'llm_collaboration' | 'tool_call' | 'web_search' | 'data_processing';
  input: any;
  output?: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  provider?: string;
  executionTime?: number;
  error?: string;
}

export class SimpleDualLLMCollaborationSystem {
  private db: DatabaseConnection;
  private redis: Redis;
  private config: DualLLMConfig;
  private collaborationCoordinator: SimpleLLMCollaborationCoordinator;
  private toolCallCoordinator: SimpleToolCallCoordinator;
  private webSearchCoordinator: SimpleWebSearchCoordinator;
  private activeWorkflows: Map<string, WorkflowTask> = new Map();
  private isRunning: boolean = false;

  constructor(db: DatabaseConnection, redis: Redis, config: DualLLMConfig) {
    this.db = db;
    this.redis = redis;
    this.config = config;

    this.validateConfig(config);

    // 初始化各个协调器
    this.collaborationCoordinator = new SimpleLLMCollaborationCoordinator(
      db, redis, config.collaboration
    );
    this.toolCallCoordinator = new SimpleToolCallCoordinator(
      db, redis, config.toolCalls
    );
    this.webSearchCoordinator = new SimpleWebSearchCoordinator(
      db, redis, config.webSearch
    );

    this.initializeTables();
    this.initializeTools();
  }

  /**
   * 启动双LLM协作系统
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Dual LLM collaboration system is already running');
      return;
    }

    try {
      // 启动各个协调器
      this.collaborationCoordinator.start();
      this.toolCallCoordinator.start();
      this.webSearchCoordinator.start();

      this.isRunning = true;
      logger.info('🤝 双LLM协作系统已启动');
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleDualLLMCollaborationSystem');
      throw error;
    }
  }

  /**
   * 停止双LLM协作系统
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    try {
      // 停止各个协调器
      this.collaborationCoordinator.stop();
      this.toolCallCoordinator.stop();
      this.webSearchCoordinator.stop();

      this.isRunning = false;
      logger.info('🛑 双LLM协作系统已停止');
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleDualLLMCollaborationSystem');
      throw error;
    }
  }

  /**
   * 执行历史归因分析工作流
   */
  async executeHistoricalAttributionWorkflow(input: any): Promise<WorkflowTask> {
    try {
      const workflow: WorkflowTask = {
        id: this.generateWorkflowId(),
        type: 'historical_attribution',
        input,
        status: 'pending',
        steps: this.createHistoricalAttributionSteps(input),
        confidence: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      this.activeWorkflows.set(workflow.id, workflow);
      await this.storeWorkflowTask(workflow);

      // 异步执行工作流
      this.executeWorkflow(workflow.id);

      logger.info(`📊 历史归因分析工作流已创建: ${workflow.id}`);
      return workflow;
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleDualLLMCollaborationSystem');
      throw error;
    }
  }

  /**
   * 执行日常新闻处理工作流
   */
  async executeDailyNewsProcessingWorkflow(input: any): Promise<WorkflowTask> {
    try {
      const workflow: WorkflowTask = {
        id: this.generateWorkflowId(),
        type: 'daily_news_processing',
        input,
        status: 'pending',
        steps: this.createDailyNewsProcessingSteps(input),
        confidence: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      this.activeWorkflows.set(workflow.id, workflow);
      await this.storeWorkflowTask(workflow);

      // 异步执行工作流
      this.executeWorkflow(workflow.id);

      logger.info(`📰 日常新闻处理工作流已创建: ${workflow.id}`);
      return workflow;
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleDualLLMCollaborationSystem');
      throw error;
    }
  }

  /**
   * 执行时间线构建工作流
   */
  async executeTimelineConstructionWorkflow(input: any): Promise<WorkflowTask> {
    try {
      const workflow: WorkflowTask = {
        id: this.generateWorkflowId(),
        type: 'timeline_construction',
        input,
        status: 'pending',
        steps: this.createTimelineConstructionSteps(input),
        confidence: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      this.activeWorkflows.set(workflow.id, workflow);
      await this.storeWorkflowTask(workflow);

      // 异步执行工作流
      this.executeWorkflow(workflow.id);

      logger.info(`⏰ 时间线构建工作流已创建: ${workflow.id}`);
      return workflow;
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleDualLLMCollaborationSystem');
      throw error;
    }
  }

  /**
   * 创建历史归因分析步骤
   */
  private createHistoricalAttributionSteps(input: any): WorkflowStep[] {
    return [
      {
        id: 'step1',
        name: '事件特征提取',
        type: 'llm_collaboration',
        input: { ...input, step: 'feature_extraction' },
        status: 'pending'
      },
      {
        id: 'step2',
        name: '市场数据查询',
        type: 'tool_call',
        input: { toolId: 'market_data_query', parameters: input.marketDataParams },
        status: 'pending'
      },
      {
        id: 'step3',
        name: '历史数据搜索',
        type: 'web_search',
        input: { query: input.searchQuery, type: 'news' },
        status: 'pending'
      },
      {
        id: 'step4',
        name: '归因分析推理',
        type: 'llm_collaboration',
        input: { ...input, step: 'attribution_analysis' },
        status: 'pending'
      },
      {
        id: 'step5',
        name: '结果整合',
        type: 'data_processing',
        input: { step: 'result_integration' },
        status: 'pending'
      }
    ];
  }

  /**
   * 创建日常新闻处理步骤
   */
  private createDailyNewsProcessingSteps(input: any): WorkflowStep[] {
    return [
      {
        id: 'step1',
        name: '新闻特征提取',
        type: 'llm_collaboration',
        input: { ...input, step: 'news_feature_extraction' },
        status: 'pending'
      },
      {
        id: 'step2',
        name: '情感分析',
        type: 'tool_call',
        input: { toolId: 'sentiment_analysis', parameters: { text: input.content } },
        status: 'pending'
      },
      {
        id: 'step3',
        name: '实时市场数据',
        type: 'tool_call',
        input: { toolId: 'market_data_query', parameters: input.marketParams },
        status: 'pending'
      },
      {
        id: 'step4',
        name: '重要性评分',
        type: 'llm_collaboration',
        input: { ...input, step: 'importance_scoring' },
        status: 'pending'
      },
      {
        id: 'step5',
        name: '优先级排序',
        type: 'data_processing',
        input: { step: 'priority_ranking' },
        status: 'pending'
      }
    ];
  }

  /**
   * 创建时间线构建步骤
   */
  private createTimelineConstructionSteps(input: any): WorkflowStep[] {
    return [
      {
        id: 'step1',
        name: '事件数据收集',
        type: 'data_processing',
        input: { step: 'event_collection' },
        status: 'pending'
      },
      {
        id: 'step2',
        name: '时间序列分析',
        type: 'tool_call',
        input: { toolId: 'time_series_analysis', parameters: input.timeSeriesParams },
        status: 'pending'
      },
      {
        id: 'step3',
        name: '事件关联分析',
        type: 'llm_collaboration',
        input: { ...input, step: 'event_correlation' },
        status: 'pending'
      },
      {
        id: 'step4',
        name: '时间线生成',
        type: 'llm_collaboration',
        input: { ...input, step: 'timeline_generation' },
        status: 'pending'
      },
      {
        id: 'step5',
        name: '叙事内容生成',
        type: 'llm_collaboration',
        input: { ...input, step: 'narrative_generation' },
        status: 'pending'
      }
    ];
  }

  /**
   * 执行工作流
   */
  private async executeWorkflow(workflowId: string): Promise<void> {
    try {
      const workflow = this.activeWorkflows.get(workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      workflow.status = 'processing';
      workflow.updatedAt = Date.now();
      await this.updateWorkflowTask(workflow);

      // 执行各个步骤
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        workflow.currentStep = i;

        try {
          await this.executeWorkflowStep(workflow, step);
        } catch (error) {
          logger.error(`Step ${step.id} failed:`, error);
          step.status = 'failed';
          step.error = error instanceof Error ? error.message : String(error);

          // 根据配置决定是否继续
          if (!this.config.workflow.enableFailover) {
            workflow.status = 'failed';
            workflow.error = `Step ${step.id} failed: ${error instanceof Error ? error.message : String(error)}`;
            break;
          }
        }
      }

      // 更新工作流状态
      if (workflow.status !== 'failed') {
        workflow.status = 'completed';
        workflow.confidence = this.calculateWorkflowConfidence(workflow);
      }

      workflow.updatedAt = Date.now();
      await this.updateWorkflowTask(workflow);

      logger.info(`✅ 工作流完成: ${workflowId} (${workflow.status})`);
    } catch (error) {
      logger.error(`Workflow execution failed: ${workflowId}`, error);
      const workflow = this.activeWorkflows.get(workflowId);
      if (workflow) {
        workflow.status = 'failed';
        workflow.error = error instanceof Error ? error.message : String(error);
        workflow.updatedAt = Date.now();
        await this.updateWorkflowTask(workflow);
      }
    }
  }

  /**
   * 执行工作流步骤
   */
  private async executeWorkflowStep(workflow: WorkflowTask, step: WorkflowStep): Promise<void> {
    try {
      step.status = 'processing';
      const startTime = Date.now();

      switch (step.type) {
        case 'llm_collaboration':
          await this.executeLLMCollaborationStep(workflow, step);
          break;

        case 'tool_call':
          await this.executeToolCallStep(workflow, step);
          break;

        case 'web_search':
          await this.executeWebSearchStep(workflow, step);
          break;

        case 'data_processing':
          await this.executeDataProcessingStep(workflow, step);
          break;

        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      step.status = 'completed';
      step.executionTime = Date.now() - startTime;
    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  /**
   * 执行LLM协作步骤
   */
  private async executeLLMCollaborationStep(workflow: WorkflowTask, step: WorkflowStep): Promise<void> {
    try {
      const collaborationTask = await this.collaborationCoordinator.createCollaborationTask(
        workflow.type,
        step.input
      );

      const results = await this.collaborationCoordinator.executeCollaborationTask(collaborationTask.id);

      if (results.length > 0) {
        step.output = results[0].result;
        step.provider = results[0].provider;
      } else {
        throw new Error('No collaboration results');
      }
    } catch (error) {
      logger.error('LLM collaboration step failed:', error);
      throw error;
    }
  }

  /**
   * 执行工具调用步骤
   */
  private async executeToolCallStep(workflow: WorkflowTask, step: WorkflowStep): Promise<void> {
    try {
      const { toolId, parameters } = step.input;
      const result = await this.toolCallCoordinator.executeToolCallSync(toolId, parameters);

      step.output = result;
    } catch (error) {
      logger.error('Tool call step failed:', error);
      throw error;
    }
  }

  /**
   * 执行网络搜索步骤
   */
  private async executeWebSearchStep(workflow: WorkflowTask, step: WorkflowStep): Promise<void> {
    try {
      const { query, type, ...parameters } = step.input;
      const results = await this.webSearchCoordinator.searchSync(query, type, parameters);

      step.output = results;
    } catch (error) {
      logger.error('Web search step failed:', error);
      throw error;
    }
  }

  /**
   * 执行数据处理步骤
   */
  private async executeDataProcessingStep(workflow: WorkflowTask, step: WorkflowStep): Promise<void> {
    try {
      const { step: processType } = step.input;

      switch (processType) {
        case 'result_integration':
          step.output = await this.integrateResults(workflow);
          break;

        case 'priority_ranking':
          step.output = await this.rankByPriority(workflow);
          break;

        case 'event_collection':
          step.output = await this.collectEvents(workflow);
          break;

        default:
          step.output = { processed: true, type: processType };
      }
    } catch (error) {
      logger.error('Data processing step failed:', error);
      throw error;
    }
  }

  /**
   * 整合结果
   */
  private async integrateResults(workflow: WorkflowTask): Promise<any> {
    const results = workflow.steps
      .filter(step => step.status === 'completed' && step.output)
      .map(step => step.output);

    return {
      integrated: true,
      results,
      count: results.length,
      timestamp: Date.now()
    };
  }

  /**
   * 按优先级排序
   */
  private async rankByPriority(workflow: WorkflowTask): Promise<any> {
    const results = workflow.steps
      .filter(step => step.status === 'completed' && step.output)
      .map(step => step.output);

    // 简单的优先级排序逻辑
    const ranked = results.sort((a, b) => {
      const scoreA = a.importance_score || a.priority || 0;
      const scoreB = b.importance_score || b.priority || 0;
      return scoreB - scoreA;
    });

    return {
      ranked: true,
      results: ranked,
      count: ranked.length,
      timestamp: Date.now()
    };
  }

  /**
   * 收集事件
   */
  private async collectEvents(workflow: WorkflowTask): Promise<any> {
    const events = workflow.input.events || [];

    return {
      collected: true,
      events,
      count: events.length,
      timestamp: Date.now()
    };
  }

  /**
   * 计算工作流置信度
   */
  private calculateWorkflowConfidence(workflow: WorkflowTask): number {
    const completedSteps = workflow.steps.filter(step => step.status === 'completed');
    if (completedSteps.length === 0) return 0;

    const totalConfidence = completedSteps.reduce((sum, step) => {
      // 从步骤输出中提取置信度
      const confidence = step.output?.confidence || 0.5;
      return sum + confidence;
    }, 0);

    return totalConfidence / completedSteps.length;
  }

  /**
   * 初始化工具
   */
  private async initializeTools(): Promise<void> {
    try {
      const tools: ToolDefinition[] = [
        {
          id: 'market_data_query',
          name: '市场数据查询',
          description: '查询股票、ETF等金融产品的市场数据',
          parameters: {
            type: 'object',
            properties: {
              symbol: { type: 'string', description: '股票代码' },
              startDate: { type: 'string', description: '开始日期' },
              endDate: { type: 'string', description: '结束日期' },
              indicators: { type: 'array', description: '技术指标' }
            },
            required: ['symbol']
          },
          provider: 'hunyuan',
          enabled: true,
          timeout: 30000,
          retryCount: 3
        },
        {
          id: 'web_search',
          name: '网络搜索',
          description: '搜索网络上的最新信息',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: '搜索关键词' },
              maxResults: { type: 'number', description: '最大结果数' },
              timeRange: { type: 'string', description: '时间范围' }
            },
            required: ['query']
          },
          provider: 'hunyuan',
          enabled: true,
          timeout: 30000,
          retryCount: 3
        },
        {
          id: 'news_analysis',
          name: '新闻分析',
          description: '分析新闻内容的重要性和影响',
          parameters: {
            type: 'object',
            properties: {
              newsId: { type: 'string', description: '新闻ID' },
              analysisType: { type: 'string', description: '分析类型' }
            },
            required: ['newsId']
          },
          provider: 'doubao',
          enabled: true,
          timeout: 20000,
          retryCount: 2
        },
        {
          id: 'sentiment_analysis',
          name: '情感分析',
          description: '分析文本的情感倾向',
          parameters: {
            type: 'object',
            properties: {
              text: { type: 'string', description: '待分析文本' },
              language: { type: 'string', description: '语言' }
            },
            required: ['text']
          },
          provider: 'doubao',
          enabled: true,
          timeout: 15000,
          retryCount: 2
        },
        {
          id: 'time_series_analysis',
          name: '时间序列分析',
          description: '分析时间序列数据的趋势和模式',
          parameters: {
            type: 'object',
            properties: {
              data: { type: 'array', description: '时间序列数据' },
              analysisType: { type: 'string', description: '分析类型' }
            },
            required: ['data']
          },
          provider: 'hunyuan',
          enabled: true,
          timeout: 25000,
          retryCount: 2
        }
      ];

      for (const tool of tools) {
        await this.toolCallCoordinator.registerTool(tool);
      }

      logger.info('🔧 工具定义已初始化');
    } catch (error) {
      logger.error('Failed to initialize tools:', error);
    }
  }

  /**
   * 存储工作流任务
   */
  private async storeWorkflowTask(workflow: WorkflowTask): Promise<void> {
    try {
      await this.db.query(`
        INSERT OR REPLACE INTO workflow_tasks (
          id, type, input, output, status, steps, current_step,
          confidence, error, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        workflow.id, workflow.type, JSON.stringify(workflow.input),
        JSON.stringify(workflow.output), workflow.status, JSON.stringify(workflow.steps),
        workflow.currentStep, workflow.confidence, workflow.error,
        workflow.createdAt, workflow.updatedAt
      ]);
    } catch (error) {
      logger.error('Failed to store workflow task:', error);
    }
  }

  /**
   * 更新工作流任务
   */
  private async updateWorkflowTask(workflow: WorkflowTask): Promise<void> {
    try {
      await this.db.query(`
        UPDATE workflow_tasks SET
          output = ?, status = ?, steps = ?, current_step = ?,
          confidence = ?, error = ?, updated_at = ?
        WHERE id = ?
      `, [
        JSON.stringify(workflow.output), workflow.status, JSON.stringify(workflow.steps),
        workflow.currentStep, workflow.confidence, workflow.error,
        workflow.updatedAt, workflow.id
      ]);
    } catch (error) {
      logger.error('Failed to update workflow task:', error);
    }
  }

  /**
   * 初始化数据库表
   */
  private async initializeTables(): Promise<void> {
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS workflow_tasks (
          id VARCHAR(100) PRIMARY KEY,
          type VARCHAR(50) NOT NULL,
          input TEXT NOT NULL,
          output TEXT,
          status VARCHAR(20) NOT NULL,
          steps TEXT NOT NULL,
          current_step INTEGER,
          confidence REAL DEFAULT 0,
          error TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          INDEX idx_type (type),
          INDEX idx_status (status),
          INDEX idx_created_at (created_at)
        )
      `);
    } catch (error) {
      logger.error('Failed to initialize workflow tables:', error);
    }
  }

  /**
   * 验证配置
   */
  private validateConfig(config: DualLLMConfig): void {
    BaseConfigValidator.validate(config, ['enabled', 'collaboration', 'toolCalls', 'webSearch']);
  }

  /**
   * 生成工作流ID
   */
  private generateWorkflowId(): string {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取工作流状态
   */
  async getWorkflowStatus(workflowId: string): Promise<WorkflowTask | null> {
    return this.activeWorkflows.get(workflowId) || null;
  }

  /**
   * 获取所有工作流
   */
  async getAllWorkflows(): Promise<WorkflowTask[]> {
    return Array.from(this.activeWorkflows.values());
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<any> {
    try {
      const totalWorkflows = this.activeWorkflows.size;
      const completedWorkflows = Array.from(this.activeWorkflows.values())
        .filter(workflow => workflow.status === 'completed').length;
      const failedWorkflows = Array.from(this.activeWorkflows.values())
        .filter(workflow => workflow.status === 'failed').length;

      const collaborationStats = await this.collaborationCoordinator.getStats();
      const toolCallStats = await this.toolCallCoordinator.getStats();
      const webSearchStats = await this.webSearchCoordinator.getStats();

      return {
        workflows: {
          total: totalWorkflows,
          completed: completedWorkflows,
          failed: failedWorkflows,
          successRate: totalWorkflows > 0 ? completedWorkflows / totalWorkflows : 0
        },
        collaboration: collaborationStats,
        toolCalls: toolCallStats,
        webSearch: webSearchStats,
        isRunning: this.isRunning
      };
    } catch (error) {
      logger.error('Failed to get dual LLM collaboration stats:', error);
      return { workflows: { total: 0, completed: 0, failed: 0, successRate: 0 } };
    }
  }
}

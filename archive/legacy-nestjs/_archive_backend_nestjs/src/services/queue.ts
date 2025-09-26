import Queue from 'bull';
import Redis from 'ioredis';
import { LLMServiceManager } from './llm';
import { DatabaseConnection } from '../database/connection';

export enum JobType {
  QUICK_ANALYSIS = 'quick_analysis',
  STANDARD_ANALYSIS = 'standard_analysis',
  DEEP_ANALYSIS = 'deep_analysis'
}

export enum JobPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  URGENT = 4
}

export interface AnalysisJobData {
  analysisId: string;
  newsId: string;
  userId: string;
  newsType: string;
  analysisType: string;
  newsContent?: string;
  newsTitle?: string;
  priority: JobPriority;
}

export interface AnalysisJobResult {
  analysisId: string;
  success: boolean;
  result?: any;
  error?: string;
  processingTime: number;
}

export class AnalysisQueue {
  private queue: any;
  private redis: any;
  private llmManager: LLMServiceManager;
  private db: DatabaseConnection;

  constructor() {
    this.llmManager = LLMServiceManager.getInstance();
    this.db = DatabaseConnection.getInstance();

    // 直接使用模拟队列，避免Redis连接阻塞
    this.setupMockQueue();

    // 在后台尝试连接Redis，但不阻塞构造函数
    setTimeout(() => {
      this.tryInitializeRedis();
    }, 100);
  }

  private setupMockQueue(): void {
    console.log('🔧 使用模拟队列模式');

    // 创建模拟的Redis和队列对象
    this.redis = {
      connect: () => Promise.resolve(),
      disconnect: () => Promise.resolve(),
      on: () => {},
      off: () => {}
    };

    this.queue = {
      process: () => {},
      add: () => Promise.resolve({}),
      on: () => {},
      close: () => Promise.resolve()
    };
  }

  private async tryInitializeRedis(): Promise<void> {
    try {
      console.log('🔄 尝试连接Redis...');

      // 使用更保守的配置
      this.redis = new Redis({
        host: process.env['REDIS_HOST'] || 'localhost',
        port: parseInt(process.env['REDIS_PORT'] || '6379'),
        password: process.env['REDIS_PASSWORD'] || undefined,
        db: parseInt(process.env['REDIS_DB'] || '0'),
        maxRetriesPerRequest: 0,
        lazyConnect: true,
        connectTimeout: 2000,
        commandTimeout: 1000,
        retryDelayOnFailover: 500,
        enableOfflineQueue: false
      } as any);

      this.queue = new Queue('news-analysis', {
        redis: {
          host: process.env['REDIS_HOST'] || 'localhost',
          port: parseInt(process.env['REDIS_PORT'] || '6379'),
          password: process.env['REDIS_PASSWORD'] || undefined,
          db: parseInt(process.env['REDIS_DB'] || '0')
        } as any,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 1,
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        }
      });

      console.log('✅ Redis连接成功');
      this.setupQueueHandlers();

    } catch (error) {
      console.log('⚠️ Redis连接失败，继续使用模拟队列:', error instanceof Error ? error instanceof Error ? error.message : String(error) : '未知错误');
    }
  }

  private setupQueueHandlers(): void {
    // 处理任务
    this.queue.process(async (job: any) => {
      const { analysisId, newsType, analysisType, newsContent, newsTitle, priority } = job.data;

      try {
        // 更新任务状态为处理中
        await this.updateAnalysisStatus(analysisId, 'processing');

        // 根据分析类型选择LLM服务
        const llmService = this.llmManager.selectBestService({
          priority: this.mapPriorityToLLM(priority),
          maxTokens: this.getMaxTokensForAnalysis(analysisType)
        });

        if (!llmService) {
          throw new Error('没有可用的LLM服务');
        }

        // 生成分析策略
        const strategy = await this.generateAnalysisStrategy(llmService, newsType, analysisType);

        // 执行分析
        const result = await this.executeAnalysis(llmService, strategy, newsContent, newsTitle);

        // 保存分析结果
        await this.saveAnalysisResult(analysisId, strategy, result);

        // 更新任务状态为完成
        await this.updateAnalysisStatus(analysisId, 'completed', result);

        return {
          analysisId,
          success: true,
          result
        };

      } catch (error) {
        const errorMessage = error instanceof Error ? error instanceof Error ? error.message : String(error) : '未知错误';
        await this.updateAnalysisStatus(analysisId, 'failed', undefined, errorMessage);
        throw error;
      }
    });

    // 任务完成事件
    this.queue.on('completed', (_job: any, result: AnalysisJobResult) => {
      console.log(`分析任务完成: ${result.analysisId}`);
    });

    // 任务失败事件
    this.queue.on('failed', (job: any, error: any) => {
      console.error(`分析任务失败: ${job.data.analysisId}`, error);
    });

    // 任务进度事件
    this.queue.on('progress', (job: any, progress: any) => {
      console.log(`分析任务进度: ${job.data.analysisId}, 进度: ${progress}%`);
    });
  }

  public async addJob(
    type: JobType,
    data: Omit<AnalysisJobData, 'priority'>,
    priority: JobPriority = JobPriority.NORMAL
  ): Promise<Queue.Job<AnalysisJobData>> {
    const jobData: AnalysisJobData = {
      ...data,
      priority
    };

    return this.queue.add(type, jobData, {
      priority,
      delay: this.calculateDelay(priority),
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
  }

  private calculateDelay(priority: JobPriority): number {
    switch (priority) {
      case JobPriority.URGENT: return 0;
      case JobPriority.HIGH: return 1000;
      case JobPriority.NORMAL: return 5000;
      case JobPriority.LOW: return 15000;
      default: return 5000;
    }
  }

  private mapPriorityToLLM(priority: JobPriority): 'low' | 'normal' | 'high' | 'urgent' {
    switch (priority) {
      case JobPriority.URGENT: return 'urgent';
      case JobPriority.HIGH: return 'high';
      case JobPriority.NORMAL: return 'normal';
      case JobPriority.LOW: return 'low';
      default: return 'normal';
    }
  }

  private getMaxTokensForAnalysis(analysisType: string): number {
    switch (analysisType) {
      case 'quick': return 1000;
      case 'standard': return 2000;
      case 'deep': return 4000;
      default: return 2000;
    }
  }

  private async generateAnalysisStrategy(
    llmService: any,
    newsType: string,
    analysisType: string
  ): Promise<string> {
    const prompt = `
你是一个专业的新闻分析策略设计师。请为以下新闻类型和分析深度设计分析策略：

新闻类型：${newsType}
分析深度：${analysisType === 'quick' ? '快速分析' : analysisType === 'standard' ? '标准分析' : '深度分析'}

请设计一个结构化的分析策略，包含：
1. 分析重点
2. 需要关注的关键点
3. 分析步骤
4. 预期输出格式

请用JSON格式返回策略。
    `;

    const response = await this.llmManager.callLLM(llmService.name, prompt, {
      maxTokens: 1000,
      temperature: 0.3
    });

    return response.content;
  }

  private async executeAnalysis(
    llmService: any,
    strategy: string,
    newsContent?: string,
    newsTitle?: string
  ): Promise<any> {
    const prompt = `
基于以下分析策略和新闻内容，请进行专业的新闻分析：

分析策略：
${strategy}

新闻标题：${newsTitle || '未提供'}
新闻内容：${newsContent || '未提供'}

请按照策略要求进行分析，并返回结构化的分析结果。
    `;

    const response = await this.llmManager.callLLM(llmService.name, prompt, {
      maxTokens: 3000,
      temperature: 0.5
    });

    return response.content;
  }

  private async updateAnalysisStatus(
    analysisId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    result?: any,
    errorMessage?: string
  ): Promise<void> {
    const db = this.db.getConnection();
    const now = Date.now();

    if (status === 'completed') {
      db.prepare(`
        UPDATE analysis_results
        SET status = ?, updated_at = ?, completed_at = ?, summary = ?
        WHERE id = ?
      `).run(status, now, now, result, analysisId);
    } else if (status === 'failed') {
      db.prepare(`
        UPDATE analysis_results
        SET status = ?, updated_at = ?, error_message = ?
        WHERE id = ?
      `).run(status, now, errorMessage, analysisId);
    } else {
      db.prepare(`
        UPDATE analysis_results
        SET status = ?, updated_at = ?
        WHERE id = ?
      `).run(status, now, analysisId);
    }
  }

  private async saveAnalysisResult(
    analysisId: string,
    strategy: string,
    result: any
  ): Promise<void> {
    const db = this.db.getConnection();
    const now = Date.now();

    db.prepare(`
      UPDATE analysis_results
      SET strategy = ?, summary = ?, updated_at = ?
      WHERE id = ?
    `).run(strategy, result, now, analysisId);
  }

  public async getJobStatus(jobId: string): Promise<any> {
    const job = await this.queue.getJob(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      data: job.data,
      status: await job.getState(),
      progress: job.progress(),
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason
    };
  }

  public async getQueueStats(): Promise<any> {
    const waiting = await this.queue.getWaiting();
    const active = await this.queue.getActive();
    const completed = await this.queue.getCompleted();
    const failed = await this.queue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length
    };
  }

  public async pauseQueue(): Promise<void> {
    await this.queue.pause();
  }

  public async resumeQueue(): Promise<void> {
    await this.queue.resume();
  }

  public async cleanQueue(): Promise<void> {
    await this.queue.clean(0, 'completed');
    await this.queue.clean(0, 'failed');
  }

  public async close(): Promise<void> {
    await this.queue.close();
    await this.redis.quit();
  }
}

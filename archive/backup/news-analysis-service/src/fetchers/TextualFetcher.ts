/**
 * TextualFetcher - 深度文本数据获取器
 * DataPipeline v1.5: 获取长篇新闻、新闻联播、e互动问答等深度文本数据
 * 为AI归因引擎提供丰富的文本证据和上下文信息
 */

import { SimpleTushareDataSource } from '../services/SimpleTushareDataSource';
import {
  LongFormNewsData,
  NewsBroadcastData,
  EInteractionData
} from '../interfaces/DataPipelineV15Interfaces';
import { BaseErrorHandler } from '../utils/BaseErrorHandler';

export interface TextualConfig {
  enabled: boolean;
  sources: {
    longFormNews: boolean;     // 长篇新闻
    newsBroadcast: boolean;    // 新闻联播
    eInteraction: boolean;     // e互动问答
  };
  schedule: {
    dailyUpdateTime: string;   // 每日更新时间 "18:00"
  };
  filters: {
    minImportanceScore: number; // 最小重要性评分
    maxContentLength: number;   // 最大内容长度
    relatedStocks: string[];    // 关注的相关股票
  };
  cache: {
    enabled: boolean;
    ttl: number; // 缓存时间（秒）
  };
}

export class TextualFetcher {
  private tushareSource: SimpleTushareDataSource;
  private config: TextualConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(tushareSource: SimpleTushareDataSource, config: TextualConfig) {
    this.tushareSource = tushareSource;
    this.config = config;
  }

  /**
   * 获取长篇新闻数据
   * 接口: news (增强版)
   */
  public async getLongFormNews(startDate?: string, endDate?: string): Promise<LongFormNewsData[]> {
    try {
      const cacheKey = `long_form_news_${startDate || 'all'}_${endDate || 'all'}`;

      // 检查缓存
      if (this.config.cache.enabled) {
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const params: any = {
        token: process.env.TUSHARE_TOKEN,
        api_name: 'news',
        fields: 'datetime,title,content,url,src'
      };

      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }

      const response = await this.makeRequest('news', params);
      const data = this.parseResponse(response) || [];

      // 转换为标准格式并过滤
      const formattedData: LongFormNewsData[] = data
        .filter((item: any) => {
          // 过滤长篇新闻（内容长度超过阈值）
          const contentLength = (item.content || '').length;
          return contentLength >= this.config.filters.maxContentLength;
        })
        .map((item: any) => ({
          news_id: this.generateNewsId(item),
          title: item.title || '',
          content: item.content || '',
          summary: this.generateSummary(item.content || ''),
          publish_time: item.datetime || '',
          source: item.src || 'Unknown',
          category: this.categorizeNews(item.title || '', item.content || ''),
          importance_score: this.calculateImportanceScore(item),
          sentiment_score: this.calculateSentimentScore(item.content || ''),
          related_stocks: this.extractRelatedStocks(item.title || '', item.content || ''),
          related_concepts: this.extractRelatedConcepts(item.title || '', item.content || '')
        }))
        .filter(item => item.importance_score >= this.config.filters.minImportanceScore);

      // 缓存数据
      if (this.config.cache.enabled) {
        this.setCachedData(cacheKey, formattedData);
      }

      return formattedData;

    } catch (error) {
      BaseErrorHandler.handle(error, 'TextualFetcher.getLongFormNews');
      throw new Error(`Failed to get long form news: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取新闻联播数据
   * 接口: news (特定来源)
   */
  public async getNewsBroadcast(startDate?: string, endDate?: string): Promise<NewsBroadcastData[]> {
    try {
      const cacheKey = `news_broadcast_${startDate || 'all'}_${endDate || 'all'}`;

      // 检查缓存
      if (this.config.cache.enabled) {
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const params: any = {
        token: process.env.TUSHARE_TOKEN,
        api_name: 'news',
        fields: 'datetime,title,content,url,src'
      };

      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }

      const response = await this.makeRequest('news', params);
      const data = this.parseResponse(response) || [];

      // 过滤新闻联播相关新闻
      const broadcastData = data.filter((item: any) => {
        const title = (item.title || '').toLowerCase();
        const content = (item.content || '').toLowerCase();
        return title.includes('新闻联播') ||
               title.includes('央视新闻') ||
               content.includes('新闻联播') ||
               item.src === 'CCTV';
      });

      // 转换为标准格式
      const formattedData: NewsBroadcastData[] = broadcastData.map((item: any) => ({
        broadcast_id: this.generateBroadcastId(item),
        date: this.extractDate(item.datetime || ''),
        title: item.title || '',
        content: item.content || '',
        summary: this.generateSummary(item.content || ''),
        duration: this.estimateDuration(item.content || ''),
        importance_score: this.calculateBroadcastImportance(item),
        related_stocks: this.extractRelatedStocks(item.title || '', item.content || ''),
        related_concepts: this.extractRelatedConcepts(item.title || '', item.content || '')
      }));

      // 缓存数据
      if (this.config.cache.enabled) {
        this.setCachedData(cacheKey, formattedData);
      }

      return formattedData;

    } catch (error) {
      BaseErrorHandler.handle(error, 'TextualFetcher.getNewsBroadcast');
      throw new Error(`Failed to get news broadcast: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取e互动问答数据
   * 接口: stk_news (互动问答)
   */
  public async getEInteraction(stockCode?: string, startDate?: string, endDate?: string): Promise<EInteractionData[]> {
    try {
      const cacheKey = `e_interaction_${stockCode || 'all'}_${startDate || 'all'}_${endDate || 'all'}`;

      // 检查缓存
      if (this.config.cache.enabled) {
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const params: any = {
        token: process.env.TUSHARE_TOKEN,
        api_name: 'stk_news',
        fields: 'ts_code,title,content,pub_time,src'
      };

      if (stockCode) {
        params.ts_code = stockCode;
      }
      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }

      const response = await this.makeRequest('stk_news', params);
      const data = this.parseResponse(response) || [];

      // 过滤e互动问答
      const interactionData = data.filter((item: any) => {
        const title = (item.title || '').toLowerCase();
        const content = (item.content || '').toLowerCase();
        return title.includes('互动') ||
               title.includes('问答') ||
               content.includes('投资者') ||
               content.includes('董秘') ||
               item.src === 'e互动';
      });

      // 转换为标准格式
      const formattedData: EInteractionData[] = interactionData.map((item: any) => {
        const qaPair = this.parseQAPair(item.content || '');
        return {
          interaction_id: this.generateInteractionId(item),
          stock_code: item.ts_code || '',
          stock_name: this.extractStockName(item.title || ''),
          question: qaPair.question,
          answer: qaPair.answer,
          question_time: this.extractQuestionTime(item.pub_time || ''),
          answer_time: this.extractAnswerTime(item.pub_time || ''),
          questioner: this.extractQuestioner(qaPair.question),
          responder: this.extractResponder(qaPair.answer),
          importance_score: this.calculateInteractionImportance(item),
          sentiment_score: this.calculateSentimentScore(qaPair.answer),
          related_concepts: this.extractRelatedConcepts(qaPair.question, qaPair.answer)
        };
      });

      // 缓存数据
      if (this.config.cache.enabled) {
        this.setCachedData(cacheKey, formattedData);
      }

      return formattedData;

    } catch (error) {
      BaseErrorHandler.handle(error, 'TextualFetcher.getEInteraction');
      throw new Error(`Failed to get e interaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 每日数据收集任务
   * 获取深度文本数据
   */
  public async dailyDataCollection(tradeDate?: string): Promise<{
    longFormNews: LongFormNewsData[];
    newsBroadcast: NewsBroadcastData[];
    eInteraction: EInteractionData[];
  }> {
    try {
      console.log('📰 Starting textual intelligence data collection...');

      const results = {
        longFormNews: [] as LongFormNewsData[],
        newsBroadcast: [] as NewsBroadcastData[],
        eInteraction: [] as EInteractionData[]
      };

      // 获取长篇新闻
      if (this.config.sources.longFormNews) {
        try {
          results.longFormNews = await this.getLongFormNews(tradeDate, tradeDate);
          console.log(`✅ Long form news collected: ${results.longFormNews.length} articles`);
        } catch (error) {
          console.error('❌ Failed to collect long form news:', error);
        }
      }

      // 获取新闻联播
      if (this.config.sources.newsBroadcast) {
        try {
          results.newsBroadcast = await this.getNewsBroadcast(tradeDate, tradeDate);
          console.log(`✅ News broadcast collected: ${results.newsBroadcast.length} broadcasts`);
        } catch (error) {
          console.error('❌ Failed to collect news broadcast:', error);
        }
      }

      // 获取e互动问答
      if (this.config.sources.eInteraction) {
        try {
          results.eInteraction = await this.getEInteraction(undefined, tradeDate, tradeDate);
          console.log(`✅ E-interaction collected: ${results.eInteraction.length} interactions`);
        } catch (error) {
          console.error('❌ Failed to collect e-interaction:', error);
        }
      }

      console.log('✅ Textual intelligence data collection completed');
      return results;

    } catch (error) {
      BaseErrorHandler.handle(error, 'TextualFetcher.dailyDataCollection');
      throw new Error(`Failed to perform daily data collection: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取文本重要性评分
   */
  public async getTextualImportanceRanking(tradeDate?: string, limit: number = 50): Promise<Array<{
    id: string;
    type: 'news' | 'broadcast' | 'interaction';
    title: string;
    importance_score: number;
    sentiment_score: number;
    related_stocks: string[];
    related_concepts: string[];
  }>> {
    try {
      const [longFormNews, newsBroadcast, eInteraction] = await Promise.all([
        this.config.sources.longFormNews ? this.getLongFormNews(tradeDate, tradeDate) : [],
        this.config.sources.newsBroadcast ? this.getNewsBroadcast(tradeDate, tradeDate) : [],
        this.config.sources.eInteraction ? this.getEInteraction(undefined, tradeDate, tradeDate) : []
      ]);

      // 合并所有文本数据
      const allTexts = [
        ...longFormNews.map(item => ({
          id: item.news_id,
          type: 'news' as const,
          title: item.title,
          importance_score: item.importance_score,
          sentiment_score: item.sentiment_score,
          related_stocks: item.related_stocks,
          related_concepts: item.related_concepts
        })),
        ...newsBroadcast.map(item => ({
          id: item.broadcast_id,
          type: 'broadcast' as const,
          title: item.title,
          importance_score: item.importance_score,
          sentiment_score: 0, // 新闻联播通常中性
          related_stocks: item.related_stocks,
          related_concepts: item.related_concepts
        })),
        ...eInteraction.map(item => ({
          id: item.interaction_id,
          type: 'interaction' as const,
          title: `${item.stock_name}: ${item.question.substring(0, 50)}...`,
          importance_score: item.importance_score,
          sentiment_score: item.sentiment_score,
          related_stocks: [item.stock_code],
          related_concepts: item.related_concepts
        }))
      ];

      // 按重要性评分排序
      const ranking = allTexts
        .sort((a, b) => b.importance_score - a.importance_score)
        .slice(0, limit);

      return ranking;

    } catch (error) {
      BaseErrorHandler.handle(error, 'TextualFetcher.getTextualImportanceRanking');
      throw new Error(`Failed to get textual importance ranking: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ============ 私有辅助方法 ============

  private generateNewsId(item: any): string {
    return `news_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBroadcastId(item: any): string {
    return `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateInteractionId(item: any): string {
    return `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSummary(content: string): string {
    // 简化的摘要生成：取前200个字符
    return content.length > 200 ? content.substring(0, 200) + '...' : content;
  }

  private categorizeNews(title: string, content: string): string {
    const text = (title + ' ' + content).toLowerCase();
    if (text.includes('政策') || text.includes('监管')) return '政策';
    if (text.includes('财报') || text.includes('业绩')) return '财报';
    if (text.includes('并购') || text.includes('重组')) return '并购';
    if (text.includes('技术') || text.includes('创新')) return '技术';
    return '其他';
  }

  private calculateImportanceScore(item: any): number {
    let score = 0;
    const title = (item.title || '').toLowerCase();
    const content = (item.content || '').toLowerCase();

    // 基于关键词的重要性评分
    const importantKeywords = ['重大', '重要', '政策', '监管', '财报', '业绩', '并购', '重组'];
    importantKeywords.forEach(keyword => {
      if (title.includes(keyword) || content.includes(keyword)) {
        score += 10;
      }
    });

    // 基于内容长度的评分
    score += Math.min(content.length / 1000, 20);

    return Math.min(score, 100);
  }

  private calculateBroadcastImportance(item: any): number {
    // 新闻联播通常具有较高重要性
    let score = 50;
    const title = (item.title || '').toLowerCase();
    const content = (item.content || '').toLowerCase();

    if (title.includes('重要') || content.includes('重要')) score += 20;
    if (title.includes('政策') || content.includes('政策')) score += 15;
    if (title.includes('经济') || content.includes('经济')) score += 10;

    return Math.min(score, 100);
  }

  private calculateInteractionImportance(item: any): number {
    let score = 20;
    const content = (item.content || '').toLowerCase();

    // 基于问答内容的重要性评分
    if (content.includes('业绩') || content.includes('财报')) score += 20;
    if (content.includes('重大') || content.includes('重要')) score += 15;
    if (content.includes('合作') || content.includes('投资')) score += 10;

    return Math.min(score, 100);
  }

  private calculateSentimentScore(content: string): number {
    // 简化的情感分析：基于关键词
    const positiveKeywords = ['利好', '上涨', '增长', '盈利', '成功', '突破'];
    const negativeKeywords = ['利空', '下跌', '下降', '亏损', '失败', '风险'];

    let positiveCount = 0;
    let negativeCount = 0;

    positiveKeywords.forEach(keyword => {
      if (content.includes(keyword)) positiveCount++;
    });

    negativeKeywords.forEach(keyword => {
      if (content.includes(keyword)) negativeCount++;
    });

    if (positiveCount + negativeCount === 0) return 0;

    return ((positiveCount - negativeCount) / (positiveCount + negativeCount)) * 100;
  }

  private extractRelatedStocks(title: string, content: string): string[] {
    // 简化的股票代码提取
    const stockPattern = /[0-9]{6}\.[A-Z]{2}/g;
    const text = title + ' ' + content;
    const matches = text.match(stockPattern);
    return matches ? [...new Set(matches)] : [];
  }

  private extractRelatedConcepts(title: string, content: string): string[] {
    // 简化的概念提取
    const conceptKeywords = ['AI', '人工智能', '新能源', '芯片', '医药', '军工', '环保', '5G', '区块链'];
    const text = (title + ' ' + content).toLowerCase();
    const concepts: string[] = [];

    conceptKeywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        concepts.push(keyword);
      }
    });

    return concepts;
  }

  private extractDate(datetime: string): string {
    return datetime.split(' ')[0] || new Date().toISOString().split('T')[0];
  }

  private estimateDuration(content: string): number {
    // 基于内容长度估算时长（秒）
    return Math.max(content.length / 100, 30);
  }

  private parseQAPair(content: string): { question: string; answer: string } {
    // 简化的问答对解析
    const lines = content.split('\n').filter(line => line.trim());
    const question = lines[0] || '';
    const answer = lines.slice(1).join('\n') || '';
    return { question, answer };
  }

  private extractStockName(title: string): string {
    // 从标题中提取股票名称
    const match = title.match(/([A-Za-z\u4e00-\u9fa5]+)/);
    return match ? match[1] : '';
  }

  private extractQuestionTime(pubTime: string): string {
    return pubTime;
  }

  private extractAnswerTime(pubTime: string): string {
    return pubTime;
  }

  private extractQuestioner(question: string): string {
    // 简化的提问者提取
    if (question.includes('投资者')) return '投资者';
    if (question.includes('股民')) return '股民';
    return '投资者';
  }

  private extractResponder(answer: string): string {
    // 简化的回答者提取
    if (answer.includes('董秘')) return '董秘';
    if (answer.includes('公司')) return '公司';
    return '公司';
  }

  /**
   * 私有方法：发送API请求
   */
  private async makeRequest(apiName: string, params: any): Promise<any> {
    const axios = require('axios');

    try {
      const response = await axios.post('http://api.tushare.pro', params, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.code !== 0) {
        throw new Error(`Tushare API error: ${response.data.msg}`);
      }

      return response.data;

    } catch (error) {
      if (error.response) {
        throw new Error(`HTTP ${error.response.status}: ${error.response.data}`);
      } else if (error.request) {
        throw new Error('Network error: No response received');
      } else {
        throw new Error(`Request error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * 私有方法：解析API响应
   */
  private parseResponse(response: any): any[] {
    if (!response.data || !response.data.items || !response.data.fields) {
      return [];
    }

    const fields = response.data.fields;
    const items = response.data.items;

    return items.map((item: any[]) => {
      const obj: any = {};
      fields.forEach((field: string, index: number) => {
        obj[field] = item[index];
      });
      return obj;
    });
  }

  /**
   * 私有方法：获取缓存数据
   */
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.config.cache.ttl * 1000) {
      return cached.data;
    }
    return null;
  }

  /**
   * 私有方法：设置缓存数据
   */
  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 清理过期缓存
   */
  public clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.config.cache.ttl * 1000) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取配置信息
   */
  public getConfig(): TextualConfig {
    return { ...this.config };
  }
}

// 导出默认配置
export const defaultTextualConfig: TextualConfig = {
  enabled: true,
  sources: {
    longFormNews: true,
    newsBroadcast: true,
    eInteraction: true
  },
  schedule: {
    dailyUpdateTime: "18:00"
  },
  filters: {
    minImportanceScore: 30,
    maxContentLength: 500,
    relatedStocks: []
  },
  cache: {
    enabled: true,
    ttl: 7200 // 2小时缓存
  }
};

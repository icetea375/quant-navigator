/**
 * ConceptFetcher - 神经构建器
 * DataPipeline v1.5: 构建系统的"神经" - 同花顺/东方财富概念板块
 * 高频更新 (每日盘后)，捕捉市场的动态变化和热点轮动
 */

import { SimpleTushareDataSource } from '../services/SimpleTushareDataSource';
import { 
  ThsConceptData, 
  ThsConceptMemberData,
  DcConceptData,
  DcConceptMemberData 
} from '../interfaces/DataPipelineV15Interfaces';
import { BaseErrorHandler } from '../utils/BaseErrorHandler';

export interface ConceptConfig {
  enabled: boolean;
  sources: {
    ths: boolean;              // 同花顺概念板块
    dc: boolean;               // 东方财富概念板块
  };
  schedule: {
    dailyUpdateTime: string;   // 每日更新时间 "16:30"
  };
  filters: {
    minHotScore: number;       // 最小热度评分过滤
    topConcepts: number;       // 只保留前N个热门概念
  };
  cache: {
    enabled: boolean;
    ttl: number; // 缓存时间（秒）- 神经数据缓存时间较短
  };
}

export class ConceptFetcher {
  private tushareSource: SimpleTushareDataSource;
  private config: ConceptConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(tushareSource: SimpleTushareDataSource, config: ConceptConfig) {
    this.tushareSource = tushareSource;
    this.config = config;
  }

  /**
   * 获取同花顺概念板块数据
   * 接口: ths_index
   */
  public async getThsConcepts(tradeDate?: string): Promise<ThsConceptData[]> {
    try {
      const cacheKey = `ths_concepts_${tradeDate || 'latest'}`;
      
      // 检查缓存
      if (this.config.cache.enabled) {
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const params: any = {
        token: process.env.TUSHARE_TOKEN,
        api_name: 'ths_index',
        fields: 'ts_code,name,count,exchange,list_date,type'
      };

      if (tradeDate) {
        params.trade_date = tradeDate;
      }

      const response = await this.makeRequest('ths_index', params);
      const data = this.parseResponse(response) || [];

      // 转换为标准格式并过滤
      const formattedData: ThsConceptData[] = data
        .filter((item: any) => item.type === 'N') // 只保留概念板块
        .map((item: any) => ({
          concept_code: `${item.ts_code}.THS`,
          concept_name: item.name,
          source: 'THS',
          trade_date: tradeDate || new Date().toISOString().split('T')[0],
          hot_rank: undefined, // 需要从其他接口获取
          hot_score: undefined // 需要从其他接口获取
        }))
        .slice(0, this.config.filters.topConcepts);

      // 缓存数据
      if (this.config.cache.enabled) {
        this.setCachedData(cacheKey, formattedData);
      }

      return formattedData;

    } catch (error) {
      BaseErrorHandler.handle(error, 'ConceptFetcher.getThsConcepts');
      throw new Error(`Failed to get THS concepts: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取同花顺概念成分股数据
   * 接口: ths_member
   */
  public async getThsConceptMembers(conceptCode?: string, tradeDate?: string): Promise<ThsConceptMemberData[]> {
    try {
      const cacheKey = `ths_concept_members_${conceptCode || 'all'}_${tradeDate || 'latest'}`;
      
      // 检查缓存
      if (this.config.cache.enabled) {
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const params: any = {
        token: process.env.TUSHARE_TOKEN,
        api_name: 'ths_member',
        fields: 'ts_code,code,name,weight,in_date,out_date,is_new'
      };

      if (conceptCode) {
        params.ts_code = conceptCode;
      }

      const response = await this.makeRequest('ths_member', params);
      const data = this.parseResponse(response) || [];

      // 转换为标准格式
      const formattedData: ThsConceptMemberData[] = data.map((item: any) => ({
        concept_code: item.ts_code,
        stock_code: item.code,
        stock_name: item.name,
        trade_date: tradeDate || new Date().toISOString().split('T')[0],
        weight: item.weight,
        hot_rank: undefined // 需要从其他接口获取
      }));

      // 缓存数据
      if (this.config.cache.enabled) {
        this.setCachedData(cacheKey, formattedData);
      }

      return formattedData;

    } catch (error) {
      BaseErrorHandler.handle(error, 'ConceptFetcher.getThsConceptMembers');
      throw new Error(`Failed to get THS concept members: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取东方财富概念板块数据
   * 接口: dc_index
   */
  public async getDcConcepts(tradeDate?: string): Promise<DcConceptData[]> {
    try {
      const cacheKey = `dc_concepts_${tradeDate || 'latest'}`;
      
      // 检查缓存
      if (this.config.cache.enabled) {
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const params: any = {
        token: process.env.TUSHARE_TOKEN,
        api_name: 'dc_index',
        fields: 'ts_code,name,count,exchange,list_date,type'
      };

      if (tradeDate) {
        params.trade_date = tradeDate;
      }

      const response = await this.makeRequest('dc_index', params);
      const data = this.parseResponse(response) || [];

      // 转换为标准格式并过滤
      const formattedData: DcConceptData[] = data
        .filter((item: any) => item.type === 'N') // 只保留概念板块
        .map((item: any) => ({
          concept_code: `${item.ts_code}.DC`,
          concept_name: item.name,
          source: 'DC',
          trade_date: tradeDate || new Date().toISOString().split('T')[0],
          hot_rank: undefined, // 需要从其他接口获取
          hot_score: undefined // 需要从其他接口获取
        }))
        .slice(0, this.config.filters.topConcepts);

      // 缓存数据
      if (this.config.cache.enabled) {
        this.setCachedData(cacheKey, formattedData);
      }

      return formattedData;

    } catch (error) {
      BaseErrorHandler.handle(error, 'ConceptFetcher.getDcConcepts');
      throw new Error(`Failed to get DC concepts: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取东方财富概念成分股数据
   * 接口: dc_member
   */
  public async getDcConceptMembers(conceptCode?: string, tradeDate?: string): Promise<DcConceptMemberData[]> {
    try {
      const cacheKey = `dc_concept_members_${conceptCode || 'all'}_${tradeDate || 'latest'}`;
      
      // 检查缓存
      if (this.config.cache.enabled) {
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const params: any = {
        token: process.env.TUSHARE_TOKEN,
        api_name: 'dc_member',
        fields: 'ts_code,code,name,weight,in_date,out_date,is_new'
      };

      if (conceptCode) {
        params.ts_code = conceptCode;
      }

      const response = await this.makeRequest('dc_member', params);
      const data = this.parseResponse(response) || [];

      // 转换为标准格式
      const formattedData: DcConceptMemberData[] = data.map((item: any) => ({
        concept_code: item.ts_code,
        stock_code: item.code,
        stock_name: item.name,
        trade_date: tradeDate || new Date().toISOString().split('T')[0],
        weight: item.weight,
        hot_rank: undefined // 需要从其他接口获取
      }));

      // 缓存数据
      if (this.config.cache.enabled) {
        this.setCachedData(cacheKey, formattedData);
      }

      return formattedData;

    } catch (error) {
      BaseErrorHandler.handle(error, 'ConceptFetcher.getDcConceptMembers');
      throw new Error(`Failed to get DC concept members: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 每日盘后数据收集任务 (高频)
   * 获取当日最新的概念板块及其成分股快照
   */
  public async dailyDataCollection(tradeDate?: string): Promise<{
    thsConcepts: ThsConceptData[];
    thsMembers: ThsConceptMemberData[];
    dcConcepts: DcConceptData[];
    dcMembers: DcConceptMemberData[];
  }> {
    try {
      console.log('🧠 Starting nervous system data collection (Concept Hotspots)...');

      const results = {
        thsConcepts: [] as ThsConceptData[],
        thsMembers: [] as ThsConceptMemberData[],
        dcConcepts: [] as DcConceptData[],
        dcMembers: [] as DcConceptMemberData[]
      };

      // 获取同花顺概念数据
      if (this.config.sources.ths) {
        try {
          results.thsConcepts = await this.getThsConcepts(tradeDate);
          results.thsMembers = await this.getThsConceptMembers(undefined, tradeDate);
          console.log(`✅ THS concepts collected: ${results.thsConcepts.length} concepts, ${results.thsMembers.length} members`);
        } catch (error) {
          console.error('❌ Failed to collect THS concept data:', error);
        }
      }

      // 获取东方财富概念数据
      if (this.config.sources.dc) {
        try {
          results.dcConcepts = await this.getDcConcepts(tradeDate);
          results.dcMembers = await this.getDcConceptMembers(undefined, tradeDate);
          console.log(`✅ DC concepts collected: ${results.dcConcepts.length} concepts, ${results.dcMembers.length} members`);
        } catch (error) {
          console.error('❌ Failed to collect DC concept data:', error);
        }
      }

      console.log('✅ Nervous system data collection completed');
      return results;

    } catch (error) {
      BaseErrorHandler.handle(error, 'ConceptFetcher.dailyDataCollection');
      throw new Error(`Failed to perform daily data collection: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取概念热度排行榜
   */
  public async getConceptHotRanking(tradeDate?: string, limit: number = 50): Promise<Array<{
    concept_code: string;
    concept_name: string;
    source: string;
    member_count: number;
    avg_weight: number;
    hot_score: number;
  }>> {
    try {
      const thsConcepts = this.config.sources.ths ? await this.getThsConcepts(tradeDate) : [];
      const dcConcepts = this.config.sources.dc ? await this.getDcConcepts(tradeDate) : [];
      
      const allConcepts = [...thsConcepts, ...dcConcepts];
      
      // 获取成分股数据来计算热度
      const conceptStats = new Map<string, {
        concept_name: string;
        source: string;
        member_count: number;
        total_weight: number;
        hot_score: number;
      }>();

      for (const concept of allConcepts) {
        try {
          const members = concept.source === 'THS' 
            ? await this.getThsConceptMembers(concept.concept_code, tradeDate)
            : await this.getDcConceptMembers(concept.concept_code, tradeDate);

          const totalWeight = members.reduce((sum, member) => sum + (member.weight || 0), 0);
          const avgWeight = members.length > 0 ? totalWeight / members.length : 0;
          
          // 简化的热度计算：基于成分股数量和平均权重
          const hotScore = members.length * 0.6 + avgWeight * 0.4;

          conceptStats.set(concept.concept_code, {
            concept_name: concept.concept_name,
            source: concept.source,
            member_count: members.length,
            total_weight: totalWeight,
            hot_score: hotScore
          });
        } catch (error) {
          console.warn(`Failed to get members for concept ${concept.concept_code}:`, error);
        }
      }

      // 生成排行榜
      const ranking = Array.from(conceptStats.entries())
        .map(([concept_code, stats]) => ({
          concept_code,
          concept_name: stats.concept_name,
          source: stats.source,
          member_count: stats.member_count,
          avg_weight: stats.total_weight / stats.member_count,
          hot_score: stats.hot_score
        }))
        .sort((a, b) => b.hot_score - a.hot_score)
        .slice(0, limit);

      return ranking;

    } catch (error) {
      BaseErrorHandler.handle(error, 'ConceptFetcher.getConceptHotRanking');
      throw new Error(`Failed to get concept hot ranking: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取股票所属概念信息
   */
  public async getStockConceptInfo(stockCode: string, tradeDate?: string): Promise<{
    thsConcepts: ThsConceptMemberData[];
    dcConcepts: DcConceptMemberData[];
  }> {
    try {
      const results = {
        thsConcepts: [] as ThsConceptMemberData[],
        dcConcepts: [] as DcConceptMemberData[]
      };

      if (this.config.sources.ths) {
        try {
          const thsMembers = await this.getThsConceptMembers(undefined, tradeDate);
          results.thsConcepts = thsMembers.filter(member => member.stock_code === stockCode);
        } catch (error) {
          console.warn(`Failed to get THS concept info for ${stockCode}:`, error);
        }
      }

      if (this.config.sources.dc) {
        try {
          const dcMembers = await this.getDcConceptMembers(undefined, tradeDate);
          results.dcConcepts = dcMembers.filter(member => member.stock_code === stockCode);
        } catch (error) {
          console.warn(`Failed to get DC concept info for ${stockCode}:`, error);
        }
      }

      return results;

    } catch (error) {
      BaseErrorHandler.handle(error, 'ConceptFetcher.getStockConceptInfo');
      throw new Error(`Failed to get stock concept info: ${error instanceof Error ? error.message : String(error)}`);
    }
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
  public getConfig(): ConceptConfig {
    return { ...this.config };
  }
}

// 导出默认配置
export const defaultConceptConfig: ConceptConfig = {
  enabled: true,
  sources: {
    ths: true,
    dc: true
  },
  schedule: {
    dailyUpdateTime: "16:30"
  },
  filters: {
    minHotScore: 0,
    topConcepts: 200 // 只保留前200个热门概念
  },
  cache: {
    enabled: true,
    ttl: 3600 // 1小时缓存 (神经数据变化频繁)
  }
};

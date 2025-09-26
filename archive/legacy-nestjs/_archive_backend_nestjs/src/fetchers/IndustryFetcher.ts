/**
 * IndustryFetcher - 骨架构建器
 * DataPipeline v1.5: 构建系统的"骨架" - 申万/中信行业分类体系
 * 低频更新 (每月/每季度)，提供稳定的结构化知识库
 */

import { SimpleTushareDataSource } from '../services/SimpleTushareDataSource';
import {
  ShenwanIndustryData,
  ShenwanIndustryMemberData,
  CiticIndustryData,
  CiticIndustryMemberData
} from '../interfaces/DataPipelineV15Interfaces';
import { BaseErrorHandler } from '../utils/BaseErrorHandler';

export interface IndustryConfig {
  enabled: boolean;
  sources: {
    shenwan: boolean;         // 申万行业分类
    citic: boolean;           // 中信行业分类
  };
  schedule: {
    updateFrequency: 'monthly' | 'quarterly'; // 更新频率
    updateDay: number;        // 更新日期 (1-31)
  };
  cache: {
    enabled: boolean;
    ttl: number; // 缓存时间（秒）- 骨架数据缓存时间较长
  };
}

export class IndustryFetcher {
  private tushareSource: SimpleTushareDataSource;
  private config: IndustryConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(tushareSource: SimpleTushareDataSource, config: IndustryConfig) {
    this.tushareSource = tushareSource;
    this.config = config;
  }

  /**
   * 获取申万行业分类数据
   * 接口: index_classify
   */
  public async getShenwanIndustryClassification(): Promise<ShenwanIndustryData[]> {
    try {
      const cacheKey = 'shenwan_industry_classification';

      // 检查缓存
      if (this.config.cache.enabled) {
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const params = {
        token: process.env.TUSHARE_TOKEN,
        api_name: 'index_classify',
        fields: 'index_code,industry_name,level,parent_code',
        src: 'SW' // 申万
      };

      const response = await this.makeRequest('index_classify', params);
      const data = this.parseResponse(response) || [];

      // 转换为标准格式
      const formattedData: ShenwanIndustryData[] = data.map((item: any) => ({
        industry_code: item.index_code,
        industry_name: item.industry_name,
        level: this.mapLevel(item.level),
        parent_code: item.parent_code || '',
        source: 'Shenwan',
        update_date: new Date().toISOString().split('T')[0]
      }));

      // 缓存数据
      if (this.config.cache.enabled) {
        this.setCachedData(cacheKey, formattedData);
      }

      return formattedData;

    } catch (error) {
      BaseErrorHandler.handle(error, 'IndustryFetcher.getShenwanIndustryClassification');
      throw new Error(`Failed to get Shenwan industry classification: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取申万行业成分股数据
   * 接口: index_member
   */
  public async getShenwanIndustryMembers(industryCode?: string): Promise<ShenwanIndustryMemberData[]> {
    try {
      const cacheKey = `shenwan_industry_members_${industryCode || 'all'}`;

      // 检查缓存
      if (this.config.cache.enabled) {
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const params: any = {
        token: process.env.TUSHARE_TOKEN,
        api_name: 'index_member',
        fields: 'index_code,con_code,con_name,in_date,out_date,is_new',
        src: 'SW' // 申万
      };

      if (industryCode) {
        params.index_code = industryCode;
      }

      const response = await this.makeRequest('index_member', params);
      const data = this.parseResponse(response) || [];

      // 转换为标准格式
      const formattedData: ShenwanIndustryMemberData[] = data.map((item: any) => ({
        industry_code: item.index_code,
        stock_code: item.con_code,
        stock_name: item.con_name,
        in_date: item.in_date,
        out_date: item.out_date || undefined,
        is_current: !item.out_date, // 没有剔除日期表示当前成分
        weight: undefined // 申万行业分类通常不提供权重
      }));

      // 缓存数据
      if (this.config.cache.enabled) {
        this.setCachedData(cacheKey, formattedData);
      }

      return formattedData;

    } catch (error) {
      BaseErrorHandler.handle(error, 'IndustryFetcher.getShenwanIndustryMembers');
      throw new Error(`Failed to get Shenwan industry members: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取中信行业分类数据
   * 接口: index_classify
   */
  public async getCiticIndustryClassification(): Promise<CiticIndustryData[]> {
    try {
      const cacheKey = 'citic_industry_classification';

      // 检查缓存
      if (this.config.cache.enabled) {
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const params = {
        token: process.env.TUSHARE_TOKEN,
        api_name: 'index_classify',
        fields: 'index_code,industry_name,level,parent_code',
        src: 'CITIC' // 中信
      };

      const response = await this.makeRequest('index_classify', params);
      const data = this.parseResponse(response) || [];

      // 转换为标准格式
      const formattedData: CiticIndustryData[] = data.map((item: any) => ({
        industry_code: item.index_code,
        industry_name: item.industry_name,
        level: this.mapLevel(item.level),
        parent_code: item.parent_code || '',
        source: 'Citic',
        update_date: new Date().toISOString().split('T')[0]
      }));

      // 缓存数据
      if (this.config.cache.enabled) {
        this.setCachedData(cacheKey, formattedData);
      }

      return formattedData;

    } catch (error) {
      BaseErrorHandler.handle(error, 'IndustryFetcher.getCiticIndustryClassification');
      throw new Error(`Failed to get Citic industry classification: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取中信行业成分股数据
   * 接口: index_member
   */
  public async getCiticIndustryMembers(industryCode?: string): Promise<CiticIndustryMemberData[]> {
    try {
      const cacheKey = `citic_industry_members_${industryCode || 'all'}`;

      // 检查缓存
      if (this.config.cache.enabled) {
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const params: any = {
        token: process.env.TUSHARE_TOKEN,
        api_name: 'index_member',
        fields: 'index_code,con_code,con_name,in_date,out_date,is_new',
        src: 'CITIC' // 中信
      };

      if (industryCode) {
        params.index_code = industryCode;
      }

      const response = await this.makeRequest('index_member', params);
      const data = this.parseResponse(response) || [];

      // 转换为标准格式
      const formattedData: CiticIndustryMemberData[] = data.map((item: any) => ({
        industry_code: item.index_code,
        stock_code: item.con_code,
        stock_name: item.con_name,
        in_date: item.in_date,
        out_date: item.out_date || undefined,
        is_current: !item.out_date, // 没有剔除日期表示当前成分
        weight: undefined // 中信行业分类通常不提供权重
      }));

      // 缓存数据
      if (this.config.cache.enabled) {
        this.setCachedData(cacheKey, formattedData);
      }

      return formattedData;

    } catch (error) {
      BaseErrorHandler.handle(error, 'IndustryFetcher.getCiticIndustryMembers');
      throw new Error(`Failed to get Citic industry members: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 定期更新任务 (低频)
   * 每月或每季度更新行业分类和成分股数据
   */
  public async periodicUpdate(): Promise<{
    shenwan: {
      classification: ShenwanIndustryData[];
      members: ShenwanIndustryMemberData[];
    };
    citic: {
      classification: CiticIndustryData[];
      members: CiticIndustryMemberData[];
    };
  }> {
    try {
      console.log('🏗️ Starting skeleton data update (Industry Classification)...');

      const results = {
        shenwan: {
          classification: [] as ShenwanIndustryData[],
          members: [] as ShenwanIndustryMemberData[]
        },
        citic: {
          classification: [] as CiticIndustryData[],
          members: [] as CiticIndustryMemberData[]
        }
      };

      // 更新申万数据
      if (this.config.sources.shenwan) {
        try {
          results.shenwan.classification = await this.getShenwanIndustryClassification();
          results.shenwan.members = await this.getShenwanIndustryMembers();
          console.log(`✅ Shenwan data updated: ${results.shenwan.classification.length} industries, ${results.shenwan.members.length} members`);
        } catch (error) {
          console.error('❌ Failed to update Shenwan data:', error);
        }
      }

      // 更新中信数据
      if (this.config.sources.citic) {
        try {
          results.citic.classification = await this.getCiticIndustryClassification();
          results.citic.members = await this.getCiticIndustryMembers();
          console.log(`✅ Citic data updated: ${results.citic.classification.length} industries, ${results.citic.members.length} members`);
        } catch (error) {
          console.error('❌ Failed to update Citic data:', error);
        }
      }

      console.log('✅ Skeleton data update completed');
      return results;

    } catch (error) {
      BaseErrorHandler.handle(error, 'IndustryFetcher.periodicUpdate');
      throw new Error(`Failed to perform periodic update: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取行业层级结构
   */
  public async getIndustryHierarchy(source: 'Shenwan' | 'Citic'): Promise<{
    level1: any[];
    level2: any[];
    level3: any[];
  }> {
    try {
      const classification = source === 'Shenwan'
        ? await this.getShenwanIndustryClassification()
        : await this.getCiticIndustryClassification();

      const hierarchy = {
        level1: classification.filter(item => item.level === 'L1'),
        level2: classification.filter(item => item.level === 'L2'),
        level3: classification.filter(item => item.level === 'L3')
      };

      return hierarchy;

    } catch (error) {
      BaseErrorHandler.handle(error, 'IndustryFetcher.getIndustryHierarchy');
      throw new Error(`Failed to get industry hierarchy: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取股票所属行业信息
   */
  public async getStockIndustryInfo(stockCode: string): Promise<{
    shenwan: ShenwanIndustryMemberData[];
    citic: CiticIndustryMemberData[];
  }> {
    try {
      const results = {
        shenwan: [] as ShenwanIndustryMemberData[],
        citic: [] as CiticIndustryMemberData[]
      };

      if (this.config.sources.shenwan) {
        try {
          const shenwanMembers = await this.getShenwanIndustryMembers();
          results.shenwan = shenwanMembers.filter(member =>
            member.stock_code === stockCode && member.is_current
          );
        } catch (error) {
          console.warn(`Failed to get Shenwan industry info for ${stockCode}:`, error);
        }
      }

      if (this.config.sources.citic) {
        try {
          const citicMembers = await this.getCiticIndustryMembers();
          results.citic = citicMembers.filter(member =>
            member.stock_code === stockCode && member.is_current
          );
        } catch (error) {
          console.warn(`Failed to get Citic industry info for ${stockCode}:`, error);
        }
      }

      return results;

    } catch (error) {
      BaseErrorHandler.handle(error, 'IndustryFetcher.getStockIndustryInfo');
      throw new Error(`Failed to get stock industry info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 映射行业层级
   */
  private mapLevel(level: any): string {
    if (typeof level === 'number') {
      return `L${level}`;
    }
    if (typeof level === 'string') {
      return level.toUpperCase();
    }
    return 'L1';
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
  public getConfig(): IndustryConfig {
    return { ...this.config };
  }
}

// 导出默认配置
export const defaultIndustryConfig: IndustryConfig = {
  enabled: true,
  sources: {
    shenwan: true,
    citic: true
  },
  schedule: {
    updateFrequency: 'quarterly', // 季度更新
    updateDay: 1 // 每月1号
  },
  cache: {
    enabled: true,
    ttl: 2592000 // 30天缓存 (骨架数据变化缓慢)
  }
};

/**
 * MarketStructureFetcher - 市场结构数据获取器
 * 第一阶段：核心博弈数据整合 - 筹码分布和集合竞价数据
 */

import { SimpleTushareDataSource } from '../services/SimpleTushareDataSource';
import { ChipDistributionData, AuctionData } from '../interfaces/DataPipelineV13Interfaces';
import { BaseErrorHandler } from '../utils/BaseErrorHandler';

export interface MarketStructureConfig {
  enabled: boolean;
  schedule: {
    preMarketTime: string;  // "09:15" - 盘前获取竞价数据
    postMarketTime: string; // "16:30" - 盘后获取筹码分布数据
  };
  targets: {
    coreStocks: string[];   // 核心关注个股列表
  };
  cache: {
    enabled: boolean;
    ttl: number; // 缓存时间（秒）
  };
}

export class MarketStructureFetcher {
  private tushareSource: SimpleTushareDataSource;
  private config: MarketStructureConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(tushareSource: SimpleTushareDataSource, config: MarketStructureConfig) {
    this.tushareSource = tushareSource;
    this.config = config;
  }

  /**
   * 获取每日筹码分布数据
   * 接口: chip_dist
   */
  public async getChipDistribution(tsCode: string, tradeDate?: string): Promise<ChipDistributionData[]> {
    try {
      const cacheKey = `chip_dist_${tsCode}_${tradeDate || 'latest'}`;
      
      // 检查缓存
      if (this.config.cache.enabled) {
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const params: any = {
        token: process.env.TUSHARE_TOKEN,
        api_name: 'cyq_chips',
        fields: 'trade_date,ts_code,price,volume,percent,ma_cost,winner_rate',
        ts_code: tsCode
      };

      if (tradeDate) {
        params.trade_date = tradeDate;
      }

      const response = await this.makeRequest('cyq_chips', params);
      const data = this.parseResponse(response) || [];

      // 缓存数据
      if (this.config.cache.enabled) {
        this.setCachedData(cacheKey, data);
      }

      return data;

    } catch (error) {
      BaseErrorHandler.handle(error, 'MarketStructureFetcher.getChipDistribution');
      throw new Error(`Failed to get chip distribution data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取股票开盘集合竞价数据
   * 接口: stk_auction
   */
  public async getAuctionData(tsCode?: string, tradeDate?: string): Promise<AuctionData[]> {
    try {
      const cacheKey = `auction_${tsCode || 'all'}_${tradeDate || 'latest'}`;
      
      // 检查缓存
      if (this.config.cache.enabled) {
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const params: any = {
        token: process.env.TUSHARE_TOKEN,
        api_name: 'stk_auction',
        fields: 'trade_date,ts_code,open,pre_close,pct_chg,amount,volume,buy_amount,sell_amount,net_amount'
      };

      if (tsCode) {
        params.ts_code = tsCode;
      }
      if (tradeDate) {
        params.trade_date = tradeDate;
      }

      const response = await this.makeRequest('stk_auction', params);
      const data = this.parseResponse(response) || [];

      // 缓存数据
      if (this.config.cache.enabled) {
        this.setCachedData(cacheKey, data);
      }

      return data;

    } catch (error) {
      BaseErrorHandler.handle(error, 'MarketStructureFetcher.getAuctionData');
      throw new Error(`Failed to get auction data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 每日盘前数据收集任务
   * 获取集合竞价数据
   */
  public async preMarketDataCollection(tradeDate?: string): Promise<AuctionData[]> {
    try {
      const results: AuctionData[] = [];

      if (this.config.targets.coreStocks.length > 0) {
        // 获取核心股票的集合竞价数据
        for (const tsCode of this.config.targets.coreStocks) {
          try {
            const auctionData = await this.getAuctionData(tsCode, tradeDate);
            results.push(...auctionData);
          } catch (error) {
            console.warn(`Failed to get auction data for ${tsCode}:`, error);
          }
        }
      } else {
        // 获取所有股票的集合竞价数据
        const allAuctionData = await this.getAuctionData(undefined, tradeDate);
        results.push(...allAuctionData);
      }

      return results;

    } catch (error) {
      BaseErrorHandler.handle(error, 'MarketStructureFetcher.preMarketDataCollection');
      throw new Error(`Failed to perform pre-market data collection: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 每日盘后数据收集任务
   * 获取筹码分布数据
   */
  public async postMarketDataCollection(tradeDate?: string): Promise<ChipDistributionData[]> {
    try {
      const results: ChipDistributionData[] = [];

      if (this.config.targets.coreStocks.length > 0) {
        // 获取核心股票的筹码分布数据
        for (const tsCode of this.config.targets.coreStocks) {
          try {
            const chipData = await this.getChipDistribution(tsCode, tradeDate);
            results.push(...chipData);
          } catch (error) {
            console.warn(`Failed to get chip distribution for ${tsCode}:`, error);
          }
        }
      }

      return results;

    } catch (error) {
      BaseErrorHandler.handle(error, 'MarketStructureFetcher.postMarketDataCollection');
      throw new Error(`Failed to perform post-market data collection: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取筹码分布分析报告
   */
  public async getChipAnalysisReport(tsCode: string, tradeDate?: string): Promise<{
    chipData: ChipDistributionData[];
    analysis: {
      avgCost: number;
      winnerRate: number;
      concentration: number;
      trend: 'bullish' | 'bearish' | 'neutral';
    };
  }> {
    try {
      const chipData = await this.getChipDistribution(tsCode, tradeDate);
      
      if (chipData.length === 0) {
        throw new Error('No chip distribution data available');
      }

      // 计算分析指标
      const avgCost = chipData.reduce((sum, item) => sum + (item.ma_cost || 0), 0) / chipData.length;
      const winnerRate = chipData.reduce((sum, item) => sum + (item.winner_rate || 0), 0) / chipData.length;
      
      // 计算筹码集中度（基于价格分布的标准差）
      const prices = chipData.map(item => item.price);
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
      const concentration = 1 / (1 + Math.sqrt(variance)); // 标准差越小，集中度越高

      // 判断趋势
      let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (winnerRate > 60 && concentration > 0.6) {
        trend = 'bullish';
      } else if (winnerRate < 40 && concentration < 0.4) {
        trend = 'bearish';
      }

      return {
        chipData,
        analysis: {
          avgCost,
          winnerRate,
          concentration,
          trend
        }
      };

    } catch (error) {
      BaseErrorHandler.handle(error, 'MarketStructureFetcher.getChipAnalysisReport');
      throw new Error(`Failed to get chip analysis report: ${error instanceof Error ? error.message : String(error)}`);
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
  public getConfig(): MarketStructureConfig {
    return { ...this.config };
  }
}

// 导出默认配置
export const defaultMarketStructureConfig: MarketStructureConfig = {
  enabled: true,
  schedule: {
    preMarketTime: "09:15",
    postMarketTime: "16:30"
  },
  targets: {
    coreStocks: [] // 空数组表示获取所有股票
  },
  cache: {
    enabled: true,
    ttl: 3600 // 1小时缓存
  }
};

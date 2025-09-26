/**
 * MoneyFlowFetcher - 资金流向数据获取器
 * 第一阶段：核心博弈数据整合 - 个股和板块资金流向数据
 */

import { SimpleTushareDataSource } from '../services/SimpleTushareDataSource';
import { MoneyFlowData, SectorMoneyFlowData } from '../interfaces/DataPipelineV13Interfaces';
import { BaseErrorHandler } from '../utils/BaseErrorHandler';

export interface MoneyFlowConfig {
  enabled: boolean;
  schedule: {
    dailyUpdateTime: string; // "16:30" - 每日盘后更新时间
  };
  targets: {
    coreStocks: string[];    // 核心关注个股列表
    coreSectors: string[];   // 核心关注板块列表
  };
  cache: {
    enabled: boolean;
    ttl: number; // 缓存时间（秒）
  };
}

export class MoneyFlowFetcher {
  private tushareSource: SimpleTushareDataSource;
  private config: MoneyFlowConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(tushareSource: SimpleTushareDataSource, config: MoneyFlowConfig) {
    this.tushareSource = tushareSource;
    this.config = config;
  }

  /**
   * 获取个股资金流向数据 (DC)
   * 接口: moneyflow_dc
   */
  public async getStockMoneyFlow(tsCode?: string, tradeDate?: string): Promise<MoneyFlowData[]> {
    try {
      const cacheKey = `stock_money_flow_${tsCode || 'all'}_${tradeDate || 'latest'}`;

      // 检查缓存
      if (this.config.cache.enabled) {
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const params: any = {
        token: process.env.TUSHARE_TOKEN,
        api_name: 'moneyflow_dc',
        fields: 'trade_date,ts_code,name,close,pct_chg,buy_sm_amount,buy_md_amount,buy_lg_amount,buy_elg_amount,sell_sm_amount,sell_md_amount,sell_lg_amount,sell_elg_amount,net_mf_amount,net_mf_rate'
      };

      if (tsCode) {
        params.ts_code = tsCode;
      }
      if (tradeDate) {
        params.trade_date = tradeDate;
      }

      // 使用内部方法调用API
      const response = await this.makeRequest('moneyflow_dc', params);
      const data = this.parseResponse(response) || [];

      // 缓存数据
      if (this.config.cache.enabled) {
        this.setCachedData(cacheKey, data);
      }

      return data;

    } catch (error) {
      BaseErrorHandler.handle(error, 'MoneyFlowFetcher.getStockMoneyFlow');
      throw new Error(`Failed to get stock money flow data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取板块资金流向数据 (DC)
   * 接口: sector_money_flow_dc
   */
  public async getSectorMoneyFlow(sectorCode?: string, tradeDate?: string): Promise<SectorMoneyFlowData[]> {
    try {
      const cacheKey = `sector_money_flow_${sectorCode || 'all'}_${tradeDate || 'latest'}`;

      // 检查缓存
      if (this.config.cache.enabled) {
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const params: any = {
        token: process.env.TUSHARE_TOKEN,
        api_name: 'sector_money_flow_dc',
        fields: 'trade_date,sector_code,sector_name,close,pct_chg,buy_amount,sell_amount,net_amount,net_rate,rank'
      };

      if (sectorCode) {
        params.sector_code = sectorCode;
      }
      if (tradeDate) {
        params.trade_date = tradeDate;
      }

      const response = await this.makeRequest('sector_money_flow_dc', params);
      const data = this.parseResponse(response) || [];

      // 缓存数据
      if (this.config.cache.enabled) {
        this.setCachedData(cacheKey, data);
      }

      return data;

    } catch (error) {
      BaseErrorHandler.handle(error, 'MoneyFlowFetcher.getSectorMoneyFlow');
      throw new Error(`Failed to get sector money flow data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 每日盘后数据收集任务
   * 获取所有核心标的及板块的资金流向数据
   */
  public async dailyDataCollection(tradeDate?: string): Promise<{
    stockFlows: MoneyFlowData[];
    sectorFlows: SectorMoneyFlowData[];
  }> {
    try {
      const results = {
        stockFlows: [] as MoneyFlowData[],
        sectorFlows: [] as SectorMoneyFlowData[]
      };

      // 获取核心个股资金流向
      if (this.config.targets.coreStocks.length > 0) {
        for (const tsCode of this.config.targets.coreStocks) {
          try {
            const stockFlow = await this.getStockMoneyFlow(tsCode, tradeDate);
            results.stockFlows.push(...stockFlow);
          } catch (error) {
            console.warn(`Failed to get money flow for ${tsCode}:`, error);
          }
        }
      } else {
        // 如果没有指定核心股票，获取所有股票的资金流向
        const allStockFlows = await this.getStockMoneyFlow(undefined, tradeDate);
        results.stockFlows = allStockFlows;
      }

      // 获取核心板块资金流向
      if (this.config.targets.coreSectors.length > 0) {
        for (const sectorCode of this.config.targets.coreSectors) {
          try {
            const sectorFlow = await this.getSectorMoneyFlow(sectorCode, tradeDate);
            results.sectorFlows.push(...sectorFlow);
          } catch (error) {
            console.warn(`Failed to get sector money flow for ${sectorCode}:`, error);
          }
        }
      } else {
        // 如果没有指定核心板块，获取所有板块的资金流向
        const allSectorFlows = await this.getSectorMoneyFlow(undefined, tradeDate);
        results.sectorFlows = allSectorFlows;
      }

      return results;

    } catch (error) {
      BaseErrorHandler.handle(error, 'MoneyFlowFetcher.dailyDataCollection');
      throw new Error(`Failed to perform daily data collection: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取资金流向排行榜
   */
  public async getMoneyFlowRanking(tradeDate?: string, limit: number = 50): Promise<{
    netInflowTop: MoneyFlowData[];
    netOutflowTop: MoneyFlowData[];
  }> {
    try {
      const stockFlows = await this.getStockMoneyFlow(undefined, tradeDate);

      // 按净流入金额排序
      const sortedByNetInflow = [...stockFlows].sort((a, b) => (b.net_mf_amount || 0) - (a.net_mf_amount || 0));

      return {
        netInflowTop: sortedByNetInflow.slice(0, limit),
        netOutflowTop: sortedByNetInflow.slice(-limit).reverse()
      };

    } catch (error) {
      BaseErrorHandler.handle(error, 'MoneyFlowFetcher.getMoneyFlowRanking');
      throw new Error(`Failed to get money flow ranking: ${error instanceof Error ? error.message : String(error)}`);
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
  public getConfig(): MoneyFlowConfig {
    return { ...this.config };
  }
}

// 导出默认配置
export const defaultMoneyFlowConfig: MoneyFlowConfig = {
  enabled: true,
  schedule: {
    dailyUpdateTime: "16:30"
  },
  targets: {
    coreStocks: [], // 空数组表示获取所有股票
    coreSectors: [] // 空数组表示获取所有板块
  },
  cache: {
    enabled: true,
    ttl: 1800 // 30分钟缓存
  }
};

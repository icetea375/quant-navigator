/**
 * SimpleTushareDataSource - Tushare数据源集成服务
 * 统一数据源集成，提供股票、指数、财务数据获取
 * 重构为继承BaseFetcher，消除代码冗余
 */

import { DatabaseConnection } from '../database/connection';
import { Redis } from 'ioredis';
import { BaseFetcher, BaseFetcherConfig } from '../core/BaseFetcher';
import { logger } from '../utils/logger';

export interface TushareConfig extends BaseFetcherConfig {
  token: string;
  baseUrl: string;
  retryCount: number;
  retryDelay: number;
  rateLimit: {
    enabled: boolean;
    requestsPerMinute: number;
  };
  cache: {
    enabled: boolean;
    ttl: number;
  };
}

export interface StockBasicInfo {
  ts_code: string;
  symbol: string;
  name: string;
  area: string;
  industry: string;
  market: string;
  list_date: string;
}

export interface IndexBasicInfo {
  ts_code: string;
  name: string;
  market: string;
  publisher: string;
  category: string;
  base_date: string;
  base_point: number;
}

export interface DailyData {
  ts_code: string;
  trade_date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  pre_close: number;
  change: number;
  pct_chg: number;
  vol: number;
  amount: number;
}

export interface FinancialData {
  ts_code: string;
  ann_date: string;
  f_ann_date: string;
  end_date: string;
  report_type: string;
  comp_type: string;
  basic_eps: number;
  diluted_eps: number;
  total_revenue: number;
  revenue: number;
  int_income: number;
  prem_earned: number;
  comm_income: number;
  n_commis_income: number;
  n_oth_income: number;
  n_oth_b_income: number;
  prem_income: number;
  out_prem: number;
  une_prem_reser: number;
  reins_income: number;
  n_sec_tb_income: number;
  n_sec_uw_income: number;
  n_asset_mg_income: number;
  oth_b_income: number;
  fv_value_chg_gain: number;
  invest_income: number;
  ass_invest_income: number;
  forex_gain: number;
  total_cogs: number;
  oper_cost: number;
  int_exp: number;
  comm_exp: number;
  biz_tax_surchg: number;
  sell_exp: number;
  admin_exp: number;
  fin_exp: number;
  assets_impair_loss: number;
  prem_refund: number;
  compens_payout: number;
  reser_insur_liab: number;
  div_payt: number;
  reins_exp: number;
  oper_exp: number;
  compens_payout_refu: number;
  insur_reser_refu: number;
  reins_cost_refund: number;
  other_bus_cost: number;
  operate_profit: number;
  non_oper_income: number;
  non_oper_exp: number;
  nca_disploss: number;
  total_profit: number;
  income_tax: number;
  n_income: number;
  n_income_attr_p: number;
  minority_gain: number;
  oth_compr_income: number;
  t_compr_income: number;
  compr_inc_attr_p: number;
  compr_inc_attr_m_s: number;
  ebit: number;
  ebitda: number;
  insurance_exp: number;
  undist_profit: number;
  distable_profit: number;
}

// 新增数据接口定义
export interface DailyBasicData {
  ts_code: string;
  trade_date: string;
  close: number;
  turnover_rate: number;
  turnover_rate_f: number;
  volume_ratio: number;
  pe: number;
  pe_ttm: number;
  pb: number;
  ps: number;
  ps_ttm: number;
  dv_ratio: number;
  dv_ttm: number;
  total_share: number;
  float_share: number;
  free_share: number;
  total_mv: number;
  circ_mv: number;
}

export interface AnnouncementData {
  ts_code: string;
  ann_date: string;
  ann_type: string;
  title: string;
  content: string;
  pub_time: string;
  url: string;
}

export interface NewsData {
  datetime: string;
  title: string;
  content: string;
  url: string;
}

export interface TopListData {
  trade_date: string;
  ts_code: string;
  name: string;
  close: number;
  pct_chg: number;
  turnover_rate: number;
  amount: number;
  l_sell: number;
  l_buy: number;
  l_amount: number;
  net_amount: number;
  net_rate: number;
  amount_rate: number;
  float_values: number;
  reason: string;
}

export interface DcHotData {
  trade_date: string;
  ts_code: string;
  name: string;
  close: number;
  pct_chg: number;
  amount: number;
  turnover_rate: number;
  pe: number;
  pb: number;
  market_cap: number;
  circ_mv: number;
  hot_rank: number;
  hot_score: number;
}

export interface ThsHotData {
  trade_date: string;
  ts_code: string;
  name: string;
  close: number;
  pct_chg: number;
  amount: number;
  turnover_rate: number;
  pe: number;
  pb: number;
  market_cap: number;
  circ_mv: number;
  hot_rank: number;
  hot_score: number;
}

export interface LimitListData {
  trade_date: string;
  ts_code: string;
  name: string;
  close: number;
  pct_chg: number;
  amount: number;
  limit_amount: number;
  float_mv: number;
  total_mv: number;
  turnover_rate: number;
  fd_amount: number;
  first_time: string;
  last_time: string;
  open_times: number;
  strth: number;
  limit: string;
  up_stat: string;
  limit_t_d: string;
  limit_t_u: string;
  limit_t_n: string;
  limit_t_s: string;
  limit_t_e: string;
  limit_t_m: string;
  limit_t_l: string;
  limit_t_h: string;
  limit_t_a: string;
  limit_t_b: string;
  limit_t_c: string;
  limit_t_f: string;
  limit_t_g: string;
  limit_t_i: string;
  limit_t_j: string;
  limit_t_k: string;
  limit_t_o: string;
  limit_t_p: string;
  limit_t_q: string;
  limit_t_r: string;
  limit_t_t: string;
  limit_t_v: string;
  limit_t_w: string;
  limit_t_x: string;
  limit_t_y: string;
  limit_t_z: string;
}

export interface TradeCalData {
  cal_date: string;
  is_open: number;
  pretrade_date: string;
}

export interface ThsMemberData {
  ts_code: string;
  code: string;
  name: string;
  weight: number;
  in_date: string;
  out_date: string;
  is_new: number;
}

export interface DcMemberData {
  ts_code: string;
  code: string;
  name: string;
  weight: number;
  in_date: string;
  out_date: string;
  is_new: number;
}

export interface IndexDailyData {
  ts_code: string;
  trade_date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  pre_close: number;
  change: number;
  pct_chg: number;
  vol: number;
  amount: number;
}

export class SimpleTushareDataSource extends BaseFetcher {
  private rateLimiter: RateLimiter;

  constructor(
    db: DatabaseConnection,
    redis: Redis,
    config: TushareConfig
  ) {
    super(db, redis, config);
    this.rateLimiter = new RateLimiter(config.rateLimit);
  }

  /**
   * 获取股票基本信息
   */
  public async getStockBasicInfo(tsCode?: string): Promise<StockBasicInfo[]> {
    try {
      const cacheKey = `stock_basic_${tsCode || 'all'}`;
      
      // 检查缓存
      if (this.config.caching.enabled) {
        const cached = await this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // 检查速率限制
      await this.rateLimiter.waitForRateLimit();

      const params: any = {
        token: this.config.token,
        api_name: 'stock_basic',
        fields: 'ts_code,symbol,name,area,industry,market,list_date'
      };

      if (tsCode) {
        params.ts_code = tsCode;
      }

      const response = await this.makeRequest('stock_basic', params);
      const data = response.data || [];

      // 缓存数据
      if (this.config.caching.enabled) {
        await this.setCachedData(cacheKey, data);
      }

      return data;

    } catch (error) {
      logger.error('SimpleTushareDataSource error:', error);
      throw new Error(`Failed to get stock basic info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取指数基本信息
   */
  public async getIndexBasicInfo(tsCode?: string): Promise<IndexBasicInfo[]> {
    try {
      const cacheKey = `index_basic_${tsCode || 'all'}`;
      
      // 检查缓存
      if (this.config.caching.enabled) {
        const cached = await this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // 检查速率限制
      await this.rateLimiter.waitForRateLimit();

      const params: any = {
        token: this.config.token,
        api_name: 'index_basic',
        fields: 'ts_code,name,market,publisher,category,base_date,base_point'
      };

      if (tsCode) {
        params.ts_code = tsCode;
      }

      const response = await this.makeRequest('index_basic', params);
      const data = response.data || [];

      // 缓存数据
      if (this.config.caching.enabled) {
        await this.setCachedData(cacheKey, data);
      }

      return data;

    } catch (error) {
      logger.error('SimpleTushareDataSource error:', error);
      throw new Error(`Failed to get index basic info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取日行情数据
   */
  public async getDailyData(tsCode: string, startDate?: string, endDate?: string): Promise<DailyData[]> {
    try {
      const cacheKey = `daily_${tsCode}_${startDate || 'all'}_${endDate || 'all'}`;
      
      // 检查缓存
      if (this.config.caching.enabled) {
        const cached = await this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // 检查速率限制
      await this.rateLimiter.waitForRateLimit();

      const params: any = {
        token: this.config.token,
        api_name: 'daily',
        fields: 'ts_code,trade_date,close,open,high,low,pre_close,change,pct_chg,vol,amount',
        ts_code: tsCode
      };

      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }

      const response = await this.makeRequest('daily', params);
      const data = response.data || [];

      // 缓存数据
      if (this.config.caching.enabled) {
        await this.setCachedData(cacheKey, data);
      }

      return data;

    } catch (error) {
      logger.error('SimpleTushareDataSource error:', error);
      throw new Error(`Failed to get daily data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取财务数据
   */
  public async getFinancialData(tsCode: string, startDate?: string, endDate?: string): Promise<FinancialData[]> {
    try {
      const cacheKey = `financial_${tsCode}_${startDate || 'all'}_${endDate || 'all'}`;
      
      // 检查缓存
      if (this.config.caching.enabled) {
        const cached = await this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // 检查速率限制
      await this.rateLimiter.waitForRateLimit();

      const params: any = {
        token: this.config.token,
        api_name: 'income',
        fields: 'ts_code,ann_date,f_ann_date,end_date,report_type,comp_type,basic_eps,diluted_eps,total_revenue,revenue,int_income,prem_earned,comm_income,n_commis_income,n_oth_income,n_oth_b_income,prem_income,out_prem,une_prem_reser,reins_income,n_sec_tb_income,n_sec_uw_income,n_asset_mg_income,oth_b_income,fv_value_chg_gain,invest_income,ass_invest_income,forex_gain,total_cogs,oper_cost,int_exp,comm_exp,biz_tax_surchg,sell_exp,admin_exp,fin_exp,assets_impair_loss,prem_refund,compens_payout,reser_insur_liab,div_payt,reins_exp,oper_exp,compens_payout_refu,insur_reser_refu,reins_cost_refund,other_bus_cost,operate_profit,non_oper_income,non_oper_exp,nca_disploss,total_profit,income_tax,n_income,n_income_attr_p,minority_gain,oth_compr_income,t_compr_income,compr_inc_attr_p,compr_inc_attr_m_s,ebit,ebitda,insurance_exp,undist_profit,distable_profit',
        ts_code: tsCode
      };

      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }

      const response = await this.makeRequest('income', params);
      const data = response.data || [];

      // 缓存数据
      if (this.config.caching.enabled) {
        await this.setCachedData(cacheKey, data);
      }

      return data;

    } catch (error) {
      logger.error('SimpleTushareDataSource error:', error);
      throw new Error(`Failed to get financial data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取实时行情数据
   */
  public async getRealtimeData(tsCodes: string[]): Promise<DailyData[]> {
    try {
      const cacheKey = `realtime_${tsCodes.join(',')}`;
      
      // 检查缓存
      if (this.config.caching.enabled) {
        const cached = await this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // 检查速率限制
      await this.rateLimiter.waitForRateLimit();

      const params = {
        token: this.config.token,
        api_name: 'realtime_quotes',
        fields: 'ts_code,close,open,high,low,pre_close,change,pct_chg,vol,amount',
        ts_codes: tsCodes.join(',')
      };

      const response = await this.makeRequest('realtime_quotes', params);
      const data = response.data || [];

      // 缓存数据（短期缓存）
      if (this.config.cache.enabled) {
        this.setCachedData(cacheKey, data, 30); // 30秒缓存
      }

      return data;

    } catch (error) {
      logger.error('SimpleTushareDataSource error:', error);
      throw new Error(`Failed to get realtime data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取新闻数据
   */
  public async getNewsData(startDate?: string, endDate?: string): Promise<NewsData[]> {
    try {
      const cacheKey = `news_${startDate || 'all'}_${endDate || 'all'}`;
      
      // 检查缓存
      if (this.config.caching.enabled) {
        const cached = await this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // 检查速率限制
      await this.rateLimiter.waitForRateLimit();

      const params: any = {
        token: this.config.token,
        api_name: 'news',
        fields: 'datetime,title,content,url'
      };

      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }

      const response = await this.makeRequest('news', params);
      const data = response.data || [];

      // 缓存数据
      if (this.config.caching.enabled) {
        await this.setCachedData(cacheKey, data);
      }

      return data;

    } catch (error) {
      logger.error('SimpleTushareDataSource error:', error);
      throw new Error(`Failed to get news data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取指数日线数据
   * 注意：此接口可能需要特殊权限，如果无法访问会返回空数据
   * 建议联系Tushare技术支持确认接口名称和权限要求
   */
  public async getIndexDailyData(tsCode: string, startDate?: string, endDate?: string): Promise<IndexDailyData[]> {
    try {
      const cacheKey = `index_daily_${tsCode}_${startDate || 'all'}_${endDate || 'all'}`;
      
      // 检查缓存
      if (this.config.caching.enabled) {
        const cached = await this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // 检查速率限制
      await this.rateLimiter.waitForRateLimit();

      const params: any = {
        token: this.config.token,
        api_name: 'index_daily',
        params: {
          ts_code: tsCode
        },
        fields: 'ts_code,trade_date,close,open,high,low,pre_close,change,pct_chg,vol,amount'
      };

      if (startDate) {
        params.params.start_date = startDate;
      }
      if (endDate) {
        params.params.end_date = endDate;
      }

      const response = await this.makeRequest('index_daily', params);
      const data = response.data || [];

      // 缓存数据
      if (this.config.caching.enabled) {
        await this.setCachedData(cacheKey, data);
      }

      return data;

    } catch (error) {
      // 如果是权限问题或接口不可用，返回空数据而不是抛出错误
      if (error instanceof Error && error.message.includes('查询数据失败')) {
        console.warn(`Index daily data not available for ${tsCode}. This may be due to insufficient permissions or interface changes. Please contact Tushare support.`);
        return [];
      }
      
      logger.error('SimpleTushareDataSource error:', error);
      throw new Error(`Failed to get index daily data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取每日市场整体指标
   */
  public async getDailyBasicData(tsCode: string, startDate?: string, endDate?: string): Promise<DailyBasicData[]> {
    try {
      const cacheKey = `daily_basic_${tsCode}_${startDate || 'all'}_${endDate || 'all'}`;
      
      // 检查缓存
      if (this.config.caching.enabled) {
        const cached = await this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // 检查速率限制
      await this.rateLimiter.waitForRateLimit();

      const params: any = {
        token: this.config.token,
        api_name: 'daily_basic',
        fields: 'ts_code,trade_date,close,turnover_rate,turnover_rate_f,volume_ratio,pe,pe_ttm,pb,ps,ps_ttm,dv_ratio,dv_ttm,total_share,float_share,free_share,total_mv,circ_mv',
        ts_code: tsCode
      };

      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }

      const response = await this.makeRequest('daily_basic', params);
      const data = response.data || [];

      // 缓存数据
      if (this.config.caching.enabled) {
        await this.setCachedData(cacheKey, data);
      }

      return data;

    } catch (error) {
      logger.error('SimpleTushareDataSource error:', error);
      throw new Error(`Failed to get daily basic data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取公司公告数据
   * 使用正确的接口名称 anns
   * 注意：此接口需要单独开权限（跟积分没关系）
   */
  public async getAnnouncementData(tsCode?: string, startDate?: string, endDate?: string): Promise<AnnouncementData[]> {
    try {
      const cacheKey = `anns_${tsCode || 'all'}_${startDate || 'all'}_${endDate || 'all'}`;
      
      // 检查缓存
      if (this.config.caching.enabled) {
        const cached = await this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // 检查速率限制
      await this.rateLimiter.waitForRateLimit();

      const params: any = {
        token: this.config.token,
        api_name: 'anns',
        params: {},
        fields: 'ts_code,ann_date,ann_type,title,content,pub_time,url'
      };

      if (tsCode) {
        params.params.ts_code = tsCode;
      }
      if (startDate) {
        params.params.start_date = startDate;
      }
      if (endDate) {
        params.params.end_date = endDate;
      }

      const response = await this.makeRequest('anns', params);
      const data = response.data || [];

      // 缓存数据
      if (this.config.caching.enabled) {
        await this.setCachedData(cacheKey, data);
      }

      return data;

    } catch (error) {
      // 如果是权限问题，返回空数据
      if (error instanceof Error && error.message.includes('权限')) {
        console.warn('Announcement API requires special permission. Please contact Tushare support.');
        return [];
      }
      
      logger.error('SimpleTushareDataSource error:', error);
      throw new Error(`Failed to get announcement data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取龙虎榜数据
   * 注意：此接口可能需要特殊权限，如果无法访问会返回空数据
   * 建议联系Tushare技术支持确认接口名称和权限要求
   */
  public async getTopListData(tradeDate?: string): Promise<TopListData[]> {
    try {
      const cacheKey = `top_list_${tradeDate || 'all'}`;
      
      // 检查缓存
      if (this.config.caching.enabled) {
        const cached = await this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // 检查速率限制
      await this.rateLimiter.waitForRateLimit();

      const params: any = {
        token: this.config.token,
        api_name: 'top_list',
        params: {
          trade_date: tradeDate || this.getCurrentTradeDate()
        },
        fields: 'trade_date,ts_code,name,close,pct_chg,turnover_rate,amount,l_sell,l_buy,l_amount,net_amount,net_rate,amount_rate,float_values,reason'
      };

      const response = await this.makeRequest('top_list', params);
      const data = response.data || [];

      // 缓存数据
      if (this.config.caching.enabled) {
        await this.setCachedData(cacheKey, data);
      }

      return data;

    } catch (error) {
      // 如果是权限问题或接口不可用，返回空数据而不是抛出错误
      if (error instanceof Error && error.message.includes('查询数据失败')) {
        console.warn(`Top list data not available for ${tradeDate || 'current date'}. This may be due to insufficient permissions or interface changes. Please contact Tushare support.`);
        return [];
      }
      
      logger.error('SimpleTushareDataSource error:', error);
      throw new Error(`Failed to get top list data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取东方财富人气榜
   */
  public async getDcHotData(tradeDate?: string, hotType?: string): Promise<DcHotData[]> {
    try {
      const cacheKey = `dc_hot_${tradeDate || 'all'}_${hotType || 'all'}`;
      
      // 检查缓存
      if (this.config.caching.enabled) {
        const cached = await this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // 检查速率限制
      await this.rateLimiter.waitForRateLimit();

      const params: any = {
        token: this.config.token,
        api_name: 'dc_hot',
        fields: 'trade_date,ts_code,name,close,pct_chg,amount,turnover_rate,pe,pb,market_cap,circ_mv,hot_rank,hot_score'
      };

      if (tradeDate) {
        params.trade_date = tradeDate;
      }
      if (hotType) {
        params.hot_type = hotType;
      }

      const response = await this.makeRequest('dc_hot', params);
      const data = response.data || [];

      // 缓存数据
      if (this.config.caching.enabled) {
        await this.setCachedData(cacheKey, data);
      }

      return data;

    } catch (error) {
      logger.error('SimpleTushareDataSource error:', error);
      throw new Error(`Failed to get dc hot data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取同花顺热股榜
   */
  public async getThsHotData(tradeDate?: string, market?: string): Promise<ThsHotData[]> {
    try {
      const cacheKey = `ths_hot_${tradeDate || 'all'}_${market || 'all'}`;
      
      // 检查缓存
      if (this.config.caching.enabled) {
        const cached = await this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // 检查速率限制
      await this.rateLimiter.waitForRateLimit();

      const params: any = {
        token: this.config.token,
        api_name: 'ths_hot',
        fields: 'trade_date,ts_code,name,close,pct_chg,amount,turnover_rate,pe,pb,market_cap,circ_mv,hot_rank,hot_score'
      };

      if (tradeDate) {
        params.trade_date = tradeDate;
      }
      if (market) {
        params.market = market;
      }

      const response = await this.makeRequest('ths_hot', params);
      const data = response.data || [];

      // 缓存数据
      if (this.config.caching.enabled) {
        await this.setCachedData(cacheKey, data);
      }

      return data;

    } catch (error) {
      logger.error('SimpleTushareDataSource error:', error);
      throw new Error(`Failed to get ths hot data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取涨跌停数据
   */
  public async getLimitListData(tradeDate?: string): Promise<LimitListData[]> {
    try {
      const cacheKey = `limit_list_d_${tradeDate || 'all'}`;
      
      // 检查缓存
      if (this.config.caching.enabled) {
        const cached = await this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // 检查速率限制
      await this.rateLimiter.waitForRateLimit();

      const params: any = {
        token: this.config.token,
        api_name: 'limit_list_d',
        fields: 'trade_date,ts_code,name,close,pct_chg,amount,limit_amount,float_mv,total_mv,turnover_rate,fd_amount,first_time,last_time,open_times,strth,limit,up_stat'
      };

      if (tradeDate) {
        params.trade_date = tradeDate;
      }

      const response = await this.makeRequest('limit_list_d', params);
      const data = response.data || [];

      // 缓存数据
      if (this.config.caching.enabled) {
        await this.setCachedData(cacheKey, data);
      }

      return data;

    } catch (error) {
      logger.error('SimpleTushareDataSource error:', error);
      throw new Error(`Failed to get limit list data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取交易日历
   */
  public async getTradeCalData(startDate?: string, endDate?: string): Promise<TradeCalData[]> {
    try {
      const cacheKey = `trade_cal_${startDate || 'all'}_${endDate || 'all'}`;
      
      // 检查缓存
      if (this.config.caching.enabled) {
        const cached = await this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // 检查速率限制
      await this.rateLimiter.waitForRateLimit();

      const params: any = {
        token: this.config.token,
        api_name: 'trade_cal',
        fields: 'cal_date,is_open,pretrade_date'
      };

      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }

      const response = await this.makeRequest('trade_cal', params);
      const data = response.data || [];

      // 缓存数据
      if (this.config.caching.enabled) {
        await this.setCachedData(cacheKey, data);
      }

      return data;

    } catch (error) {
      logger.error('SimpleTushareDataSource error:', error);
      throw new Error(`Failed to get trade cal data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取同花顺概念板块成分
   */
  public async getThsMemberData(tsCode?: string): Promise<ThsMemberData[]> {
    try {
      const cacheKey = `ths_member_${tsCode || 'all'}`;
      
      // 检查缓存
      if (this.config.caching.enabled) {
        const cached = await this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // 检查速率限制
      await this.rateLimiter.waitForRateLimit();

      const params: any = {
        token: this.config.token,
        api_name: 'ths_member',
        fields: 'ts_code,code,name,weight,in_date,out_date,is_new'
      };

      if (tsCode) {
        params.ts_code = tsCode;
      }

      const response = await this.makeRequest('ths_member', params);
      const data = response.data || [];

      // 缓存数据
      if (this.config.caching.enabled) {
        await this.setCachedData(cacheKey, data);
      }

      return data;

    } catch (error) {
      logger.error('SimpleTushareDataSource error:', error);
      throw new Error(`Failed to get ths member data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取东方财富概念板块成分
   */
  public async getDcMemberData(tsCode?: string): Promise<DcMemberData[]> {
    try {
      const cacheKey = `dc_member_${tsCode || 'all'}`;
      
      // 检查缓存
      if (this.config.caching.enabled) {
        const cached = await this.getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // 检查速率限制
      await this.rateLimiter.waitForRateLimit();

      const params: any = {
        token: this.config.token,
        api_name: 'dc_member',
        fields: 'ts_code,code,name,weight,in_date,out_date,is_new'
      };

      if (tsCode) {
        params.ts_code = tsCode;
      }

      const response = await this.makeRequest('dc_member', params);
      const data = response.data || [];

      // 缓存数据
      if (this.config.caching.enabled) {
        await this.setCachedData(cacheKey, data);
      }

      return data;

    } catch (error) {
      logger.error('SimpleTushareDataSource error:', error);
      throw new Error(`Failed to get dc member data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 发送API请求
   */
  private async makeRequest(apiName: string, params: any): Promise<any> {
    const axios = require('axios');
    
    try {
      const response = await axios.post(this.config.baseUrl, params, {
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.code !== 0) {
        throw new Error(`Tushare API error: ${response.data.msg}`);
      }

      return response.data;

    } catch (error: any) {
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
   * 获取缓存统计
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * 获取配置信息
   */
  public getConfig(): TushareConfig {
    return { ...this.config };
  }

  /**
   * 获取当前交易日（辅助方法）
   */
  private getCurrentTradeDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }
}

/**
 * 速率限制器
 */
class RateLimiter {
  private config: TushareConfig['rateLimit'];
  private requests: number[] = [];

  constructor(config: TushareConfig['rateLimit']) {
    this.config = config;
  }

  /**
   * 等待速率限制
   */
  public async waitForRateLimit(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // 清理一分钟前的请求记录
    this.requests = this.requests.filter(time => time > oneMinuteAgo);

    // 如果请求数超过限制，等待
    if (this.requests.length >= this.config.requestsPerMinute) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = 60000 - (now - oldestRequest);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // 记录当前请求
    this.requests.push(now);
  }

  /**
   * 实现BaseFetcher抽象方法
   */
  protected async onStart(): Promise<void> {
    logger.info('SimpleTushareDataSource started');
  }

  protected async onStop(): Promise<void> {
    logger.info('SimpleTushareDataSource stopped');
  }
}

// 导出默认配置
export const defaultTushareConfig: TushareConfig = {
  enabled: true,
  token: process.env.TUSHARE_TOKEN || '',
  baseUrl: 'http://api.tushare.pro',
  timeout: 30000,
  retries: 3,
  retryCount: 3,
  retryDelay: 1000,
  rateLimit: {
    enabled: true,
    requestsPerMinute: 200
  },
  cache: {
    enabled: true,
    ttl: 300 // 5分钟缓存
  },
  caching: {
    enabled: true,
    defaultTTL: 300, // 5分钟缓存
    maxSize: 1000
  },
  updateInterval: 5, // 5分钟更新间隔
  dataSources: {
    tushare: {
      enabled: true,
      timeout: 30000
    }
  },
  monitoring: {
    enabled: true,
    logLevel: 'info',
    metricsCollection: true
  }
};

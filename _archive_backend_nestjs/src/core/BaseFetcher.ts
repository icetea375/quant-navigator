/**
 * BaseFetcher - 基础数据获取器
 * 消除所有Fetcher中的重复代码，提供统一的数据获取模式
 */

import { DatabaseConnection } from '../database/connection';
import { Redis } from 'ioredis';
import { BaseService, BaseServiceConfig } from './BaseService';
import { logger } from '../utils/logger';

export interface BaseFetcherConfig extends BaseServiceConfig {
  updateInterval: number; // 分钟
  caching: {
    enabled: boolean;
    defaultTTL: number;
    maxSize: number;
  };
  dataSources: {
    [key: string]: {
      enabled: boolean;
      timeout: number;
    };
  };
}

export interface FetcherStats extends BaseServiceStats {
  dataVolume: { [key: string]: number };
  cacheHitRate: number;
  lastDataUpdate: string;
}

export abstract class BaseFetcher extends BaseService {
  protected fetcherStats: FetcherStats = {
    ...this.stats,
    dataVolume: {},
    cacheHitRate: 0,
    lastDataUpdate: new Date().toISOString()
  };

  constructor(
    db: DatabaseConnection,
    redis: Redis,
    config: BaseFetcherConfig
  ) {
    super(db, redis, config);
  }

  /**
   * 通用数据获取方法 - 减少重复代码
   */
  protected async fetchData<T>(
    dataType: string,
    methods: Array<() => Promise<T[]>>,
    dataVolumeKey: string
  ): Promise<T[]> {
    return await this.executeTask(`fetch_${dataType}`, async () => {
      const results = await Promise.all(methods.map(method => method()));
      const totalCount = results.reduce((sum, data) => sum + (data?.length || 0), 0);
      
      this.fetcherStats.dataVolume[dataVolumeKey] = totalCount;
      this.fetcherStats.lastDataUpdate = new Date().toISOString();
      
      logger.debug(`Fetched ${totalCount} ${dataType} records`);
      return results.flat();
    });
  }

  /**
   * 通用缓存方法
   */
  protected async getCachedData<T>(cacheKey: string): Promise<T | null> {
    if (!this.config.caching?.enabled) {
      return null;
    }

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.fetcherStats.cacheHitRate = 
          (this.fetcherStats.cacheHitRate * (this.fetcherStats.totalRequests - 1) + 1) / 
          this.fetcherStats.totalRequests;
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      logger.warn(`Failed to get cached data for key ${cacheKey}:`, error);
      return null;
    }
  }

  /**
   * 通用缓存存储方法
   */
  protected async setCachedData<T>(cacheKey: string, data: T, ttl?: number): Promise<void> {
    if (!this.config.caching?.enabled) {
      return;
    }

    try {
      const cacheTTL = ttl || this.config.caching.defaultTTL;
      await this.redis.setex(cacheKey, cacheTTL, JSON.stringify(data));
    } catch (error) {
      logger.warn(`Failed to cache data for key ${cacheKey}:`, error);
    }
  }

  /**
   * 生成缓存键
   */
  protected generateCacheKey(prefix: string, params: any): string {
    const hash = require('crypto').createHash('md5');
    hash.update(JSON.stringify(params));
    return `${prefix}:${hash.digest('hex')}`;
  }

  /**
   * 获取Fetcher状态
   */
  getFetcherStatus(): any {
    return {
      ...this.getStatus(),
      fetcherStats: this.fetcherStats
    };
  }

  /**
   * 抽象方法 - 子类必须实现
   */
  protected abstract onStart(): Promise<void>;
  protected abstract onStop(): Promise<void>;
}

export default BaseFetcher;

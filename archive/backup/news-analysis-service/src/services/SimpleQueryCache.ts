/**
 * 查询缓存管理器
 * 提供多级查询缓存和缓存优化功能
 *
 * 作者: AI Assistant
 * 创建时间: 2025-01-17
 * 版本: 1.0
 */

import { DatabaseConnection } from '../database/connection';
import { BaseErrorHandler } from '../utils/BaseErrorHandler';
import { SimpleMonitor } from './SimpleMonitor';

// 类型定义
interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  tags: string[];
}

interface CacheConfig {
  maxSize: number; // 最大缓存大小（字节）
  defaultTtl: number; // 默认TTL（毫秒）
  maxEntries: number; // 最大条目数
  cleanupInterval: number; // 清理间隔（毫秒）
  enableL1Cache: boolean; // 启用L1缓存
  enableL2Cache: boolean; // 启用L2缓存
  l1Size: number; // L1缓存大小
  l2Size: number; // L2缓存大小
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalSize: number;
  entryCount: number;
  l1Hits: number;
  l2Hits: number;
  evictions: number;
  lastCleanup: Date;
}

interface QueryCacheKey {
  query: string;
  params: any[];
  table: string;
  operation: string;
}

export class SimpleQueryCache {
  private db: DatabaseConnection;
  private monitor: SimpleMonitor;
  private config: CacheConfig;

  // L1缓存（内存）
  private l1Cache: Map<string, CacheEntry> = new Map();

  // L2缓存（Redis或数据库）
  private l2Cache: Map<string, CacheEntry> = new Map();

  // 缓存统计
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalSize: 0,
    entryCount: 0,
    l1Hits: 0,
    l2Hits: 0,
    evictions: 0,
    lastCleanup: new Date()
  };

  // 清理定时器
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(db: DatabaseConnection, monitor: SimpleMonitor, config: Partial<CacheConfig> = {}) {
    this.db = db;
    this.monitor = monitor;

    // 默认配置
    this.config = {
      maxSize: 100 * 1024 * 1024, // 100MB
      defaultTtl: 5 * 60 * 1000, // 5分钟
      maxEntries: 10000,
      cleanupInterval: 60 * 1000, // 1分钟
      enableL1Cache: true,
      enableL2Cache: true,
      l1Size: 10 * 1024 * 1024, // 10MB
      l2Size: 90 * 1024 * 1024, // 90MB
      ...config
    };

    this.startCleanupTimer();
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(queryKey: QueryCacheKey): string {
    const { query, params, table, operation } = queryKey;
    const paramsStr = JSON.stringify(params || []);
    return `${operation}:${table}:${Buffer.from(query + paramsStr).toString('base64')}`;
  }

  /**
   * 计算数据大小
   */
  private calculateSize(data: any): number {
    try {
      return Buffer.byteLength(JSON.stringify(data), 'utf8');
    } catch (error) {
      return 1024; // 默认1KB
    }
  }

  /**
   * 获取缓存数据
   */
  async get(queryKey: QueryCacheKey): Promise<any | null> {
    try {
      const cacheKey = this.generateCacheKey(queryKey);

      // 先检查L1缓存
      if (this.config.enableL1Cache) {
        const l1Entry = this.l1Cache.get(cacheKey);
        if (l1Entry && this.isValidEntry(l1Entry)) {
          this.updateAccessStats(l1Entry);
          this.stats.l1Hits++;
          this.stats.hits++;
          this.updateHitRate();

          this.monitor.recordMetric('cache_l1_hit', 1, { table: queryKey.table });
          return l1Entry.data;
        }
      }

      // 检查L2缓存
      if (this.config.enableL2Cache) {
        const l2Entry = this.l2Cache.get(cacheKey);
        if (l2Entry && this.isValidEntry(l2Entry)) {
          this.updateAccessStats(l2Entry);
          this.stats.l2Hits++;
          this.stats.hits++;
          this.updateHitRate();

          // 将L2数据提升到L1
          if (this.config.enableL1Cache && l2Entry.size <= this.config.l1Size) {
            this.setL1Cache(cacheKey, l2Entry);
          }

          this.monitor.recordMetric('cache_l2_hit', 1, { table: queryKey.table });
          return l2Entry.data;
        }
      }

      // 缓存未命中
      this.stats.misses++;
      this.updateHitRate();

      this.monitor.recordMetric('cache_miss', 1, { table: queryKey.table });
      return null;

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleQueryCache.get');
      this.monitor.recordMetric('cache_error', 1);
      return null;
    }
  }

  /**
   * 设置缓存数据
   */
  async set(queryKey: QueryCacheKey, data: any, ttl?: number, tags: string[] = []): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(queryKey);
      const size = this.calculateSize(data);
      const entryTtl = ttl || this.config.defaultTtl;

      const entry: CacheEntry = {
        key: cacheKey,
        data: data,
        timestamp: Date.now(),
        ttl: entryTtl,
        accessCount: 0,
        lastAccessed: Date.now(),
        size: size,
        tags: tags
      };

      // 检查是否应该缓存
      if (!this.shouldCache(entry)) {
        return;
      }

      // 清理空间
      await this.makeSpace(entry);

      // 设置到L1缓存
      if (this.config.enableL1Cache && size <= this.config.l1Size) {
        this.setL1Cache(cacheKey, entry);
      }

      // 设置到L2缓存
      if (this.config.enableL2Cache) {
        this.setL2Cache(cacheKey, entry);
      }

      this.stats.entryCount++;
      this.stats.totalSize += size;

      this.monitor.recordMetric('cache_set', 1, {
        table: queryKey.table,
        size: size.toString()
      });

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleQueryCache.set');
      this.monitor.recordMetric('cache_error', 1);
    }
  }

  /**
   * 删除缓存
   */
  async delete(queryKey: QueryCacheKey): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(queryKey);

      // 从L1缓存删除
      if (this.l1Cache.has(cacheKey)) {
        const entry = this.l1Cache.get(cacheKey);
        if (entry) {
          this.stats.totalSize -= entry.size;
          this.stats.entryCount--;
        }
        this.l1Cache.delete(cacheKey);
      }

      // 从L2缓存删除
      if (this.l2Cache.has(cacheKey)) {
        const entry = this.l2Cache.get(cacheKey);
        if (entry) {
          this.stats.totalSize -= entry.size;
          this.stats.entryCount--;
        }
        this.l2Cache.delete(cacheKey);
      }

      this.monitor.recordMetric('cache_delete', 1, { table: queryKey.table });

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleQueryCache.delete');
      this.monitor.recordMetric('cache_error', 1);
    }
  }

  /**
   * 按标签删除缓存
   */
  async deleteByTags(tags: string[]): Promise<number> {
    let deletedCount = 0;

    try {
      // 删除L1缓存中的匹配条目
      for (const [key, entry] of this.l1Cache.entries()) {
        if (tags.some(tag => entry.tags.includes(tag))) {
          this.l1Cache.delete(key);
          this.stats.totalSize -= entry.size;
          this.stats.entryCount--;
          deletedCount++;
        }
      }

      // 删除L2缓存中的匹配条目
      for (const [key, entry] of this.l2Cache.entries()) {
        if (tags.some(tag => entry.tags.includes(tag))) {
          this.l2Cache.delete(key);
          this.stats.totalSize -= entry.size;
          this.stats.entryCount--;
          deletedCount++;
        }
      }

      this.monitor.recordMetric('cache_delete_by_tags', deletedCount, { tags: tags.join(',') });

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleQueryCache.deleteByTags');
      this.monitor.recordMetric('cache_error', 1);
    }

    return deletedCount;
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    try {
      this.l1Cache.clear();
      this.l2Cache.clear();

      this.stats = {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalSize: 0,
        entryCount: 0,
        l1Hits: 0,
        l2Hits: 0,
        evictions: 0,
        lastCleanup: new Date()
      };

      this.monitor.recordMetric('cache_clear', 1);

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleQueryCache.clear');
      this.monitor.recordMetric('cache_error', 1);
    }
  }

  /**
   * 预热缓存
   */
  async warmup(queries: Array<{ queryKey: QueryCacheKey; data: any; ttl?: number }>): Promise<void> {
    try {
      console.log(`开始预热缓存，共 ${queries.length} 个查询...`);

      for (const { queryKey, data, ttl } of queries) {
        await this.set(queryKey, data, ttl, ['warmup']);
      }

      console.log('缓存预热完成');
      this.monitor.recordMetric('cache_warmup', queries.length);

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleQueryCache.warmup');
      this.monitor.recordMetric('cache_error', 1);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * 获取缓存配置
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * 更新缓存配置
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // 如果清理间隔改变，重新设置定时器
    if (newConfig.cleanupInterval) {
      this.stopCleanupTimer();
      this.startCleanupTimer();
    }
  }

  /**
   * 检查条目是否有效
   */
  private isValidEntry(entry: CacheEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) < entry.ttl;
  }

  /**
   * 更新访问统计
   */
  private updateAccessStats(entry: CacheEntry): void {
    entry.accessCount++;
    entry.lastAccessed = Date.now();
  }

  /**
   * 更新命中率
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * 检查是否应该缓存
   */
  private shouldCache(entry: CacheEntry): boolean {
    // 检查大小限制
    if (entry.size > this.config.maxSize) {
      return false;
    }

    // 检查条目数限制
    if (this.stats.entryCount >= this.config.maxEntries) {
      return false;
    }

    return true;
  }

  /**
   * 清理空间
   */
  private async makeSpace(newEntry: CacheEntry): Promise<void> {
    // 检查是否需要清理空间
    if (this.stats.totalSize + newEntry.size <= this.config.maxSize) {
      return;
    }

    // 清理过期条目
    await this.cleanupExpired();

    // 如果仍然需要空间，使用LRU策略
    if (this.stats.totalSize + newEntry.size > this.config.maxSize) {
      await this.evictLRU(newEntry.size);
    }
  }

  /**
   * 设置L1缓存
   */
  private setL1Cache(key: string, entry: CacheEntry): void {
    // 检查L1缓存大小
    if (this.getL1CacheSize() + entry.size > this.config.l1Size) {
      this.evictL1LRU(entry.size);
    }

    this.l1Cache.set(key, entry);
  }

  /**
   * 设置L2缓存
   */
  private setL2Cache(key: string, entry: CacheEntry): void {
    // 检查L2缓存大小
    if (this.getL2CacheSize() + entry.size > this.config.l2Size) {
      this.evictL2LRU(entry.size);
    }

    this.l2Cache.set(key, entry);
  }

  /**
   * 获取L1缓存大小
   */
  private getL1CacheSize(): number {
    let size = 0;
    for (const entry of this.l1Cache.values()) {
      size += entry.size;
    }
    return size;
  }

  /**
   * 获取L2缓存大小
   */
  private getL2CacheSize(): number {
    let size = 0;
    for (const entry of this.l2Cache.values()) {
      size += entry.size;
    }
    return size;
  }

  /**
   * 清理过期条目
   */
  private async cleanupExpired(): Promise<void> {
    const now = Date.now();

    // 清理L1缓存
    for (const [key, entry] of this.l1Cache.entries()) {
      if (!this.isValidEntry(entry)) {
        this.l1Cache.delete(key);
        this.stats.totalSize -= entry.size;
        this.stats.entryCount--;
      }
    }

    // 清理L2缓存
    for (const [key, entry] of this.l2Cache.entries()) {
      if (!this.isValidEntry(entry)) {
        this.l2Cache.delete(key);
        this.stats.totalSize -= entry.size;
        this.stats.entryCount--;
      }
    }
  }

  /**
   * 使用LRU策略清理空间
   */
  private async evictLRU(requiredSize: number): Promise<void> {
    // 合并L1和L2缓存，按最后访问时间排序
    const allEntries = [
      ...Array.from(this.l1Cache.entries()).map(([key, entry]) => ({ key, entry, level: 'l1' })),
      ...Array.from(this.l2Cache.entries()).map(([key, entry]) => ({ key, entry, level: 'l2' }))
    ];

    allEntries.sort((a, b) => a.entry.lastAccessed - b.entry.lastAccessed);

    let freedSize = 0;
    for (const { key, entry, level } of allEntries) {
      if (freedSize >= requiredSize) break;

      if (level === 'l1') {
        this.l1Cache.delete(key);
      } else {
        this.l2Cache.delete(key);
      }

      freedSize += entry.size;
      this.stats.totalSize -= entry.size;
      this.stats.entryCount--;
      this.stats.evictions++;
    }
  }

  /**
   * 清理L1缓存LRU
   */
  private evictL1LRU(requiredSize: number): void {
    const entries = Array.from(this.l1Cache.entries())
      .map(([key, entry]) => ({ key, entry }))
      .sort((a, b) => a.entry.lastAccessed - b.entry.lastAccessed);

    let freedSize = 0;
    for (const { key, entry } of entries) {
      if (freedSize >= requiredSize) break;

      this.l1Cache.delete(key);
      freedSize += entry.size;
    }
  }

  /**
   * 清理L2缓存LRU
   */
  private evictL2LRU(requiredSize: number): void {
    const entries = Array.from(this.l2Cache.entries())
      .map(([key, entry]) => ({ key, entry }))
      .sort((a, b) => a.entry.lastAccessed - b.entry.lastAccessed);

    let freedSize = 0;
    for (const { key, entry } of entries) {
      if (freedSize >= requiredSize) break;

      this.l2Cache.delete(key);
      freedSize += entry.size;
    }
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
      this.stats.lastCleanup = new Date();
    }, this.config.cleanupInterval);
  }

  /**
   * 停止清理定时器
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * 销毁缓存管理器
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.clear();
  }
}

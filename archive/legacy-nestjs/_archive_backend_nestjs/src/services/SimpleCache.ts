/**
 * 简化缓存管理器
 * 遵循智能分析系统开发实施指南的命名规范
 */

import { Redis } from 'ioredis';
import { BaseErrorHandler } from '../utils/BaseErrorHandler';
import { BaseConfigValidator } from '../utils/BaseConfigValidator';

export interface CacheItem {
  data: any;
  expiry: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number;
  memoryItems: number;
  memoryUsage: number;
  redisItems: number;
  totalSize: number;
  evictions: number;
}

export interface CacheOptions {
  maxMemorySize?: number;
  maxMemoryItems?: number;
  defaultTtl?: number;
  enableCompression?: boolean;
  enableStatistics?: boolean;
  consistencyMode?: 'eventual' | 'strong';
  preloadKeys?: string[];
}

export interface CacheConsistencyRule {
  keyPattern: string;
  invalidationStrategy: 'immediate' | 'lazy' | 'time_based';
  dependencies: string[];
  ttl: number;
}

export class SimpleCache {
  private memoryCache: Map<string, CacheItem> = new Map();
  private redis: Redis;
  private stats: CacheStats;
  private maxMemorySize: number;
  private maxMemoryItems: number;
  private defaultTtl: number;
  private enableCompression: boolean;
  private enableStatistics: boolean;
  private consistencyMode: 'eventual' | 'strong';
  private consistencyRules: Map<string, CacheConsistencyRule> = new Map();
  private preloadKeys: string[];
  private isPreloading: boolean = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private metrics: Map<string, any> = new Map();

  constructor(redis: Redis, options: CacheOptions = {}) {
    this.redis = redis;
    this.maxMemorySize = options.maxMemorySize || 100 * 1024 * 1024; // 100MB
    this.maxMemoryItems = options.maxMemoryItems || 1000;
    this.defaultTtl = options.defaultTtl || 3600;
    this.enableCompression = options.enableCompression || false;
    this.enableStatistics = options.enableStatistics || true;
    this.consistencyMode = options.consistencyMode || 'eventual';
    this.preloadKeys = options.preloadKeys || [];

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      hitRate: 0,
      memoryItems: 0,
      memoryUsage: 0,
      redisItems: 0,
      totalSize: 0,
      evictions: 0
    };

    this.validateConfig(options);
    this.initializeConsistencyRules();
    this.startHealthChecks();

    // 异步预加载
    if (this.preloadKeys.length > 0) {
      this.preloadCache().catch(error => {
        console.error('Cache preload failed:', error);
      });
    }
  }

  /**
   * 获取缓存
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isValidKey(key)) {
        throw new Error('Invalid cache key');
      }

      // 1. 先查内存缓存
      const memoryItem = this.memoryCache.get(key);
      if (memoryItem && !this.isExpired(memoryItem)) {
        this.updateAccessStats(memoryItem);
        this.stats.hits++;
        this.updateHitRate();
        return memoryItem.data as T;
      }

      // 2. 查Redis缓存
      const redisData = await this.redis.get(key);
      if (redisData) {
        const data = this.deserialize(redisData);
        this.setMemoryCache(key, {
          data,
          expiry: Date.now() + this.defaultTtl * 1000,
          createdAt: Date.now(),
          accessCount: 1,
          lastAccessed: Date.now()
        });
        this.stats.hits++;
        this.updateHitRate();
        return data as T;
      }

      this.stats.misses++;
      this.updateHitRate();
      return null;

    } catch (error) {
      this.stats.errors++;
      BaseErrorHandler.handle(error, 'SimpleCache');

      if (error instanceof Error) {
        if (error instanceof Error ? error.message : String(error).includes('timeout')) {
          return null;
        } else if (error instanceof Error ? error.message : String(error).includes('connection')) {
          throw error;
        }
      }
      return null;
    }
  }

  /**
   * 设置缓存
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      if (!this.isValidKey(key)) {
        throw new Error('Invalid cache key');
      }

      const actualTtl = ttl || this.defaultTtl;
      const cacheItem: CacheItem = {
        data: value,
        expiry: Date.now() + actualTtl * 1000,
        createdAt: Date.now(),
        accessCount: 0,
        lastAccessed: Date.now()
      };

      // 1. 设置内存缓存
      this.setMemoryCache(key, cacheItem);

      // 2. 设置Redis缓存
      const serializedValue = this.serialize(value);
      await this.redis.setex(key, actualTtl, serializedValue);

      this.stats.sets++;
      this.updateStats();

      // 3. 处理一致性规则
      await this.handleConsistency(key, value);

    } catch (error) {
      this.stats.errors++;
      BaseErrorHandler.handle(error, 'SimpleCache');
    }
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<boolean> {
    try {
      if (!this.isValidKey(key)) {
        throw new Error('Invalid cache key');
      }

      // 1. 删除内存缓存
      const memoryDeleted = this.memoryCache.delete(key);

      // 2. 删除Redis缓存
      const redisDeleted = await this.redis.del(key);

      this.stats.deletes++;
      this.updateStats();

      return memoryDeleted || redisDeleted > 0;

    } catch (error) {
      this.stats.errors++;
      BaseErrorHandler.handle(error, 'SimpleCache');
      return false;
    }
  }

  /**
   * 批量获取
   */
  async mget<T>(keys: string[]): Promise<Map<string, T>> {
    const result = new Map<string, T>();

    for (const key of keys) {
      const value = await this.get<T>(key);
      if (value !== null) {
        result.set(key, value);
      }
    }

    return result;
  }

  /**
   * 批量设置
   */
  async mset<T>(items: Map<string, T>, ttl?: number): Promise<void> {
    const pipeline = this.redis.pipeline();
    const actualTtl = ttl || this.defaultTtl;

    for (const [key, value] of items) {
      if (!this.isValidKey(key)) continue;

      const cacheItem: CacheItem = {
        data: value,
        expiry: Date.now() + actualTtl * 1000,
        createdAt: Date.now(),
        accessCount: 0,
        lastAccessed: Date.now()
      };

      this.setMemoryCache(key, cacheItem);
      pipeline.setex(key, actualTtl, this.serialize(value));
    }

    await pipeline.exec();
    this.stats.sets += items.size;
    this.updateStats();
  }

  /**
   * 清空缓存
   */
  async clear(): Promise<void> {
    try {
      this.memoryCache.clear();
      await this.redis.flushdb();
      this.updateStats();
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleCache');
    }
  }

  /**
   * 预热缓存
   */
  async preloadCache(): Promise<void> {
    if (this.isPreloading) return;

    this.isPreloading = true;
    console.log('🔄 开始缓存预热...');

    try {
      for (const key of this.preloadKeys) {
        try {
          await this.get(key);
        } catch (error) {
          console.warn(`预热缓存失败: ${key}`, error);
        }
      }
      console.log('✅ 缓存预热完成');
    } catch (error) {
      console.error('❌ 缓存预热失败:', error);
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * 设置内存缓存
   */
  private setMemoryCache(key: string, item: CacheItem): void {
    // 检查内存限制
    if (this.memoryCache.size >= this.maxMemoryItems) {
      this.evictLRU();
    }

    this.memoryCache.set(key, item);
    this.updateStats();
  }

  /**
   * LRU淘汰策略
   */
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.memoryCache) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * 检查是否过期
   */
  private isExpired(item: CacheItem): boolean {
    return Date.now() > item.expiry;
  }

  /**
   * 更新访问统计
   */
  private updateAccessStats(item: CacheItem): void {
    item.accessCount++;
    item.lastAccessed = Date.now();
  }

  /**
   * 更新命中率
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    this.stats.memoryItems = this.memoryCache.size;
    this.stats.memoryUsage = this.getMemoryUsage();
    this.stats.totalSize = this.calculateTotalSize();
  }

  /**
   * 计算内存使用量
   */
  private getMemoryUsage(): number {
    let totalSize = 0;
    for (const [key, item] of this.memoryCache) {
      totalSize += key.length * 2; // 字符串长度 * 2字节
      totalSize += JSON.stringify(item.data).length * 2;
    }
    return totalSize;
  }

  /**
   * 计算总大小
   */
  private calculateTotalSize(): number {
    return this.getMemoryUsage() + (this.stats.redisItems * 1024); // 估算Redis大小
  }

  /**
   * 序列化数据
   */
  private serialize(data: any): string {
    if (this.enableCompression) {
      // 这里可以添加压缩逻辑
      return JSON.stringify(data);
    }
    return JSON.stringify(data);
  }

  /**
   * 反序列化数据
   */
  private deserialize(data: string): any {
    if (this.enableCompression) {
      // 这里可以添加解压缩逻辑
      return JSON.parse(data);
    }
    return JSON.parse(data);
  }

  /**
   * 验证键名
   */
  private isValidKey(key: string): boolean {
    return typeof key === 'string' && key.length > 0 && key.length <= 250;
  }

  /**
   * 验证配置
   */
  private validateConfig(options: CacheOptions): void {
    if (options.maxMemorySize && options.maxMemorySize <= 0) {
      throw new Error('maxMemorySize must be positive');
    }
    if (options.maxMemoryItems && options.maxMemoryItems <= 0) {
      throw new Error('maxMemoryItems must be positive');
    }
    if (options.defaultTtl && options.defaultTtl <= 0) {
      throw new Error('defaultTtl must be positive');
    }
  }

  /**
   * 初始化一致性规则
   */
  private initializeConsistencyRules(): void {
    const defaultRules: CacheConsistencyRule[] = [
      {
        keyPattern: 'user:*',
        invalidationStrategy: 'immediate',
        dependencies: ['user:profile:*'],
        ttl: 1800
      },
      {
        keyPattern: 'news:*',
        invalidationStrategy: 'time_based',
        dependencies: [],
        ttl: 3600
      }
    ];

    for (const rule of defaultRules) {
      this.consistencyRules.set(rule.keyPattern, rule);
    }
  }

  /**
   * 处理一致性
   */
  private async handleConsistency(key: string, value: any): Promise<void> {
    if (this.consistencyMode === 'eventual') return;

    for (const [pattern, rule] of this.consistencyRules) {
      if (this.matchesPattern(key, pattern)) {
        await this.invalidateDependencies(rule.dependencies);
        break;
      }
    }
  }

  /**
   * 匹配模式
   */
  private matchesPattern(key: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(key);
  }

  /**
   * 失效依赖项
   */
  private async invalidateDependencies(dependencies: string[]): Promise<void> {
    for (const dep of dependencies) {
      if (dep.includes('*')) {
        // 处理通配符模式
        const keys = await this.redis.keys(dep);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        await this.delete(dep);
      }
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): CacheStats {
    this.updateHitRate();
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * 获取缓存键列表
   */
  async getKeys(pattern: string = '*'): Promise<string[]> {
    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleCache');
      return [];
    }
  }

  /**
   * 检查键是否存在
   */
  async exists(key: string): Promise<boolean> {
    try {
      const memoryExists = this.memoryCache.has(key) && !this.isExpired(this.memoryCache.get(key)!);
      const redisExists = await this.redis.exists(key);
      return memoryExists || redisExists > 0;
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleCache');
      return false;
    }
  }

  /**
   * 获取TTL
   */
  async getTTL(key: string): Promise<number> {
    try {
      const memoryItem = this.memoryCache.get(key);
      if (memoryItem && !this.isExpired(memoryItem)) {
        return Math.max(0, Math.floor((memoryItem.expiry - Date.now()) / 1000));
      }

      return await this.redis.ttl(key);
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleCache');
      return -1;
    }
  }

  /**
   * 设置TTL
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const memoryItem = this.memoryCache.get(key);
      if (memoryItem) {
        memoryItem.expiry = Date.now() + ttl * 1000;
      }

      const redisResult = await this.redis.expire(key, ttl);
      return redisResult > 0;
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleCache');
      return false;
    }
  }

  /**
   * 添加一致性规则
   */
  addConsistencyRule(rule: CacheConsistencyRule): void {
    this.consistencyRules.set(rule.keyPattern, rule);
  }

  /**
   * 移除一致性规则
   */
  removeConsistencyRule(keyPattern: string): boolean {
    return this.consistencyRules.delete(keyPattern);
  }

  /**
   * 获取一致性规则
   */
  getConsistencyRules(): CacheConsistencyRule[] {
    return Array.from(this.consistencyRules.values());
  }

  /**
   * 开始健康检查
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 60000); // 每分钟检查一次
  }

  /**
   * 执行健康检查
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const healthStatus = {
        timestamp: Date.now(),
        status: 'healthy',
        issues: [],
        metrics: this.getStats()
      };

      // 检查Redis连接
      try {
        await this.redis.ping();
      } catch (error) {
        healthStatus.issues.push('Redis连接失败');
        healthStatus.status = 'unhealthy';
      }

      // 检查内存使用
      const memoryUsage = this.getMemoryUsage();
      const memoryUsagePercent = (memoryUsage / this.maxMemorySize) * 100;

      if (memoryUsagePercent > 90) {
        healthStatus.issues.push(`内存使用率过高: ${memoryUsagePercent.toFixed(2)}%`);
        healthStatus.status = 'warning';
      }

      // 检查命中率
      const hitRate = this.stats.hitRate;
      if (hitRate < 0.5) {
        healthStatus.issues.push(`缓存命中率过低: ${(hitRate * 100).toFixed(2)}%`);
        healthStatus.status = 'warning';
      }

      // 检查错误率
      const totalOperations = this.stats.hits + this.stats.misses + this.stats.sets + this.stats.deletes;
      const errorRate = totalOperations > 0 ? this.stats.errors / totalOperations : 0;

      if (errorRate > 0.01) { // 错误率超过1%
        healthStatus.issues.push(`操作错误率过高: ${(errorRate * 100).toFixed(2)}%`);
        healthStatus.status = 'warning';
      }

      this.metrics.set('health_status', healthStatus);
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleCache');
    }
  }

  /**
   * 获取健康状态
   */
  getHealthStatus(): any {
    return this.metrics.get('health_status') || { status: 'unknown' };
  }

  /**
   * 获取详细指标
   */
  getDetailedMetrics(): any {
    const stats = this.getStats();
    const healthStatus = this.getHealthStatus();

    return {
      timestamp: Date.now(),
      stats,
      health: healthStatus,
      configuration: {
        maxMemorySize: this.maxMemorySize,
        maxMemoryItems: this.maxMemoryItems,
        defaultTtl: this.defaultTtl,
        enableCompression: this.enableCompression,
        consistencyMode: this.consistencyMode
      },
      consistencyRules: this.getConsistencyRules()
    };
  }

  /**
   * 批量删除
   */
  async mdel(keys: string[]): Promise<number> {
    let deletedCount = 0;

    for (const key of keys) {
      if (await this.delete(key)) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * 获取所有键
   */
  async getAllKeys(): Promise<string[]> {
    const memoryKeys = Array.from(this.memoryCache.keys());
    const redisKeys = await this.getKeys();

    // 合并并去重
    const allKeys = [...new Set([...memoryKeys, ...redisKeys])];
    return allKeys;
  }

  /**
   * 获取缓存大小
   */
  getCacheSize(): { memory: number; redis: number; total: number } {
    const memorySize = this.memoryCache.size;
    const redisSize = this.stats.redisItems;

    return {
      memory: memorySize,
      redis: redisSize,
      total: memorySize + redisSize
    };
  }

  /**
   * 清理过期项
   */
  async cleanupExpiredItems(): Promise<number> {
    let cleanedCount = 0;
    const now = Date.now();

    // 清理内存缓存中的过期项
    for (const [key, item] of this.memoryCache) {
      if (now > item.expiry) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    // 清理Redis中的过期项（这里简化处理）
    try {
      const keys = await this.redis.keys('*');
      const pipeline = this.redis.pipeline();

      for (const key of keys) {
        pipeline.ttl(key);
      }

      const results = await pipeline.exec();
      const expiredKeys = [];

      for (let i = 0; i < keys.length; i++) {
        if (results && results[i] && results[i][1] === -2) { // TTL为-2表示键不存在
          expiredKeys.push(keys[i]);
        }
      }

      if (expiredKeys.length > 0) {
        await this.redis.del(...expiredKeys);
        cleanedCount += expiredKeys.length;
      }
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleCache');
    }

    this.updateStats();
    return cleanedCount;
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      hitRate: 0,
      memoryItems: 0,
      memoryUsage: 0,
      redisItems: 0,
      totalSize: 0,
      evictions: 0
    };
  }

  /**
   * 销毁缓存
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    this.memoryCache.clear();
    this.metrics.clear();
    console.log('🛑 缓存系统已销毁');
  }
}

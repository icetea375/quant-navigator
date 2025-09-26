/**
 * 简单分布式锁管理器
 * 遵循智能分析系统开发实施指南的命名规范
 */

import { Redis } from 'ioredis';
import { BaseErrorHandler } from '../utils/BaseErrorHandler';
import { BaseConfigValidator } from '../utils/BaseConfigValidator';
import { logger } from '../utils/logger';

export interface LockInfo {
  key: string;
  value: string;
  ttl: number;
  acquiredAt: number;
  expiresAt: number;
  owner: string;
}

export interface DistributedLockConfig {
  enabled: boolean;
  defaultTtl: number;
  maxTtl: number;
  retryDelay: number;
  maxRetries: number;
  enableDeadlockDetection: boolean;
  deadlockDetectionInterval: number;
  lockPrefix: string;
}

export class SimpleDistributedLockManager {
  private redis: Redis;
  private config: DistributedLockConfig;
  private activeLocks: Map<string, LockInfo> = new Map();
  private deadlockDetectionInterval?: NodeJS.Timeout;
  private isRunning: boolean = false;
  private ownerId: string;

  constructor(redis: Redis, config: DistributedLockConfig) {
    this.redis = redis;
    this.config = config;
    this.ownerId = this.generateOwnerId();

    this.validateConfig(config);
  }

  /**
   * 启动分布式锁管理器
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Distributed lock manager is already running');
      return;
    }

    this.isRunning = true;

    // 启动死锁检测
    if (this.config.enableDeadlockDetection) {
      this.deadlockDetectionInterval = setInterval(() => {
        this.detectDeadlocks();
      }, this.config.deadlockDetectionInterval);
    }

    logger.info('🔒 分布式锁管理器已启动');
  }

  /**
   * 停止分布式锁管理器
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.deadlockDetectionInterval) {
      clearInterval(this.deadlockDetectionInterval);
      this.deadlockDetectionInterval = undefined;
    }

    // 释放所有锁
    this.releaseAllLocks();

    logger.info('🛑 分布式锁管理器已停止');
  }

  /**
   * 获取锁
   */
  async acquireLock(key: string, ttl?: number, retries?: number): Promise<boolean> {
    try {
      const lockKey = this.getLockKey(key);
      const lockValue = this.generateLockValue();
      const lockTtl = Math.min(ttl || this.config.defaultTtl, this.config.maxTtl);
      const maxRetries = retries || this.config.maxRetries;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        // 尝试获取锁
        const acquired = await this.redis.set(lockKey, lockValue, 'PX', lockTtl, 'NX');

        if (acquired === 'OK') {
          const lockInfo: LockInfo = {
            key: lockKey,
            value: lockValue,
            ttl: lockTtl,
            acquiredAt: Date.now(),
            expiresAt: Date.now() + lockTtl,
            owner: this.ownerId
          };

          this.activeLocks.set(key, lockInfo);

          // 启动锁续期
          this.startLockRenewal(key, lockInfo);

          logger.debug(`🔒 锁已获取: ${key} (TTL: ${lockTtl}ms)`);
          return true;
        }

        // 如果还有重试机会，等待后重试
        if (attempt < maxRetries) {
          await this.sleep(this.config.retryDelay);
        }
      }

      logger.warn(`❌ 获取锁失败: ${key} (重试 ${maxRetries} 次)`);
      return false;

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleDistributedLockManager');
      return false;
    }
  }

  /**
   * 释放锁
   */
  async releaseLock(key: string): Promise<boolean> {
    try {
      const lockInfo = this.activeLocks.get(key);
      if (!lockInfo) {
        logger.warn(`锁不存在: ${key}`);
        return false;
      }

      const lockKey = this.getLockKey(key);

      // 使用Lua脚本确保原子性
      const luaScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;

      const result = await this.redis.eval(luaScript, 1, lockKey, lockInfo.value);

      if (result === 1) {
        this.activeLocks.delete(key);
        logger.debug(`🔓 锁已释放: ${key}`);
        return true;
      } else {
        logger.warn(`❌ 释放锁失败: ${key} (锁值不匹配或已过期)`);
        return false;
      }

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleDistributedLockManager');
      return false;
    }
  }

  /**
   * 尝试获取锁（非阻塞）
   */
  async tryLock(key: string, ttl?: number): Promise<boolean> {
    return this.acquireLock(key, ttl, 0);
  }

  /**
   * 检查锁是否存在
   */
  async isLocked(key: string): Promise<boolean> {
    try {
      const lockKey = this.getLockKey(key);
      const result = await this.redis.exists(lockKey);
      return result === 1;
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleDistributedLockManager');
      return false;
    }
  }

  /**
   * 获取锁信息
   */
  getLockInfo(key: string): LockInfo | undefined {
    return this.activeLocks.get(key);
  }

  /**
   * 获取所有活跃锁
   */
  getAllLocks(): LockInfo[] {
    return Array.from(this.activeLocks.values());
  }

  /**
   * 强制释放锁（管理员操作）
   */
  async forceReleaseLock(key: string): Promise<boolean> {
    try {
      const lockKey = this.getLockKey(key);
      const result = await this.redis.del(lockKey);

      if (result === 1) {
        this.activeLocks.delete(key);
        logger.warn(`🔓 锁被强制释放: ${key}`);
        return true;
      }

      return false;
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleDistributedLockManager');
      return false;
    }
  }

  /**
   * 释放所有锁
   */
  async releaseAllLocks(): Promise<number> {
    let releasedCount = 0;

    for (const key of this.activeLocks.keys()) {
      if (await this.releaseLock(key)) {
        releasedCount++;
      }
    }

    logger.info(`🔓 已释放 ${releasedCount} 个锁`);
    return releasedCount;
  }

  /**
   * 启动锁续期
   */
  private startLockRenewal(key: string, lockInfo: LockInfo): void {
    const renewalInterval = Math.min(lockInfo.ttl / 3, 30000); // 每1/3 TTL或30秒续期一次

    const renewalTimer = setInterval(async () => {
      try {
        if (!this.activeLocks.has(key)) {
          clearInterval(renewalTimer);
          return;
        }

        const renewed = await this.renewLock(key, lockInfo);
        if (!renewed) {
          clearInterval(renewalTimer);
          this.activeLocks.delete(key);
          logger.warn(`🔒 锁续期失败，已释放: ${key}`);
        }
      } catch (error) {
        logger.error(`锁续期错误: ${key}`, error);
        clearInterval(renewalTimer);
        this.activeLocks.delete(key);
      }
    }, renewalInterval);
  }

  /**
   * 续期锁
   */
  private async renewLock(key: string, lockInfo: LockInfo): Promise<boolean> {
    try {
      const lockKey = this.getLockKey(key);

      // 使用Lua脚本确保原子性
      const luaScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("pexpire", KEYS[1], ARGV[2])
        else
          return 0
        end
      `;

      const result = await this.redis.eval(luaScript, 1, lockKey, lockInfo.value, lockInfo.ttl);

      if (result === 1) {
        lockInfo.expiresAt = Date.now() + lockInfo.ttl;
        return true;
      }

      return false;
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleDistributedLockManager');
      return false;
    }
  }

  /**
   * 检测死锁
   */
  private async detectDeadlocks(): Promise<void> {
    if (!this.isRunning) return;

    try {
      const now = Date.now();
      const deadLocks: string[] = [];

      for (const [key, lockInfo] of this.activeLocks) {
        // 检查锁是否已过期
        if (now > lockInfo.expiresAt) {
          deadLocks.push(key);
        } else {
          // 检查Redis中的锁是否还存在
          const exists = await this.isLocked(key);
          if (!exists) {
            deadLocks.push(key);
          }
        }
      }

      // 清理死锁
      for (const key of deadLocks) {
        this.activeLocks.delete(key);
        logger.warn(`🔒 检测到死锁并清理: ${key}`);
      }

    } catch (error) {
      logger.error('死锁检测失败:', error);
    }
  }

  /**
   * 获取锁键名
   */
  private getLockKey(key: string): string {
    return `${this.config.lockPrefix}:${key}`;
  }

  /**
   * 生成锁值
   */
  private generateLockValue(): string {
    return `${this.ownerId}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成所有者ID
   */
  private generateOwnerId(): string {
    return `owner_${process.pid}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 验证配置
   */
  private validateConfig(config: DistributedLockConfig): void {
    BaseConfigValidator.validate(config, ['enabled', 'defaultTtl', 'maxTtl']);

    if (config.defaultTtl <= 0) {
      throw new Error('defaultTtl must be positive');
    }
    if (config.maxTtl <= 0) {
      throw new Error('maxTtl must be positive');
    }
    if (config.defaultTtl > config.maxTtl) {
      throw new Error('defaultTtl must not exceed maxTtl');
    }
    if (config.retryDelay < 0) {
      throw new Error('retryDelay must be non-negative');
    }
    if (config.maxRetries < 0) {
      throw new Error('maxRetries must be non-negative');
    }
  }

  /**
   * 获取锁统计信息
   */
  getLockStats(): any {
    const now = Date.now();
    const activeLocks = this.activeLocks.size;
    const expiredLocks = Array.from(this.activeLocks.values()).filter(lock => now > lock.expiresAt).length;

    return {
      active: activeLocks,
      expired: expiredLocks,
      owner: this.ownerId,
      running: this.isRunning
    };
  }

  /**
   * 清理过期锁
   */
  async cleanupExpiredLocks(): Promise<number> {
    try {
      const now = Date.now();
      const expiredKeys: string[] = [];

      for (const [key, lockInfo] of this.activeLocks) {
        if (now > lockInfo.expiresAt) {
          expiredKeys.push(key);
        }
      }

      for (const key of expiredKeys) {
        this.activeLocks.delete(key);
      }

      if (expiredKeys.length > 0) {
        logger.info(`🧹 清理了 ${expiredKeys.length} 个过期锁`);
      }

      return expiredKeys.length;
    } catch (error) {
      logger.error('清理过期锁失败:', error);
      return 0;
    }
  }

  /**
   * 使用锁执行函数
   */
  async withLock<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    const acquired = await this.acquireLock(key, ttl);
    if (!acquired) {
      throw new Error(`Failed to acquire lock: ${key}`);
    }

    try {
      return await fn();
    } finally {
      await this.releaseLock(key);
    }
  }

  /**
   * 使用锁执行函数（带超时）
   */
  async withLockTimeout<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number,
    timeout?: number
  ): Promise<T> {
    const acquired = await this.acquireLock(key, ttl);
    if (!acquired) {
      throw new Error(`Failed to acquire lock: ${key}`);
    }

    try {
      if (timeout) {
        return await Promise.race([
          fn(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Lock operation timeout')), timeout)
          )
        ]);
      } else {
        return await fn();
      }
    } finally {
      await this.releaseLock(key);
    }
  }
}

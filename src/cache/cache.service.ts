import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * 获取所有缓存
   * @returns 所有缓存的键值对
   */
  async getAll(): Promise<Record<string, any>> {
    try {
      // 注意：由于 cache-manager 的限制，我们需要通过其他方式获取所有缓存
      // 这里我们使用一个特殊的键来存储所有缓存的键列表
      const keys = await this.cacheManager.get<string[]>('__cache_keys__') || [];
      const result: Record<string, any> = {};
      
      for (const key of keys) {
        const value = await this.cacheManager.get(key);
        if (value !== null && value !== undefined) {
          result[key] = value;
        }
      }
      
      return result;
    } catch (error) {
      this.logger.error('Failed to get all cache:', error);
      throw error;
    }
  }

  /**
   * 设置缓存并记录键
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间（秒）
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      // 更新键列表
      const keys = await this.cacheManager.get<string[]>('__cache_keys__') || [];
      if (!keys.includes(key)) {
        keys.push(key);
        await this.cacheManager.set('__cache_keys__', keys);
      }
      this.logger.debug(`Cache set: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to set cache for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存值
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      this.logger.debug(`Cache ${value ? 'hit' : 'miss'}: ${key}`);
      return value;
    } catch (error) {
      this.logger.error(`Failed to get cache for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * 删除缓存并更新键列表
   * @param key 缓存键
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      // 更新键列表
      const keys = await this.cacheManager.get<string[]>('__cache_keys__') || [];
      const newKeys = keys.filter(k => k !== key);
      await this.cacheManager.set('__cache_keys__', newKeys);
      this.logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete cache for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * 获取缓存，如果不存在则通过工厂函数设置并返回
   * @param key 缓存键
   * @param factory 工厂函数
   * @param ttl 过期时间（秒）
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    try {
      let value = await this.get<T>(key);
      if (value === null || value === undefined) {
        value = await factory();
        await this.set(key, value, ttl);
      }
      return value;
    } catch (error) {
      this.logger.error(`Failed to get or set cache for key ${key}:`, error);
      throw error;
    }
  }
} 
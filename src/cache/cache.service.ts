import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { createKeyv as createKeyvRedis } from '@keyv/redis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly cacheManager = createKeyvRedis(`redis://${process.env.DB_HOST ?? 'localhost'}:6379`);
  
  /**
   * 设置缓存
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间（秒）
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
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
  async get<T>(key: string): Promise<T | undefined> {
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
   * 删除缓存
   * @param key 缓存键
   */
  async delete(key: string): Promise<void> {
    try {
      await this.cacheManager.delete(key);
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
      if (value === undefined) {
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
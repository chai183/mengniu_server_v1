import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';
import { CacheController } from './cache.controller';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.DB_HOST ?? 'localhost', // Redis 服务器地址
      port: 6379,       // Redis 端口
      ttl: 600 * 1000,  // 默认缓存10分钟
      max: 100,         // 最多缓存100个项目
      isGlobal: true
    }),
  ],
  controllers: [CacheController],
  providers: [CacheService],
  exports: [CacheService],
})
export class MemoryCacheModule {} 
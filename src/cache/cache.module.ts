import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';
import { CacheController } from './cache.controller';

@Module({
  imports: [
    CacheModule.register({
      ttl: 600 * 1000, // 默认缓存10分钟
      max: 100, // 最多缓存100个项目
      isGlobal: true
    }),
  ],
  controllers: [CacheController],
  providers: [CacheService],
  exports: [CacheService],
})
export class MemoryCacheModule {} 
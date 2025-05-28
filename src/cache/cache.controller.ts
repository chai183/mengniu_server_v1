import { Controller, Get, Query, Logger } from '@nestjs/common';
import { CacheService } from './cache.service';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('缓存管理')
@Controller('cache')
export class CacheController {
  private readonly logger = new Logger(CacheController.name);

  constructor(private readonly cacheService: CacheService) {}

  @Get('get')
  @ApiOperation({ summary: '获取缓存值' })
  @ApiQuery({ name: 'key', description: '缓存键', required: true })
  @ApiResponse({ status: 200, description: '成功获取缓存值' })
  @ApiResponse({ status: 404, description: '缓存不存在' })
  async getCache(@Query('key') key: string) {
    try {
      const value = await this.cacheService.get(key);
      if (value === null) {
        return {
          code: 404,
          message: '缓存不存在',
          data: null
        };
      }
      return {
        code: 200,
        message: '获取成功',
        data: value
      };
    } catch (error) {
      this.logger.error(`获取缓存失败: ${error.message}`);
      return {
        code: 500,
        message: '获取缓存失败',
        error: error.message
      };
    }
  }

  @Get('set')
  @ApiOperation({ summary: '设置缓存值' })
  @ApiQuery({ name: 'key', description: '缓存键', required: true })
  @ApiQuery({ name: 'value', description: '缓存值', required: true })
  @ApiQuery({ name: 'ttl', description: '过期时间（秒）', required: false })
  @ApiResponse({ status: 200, description: '成功设置缓存' })
  @ApiResponse({ status: 500, description: '设置缓存失败' })
  async setCache(
    @Query('key') key: string,
    @Query('value') value: string,
    @Query('ttl') ttl?: number
  ) {
    try {
      await this.cacheService.set(key, value, ttl);
      return {
        code: 200,
        message: '设置成功',
        data: null
      };
    } catch (error) {
      this.logger.error(`设置缓存失败: ${error.message}`);
      return {
        code: 500,
        message: '设置缓存失败',
        error: error.message
      };
    }
  }
} 
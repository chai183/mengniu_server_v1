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
} 
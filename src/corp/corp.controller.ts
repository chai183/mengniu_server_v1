import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CorpService } from './corp.service';
import { Corp } from '../common/entities/corp.entity';

@ApiTags('企业微信授权')
@Controller('corp')
export class CorpController {
  constructor(private readonly corpService: CorpService) {}

  @Post()
  @ApiOperation({ summary: '创建企业微信授权' })
  @ApiResponse({ status: 201, description: '创建成功', type: Corp })
  create(@Body() corp: Corp) {
    return this.corpService.create(corp);
  }

  @Get()
  @ApiOperation({ summary: '获取所有企业微信授权' })
  @ApiResponse({ status: 200, description: '获取成功', type: [Corp] })
  findAll() {
    return this.corpService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取指定企业微信授权' })
  @ApiResponse({ status: 200, description: '获取成功', type: Corp })
  findOne(@Param('id') id: number) {
    return this.corpService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新企业微信授权' })
  @ApiResponse({ status: 200, description: '更新成功', type: Corp })
  update(@Param('id') id: number, @Body() corp: Corp) {
    return this.corpService.update(id, corp);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除企业微信授权' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('id') id: number) {
    return this.corpService.remove(id);
  }
} 
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, UseInterceptors, ClassSerializerInterceptor, UseGuards } from '@nestjs/common';
import { GoodService } from './good.service';
import { CreateGoodDto } from './dto/create-good.dto';
import { UpdateGoodDto } from './dto/update-good.dto';
import { PageOptionsDto } from './dto/page-good.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('商品管理')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('good')
// @UseGuards(JwtAuthGuard)
export class GoodController {
  constructor(private readonly goodService: GoodService) {}

  @Post()
  @ApiOperation({ summary: '创建商品' })
  create(@Body() createGoodDto: CreateGoodDto) {
    return this.goodService.create(createGoodDto);
  }

  @Get()
  @ApiOperation({ summary: '获取商品列表' })
  findAll(@Query() query: any) {
    return this.goodService.findAll(query);
  }

  @Get('page')
  @ApiOperation({ summary: '分页获取商品列表' })
  findAllPage(@Query() query: any) {
    return this.goodService.findAllPage(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取商品详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.goodService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新商品信息' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateGoodDto: UpdateGoodDto) {
    return this.goodService.update(id, updateGoodDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除商品' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.goodService.remove(id);
  }
} 
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Query } from '@nestjs/common';
import { FollowUpService } from './follow-up.service';
import { CreateFollowUpDto, UpdateFollowUpDto } from './dto';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('跟进记录')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
@Controller('follow-up')
export class FollowUpController {
  constructor(private readonly followUpService: FollowUpService) {}

  @Post()
  @ApiOperation({ summary: '创建跟进记录' })
  @ApiBody({ type: CreateFollowUpDto })
  create(@Body() createFollowUpDto: CreateFollowUpDto) {
    return this.followUpService.create(createFollowUpDto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有跟进记录' })
  findAll() {
    return this.followUpService.findAll();
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: '获取特定客户的所有跟进记录' })
  @ApiParam({ name: 'customerId', description: '客户ID' })
  findByCustomerId(@Param('customerId', ParseIntPipe) customerId: number) {
    return this.followUpService.findByCustomerId(customerId);
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取跟进记录' })
  @ApiParam({ name: 'id', description: '跟进记录ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.followUpService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新跟进记录' })
  @ApiParam({ name: 'id', description: '跟进记录ID' })
  @ApiBody({ type: UpdateFollowUpDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFollowUpDto: UpdateFollowUpDto,
  ) {
    return this.followUpService.update(id, updateFollowUpDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除跟进记录' })
  @ApiParam({ name: 'id', description: '跟进记录ID' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.followUpService.remove(id);
  }
} 
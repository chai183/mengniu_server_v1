import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BatchImportResultDto {
  @ApiProperty({ description: '总记录数' })
  total: number;

  @ApiProperty({ description: '成功导入数' })
  success: number;

  @ApiProperty({ description: '失败数' })
  failed: number;

  @ApiProperty({ description: '错误信息列表', type: [String] })
  errors: string[];

  @ApiProperty({ description: '导入任务ID' })
  taskId: string;
}

export class ImportProgressDto {
  @ApiProperty({ description: '任务ID' })
  taskId: string;

  @ApiProperty({ description: '总记录数' })
  total: number;

  @ApiProperty({ description: '已处理数' })
  processed: number;

  @ApiProperty({ description: '成功数' })
  success: number;

  @ApiProperty({ description: '失败数' })
  failed: number;

  @ApiProperty({ description: '处理状态', enum: ['pending', 'processing', 'completed', 'failed'] })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @ApiProperty({ description: '错误信息', type: [String] })
  errors: string[];
}

export class BatchImportOptionsDto {
  @ApiProperty({ description: '是否跳过重复数据', default: false })
  @IsOptional()
  skipDuplicates?: boolean = false;

  @ApiProperty({ description: '重复数据判断字段', default: 'phone' })
  @IsOptional()
  @IsString()
  duplicateField?: string = 'phone';

  @ApiProperty({ description: '是否更新已存在的数据', default: false })
  @IsOptional()
  updateExisting?: boolean = false;
} 
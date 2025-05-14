import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class UpdateFollowUpDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ description: '跟进内容', required: false })
  content?: string;
} 
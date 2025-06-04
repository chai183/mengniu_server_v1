import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateFollowUpDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ description: '客户ID' })
  customerId: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '跟进内容' })
  content: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ description: '跟进类型' })
  type: number;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: '图片' })
  images: string;
} 
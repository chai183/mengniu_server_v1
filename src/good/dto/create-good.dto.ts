import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGoodDto {
  @ApiProperty({ description: '商品名称' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: '商品颜色' })
  @IsNotEmpty()
  @IsString()
  color: string;
} 
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class BatchCreateCustomerDto {
  @ApiProperty({ 
    description: '企业成员的userid列表', 
    type: [String],
    example: ['user1', 'user2', 'user3']
  })
  @IsArray()
  @IsString({ each: true })
  useridList: string[];
} 
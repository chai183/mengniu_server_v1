import { Entity, Column } from 'typeorm';
import { BaseEntity } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Good extends BaseEntity {
  @Column({ unique: true })
  @ApiProperty({ description: '商品名称' })
  name: string;

  @Column()
  @ApiProperty({ description: '商品颜色' })
  color: string;
} 
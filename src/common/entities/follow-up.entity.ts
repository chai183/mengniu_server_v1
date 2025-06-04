import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './user.entity';
import { Customer } from './customer.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class FollowUp extends BaseEntity {
  @ManyToOne(() => Customer, { nullable: false })
  @JoinColumn({ name: 'customerId' })
  @ApiProperty({ description: '所属客户' })
  customer: Customer;

  @Column()
  @ApiProperty({ description: '客户ID' })
  customerId: number;

  @Column('text')
  @ApiProperty({ description: '跟进内容' })
  content: string;

  @Column()
  @ApiProperty({ description: '跟进类型' })
  type: number;

  @Column({ nullable: true })
  @ApiProperty({ description: '图片' })
  images: string;
} 
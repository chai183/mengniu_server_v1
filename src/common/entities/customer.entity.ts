import { Entity, Column } from 'typeorm';
import { BaseEntity } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Good } from './good.entity';

export enum CustomerStatus {
  PENDING = '待跟进',
  DEAL = '已成交',
  LOST = '已流失'
}

@Entity()
export class Customer extends BaseEntity {

  @Column()
  @ApiProperty({ description: '客户名称' })
  name: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '手机号' })
  phone: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '头像' })
  avatar: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '性别' })
  gender: number;

  @Column({ nullable: true })
  @ApiProperty({ description: '购买产品' })
  shop: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '客户信息' })
  detail: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '跟进备注' })
  remark: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '图片' })
  images: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '外部联系人的userid，注意不是企业成员的账号' })
  userid: string;

  @Column({
    type: 'enum',
    enum: CustomerStatus,
    default: CustomerStatus.PENDING
  })
  @ApiProperty({ 
    description: '客户状态',
    enum: CustomerStatus,
    example: CustomerStatus.PENDING
  })
  status: CustomerStatus;

  @Column('simple-array', { nullable: true })
  @ApiProperty({ description: '产品列表', type: [String] })
  shopList: string[];
} 
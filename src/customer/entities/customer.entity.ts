import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../user/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Customer extends BaseEntity {

  @Column()
  @ApiProperty({ description: '客户名称' })
  name: string;

  @Column()
  @ApiProperty({ description: '手机号' })
  phone: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '购买产品' })
  shop: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '客户信息' })
  detail: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '跟进备注' })
  remark: string;

} 
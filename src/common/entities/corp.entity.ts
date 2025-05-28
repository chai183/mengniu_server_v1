import { Entity, Column } from 'typeorm';
import { BaseEntity } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Corp extends BaseEntity {
  @Column()
  @ApiProperty({ description: '授权方企业微信id' })
  corpid: string;

  @Column()
  @ApiProperty({ description: '企业微信永久授权码' })
  permanentCode: string;

  @Column()
  @ApiProperty({ description: '授权方应用id' })
  agentid: string;
} 
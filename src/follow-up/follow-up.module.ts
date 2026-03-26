import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowUpController } from './follow-up.controller';
import { FollowUpService } from './follow-up.service';
import { FollowUp } from '../common/entities';
import { BaseRepositoryModule } from '../common/modules/base.repository.module';
import { CustomerModule } from '../customer/customer.module';

@Module({
  imports: [BaseRepositoryModule.forFeature([FollowUp]), CustomerModule],
  controllers: [FollowUpController],
  providers: [FollowUpService],
  exports: [FollowUpService],
})
export class FollowUpModule { } 
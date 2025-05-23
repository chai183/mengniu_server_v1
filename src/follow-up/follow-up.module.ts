import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowUpController } from './follow-up.controller';
import { FollowUpService } from './follow-up.service';
import { FollowUp } from './entities/follow-up.entity';
import { BaseRepositoryModule } from '../common/modules/base.repository.module';

@Module({
  imports: [BaseRepositoryModule.forFeature([FollowUp])],
  controllers: [FollowUpController],
  providers: [FollowUpService],
  exports: [FollowUpService],
})
export class FollowUpModule {} 
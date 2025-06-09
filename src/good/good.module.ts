import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Good } from '../common/entities';
import { GoodService } from './good.service';
import { GoodController } from './good.controller';
import { BaseRepositoryModule } from '../common/modules/base.repository.module';

@Module({
  imports: [BaseRepositoryModule.forFeature([Good])],
  controllers: [GoodController],
  providers: [GoodService],
  exports: [GoodService],
})
export class GoodModule {} 
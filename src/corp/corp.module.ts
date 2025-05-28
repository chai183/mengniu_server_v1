import { Module } from '@nestjs/common';
import { Corp } from '../common/entities';
import { CorpController } from './corp.controller';
import { CorpService } from './corp.service';
import { BaseRepositoryModule } from '../common/modules/base.repository.module';

@Module({
  imports: [BaseRepositoryModule.forFeature([Corp])],
  controllers: [CorpController],
  providers: [CorpService],
  exports: [CorpService],
})
export class CorpModule {} 
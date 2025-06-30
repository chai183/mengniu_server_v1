import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { WechatModule } from '../wechat/wechat.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    WechatModule,
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class AppScheduleModule {} 
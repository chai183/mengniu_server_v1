import { Module } from '@nestjs/common';
import { WechatController } from './wechat.controller';
import { WechatService } from './wechat.service';
import { WechatAuthService } from './wechat-auth.service';
import { MemoryCacheModule } from '../cache/cache.module';

@Module({
  imports: [MemoryCacheModule],
  controllers: [WechatController],
  providers: [WechatService, WechatAuthService],
  exports: [WechatService, WechatAuthService],
})
export class WechatModule {} 
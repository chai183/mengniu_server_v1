import { Module } from '@nestjs/common';
import { WechatController } from './wechat.controller';
import { WechatService } from './wechat.service';
import { WechatAuthService } from './wechat-auth.service';

@Module({
  controllers: [WechatController],
  providers: [WechatService, WechatAuthService],
  exports: [WechatService, WechatAuthService],
})
export class WechatModule {} 
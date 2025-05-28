import { Module } from '@nestjs/common';
import { WechatController } from './wechat.controller';
import { WechatService } from './wechat.service';
import { WechatAuthService } from './wechat-auth.service';
import { MemoryCacheModule } from '../cache/cache.module';
import { CorpModule } from '../corp/corp.module';


@Module({
  imports: [MemoryCacheModule, CorpModule],
  controllers: [WechatController],
  providers: [WechatService, WechatAuthService],
  exports: [WechatService, WechatAuthService],
})
export class WechatModule {} 
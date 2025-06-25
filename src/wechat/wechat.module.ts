import { Module } from '@nestjs/common';
import { WechatController } from './wechat.controller';
import { WechatService } from './wechat.service';
import { WechatAuthService } from './wechat-auth.service';
import { MemoryCacheModule } from '../cache/cache.module';
import { CorpModule } from '../corp/corp.module';
import { UserModule } from '../user/user.module';
import { CustomerModule } from '../customer/customer.module';

@Module({
  imports: [MemoryCacheModule, CorpModule, UserModule, CustomerModule],
  controllers: [WechatController],
  providers: [WechatService, WechatAuthService],
  exports: [WechatService, WechatAuthService],
})
export class WechatModule {} 
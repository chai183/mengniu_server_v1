import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User, Customer, FollowUp, Corp, Good } from './common/entities';
import { AuthModule } from './auth/auth.module';
import { JwtStrategy } from './common/strategies/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RequestContextInterceptor } from './common/interceptors/request-context.interceptor';
import { CustomerModule } from './customer/customer.module';
import { FollowUpModule } from './follow-up/follow-up.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/index';
import { WechatModule } from './wechat/wechat.module';
import { MemoryCacheModule } from './cache/cache.module';
import { CorpModule } from './corp/corp.module';
import { UploadModule } from './upload/upload.module';
import { GoodModule } from './good/good.module';
import { AppScheduleModule } from './schedule/schedule.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      cache: true,
      load: [configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          type: 'mysql',
          ...config.get('db.mysql'),
          entities: [User, Customer, FollowUp, Corp, Good],
        } as TypeOrmModuleOptions;
      },
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.get('jwt.secretkey'),
        signOptions: { expiresIn: config.get('jwt.expiresin') },
      }),
      inject: [ConfigService],
    }),
    MemoryCacheModule,
    UserModule,
    AuthModule,
    CustomerModule,
    FollowUpModule,
    WechatModule,
    CorpModule,
    UploadModule,
    GoodModule,
    AppScheduleModule,
  ],
  providers: [
    JwtStrategy,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestContextInterceptor,
    },
  ],
})
export class AppModule { }

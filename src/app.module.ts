import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from './user/entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { JwtStrategy } from './common/strategies/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RequestContextInterceptor } from './common/interceptors/request-context.interceptor';
import { CustomerModule } from './customer/customer.module';
import { Customer } from './customer/entities/customer.entity';
import { FollowUpModule } from './follow-up/follow-up.module';
import { FollowUp } from './follow-up/entities/follow-up.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/index';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      cache: true,
      load: [configuration],
      isGlobal: true,
    }),
    // TypeOrmModule.forRootAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (config: ConfigService) => {
    //     return {
    //       type: 'mysql',
    //       // entities: [`${__dirname}/**/*.entity{.ts,.js}`],
    //       // autoLoadEntities: true,
    //       // keepConnectionAlive: true,
    //       // timezone: '+08:00',
    //       ...config.get('db.mysql'),
    //     } as TypeOrmModuleOptions;
    //   },
    // }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '3306'),
      username: process.env.DB_USERNAME ?? 'root',
      password: process.env.DB_PASSWORD ?? '123456',
      database: process.env.DB_DATABASE ?? 'db_template',
      entities: [User, Customer, FollowUp],
      synchronize: true,
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
    UserModule,
    AuthModule,
    CustomerModule,
    FollowUpModule,
  ],
  providers: [
    JwtStrategy,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestContextInterceptor,
    },
  ],
})
export class AppModule {}

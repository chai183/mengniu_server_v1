import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../common/entities';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { IsAccountUniqueConstraint } from './validators/is-account-unique.validator';
import { BaseRepositoryModule } from '../common/modules/base.repository.module';

@Module({
  imports: [BaseRepositoryModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService, IsAccountUniqueConstraint],
  exports: [UserService],
})
export class UserModule {}

import { Module } from '@nestjs/common';
import { User } from './entities/user.entity';
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

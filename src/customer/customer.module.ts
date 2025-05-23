import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../common/entities';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { BaseRepositoryModule } from '../common/modules/base.repository.module';

@Module({
  imports: [BaseRepositoryModule.forFeature([Customer])],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {} 
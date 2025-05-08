import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { BusinessException } from '../common/exceptions/business.exception';
import { PageOptionsDto } from './dto/page-customer.dto';

@Injectable()
export class CustomerService {
  
  @InjectRepository(Customer)
  private readonly customerRepository: Repository<Customer>;

  async create(createCustomerDto: CreateCustomerDto) {
    const newCustomer = await this.customerRepository.create(createCustomerDto);
    return this.customerRepository.save(newCustomer);
  }

  findAll(query: PageOptionsDto) {
    const { name } = query;
    return this.customerRepository.find({
      where: {
        isDeleted: false,
        name: name ? Like(`%${name}%`) : undefined
      },
      order: {
        createTime: 'DESC',
      },
    });
  }

  async findAllPage(query: any) {
    const { page, limit, name, phone, email, company, 'createTime[]': createTime, 'updateTime[]': updateTime, ...rest } = query;
    const [customers, total] = await this.customerRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      where: {
        ...rest,
        name: name ? Like(`%${name}%`) : undefined,
        phone: phone ? Like(`%${phone}%`) : undefined,
        email: email ? Like(`%${email}%`) : undefined,
        company: company ? Like(`%${company}%`) : undefined,
        createTime: createTime ? Between(createTime[0], createTime[1]) : undefined,
        updateTime: updateTime ? Between(updateTime[0], updateTime[1]) : undefined
      }
    });
    return {
      data: customers,
      total
    };
  }

  async findOne(id: number) {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new BusinessException(1001, '客户不存在');
    }
    return customer;
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new BusinessException(1001, '客户不存在');
    }
    await this.customerRepository.update(id, updateCustomerDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new BusinessException(1001, '客户不存在');
    } 
    customer.isDeleted = true;
    return this.customerRepository.save(customer);
  }
} 
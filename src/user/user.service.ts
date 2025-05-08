import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { LoginUserDto } from './dto/login-user.dto';
import { BusinessException } from '../common/exceptions/business.exception';
import { Between, Like } from 'typeorm';

@Injectable()
export class UserService {

  @InjectRepository(User)
  private readonly userRepository: Repository<User>;

  async create(createUserDto: CreateUserDto) {
    const newUser = await this.userRepository.create(createUserDto)
    return this.userRepository.save(newUser);
  }

  findAll() {
    return this.userRepository.find();
  }

  //分页获取用户  
  async findAllPage(query: any) {
    const { page, limit, 'createTime[]': createTime, 'updateTime[]': updateTime, account, ...rest } = query;
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      where: {
        ...rest,
        account: account ? Like(`%${account}%`) : undefined,
        createTime: createTime ? Between(createTime[0], createTime[1]) : undefined,
        updateTime: updateTime ? Between(updateTime[0], updateTime[1]) : undefined
      }
    });
    return {
      data: users,
      total
    };
  }

  findOne(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new BusinessException(1001, '用户不存在');
    }
    //校验账号是否存在
    if (updateUserDto.account) {
      const user = await this.userRepository.findOne({ where: { account: updateUserDto.account } });
      if (user && user.id !== id) {
        throw new BusinessException(1001, '账号已存在');
      }
    }

    return this.userRepository.update(id, updateUserDto);
  }

  remove(id: number) {
    return this.userRepository.delete(id);
  }

  async findByAccount(account: string) {
    return this.userRepository.findOne({ where: { account } });
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.findByAccount(loginUserDto.account);
    if (!user) {
      throw new BusinessException(1001, '账号或密码错误');
    }

    const isPasswordValid = await user.validatePassword(loginUserDto.password);
    if (!isPasswordValid) {
      throw new BusinessException(1001, '账号或密码错误');
    }

    return user;
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../common/entities';
import { LoginUserDto } from './dto/login-user.dto';
import { BusinessException } from '../common/exceptions/business.exception';
import { BaseRepository, InjectBaseRepository } from '../common/repository/base.repository';

@Injectable()
export class UserService {

  @InjectBaseRepository(User)
  private readonly userRepository: BaseRepository<User>;


  async create(createUserDto: CreateUserDto) {
    return this.userRepository.create(createUserDto);
  }

  findAll() {
    return this.userRepository.findAll();
  }

  //分页获取用户  
  async findAllPage(query: any) {
    return this.userRepository.findAllPage(query);
  }

  findOne(id: number) {
    return this.userRepository.findOne(id);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    //校验账号是否存在
    if (updateUserDto.account) {
      const existingUser = await this.findByAccount(updateUserDto.account);
      if (existingUser && existingUser.id !== id) {
        throw new BusinessException(1001, '账号已存在');
      }
    }
    return this.userRepository.update(id, updateUserDto);
  }

  remove(id: number) {
    return this.userRepository.remove(id);
  }

  async findByAccount(account: string) {
    const users = await this.userRepository.findAll();
    return users.find(user => user.account === account);
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

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


  async create(createUserDto: any) {
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

  async findByName(name: string) {
    const users = await this.userRepository.findAll();
    return users.find(user => user.name === name);
  }

  // async login(loginUserDto: LoginUserDto) {
  //   const user = await this.findByName(loginUserDto.name);
  //   if (!user) {
  //     throw new BusinessException(1001, '账号不存在');
  //   }

  //   const isPasswordValid = await user.validatePassword(loginUserDto.password);
  //   if (!isPasswordValid) {
  //     throw new BusinessException(1001, '密码错误');
  //   }

  //   return user;
  // }

  async createBatch(createUserDtos: any[]) {
    try {
      if (!createUserDtos || createUserDtos.length === 0) {
        return {
          success: true,
          message: '用户列表为空',
          totalCount: 0,
          createdCount: 0,
          updatedCount: 0,
          createdUsers: [],
          updatedUsers: [],
          errors: []
        };
      }

      const createdUsers: any[] = [];
      const updatedUsers: any[] = [];
      const errors: string[] = [];
      let createdCount = 0;
      let updatedCount = 0;
      // 处理每个用户
      for (const userDto of createUserDtos) {
        try {
          // 检查用户是否已存在
          const existingUser = await this.userRepository.findOneByUserid(userDto.userid);
          
          if (existingUser) {
            // 更新已存在的用户
            const updatedUser = await this.userRepository.update(existingUser.id, userDto);
            updatedUsers.push(updatedUser);
            updatedCount++;
          } else {
            // 创建新用户
            const createdUser = await this.userRepository.create(userDto);
            createdUsers.push(createdUser);
            createdCount++;
          }

        } catch (error) {
          const errorMessage = `处理用户 ${userDto.account} 时发生错误: ${error.message}`;
          console.error(errorMessage);
          errors.push(errorMessage);
          // 继续处理下一个用户，不中断整个流程
        }
      }

      return {
        success: true,
        message: '批量创建用户完成',
        totalCount: createUserDtos.length,
        createdCount,
        updatedCount,
        // createdUsers,
        // updatedUsers,
        errors
      };

    } catch (error) {
      console.error('批量创建用户时发生错误:', error);
      throw new BusinessException(1002, `批量创建用户失败: ${error.message}`);
    }
  }
}

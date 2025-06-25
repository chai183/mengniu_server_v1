import { IsNotEmpty, IsString, Length } from 'class-validator';
import { IsAccountUnique } from '../validators/is-account-unique.validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @Length(5, 20)
  account: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 20)
  password: string;
}

// 批量创建用户的DTO
export class CreateUsersDto {
  @IsNotEmpty()
  users: CreateUserDto[];
}

import { IsNotEmpty, IsString, Length } from 'class-validator';

export class LoginUserDto {
  @IsNotEmpty()
  @IsString()
  @Length(5, 20)
  account: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 20)
  password: string;
} 
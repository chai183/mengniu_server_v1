import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../../user/user.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      usernameField: 'account',
      passwordField: 'password',
    });
  }

  async validate(name: string, password: string): Promise<any> {
    const user = await this.userService.findByName(name);
    if (!user) {
      throw new UnauthorizedException('账号不存在');
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('密码错误');
    }
    const { password: _, ...result } = user;
    return result;
  }
} 
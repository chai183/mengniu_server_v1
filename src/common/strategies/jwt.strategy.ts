import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private userService: UserService,
    private configService: ConfigService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: configService.get('jwt.secretkey')!,
    });
  }

  async validate(payload: any) {
    const user = await this.userService.findOne(payload.userid);
    if(user){
      return user;
    }
    // payload中包含我们在sign时放入的数据
    return this.userService.findOneByUserid(payload.userid);
  }
} 
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

async function code2Session({
  access_token,
  js_code
}) {

  return {
    "corpid": "CORPID",
    "userid": "826300474",
    "session_key": "kJtdi6RF+Dv67QkbLlPGjw==",
    "errcode": 0,
    "errmsg": "ok"
  }

  const url = `https://qyapi.weixin.qq.com/cgi-bin/miniprogram/jscode2session?access_token=${access_token}&js_code=${js_code}&grant_type=authorization_code`
  const response = await axios.get(url);

  if (response.data.errcode) {
    throw new HttpException(`微信登录失败: ${response.data.errmsg}`, HttpStatus.BAD_REQUEST);
  }

  return response.data;
}

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) { }

  async validateUser(account: string, password: string): Promise<any> {
    const user = await this.userService.findByAccount(account);
    if (user && await user.validatePassword(password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.account, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async wechatLogin(code: string) {
    try {
      // 微信小程序配置信息，应该存储在环境变量或配置文件中
      const appId = this.configService.get('wechat.appId');
      const appSecret = this.configService.get('wechat.appSecret');

      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`
      const response = await axios.get(url);

      if (response.data.errcode) {
        throw new HttpException(`微信登录失败: ${response.data.errmsg}`, HttpStatus.BAD_REQUEST);
      }

      return {
        token: this.generateJwtToken({
          userid: response.data.openid
        }),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('微信登录处理失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async wecomLogin(code: string) {
    try {
      // 企业微信配置信息
      const corpId = this.configService.get('wecom.corpId');
      const corpSecret = this.configService.get('wecom.corpSecret');
      // 获取企业微信访问令牌
      const tokenUrl = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpId}&corpsecret=${corpSecret}`;
      const tokenResponse = await axios.get(tokenUrl);

      if (tokenResponse.data.errcode !== 0) {
        throw new HttpException(`获取企业微信访问令牌失败: ${tokenResponse.data.errmsg}`, HttpStatus.BAD_REQUEST);
      }

      const accessToken = tokenResponse.data.access_token;
      const { userid } = await code2Session({
        access_token: accessToken,
        js_code: code
      });

      return {
        token: this.generateJwtToken({
          userid
        }),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('企业微信登录处理失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  //生成JWT token
  async generateJwtToken(payload: any) {
    return this.jwtService.sign(payload, {
      expiresIn: '3650d'
    });
  }

  async logout(userId: number) {
    // 在这里可以实现将token加入黑名单的逻辑
    // 例如将token存入Redis并设置相同的过期时间
    // 这需要额外的Redis或其他存储机制的支持

    return true;
  }
} 
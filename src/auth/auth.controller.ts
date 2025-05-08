import { Controller, Post, UseGuards, Request, Get, Res, UseInterceptors, ClassSerializerInterceptor, Body } from '@nestjs/common';
import { Response } from 'express';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';


@UseInterceptors(ClassSerializerInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('wechat/login')
  async wechatLogin(@Body() body: { code: string }) {
    return this.authService.wechatLogin(body.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req, @Res({ passthrough: true }) response: Response) {
    // 获取用户ID
    const userId = req.user.userId || req.user.sub;
    
    // 调用服务方法（可用于将token加入黑名单）
    await this.authService.logout(userId);
    
    // 清除客户端cookie
    response.clearCookie('jwt');
    
    return {
      statusCode: 200,
      message: '退出登录成功'
    };
  }
  
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    // console.log(req);
    return req.user;
  }
} 
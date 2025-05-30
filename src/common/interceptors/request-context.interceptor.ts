import { Injectable, NestInterceptor, ExecutionContext, CallHandler, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestContextService } from '../utils/request-context.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    //手动解析jwt
    const authHeader = request.headers.authorization;
    let user = {
      userid: '1'
    };
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7); // 去掉'Bearer '
      try {
        // 使用 JwtService 解析 token
        const { userid } = this.jwtService.verify(token, {
          secret: this.configService.get('jwt.secretkey'),
          ignoreExpiration: true
        });
        user = { userid }
      } catch (error) {
        console.error('JWT解析错误', error);
      }
    }
    // 创建请求上下文并运行
    return new Observable(subscriber => {
      RequestContextService.run(user, () => {
        next.handle().subscribe({
          next: value => subscriber.next(value),
          error: err => subscriber.error(err),
          complete: () => subscriber.complete()
        });
      });
    });
  }
} 
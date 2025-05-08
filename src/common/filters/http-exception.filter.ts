import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    console.log('exception',exception);
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 500;
    let message = '服务器内部错误';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      
      if (typeof exceptionResponse === 'object' && exceptionResponse.code) {
        // 处理业务异常
        code = exceptionResponse.code;
        message = exceptionResponse.message;
      } else if (typeof exceptionResponse === 'string') {
        // 处理HTTP异常
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        // 处理验证异常
        message = exceptionResponse.message || '请求参数错误';
      }
    }

    response
      .status(status)
      .json({
        code,
        success: false,
        message,
        data: null,
      });
  }
} 
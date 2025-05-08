import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(code: number, message: string) {
    super(
      {
        code,
        message,
      },
      HttpStatus.OK,
    );
  }
} 
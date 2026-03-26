import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { OssService } from './oss.service';

@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [UploadService, OssService],
  exports: [OssService],
})
export class UploadModule {} 
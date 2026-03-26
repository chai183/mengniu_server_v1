import { Injectable } from '@nestjs/common';
import { OssService } from './oss.service';

@Injectable()
export class UploadService {
  constructor(private readonly ossService: OssService) {}

  /**
   * 上传文件到OSS
   */
  async uploadToOss(file: Express.Multer.File) {
    return await this.ossService.uploadFile(file);
  }

  /**
   * 从OSS删除文件
   */
  async deleteFromOss(filename: string) {
    return await this.ossService.deleteFile(filename);
  }

  /**
   * 获取文件URL
   */
  getFileUrl(filename: string) {
    return this.ossService.getFileUrl(filename);
  }
} 
import { Controller, Post, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OssService } from './oss.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly ossService: OssService) { }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('请选择要上传的文件');
    }

    try {
      // 使用OSS服务上传文件
      const result = await this.ossService.uploadFile(file);

      return {
        url: result.url,
        filename: result.filename,
        size: result.size,
        mimetype: result.mimetype,
        originalName: file.originalname,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Post('delete')
  async deleteFile(@Body('filename') filename: string) {
    if (!filename) {
      throw new Error('请提供要删除的文件名');
    }

    try {
      await this.ossService.deleteFile(filename);
      return {
        success: true,
        message: '文件删除成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
import { Injectable } from '@nestjs/common';
import * as OSS from 'ali-oss';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OssService {
  private client: OSS;

  constructor(private configService: ConfigService) {
    // 从环境变量或配置文件获取OSS配置
    const accessKeyId = this.configService.get<string>('oss.accessKeyId');
    const accessKeySecret = this.configService.get<string>('oss.accessKeySecret');
    const bucket = this.configService.get<string>('oss.bucket');

    if (!accessKeyId || !accessKeySecret || !bucket) {
      throw new Error('OSS配置不完整，请检查环境变量');
    }

    this.client = new OSS({
      region: this.configService.get<string>('oss.region'),
      accessKeyId,
      accessKeySecret,
      bucket,
    });
  }

  /**
   * 上传文件到OSS
   * @param file 文件对象
   * @param folder 文件夹路径（可选）
   * @returns 上传结果
   */
  async uploadFile(file: Express.Multer.File): Promise<{
    url: string;
    filename: string;
    size: number;
    mimetype: string;
  }> {
    try {
      // 生成唯一文件名
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = file.originalname.substring(file.originalname.lastIndexOf('.'));
      const filename = `${uniqueSuffix}${ext}`;

      // 上传到OSS
      const result = await this.client.put(filename, file.buffer, {
        headers: {
          'Content-Type': file.mimetype,
        },
      });

      return {
        url: result.url,
        filename: filename,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      throw new Error(`文件上传失败: ${error.message}`);
    }
  }

  /**
   * 删除OSS中的文件
   * @param filename 文件名
   * @returns 删除结果
   */
  async deleteFile(filename: string): Promise<boolean> {
    try {
      await this.client.delete(filename);
      return true;
    } catch (error) {
      throw new Error(`文件删除失败: ${error.message}`);
    }
  }

  /**
   * 获取文件的访问URL
   * @param filename 文件名
   * @returns 文件URL
   */
  getFileUrl(filename: string): string {
    return this.client.signatureUrl(filename);
  }
} 
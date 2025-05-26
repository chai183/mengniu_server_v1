import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from '@wecom/crypto';
import * as xml2js from 'xml2js';

@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name);
  private readonly token: string;
  private readonly encodingAESKey: string;

  constructor(private configService: ConfigService) {
    // 从配置中获取企业微信应用的Token和EncodingAESKey
    this.token = this.configService.get<string>('wechat.token') || '';
    this.encodingAESKey = this.configService.get<string>('wechat.encodingAesKey') || '';
  }

  /**
   * 验证回调URL - GET请求
   */
  validateCallback(msgSignature: string, timestamp: string, nonce: string, echostr: string): string | null {
    try {
      // 重新计算签名
      const signature = crypto.getSignature(this.token, timestamp, nonce, echostr);
      this.logger.log(`计算的签名: ${signature}, 接收的签名: ${msgSignature}`);

      // 校验签名是否正确
      if (signature === msgSignature) {
        this.logger.log('签名验证成功');
        // 解密 echostr
        const { message } = crypto.decrypt(this.encodingAESKey, echostr);
        this.logger.log(`解密后的消息: ${message}`);
        return message;
      } else {
        this.logger.error('签名验证失败');
        return null;
      }
    } catch (error) {
      this.logger.error('验证回调URL时发生错误:', error);
      return null;
    }
  }

  /**
   * 处理POST回调
   */
  async handlePostCallback(
    msgSignature: string,
    timestamp: string,
    nonce: string,
    xmlBody: string,
  ): Promise<any> {
    try {
      // 解析XML获取加密消息
      const parser = new xml2js.Parser({ explicitArray: false });
      const formatJson = await parser.parseStringPromise(xmlBody);
      const encrypt = formatJson.xml.Encrypt;

      // 重新计算签名进行验证
      const signature = crypto.getSignature(this.token, timestamp, nonce, encrypt);
      
      if (signature !== msgSignature) {
        this.logger.error('POST回调签名验证失败');
        throw new Error('签名验证失败');
      }

      this.logger.log('POST回调签名验证成功');

      // 解密消息体
      const { message } = crypto.decrypt(this.encodingAESKey, encrypt);
      this.logger.log(`解密后的XML消息: ${message}`);

      // 解析解密后的XML消息
      const callbackDataBody = await parser.parseStringPromise(message);
      this.logger.log('回调数据:', JSON.stringify(callbackDataBody, null, 2));

      return callbackDataBody;
    } catch (error) {
      this.logger.error('处理POST回调时发生错误:', error);
      throw error;
    }
  }

  /**
   * 处理suite_ticket回调
   */
  async handleSuiteTicket(callbackData: any): Promise<void> {
    try {
      const { InfoType, SuiteId, SuiteTicket, TimeStamp } = callbackData.xml;
      
      if (InfoType === 'suite_ticket') {
        this.logger.log(`收到suite_ticket: ${SuiteTicket}`);
        this.logger.log(`SuiteId: ${SuiteId}`);
        this.logger.log(`TimeStamp: ${TimeStamp}`);
        
        // 这里可以将suite_ticket存储到数据库或缓存中
        // 用于后续获取suite_access_token
        await this.storeSuiteTicket(SuiteId, SuiteTicket, TimeStamp);
      }
    } catch (error) {
      this.logger.error('处理suite_ticket时发生错误:', error);
      throw error;
    }
  }

  /**
   * 存储suite_ticket（示例实现）
   */
  private async storeSuiteTicket(suiteId: string, suiteTicket: string, timestamp: string): Promise<void> {
    // 这里应该实现实际的存储逻辑，比如存储到Redis或数据库
    this.logger.log(`存储suite_ticket - SuiteId: ${suiteId}, Ticket: ${suiteTicket}, Timestamp: ${timestamp}`);
    
    // 示例：可以存储到内存中（生产环境建议使用Redis）
    // await this.cacheService.set(`suite_ticket:${suiteId}`, suiteTicket, 600); // 10分钟过期
  }

  /**
   * 处理授权变更事件
   */
  async handleAuthChange(callbackData: any): Promise<void> {
    try {
      const { InfoType, AuthCorpId, SuiteId } = callbackData.xml;
      
      switch (InfoType) {
        case 'create_auth':
          this.logger.log(`企业授权应用 - AuthCorpId: ${AuthCorpId}, SuiteId: ${SuiteId}`);
          // 处理企业授权逻辑
          break;
        case 'cancel_auth':
          this.logger.log(`企业取消授权 - AuthCorpId: ${AuthCorpId}, SuiteId: ${SuiteId}`);
          // 处理取消授权逻辑
          break;
        case 'change_auth':
          this.logger.log(`企业变更授权 - AuthCorpId: ${AuthCorpId}, SuiteId: ${SuiteId}`);
          // 处理变更授权逻辑
          break;
        default:
          this.logger.warn(`未知的授权事件类型: ${InfoType}`);
      }
    } catch (error) {
      this.logger.error('处理授权变更事件时发生错误:', error);
      throw error;
    }
  }
} 
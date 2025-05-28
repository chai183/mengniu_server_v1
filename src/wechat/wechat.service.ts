import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from '@wecom/crypto';
import * as xml2js from 'xml2js';
import { CacheService } from '../cache/cache.service';
import axios from 'axios';

@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name);
  private readonly token: string;
  private readonly encodingAESKey: string;

  constructor(
    private configService: ConfigService,
    private cacheService: CacheService,
  ) {
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
   * 处理授权变更事件
   */
  async handleAuthChange(callbackData: any): Promise<void> {
    try {
      const { InfoType, AuthCorpId, SuiteId, AuthCode } = callbackData.xml;

      switch (InfoType) {
        case 'create_auth':
          this.logger.log(`企业授权应用 - AuthCorpId: ${AuthCorpId}, SuiteId: ${SuiteId}`);
          const permanentCode = await this.getPermanentCode(AuthCode);
          if (permanentCode) {
            // 授权成功，进行后续处理
          }
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

  /**
   * 存储suite_ticket
   */
  async storeSuiteTicket(suiteId: string, suiteTicket: string, timestamp: string): Promise<void> {
    try {
      // 存储到缓存中，设置10分钟过期
      await this.cacheService.set(`suite_ticket`, suiteTicket, 1700 * 1000);
      this.logger.log(`成功缓存suite_ticket - SuiteId: ${suiteId}, Ticket: ${suiteTicket}, Timestamp: ${timestamp}`);
    } catch (error) {
      this.logger.error('存储suite_ticket时发生错误:', error);
      throw error;
    }
  }

  /**
   * 获取suite_ticket
   */
  async getSuiteTicket(): Promise<string | null> {
    try {
      const ticket = await this.cacheService.get<string>('suite_ticket');
      if (!ticket) {
        this.logger.warn('缓存中未找到suite_ticket');
      }
      return ticket;
    } catch (error) {
      this.logger.error('获取suite_ticket时发生错误:', error);
      throw error;
    }
  }
  /**
   * 获取永久授权码
   */
  async getPermanentCode(authCode: string): Promise<string | null> {
    try {
      // 从缓存中获取 suite_access_token
      const suiteAccessToken = await this.cacheService.get<string>('suite_access_token');
      if (!suiteAccessToken) {
        this.logger.error('未找到suite_access_token');
        return null;
      }

      // 获取永久授权码
      const { data } = await axios.post(
        `https://qyapi.weixin.qq.com/cgi-bin/service/get_permanent_code?suite_access_token=${suiteAccessToken}`,
        { auth_code: authCode }
      );

      const { permanent_code, auth_corp_info } = data;

      if (permanent_code) {
        this.logger.log('获取永久授权码成功', permanent_code);
        // 将企业信息与永久授权码保存到缓存
        await this.savePermanentCode(auth_corp_info.corpid, permanent_code);
        // 保存应用ID
        if (auth_corp_info.auth_info && auth_corp_info.auth_info.agent && auth_corp_info.auth_info.agent.length > 0) {
          const agentId = auth_corp_info.auth_info.agent[0].agentid;
          await this.saveAgentId(auth_corp_info.corpid, agentId);
        }
        return permanent_code;
      } else {
        this.logger.error('获取永久授权码失败', data);
        return null;
      }
    } catch (error) {
      this.logger.error('获取永久授权码时发生错误:', error);
      return null;
    }
  }

  /**
   * 保存永久授权码
   */
  async savePermanentCode(corpId: string, permanentCode: string): Promise<void> {
    try {
      // 永久授权码不设置过期时间
      await this.cacheService.set(`permanent_code:${corpId}`, permanentCode);
      this.logger.log(`成功保存永久授权码 - CorpId: ${corpId}`);
    } catch (error) {
      this.logger.error('保存永久授权码时发生错误:', error);
      throw error;
    }
  }

  /**
   * 获取企业永久授权码
   */
  async getCorpPermanentCode(corpId: string): Promise<string | null> {
    try {
      const permanentCode = await this.cacheService.get<string>(`permanent_code:${corpId}`);
      if (!permanentCode) {
        this.logger.warn(`未找到企业(${corpId})的永久授权码`);
      }
      return permanentCode;
    } catch (error) {
      this.logger.error('获取企业永久授权码时发生错误:', error);
      throw error;
    }
  }

  /**
   * 保存应用ID
   * @param corpId 企业ID
   * @param agentId 应用ID
   */
  async saveAgentId(corpId: string, agentId: string): Promise<void> {
    try {
      // 应用ID不设置过期时间
      await this.cacheService.set(`agent_id:${corpId}`, agentId);
      this.logger.log(`成功保存应用ID - CorpId: ${corpId}, AgentId: ${agentId}`);
    } catch (error) {
      this.logger.error('保存应用ID时发生错误:', error);
      throw error;
    }
  }

  /**
   * 获取企业应用ID
   * @param corpId 企业ID
   * @returns 应用ID
   */
  async getAgentId(corpId: string): Promise<string | null> {
    try {
      const agentId = await this.cacheService.get<string>(`agent_id:${corpId}`);
      if (!agentId) {
        this.logger.warn(`未找到企业(${corpId})的应用ID`);
      }
      return agentId;
    } catch (error) {
      this.logger.error('获取企业应用ID时发生错误:', error);
      throw error;
    }
  }


  /**
   * 获取临时授权码
   */
  async getAuthCode(): Promise<string | null> {
    try {
      const authCode = await this.cacheService.get<string>('auth_code');
      if (!authCode) {
        this.logger.warn('未找到临时授权码');
      }
      return authCode;
    } catch (error) {
      this.logger.error('获取临时授权码时发生错误:', error);
      throw error;
    }
  }

  /**
   * 保存临时授权码
   */
  async saveAuthCode(authCode: string): Promise<void> {
    try {
      // 临时授权码有效期为10分钟
      await this.cacheService.set('auth_code', authCode, 600);
      this.logger.log('成功保存临时授权码');
    } catch (error) {
      this.logger.error('保存临时授权码时发生错误:', error);
      throw error;
    }
  }

  /**
   * 获取企业凭证
   * @param corpId 企业ID
   * @returns 企业凭证
   */
  async getCorpToken(corpId: string): Promise<string | null> {
    try {
      // 从缓存中获取永久授权码
      const permanentCode = await this.getCorpPermanentCode(corpId);
      if (!permanentCode) {
        this.logger.error(`未找到企业(${corpId})的永久授权码`);
        return null;
      }

      // 从缓存中获取 suite_access_token
      const suiteAccessToken = await this.cacheService.get<string>('suite_access_token');
      if (!suiteAccessToken) {
        this.logger.error('未找到suite_access_token');
        return null;
      }

      // 获取企业凭证
      const { data } = await axios.post(
        `https://qyapi.weixin.qq.com/cgi-bin/service/get_corp_token?suite_access_token=${suiteAccessToken}`,
        {
          permanent_code: permanentCode,
          auth_corpid: corpId
        }
      );

      const { access_token } = data;
      if (access_token) {
        this.logger.log(`获取企业(${corpId})凭证成功`);
        // 缓存企业凭证
        await this.saveCorpToken(corpId, access_token);
        return access_token;
      } else {
        this.logger.error(`获取企业(${corpId})凭证失败:`, data);
        return null;
      }
    } catch (error) {
      this.logger.error(`获取企业(${corpId})凭证时发生错误:`, error);
      return null;
    }
  }

  /**
   * 保存企业凭证
   * @param corpId 企业ID
   * @param accessToken 企业凭证
   */
  async saveCorpToken(corpId: string, accessToken: string): Promise<void> {
    try {
      // 企业凭证有效期为7200秒（2小时）
      await this.cacheService.set(`corp_token:${corpId}`, accessToken, 7200 * 1000);
      this.logger.log(`成功保存企业(${corpId})凭证`);
    } catch (error) {
      this.logger.error(`保存企业(${corpId})凭证时发生错误:`, error);
      throw error;
    }
  }

  /**
   * 获取企业凭证
   * @param corpId 企业ID
   * @returns 企业凭证
   */
  async getCorpAccessToken(corpId: string): Promise<string | null> {
    try {
      // 先从缓存中获取
      const accessToken = await this.cacheService.get<string>(`corp_token:${corpId}`);
      if (accessToken) {
        return accessToken;
      }

      // 缓存中没有，重新获取
      return await this.getCorpToken(corpId);
    } catch (error) {
      this.logger.error(`获取企业(${corpId})凭证时发生错误:`, error);
      throw error;
    }
  }

  /**
   * 向企业微信成员发送消息
   * @param corpId 企业ID
   * @param userId 用户ID
   * @param content 消息内容
   */
  async sendMessage(corpId: string, userId: string, content: string): Promise<boolean> {
    try {
      // 获取企业访问令牌
      const accessToken = await this.getCorpAccessToken(corpId);
      if (!accessToken) {
        this.logger.error(`获取企业(${corpId})访问令牌失败`);
        return false;
      }

      // 获取企业应用ID
      const agentId = await this.getAgentId(corpId);
      if (!agentId) {
        this.logger.error(`获取企业(${corpId})应用ID失败`);
        return false;
      }

      // 发送消息
      const { data } = await axios.post(
        `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`,
        {
          touser: userId,
          msgtype: 'text',
          agentid: agentId,
          text: {
            content: content
          }
        }
      );

      if (data.errcode) {
        this.logger.error(`发送消息失败: ${data.errmsg}`);
        return false;
      }

      this.logger.log(`成功向用户(${userId})发送消息`);
      return true;
    } catch (error) {
      this.logger.error('发送消息时发生错误:', error);
      return false;
    }
  }
} 
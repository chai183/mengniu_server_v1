import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from '@wecom/crypto';
import * as xml2js from 'xml2js';
import { CacheService } from '../cache/cache.service';
import axios from 'axios';
import { CorpService } from '../corp/corp.service';
import { createHash } from 'crypto';
import { WechatAuthService } from './wechat-auth.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name);
  private readonly token: string;
  private readonly encodingAESKey: string;

  constructor(
    private configService: ConfigService,
    private cacheService: CacheService,
    private corpService: CorpService,
    private wechatAuthService: WechatAuthService,
    private jwtService: JwtService,
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
  async getSuiteTicket(): Promise<string | undefined> {
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
      // 获取suite_access_token
      const suiteAccessToken = await this.wechatAuthService.getSuiteAccessToken();
      if (!suiteAccessToken) {
        this.logger.error('未找到suite_access_token');
        return null;
      }

      //  获取永久授权码
      const { data } = await axios.post(
        `https://qyapi.weixin.qq.com/cgi-bin/service/get_permanent_code?suite_access_token=${suiteAccessToken}`,
        { auth_code: authCode }
      );

      const { permanent_code, auth_corp_info, auth_info } = data;
      const { corpid } = auth_corp_info;
      const body = {
        corpid,
        permanentCode: permanent_code,
        agentid: auth_info.agent[0].agentid,
      }

      if (permanent_code) {
        this.logger.log('获取永久授权码成功', permanent_code);

        const corp = await this.corpService.findByCorpId(corpid);
        if (corp) {
          await this.corpService.update(corp.id, body);
        } else {
          await this.corpService.create(body);
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
   * 获取企业永久授权码
   */
  async getCorpPermanentCode(corpId: string): Promise<string | null> {
    try {
      const corp = await this.corpService.findByCorpId(corpId);
      if (!corp) {
        this.logger.warn(`未找到企业(${corpId})的永久授权码`);
        return null;
      }
      return corp.permanentCode;
    } catch (error) {
      this.logger.error('获取企业永久授权码时发生错误:', error);
      throw error;
    }
  }

  /**
   * 获取企业应用ID
   * @param corpId 企业ID
   * @returns 应用ID
   */
  async getAgentId(corpId: string): Promise<number | null> {
    try {
      const corp = await this.corpService.findByCorpId(corpId);
      if (!corp) {
        this.logger.warn(`未找到企业(${corpId})的应用ID`);
        return null;
      }
      return corp.agentid;
    } catch (error) {
      this.logger.error('获取企业应用ID时发生错误:', error);
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



  /**
   * 从企业微信服务器获取 jsapi_ticket
   * @param corpId 企业ID
   * @returns jsapi_ticket 和过期时间
   */
  private async fetchJsapiTicket(corpId: string): Promise<{ ticket: string; expiresIn: number } | null> {
    try {
      this.logger.log(`获取企业(${corpId})的jsapi_ticket`);
      // 获取企业访问令牌
      const accessToken = await this.getCorpAccessToken(corpId);
      if (!accessToken) {
        this.logger.error(`获取企业(${corpId})访问令牌失败`);
        return null;
      }

      // 请求jsapi_ticket
      const { data } = await axios.get(
        `https://qyapi.weixin.qq.com/cgi-bin/get_jsapi_ticket?access_token=${accessToken}`
      );

      if (data.errcode) {
        this.logger.error(`获取jsapi_ticket失败: ${data.errmsg}`);
        return null;
      }
      this.logger.log(`获取jsapi_ticket成功: ${data.ticket}`);
      return {
        ticket: data.ticket,
        expiresIn: data.expires_in
      };
    } catch (error) {
      this.logger.error('获取jsapi_ticket时发生错误:', error);
      return null;
    }
  }

  /**
   * 保存jsapi_ticket到缓存
   * @param corpId 企业ID
   * @param ticket jsapi_ticket
   * @param expiresIn 过期时间（秒）
   */
  private async saveJsapiTicket(corpId: string, ticket: string, expiresIn: number): Promise<void> {
    try {
      await this.cacheService.set(`jsapi_ticket:${corpId}`, ticket, expiresIn * 1000);
      this.logger.log(`成功保存企业(${corpId})的jsapi_ticket`);
    } catch (error) {
      this.logger.error(`保存企业(${corpId})的jsapi_ticket时发生错误:`, error);
      throw error;
    }
  }

  /**
   * 获取企业jsapi_ticket
   * @param corpId 企业ID
   * @returns jsapi_ticket
   */
  async getJsapiTicket(corpId: string): Promise<string | null> {
    try {
      // 先从缓存中获取
      const cachedTicket = await this.cacheService.get<string>(`jsapi_ticket:${corpId}`);
      if (cachedTicket) {
        this.logger.log(`从缓存中获取企业(${corpId})的jsapi_ticket: ${cachedTicket}`);
        return cachedTicket;
      }

      // 缓存中没有，重新获取
      const result = await this.fetchJsapiTicket(corpId);
      if (!result) {
        this.logger.error(`获取企业(${corpId})的jsapi_ticket失败`);
        return null;
      }

      // 保存到缓存
      await this.saveJsapiTicket(corpId, result.ticket, result.expiresIn);
      this.logger.log(`成功保存企业(${corpId})的jsapi_ticket: ${result.ticket}`);
      return result.ticket;
    } catch (error) {
      this.logger.error(`获取企业(${corpId})的jsapi_ticket时发生错误:`, error);
      return null;
    }
  }

  /**
   * 生成随机字符串
   * @param length 字符串长度，默认16位
   * @returns 随机字符串
   */
  private generateNonceStr(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let nonceStr = '';
    for (let i = 0; i < length; i++) {
      nonceStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return nonceStr;
  }

  /**
   * 生成JS-SDK配置签名
   * @param corpId 企业ID
   * @param url 当前网页的URL，不包含#及其后面部分
   * @returns 签名配置信息
   */
  async getJssdkConfig(corpId: string, url: string): Promise<{
    signature: string;
    nonceStr: string;
    timestamp: number;
    url: string;
  } | null> {
    try {
      // 获取jsapi_ticket
      const jsapiTicket = await this.getJsapiTicket(corpId);
      if (!jsapiTicket) {
        this.logger.error(`获取企业(${corpId})的jsapi_ticket失败`);
        return null;
      }

      // 生成签名所需参数
      const nonceStr = this.generateNonceStr();
      const timestamp = Math.floor(Date.now() / 1000);

      // 按照字典序排序并拼接参数
      const str = [
        `jsapi_ticket=${jsapiTicket}`,
        `noncestr=${nonceStr}`,
        `timestamp=${timestamp}`,
        `url=${url}`
      ].join('&');

      // 使用SHA-1进行签名
      const signature = createHash('sha1').update(str).digest('hex');

      this.logger.log(`生成JS-SDK签名成功 - 企业ID: ${corpId}, URL: ${url}`);
      this.logger.log(`签名字符串: ${str}`);
      this.logger.log(`签名结果: ${signature}`);

      return {
        signature,
        nonceStr,
        timestamp,
        url
      };
    } catch (error) {
      this.logger.error(`生成JS-SDK签名时发生错误:`, error);
      return null;
    }
  }

  /**
   * 从企业微信服务器获取应用 jsapi_ticket
   * @param corpId 企业ID
   * @returns jsapi_ticket 和过期时间
   */
  private async fetchAgentJsapiTicket(corpId: string): Promise<{ ticket: string; expiresIn: number } | null> {
    try {
      this.logger.log(`获取企业(${corpId})的应用jsapi_ticket`);
      // 获取企业访问令牌
      const accessToken = await this.getCorpAccessToken(corpId);
      if (!accessToken) {
        this.logger.error(`获取企业(${corpId})访问令牌失败`);
        return null;
      }

      // 请求应用jsapi_ticket
      const { data } = await axios.get(
        `https://qyapi.weixin.qq.com/cgi-bin/ticket/get?access_token=${accessToken}&type=agent_config`
      );

      if (data.errcode) {
        this.logger.error(`获取应用jsapi_ticket失败: ${data.errmsg}`);
        return null;
      }

      this.logger.log(`获取应用jsapi_ticket成功: ${data.ticket}`);
      return {
        ticket: data.ticket,
        expiresIn: data.expires_in
      };
    } catch (error) {
      this.logger.error('获取应用jsapi_ticket时发生错误:', error);
      return null;
    }
  }

  /**
   * 保存应用jsapi_ticket到缓存
   * @param corpId 企业ID
   * @param ticket jsapi_ticket
   * @param expiresIn 过期时间（秒）
   */
  private async saveAgentJsapiTicket(corpId: string, ticket: string, expiresIn: number): Promise<void> {
    try {
      await this.cacheService.set(`agent_jsapi_ticket:${corpId}`, ticket, expiresIn * 1000);
      this.logger.log(`成功保存企业(${corpId})的应用jsapi_ticket: ${ticket}`);
    } catch (error) {
      this.logger.error(`保存企业(${corpId})的应用jsapi_ticket时发生错误:`, error);
      throw error;
    }
  }

  /**
   * 获取企业应用jsapi_ticket
   * @param corpId 企业ID
   * @returns jsapi_ticket
   */
  async getAgentJsapiTicket(corpId: string): Promise<string | null> {
    try {
      // 先从缓存中获取
      const cachedTicket = await this.cacheService.get<string>(`agent_jsapi_ticket:${corpId}`);
      if (cachedTicket) {
        this.logger.log(`从缓存中获取企业(${corpId})的应用jsapi_ticket: ${cachedTicket}`);
        return cachedTicket;
      }

      // 缓存中没有，重新获取
      const result = await this.fetchAgentJsapiTicket(corpId);
      if (!result) {
        this.logger.error(`获取企业(${corpId})的应用jsapi_ticket失败`);
        return null;
      }

      // 保存到缓存
      await this.saveAgentJsapiTicket(corpId, result.ticket, result.expiresIn);
      return result.ticket;
    } catch (error) {
      this.logger.error(`获取企业(${corpId})的应用jsapi_ticket时发生错误:`, error);
      return null;
    }
  }

  /**
   * 生成应用JS-SDK配置签名
   * @param corpId 企业ID
   * @param url 当前网页的URL，不包含#及其后面部分
   * @returns 签名配置信息
   */
  async getAgentJssdkConfig(corpId: string, url: string): Promise<{
    signature: string;
    nonceStr: string;
    timestamp: number;
    url: string;
  } | null> {
    try {
      // 获取应用jsapi_ticket
      const jsapiTicket = await this.getAgentJsapiTicket(corpId);
      if (!jsapiTicket) {
        this.logger.error(`获取企业(${corpId})的应用jsapi_ticket失败`);
        return null;
      }

      // 生成签名所需参数
      const nonceStr = this.generateNonceStr();
      const timestamp = Math.floor(Date.now() / 1000);

      // 按照字典序排序并拼接参数
      const str = [
        `jsapi_ticket=${jsapiTicket}`,
        `noncestr=${nonceStr}`,
        `timestamp=${timestamp}`,
        `url=${url}`
      ].join('&');

      // 使用SHA-1进行签名
      const signature = createHash('sha1').update(str).digest('hex');

      this.logger.log(`生成应用JS-SDK签名成功 - 企业ID: ${corpId}, URL: ${url}`);
      this.logger.log(`签名字符串: ${str}`);
      this.logger.log(`签名结果: ${signature}`);

      return {
        signature,
        nonceStr,
        timestamp,
        url
      };
    } catch (error) {
      this.logger.error(`生成应用JS-SDK签名时发生错误:`, error);
      return null;
    }
  }

  /**
   * 从企业微信服务器获取 access_token
   * @returns access_token 和过期时间
   */
  private async fetchAccessToken(): Promise<{ accessToken: string; expiresIn: number } | null> {
    try {
      this.logger.log('获取企业微信 access_token');
      const corpId = this.configService.get<string>('wecom.corpId');
      const corpSecret = this.configService.get<string>('wecom.corpSecret');

      const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpId}&corpsecret=${corpSecret}`;
      const { data } = await axios.get(url);

      if (data.errcode !== 0) {
        this.logger.error(`获取 access_token 失败: ${data.errmsg}`);
        return null;
      }

      this.logger.log('获取 access_token 成功');
      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in
      };
    } catch (error) {
      this.logger.error('获取 access_token 时发生错误:', error);
      return null;
    }
  }

  /**
   * 保存 access_token 到缓存
   * @param accessToken access_token
   * @param expiresIn 过期时间（秒）
   */
  private async saveAccessToken(accessToken: string, expiresIn: number): Promise<void> {
    try {
      // 提前5分钟过期，避免临界点问题
      const expireTime = (expiresIn - 300) * 1000;
      await this.cacheService.set('wecom_access_token', accessToken, expireTime);
      this.logger.log('成功保存 access_token 到缓存');
    } catch (error) {
      this.logger.error('保存 access_token 到缓存时发生错误:', error);
      throw error;
    }
  }

  /**
   * 获取企业微信 access_token
   * @returns access_token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      // 先从缓存中获取
      const cachedToken = await this.cacheService.get<string>('wecom_access_token');
      if (cachedToken) {
        this.logger.log('从缓存中获取 access_token 成功');
        return cachedToken;
      }

      // 缓存中没有，重新获取
      const result = await this.fetchAccessToken();
      if (!result) {
        this.logger.error('获取 access_token 失败');
        return null;
      }

      // 保存到缓存
      await this.saveAccessToken(result.accessToken, result.expiresIn);
      return result.accessToken;
    } catch (error) {
      this.logger.error('获取 access_token 时发生错误:', error);
      return null;
    }
  }

  async jscode2session(code: string): Promise<any> {
    const accessToken = await this.getAccessToken();
    const url = `https://qyapi.weixin.qq.com/cgi-bin/miniprogram/jscode2session?access_token=${accessToken}&js_code=${code}&grant_type=authorization_code`;
    const response = await axios.get(url);
    if (response.data.errcode) {
      throw new HttpException(`微信登录失败: ${response.data.errmsg}`, HttpStatus.BAD_REQUEST);
    }
    return response.data;
  }

  /**
   * 企业微信登录
   * @param code 登录凭证
   * @returns 登录结果
   */
  async login(code: string): Promise<any> {
    const { userid } = await this.jscode2session(code);

    const token = this.jwtService.sign({ userid }, {
      expiresIn: '3650d'
    });

    return { token };
  }

  /**
   * 获取客户详情
   * @param externalUserId 外部联系人的userid
   * @param cursor 分页游标
   * @returns 客户详情信息
   */
  async getExternalContact(externalUserId: string, cursor?: string): Promise<any> {
    try {
      this.logger.log(`获取外部联系人(${externalUserId})详情`);

      // 获取访问令牌
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        this.logger.error('获取访问令牌失败');
        throw new HttpException('获取访问令牌失败', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      // 构建请求URL
      let url = `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/get?access_token=${accessToken}&external_userid=${externalUserId}`;
      if (cursor) {
        url += `&cursor=${cursor}`;
      }

      // 发送请求
      const { data } = await axios.get(url);

      if (data.errcode !== 0) {
        this.logger.error(`获取客户详情失败: ${data.errmsg}`);
        throw new HttpException(`获取客户详情失败: ${data.errmsg}`, HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`成功获取外部联系人(${externalUserId})详情`);
      return data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('获取客户详情时发生错误:', error);
      throw new HttpException('获取客户详情失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

} 
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from '@wecom/crypto';
import * as xml2js from 'xml2js';
import { CacheService } from '../cache/cache.service';
import axios from 'axios';
import { CorpService } from '../corp/corp.service';
import { createHash, createDecipheriv } from 'crypto';
import { WechatAuthService } from './wechat-auth.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { CustomerService } from '../customer/customer.service';

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
    private userService: UserService,
    private customerService: CustomerService,
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

    return { token, userid };
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

  /**
   * 批量获取客户详情
   * @param useridList 企业成员的userid列表，最多支持100个
   * @param cursor 用于分页查询的游标，首次调用可不填
   * @param limit 返回的最大记录数，最大值100，默认值50
   * @returns 客户详情列表
   */
  async batchGetExternalContacts(
    useridList: string[],
    cursor?: string,
    limit: number = 100
  ): Promise<any> {
    try {
      this.logger.log(`批量获取客户详情 - 用户列表: ${useridList.join(',')}, 游标: ${cursor}, 限制: ${limit}`);

      // 参数验证
      if (!useridList || useridList.length === 0) {
        throw new HttpException('用户列表不能为空', HttpStatus.BAD_REQUEST);
      }

      if (useridList.length > 100) {
        throw new HttpException('用户列表最多支持100个', HttpStatus.BAD_REQUEST);
      }

      if (limit > 100) {
        limit = 100;
        this.logger.warn('限制数量超过最大值100，已自动调整为100');
      }

      // 获取访问令牌
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        this.logger.error('获取访问令牌失败');
        throw new HttpException('获取访问令牌失败', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      // 构建请求体
      const requestBody: any = {
        userid_list: useridList,
        limit: limit
      };

      if (cursor) {
        requestBody.cursor = cursor;
      }
      // 发送请求
      const { data } = await axios.post(
        `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/batch/get_by_user?access_token=${accessToken}`,
        requestBody
      );

      if (data.errcode !== 0) {
        this.logger.error(`批量获取客户详情失败: ${data.errmsg}`);
        throw new HttpException(`批量获取客户详情失败: ${data.errmsg}`, HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`成功批量获取客户详情，返回 ${data.external_contact_list?.length || 0} 条记录`);

      // 记录失败信息
      if (data.fail_info?.unlicensed_userid_list?.length > 0) {
        this.logger.warn(`部分用户无有效互通许可: ${data.fail_info.unlicensed_userid_list.join(',')}`);
      }

      return {
        externalContactList: data.external_contact_list || [],
        nextCursor: data.next_cursor || '',
        failInfo: data.fail_info || null,
        totalCount: data.external_contact_list?.length || 0
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('批量获取客户详情时发生错误:', error);
      throw new HttpException('批量获取客户详情失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 分页批量获取客户详情
   * @param useridList 企业成员的userid列表，最多支持100个
   * @param limit 每页返回的最大记录数，最大值100，默认值50
   * @returns 所有客户详情列表
   */
  async getAllExternalContacts(useridList: string[], limit: number = 100): Promise<any[]> {
    try {
      this.logger.log(`开始分页获取所有客户详情 - 用户列表: ${useridList.join(',')}`);

      const allContacts: any[] = [];
      let cursor = '';
      let hasMore = true;
      let pageCount = 0;

      while (hasMore) {
        pageCount++;
        this.logger.log(`正在获取第 ${pageCount} 页数据...`);

        const result = await this.batchGetExternalContacts(useridList, cursor, limit);

        if (result.externalContactList && result.externalContactList.length > 0) {
          allContacts.push(...result.externalContactList);
          this.logger.log(`第 ${pageCount} 页获取到 ${result.externalContactList.length} 条记录`);
        }

        // 检查是否还有更多数据
        if (result.nextCursor && result.nextCursor.trim() !== '') {
          cursor = result.nextCursor;
        } else {
          hasMore = false;
          this.logger.log('已获取所有数据，分页结束');
        }
      }

      this.logger.log(`分页获取完成，总共获取到 ${allContacts.length} 条客户记录`);
      return allContacts;
    } catch (error) {
      this.logger.error('分页批量获取客户详情时发生错误:', error);
      throw error;
    }
  }

  //获取部门列表
  async getDepartmentList(): Promise<any[]> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        this.logger.error('获取访问令牌失败');
        throw new HttpException('获取访问令牌失败', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const url = `https://qyapi.weixin.qq.com/cgi-bin/department/list?access_token=${accessToken}`;
      const { data } = await axios.get(url);
      console.log(data);
      return data;
    } catch (error) {
      this.logger.error('获取部门列表时发生错误:', error);
      throw new HttpException('获取部门列表失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  //获取成员ID列表
  async getUserList(): Promise<any> {
    try {
      console.log('getUserList');
      const corpId = this.configService.get<string>('wecom.corpId');
      const corpSecret = 'xaeez8VpII131cP_C6jVJ7IbCqw0zeCI5jEuhpHjB-g';
      const res = await axios.get(`https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpId}&corpsecret=${corpSecret}`);
      console.log(res.data);
      const url = `https://qyapi.weixin.qq.com/cgi-bin/user/list_id?access_token=${res.data.access_token}`;
      const { data } = await axios.get(url);
      const userList: any = [];
      const userids = new Set(data.dept_user.map(el => el.userid));
      for (const userid of userids) {
        const { errcode, ...rest } = await this.getUserInfo(userid as string);
        if (errcode === 0) {
          userList.push(rest);
        }
      }
      const external_contact_list = await this.getAllExternalContacts(Array.from(userids) as string[]);
      const result1 = await this.customerService.batchCreateFromExternalContacts(external_contact_list.map(el => ({
        ...el.external_contact,
        userid: el.external_contact.external_userid,
        followUserids: [el.follow_info.userid],
        mobiles: el.follow_info.mobile,
        remark_name: el.follow_info.remark,
        remark_corp_name: el.follow_info.remark_corp_name
      })));
      const result2 = await this.userService.createBatch(userList);
      return {
        success: true,
        customerResult: result1,
        userResult: result2
      };
    } catch (error) {
      this.logger.error('获取部门列表时发生错误:', error);
      throw new HttpException('获取部门列表失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  //获取成员信息;
  async getUserInfo(userid: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        this.logger.error('获取访问令牌失败');
        throw new HttpException('获取访问令牌失败', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      const url = `https://qyapi.weixin.qq.com/cgi-bin/user/get?access_token=${accessToken}&userid=${userid}`;
      const { data } = await axios.get(url);
      return data;
    } catch (error) {
      this.logger.error('获取成员信息时发生错误:', error);
      throw new HttpException('获取成员信息失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  //获取客户列表
  async getCustomerList(userid: string): Promise<any[]> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        this.logger.error('获取访问令牌失败');
        throw new HttpException('获取访问令牌失败', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      const url = `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/list?access_token=${accessToken}&userid=${userid}`;
      const { data } = await axios.get(url);
      return data.external_userid;
    } catch (error) {
      this.logger.error('获取客户列表时发生错误:', error);
      throw new HttpException('获取客户列表失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 导出成员
   * @param encodingAesKey Base64编码后的加密密钥，长度固定为43
   * @param blockSize 每块数据的人员数，支持范围[104,106]，默认值为106
   * @returns 导出任务ID
   */
  async exportSimpleUser(): Promise<string> {
    try {
      this.logger.log('开始导出成员数据');

      // 获取访问令牌
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        this.logger.error('获取访问令牌失败');
        throw new HttpException('获取访问令牌失败', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      // 构建请求体
      const requestBody = {
        encoding_aeskey: this.configService.get<string>('wechat.encodingAesKey')
      };

      // 发送导出请求
      const { data } = await axios.post(
        `https://qyapi.weixin.qq.com/cgi-bin/export/user?access_token=${accessToken}`,
        requestBody
      );

      if (data.errcode !== 0) {
        this.logger.error(`导出成员失败: ${data.errmsg}`);
        throw new HttpException(`导出成员失败: ${data.errmsg}`, HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`导出成员任务创建成功，任务ID: ${data.jobid}`);
      return data.jobid;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('导出成员时发生错误:', error);
      throw new HttpException('导出成员失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 获取导出结果
   * @param jobid 导出任务ID
   * @returns 导出结果信息
   */
  async getExportResult(jobid: string): Promise<any> {
    try {
      this.logger.log(`获取导出结果 - 任务ID: ${jobid}`);

      // 获取访问令牌
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        this.logger.error('获取访问令牌失败');
        throw new HttpException('获取访问令牌失败', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      // 发送获取结果请求
      const { data } = await axios.get(
        `https://qyapi.weixin.qq.com/cgi-bin/export/get_result?access_token=${accessToken}&jobid=${jobid}`
      );
      const url = data.data_list[0].url;
      const { data: data2 } = await axios.get(url, {
        responseType: 'arraybuffer'
      });
      const decryptedData = await this.decryptExportData(Buffer.from(data2));

      const userResult = await this.userService.createBatch(decryptedData.userlist);

      const external_contact_list = await this.getAllExternalContacts(decryptedData.userlist.map(el => el.userid));
      const customerResult = await this.customerService.batchCreateFromExternalContacts(external_contact_list.map(el => ({
        ...el.external_contact,
        userid: el.external_contact.external_userid,
        followUserids: [el.follow_info.userid],
        mobiles: el.follow_info.mobile,
        remark_name: el.follow_info.remark,
        remark_corp_name: el.follow_info.remark_corp_name
      })));

      if (data.errcode !== 0) {
        this.logger.error(`获取导出结果失败: ${data.errmsg}`);
        throw new HttpException(`获取导出结果失败: ${data.errmsg}`, HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`成功获取导出结果 - 任务ID: ${jobid}, 状态: ${data.status}`);
      console.log(customerResult, userResult);
      return {
        success: true,
        customerResult,
        userResult
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('获取导出结果时发生错误:', error);
      throw new HttpException('获取导出结果失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
  }

  /**
   * 解密企业微信导出的数据
   * @param encryptedData 加密的字节数据
   * @returns 解密后的数据
   */
  async decryptExportData(encryptedData: Buffer): Promise<any> {
    try {
      this.logger.log('开始解密企业微信导出数据');

      // 获取配置中的encodingAESKey
      const encodingAESKey = this.configService.get<string>('wechat.encodingAesKey');
      if (!encodingAESKey) {
        throw new HttpException('未配置encodingAESKey', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      // 获取 key - 需要加上 = 进行Base64解码
      const keyWithPadding = encodingAESKey + '=';
      const aesKey = Buffer.from(keyWithPadding, 'base64');
      
      if (aesKey.length !== 32) {
        throw new HttpException('AESKey长度不正确', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      // 获取 iv - 使用密钥的前16字节
      const iv = aesKey.slice(0, 16);

      // 使用crypto模块进行AES-256-CBC解密，不填充
      const decipher = createDecipheriv('aes-256-cbc', aesKey, iv);
      decipher.setAutoPadding(false);

      // 解密数据
      let decrypted = decipher.update(encryptedData, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      // 移除PKCS7填充
      const paddingLength = decrypted.charCodeAt(decrypted.length - 1);
      if (paddingLength > 0 && paddingLength <= 16) {
        decrypted = decrypted.slice(0, -paddingLength);
      }
      return JSON.parse(decrypted);
    } catch (error) {
      this.logger.error('解密企业微信导出数据时发生错误:', error);
      throw new HttpException('解密数据失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

} 
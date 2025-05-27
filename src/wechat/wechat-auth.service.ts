import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { WechatService } from './wechat.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class WechatAuthService {
  private readonly logger = new Logger(WechatAuthService.name);
  private readonly suiteId: string;
  private readonly suiteSecret: string;
  public readonly redirectUri: string;

  constructor(
    private configService: ConfigService,
    private wechatService: WechatService,
    private cacheService: CacheService,
  ) {
    this.suiteId = this.configService.get<string>('wechat.suiteId') || '';
    this.suiteSecret = this.configService.get<string>('wechat.suiteSecret') || '';
    this.redirectUri = this.configService.get<string>('wechat.redirectUri') || '';
  }

  /**
   * 生成企业微信扫码登录URL
   */
  generateQRCodeLoginUrl(state?: string): string {
    const params = new URLSearchParams({
      appid: this.suiteId,
      redirect_uri: encodeURIComponent(this.redirectUri),
      response_type: 'code',
      scope: 'snsapi_base',
      state: state || 'STATE',
    });

    const loginUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`;
    
    this.logger.log(`生成扫码登录URL: ${loginUrl}`);
    return loginUrl;
  }

  /**
   * 获取suite_access_token
   * 有效期为2小时，会自动缓存
   */
  async getSuiteAccessToken(): Promise<string> {
    try {
      // 先尝试从缓存获取
      const cachedToken = await this.cacheService.get<string>('suite_access_token');
      if (cachedToken) {
        this.logger.log('从缓存获取suite_access_token成功');
        return cachedToken;
      }

      // 缓存不存在，重新获取
      const suiteTicket = await this.wechatService.getSuiteTicket();
      if (!suiteTicket) {
        throw new Error('未找到有效的suite_ticket');
      }

      const url = 'https://qyapi.weixin.qq.com/cgi-bin/service/get_suite_token';
      const data = {
        suite_id: this.suiteId,
        suite_secret: this.suiteSecret,
        suite_ticket: suiteTicket,
      };

      const response = await axios.post(url, data);
      
      if (response.data.errcode === 0) {
        const suiteAccessToken = response.data.suite_access_token;
        // 缓存suite_access_token，有效期设为7000秒（2小时减少一些余量）
        await this.cacheService.set('suite_access_token', suiteAccessToken, 7000 * 1000);
        this.logger.log('获取并缓存suite_access_token成功');
        return suiteAccessToken;
      } else {
        throw new Error(`获取suite_access_token失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      this.logger.error('获取suite_access_token时发生错误:', error);
      throw error;
    }
  }

  /**
   * 获取预授权码
   */
  async getPreAuthCode(suiteAccessToken: string): Promise<string> {
    try {
      const url = `https://qyapi.weixin.qq.com/cgi-bin/service/get_pre_auth_code?suite_access_token=${suiteAccessToken}`;
      const data = {
        suite_id: this.suiteId,
      };

      const response = await axios.post(url, data);
      
      if (response.data.errcode === 0) {
        this.logger.log('获取预授权码成功');
        return response.data.pre_auth_code;
      } else {
        throw new Error(`获取预授权码失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      this.logger.error('获取预授权码时发生错误:', error);
      throw error;
    }
  }

  /**
   * 生成授权安装链接
   */
  generateAuthInstallUrl(preAuthCode: string, state?: string): string {
    const params = new URLSearchParams({
      suite_id: this.suiteId,
      pre_auth_code: preAuthCode,
      redirect_uri: encodeURIComponent(this.redirectUri),
      state: state || 'STATE',
    });

    const installUrl = `https://open.work.weixin.qq.com/3rdapp/install?${params.toString()}`;
    
    this.logger.log(`生成授权安装链接: ${installUrl}`);
    return installUrl;
  }

  /**
   * 获取企业永久授权码
   */
  async getPermanentCode(suiteAccessToken: string, authCode: string): Promise<any> {
    try {
      const url = `https://qyapi.weixin.qq.com/cgi-bin/service/get_permanent_code?suite_access_token=${suiteAccessToken}`;
      const data = {
        auth_code: authCode,
      };

      const response = await axios.post(url, data);
      
      if (response.data.errcode === 0) {
        this.logger.log('获取企业永久授权码成功');
        return {
          access_token: response.data.access_token,
          permanent_code: response.data.permanent_code,
          auth_corp_info: response.data.auth_corp_info,
          auth_info: response.data.auth_info,
        };
      } else {
        throw new Error(`获取企业永久授权码失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      this.logger.error('获取企业永久授权码时发生错误:', error);
      throw error;
    }
  }

  /**
   * 获取企业access_token
   */
  async getCorpAccessToken(suiteAccessToken: string, authCorpId: string, permanentCode: string): Promise<string> {
    try {
      const url = `https://qyapi.weixin.qq.com/cgi-bin/service/get_corp_token?suite_access_token=${suiteAccessToken}`;
      const data = {
        auth_corpid: authCorpId,
        permanent_code: permanentCode,
      };

      const response = await axios.post(url, data);
      
      if (response.data.errcode === 0) {
        this.logger.log('获取企业access_token成功');
        return response.data.access_token;
      } else {
        throw new Error(`获取企业access_token失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      this.logger.error('获取企业access_token时发生错误:', error);
      throw error;
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(accessToken: string, code: string): Promise<any> {
    try {
      const url = `https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo?access_token=${accessToken}&code=${code}`;
      
      const response = await axios.get(url);
      
      if (response.data.errcode === 0) {
        this.logger.log('获取用户信息成功');
        return response.data;
      } else {
        throw new Error(`获取用户信息失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      this.logger.error('获取用户信息时发生错误:', error);
      throw error;
    }
  }

  /**
   * 获取用户详细信息
   */
  async getUserDetail(accessToken: string, userId: string): Promise<any> {
    try {
      const url = `https://qyapi.weixin.qq.com/cgi-bin/user/get?access_token=${accessToken}&userid=${userId}`;
      
      const response = await axios.get(url);
      
      if (response.data.errcode === 0) {
        this.logger.log('获取用户详细信息成功');
        return response.data;
      } else {
        throw new Error(`获取用户详细信息失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      this.logger.error('获取用户详细信息时发生错误:', error);
      throw error;
    }
  }

  /**
   * 获取第三方应用访问用户身份信息
   */
  async getUserInfo3rd(suiteAccessToken: string, code: string): Promise<any> {
    try {
      const url = `https://qyapi.weixin.qq.com/cgi-bin/service/getuserinfo3rd?suite_access_token=${suiteAccessToken}&code=${code}`;
      
      const response = await axios.get(url);
      
      if (response.data.errcode === 0) {
        this.logger.log('获取第三方应用访问用户身份信息成功');
        return response.data;
      } else {
        throw new Error(`获取第三方应用访问用户身份信息失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      this.logger.error('获取第三方应用访问用户身份信息时发生错误:', error);
      throw error;
    }
  }

  /**
   * 获取第三方应用访问用户敏感信息
   */
  async getUserDetailBySuiteToken(suiteAccessToken: string, userId: string, corpId: string): Promise<any> {
    try {
      const url = `https://qyapi.weixin.qq.com/cgi-bin/service/getuserdetail3rd?suite_access_token=${suiteAccessToken}`;
      
      const data = {
        user_ticket: userId,
        userid: userId,
        corpid: corpId
      };

      const response = await axios.post(url, data);
      
      if (response.data.errcode === 0) {
        this.logger.log('获取第三方应用访问用户敏感信息成功');
        return response.data;
      } else {
        throw new Error(`获取第三方应用访问用户敏感信息失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      this.logger.error('获取第三方应用访问用户敏感信息时发生错误:', error);
      throw error;
    }
  }

  /**
   * 生成应用主页授权链接
   */
  generateAppHomeUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      appid: this.suiteId,
      redirect_uri: encodeURIComponent(redirectUri),
      response_type: 'code',
      scope: 'snsapi_userinfo',
      state: state || 'STATE',
    });

    const loginUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`;
    
    this.logger.log(`生成应用主页授权链接: ${loginUrl}`);
    return loginUrl;
  }
} 
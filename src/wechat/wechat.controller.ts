import { Controller, Get, Post, Query, Req, Res, Logger, HttpStatus, Body } from '@nestjs/common';
import { Request, Response } from 'express';
import { WechatService } from './wechat.service';
import { WechatAuthService } from './wechat-auth.service';
import * as getRawBody from 'raw-body';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CorpService } from '../corp/corp.service';

@Controller('wechat')
export class WechatController {
  private readonly logger = new Logger(WechatController.name);

  constructor(
    private readonly wechatService: WechatService,
    private readonly wechatAuthService: WechatAuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly corpService: CorpService,
  ) { }


  @Post('login')
  async login(@Body() body: { code: string }) {
    return this.wechatService.login(body.code);
  }

  /**
   * 数据回调URL验证 - GET请求
   * 用于验证回调URL的有效性
   */
  @Get('callback/data')
  async validateDataCallback(
    @Query('msg_signature') msgSignature: string,
    @Query('timestamp') timestamp: string,
    @Query('nonce') nonce: string,
    @Query('echostr') echostr: string,
    @Res() res: Response,
  ) {
    this.logger.log('收到数据回调URL验证请求');
    this.logger.log(`参数: msg_signature=${msgSignature}, timestamp=${timestamp}, nonce=${nonce}, echostr=${echostr}`);

    try {
      const message = this.wechatService.validateCallback(msgSignature, timestamp, nonce, echostr);

      if (message) {
        this.logger.log('数据回调URL验证成功');
        res.status(HttpStatus.OK).send(message);
      } else {
        this.logger.error('数据回调URL验证失败');
        res.status(HttpStatus.UNAUTHORIZED).send('验证失败');
      }
    } catch (error) {
      this.logger.error('数据回调URL验证时发生错误:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('服务器错误');
    }
  }

  /**
   * 指令回调URL验证 - GET请求
   * 用于验证回调URL的有效性
   */
  @Get('callback/command')
  async validateCommandCallback(
    @Query('msg_signature') msgSignature: string,
    @Query('timestamp') timestamp: string,
    @Query('nonce') nonce: string,
    @Query('echostr') echostr: string,
    @Res() res: Response,
  ) {
    this.logger.log('收到指令回调URL验证请求');
    this.logger.log(`参数: msg_signature=${msgSignature}, timestamp=${timestamp}, nonce=${nonce}, echostr=${echostr}`);

    try {
      const message = this.wechatService.validateCallback(msgSignature, timestamp, nonce, echostr);

      if (message) {
        this.logger.log('指令回调URL验证成功');
        res.status(HttpStatus.OK).send(message);
      } else {
        this.logger.error('指令回调URL验证失败');
        res.status(HttpStatus.UNAUTHORIZED).send('验证失败');
      }
    } catch (error) {
      this.logger.error('指令回调URL验证时发生错误:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('服务器错误');
    }
  }

  /**
   * 数据回调 - POST请求
   * 接收用户消息、进入应用事件、通讯录变更事件等
   */
  @Post('callback/data')
  async handleDataCallback(
    @Query('msg_signature') msgSignature: string,
    @Query('timestamp') timestamp: string,
    @Query('nonce') nonce: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    this.logger.log('收到数据回调POST请求');

    try {
      // 获取原始XML数据
      const xmlBody = await getRawBody(req, {
        length: req.headers['content-length'],
        limit: '1mb',
        encoding: 'utf-8',
      });

      this.logger.log(`接收到的XML数据: ${xmlBody}`);

      // 处理回调数据
      const callbackData = await this.wechatService.handlePostCallback(
        msgSignature,
        timestamp,
        nonce,
        xmlBody.toString(),
      );

      // 根据回调类型进行不同处理
      await this.processDataCallback(callbackData);

      // 响应成功
      res.status(HttpStatus.OK).send('success');
    } catch (error) {
      this.logger.error('处理数据回调时发生错误:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('error');
    }
  }

  /**
   * 指令回调 - POST请求
   * 接收应用授权变更事件和suite_ticket
   */
  @Post('callback/command')
  async handleCommandCallback(
    @Query('msg_signature') msgSignature: string,
    @Query('timestamp') timestamp: string,
    @Query('nonce') nonce: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    this.logger.log('收到指令回调POST请求');

    try {
      // 获取原始XML数据
      const xmlBody = await getRawBody(req, {
        length: req.headers['content-length'],
        limit: '1mb',
        encoding: 'utf-8',
      });

      this.logger.log(`接收到的XML数据: ${xmlBody}`);

      // 处理回调数据
      const callbackData = await this.wechatService.handlePostCallback(
        msgSignature,
        timestamp,
        nonce,
        xmlBody.toString(),
      );

      // 根据回调类型进行不同处理
      await this.processCommandCallback(callbackData);

      // 响应成功
      res.status(HttpStatus.OK).send('success');
    } catch (error) {
      this.logger.error('处理指令回调时发生错误:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('error');
    }
  }

  /**
   * 处理数据回调的具体逻辑
   */
  private async processDataCallback(callbackData: any): Promise<void> {
    try {
      const { MsgType, Event } = callbackData.xml || {};

      this.logger.log(`数据回调类型: MsgType=${MsgType}, Event=${Event}`);

      // 根据消息类型和事件类型进行处理
      switch (MsgType) {
        case 'text':
          // 处理文本消息
          this.logger.log('收到文本消息:', callbackData.xml.Content);
          break;
        case 'event':
          await this.handleEvent(callbackData);
          break;
        default:
          this.logger.log(`未处理的消息类型: ${MsgType}`);
      }
    } catch (error) {
      this.logger.error('处理数据回调逻辑时发生错误:', error);
    }
  }

  /**
   * 处理指令回调的具体逻辑
   */
  private async processCommandCallback(callbackData: any): Promise<void> {
    try {
      const { InfoType } = callbackData.xml || {};

      this.logger.log(`指令回调类型: InfoType=${InfoType}`);

      switch (InfoType) {
        case 'suite_ticket':
          // 处理suite_ticket
          await this.wechatService.handleSuiteTicket(callbackData);
          break;
        case 'create_auth':
        case 'cancel_auth':
        case 'change_auth':
          // 处理授权变更事件
          await this.wechatService.handleAuthChange(callbackData);
          break;
        default:
          this.logger.log(`未处理的指令类型: ${InfoType}`);
      }
    } catch (error) {
      this.logger.error('处理指令回调逻辑时发生错误:', error);
    }
  }

  /**
   * 处理事件类型的消息
   */
  private async handleEvent(callbackData: any): Promise<void> {
    try {
      const { Event, EventKey, BatchJob } = callbackData.xml;

      switch (Event) {
        case 'enter_agent':
          this.logger.log('用户进入应用');
          break;
        case 'menu_click':
          this.logger.log(`菜单点击事件: ${EventKey}`);
          break;
        case 'subscribe':
          this.logger.log('用户关注事件');
          break;
        case 'unsubscribe':
          this.logger.log('用户取消关注事件');
          break;
        case 'batch_job_result':
          await this.wechatService.getExportResult(BatchJob.JobId);
          break;
        case 'change_external_contact':
          await this.wechatService.exportSimpleUser();
          break;
        default:
          this.logger.log(`未处理的事件类型: ${Event}`);
      }
    } catch (error) {
      this.logger.error('处理事件时发生错误:', error);
    }
  }

  /**
   * 应用主页入口
   * 用于生成授权链接
   */
  @Get('auth/generate-url')
  async appHome(
    @Query('state') state: string,
  ) {
    try {
      this.logger.log('收到应用主页访问请求');

      // 配置回调URL
      const redirectUri = this.wechatAuthService.redirectUri;
      this.logger.log(`回调URL: ${redirectUri}`);
      // 生成授权链接
      const loginUrl = this.wechatAuthService.generateAppHomeUrl(redirectUri, state);

      // 返回授权链接
      this.logger.log(`返回授权链接: ${loginUrl}`);
      return {
        success: true,
        data: {
          loginUrl,
        },
      };
    } catch (error) {
      this.logger.error('处理应用主页请求时发生错误:', error);
      return {
        success: false,
        message: '处理应用主页请求失败',
        error: error.message,
      };
    }
  }

  /**
   * 应用主页授权回调
   * 用于获取用户身份信息
   */
  @Get('app/callback')
  async appCallback(
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    try {
      this.logger.log(`收到应用主页授权回调: code=${code}, state=${state}`);

      // 获取suite_access_token
      const suiteAccessToken = await this.wechatAuthService.getSuiteAccessToken();

      // 获取用户身份信息
      const userInfo = await this.wechatAuthService.getUserInfo3rd(suiteAccessToken, code);

      // 获取用户详细信息
      let userDetail = null;
      if (userInfo.user_ticket) {
        userDetail = await this.wechatAuthService.getUserDetailBySuiteToken(
          suiteAccessToken,
          userInfo.user_ticket
        );
      }

      const corp = await this.corpService.findByCorpId(userInfo.CorpId);
      if (!corp) {
        this.logger.error('企业微信授权不存在');
        return {
          success: false,
          message: '企业微信授权不存在',
        };
      }
      userInfo.agentid = corp.agentid;

      const token = this.jwtService.sign({
        userid: userInfo.UserId
      }, {
        expiresIn: '3650d'
      });

      // 返回用户信息
      return {
        success: true,
        data: {
          userInfo,
          userDetail,
          token,
        },
      };
    } catch (error) {
      this.logger.error('处理应用主页授权回调时发生错误:', error);
      return {
        success: false,
        message: '处理应用主页授权回调失败',
        error: error.message,
      };
    }
  }

  /**
   * 向企业微信成员发送消息
   */
  @Post('message/send')
  async sendMessage(
    @Body() body: { corpId: string; userId: string; content: string },
  ) {
    try {
      const { corpId, userId, content } = body;
      if (!corpId || !userId || !content) {
        return {
          success: false,
          message: '缺少必要参数',
        };
      }

      const result = await this.wechatService.sendMessage(corpId, userId, content);

      if (result) {
        return {
          success: true,
          message: '消息发送成功',
        };
      } else {
        return {
          success: false,
          message: '消息发送失败',
        };
      }
    } catch (error) {
      this.logger.error('发送消息时发生错误:', error);
      return {
        success: false,
        message: '发送消息失败',
        error: error.message,
      };
    }
  }


  /**
   * 获取jssdk配置
   */
  @Get('getConfigSignature')
  async getConfigSignature(
    @Query('url') url: string,
    @Query('corpId') corpId: string,
  ) {
    return this.wechatService.getJssdkConfig(corpId, decodeURIComponent(url));
  }

  /**
   * 获取jssdk配置
   */
  @Get('getAgentConfigSignature')
  async getAgentConfigSignature(
    @Query('url') url: string,
    @Query('corpId') corpId: string,
  ) {
    return this.wechatService.getAgentJssdkConfig(corpId, decodeURIComponent(url));
  }

  /**
   * 获取部门列表
   */
  @Get('getDepartmentList')
  async getDepartmentList() {
    return this.wechatService.getDepartmentList();
  }

  /**
   * 获取成员ID列表
   */
  // @Get('getUserList')
  // async getUserList() {
  //   return this.wechatService.getUserList();
  // }


  /**
   * 导出成员
   */
  @Get('exportMembers')
  async exportMembers() {
    return this.wechatService.exportSimpleUser();
  }

  /**
   * 获取导出结果
   */
  @Get('getExportResult')
  async getExportResult(@Query('jobid') jobid: string) {
    return this.wechatService.getExportResult(jobid);
  }

  /**
   * 获取所有客户
   */
  @Get('getAllExternalContacts')
  async getAllExternalContacts(@Query('userid') userid: string) {
    return this.wechatService.getAllExternalContacts([userid]);
  }
} 
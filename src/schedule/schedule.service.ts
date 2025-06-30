import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WechatService } from '../wechat/wechat.service';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);
  private isProcessing = false;

  constructor(private readonly wechatService: WechatService) {}

  /**
   * 每小时执行一次导出任务
   * 每小时的第0分钟执行
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyExport() {
    if (this.isProcessing) {
      this.logger.warn('上一个导出任务还在执行中，跳过本次任务');
      return;
    }

    this.logger.log('开始执行每小时导出任务');
    this.isProcessing = true;
    
    try {
      // 创建导出任务
      const jobId = await this.wechatService.exportSimpleUser();
      this.logger.log(`导出任务创建成功，任务ID: ${jobId}`);
    } catch (error) {
      this.logger.error('创建导出任务失败', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 每天凌晨2点执行一次完整导出任务
   */
  @Cron('0 2 * * *')
  async handleDailyExport() {
    if (this.isProcessing) {
      this.logger.warn('上一个导出任务还在执行中，跳过本次每日任务');
      return;
    }

    this.logger.log('开始执行每日导出任务');
    this.isProcessing = true;
    
    try {
      // 创建导出任务
      const jobId = await this.wechatService.exportSimpleUser();
      this.logger.log(`每日导出任务创建成功，任务ID: ${jobId}`);
    } catch (error) {
      this.logger.error('创建每日导出任务失败', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 手动触发导出任务（用于测试）
   */
  async manualExport() {
    this.logger.log('手动触发导出任务');
    await this.handleHourlyExport();
  }

  /**
   * 获取任务状态
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      timestamp: new Date().toISOString(),
    };
  }
} 
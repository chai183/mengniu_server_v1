import { Controller, Post, Get, Logger } from '@nestjs/common';
import { ScheduleService } from './schedule.service';

@Controller('schedule')
export class ScheduleController {
  private readonly logger = new Logger(ScheduleController.name);

  constructor(private readonly scheduleService: ScheduleService) {}

  /**
   * 手动触发导出任务
   */
  @Post('manual-export')
  async manualExport() {
    this.logger.log('收到手动触发导出任务请求');
    
    try {
      await this.scheduleService.manualExport();
      return {
        success: true,
        message: '手动导出任务已触发',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('手动触发导出任务失败', error);
      return {
        success: false,
        message: '手动触发导出任务失败',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取定时任务状态
   */
  @Get('status')
  async getStatus() {
    const taskStatus = this.scheduleService.getStatus();
    
    return {
      success: true,
      message: '定时任务服务运行正常',
      taskStatus,
      schedules: [
        {
          name: '每小时导出任务',
          cron: '0 * * * *',
          description: '每小时执行一次企业微信数据导出',
          nextRun: this.getNextHourlyRun(),
        },
        // {
        //   name: '每日导出任务',
        //   cron: '0 2 * * *',
        //   description: '每天凌晨2点执行一次完整导出',
        //   nextRun: this.getNextDailyRun(),
        // },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取下次每小时执行时间
   */
  private getNextHourlyRun(): string {
    const now = new Date();
    const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
    return nextHour.toISOString();
  }

  /**
   * 获取下次每日执行时间
   */
  private getNextDailyRun(): string {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 2, 0, 0);
    return tomorrow.toISOString();
  }
} 
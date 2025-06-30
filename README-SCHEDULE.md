# 定时任务使用说明

## 概述

本项目集成了定时任务功能，用于定期执行企业微信数据导出任务。

## 安装依赖

首先需要安装 `@nestjs/schedule` 包：

```bash
npm install @nestjs/schedule
```

## 功能特性

### 1. 每小时导出任务
- **执行时间**: 每小时的第0分钟
- **Cron表达式**: `0 * * * *`
- **功能**: 每小时执行一次企业微信数据导出

### 2. 每日导出任务
- **执行时间**: 每天凌晨2点
- **Cron表达式**: `0 2 * * *`
- **功能**: 每天执行一次完整的企业微信数据导出

### 3. 手动触发
- **接口**: `POST /schedule/manual-export`
- **功能**: 手动触发导出任务，用于测试或紧急情况

### 4. 状态查询
- **接口**: `GET /schedule/status`
- **功能**: 查询定时任务运行状态和下次执行时间

## API 接口

### 手动触发导出任务

```http
POST /schedule/manual-export
```

**响应示例**:
```json
{
  "success": true,
  "message": "手动导出任务已触发",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 查询任务状态

```http
GET /schedule/status
```

**响应示例**:
```json
{
  "success": true,
  "message": "定时任务服务运行正常",
  "taskStatus": {
    "isProcessing": false,
    "timestamp": "2024-01-01T12:00:00.000Z"
  },
  "schedules": [
    {
      "name": "每小时导出任务",
      "cron": "0 * * * *",
      "description": "每小时执行一次企业微信数据导出",
      "nextRun": "2024-01-01T13:00:00.000Z"
    },
    {
      "name": "每日导出任务",
      "cron": "0 2 * * *",
      "description": "每天凌晨2点执行一次完整导出",
      "nextRun": "2024-01-02T02:00:00.000Z"
    }
  ],
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 日志输出

定时任务会输出详细的日志信息，包括：

- 任务开始执行时间
- 导出任务创建状态
- 任务ID
- 结果获取状态
- 错误信息和重试记录

### 日志示例

```
[ScheduleService] 开始执行每小时导出任务
[ScheduleService] 导出任务创建成功，任务ID: job_123456
[ScheduleService] 开始获取导出结果，任务ID: job_123456
[ScheduleService] 导出任务完成，结果: {"success": true, ...}
```

## 错误处理

### 重试机制
- 如果获取导出结果失败，系统会在30秒后自动重试
- 每日任务失败后会在1分钟后重试

### 防重复执行
- 使用 `isProcessing` 标志防止任务重复执行
- 如果上一个任务还在执行中，会跳过本次任务

## 配置说明

定时任务模块已集成到主应用中，无需额外配置。确保以下模块已正确导入：

```typescript
// app.module.ts
import { AppScheduleModule } from './schedule/schedule.module';

@Module({
  imports: [
    // ... 其他模块
    AppScheduleModule,
  ],
})
export class AppModule {}
```

## 注意事项

1. **依赖安装**: 确保已安装 `@nestjs/schedule` 包
2. **服务启动**: 定时任务会在应用启动后自动开始工作
3. **日志监控**: 建议定期检查日志，确保任务正常运行
4. **资源消耗**: 定时任务会消耗一定的系统资源，请确保服务器性能足够
5. **网络依赖**: 导出任务依赖企业微信API，请确保网络连接正常

## 故障排除

### 常见问题

1. **任务不执行**
   - 检查应用是否正常启动
   - 查看日志是否有错误信息
   - 确认 `@nestjs/schedule` 包已安装

2. **导出失败**
   - 检查企业微信API配置
   - 确认网络连接正常
   - 查看详细的错误日志

3. **重复执行**
   - 检查 `isProcessing` 标志是否正常工作
   - 确认没有多个应用实例同时运行

### 调试方法

1. 使用手动触发接口测试功能
2. 查看应用日志获取详细信息
3. 使用状态查询接口检查任务状态 
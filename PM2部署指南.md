# PM2生产环境部署指南

## 简介
PM2是一个用于Node.js应用程序的生产进程管理器，具有内置的负载均衡器。它可以帮助您保持应用程序在线，并避免停机。

## 安装
PM2已经作为依赖添加到项目中，但您也可以选择全局安装：

```bash
npm install pm2 -g
```

## 配置文件
项目已包含`ecosystem.config.js`配置文件，配置如下：

```javascript
module.exports = {
  apps: [{
    name: 'backend',  // 应用名称
    script: 'dist/main.js',  // 启动脚本路径
    instances: process.env.PM2_INSTANCES || 'max',  // 实例数量，'max'表示根据CPU核心数自动创建实例
    exec_mode: 'cluster',  // 执行模式，'cluster'表示使用集群模式
    autorestart: true,  // 应用崩溃时自动重启
    watch: false,  // 不监视文件变化
    max_memory_restart: process.env.PM2_MAX_MEMORY_RESTART || '1G',  // 内存超过1G时自动重启
    env_production: {  // 生产环境变量
      NODE_ENV: 'production',
      PORT: process.env.PORT || 3000
    },
    // Docker中PM2的特殊配置
    exp_backoff_restart_delay: 100, // 自动重启的延迟时间
    merge_logs: true, // 合并集群实例的日志
    log_date_format: 'YYYY-MM-DD HH:mm:ss', // 日志的日期格式
    // 在Docker中我们希望能够正确处理信号
    kill_timeout: 3000, // 给进程发送SIGKILL信号前的等待时间
    wait_ready: true, // 等待进程发送ready信号
  }]
};
```

## 部署步骤

### 1. 构建应用
首先，构建您的NestJS应用：

```bash
npm run build
```

### 2. 启动应用
使用PM2启动应用：

```bash
npm run pm2:start
```

或者直接使用PM2命令：

```bash
pm2 start ecosystem.config.js --env production
```

### 3. 查看应用状态
查看运行中的应用列表：

```bash
npm run pm2:list
```

或者直接使用PM2命令：

```bash
pm2 list
```

### 4. 查看日志
查看应用日志：

```bash
npm run pm2:logs
```

或者直接使用PM2命令：

```bash
pm2 logs
```

### 5. 重启应用
重启应用：

```bash
npm run pm2:restart
```

或者直接使用PM2命令：

```bash
pm2 restart ecosystem.config.js --env production
```

### 6. 零停机重载
实现零停机重新加载应用：

```bash
npm run pm2:reload
```

或者直接使用PM2命令：

```bash
pm2 reload ecosystem.config.js --env production
```

### 7. 停止应用
停止应用：

```bash
npm run pm2:stop
```

或者直接使用PM2命令：

```bash
pm2 stop ecosystem.config.js
```

### 8. 删除应用
从PM2的管理列表中删除应用：

```bash
npm run pm2:delete
```

或者直接使用PM2命令：

```bash
pm2 delete ecosystem.config.js
```

## 开机自启动
设置PM2在服务器重启后自动启动：

```bash
pm2 startup
pm2 save
```

## 监控
PM2提供了一个简单的监控界面，可以查看应用的状态：

```bash
pm2 monit
```

## 在Docker中使用PM2

### 项目已配置的Docker+PM2设置

我们已经配置了Dockerfile和docker-compose.yml文件，使应用可以在Docker容器中使用PM2运行：

#### 1. Dockerfile

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# 生产阶段
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist
COPY ecosystem.config.js ./

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# 使用PM2启动应用
CMD ["npx", "pm2-runtime", "ecosystem.config.js", "--env", "production"]
```

#### 2. docker-compose.yml

```yaml
services:
  app:
    build: .
    container_name: backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DB_HOST=db
      - DB_PORT=3306
      - DB_USERNAME=root
      - DB_PASSWORD=123456
      - DB_DATABASE=db_template
      # PM2配置 - 实例数量
      - PM2_INSTANCES=max
      # PM2配置 - 内存限制
      - PM2_MAX_MEMORY_RESTART=1G
    depends_on:
      - db
    restart: always
    # 为PM2日志创建数据卷
    volumes:
      - pm2-logs:/app/.pm2/logs
    networks:
      - app-network

  # ...其他服务...

volumes:
  pm2-logs:
```

### 使用Docker+PM2的部署步骤

1. **使用docker-compose构建并启动服务**

```bash
docker-compose build
docker-compose up -d
```

2. **查看容器状态**

```bash
docker-compose ps
```

3. **查看PM2日志**

```bash
docker-compose logs app
```

或者进入容器查看PM2日志:

```bash
docker exec -it backend sh
npx pm2 logs
```

4. **扩展PM2实例数量**

通过修改docker-compose.yml中的环境变量可以调整PM2实例:

```yaml
environment:
  - PM2_INSTANCES=4 # 设置固定数量的实例
```

5. **重启应用**

```bash
docker-compose restart app
```

6. **监控容器中的PM2**

```bash
docker exec -it backend sh
npx pm2 monit
```

### 注意事项

1. 在Docker环境中，我们使用`pm2-runtime`而不是标准的PM2命令。`pm2-runtime`会将PM2进程作为容器的主进程，这样当PM2进程退出时，容器也会退出。

2. 由于Docker容器重启时所有数据会丢失，所以我们使用了一个数据卷来持久化PM2的日志。

3. 在容器环境中使用PM2集群模式可以最大化利用可用的CPU资源，但请注意Docker的资源限制设置。

4. `wait_ready`选项配置PM2等待应用发送"ready"信号，这对于确保服务完全启动后再接收流量很有用。在NestJS应用程序中，您可以在启动完成后发送此信号：

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // ... 配置 ...
  await app.listen(process.env.PORT || 3000);
  
  // 发送ready信号给PM2
  if (process.send) {
    process.send('ready');
  }
}
bootstrap();
```

## 常见问题与解决方案

### 问题1: 应用无法启动
- 检查构建是否正确完成：`npm run build`
- 检查环境变量是否正确设置
- 查看错误日志：`pm2 logs`

### 问题2: 内存占用过高
调整配置文件中的`max_memory_restart`参数，或者检查应用中的内存泄漏问题。

### 问题3: 应用性能问题
使用PM2的监控功能：`pm2 monit`来监控CPU和内存使用情况，并相应调整配置。

### 问题4: Docker容器中PM2无法正常工作
- 确保ecosystem.config.js文件已正确复制到容器中
- 检查容器日志：`docker-compose logs app`
- 进入容器手动检查：`docker exec -it backend sh` 
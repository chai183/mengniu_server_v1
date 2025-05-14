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

# 安装 pm2-logrotate 模块
RUN npx pm2 install pm2-logrotate

COPY --from=builder /app/dist ./dist
COPY ecosystem.config.js ./

# 配置 pm2-logrotate
RUN npx pm2 set pm2-logrotate:max_size 10M
RUN npx pm2 set pm2-logrotate:retain 30
RUN npx pm2 set pm2-logrotate:compress false
RUN npx pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
RUN npx pm2 set pm2-logrotate:workerInterval 30
RUN npx pm2 set pm2-logrotate:rotateInterval 0 0 * * *

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# 使用PM2启动应用
CMD ["npx", "pm2-runtime", "ecosystem.config.js", "--env", "production"] 
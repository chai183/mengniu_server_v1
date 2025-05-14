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
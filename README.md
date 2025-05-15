# 后端服务部署指南

本文档提供了如何在服务器上部署本应用的详细说明。

## 目录

- [环境要求](#环境要求)
- [部署步骤](#部署步骤)
  - [1. 克隆代码](#1-克隆代码)
  - [2. 配置环境变量](#2-配置环境变量)
  - [3. 使用Docker Compose部署应用服务](#3-使用docker-compose部署应用服务)
- [访问应用](#访问应用)
- [常见问题](#常见问题)
- [维护与更新](#维护与更新)
- [CI/CD 配置指南](#ci-cd-配置指南)

## 环境要求

- Docker (20.10+)
- Docker Compose
- Git
- 服务器操作系统：建议使用Ubuntu 20.04/22.04或CentOS 8+
- 已部署的MySQL数据库服务
- 已部署的Nginx服务

### 部署路径
- /root/server-projects/mengniu_server

## 部署步骤

### 1. 克隆代码

```bash
# 克隆代码到服务器
git clone <仓库地址> backend
cd backend
```

### 2. 配置环境变量

项目配置已经在docker-compose.yml文件中定义。如需修改，请直接编辑docker-compose.yml文件：

```bash
# 使用文本编辑器查看或编辑docker-compose配置
nano docker-compose.yml
```

docker-compose.yml中的主要配置：

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
      - DB_HOST=host.docker.internal
      - DB_PORT=3306
      - DB_USERNAME=root
      - DB_PASSWORD=123456
      - DB_DATABASE=db_template
      - PM2_INSTANCES=max
      - PM2_MAX_MEMORY_RESTART=1G
    restart: always
    volumes:
      - /root/.pm2/logs:/root/.pm2/logs
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

> 注意：请根据实际环境修改数据库连接信息和其他配置。

### 3. 使用Docker Compose部署应用服务

```bash
# 构建并启动应用服务
docker-compose up -d

# 查看容器状态
docker-compose ps

# 查看应用日志
docker-compose logs -f app
```

系统架构：
- app: 通过Docker Compose部署的Node.js应用服务
- db: 已分离部署的MySQL数据库服务
- nginx: 已分离部署的Web服务器，处理HTTP请求并反向代理到应用服务

## 访问应用

部署完成后，通过Nginx代理，可以通过以下方式访问应用：

- **API访问地址**：http://服务器IP地址或域名
- **Swagger API文档**：http://服务器IP地址或域名/api-docs

## 常见问题

### 数据库连接问题

如果遇到数据库连接问题，请检查：

```bash
# 检查docker-compose配置中的数据库连接设置
cat docker-compose.yml | grep DB_

# 确保应用服务器能够访问到数据库服务器
telnet <数据库IP> 3306

# 查看应用日志中的数据库错误
docker-compose logs app
```

### 应用无法访问

检查应用容器状态和Nginx配置：

```bash
# 检查容器状态
docker-compose ps

# 查看应用日志
docker-compose logs app

# 检查Nginx配置和日志
sudo nginx -t
sudo cat /var/log/nginx/error.log
```

## 维护与更新

### 更新应用

```bash
# 拉取最新代码
git pull

# 重新构建并启动容器
docker-compose down
docker-compose up -d --build
```

### 备份数据库

```bash
# 备份数据库（直接连接到已部署的数据库服务器）
mysqldump -h <数据库IP> -u root -p<密码> db_template > backup_$(date +%Y%m%d).sql
```

### 停止服务

```bash
# 停止应用服务
docker-compose down
```

---

如有其他部署问题，请联系技术支持。

## CI/CD 配置指南

## GitHub Actions CI/CD 配置

本项目已配置了 GitHub Actions 实现持续集成和持续部署(CI/CD)。配置文件位于 `.github/workflows/ci-cd.yml`。

### 工作流程说明

此工作流程包含两个主要任务：

1. **构建和测试 (build-and-test)**
   - 检出代码
   - 设置 Node.js 环境
   - 安装依赖
   - 运行代码检查
   - 执行测试
   - 构建项目
   - 缓存构建产物

2. **部署 (deploy)**
   - 仅在主分支(main/master)的推送事件触发
   - 提供两种部署方式选择:
     - Docker 方式：构建并推送 Docker 镜像到 Docker Hub
     - SSH 方式：通过 SSH 部署到远程服务器

### 配置密钥

使用 Docker 部署方式需要在 GitHub 仓库设置以下密钥：
- `DOCKERHUB_USERNAME`: Docker Hub 用户名
- `DOCKERHUB_TOKEN`: Docker Hub 访问令牌

使用 SSH 部署方式需要设置以下密钥：
- `SERVER_HOST`: 服务器主机地址
- `SERVER_USERNAME`: 服务器用户名
- `SSH_PRIVATE_KEY`: SSH 私钥

### 设置密钥的步骤

1. 进入 GitHub 仓库
2. 点击 "Settings"
3. 点击左侧菜单 "Secrets and variables" 下的 "Actions"
4. 点击 "New repository secret" 添加密钥


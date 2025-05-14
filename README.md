<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

# 后端服务部署指南

本文档提供了如何在服务器上部署本应用的详细说明。

## 目录

- [环境要求](#环境要求)
- [部署步骤](#部署步骤)
  - [1. 克隆代码](#1-克隆代码)
  - [2. 配置环境变量](#2-配置环境变量)
  - [3. 使用Docker Compose部署](#3-使用docker-compose部署)
- [访问应用](#访问应用)
- [常见问题](#常见问题)
- [维护与更新](#维护与更新)

## 环境要求

- Docker (20.10+)
- Docker Compose (2.0+)
- Git
- 服务器操作系统：建议使用Ubuntu 20.04/22.04或CentOS 8+

## 部署步骤

### 1. 克隆代码

```bash
# 克隆代码到服务器
git clone <仓库地址> backend
cd backend
```

### 2. 配置环境变量

根据实际环境创建并配置`.env`文件：

```bash
# 复制环境变量模板
cp .env.example .env

# 使用文本编辑器编辑环境变量
nano .env
```

需要配置的主要环境变量：

```
# 数据库配置
DB_HOST=db
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=123456  # 建议修改为安全密码
DB_DATABASE=db_template

# JWT配置
JWT_SECRET=your_jwt_secret  # 必须修改为随机字符串
JWT_EXPIRES_IN=365d

# 其他配置...
```

> 注意：请务必修改JWT_SECRET为随机字符串以保证安全性。

如果需要修改数据库密码，请同时更新docker-compose.yml文件中的对应配置。

### 3. 使用Docker Compose部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

系统包含以下几个容器：
- app: Node.js应用服务
- db: MySQL数据库
- nginx: Web服务器，处理HTTP请求

## 访问应用

部署完成后，可以通过以下方式访问应用：

- **API访问地址**：http://服务器IP地址:80
- **Swagger API文档**：http://服务器IP地址:80/api-docs

## 常见问题

### 数据库连接问题

如果遇到数据库连接问题，请检查：

```bash
# 检查数据库容器是否运行
docker-compose ps db

# 查看数据库日志
docker-compose logs db
```

### 应用无法访问

检查应用容器和nginx容器的状态：

```bash
# 检查所有容器状态
docker-compose ps

# 查看应用日志
docker-compose logs app

# 查看nginx日志
docker-compose logs nginx
```

## 维护与更新

### 更新应用

```bash
# 拉取最新代码
git pull

# 重新构建并启动容器
docker-compose down
docker-compose build
docker-compose up -d
```

### 备份数据库

```bash
# 备份数据库
docker exec -it backend_db_1 mysqldump -u root -p123456 db_template > backup_$(date +%Y%m%d).sql
```

### 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止服务并删除卷（会删除数据库数据）
docker-compose down -v
```

---

如有其他部署问题，请联系技术支持。

# Nginx 配置说明

## 目录结构
- `conf.d/` - Nginx配置文件

## 域名配置
当前配置使用域名 `czyymf.cloud` 和 `www.czyymf.cloud`，仅使用HTTP协议。

## 使用说明
1. 启动Docker容器: `docker-compose up -d`
2. 访问 http://czyymf.cloud 测试您的网站

## DNS配置
确保您的域名 `czyymf.cloud` 解析到您的服务器IP地址。在DNS服务提供商处添加以下记录：
- A记录: `czyymf.cloud` -> 您的服务器IP
- A记录: `www.czyymf.cloud` -> 您的服务器IP

## 关于HTTPS
当前配置暂时不使用HTTPS。如果将来需要启用HTTPS，请参考以下步骤：

1. 修改Nginx配置，添加SSL证书和HTTPS支持
2. 获取SSL证书（推荐使用Let's Encrypt免费证书）
3. 在docker-compose.yml中添加443端口映射和SSL证书目录挂载 
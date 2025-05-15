# 项目部署工具

这是一个独立的部署工具，用于构建并部署主项目到远程服务器。此工具与主项目代码分离，便于独立维护。

## 功能

1. 在本地构建项目（npm ci、npm run build）
2. SSH连接到远程服务器
3. 在远程服务器上执行docker-compose命令，重启应用

## 安装

```bash
# 进入部署工具目录
cd deploy-tool

# 安装依赖
npm install
```

## 配置

在使用前，请修改 `deploy.js` 文件中的配置信息：

```javascript
// 配置信息
const config = {
  server: {
    host: 'your_server_ip',         // 替换为您的服务器IP
    username: 'your_username',      // 替换为您的用户名
    password: 'your_password',      // 替换为您的密码，或使用密钥认证
    // privateKey: require('fs').readFileSync('/path/to/key', 'utf8')  // 使用密钥认证时取消注释
  },
  remotePath: '/root/server-projects/mengniu_server'  // 替换为您的项目路径
};
```

## 使用方法

```bash
# 进入部署工具目录
cd deploy-tool

# 直接运行脚本
node deploy.js

# 或使用npm脚本
npm run deploy
```

## 在Windows上运行

此脚本在Windows上可直接运行，无需额外配置：

1. 确保已安装Node.js (建议v16或更高版本)
2. 打开命令提示符或PowerShell
3. 进入部署工具目录并安装依赖
4. 运行部署命令

## 特性

- 使用 `ora` 提供友好的命令行加载动画
- 使用 `chalk` 美化控制台输出
- 使用 `node-ssh` 处理SSH连接和远程命令执行
- 完整的错误处理和进度显示

## 与CI/CD的关系

本工具实现了与项目Github Actions工作流程相同的功能，可用于本地部署测试或在CI/CD系统不可用时进行部署。 
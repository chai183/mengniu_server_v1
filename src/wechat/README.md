# 企业微信第三方应用回调功能

本模块实现了企业微信第三方应用的回调功能，包括数据回调和指令回调的处理。

## 功能特性

- ✅ 支持GET请求的回调URL验证
- ✅ 支持POST请求的数据回调和指令回调
- ✅ 自动处理消息加解密
- ✅ 签名验证确保安全性
- ✅ 支持suite_ticket接收和存储
- ✅ 支持授权变更事件处理
- ✅ 完整的日志记录

## 配置说明

### 1. 环境变量配置

在项目根目录的 `.env` 文件中添加以下配置：

```bash
# 企业微信第三方应用配置
WECHAT_SUITE_ID=your_suite_id
WECHAT_SUITE_SECRET=your_suite_secret
WECHAT_TOKEN=your_token
WECHAT_ENCODING_AES_KEY=your_encoding_aes_key
```

### 2. 获取配置信息

1. 登录企业微信开发者后台
2. 创建第三方应用
3. 在应用详情页面获取：
   - `suite_id`: 应用ID
   - `suite_secret`: 应用密钥
   - `token`: 回调配置中的Token
   - `encodingAESKey`: 回调配置中的EncodingAESKey

## API接口

### 回调URL配置

在企业微信开发者后台配置以下回调URL：

#### 数据回调URL
- **验证URL**: `GET /wechat/callback/data`
- **接收数据**: `POST /wechat/callback/data`

#### 指令回调URL
- **验证URL**: `GET /wechat/callback/command`
- **接收指令**: `POST /wechat/callback/command`

### 接口详情

#### 1. 数据回调URL验证 (GET)

**接口**: `GET /wechat/callback/data`

**参数**:
- `msg_signature`: 消息签名
- `timestamp`: 时间戳
- `nonce`: 随机数
- `echostr`: 加密的随机字符串

**响应**: 解密后的随机字符串

#### 2. 指令回调URL验证 (GET)

**接口**: `GET /wechat/callback/command`

**参数**: 同数据回调URL验证

#### 3. 数据回调 (POST)

**接口**: `POST /wechat/callback/data`

**功能**: 接收用户消息、进入应用事件、通讯录变更事件等

**支持的消息类型**:
- 文本消息
- 事件消息（进入应用、菜单点击、关注/取消关注等）

#### 4. 指令回调 (POST)

**接口**: `POST /wechat/callback/command`

**功能**: 接收应用授权变更事件和suite_ticket

**支持的指令类型**:
- `suite_ticket`: 第三方应用凭证
- `create_auth`: 企业授权应用
- `cancel_auth`: 企业取消授权
- `change_auth`: 企业变更授权

## 使用示例

### 1. 启动服务

```bash
npm run start:dev
```

### 2. 配置内网穿透

如果在本地开发，需要配置内网穿透工具（如ngrok）：

```bash
ngrok http 3000
```

### 3. 配置回调URL

在企业微信开发者后台配置：
- 数据回调URL: `https://your-domain.com/wechat/callback/data`
- 指令回调URL: `https://your-domain.com/wechat/callback/command`

### 4. 验证配置

保存回调配置后，企业微信会自动发送验证请求，如果配置正确，会显示验证成功。

## 日志监控

服务会记录详细的日志信息，包括：
- 回调请求的接收
- 签名验证结果
- 消息解密过程
- 业务处理结果
- 错误信息

可以通过查看控制台日志来监控回调处理情况。

## 扩展开发

### 1. 添加新的消息类型处理

在 `WechatController` 的 `processDataCallback` 方法中添加新的消息类型处理逻辑。

### 2. 添加新的事件处理

在 `WechatController` 的 `handleEvent` 方法中添加新的事件类型处理逻辑。

### 3. 自定义suite_ticket存储

在 `WechatService` 的 `storeSuiteTicket` 方法中实现自定义的存储逻辑，如存储到Redis或数据库。

## 注意事项

1. **安全性**: 确保Token和EncodingAESKey的安全性，不要泄露给第三方
2. **网络**: 回调URL必须是公网可访问的HTTPS地址
3. **响应时间**: 回调处理应该在5秒内完成响应
4. **重试机制**: 企业微信会对失败的回调进行重试，注意幂等性处理

## 故障排查

### 1. 验证失败

- 检查Token和EncodingAESKey是否正确
- 检查回调URL是否可访问
- 查看服务日志确认错误原因

### 2. 回调接收失败

- 检查网络连接
- 确认回调URL配置正确
- 查看企业微信开发者后台的错误日志

### 3. 解密失败

- 确认EncodingAESKey配置正确
- 检查加解密库是否正确安装
- 查看详细的错误日志 
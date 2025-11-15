# 后端认证系统搭建完成

## 🎉 已完成的工作

你的 knowledge API 后端现在已经有了完整的认证系统！

### ✅ 新增文件

**后端文件：**
1. `knowledge-api/routes/auth.js` - 认证路由
2. `knowledge-api/middleware/auth.js` - 认证中间件
3. `knowledge-api/utils/jwt.js` - JWT 工具
4. `knowledge-api/utils/userStore.js` - 用户数据存储
5. `knowledge-api/.env.example` - 环境变量示例
6. `knowledge-api/AUTH_README.md` - 详细文档

**前端更新：**
1. `utils/simpleAuth.js` - 支持后端API登录

## 🚀 快速开始

### 1. 启动后端服务

```bash
cd knowledge-api
npm start
```

你会看到：

```
🚀 知识库 API 服务已启动
📍 地址: http://localhost:3000
📊 题目总数: 100
📁 分类总数: 10

📚 知识库 API:
  GET  /health                    - 健康检查
  GET  /api/categories            - 获取所有分类
  GET  /api/questions             - 获取题目列表（支持分页）
  GET  /api/questions/:id         - 获取题目详情
  GET  /api/knowledge/full        - 获取完整数据
  GET  /api/knowledge/version     - 获取数据版本

🔐 认证 API:
  POST /api/auth/login            - 静默登录
  POST /api/auth/phone-login      - 手机号登录
  POST /api/auth/check            - 检查token
  POST /api/auth/update-profile   - 更新用户信息

⚙️  环境配置:
  WECHAT_APPID: 未配置（使用开发模式）
  WECHAT_SECRET: 未配置（使用开发模式）
  JWT_SECRET: 使用默认值
```

### 2. 测试认证API

#### 测试登录

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"code":"test_code"}'
```

响应：

```json
{
  "code": 0,
  "msg": "登录成功（开发模式）",
  "data": {
    "userId": "user_1",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "openid": "mock_openid_1234567890",
    "isNewUser": true
  }
}
```

#### 测试Token验证

```bash
curl -X POST http://localhost:3000/api/auth/check \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. 小程序端配置

在 `config.js` 中确认配置：

```javascript
module.exports = {
  // ... 其他配置
  
  // 知识库 API 配置
  knowledgeApiUrl: 'http://localhost:3000/api', // 开发环境
  // knowledgeApiUrl: 'http://47.95.196.190:8080/api', // 生产环境
}
```

### 4. 测试小程序登录

1. 在微信开发者工具中编译项目
2. 点击"个人中心" → "立即登录"
3. 勾选协议 → 点击"快速登录"
4. 查看控制台输出：

```
获取到微信 code: 071abc...
使用后端API登录
后端登录成功: {userId: "user_1", token: "...", openid: "..."}
```

## 📖 工作模式

### 开发模式（当前）

- ✅ 无需微信配置
- ✅ 自动模拟登录
- ✅ 生成模拟数据
- ✅ 适合本地开发

**特点：**
- 不调用微信API
- 生成模拟的 openid
- 生成模拟的手机号
- 数据存储在本地 JSON 文件

### 生产模式

需要配置微信参数：

1. **创建 .env 文件**：

```bash
cd knowledge-api
cp .env.example .env
```

2. **编辑 .env**：

```env
PORT=3000
WECHAT_APPID=wx1234567890abcdef
WECHAT_SECRET=abc123def456...
JWT_SECRET=your-strong-secret-key-here
```

3. **安装 dotenv**：

```bash
npm install dotenv
```

4. **在 server.js 顶部添加**：

```javascript
require('dotenv').config();
```

5. **重启服务**：

```bash
npm start
```

## 🔄 数据流程

### 登录流程

```
小程序端                    后端服务器                  微信服务器
   |                           |                           |
   |-- wx.login() ------------>|                           |
   |<-- code ------------------|                           |
   |                           |                           |
   |-- POST /api/auth/login -->|                           |
   |    {code}                 |                           |
   |                           |-- jscode2session -------->|
   |                           |<-- openid, session_key ---|
   |                           |                           |
   |                           |-- 查询/创建用户            |
   |                           |-- 生成 JWT token          |
   |                           |                           |
   |<-- {userId, token} -------|                           |
   |                           |                           |
   |-- 保存到本地存储           |                           |
```

### API 请求流程

```
小程序端                    后端服务器
   |                           |
   |-- GET /api/questions ---->|
   |    Header:                |
   |    Authorization: Bearer  |
   |    {token}                |
   |                           |-- 验证 token
   |                           |-- 解码用户信息
   |                           |-- 查询数据
   |                           |
   |<-- {data} ----------------|
```

## 📊 数据存储

### 用户数据文件

位置：`knowledge-api/data/users.json`

```json
{
  "users": [
    {
      "id": "user_1",
      "openid": "mock_openid_1234567890",
      "sessionKey": "mock_session_key",
      "phone": "138****1234",
      "nickName": "张三",
      "avatarUrl": "https://...",
      "createTime": "2024-01-01T00:00:00.000Z",
      "lastLoginTime": "2024-01-02T00:00:00.000Z"
    }
  ],
  "nextId": 2
}
```

## 🔧 配置选项

### 环境变量

| 变量 | 说明 | 默认值 | 必需 |
|------|------|--------|------|
| PORT | 服务器端口 | 3000 | 否 |
| WECHAT_APPID | 微信小程序 AppID | - | 生产环境必需 |
| WECHAT_SECRET | 微信小程序 Secret | - | 生产环境必需 |
| JWT_SECRET | JWT 密钥 | 默认值 | 建议配置 |

### 小程序配置

在 `config.js` 中：

```javascript
module.exports = {
  // 知识库 API 地址
  knowledgeApiUrl: 'http://localhost:3000/api', // 开发
  // knowledgeApiUrl: 'https://your-domain.com/api', // 生产
}
```

## 🐛 调试技巧

### 1. 查看后端日志

后端会输出详细的日志：

```
✅ 创建新用户: user_1
✅ 更新用户: user_1
⚠️  开发模式：使用模拟登录
❌ JWT 签名验证失败
```

### 2. 查看用户数据

```bash
cat knowledge-api/data/users.json
```

### 3. 测试 API

使用 curl 或 Postman 测试：

```bash
# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"code":"test"}'

# 检查 token
curl -X POST http://localhost:3000/api/auth/check \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. 小程序端调试

在控制台查看：

```javascript
const SimpleAuth = require('./utils/simpleAuth')
console.log('用户信息:', SimpleAuth.getUserInfo())
```

## 🚀 部署到生产环境

### 1. 准备服务器

- 阿里云 ECS
- 腾讯云 CVM
- 或其他云服务器

### 2. 配置环境

```bash
# 安装 Node.js
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2
sudo npm install -g pm2
```

### 3. 部署代码

```bash
# 上传代码到服务器
scp -r knowledge-api user@your-server:/path/to/

# SSH 到服务器
ssh user@your-server

# 进入目录
cd /path/to/knowledge-api

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
nano .env  # 编辑配置

# 启动服务
pm2 start server.js --name knowledge-api
pm2 save
pm2 startup
```

### 4. 配置 Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. 配置 HTTPS

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com
```

### 6. 更新小程序配置

```javascript
// config.js
module.exports = {
  knowledgeApiUrl: 'https://your-domain.com/api'
}
```

## 📚 相关文档

- [认证系统详细文档](../knowledge-api/AUTH_README.md)
- [小程序端使用文档](./SIMPLE_AUTH_USAGE.md)
- [部署文档](../knowledge-api/DEPLOYMENT.md)

## 🎯 下一步

1. ✅ 后端认证系统已完成
2. ✅ 小程序端已更新
3. ⏳ 测试登录流程
4. ⏳ 配置生产环境
5. ⏳ 部署到服务器

## ❓ 常见问题

### Q1: 如何切换到生产模式？

A: 配置 `.env` 文件，填入真实的微信 APPID 和 SECRET。

### Q2: 数据会丢失吗？

A: 当前使用 JSON 文件存储，重启服务不会丢失。生产环境建议使用数据库。

### Q3: 如何查看所有用户？

A: 查看 `knowledge-api/data/users.json` 文件。

### Q4: Token 过期怎么办？

A: 小程序端会自动重新登录。

### Q5: 如何重置所有数据？

A: 删除 `knowledge-api/data/users.json` 文件，重启服务会自动创建新文件。

---

**后端认证系统已就绪！** 🎊

现在你可以：
1. 启动后端服务
2. 测试登录功能
3. 开发你的 AI 功能

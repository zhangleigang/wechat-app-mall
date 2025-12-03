# 技术栈

## 平台

**微信小程序** - 基于微信生态的原生应用，无需安装，用户基数大。

## 前端技术栈

**核心框架**
- 微信小程序 SDK 8.4.0
- JavaScript ES6+
- WXML（模板语言）
- WXSS（样式语言，支持rpx响应式单位）

**UI组件库**
- `@vant/weapp` 1.11.6 - 主要UI组件库（轻量、可靠、文档完善）
- `/components` 目录下的自定义业务组件

**核心依赖**
- `dayjs` 1.11.6 - 轻量级日期处理库
- `mp-html` 2.3.1 - 富文本/HTML渲染组件，支持Markdown
- `wxa-plugin-canvas` 1.1.12 - 海报/图片生成插件
- `wxbarcode` 1.0.2 - 二维码生成库

## 后端服务

**AI服务** - 自定义AI后端，提供岗位分析、简历解析、情绪支持
- 协议：HTTPS + RESTful API
- 认证：Bearer Token
- 格式：JSON

**知识库API** - Node.js/Express后端服务（端口3000/8443）
- Express.js 4.x
- 启用CORS跨域
- Gzip压缩
- JWT + OpenID认证
- 微信登录（code2Session）
- 静态文件服务（收款码图片）
- PM2进程管理（生产环境）
- Nginx反向代理（HTTP 8080 → 3000，HTTPS 8443 → 3000）
- 生产地址：https://api.feelnow.cn:8443

**会员服务API** - Node.js/Express后端服务（端口3001）
- Express.js 4.x
- MySQL 8.0+数据库
- 基于OpenID的会员管理
- 会员状态查询、开通、续费
- 订单记录和管理
- 管理员接口（订单列表、会员列表、导出）
- PM2进程管理（生产环境）
- 生产地址：http://47.95.196.190:3001

## 开发工具

- **微信开发者工具** - 主要开发IDE，用于开发、调试、预览
- **Node.js** 14+ - npm包管理
- **Git** - 版本控制
- **VS Code**（可选）- 代码编辑器

## 常用命令

```bash
# 小程序前端
npm install                    # 安装依赖
# 微信开发者工具 -> 工具 -> 构建 npm

# 知识库API后端（本地开发）
cd knowledge-api
npm install
npm start                      # 启动开发服务器（http://localhost:3000）
npm run dev                    # 开发模式（nodemon自动重启）

# 知识库API生产环境部署
pm2 start server.js --name knowledge-api
pm2 logs knowledge-api
pm2 restart knowledge-api

# 会员服务后端（本地开发）
cd member-service
npm install
npm start                      # 启动开发服务器（http://localhost:3001）

# 会员服务生产环境部署
cd member-service
bash pack.sh                   # 打包
scp member-service-*.tar.gz root@47.95.196.190:/root/
# 在服务器上：
tar -xzf member-service-*.tar.gz
cd member-service-temp
./check-env.sh                 # 检查环境
vi .env                        # 配置数据库
./deploy.sh                    # 自动部署
```

## 配置文件

**小程序前端**：
- `config.js` - 应用配置（API地址、收款码配置、功能开关）
- `app.json` - 全局配置（页面路由、tabBar、权限、组件）
- `project.config.json` - 微信开发者工具项目配置
- `package.json` - npm依赖配置

**知识库API后端**：
- `.env` - 环境变量（微信AppID、Secret、JWT密钥）
- `package.json` - 依赖配置

**会员服务后端**：
- `.env` - 环境变量（数据库配置）
- `init.sql` - 数据库初始化脚本
- `package.json` - 依赖配置

## 代码组织

**分层架构**
1. 应用层 - `app.js`、`app.json`、`app.wxss`
2. 页面层 - `/pages`（每个页面4个文件：.js、.json、.wxml、.wxss）
3. 组件层 - `/components` + Vant UI组件
4. 工具层 - `/utils`（ai.js、auth.js、member-api.js、knowledge-api.js、tools.js）
5. 配置层 - `config.js`
6. 后端服务层 - knowledge-api（知识库+认证）、member-service（会员管理）

## 包体积管理

**重要**：小程序代码包限制为2MB。当前优化措施：
- 通过`project.config.json`排除doc/docs文件夹
- 知识库数据从API加载（不打包到代码中）
- 图片需要压缩
- 使用分包加载可选功能

## API约定

**请求格式**
```json
{
  "scene": "job|resume|mood",
  "messages": [...],
  "userId": "xxx",
  "sessionId": "xxx"
}
```

**响应格式**
```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

## 存储策略

**前端存储**（wx.setStorageSync）：
- 用户信息：`userId`、`token`、`openid`（退出登录时清除）
- 会员信息缓存：`memberInfo`、`memberInfoTime`（10分钟有效期）
- 会话数据：7天过期
- 存储限制：总计10MB

**后端存储**：
- 知识库数据：JSON文件（knowledge-api/data/knowledge.json）
- 用户认证：JSON文件（knowledge-api/data/users.json，OpenID映射）
- 会员数据：MySQL数据库（member-service，members表，主键OpenID）
- 订单数据：MySQL数据库（member-service，orders表，关联OpenID）

**缓存策略**：
- 会员状态：前端缓存10分钟，减少API调用
- 知识库数据：后端内存缓存，启动时加载

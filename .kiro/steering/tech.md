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

**AI服务** - 自定义AI后端，提供简历解析
- 协议：HTTPS + RESTful API
- 认证：Bearer Token
- 格式：JSON

**统一后端服务** - Node.js/Express后端服务（端口3000，HTTPS 443）
- Express.js 4.x
- MySQL 8.0+数据库
- 启用CORS跨域
- Gzip压缩
- JWT + OpenID认证
- 微信登录（code2Session）
- 会员管理（状态查询、开通、续费）
- 知识库API
- 简历管理（上传、解析、AI问答）
- 收藏管理（CRUD、标签、AI生成答案）
- 订单记录和管理
- 静态文件服务（收款码、头像等）
- 管理员接口（订单列表、会员列表、导出）
- DeepSeek AI集成
- PM2进程管理（生产环境）
- Nginx反向代理（HTTPS 443 → 3000）
- 生产地址：https://api.feelnow.cn

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

# 统一后端服务（本地开发）
cd server
npm install
npm start                      # 启动开发服务器（http://localhost:3000）

# 生产环境部署
cd server
pm2 start server.js --name ai-interview-helper
pm2 logs ai-interview-helper
pm2 restart ai-interview-helper
```

## 配置文件

**小程序前端**：
- `config.js` - 应用配置（API地址、收款码配置、功能开关）
- `app.json` - 全局配置（页面路由、tabBar、权限、组件）
- `project.config.json` - 微信开发者工具项目配置
- `package.json` - npm依赖配置

**统一后端服务**：
- `.env` - 环境变量（数据库配置、微信AppID、Secret、JWT密钥、DeepSeek API密钥）
- `database/init.sql` - 完整数据库初始化脚本（包含所有表、视图、触发器）
- `database/maintenance.sql` - 数据库维护脚本
- `database/README.md` - 数据库文档
- `database/QUICK_START.md` - 快速启动指南
- `package.json` - 依赖配置

## 代码组织

**分层架构**
1. 应用层 - `app.js`、`app.json`、`app.wxss`
2. 页面层 - `/pages`（每个页面4个文件：.js、.json、.wxml、.wxss）
3. 组件层 - `/components` + Vant UI组件
4. 工具层 - `/utils`（ai.js、auth.js、member-api.js、knowledge-api.js、favorites-api.js、resume-api.js、tools.js）
5. 配置层 - `config.js`
6. 后端服务层 - 统一后端服务（认证、会员、知识库、简历、收藏、订单管理）

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
  "scene": "resume",
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
- 简历列表缓存：`resumeList`、`resumeListTime`（5分钟有效期）
- 标签列表缓存：`tagsList`、`tagsListTime`（5分钟有效期）
- 会话数据：7天过期
- 存储限制：总计10MB

**后端存储**：
- 知识库数据：JSON文件（server/src/data/knowledge.json）
- 会员数据：MySQL数据库（members表，主键OpenID）
- 订单数据：MySQL数据库（orders表，关联OpenID）
- 简历数据：MySQL数据库（resumes表，关联OpenID）+ 文件系统（server/uploads/resumes/）
- 收藏数据：MySQL数据库（favorites、tags、favorite_tags表，关联OpenID）
- 静态文件：文件系统（server/src/static/）

**缓存策略**：
- 会员状态：前端缓存10分钟，减少API调用
- 简历列表：前端缓存5分钟
- 标签列表：前端缓存5分钟
- 知识库数据：后端内存缓存，启动时加载

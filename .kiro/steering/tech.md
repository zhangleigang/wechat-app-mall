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

**业务后端** - API工厂（apifm）SaaS平台
- 用户管理（注册、登录、个人信息）
- 订单管理（创建、支付、查询）
- 系统配置管理
- 标识：`subDomain` + `merchantId`

**知识库API** - Node.js/Express后端服务
- Express.js 4.x
- 启用CORS跨域
- Gzip压缩
- JWT认证
- PM2进程管理（生产环境）
- Nginx反向代理（生产环境，用于端口转发和负载均衡）

## 开发工具

- **微信开发者工具** - 主要开发IDE，用于开发、调试、预览
- **Node.js** 14+ - npm包管理
- **Git** - 版本控制
- **VS Code**（可选）- 代码编辑器

## 常用命令

```bash
# 安装依赖
npm install

# 构建npm包（在微信开发者工具中）
微信开发者工具 -> 工具 -> 构建 npm

# 知识库API后端（本地开发）
cd knowledge-api
npm install
npm start              # 启动开发服务器（http://localhost:3000）

# 生产环境部署
pm2 start server.js --name knowledge-api
# Nginx配置在服务器上，将8080端口转发到3000端口
```

## 配置文件

- `config.js` - 应用配置（API地址、商户ID、功能开关）
- `app.json` - 全局配置（页面路由、tabBar、权限、组件）
- `project.config.json` - 微信开发者工具项目配置
- `package.json` - npm依赖配置

## 代码组织

**分层架构**
1. 应用层 - `app.js`、`app.json`、`app.wxss`
2. 页面层 - `/pages`（每个页面4个文件：.js、.json、.wxml、.wxss）
3. 组件层 - `/components` + Vant UI组件
4. 工具层 - `/utils`（ai.js、auth.js、knowledge.js、tools.js）
5. 配置层 - `config.js`

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

- 用户信息：使用`wx.setStorageSync`（退出登录时清除）
- 会话数据：7天过期
- 缓存数据：按需清除
- 存储限制：总计10MB

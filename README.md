# AI面试助手 - 微信小程序

基于微信小程序的智能职业发展工具，专注于大数据领域的面试准备。

## 核心功能

- 🎯 **岗位分析** - AI分析职位描述，生成预测面试问题
- 📄 **简历解读** - 智能简历分析和优化建议
- 💭 **情绪小屋** - 面试压力管理和心理支持
- 📚 **知识库** - 200+大数据面试题库，10+技术分类
- 👤 **会员系统** - 收款码支付，本地会员管理

## 快速开始

### 环境要求

- 微信开发者工具 1.06+
- Node.js 14+
- MySQL 8.0+（member-service需要）

### 安装依赖

```bash
# 小程序依赖
npm install

# 在微信开发者工具中构建npm
工具 → 构建 npm
```

### 配置项目

1. **配置config.js**
```javascript
module.exports = {
  // 知识库API（已部署）
  knowledgeApiUrl: 'https://api.feelnow.cn:8443/api',
  
  // AI服务（需要配置）
  ai_api_base: 'https://your-ai-backend.example.com',
  
  // 收款码配置（需要配置）
  paymentQrcode: {
    url: 'https://your-domain.com/qrcode.jpg',
    accountName: '你的姓名',
    enabled: true
  }
}
```

2. **配置微信小程序**
- 在`project.config.json`中填入AppID
- 在微信公众平台配置服务器域名白名单

3. **启动后端服务**
```bash
# 启动所有后端服务
pm2 start ecosystem.config.js

# 或分别启动
cd knowledge-api && npm start
cd member-service && npm start
```

## 项目结构

```
wechat-app-mall/
├── pages/              # 页面
│   ├── ai/            # AI功能（岗位、简历、情绪）
│   ├── knowledge/     # 知识库
│   ├── member/        # 会员相关
│   └── my/            # 个人中心
├── components/        # 自定义组件
├── utils/             # 工具模块
│   ├── ai.js         # AI服务
│   ├── auth.js       # 认证
│   ├── simpleAuth.js # 简化认证
│   ├── memberLocal.js # 会员管理
│   └── knowledge.js  # 知识库数据
├── knowledge-api/     # 知识库后端服务
├── member-service/    # 会员后端服务
├── docs/              # 文档
└── tests/             # 测试
```

## 后端服务

### knowledge-api (端口3000)
- 知识库数据API
- 用户认证（JWT）
- 微信登录

### member-service (端口3001)
- 会员状态管理
- 订单记录
- 对账功能

详见：[部署架构文档](./docs/DEPLOYMENT_ARCHITECTURE.md)

## 测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- auth-flow
npm test -- member-payment-flow
```

测试覆盖：73个测试用例，100%通过率

## 文档

- [部署架构](./docs/DEPLOYMENT_ARCHITECTURE.md) - 后端服务部署架构
- [数据库设计](./docs/DATABASE_DESIGN_FINAL.md) - 会员系统数据库设计
- [会员服务部署](./docs/MEMBER_SERVICE_DEPLOYMENT.md) - 会员服务部署指南
- [文档索引](./docs/README.md) - 完整文档列表

## 技术栈

**前端**
- 微信小程序 SDK 8.4.0
- Vant Weapp 1.11.6
- mp-html 2.3.1

**后端**
- Node.js 18+
- Express.js 4.x
- MySQL 8.0+
- PM2进程管理

## 部署

### 快速部署

```bash
# 1. 部署后端服务
pm2 start ecosystem.config.js

# 2. 配置Nginx
sudo cp docs/nginx.conf /etc/nginx/conf.d/api.conf
sudo nginx -t && sudo nginx -s reload

# 3. 配置小程序
# - 填写config.js
# - 配置微信域名白名单
# - 在开发者工具中测试
```

详见：[部署架构文档](./docs/DEPLOYMENT_ARCHITECTURE.md)

## 许可证

MIT License

---

**版本**: 8.4.0  
**最后更新**: 2025-11-29

# 项目概览

## 📱 产品介绍

AI面试助手是一款基于微信小程序的智能职业发展工具，专注于大数据领域的面试准备。

### 核心价值

- 🎯 **精准定位** - 专注大数据领域，提供专业的面试辅导
- 🤖 **AI驱动** - 智能分析岗位、简历，生成个性化建议
- 📚 **知识库** - 200+精选面试题，覆盖10+主流技术
- 💰 **轻量付费** - 收款码支付，简单直接

### 目标用户

- 大数据/数据工程领域的求职者
- 准备技术面试的应届毕业生和在职人员
- 需要简历优化和面试辅导的技术人员

## 🏗️ 技术架构

### 前端（微信小程序）

```
微信小程序
├── AI功能模块
│   ├── 岗位分析
│   ├── 简历解读
│   └── 情绪小屋
├── 知识库模块
│   ├── 分类浏览
│   └── 搜索功能
├── 会员模块
│   ├── 套餐选择
│   ├── 收款码支付
│   └── 会员管理
└── 个人中心
    ├── 用户信息
    └── 系统设置
```

**技术栈**：
- 微信小程序 SDK 8.4.0
- Vant Weapp 1.11.6（UI组件）
- mp-html 2.3.1（Markdown渲染）
- dayjs 1.11.6（日期处理）

### 后端服务

```
后端架构
├── knowledge-api (端口3000)
│   ├── 知识库数据API
│   ├── 用户认证（JWT）
│   └── 微信登录
└── member-service (端口3001)
    ├── 会员状态管理
    ├── 订单记录
    └── 对账功能
```

**技术栈**：
- Node.js 18+
- Express.js 4.x
- MySQL 8.0+（member-service）
- PM2进程管理
- Nginx反向代理

### 部署架构

```
┌─────────────┐
│  微信小程序  │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────┐
│ Nginx (443/8443)│
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│ API    │ │ Member │
│ :3000  │ │ :3001  │
└────────┘ └────────┘
    │         │
    ▼         ▼
  JSON      MySQL
```

## 📊 项目状态

### 完成度

| 模块 | 状态 | 完成度 |
|------|------|--------|
| AI功能 | ✅ 完成 | 100% |
| 知识库 | ✅ 完成 | 100% |
| 会员系统 | ✅ 完成 | 100% |
| 认证系统 | ✅ 完成 | 100% |
| 后端服务 | ✅ 完成 | 100% |
| 测试 | ✅ 完成 | 100% (73/73) |
| 文档 | ✅ 完成 | 100% |

### 待配置项

- ⚠️ 收款人姓名（config.js）
- ⚠️ AI服务地址（config.js）
- ⚠️ 微信小程序AppID
- ⚠️ 微信域名白名单

## 📁 项目结构

```
wechat-app-mall/
├── pages/              # 小程序页面
│   ├── ai/            # AI功能（岗位、简历、情绪）
│   ├── knowledge/     # 知识库
│   ├── member/        # 会员相关
│   └── my/            # 个人中心
├── components/        # 自定义组件
├── utils/             # 工具模块
│   ├── ai.js         # AI服务客户端
│   ├── simpleAuth.js # 认证系统
│   ├── memberLocal.js # 会员管理
│   └── knowledge.js  # 知识库数据
├── knowledge-api/     # 知识库后端服务
│   ├── server.js     # Express服务
│   ├── data/         # 知识库数据
│   ├── routes/       # 认证路由
│   ├── middleware/   # JWT中间件
│   └── utils/        # 工具函数
├── member-service/    # 会员后端服务
│   ├── server.js     # Express服务
│   └── init.sql      # 数据库初始化
├── docs/              # 项目文档
├── tests/             # 自动化测试
└── ecosystem.config.js # PM2配置
```

## 🔑 核心功能

### 1. AI功能（需会员）

**岗位分析**
- 输入职位描述或链接
- AI分析核心技能和岗位职责
- 生成预测面试问题
- 提供能力差距分析

**简历解读**
- 支持多种文件格式上传
- AI自动解析简历内容
- 提供优化建议
- 岗位匹配度分析

**情绪小屋**
- 面试压力管理
- AI对话支持
- 放松技巧指导
- 应对策略建议

### 2. 知识库（免费）

**技术分类**
- HDFS、MapReduce、Yarn
- Kafka、HBase、Hive
- Spark、Flink
- Zookeeper、Flume

**功能特性**
- 200+精选面试题
- 详细答案解析
- Markdown格式
- 关键词搜索
- 分类浏览

### 3. 会员系统

**套餐配置**
- 月度会员：¥29.9 / 30天
- 季度会员：¥49.9 / 90天
- 年度会员：¥99.9 / 365天

**支付方式**
- 收款码支付
- 手动确认激活
- 本地会员管理

**会员权益**
- 无限次AI功能使用
- 完整知识库访问
- 优先客服支持

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd wechat-app-mall
```

### 2. 安装依赖

```bash
# 小程序依赖
npm install

# 在微信开发者工具中构建npm
工具 → 构建 npm
```

### 3. 配置项目

编辑 `config.js`：
```javascript
module.exports = {
  // 知识库API
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

### 4. 启动后端服务

```bash
# 使用PM2统一启动
pm2 start ecosystem.config.js

# 查看状态
pm2 status
```

### 5. 测试

```bash
# 运行自动化测试
npm test

# 在微信开发者工具中测试
# 打开项目 → 编译 → 预览
```

## 📚 文档导航

### 快速入门
- [README.md](./README.md) - 项目总览
- [TODO.md](./TODO.md) - 待办事项清单

### 部署相关
- [部署架构](./docs/DEPLOYMENT_ARCHITECTURE.md) - 后端服务部署架构
- [会员服务部署](./docs/MEMBER_SERVICE_DEPLOYMENT.md) - 会员服务部署指南
- [Nginx配置](./docs/NGINX_CONFIG_GUIDE.md) - Nginx配置指南

### 功能实现
- [数据库设计](./docs/DATABASE_DESIGN_FINAL.md) - 会员系统数据库设计
- [支付方案](./docs/PERSONAL_QRCODE_IMPLEMENTATION.md) - 收款码支付实现
- [系统架构](./docs/technical/ARCHITECTURE.md) - 系统架构设计

### 后端服务
- [knowledge-api](./knowledge-api/README.md) - 知识库API文档
- [member-service](./member-service/README.md) - 会员服务文档

### 测试
- [测试总结](./tests/test-summary.md) - 完整测试报告

## 🔧 开发指南

### 目录规范

- `pages/` - 页面文件（.js, .json, .wxml, .wxss）
- `components/` - 可复用组件
- `utils/` - 工具函数（单一职责）
- `docs/` - 项目文档
- `tests/` - 自动化测试

### 代码规范

- 使用ES6+语法
- 函数使用JSDoc注释
- 遵循单一职责原则
- 统一错误处理
- 提供用户友好的提示

### 测试规范

- 每个功能模块都有对应测试
- 测试覆盖核心流程
- 包含边界情况测试
- 保持100%通过率

## 📈 性能指标

### 代码包大小
- 当前：~1.5MB
- 限制：2MB
- 剩余：~0.5MB

### 测试覆盖
- 测试用例：73个
- 通过率：100%
- 覆盖模块：认证、会员、支付、边界

### 响应时间
- API响应：< 50ms
- 页面加载：< 1s
- 知识库搜索：< 100ms

## 🎯 下一步计划

### 短期（1-2周）
1. 配置收款码和AI服务
2. 提交微信审核
3. 监控用户反馈
4. 优化性能

### 中期（1-3个月）
1. 接入微信支付
2. 扩展会员权益
3. 添加数据分析
4. 优化AI功能

### 长期（3-6个月）
1. 扩展技术领域
2. 增加社区功能
3. 开发管理后台
4. 移动端适配

## 📞 联系方式

- 项目仓库：[GitHub](https://github.com/your-repo)
- 问题反馈：[Issues](https://github.com/your-repo/issues)
- 文档中心：[docs/](./docs/)

---

**版本**: 8.4.0  
**最后更新**: 2025-11-29  
**维护状态**: 🟢 活跃开发中

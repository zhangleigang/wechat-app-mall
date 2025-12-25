# 🎯 AI面试助手

<div align="center">

**基于微信小程序的智能职业发展工具，专注于大数据领域的面试准备**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)
[![WeChat](https://img.shields.io/badge/WeChat-MiniProgram-07C160.svg)](https://developers.weixin.qq.com/miniprogram/dev/framework/)

[功能特性](#-核心功能) • [快速开始](#-快速开始) • [技术栈](#️-技术栈) • [文档](#-文档)

</div>

---

## 📖 项目简介

AI面试助手是一款专为大数据领域求职者打造的智能面试准备工具，提供：

- 🤖 **AI智能分析** - 简历优化建议
- 📚 **面试题库** - 200+ 精选大数据技术面试题
- 💎 **会员服务** - 灵活的付费套餐（月度/季度/年度）
- ⭐ **收藏管理** - 多来源收藏，标签分类，AI生成答案

## 📦 项目结构

```
ai-interview-helper/
├── miniprogram/              # 📱 小程序前端
│   ├── pages/               # 页面模块
│   │   ├── ai/             # AI功能（简历解读）
│   │   ├── knowledge/      # 知识库（题目浏览、搜索）
│   │   ├── favorites/      # 我的收藏（收藏管理、标签筛选）
│   │   ├── member/         # 会员中心（购买、管理）
│   │   ├── my/             # 个人中心
│   │   └── login/          # 登录认证
│   ├── components/          # 可复用组件
│   ├── utils/              # 工具函数
│   │   ├── simpleAuth.js   # 认证工具
│   │   ├── member-api.js   # 会员API
│   │   └── knowledge-api.js # 知识库API
│   ├── images/             # 图片资源
│   ├── app.js              # 应用入口
│   ├── config.js           # 配置文件
│   └── README.md           # 前端文档
│
├── server/                  # 🚀 后端服务
│   ├── src/
│   │   ├── routes/         # API路由
│   │   │   ├── auth.js     # 认证接口
│   │   │   ├── member.js   # 会员接口
│   │   │   ├── knowledge.js # 知识库接口
│   │   │   ├── favorites.js # 收藏接口
│   │   │   ├── order.js    # 订单接口
│   │   │   ├── admin.js    # 管理接口
│   │   │   └── upload.js   # 文件上传
│   │   ├── middleware/     # 中间件
│   │   ├── utils/          # 工具函数
│   │   ├── data/           # 知识库数据
│   │   └── static/         # 静态文件（头像、收款码）
│   ├── config/             # 配置文件
│   ├── database/           # 数据库脚本
│   ├── server.js           # 服务入口
│   └── README.md           # 后端文档
│
├── docs/                    # 📚 文档
│   ├── TESTING_CHECKLIST.md      # 测试清单
│   ├── OPTIMIZATION_GUIDE.md     # 优化指南
│   ├── DEPLOYMENT_CHECKLIST.md   # 部署清单
│   └── ...
│
├── .gitignore
└── README.md               # 本文件
```

## 🎯 核心功能

### ⭐ 我的收藏功能（新增）

**功能亮点**：
- 📌 **多来源收藏** - 支持从知识库、简历解读、自定义问题三个来源收藏内容
- 🏷️ **标签管理** - 灵活的标签分类系统，支持添加、删除、筛选
- 🤖 **AI生成答案** - 自定义问题可通过AI生成专业答案（流式输出）
- 💎 **会员配额** - 免费用户10条，会员无限制
- 📝 **Markdown渲染** - 完美支持Markdown格式的答案展示
- 🔍 **智能筛选** - 按标签筛选，快速找到需要的内容
- 📱 **实时同步** - 所有操作实时更新UI，无需刷新

**使用场景**：
1. 从知识库收藏重要面试题
2. 保存简历解读中的有价值分析
3. 添加自定义问题并获取AI答案
4. 使用标签组织和分类收藏内容
5. 按标签快速查找特定类型的问题

**技术特点**：
- Server-Sent Events (SSE) 流式输出
- 会员配额自动检查
- 标签自动去重和使用次数统计
- 数据库级联删除保证数据一致性

### 用户端功能

| 功能模块 | 描述 | 状态 |
|---------|------|------|
| 🔐 **用户认证** | 基于微信OpenID的无感登录 | ✅ |
| 👤 **个人中心** | 昵称、头像管理，会员状态查看 | ✅ |
| 💎 **会员服务** | 月度/季度/年度套餐，收款码支付 | ✅ |
| 📚 **知识库** | 200+ 大数据面试题，分类浏览和搜索 | ✅ |
| 🤖 **简历解读** | AI驱动的简历优化建议 | ✅ |
| ⭐ **我的收藏** | 收藏面试问题，标签分类管理 | ✅ |
| 🖼️ **头像上传** | 支持自定义头像，永久存储 | ✅ |

### 管理端功能

| 功能模块 | 描述 | 状态 |
|---------|------|------|
| 📊 **订单管理** | 查看、导出订单记录 | ✅ |
| 👥 **会员管理** | 会员列表、状态管理 | ✅ |
| 📈 **数据统计** | 用户数据、收入统计 | 🚧 |

## 🚀 快速开始

### 环境要求

- **Node.js** >= 14.0.0
- **MySQL** >= 8.0
- **微信开发者工具** 最新版
- **PM2** (生产环境)

### 前端开发

```bash
# 1. 进入前端目录
cd miniprogram

# 2. 安装依赖
npm install

# 3. 使用微信开发者工具打开 miniprogram 目录
# 4. 工具 → 构建 npm
# 5. 开始开发
```

📖 详细文档：[miniprogram/README.md](miniprogram/README.md)

### 后端开发

```bash
# 1. 进入后端目录
cd server

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
vi .env  # 修改数据库密码等配置

# 4. 初始化数据库
mysql -u root -p < database/init.sql

# 5. 启动服务
npm start
```

📖 详细文档：[server/README.md](server/README.md)

### 生产部署

```bash
# 1. 后端部署
cd server
pm2 start server.js --name ai-interview-helper
pm2 save

# 2. 配置 Nginx（参考 docs/nginx-config-fixed.conf）
# 3. 配置 SSL 证书
# 4. 小程序提交审核
```

📖 详细文档：[docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)

## 🛠️ 技术栈

### 前端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| 微信小程序 SDK | 8.4.0 | 核心框架 |
| Vant Weapp | 1.11.6 | UI组件库 |
| mp-html | 2.3.1 | Markdown渲染 |
| dayjs | 1.11.6 | 日期处理 |

### 后端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 14+ | 运行环境 |
| Express.js | 4.18.2 | Web框架 |
| MySQL | 8.0+ | 数据库 |
| JWT | 9.0.2 | 认证 |
| Multer | 1.4.5 | 文件上传 |

### 部署技术

| 技术 | 用途 |
|------|------|
| PM2 | 进程管理 |
| Nginx | 反向代理、静态文件服务 |
| Let's Encrypt | SSL证书 |

## 📚 文档

### 开发文档
- [前端开发指南](miniprogram/README.md)
- [后端开发指南](server/README.md)
- [API文档](docs/FINAL_DOCUMENTATION.md)

### 运维文档
- [部署清单](docs/DEPLOYMENT_CHECKLIST.md)
- [测试清单](docs/TESTING_CHECKLIST.md)
- [优化指南](docs/OPTIMIZATION_GUIDE.md)

### 架构文档
- [技术栈说明](.kiro/steering/tech.md)
- [项目结构](.kiro/steering/structure.md)
- [产品说明](.kiro/steering/product.md)

## 🔗 相关链接

- **生产环境**: https://api.feelnow.cn
- **API文档**: https://api.feelnow.cn/api
- **微信小程序**: [待发布]

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 开源协议

本项目采用 [MIT](LICENSE) 协议开源。

## 📞 联系方式

- **问题反馈**: [GitHub Issues](https://github.com/your-repo/issues)
- **技术支持**: [待添加]

---

<div align="center">

**Made with ❤️ by AI Interview Helper Team**

⭐ 如果这个项目对你有帮助，请给我们一个 Star！

**最后更新**: 2024-12-03 | **版本**: 1.0.0

</div>

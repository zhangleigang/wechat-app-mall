# 更新日志

## [2.0.0] - 2025-11-29

### 🎉 重大更新

#### 架构优化
- ✨ 分离后端服务：knowledge-api 和 member-service 独立部署
- ✨ 新增 PM2 统一配置文件（ecosystem.config.js）
- ✨ 完善 Nginx 反向代理配置
- ✨ 优化部署架构文档

#### 文档优化
- 📝 精简项目文档，从30+个减少到25个核心文档
- 📝 删除冗余的数据库设计文档（保留最终版）
- 📝 删除重复的根目录文档
- 📝 新增项目概览文档（PROJECT_OVERVIEW.md）
- 📝 新增部署架构文档（DEPLOYMENT_ARCHITECTURE.md）
- 📝 优化 README.md，更简洁清晰
- 📝 优化 TODO.md，分类更明确

#### knowledge-api 优化
- 🔧 更新 package.json 版本到 2.0.0
- 📝 新增项目结构文档（PROJECT_STRUCTURE.md）
- 📝 重写 README.md，更专业清晰
- 🔧 优化 .gitignore 配置

#### member-service 优化
- 📝 新增完整的 README.md
- 📝 数据库设计文档优化
- 🔧 保持简洁的项目结构

### 🐛 Bug修复
- 修复文档中的重复内容
- 修复文档链接错误

### 📚 文档结构

```
根目录文档（3个）
├── README.md              # 项目总览
├── PROJECT_OVERVIEW.md    # 项目概览
└── TODO.md                # 待办清单

docs/（13个核心文档）
├── README.md              # 文档索引
├── DEPLOYMENT_ARCHITECTURE.md  # 部署架构
├── DATABASE_DESIGN_FINAL.md    # 数据库设计
└── ...

后端服务文档
├── knowledge-api/
│   ├── README.md
│   └── PROJECT_STRUCTURE.md
└── member-service/
    └── README.md
```

---

## [1.0.0] - 2025-11-25

### 🎉 首次发布

#### 核心功能
- ✨ AI功能：岗位分析、简历解读、情绪小屋
- ✨ 知识库：200+面试题，10+技术分类
- ✨ 会员系统：收款码支付，本地会员管理
- ✨ 认证系统：微信登录，JWT token管理

#### 后端服务
- ✨ knowledge-api：知识库数据 + 用户认证
- ✨ member-service：会员管理 + 订单对账

#### 测试
- ✅ 73个自动化测试用例
- ✅ 100%测试通过率
- ✅ 覆盖认证、会员、支付、边界情况

#### 文档
- 📝 完整的项目文档
- 📝 部署指南
- 📝 API文档
- 📝 测试报告

---

## 版本说明

### 版本号规则

采用语义化版本号：`主版本号.次版本号.修订号`

- **主版本号**：重大架构变更或不兼容的API修改
- **次版本号**：新增功能，向下兼容
- **修订号**：Bug修复，向下兼容

### 更新类型标识

- 🎉 重大更新
- ✨ 新增功能
- 🔧 功能优化
- 🐛 Bug修复
- 📝 文档更新
- 🔒 安全更新
- ⚡ 性能优化
- 🎨 UI/样式更新

---

**维护者**: 项目团队  
**最后更新**: 2025-11-29

# 📁 Server 目录结构说明

> 简洁的服务器文件组织，文档集中管理

---

## 🎯 设计原则

**保持服务器文件整洁** - 只保留运行必需的文件，所有文档集中在 `docs/` 目录

---

## 📂 目录结构

```
server/
├── 📄 server.js                    # 主服务文件
├── 📄 package.json                 # 依赖配置
├── 📄 .env.example                 # 环境变量示例
├── 📄 README.md                    # 项目简介（简洁版）
│
├── 🔧 deploy.sh                    # 部署脚本
├── 🔧 pack.sh                      # 打包脚本
├── 🔧 setup-static-files.sh        # 静态文件设置
├── 🔧 check-structure.sh           # 文档结构检查
│
├── 📚 docs/                        # 📚 所有文档集中在这里
│   ├── README.md                   # 文档索引
│   ├── DEPLOYMENT_GUIDE.md         # 完整部署指南
│   ├── QUICK_DEPLOY.md             # 快速部署
│   ├── RESUME_FEATURE_DEPLOY.md    # 简历功能部署
│   ├── RESUME_DEPLOY_CHECKLIST.md  # 部署检查清单
│   ├── RESUME_API.md               # 简历 API 文档
│   └── STATIC_FILES_GUIDE.md       # 静态文件指南
│
├── ⚙️  config/                     # 配置文件
│   ├── index.js                    # 服务配置
│   └── database.js                 # 数据库配置
│
├── 🗄️  database/                   # 数据库脚本
│   ├── init.sql                    # 初始化脚本
│   ├── init-resumes.sql            # 简历表脚本
│   └── maintenance.sql             # 维护脚本
│
├── 🔨 scripts/                     # 工具脚本
│   └── migrate-resumes.js          # 简历迁移脚本
│
└── 💻 src/                         # 源代码
    ├── routes/                     # API 路由
    ├── middleware/                 # 中间件
    ├── services/                   # 服务层
    ├── config/                     # 配置
    ├── utils/                      # 工具函数
    ├── data/                       # 数据文件
    └── static/                     # 静态文件
```

---

## ✅ 根目录文件说明

### 必须保留的文件

| 文件 | 类型 | 说明 | 原因 |
|------|------|------|------|
| `server.js` | 代码 | 主服务入口 | 运行必需 |
| `package.json` | 配置 | 依赖管理 | 运行必需 |
| `.env.example` | 配置 | 环境变量模板 | 部署必需 |
| `README.md` | 文档 | 项目简介 | 快速了解项目 |
| `deploy.sh` | 脚本 | 部署脚本 | 必须在根目录执行 |
| `pack.sh` | 脚本 | 打包脚本 | 必须在根目录执行 |
| `setup-static-files.sh` | 脚本 | 静态文件设置 | 必须在根目录执行 |
| `check-structure.sh` | 脚本 | 结构检查 | 打包前检查 |

### 不应该在根目录的文件

❌ 详细部署指南 → 移到 `docs/`  
❌ API 文档 → 移到 `docs/`  
❌ 功能说明文档 → 移到 `docs/`  
❌ 检查清单 → 移到 `docs/`

---

## 📚 docs/ 目录

所有详细文档都在这里：

### 文档分类

1. **部署指南** (`*_DEPLOY*.md`)
   - 完整的部署步骤
   - 配置说明
   - 故障排查

2. **API 文档** (`*_API.md`)
   - 接口说明
   - 请求/响应示例
   - 错误码

3. **配置指南** (`*_GUIDE.md`)
   - 配置步骤
   - 最佳实践

4. **检查清单** (`*_CHECKLIST.md`)
   - 可打印的清单
   - 逐项检查

---

## 🔧 工作流程

### 开发新功能

1. 编写代码 → `src/`
2. 编写 API 文档 → `docs/NEW_FEATURE_API.md`
3. 编写部署指南 → `docs/NEW_FEATURE_DEPLOY.md`
4. 更新 `docs/README.md` 索引

### 打包部署

1. 运行 `bash check-structure.sh` 检查结构
2. 运行 `bash pack.sh` 打包（自动检查）
3. 上传到服务器
4. 参考 `docs/` 中的部署文档

### 查看文档

1. 本地查看 `server/docs/`
2. 或访问 Git 仓库
3. 服务器上不需要文档

---

## 🚀 打包说明

### pack.sh 行为

打包时**包含**：
- ✅ 源代码 (`src/`)
- ✅ 配置文件 (`config/`)
- ✅ 数据库脚本 (`database/`)
- ✅ 工具脚本 (`scripts/`)
- ✅ 部署脚本 (`deploy.sh`)
- ✅ 环境变量示例 (`.env.example`)
- ✅ 简要说明 (`README.md`)

打包时**排除**：
- ❌ 详细文档 (`docs/`)
- ❌ node_modules
- ❌ 日志文件
- ❌ 临时文件

### 为什么排除 docs/？

1. **减小包体积** - 文档通常很大
2. **保持整洁** - 服务器只需要运行文件
3. **便于维护** - 文档在本地或 Git 查看
4. **安全考虑** - 避免暴露详细的系统信息

---

## 🔍 自动检查

### check-structure.sh

打包前自动检查：

✅ 根目录没有多余文档  
✅ docs/ 目录存在且包含文档  
✅ 必要文件都存在  
✅ 脚本有执行权限

如果检查失败，打包会中止。

---

## 📝 规范记录

这个结构规范已记录在：

- **Steering 文件**: `.kiro/steering/deployment.md`
- **本文档**: `server/STRUCTURE_SUMMARY.md`
- **检查脚本**: `server/check-structure.sh`

Kiro AI 会记住这个规范，未来创建文档时自动遵循。

---

## 🎓 最佳实践

### DO ✅

- 保持根目录整洁
- 所有详细文档放 `docs/`
- 脚本放根目录（如果需要在根目录执行）
- 更新 `docs/README.md` 索引

### DON'T ❌

- 不要在根目录放详细文档
- 不要在 `docs/` 放可执行脚本
- 不要在 `docs/` 放配置文件
- 不要忘记更新文档索引

---

## 📞 问题反馈

如果发现文档结构问题：

1. 运行 `bash check-structure.sh` 检查
2. 查看 `.kiro/steering/deployment.md` 规范
3. 按规范调整文件位置

---

**创建日期**: 2025-12-05  
**维护者**: 开发团队  
**版本**: 1.0.0

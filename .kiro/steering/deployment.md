# 部署规范

## 文档组织规范

### Server 目录结构

为保持服务器文件整洁，遵循以下规范：

**必须保留在 server 根目录的文件**：
- `server.js` - 主服务文件
- `package.json` - 依赖配置
- `.env.example` - 环境变量示例
- `deploy.sh` - 部署脚本（必须在根目录执行）
- `pack.sh` - 打包脚本
- `setup-static-files.sh` - 静态文件设置脚本
- `README.md` - 项目说明（简要）

**必须移到 docs 目录的文件**：
- 所有详细的部署指南（`*_DEPLOY*.md`）
- 所有 API 文档（`*_API.md`）
- 所有功能说明文档（`*_GUIDE.md`）
- 所有检查清单（`*_CHECKLIST.md`）

### 文档分类

```
server/
├── server.js              # 主服务
├── package.json           # 依赖
├── .env.example           # 环境变量示例
├── deploy.sh              # 部署脚本
├── pack.sh                # 打包脚本
├── setup-static-files.sh  # 设置脚本
├── README.md              # 简要说明
├── docs/                  # 📚 所有文档集中在这里
│   ├── DEPLOYMENT_GUIDE.md           # 通用部署指南
│   ├── QUICK_DEPLOY.md               # 快速部署
│   ├── RESUME_FEATURE_DEPLOY.md      # 简历功能部署
│   ├── RESUME_DEPLOY_CHECKLIST.md    # 简历部署检查清单
│   ├── RESUME_API.md                 # 简历 API 文档
│   ├── STATIC_FILES_GUIDE.md         # 静态文件指南
│   └── [其他文档]
├── config/                # 配置文件
├── database/              # 数据库脚本
├── scripts/               # 工具脚本
└── src/                   # 源代码
```

### 打包规则

使用 `pack.sh` 打包时：
- ✅ 包含：代码、配置、脚本、必要文档
- ❌ 排除：详细文档（docs/）、node_modules、日志、临时文件

### 部署时文档访问

部署到服务器后，如需查看文档：
1. 在本地查看 `server/docs/` 目录
2. 或访问项目 Git 仓库
3. 服务器上只保留必要的运行文件

### 创建新文档时的规则

当创建新的文档时：
- 如果是**部署指南、API 文档、功能说明**：放在 `server/docs/`
- 如果是**可执行脚本**：放在 `server/` 根目录或 `server/scripts/`
- 如果是**配置文件**：放在 `server/config/`
- 如果是**数据库脚本**：放在 `server/database/`

### README.md 规范

`server/README.md` 应该保持简洁，只包含：
- 项目简介（1-2 段）
- 快速启动命令
- 文档索引（指向 docs/ 目录）
- 不要包含详细的部署步骤（放在 docs/ 中）

示例：
```markdown
# AI面试助手后端服务

统一后端服务，整合认证、会员、知识库、简历管理等功能。

## 快速启动

\`\`\`bash
npm install
npm start
\`\`\`

## 文档

- [部署指南](docs/DEPLOYMENT_GUIDE.md)
- [简历功能部署](docs/RESUME_FEATURE_DEPLOY.md)
- [API 文档](docs/RESUME_API.md)

## 环境要求

- Node.js 14+
- MySQL 8.0+
- PM2（生产环境）
```

## 部署最佳实践

### 1. 打包前检查

```bash
# 确保文档在正确位置
ls server/docs/*.md

# 确保脚本在根目录
ls server/*.sh
```

### 2. 打包命令

```bash
cd server
bash pack.sh
```

### 3. 服务器部署

服务器上只需要：
- 代码文件（src/）
- 配置文件（config/）
- 数据库脚本（database/）
- 工具脚本（scripts/）
- 部署脚本（deploy.sh）
- 环境变量示例（.env.example）

### 4. 文档查阅

需要查看文档时，在本地或 Git 仓库查看 `server/docs/` 目录。

## 注意事项

1. **永远不要**把详细文档放在 server 根目录
2. **永远不要**把可执行脚本放在 docs 目录
3. **始终保持** server 根目录整洁
4. **定期检查**文档是否在正确位置

## 自动化检查

可以创建一个检查脚本：

```bash
#!/bin/bash
# check-structure.sh

echo "检查文档结构..."

# 检查根目录是否有不该存在的文档
if ls server/*_GUIDE.md 2>/dev/null || ls server/*_API.md 2>/dev/null; then
    echo "❌ 发现文档文件在根目录，应该移到 docs/"
    exit 1
fi

echo "✅ 文档结构正确"
```

---

**记住**：保持服务器文件整洁，文档集中管理在 docs/ 目录！

# ⚡ 快速参考

> 常用命令和文档快速索引

---

## 📚 文档位置

所有详细文档在 `docs/` 目录：

```bash
cd server/docs
ls -la
```

或查看 [docs/README.md](docs/README.md) 获取完整索引。

---

## 🚀 常用命令

### 开发

```bash
# 安装依赖
npm install

# 启动开发服务
npm start

# 查看日志
pm2 logs ai-interview-helper
```

### 部署

```bash
# 检查文档结构
bash check-structure.sh

# 打包（自动检查结构）
bash pack.sh

# 上传到服务器
scp ai-interview-helper-server-*.tar.gz root@47.95.196.190:/root/

# 部署（在服务器上）
bash deploy.sh
```

### 维护

```bash
# 查看服务状态
pm2 status

# 重启服务
pm2 restart ai-interview-helper

# 备份数据库
mysqldump -u root -p ai_interview_helper > backup_$(date +%Y%m%d).sql
```

---

## 📖 快速导航

| 需求 | 文档 |
|------|------|
| 首次部署 | [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) |
| 快速部署 | [docs/QUICK_DEPLOY.md](docs/QUICK_DEPLOY.md) |
| 简历功能 | [docs/RESUME_FEATURE_DEPLOY.md](docs/RESUME_FEATURE_DEPLOY.md) |
| API 接口 | [docs/RESUME_API.md](docs/RESUME_API.md) |
| 静态文件 | [docs/STATIC_FILES_GUIDE.md](docs/STATIC_FILES_GUIDE.md) |

---

## 🔧 目录结构

```
server/
├── 📄 运行文件 (server.js, package.json, .env.example)
├── 🔧 脚本 (deploy.sh, pack.sh, check-structure.sh)
├── 📚 docs/ - 所有详细文档
├── ⚙️  config/ - 配置文件
├── 🗄️  database/ - 数据库脚本
├── 🔨 scripts/ - 工具脚本
└── 💻 src/ - 源代码
```

详见 [STRUCTURE_SUMMARY.md](STRUCTURE_SUMMARY.md)

---

## ⚠️ 重要提示

1. **文档位置**: 所有详细文档在 `docs/` 目录
2. **打包前检查**: `bash check-structure.sh`
3. **服务器整洁**: 打包时不包含 `docs/` 目录
4. **规范记录**: `.kiro/steering/deployment.md`

---

**最后更新**: 2025-12-05

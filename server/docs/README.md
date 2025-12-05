# 📚 AI面试助手后端服务 - 文档中心

> 所有详细文档集中在这里，保持服务器文件整洁

---

## 📖 文档索引

### 🚀 部署相关

| 文档 | 说明 | 适用场景 |
|------|------|----------|
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | 完整部署指南 | 首次部署或完整了解部署流程 |
| [QUICK_DEPLOY.md](QUICK_DEPLOY.md) | 快速部署命令 | 熟悉流程后的快速部署 |
| [RESUME_FEATURE_DEPLOY.md](RESUME_FEATURE_DEPLOY.md) | 简历功能部署指南 | 部署简历管理功能 |
| [RESUME_DEPLOY_CHECKLIST.md](RESUME_DEPLOY_CHECKLIST.md) | 简历功能部署检查清单 | 部署时逐项检查 |

### 📡 API 文档

| 文档 | 说明 | 内容 |
|------|------|------|
| [RESUME_API.md](RESUME_API.md) | 简历管理 API | 上传、列表、删除、AI问答接口 |

### 🔧 配置指南

| 文档 | 说明 | 适用场景 |
|------|------|----------|
| [STATIC_FILES_GUIDE.md](STATIC_FILES_GUIDE.md) | 静态文件配置 | 配置收款码等静态资源 |

---

## 🎯 快速导航

### 我想...

**部署新服务器**
1. 阅读 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
2. 按照步骤操作
3. 使用 [QUICK_DEPLOY.md](QUICK_DEPLOY.md) 作为命令参考

**部署简历功能**
1. 阅读 [RESUME_FEATURE_DEPLOY.md](RESUME_FEATURE_DEPLOY.md)
2. 使用 [RESUME_DEPLOY_CHECKLIST.md](RESUME_DEPLOY_CHECKLIST.md) 逐项检查
3. 参考 [RESUME_API.md](RESUME_API.md) 了解接口

**配置静态文件**
1. 阅读 [STATIC_FILES_GUIDE.md](STATIC_FILES_GUIDE.md)
2. 按照步骤配置收款码

**了解 API 接口**
1. 查看 [RESUME_API.md](RESUME_API.md)
2. 参考请求/响应示例
3. 查看错误码说明

---

## 📝 文档规范

### 文档分类

- **部署指南**: `*_DEPLOY*.md` - 部署相关的详细步骤
- **API 文档**: `*_API.md` - API 接口说明和示例
- **配置指南**: `*_GUIDE.md` - 配置和设置说明
- **检查清单**: `*_CHECKLIST.md` - 可打印的检查清单

### 文档位置

✅ **应该在 docs/ 目录**:
- 所有详细的部署指南
- 所有 API 文档
- 所有功能说明文档
- 所有检查清单

❌ **不应该在 docs/ 目录**:
- 可执行脚本（应在 server/ 根目录）
- 配置文件（应在 config/ 目录）
- 数据库脚本（应在 database/ 目录）

### 创建新文档

创建新文档时，请遵循以下规则：

1. **命名规范**: 使用大写字母和下划线，如 `NEW_FEATURE_GUIDE.md`
2. **放置位置**: 所有文档放在 `docs/` 目录
3. **更新索引**: 在本文件中添加新文档的链接
4. **保持简洁**: server 根目录只保留 README.md

---

## 🔗 相关资源

- **服务器代码**: `../server/`
- **前端代码**: `../../miniprogram/`
- **项目文档**: `../../docs/`
- **Steering 规范**: `../../.kiro/steering/deployment.md`

---

## 📞 技术支持

如果文档有问题或需要补充：

1. 检查是否有最新版本
2. 查看 Git 提交历史
3. 联系开发团队

---

**最后更新**: 2025-12-05  
**文档版本**: 1.0.0

# 📚 服务端文档

AI面试助手后端服务的完整文档。

## 📖 文档索引

### API 文档

- **[收藏管理 API](FAVORITES_API.md)** - 收藏功能的完整API文档（✅ v1.2.0 已部署）
  - 收藏CRUD操作
  - 标签管理
  - AI生成答案（SSE流式）
  - 会员配额管理
  
- **[简历管理 API](RESUME_API.md)** - 简历功能的完整API文档（✅ v1.1.0 已部署）
  - 简历上传和解析
  - 简历列表管理
  - AI智能问答

### 部署文档

- **[部署总结](DEPLOYMENT_SUMMARY.md)** - 版本历史和快速部署指南（⭐ 推荐）

- **[快速部署指南](QUICK_DEPLOY.md)** - 快速部署命令和步骤

- **[生产环境部署清单](PRODUCTION_DEPLOYMENT_CHECKLIST.md)** - 完整的部署检查清单

### 功能指南

- **[静态文件配置](STATIC_FILES_GUIDE.md)** - 静态文件服务配置说明

## 🚀 快速开始

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
vi .env

# 3. 初始化数据库
mysql -u root -p < database/init.sql

# 4. 启动服务
npm start
```

### 生产部署

```bash
# 1. 打包
bash pack.sh

# 2. 上传到服务器
scp server-*.tar.gz root@your-server:/root/

# 3. 部署
ssh root@your-server
tar -xzf server-*.tar.gz
cd server
vi .env
pm2 restart ai-interview-helper
```

详细步骤请参考 [快速部署指南](QUICK_DEPLOY.md)。

## 📊 数据库

### 主要表结构

- `members` - 用户和会员信息
- `orders` - 订单记录
- `resumes` - 简历信息
- `favorites` - 收藏记录
- `tags` - 标签
- `favorite_tags` - 收藏标签关联

### 初始化脚本

```bash
# 完整初始化（包含所有表）
mysql -u root -p ai_interview_helper < database/init.sql

# 单独初始化简历表
mysql -u root -p ai_interview_helper < database/init-resumes.sql

# 单独初始化收藏表
mysql -u root -p ai_interview_helper < database/init-favorites.sql
```

## 🔧 常用命令

### PM2 管理

```bash
pm2 list                          # 查看服务列表
pm2 logs ai-interview-helper      # 查看日志
pm2 restart ai-interview-helper   # 重启服务
pm2 stop ai-interview-helper      # 停止服务
pm2 monit                         # 实时监控
```

### 数据库操作

```bash
# 连接数据库
mysql -u root -p ai_interview_helper

# 备份数据库
mysqldump -u root -p ai_interview_helper > backup_$(date +%Y%m%d).sql

# 恢复数据库
mysql -u root -p ai_interview_helper < backup.sql
```

## 🐛 故障排查

### 服务无法启动

```bash
# 检查端口占用
netstat -tlnp | grep :3000

# 检查数据库连接
mysql -u root -p -e "SELECT 1"

# 查看详细日志
pm2 logs ai-interview-helper --lines 200
```

### 数据库连接失败

```bash
# 检查 .env 配置
cat .env | grep DB_

# 测试数据库连接
mysql -h localhost -u root -p ai_interview_helper -e "SELECT 1"
```

## 📞 技术支持

如有问题，请查看：
- 错误日志: `pm2 logs ai-interview-helper --err`
- 数据库状态: `mysql -u root -p -e "USE ai_interview_helper; SHOW TABLES;"`
- 服务状态: `pm2 status`

---

**版本**: 1.2.0 | **最后更新**: 2025-12-08

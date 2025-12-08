# 📦 部署总结

## 当前版本

**版本**: v1.2.0  
**发布日期**: 2025-12-08  
**服务地址**: https://api.feelnow.cn

---

## 已部署功能

### ✅ v1.2.0 - 收藏管理功能

**部署日期**: 2025-12-08

**新增功能**:
- 收藏CRUD操作（创建、查看、编辑、删除）
- 标签管理系统（添加、删除、筛选）
- AI生成答案（SSE流式输出）
- 会员配额管理（免费10条，会员无限）
- Markdown渲染支持
- 分页加载和实时更新

**数据库变更**:
- 新增 `favorites` 表
- 新增 `tags` 表
- 新增 `favorite_tags` 表
- 新增 4 个视图（favorite_stats, tag_usage_stats, recent_favorites, popular_tags）
- 新增 2 个触发器（标签使用次数自动更新）

**API端点** (10个):
1. `GET /api/favorites/stats` - 获取统计信息
2. `GET /api/favorites/tags` - 获取标签列表
3. `GET /api/favorites` - 获取收藏列表
4. `GET /api/favorites/:id` - 获取收藏详情
5. `POST /api/favorites` - 创建收藏
6. `PUT /api/favorites/:id` - 更新收藏
7. `DELETE /api/favorites/:id` - 删除收藏
8. `POST /api/favorites/:id/tags` - 添加标签
9. `DELETE /api/favorites/:id/tags/:tagId` - 删除标签
10. `POST /api/favorites/generate-answer` - AI生成答案（SSE流式）

**部署文件**:
- `server/src/routes/favorites.js` (新增，1200+ 行)
- `server/database/init-favorites.sql` (新增)
- `server/docs/FAVORITES_API.md` (新增)
- `server/server.js` (修改，注册路由)
- `server/database/init.sql` (修改，包含收藏表)

**测试状态**: ✅ 所有核心测试通过

---

### ✅ v1.1.0 - 简历管理功能

**部署日期**: 2025-12-05

**功能**:
- 简历上传（PDF、Word、Markdown）
- 简历列表管理（最多3个）
- 简历删除
- AI智能问答（基于DeepSeek）
- 智能文档类型识别

**数据库变更**:
- 新增 `resumes` 表

**API端点** (5个):
1. `POST /api/resume/upload` - 上传简历
2. `GET /api/resume/list` - 获取简历列表
3. `DELETE /api/resume/:id` - 删除简历
4. `POST /api/resume/chat` - AI问答
5. `POST /api/resume/chat-stream` - AI问答（流式）

---

### ✅ v1.0.0 - 基础功能

**部署日期**: 2024-12-03

**功能**:
- 用户认证（JWT + OpenID）
- 微信登录
- 会员管理（状态查询、开通、续费）
- 订单管理
- 知识库API
- 静态文件服务
- 管理后台

**数据库表**:
- `members` - 会员信息
- `orders` - 订单记录

---

## 快速部署命令

### 本地打包

```bash
cd server
bash pack.sh
```

### 上传到服务器

```bash
scp ai-interview-helper-server-*.tar.gz root@your-server:/root/
```

### 服务器部署

```bash
# SSH 登录
ssh root@your-server

# 解压
cd /root
tar -xzf ai-interview-helper-server-*.tar.gz
cd server

# 重启服务
pm2 restart ai-interview-helper

# 查看日志
pm2 logs ai-interview-helper --lines 50
```

### 测试验证

```bash
# 测试收藏功能
curl -k "https://api.feelnow.cn/api/favorites/stats?openid=test_user"

# 测试简历功能
curl -k "https://api.feelnow.cn/api/resume/list?openid=test_user"

# 测试知识库
curl -k "https://api.feelnow.cn/api/knowledge/categories"
```

---

## 数据库结构

### 核心表

| 表名 | 说明 | 版本 |
|------|------|------|
| members | 会员信息 | v1.0.0 |
| orders | 订单记录 | v1.0.0 |
| resumes | 简历信息 | v1.1.0 |
| favorites | 收藏记录 | v1.2.0 |
| tags | 标签 | v1.2.0 |
| favorite_tags | 收藏标签关联 | v1.2.0 |

### 初始化脚本

```bash
# 完整初始化（首次部署）
mysql -u root -p ai_interview_helper < database/init.sql

# 单独初始化（增量部署）
mysql -u root -p ai_interview_helper < database/init-resumes.sql
mysql -u root -p ai_interview_helper < database/init-favorites.sql
```

---

## 环境配置

### 必需的环境变量

```bash
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ai_interview_helper

# 微信配置
WECHAT_APPID=your_appid
WECHAT_SECRET=your_secret

# JWT配置
JWT_SECRET=your_jwt_secret

# DeepSeek AI配置
DEEPSEEK_API_KEY=your_api_key

# 服务器配置
PORT=3000
NODE_ENV=production
```

---

## 监控和维护

### 日常检查

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs ai-interview-helper --lines 100

# 查看错误日志
pm2 logs ai-interview-helper --err --lines 50

# 重启服务
pm2 restart ai-interview-helper
```

### 数据库维护

```bash
# 备份数据库
mysqldump -u root -p ai_interview_helper > backup_$(date +%Y%m%d).sql

# 查看表大小
mysql -u root -p -e "
SELECT 
  table_name AS 'Table',
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'ai_interview_helper'
ORDER BY (data_length + index_length) DESC;
"

# 查看收藏统计
mysql -u root -p -e "
USE ai_interview_helper;
SELECT COUNT(*) as total_favorites FROM favorites;
SELECT source_type, COUNT(*) as count FROM favorites GROUP BY source_type;
"
```

---

## 故障排查

### 常见问题

**Q: 服务无法启动**
```bash
# 检查端口占用
netstat -tlnp | grep :3000

# 查看详细日志
pm2 logs ai-interview-helper --lines 200

# 手动启动测试
cd /root/server
node server.js
```

**Q: 数据库连接失败**
```bash
# 检查配置
cat .env | grep DB_

# 测试连接
mysql -h localhost -u root -p ai_interview_helper -e "SELECT 1"
```

**Q: API返回错误**
```bash
# 查看错误日志
pm2 logs ai-interview-helper --err

# 检查数据库表
mysql -u root -p -e "USE ai_interview_helper; SHOW TABLES;"
```

---

## 下一步计划

### 待开发功能

- [ ] 数据统计和分析
- [ ] 用户行为追踪
- [ ] 性能优化
- [ ] 缓存机制
- [ ] 日志分析

---

**最后更新**: 2025-12-08  
**维护人员**: 开发团队

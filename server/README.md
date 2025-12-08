# 🚀 AI面试助手 - 后端服务

统一的 Node.js 后端服务，整合认证、会员、知识库、订单、简历管理等所有功能。

## 📁 目录结构

```
server/
├── src/
│   ├── routes/              # API路由
│   │   ├── auth.js         # 认证（登录、用户信息）
│   │   ├── member.js       # 会员（状态、开通、续费）
│   │   ├── knowledge.js    # 知识库（分类、题目）
│   │   ├── order.js        # 订单（查询）
│   │   ├── admin.js        # 管理（订单、会员列表）
│   │   └── upload.js       # 上传（头像）
│   ├── middleware/
│   │   ├── auth.js         # JWT认证中间件
│   │   └── errorHandler.js # 统一错误处理
│   ├── utils/
│   │   └── jwt.js          # JWT工具函数
│   ├── data/
│   │   └── knowledge.json  # 知识库数据（200+题目）
│   └── static/             # 静态文件服务
│       ├── avatars/        # 用户头像（动态上传）
│       └── images/         # 固定图片（收款码等）
├── config/
│   ├── index.js           # 服务配置（端口、CORS等）
│   └── database.js        # 数据库连接池
├── database/
│   └── init.sql          # 数据库初始化脚本
├── server.js             # 服务入口
├── package.json          # 依赖管理
├── .env.example          # 环境变量模板
└── README.md             # 本文件
```

## ⚡ 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
vi .env
```

必需配置：
```env
DB_PASSWORD=your_mysql_password
JWT_SECRET=your_random_secret_key
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret
```

### 3. 初始化数据库

```bash
# 执行初始化脚本（会自动创建数据库）
mysql -u root -p < database/init.sql
```

### 4. 启动服务

**开发环境：**
```bash
npm start
```

**生产环境：**
```bash
pm2 start server.js --name ai-interview-helper
pm2 save
```

## 📡 API 端点

### 基础信息
- **Base URL**: `https://api.feelnow.cn/api`
- **认证方式**: OpenID (Query Parameter)
- **响应格式**: JSON
- **当前版本**: v1.2.0

### 接口列表

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| **认证** | POST | `/auth/login` | 微信登录 |
| | GET | `/auth/userinfo` | 获取用户信息 |
| **会员** | GET | `/member/status` | 查询会员状态 |
| | POST | `/member/activate` | 开通会员 |
| | POST | `/member/renew` | 续费会员 |
| | POST | `/member/update-profile` | 更新用户信息 |
| **知识库** | GET | `/knowledge/categories` | 分类列表 |
| | GET | `/knowledge/questions` | 题目列表 |
| | GET | `/knowledge/questions/:id` | 题目详情 |
| **订单** | GET | `/orders` | 用户订单列表 |
| **简历** | POST | `/resume/upload` | 上传简历 |
| | GET | `/resume/list` | 简历列表 |
| | DELETE | `/resume/:id` | 删除简历 |
| | POST | `/resume/chat` | AI问答 |
| | POST | `/resume/chat-stream` | AI问答（流式） |
| **收藏** | POST | `/favorites` | 创建收藏 |
| | GET | `/favorites` | 收藏列表 |
| | GET | `/favorites/:id` | 收藏详情 |
| | PUT | `/favorites/:id` | 更新收藏 |
| | DELETE | `/favorites/:id` | 删除收藏 |
| | GET | `/favorites/tags` | 标签列表 |
| | POST | `/favorites/:id/tags` | 添加标签 |
| | DELETE | `/favorites/:id/tags/:tagId` | 移除标签 |
| | POST | `/favorites/generate-answer` | AI生成答案（SSE流式） |
| | GET | `/favorites/stats` | 收藏统计 |
| **上传** | POST | `/upload/avatar` | 上传头像 |
| **管理** | GET | `/admin/orders` | 订单管理 |
| | GET | `/admin/members` | 会员管理 |

## 🗄️ 数据库

### 表结构

**members** - 用户和会员信息
- `openid` (主键) - 微信OpenID
- `nick_name` - 昵称
- `avatar_url` - 头像URL
- `expire_date` - 会员到期时间
- `session_key` - 微信会话密钥
- `created_at` - 创建时间
- `last_login_at` - 最后登录时间

**orders** - 订单记录
- `id` (主键) - 订单ID
- `order_number` - 订单号
- `openid` - 用户OpenID
- `package_id` - 套餐ID
- `amount` - 金额
- `duration` - 时长（天）
- `created_at` - 创建时间

**favorites** - 收藏记录
- `id` (主键) - 收藏ID
- `openid` - 用户OpenID
- `question` - 问题内容
- `answer` - 答案内容（Markdown）
- `source_type` - 来源类型（knowledge/resume/custom）
- `source_id` - 来源ID
- `source_category` - 来源分类
- `created_at` - 创建时间
- `updated_at` - 更新时间

**tags** - 标签（v1.2.0）
- `id` (主键) - 标签ID
- `name` - 标签名称
- `openid` - 创建者OpenID
- `use_count` - 使用次数
- `created_at` - 创建时间

**favorite_tags** - 收藏标签关联（v1.2.0）
- `id` (主键) - 关联ID
- `favorite_id` - 收藏ID
- `tag_id` - 标签ID
- `created_at` - 创建时间

## 🔐 环境变量说明

| 变量 | 必需 | 默认值 | 说明 |
|------|------|--------|------|
| `PORT` | 否 | 3000 | 服务端口 |
| `NODE_ENV` | 否 | development | 运行环境 |
| `DB_HOST` | 是 | - | 数据库地址 |
| `DB_USER` | 是 | - | 数据库用户 |
| `DB_PASSWORD` | 是 | - | 数据库密码 |
| `DB_NAME` | 是 | - | 数据库名称 |
| `JWT_SECRET` | 是 | - | JWT密钥 |
| `WECHAT_APPID` | 是 | - | 微信AppID |
| `WECHAT_SECRET` | 是 | - | 微信Secret |
| `DEEPSEEK_API_KEY` | 是 | - | DeepSeek API密钥 |

## 📊 常用命令

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

### 日志查看

```bash
# 实时日志
pm2 logs ai-interview-helper --lines 100

# 错误日志
pm2 logs ai-interview-helper --err

# 清空日志
pm2 flush
```

## 🧪 测试

### 健康检查

```bash
curl https://api.feelnow.cn/health
```

### 测试API

```bash
# 测试知识库
curl -k "https://api.feelnow.cn/api/knowledge/categories"

# 测试收藏统计
curl -k "https://api.feelnow.cn/api/favorites/stats?openid=test_user"

# 测试简历列表
curl -k "https://api.feelnow.cn/api/resume/list?openid=test_user"

# 测试静态文件
curl -I -k "https://api.feelnow.cn/static/images/payment-qrcode.png"
```

## 🔧 维护任务

### 每日
- 检查服务运行状态：`pm2 status`
- 查看错误日志：`pm2 logs --err`

### 每周
- 清理旧头像：`find src/static/avatars/ -mtime +30 -delete`
- 检查磁盘空间：`df -h`

### 每月
- 备份数据库
- 更新依赖：`npm update`
- 检查安全漏洞：`npm audit`

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

### 静态文件 403/404

```bash
# 检查目录权限
ls -ld src/static/
ls -ld src/static/avatars/
ls -ld src/static/images/

# 检查文件权限
ls -lh src/static/images/payment-qrcode.png
```

## 📈 性能优化

### 数据库索引

```sql
-- 已在 init.sql 中配置
ALTER TABLE members ADD INDEX idx_openid (openid);
ALTER TABLE members ADD INDEX idx_expire_date (expire_date);
ALTER TABLE orders ADD INDEX idx_openid (openid);
```

### 连接池配置

在 `config/database.js` 中：
```javascript
connectionLimit: 10  // 根据实际负载调整
```

## 📚 文档

详细文档请查看 `docs/` 目录：

- **[文档索引](docs/README.md)** - 所有文档的入口（⭐ 推荐从这里开始）
- [部署总结](docs/DEPLOYMENT_SUMMARY.md) - 版本历史和快速部署
- [快速部署](docs/QUICK_DEPLOY.md) - 快速部署命令
- [生产环境部署清单](docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md) - 完整检查清单
- [简历 API 文档](docs/RESUME_API.md) - 简历管理 API 接口
- [收藏 API 文档](docs/FAVORITES_API.md) - 收藏管理 API 接口
- [静态文件指南](docs/STATIC_FILES_GUIDE.md) - 静态文件配置

## 🔗 相关链接

- 前端代码：`../miniprogram/`
- 项目文档：`../docs/`

---

**版本**: v1.2.0 | **最后更新**: 2025-12-08

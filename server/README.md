# 🚀 AI面试助手 - 后端服务

统一的 Node.js 后端服务，提供认证、会员、知识库、订单、上传等所有API。

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
mysql -u root -p
```

```sql
CREATE DATABASE ai_interview_helper CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ai_interview_helper;
SOURCE database/init.sql;
EXIT;
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
- **认证方式**: Bearer Token (JWT)
- **响应格式**: JSON

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
# 测试登录
curl -X POST https://api.feelnow.cn/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"code":"test_code"}'

# 测试知识库
curl https://api.feelnow.cn/api/knowledge/categories

# 测试静态文件
curl -I https://api.feelnow.cn/static/images/payment-qrcode.png
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

## 🔗 相关链接

- 前端代码：`../miniprogram/`
- 完整文档：`../docs/`
- API详细文档：`../docs/FINAL_DOCUMENTATION.md`

---

**版本**: 1.0.0 | **最后更新**: 2024-12-03

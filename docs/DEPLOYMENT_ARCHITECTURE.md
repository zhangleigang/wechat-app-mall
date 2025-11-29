# 后端服务部署架构

## 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                    微信小程序                              │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Nginx (api.feelnow.cn)                  │
│                     端口: 443 (HTTPS)                     │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
┌──────────────────┐              ┌──────────────────┐
│  knowledge-api   │              │  member-service  │
│   端口: 3000     │              │   端口: 3001     │
│                  │              │                  │
│ • 知识库数据     │              │ • 会员管理       │
│ • 用户认证       │              │ • 订单对账       │
│ • JWT Token      │              │                  │
│                  │              │                  │
│ 存储: JSON文件   │              │ 存储: MySQL      │
└──────────────────┘              └──────────────────┘
        │                                   │
        ▼                                   ▼
┌──────────────────┐              ┌──────────────────┐
│ data/knowledge.js│              │ interview_helper │
│ data/users.json  │              │   (MySQL DB)     │
└──────────────────┘              └──────────────────┘
```

## 服务职责划分

### knowledge-api (端口3000)

**功能**：
- 📚 知识库API（分类、题目、搜索）
- 🔐 用户认证（微信登录、JWT）
- 👤 用户信息管理

**路由**：
- `/api/categories` - 获取分类
- `/api/questions` - 获取题目
- `/api/knowledge/*` - 知识库相关
- `/api/auth/*` - 认证相关

**特点**：
- 轻量级，无数据库依赖
- 数据存储在JSON文件
- 高并发访问

### member-service (端口3001)

**功能**：
- 💳 会员状态查询
- ✅ 会员开通续费
- 📝 订单记录管理
- 🔍 订单对账核实

**路由**：
- `/api/member/status` - 查询会员状态
- `/api/member/activate` - 开通会员
- `/api/admin/orders` - 订单管理
- `/api/admin/orders/export` - 导出订单

**特点**：
- 需要MySQL数据库
- 数据持久化存储
- 支持事务操作

## Nginx配置

### /etc/nginx/conf.d/api-feelnow.conf

```nginx
server {
    listen 443 ssl http2;
    server_name api.feelnow.cn;
    
    # SSL证书配置
    ssl_certificate /etc/ssl/cert/api.feelnow.cn.pem;
    ssl_certificate_key /etc/ssl/cert/api.feelnow.cn.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # 日志
    access_log /var/log/nginx/api-access.log;
    error_log /var/log/nginx/api-error.log;
    
    # ============ knowledge-api 路由 ============
    
    # 知识库API
    location /api/categories {
        proxy_pass http://localhost:3000;
        include /etc/nginx/proxy_params.conf;
    }
    
    location /api/questions {
        proxy_pass http://localhost:3000;
        include /etc/nginx/proxy_params.conf;
    }
    
    location /api/knowledge {
        proxy_pass http://localhost:3000;
        include /etc/nginx/proxy_params.conf;
    }
    
    # 认证API
    location /api/auth {
        proxy_pass http://localhost:3000;
        include /etc/nginx/proxy_params.conf;
    }
    
    # ============ member-service 路由 ============
    
    # 会员API
    location /api/member {
        proxy_pass http://localhost:3001;
        include /etc/nginx/proxy_params.conf;
    }
    
    # 管理员API
    location /api/admin {
        proxy_pass http://localhost:3001;
        include /etc/nginx/proxy_params.conf;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://localhost:3000;
        include /etc/nginx/proxy_params.conf;
    }
}

# HTTP重定向到HTTPS
server {
    listen 80;
    server_name api.feelnow.cn;
    return 301 https://$server_name$request_uri;
}
```

### /etc/nginx/proxy_params.conf

```nginx
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_cache_bypass $http_upgrade;

proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
```

## PM2部署配置

### ecosystem.config.js

```javascript
module.exports = {
  apps: [
    {
      name: 'knowledge-api',
      script: './knowledge-api/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/knowledge-api-error.log',
      out_file: './logs/knowledge-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '200M'
    },
    {
      name: 'member-service',
      script: './member-service/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DB_HOST: 'localhost',
        DB_USER: 'root',
        DB_PASSWORD: 'your_password',
        DB_NAME: 'interview_helper'
      },
      error_file: './logs/member-service-error.log',
      out_file: './logs/member-service-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '200M'
    }
  ]
}
```

### 使用方式

```bash
# 启动所有服务
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启指定服务
pm2 restart knowledge-api
pm2 restart member-service

# 停止所有服务
pm2 stop all

# 保存配置
pm2 save

# 设置开机自启
pm2 startup
```

## 部署步骤

### 1. 准备服务器环境

```bash
# 安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 安装PM2
npm install -g pm2

# 安装Nginx
apt install -y nginx

# 安装MySQL
apt install -y mysql-server
```

### 2. 部署knowledge-api

```bash
cd knowledge-api
npm install --production
node convert-data.js  # 转换知识库数据
pm2 start server.js --name knowledge-api
```

### 3. 部署member-service

```bash
cd member-service
npm install --production

# 创建数据库
mysql -u root -p < init.sql

# 配置环境变量
cp .env.example .env
vi .env  # 填入数据库密码

# 启动服务
pm2 start server.js --name member-service
```

### 4. 配置Nginx

```bash
# 复制配置文件
cp docs/nginx.conf /etc/nginx/conf.d/api-feelnow.conf

# 测试配置
nginx -t

# 重启Nginx
systemctl restart nginx
```

### 5. 配置SSL证书

```bash
# 安装Certbot
apt install -y certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d api.feelnow.cn

# 测试自动续期
certbot renew --dry-run
```

### 6. 保存PM2配置

```bash
pm2 save
pm2 startup
```

## 监控和维护

### 查看服务状态

```bash
# PM2状态
pm2 status

# 实时监控
pm2 monit

# 查看日志
pm2 logs knowledge-api --lines 100
pm2 logs member-service --lines 100
```

### 重启服务

```bash
# 重启单个服务
pm2 restart knowledge-api
pm2 restart member-service

# 重启所有服务
pm2 restart all
```

### 更新服务

```bash
# 更新knowledge-api
cd knowledge-api
git pull
npm install
node convert-data.js
pm2 restart knowledge-api

# 更新member-service
cd member-service
git pull
npm install
pm2 restart member-service
```

## 故障排查

### knowledge-api无法访问

```bash
# 检查服务状态
pm2 status knowledge-api

# 查看日志
pm2 logs knowledge-api --err

# 检查端口
lsof -i:3000

# 手动测试
curl http://localhost:3000/health
```

### member-service无法访问

```bash
# 检查服务状态
pm2 status member-service

# 查看日志
pm2 logs member-service --err

# 检查数据库连接
mysql -u root -p -e "USE interview_helper; SHOW TABLES;"

# 手动测试
curl http://localhost:3001/health
```

### Nginx转发问题

```bash
# 检查Nginx状态
systemctl status nginx

# 测试配置
nginx -t

# 查看错误日志
tail -f /var/log/nginx/error.log

# 测试转发
curl https://api.feelnow.cn/health
```

## 性能优化

### 1. 启用Gzip压缩

已在knowledge-api中启用compression中间件。

### 2. 数据库连接池

member-service已配置连接池：
```javascript
connectionLimit: 10
```

### 3. PM2集群模式（可选）

如果并发量大，可以启用集群：
```bash
pm2 start server.js -i 2 --name knowledge-api
```

### 4. Nginx缓存（可选）

对于静态数据可以启用缓存：
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m;
proxy_cache api_cache;
proxy_cache_valid 200 10m;
```

## 安全建议

1. **防火墙配置**
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

2. **限流**
在Nginx中配置：
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req zone=api_limit burst=20 nodelay;
```

3. **定期备份**
```bash
# 备份数据库
mysqldump -u root -p interview_helper > backup_$(date +%Y%m%d).sql

# 备份用户数据
cp knowledge-api/data/users.json backup/users_$(date +%Y%m%d).json
```

## 总结

**分开部署的优势**：
- ✅ 职责清晰，易于维护
- ✅ 故障隔离，互不影响
- ✅ 独立扩展，灵活部署
- ✅ 技术栈独立，便于升级

**统一管理**：
- 使用PM2 ecosystem.config.js统一管理
- 使用Nginx统一入口
- 使用统一的域名和SSL证书

---

**最后更新**: 2025-11-29

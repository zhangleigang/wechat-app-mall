# ⚡ 快速部署命令

## 📋 复制粘贴执行

### 1️⃣ 本地上传（在你的电脑上执行）

```bash
cd server
scp ai-interview-helper-server-*.tar.gz root@47.95.196.190:/root/
```

### 2️⃣ 服务器部署（SSH 到服务器后执行）

```bash
# SSH 登录
ssh root@47.95.196.190

# 解压
cd /root
tar -xzf ai-interview-helper-server-*.tar.gz
cd ai-interview-helper-server

# 配置环境变量
cp .env.example .env
vi .env
# 修改以下内容：
# DB_PASSWORD=你的数据库密码
# JWT_SECRET=随机生成的密钥
# WECHAT_APPID=你的AppID
# WECHAT_SECRET=你的Secret

# 初始化数据库
mysql -u root -p < database/init.sql

# 部署
bash deploy.sh
```

### 3️⃣ 停止旧服务

```bash
pm2 stop knowledge-api member-service
pm2 delete knowledge-api member-service
```

### 4️⃣ 更新 Nginx（可选，如果需要）

```bash
vi /etc/nginx/conf.d/api-feelnow.conf
# 确保所有 /api 请求都代理到 http://127.0.0.1:3000

nginx -t
systemctl reload nginx
```

### 5️⃣ 验证部署

```bash
# 查看状态
pm2 status

# 测试接口
curl http://localhost:3000/health
curl http://localhost:3000/api/knowledge/categories

# 测试外网
curl https://api.feelnow.cn:8443/health
```

## ✅ 完成！

服务已部署到：
- 内网：http://localhost:3000
- 外网：https://api.feelnow.cn:8443

## 📊 常用命令

```bash
# 查看日志
pm2 logs ai-interview-helper

# 重启服务
pm2 restart ai-interview-helper

# 查看状态
pm2 status

# 数据库维护
mysql -u root -p ai_interview_helper < database/maintenance.sql
```

---

**打包文件**: `ai-interview-helper-server-20251203_094012.tar.gz` (444K)

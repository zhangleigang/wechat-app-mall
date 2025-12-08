# ⚡ 快速部署命令

## 📋 复制粘贴执行

### 1️⃣ 本地打包和上传（在你的电脑上执行）

```bash
cd server
bash pack.sh
scp ai-interview-helper-server-*.tar.gz root@your-server:/root/
```

### 2️⃣ 服务器部署（SSH 到服务器后执行）

```bash
# SSH 登录
ssh root@your-server

# 解压
cd /root
tar -xzf ai-interview-helper-server-*.tar.gz
cd server

# 配置环境变量（首次部署）
cp .env.example .env
vi .env
# 修改以下内容：
# DB_PASSWORD=你的数据库密码
# JWT_SECRET=随机生成的密钥
# WECHAT_APPID=你的AppID
# WECHAT_SECRET=你的Secret
# DEEPSEEK_API_KEY=你的DeepSeek API密钥

# 初始化数据库（首次部署）
mysql -u root -p ai_interview_helper < database/init.sql

# 重启服务
pm2 restart ai-interview-helper

# 查看日志
pm2 logs ai-interview-helper --lines 50
```

### 3️⃣ 验证部署

```bash
# 查看状态
pm2 status

# 测试接口
curl http://localhost:3000/api/knowledge/categories
curl "http://localhost:3000/api/favorites/stats?openid=test_user"

# 测试外网
curl -k "https://api.feelnow.cn/api/favorites/stats?openid=test_user"
```

## ✅ 完成！

服务已部署到：
- 内网：http://localhost:3000
- 外网：https://api.feelnow.cn (HTTPS 443)

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

**最后更新**: 2025-12-08 | **版本**: v1.2.0

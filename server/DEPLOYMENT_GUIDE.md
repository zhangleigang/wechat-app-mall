# 🚀 部署指南

## 📦 打包文件

已生成：`ai-interview-helper-server-20251203_094012.tar.gz` (444K)

## 🔧 部署步骤

### 1. 上传到服务器

```bash
scp server/ai-interview-helper-server-*.tar.gz root@47.95.196.190:/root/
```

### 2. SSH 到服务器

```bash
ssh root@47.95.196.190
```

### 3. 解压文件

```bash
cd /root
tar -xzf ai-interview-helper-server-*.tar.gz
cd ai-interview-helper-server
```

### 4. 配置环境变量

```bash
cp .env.example .env
vi .env
```

配置内容：
```bash
# 服务配置
NODE_ENV=production
PORT=3000

# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=你的数据库密码
DB_NAME=ai_interview_helper

# JWT 配置
JWT_SECRET=生成一个随机字符串作为密钥

# 微信小程序配置
WECHAT_APPID=你的微信AppID
WECHAT_SECRET=你的微信Secret

# CORS 配置
CORS_ORIGIN=*
```

### 5. 初始化数据库

```bash
# 登录 MySQL
mysql -u root -p

# 执行初始化脚本
source database/init.sql

# 退出
exit
```

### 6. 执行部署脚本

```bash
bash deploy.sh
```

部署脚本会自动：
- ✅ 安装依赖
- ✅ 测试数据库连接
- ✅ 测试服务启动
- ✅ 使用 PM2 启动服务
- ✅ 保存 PM2 配置

### 7. 验证部署

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs ai-interview-helper

# 测试健康检查
curl http://localhost:3000/health

# 测试 API
curl http://localhost:3000/api/knowledge/categories
```

## 🔄 更新 Nginx 配置

### 停止旧服务

```bash
# 停止 knowledge-api (端口 3000)
pm2 stop knowledge-api
pm2 delete knowledge-api

# 停止 member-service (端口 3001)
pm2 stop member-service
pm2 delete member-service
```

### 更新 Nginx 配置

编辑 Nginx 配置文件：

```bash
vi /etc/nginx/conf.d/api-feelnow.conf
```

更新为统一后端：

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    listen 8080;
    listen 8443 ssl http2;
    server_name api.feelnow.cn;

    # SSL 证书
    ssl_certificate /etc/ssl/cert/api.feelnow.cn.pem;
    ssl_certificate_key /etc/ssl/cert/api.feelnow.cn.key;

    # API 代理（统一后端）
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态文件
    location /static {
        proxy_pass http://127.0.0.1:3000;
    }

    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        access_log off;
    }
}
```

重启 Nginx：

```bash
nginx -t
systemctl reload nginx
```

## 🧪 测试验证

### 1. 测试认证接口

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"code":"test"}'
```

### 2. 测试知识库接口

```bash
curl http://localhost:3000/api/knowledge/categories
```

### 3. 测试会员接口

```bash
curl "http://localhost:3000/api/member/status?openid=test_openid"
```

### 4. 测试外网访问

```bash
curl https://api.feelnow.cn:8443/health
curl https://api.feelnow.cn:8443/api/knowledge/categories
```

## 📊 监控和维护

### 查看服务状态

```bash
pm2 status
pm2 info ai-interview-helper
```

### 查看日志

```bash
# 实时日志
pm2 logs ai-interview-helper

# 最近100行
pm2 logs ai-interview-helper --lines 100

# 只看错误
pm2 logs ai-interview-helper --err
```

### 重启服务

```bash
pm2 restart ai-interview-helper
```

### 停止服务

```bash
pm2 stop ai-interview-helper
```

### 数据库维护

```bash
mysql -u root -p ai_interview_helper < database/maintenance.sql
```

## 🔒 安全建议

1. **修改默认密码**
   - 数据库密码
   - JWT_SECRET

2. **配置防火墙**
   ```bash
   # 只允许必要的端口
   firewall-cmd --permanent --add-port=80/tcp
   firewall-cmd --permanent --add-port=443/tcp
   firewall-cmd --permanent --add-port=8080/tcp
   firewall-cmd --permanent --add-port=8443/tcp
   firewall-cmd --reload
   ```

3. **定期备份数据库**
   ```bash
   mysqldump -u root -p ai_interview_helper > backup_$(date +%Y%m%d).sql
   ```

4. **监控日志**
   ```bash
   tail -f ~/.pm2/logs/ai-interview-helper-error.log
   ```

## ⚠️ 常见问题

### Q1: 数据库连接失败
```bash
# 检查数据库是否运行
systemctl status mysql

# 检查 .env 配置
cat .env

# 测试连接
mysql -h localhost -u root -p
```

### Q2: PM2 启动失败
```bash
# 查看详细错误
pm2 logs ai-interview-helper --err

# 手动启动测试
node server.js
```

### Q3: Nginx 502 错误
```bash
# 检查后端服务是否运行
pm2 status

# 检查端口是否监听
netstat -tlnp | grep 3000

# 查看 Nginx 错误日志
tail -f /var/log/nginx/error.log
```

### Q4: 端口被占用
```bash
# 查看端口占用
lsof -i:3000

# 杀死进程
kill -9 <PID>
```

## 📝 回滚步骤

如果部署出现问题，可以回滚到旧服务：

```bash
# 停止新服务
pm2 stop ai-interview-helper
pm2 delete ai-interview-helper

# 启动旧服务
pm2 start /path/to/knowledge-api/server.js --name knowledge-api
pm2 start /path/to/member-service/server.js --name member-service

# 恢复 Nginx 配置
# 使用备份的配置文件
```

## ✅ 部署检查清单

- [ ] 上传文件到服务器
- [ ] 解压文件
- [ ] 配置 .env 文件
- [ ] 初始化数据库
- [ ] 执行部署脚本
- [ ] 停止旧服务
- [ ] 更新 Nginx 配置
- [ ] 重启 Nginx
- [ ] 测试所有 API 接口
- [ ] 测试外网访问
- [ ] 检查 PM2 状态
- [ ] 检查日志
- [ ] 备份数据库

---

**部署完成后，记得更新小程序前端的 API 地址！**

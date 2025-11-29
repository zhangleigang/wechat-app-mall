# 会员服务部署指南

## 📋 部署清单

- [x] 后端服务代码已创建
- [x] 数据库初始化脚本已创建
- [x] 小程序代码已对接
- [x] 部署脚本已创建
- [ ] 数据库已创建
- [ ] 服务已部署
- [ ] Nginx已配置

---

## 🚀 快速部署

### 方式1：使用自动部署脚本（推荐）

```bash
cd member-service
./deploy.sh
```

脚本会自动完成：
1. 安装依赖
2. 检查数据库连接
3. 初始化数据库
4. 测试服务
5. 使用PM2部署

### 方式2：手动部署

#### 1. 安装依赖

```bash
cd member-service
npm install
```

#### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑.env文件
vi .env
```

填入配置：
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=interview_helper
PORT=3001
```

#### 3. 创建数据库

```bash
mysql -u root -p < init.sql
```

或手动执行：
```bash
mysql -u root -p
source init.sql
```

#### 4. 启动服务

```bash
# 开发环境
npm start

# 生产环境（使用PM2）
pm2 start server.js --name member-service
pm2 save
pm2 startup  # 设置开机自启
```

---

## 🔧 配置Nginx反向代理

### 1. 编辑Nginx配置

```bash
sudo vi /etc/nginx/conf.d/api-feelnow.conf
```

### 2. 添加会员服务代理

```nginx
server {
    listen 443 ssl;
    server_name api.feelnow.cn;
    
    ssl_certificate /etc/ssl/cert/api.feelnow.cn.pem;
    ssl_certificate_key /etc/ssl/cert/api.feelnow.cn.key;
    
    # 会员服务API
    location /api/member {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 管理员API
    location /api/admin {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. 测试并重载Nginx

```bash
sudo nginx -t
sudo nginx -s reload
```

---

## ✅ 测试验证

### 1. 测试健康检查

```bash
curl http://localhost:3001/health
# 预期输出: OK
```

### 2. 测试查询会员状态

```bash
curl "http://localhost:3001/api/member/status?openid=test123"
# 预期输出: {"code":0,"data":{"is_member":false,...}}
```

### 3. 测试开通会员

```bash
curl -X POST http://localhost:3001/api/member/activate \
  -H "Content-Type: application/json" \
  -d '{
    "openid":"test123",
    "nick_name":"测试用户",
    "order_number":"ORDER_TEST_001",
    "package_id":"monthly",
    "package_name":"月度会员",
    "amount":29.90,
    "days":30,
    "device_info":"test"
  }'
# 预期输出: {"code":0,"message":"会员已开通",...}
```

### 4. 测试通过Nginx访问

```bash
curl "https://api.feelnow.cn/api/member/status?openid=test123"
```

---

## 📱 小程序配置

### 1. 确认config.js配置

```javascript
// config.js
module.exports = {
  // ...
  memberApiUrl: 'https://api.feelnow.cn/api', // 生产环境
  // memberApiUrl: 'http://localhost:3001/api', // 本地开发
}
```

### 2. 微信小程序后台配置

登录 https://mp.weixin.qq.com/

**开发 → 开发管理 → 开发设置 → 服务器域名**

添加request合法域名：
```
https://api.feelnow.cn
```

### 3. 测试小程序

1. 重新编译小程序
2. 进入会员购买页面
3. 点击"我已完成支付"
4. 查看是否成功开通

---

## 📊 查看订单管理

### 1. 查询订单列表

```bash
curl "http://localhost:3001/api/admin/orders?page=1&limit=20"
```

### 2. 查询待核实订单

```bash
curl "http://localhost:3001/api/admin/orders?status=0"
```

### 3. 核实订单

```bash
curl -X POST http://localhost:3001/api/admin/orders/1/verify \
  -H "Content-Type: application/json" \
  -d '{"status":1,"remark":"已确认收款"}'
```

### 4. 导出订单

```bash
curl "http://localhost:3001/api/admin/orders/export?start_date=2024-01-01&end_date=2024-01-31" > orders.csv
```

---

## 🔍 日常运维

### 查看服务状态

```bash
pm2 status member-service
```

### 查看日志

```bash
# 实时日志
pm2 logs member-service

# 最近100行
pm2 logs member-service --lines 100

# 只看错误日志
pm2 logs member-service --err
```

### 重启服务

```bash
pm2 restart member-service
```

### 停止服务

```bash
pm2 stop member-service
```

### 查看资源使用

```bash
pm2 monit
```

---

## 🐛 故障排查

### 问题1：服务无法启动

**检查：**
```bash
# 查看日志
pm2 logs member-service --err

# 检查端口占用
lsof -i:3001

# 测试数据库连接
mysql -h localhost -u root -p -e "SELECT 1"
```

### 问题2：数据库连接失败

**检查：**
1. .env文件配置是否正确
2. 数据库是否已启动
3. 用户权限是否正确

```bash
# 测试连接
mysql -h localhost -u root -p interview_helper -e "SHOW TABLES"
```

### 问题3：小程序无法调用API

**检查：**
1. 域名是否在微信后台配置
2. Nginx是否正确转发
3. 服务是否正常运行

```bash
# 测试Nginx转发
curl "https://api.feelnow.cn/api/member/status?openid=test"

# 查看Nginx日志
tail -f /var/log/nginx/error.log
```

---

## 📈 性能优化

### 1. 数据库索引

已创建的索引：
- user_members: openid, expire_date
- orders: order_number, openid, status, created_at

### 2. 连接池配置

当前配置：
```javascript
connectionLimit: 10
```

如果并发量大，可以调整：
```javascript
connectionLimit: 20
```

### 3. PM2集群模式

```bash
pm2 start server.js -i 2 --name member-service
```

---

## 🔐 安全建议

### 1. 添加管理员认证

建议为管理员API添加认证：
```javascript
// 简单的token验证
app.use('/api/admin', (req, res, next) => {
    const token = req.headers.authorization
    if (token !== 'Bearer your-admin-token') {
        return res.json({ code: -1, message: '未授权' })
    }
    next()
})
```

### 2. 限流

安装express-rate-limit：
```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit')

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100 // 最多100次请求
})

app.use('/api', limiter)
```

### 3. 定期备份数据库

```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p interview_helper > backup_$DATE.sql
# 保留最近7天的备份
find . -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x backup.sh

# 添加到crontab（每天凌晨2点备份）
crontab -e
# 添加: 0 2 * * * /path/to/backup.sh
```

---

## 📝 总结

部署完成后，你将拥有：
- ✅ 完整的会员管理后端服务
- ✅ 订单记录和对账功能
- ✅ 小程序与后端的完整对接
- ✅ 生产环境的稳定运行

下一步：
1. 创建管理后台页面（可选）
2. 配置监控告警
3. 优化性能和安全

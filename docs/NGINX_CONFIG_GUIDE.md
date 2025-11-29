# Nginx配置完整指南

## 配置文件解读

### 三个服务器块的作用

#### 1. HTTP服务器（端口8080）
```
作用：HTTP入口，强制重定向到HTTPS
端口：8080
访问：http://api.feelnow.cn:8080
行为：301重定向到 https://api.feelnow.cn:8443
```

#### 2. 标准HTTPS服务器（端口443）⭐ 微信小程序专用
```
作用：为微信小程序提供标准443端口访问
端口：443（HTTPS标准端口）
访问：https://api.feelnow.cn
行为：反向代理到 https://localhost:8443
原因：微信小程序只支持标准443端口，不支持自定义端口
```

#### 3. 实际HTTPS服务器（端口8443）
```
作用：提供实际的API和静态文件服务
端口：8443（自定义端口，避免冲突）
访问：https://api.feelnow.cn:8443
服务：
  - /static/* → 静态文件（收款码等）
  - /* → Node.js API（端口3000）
```

### 端口流转图

```
用户请求流程：

微信小程序
    ↓
https://api.feelnow.cn/api/knowledge
    ↓ (443端口)
Nginx 443服务器
    ↓ (反向代理)
https://localhost:8443/api/knowledge
    ↓
Nginx 8443服务器
    ↓ (反向代理)
http://127.0.0.1:3000/api/knowledge
    ↓
Node.js应用
```

```
静态文件请求流程：

微信小程序
    ↓
https://api.feelnow.cn/static/images/payment-qrcode.png
    ↓ (443端口)
Nginx 443服务器
    ↓ (反向代理)
https://localhost:8443/static/images/payment-qrcode.png
    ↓
Nginx 8443服务器
    ↓ (直接返回文件)
/var/static/images/payment-qrcode.png
```

## 关键配置说明

### 1. SSL证书配置

```nginx
ssl_certificate /etc/ssl/cert/api.feelnow.cn.pem;
ssl_certificate_key /etc/ssl/cert/api.feelnow.cn.key;
```

**要求：**
- 必须是有效的SSL证书（不能是自签名）
- 域名必须备案
- 证书需要包含完整的证书链

**获取证书：**
- Let's Encrypt（免费）：`certbot --nginx -d api.feelnow.cn`
- 阿里云SSL证书
- 腾讯云SSL证书

### 2. 静态文件配置

```nginx
location /static/ {
    alias /var/static/;
    expires 30d;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin * always;
}
```

**说明：**
- `alias /var/static/;` - 映射到文件系统路径
- `expires 30d` - 缓存30天
- `Access-Control-Allow-Origin *` - 允许跨域（小程序需要）

**文件路径映射：**
```
URL: https://api.feelnow.cn/static/images/payment-qrcode.png
→ 文件: /var/static/images/payment-qrcode.png
```

### 3. 反向代理配置

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**说明：**
- `proxy_pass` - 转发到后端Node.js应用
- `proxy_set_header` - 传递原始请求信息
- 超时设置 - 60秒（可根据需求调整）

### 4. 安全头部

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

**作用：**
- HSTS - 强制使用HTTPS
- X-Frame-Options - 防止点击劫持
- X-Content-Type-Options - 防止MIME嗅探
- X-XSS-Protection - XSS保护

## 部署步骤

### 1. 准备工作

```bash
# 检查Nginx是否安装
nginx -v

# 如果未安装
# CentOS/RHEL
sudo yum install nginx

# Ubuntu/Debian
sudo apt-get install nginx
```

### 2. 创建必要的目录

```bash
# 创建SSL证书目录
sudo mkdir -p /etc/ssl/cert

# 创建静态文件目录
sudo mkdir -p /var/static/images

# 设置权限
sudo chmod 755 /var/static
sudo chmod 755 /var/static/images
```

### 3. 上传SSL证书

```bash
# 将证书文件上传到服务器
scp api.feelnow.cn.pem root@your-server:/etc/ssl/cert/
scp api.feelnow.cn.key root@your-server:/etc/ssl/cert/

# 设置权限
sudo chmod 644 /etc/ssl/cert/api.feelnow.cn.pem
sudo chmod 600 /etc/ssl/cert/api.feelnow.cn.key
```

### 4. 部署Nginx配置

**方法A：使用部署脚本（推荐）**

```bash
# 在本地项目目录执行
scp docs/nginx.conf root@your-server:/tmp/
scp scripts/deploy-nginx-config.sh root@your-server:/tmp/

# 在服务器上执行
ssh root@your-server
cd /tmp
chmod +x deploy-nginx-config.sh
sudo ./deploy-nginx-config.sh
```

**方法B：手动部署**

```bash
# 复制配置文件
sudo cp docs/nginx.conf /etc/nginx/conf.d/api-feelnow.conf

# 测试配置
sudo nginx -t

# 重载配置
sudo systemctl reload nginx
```

### 5. 配置防火墙

```bash
# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --permanent --add-port=8443/tcp
sudo firewall-cmd --reload

# Ubuntu/Debian (ufw)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp
sudo ufw allow 8443/tcp
sudo ufw reload
```

### 6. 启动Nginx

```bash
# 启动Nginx
sudo systemctl start nginx

# 设置开机自启
sudo systemctl enable nginx

# 查看状态
sudo systemctl status nginx
```

### 7. 上传收款码

```bash
# 使用上传脚本
./scripts/upload-qrcode.sh

# 或手动上传
scp payment-qrcode.png root@your-server:/var/static/images/
```

## 测试验证

### 1. 测试静态文件访问

```bash
# 测试8443端口
curl -I https://api.feelnow.cn:8443/static/images/payment-qrcode.png

# 测试443端口（微信小程序使用）
curl -I https://api.feelnow.cn/static/images/payment-qrcode.png

# 预期结果：HTTP/2 200
```

### 2. 测试API访问

```bash
# 测试健康检查
curl https://api.feelnow.cn:8443/health
curl https://api.feelnow.cn/health

# 测试API
curl https://api.feelnow.cn/api/knowledge/categories
```

### 3. 测试HTTP重定向

```bash
# 应该自动重定向到HTTPS
curl -I http://api.feelnow.cn:8080/health

# 预期结果：301 Moved Permanently
# Location: https://api.feelnow.cn:8443/health
```

### 4. 查看日志

```bash
# 实时查看访问日志
sudo tail -f /var/log/nginx/api-8443-access.log
sudo tail -f /var/log/nginx/api-443-access.log

# 查看错误日志
sudo tail -f /var/log/nginx/api-8443-error.log
sudo tail -f /var/log/nginx/api-443-error.log
```

## 微信小程序配置

### 1. 配置域名白名单

登录微信小程序后台：https://mp.weixin.qq.com/

**开发 → 开发管理 → 开发设置 → 服务器域名**

添加以下域名：

**request合法域名：**
```
https://api.feelnow.cn
```

**downloadFile合法域名：**
```
https://api.feelnow.cn
```

**注意：**
- ✅ 使用 `https://api.feelnow.cn`（不带端口号）
- ❌ 不要使用 `https://api.feelnow.cn:8443`（微信不支持）
- ✅ 域名必须备案
- ✅ 必须有有效的SSL证书

### 2. 更新小程序代码

修改 `config.js`：

```javascript
module.exports = {
  // 知识库API（不带端口号，使用标准443）
  knowledgeApiUrl: 'https://api.feelnow.cn/api',
  
  // 收款码配置（不带端口号）
  paymentQrcode: {
    url: 'https://api.feelnow.cn/static/images/payment-qrcode.png',
    accountName: '收款人姓名',
    enabled: true
  }
}
```

### 3. 开发阶段临时方案

在微信开发者工具中：
1. 点击右上角"详情"
2. 勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"
3. 可以使用 `https://api.feelnow.cn:8443`（带端口号）进行开发测试

**注意：** 正式发布前必须配置域名白名单并使用标准443端口

## 常见问题

### Q1: Nginx启动失败，提示证书错误

**原因：** SSL证书路径不正确或证书无效

**解决：**
```bash
# 检查证书文件是否存在
ls -l /etc/ssl/cert/api.feelnow.cn.pem
ls -l /etc/ssl/cert/api.feelnow.cn.key

# 检查证书有效性
openssl x509 -in /etc/ssl/cert/api.feelnow.cn.pem -text -noout

# 临时方案：注释掉443和8443的server块，只保留8080
```

### Q2: 静态文件404

**原因：** 文件路径不正确或权限问题

**解决：**
```bash
# 检查文件是否存在
ls -l /var/static/images/payment-qrcode.png

# 检查权限
sudo chmod 755 /var/static
sudo chmod 755 /var/static/images
sudo chmod 644 /var/static/images/payment-qrcode.png

# 检查SELinux（CentOS/RHEL）
sudo setenforce 0  # 临时关闭
sudo getenforce    # 查看状态
```

### Q3: 小程序提示"不在以下 request 合法域名列表中"

**原因：** 未在微信后台配置域名白名单

**解决：**
1. 登录微信小程序后台
2. 添加 `https://api.feelnow.cn` 到域名白名单
3. 等待5-10分钟生效
4. 重新编译小程序

### Q4: 443端口访问失败

**原因：** 防火墙未开放443端口

**解决：**
```bash
# 检查端口是否开放
sudo netstat -tlnp | grep :443

# 开放端口
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload

# 或使用iptables
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

### Q5: 反向代理循环

**原因：** 443端口代理到8443，8443又代理回443

**解决：** 检查配置，确保：
- 443端口 → 代理到 `https://localhost:8443`
- 8443端口 → 代理到 `http://127.0.0.1:3000`（Node.js应用）

## 性能优化建议

### 1. 启用Gzip压缩

在 `http` 块中添加：

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

### 2. 配置日志轮转

创建 `/etc/logrotate.d/nginx-api`：

```
/var/log/nginx/api-*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 nginx nginx
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

### 3. 调整缓冲区大小

根据实际流量调整：

```nginx
proxy_buffer_size 8k;
proxy_buffers 16 8k;
proxy_busy_buffers_size 16k;
```

## 监控和维护

### 日常检查

```bash
# 检查Nginx状态
sudo systemctl status nginx

# 检查错误日志
sudo tail -100 /var/log/nginx/api-8443-error.log

# 检查磁盘空间
df -h

# 检查内存使用
free -h
```

### 性能监控

```bash
# 查看Nginx进程
ps aux | grep nginx

# 查看连接数
netstat -an | grep :443 | wc -l
netstat -an | grep :8443 | wc -l

# 查看访问统计
sudo tail -1000 /var/log/nginx/api-443-access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -10
```

## 总结

这个Nginx配置实现了：
- ✅ HTTP自动重定向到HTTPS
- ✅ 标准443端口支持（微信小程序要求）
- ✅ 静态文件服务（收款码等）
- ✅ API反向代理（Node.js应用）
- ✅ SSL/TLS安全配置
- ✅ CORS跨域支持
- ✅ 完善的日志记录
- ✅ 性能优化配置

关键点：
1. 微信小程序必须使用标准443端口
2. 通过反向代理解决端口限制
3. 静态文件和API分别处理
4. 完善的安全和性能配置

# 收款码上传指南

本文档介绍如何将收款码图片上传到阿里云服务器并生成访问链接。

## 📋 方案选择

### 方案对比

| 方案 | 成本 | 难度 | 速度 | 推荐度 |
|------|------|------|------|--------|
| **方案1：Nginx 静态文件** | 免费 | ⭐ | 快 | ⭐⭐⭐⭐⭐ |
| 方案2：阿里云 OSS | 约¥0.12/GB/月 | ⭐⭐ | 很快 | ⭐⭐⭐⭐ |
| 方案3：Node.js 静态服务 | 免费 | ⭐⭐ | 快 | ⭐⭐⭐ |

**推荐方案1**：使用 Nginx 托管静态文件，免费、简单、快速。

---

## 🚀 方案1：Nginx 静态文件托管（推荐）

### 优点
- ✅ 完全免费
- ✅ 配置简单（5分钟）
- ✅ 访问速度快
- ✅ 无需额外服务
- ✅ 已有 Nginx 环境

### 步骤

#### 第1步：准备收款码图片

在本地电脑上：

1. 打开微信 → 我 → 服务 → 收付款 → 二维码收款
2. 截图或保存收款码
3. 重命名为 `payment-qrcode.jpg`（建议使用英文名）
4. 压缩图片（可选，减小文件大小）

**图片要求**：
- 格式：JPG 或 PNG
- 大小：建议 < 500KB
- 尺寸：建议 800x800 像素

#### 第2步：上传到服务器

```bash
# 方法A：使用 SCP 上传（推荐）
scp payment-qrcode.jpg root@47.95.196.190:/var/www/static/images/

# 方法B：使用 SFTP 工具
# 使用 FileZilla、WinSCP 等工具上传到 /var/www/static/images/
```

#### 第3步：在服务器上配置 Nginx

```bash
# 1. SSH 连接到服务器
ssh root@47.95.196.190

# 2. 创建静态文件目录
mkdir -p /var/www/static/images

# 3. 设置权限
chmod 755 /var/www/static
chmod 755 /var/www/static/images
chmod 644 /var/www/static/images/payment-qrcode.jpg

# 4. 创建或编辑 Nginx 配置
cat > /etc/nginx/conf.d/static.conf << 'EOF'
server {
    listen 80;
    listen 443 ssl http2;
    server_name api.feelnow.cn;

    # SSL 证书配置（如果已有）
    ssl_certificate /etc/letsencrypt/live/api.feelnow.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.feelnow.cn/privkey.pem;

    # 静态文件目录
    location /static/ {
        alias /var/www/static/;
        
        # 缓存配置
        expires 30d;
        add_header Cache-Control "public, immutable";
        
        # 允许跨域（小程序需要）
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, OPTIONS";
        
        # 安全头部
        add_header X-Content-Type-Options "nosniff";
        
        # 日志
        access_log off;
    }

    # 其他配置保持不变...
}
EOF

# 5. 测试 Nginx 配置
nginx -t

# 6. 重启 Nginx
systemctl reload nginx
```

#### 第4步：验证访问

```bash
# 在服务器上测试
curl -I https://api.feelnow.cn/static/images/payment-qrcode.jpg

# 应该看到：
# HTTP/1.1 200 OK
# Content-Type: image/jpeg

# 在浏览器中访问
# https://api.feelnow.cn/static/images/payment-qrcode.jpg
```

#### 第5步：更新小程序配置

编辑 `config.js`：

```javascript
module.exports = {
  // ... 其他配置
  
  paymentQrcode: {
    url: 'https://api.feelnow.cn/static/images/payment-qrcode.jpg',
    accountName: '你的姓名', // 替换为实际姓名
    enabled: true
  }
}
```

#### 第6步：配置微信小程序域名白名单

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 开发 → 开发管理 → 服务器域名
3. downloadFile 合法域名 → 添加：`https://api.feelnow.cn`
4. 保存并等待生效（约5分钟）

---

## 🎯 方案2：阿里云 OSS（可选）

### 优点
- ✅ CDN 加速，全国访问快
- ✅ 高可用性
- ✅ 管理方便
- ✅ 支持图片处理

### 缺点
- ❌ 需要付费（约¥0.12/GB/月）
- ❌ 配置稍复杂

### 步骤

#### 第1步：开通 OSS 服务

1. 登录 [阿里云控制台](https://oss.console.aliyun.com/)
2. 对象存储 OSS → 创建 Bucket
3. 配置：
   - Bucket 名称：`your-app-static`（自定义）
   - 区域：选择离用户最近的区域
   - 读写权限：**公共读**
   - 其他保持默认

#### 第2步：上传收款码

**方法A：使用控制台上传**

1. 进入 Bucket → 文件管理
2. 创建目录：`images/`
3. 上传文件：`payment-qrcode.jpg`

**方法B：使用 ossutil 工具**

```bash
# 1. 下载 ossutil
wget http://gosspublic.alicdn.com/ossutil/1.7.15/ossutil64
chmod 755 ossutil64

# 2. 配置
./ossutil64 config
# 输入 AccessKey ID、AccessKey Secret、Endpoint

# 3. 上传文件
./ossutil64 cp payment-qrcode.jpg oss://your-app-static/images/payment-qrcode.jpg
```

#### 第3步：获取访问链接

访问链接格式：
```
https://your-app-static.oss-cn-hangzhou.aliyuncs.com/images/payment-qrcode.jpg
```

或配置自定义域名：
```
https://static.yourdomain.com/images/payment-qrcode.jpg
```

#### 第4步：配置 CDN 加速（可选）

1. 阿里云控制台 → CDN
2. 添加域名：`static.yourdomain.com`
3. 源站类型：OSS 域名
4. 选择你的 Bucket
5. 配置 HTTPS 证书
6. 等待审核通过

#### 第5步：更新小程序配置

```javascript
paymentQrcode: {
  url: 'https://your-app-static.oss-cn-hangzhou.aliyuncs.com/images/payment-qrcode.jpg',
  // 或使用 CDN 域名
  // url: 'https://static.yourdomain.com/images/payment-qrcode.jpg',
  accountName: '你的姓名',
  enabled: true
}
```

---

## 🔧 方案3：Node.js 静态服务（备选）

### 适用场景
- 已有 Node.js 服务
- 需要动态处理图片
- 需要访问控制

### 步骤

#### 第1步：在 knowledge-api 中添加静态文件支持

编辑 `knowledge-api/server.js`：

```javascript
const express = require('express')
const path = require('path')

const app = express()

// ... 其他配置

// 静态文件服务
app.use('/static', express.static(path.join(__dirname, 'public'), {
  maxAge: '30d', // 缓存30天
  setHeaders: (res, filePath) => {
    // 允许跨域
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  }
}))

// ... 其他路由
```

#### 第2步：创建目录并上传文件

```bash
# 在服务器上
cd /root/knowledge-api
mkdir -p public/images

# 上传文件
scp payment-qrcode.jpg root@47.95.196.190:/root/knowledge-api/public/images/
```

#### 第3步：重启服务

```bash
pm2 restart knowledge-api
```

#### 第4步：访问链接

```
https://api.feelnow.cn:8443/static/images/payment-qrcode.jpg
```

---

## 📊 方案对比详细

### 性能对比

| 指标 | Nginx | OSS | Node.js |
|------|-------|-----|---------|
| 响应时间 | 5-10ms | 10-20ms | 20-30ms |
| 并发能力 | 10000+ | 无限 | 1000+ |
| 带宽成本 | 免费 | 按量付费 | 免费 |
| CDN 加速 | 需自建 | 内置 | 需自建 |

### 成本对比

| 方案 | 月成本 | 年成本 |
|------|--------|--------|
| Nginx | ¥0 | ¥0 |
| OSS（1GB存储+1GB流量） | ¥0.24 | ¥2.88 |
| Node.js | ¥0 | ¥0 |

### 维护成本

| 方案 | 配置难度 | 维护难度 | 扩展性 |
|------|----------|----------|--------|
| Nginx | ⭐ | ⭐ | ⭐⭐⭐ |
| OSS | ⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ |
| Node.js | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |

---

## 🎯 推荐方案

### 当前阶段（用户 < 1000）
**推荐：方案1 - Nginx 静态文件**

理由：
- 完全免费
- 配置简单
- 性能足够
- 无需额外服务

### 成长阶段（用户 1000-10000）
**推荐：方案2 - 阿里云 OSS**

理由：
- CDN 加速
- 高可用性
- 成本可控
- 易于扩展

### 成熟阶段（用户 > 10000）
**推荐：方案2 + CDN**

理由：
- 全国加速
- 高并发支持
- 专业服务
- 数据安全

---

## 🔒 安全建议

### 1. 图片水印（可选）

在收款码上添加水印，防止盗用：

```bash
# 使用 ImageMagick 添加水印
convert payment-qrcode.jpg \
  -pointsize 30 \
  -fill "rgba(255,255,255,0.5)" \
  -gravity southeast \
  -annotate +10+10 "仅限本小程序使用" \
  payment-qrcode-watermark.jpg
```

### 2. 防盗链（可选）

在 Nginx 配置中添加：

```nginx
location /static/ {
    alias /var/www/static/;
    
    # 防盗链
    valid_referers none blocked server_names
                   *.qq.com
                   *.weixin.qq.com
                   servicewechat.com;
    
    if ($invalid_referer) {
        return 403;
    }
}
```

### 3. 访问日志（可选）

监控图片访问情况：

```nginx
location /static/ {
    alias /var/www/static/;
    
    # 启用访问日志
    access_log /var/log/nginx/static-access.log;
}
```

查看访问统计：

```bash
# 查看访问次数
grep "payment-qrcode.jpg" /var/log/nginx/static-access.log | wc -l

# 查看访问IP
grep "payment-qrcode.jpg" /var/log/nginx/static-access.log | awk '{print $1}' | sort | uniq -c | sort -rn
```

---

## 🆘 故障排查

### 问题1：图片无法访问（404）

**检查步骤**：

```bash
# 1. 检查文件是否存在
ls -la /var/www/static/images/payment-qrcode.jpg

# 2. 检查文件权限
# 应该是 -rw-r--r--
chmod 644 /var/www/static/images/payment-qrcode.jpg

# 3. 检查目录权限
chmod 755 /var/www/static
chmod 755 /var/www/static/images

# 4. 检查 Nginx 配置
nginx -t

# 5. 查看 Nginx 错误日志
tail -f /var/log/nginx/error.log
```

### 问题2：小程序无法加载图片

**检查步骤**：

1. 确认使用 HTTPS（不是 HTTP）
2. 确认域名在微信白名单中
3. 在浏览器中测试图片链接
4. 检查图片格式和大小

### 问题3：图片加载慢

**优化方案**：

```bash
# 1. 压缩图片
# 使用 TinyPNG 或 ImageOptim 压缩

# 2. 启用 Nginx Gzip
# 在 nginx.conf 中添加
gzip on;
gzip_types image/jpeg image/png;

# 3. 启用浏览器缓存
# 在 location 中添加
expires 30d;
add_header Cache-Control "public, immutable";
```

---

## 📝 完整配置示例

### Nginx 完整配置

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name api.feelnow.cn;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/api.feelnow.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.feelnow.cn/privkey.pem;

    # 静态文件
    location /static/ {
        alias /var/www/static/;
        
        # 缓存
        expires 30d;
        add_header Cache-Control "public, immutable";
        
        # 跨域
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, OPTIONS";
        
        # 安全
        add_header X-Content-Type-Options "nosniff";
        add_header X-Frame-Options "DENY";
        
        # Gzip
        gzip on;
        gzip_types image/jpeg image/png;
        
        # 日志
        access_log /var/log/nginx/static-access.log;
    }

    # API 代理
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        access_log off;
    }
}
```

### 小程序配置

```javascript
// config.js
module.exports = {
  // ... 其他配置
  
  paymentQrcode: {
    url: 'https://api.feelnow.cn/static/images/payment-qrcode.jpg',
    accountName: '张三', // 替换为实际姓名
    enabled: true
  }
}
```

---

## ✅ 快速操作清单

### 使用 Nginx 方案（推荐）

```bash
# 1. 上传图片到服务器
scp payment-qrcode.jpg root@47.95.196.190:/tmp/

# 2. SSH 连接服务器
ssh root@47.95.196.190

# 3. 创建目录并移动文件
mkdir -p /var/www/static/images
mv /tmp/payment-qrcode.jpg /var/www/static/images/
chmod 755 /var/www/static /var/www/static/images
chmod 644 /var/www/static/images/payment-qrcode.jpg

# 4. 配置 Nginx（如果还没配置）
# 参考上面的完整配置示例

# 5. 重启 Nginx
nginx -t && systemctl reload nginx

# 6. 测试访问
curl -I https://api.feelnow.cn/static/images/payment-qrcode.jpg

# 7. 更新小程序 config.js
# 将 URL 改为：https://api.feelnow.cn/static/images/payment-qrcode.jpg
```

---

**预计时间**：5-10 分钟  
**难度**：⭐（非常简单）  
**成本**：¥0（完全免费）


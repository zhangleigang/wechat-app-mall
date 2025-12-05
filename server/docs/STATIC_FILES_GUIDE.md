# 静态文件管理指南

## 📁 目录结构

```
/root/ai-interview-helper-server/src/static/
├── avatars/              # 用户头像（动态上传）
│   └── avatar_1234567890_xxx.jpg
└── images/               # 固定图片资源
    └── payment-qrcode.png  # 收款码
```

## 🚀 快速设置

### 1. 创建目录并设置权限

```bash
cd /root/ai-interview-helper-server/server
bash setup-static-files.sh
```

### 2. 上传收款码图片

#### 方法1：使用 SCP（从本地上传）

```bash
# 在本地电脑执行
scp /path/to/your/payment-qrcode.png root@your-server:/root/ai-interview-helper-server/src/static/images/
```

#### 方法2：使用 SFTP

```bash
sftp root@your-server
cd /root/ai-interview-helper-server/src/static/images/
put payment-qrcode.png
quit
```

#### 方法3：直接在服务器上创建（如果已有图片）

```bash
# 如果收款码在旧位置
cp /var/static/images/payment-qrcode.png /root/ai-interview-helper-server/src/static/images/

# 设置权限
chmod 644 /root/ai-interview-helper-server/src/static/images/payment-qrcode.png
```

### 3. 验证文件

```bash
# 检查文件是否存在
ls -lh /root/ai-interview-helper-server/src/static/images/payment-qrcode.png

# 测试本地访问
curl -I http://localhost:3000/static/images/payment-qrcode.png

# 测试外部访问
curl -I https://api.feelnow.cn/static/images/payment-qrcode.png
```

## 📝 访问URL

### 生产环境（标准443端口）

- **收款码**: `https://api.feelnow.cn/static/images/payment-qrcode.png`
- **用户头像**: `https://api.feelnow.cn/static/avatars/avatar_xxx.jpg`

### 开发环境

- **收款码**: `http://localhost:3000/static/images/payment-qrcode.png`
- **用户头像**: `http://localhost:3000/static/avatars/avatar_xxx.jpg`

## 🔧 配置文件

### 小程序配置（config.js）

```javascript
paymentQrcode: {
  url: 'https://api.feelnow.cn/static/images/payment-qrcode.png',
  accountName: '你的姓名',
  enabled: true
}
```

### Nginx配置

```nginx
location /static/ {
    alias /root/ai-interview-helper-server/src/static/;
    autoindex off;
    
    # 头像：短期缓存（1天）
    location ~* ^/static/avatars/ {
        expires 1d;
        add_header Cache-Control "public";
    }
    
    # 收款码：长期缓存（30天）
    location ~* ^/static/images/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🛠️ 常见问题

### 1. 收款码显示404

**原因**：文件不存在或路径错误

**解决**：
```bash
# 检查文件是否存在
ls -lh /root/ai-interview-helper-server/src/static/images/payment-qrcode.png

# 检查Nginx配置中的alias路径
nginx -T | grep "location /static"

# 检查文件权限
chmod 644 /root/ai-interview-helper-server/src/static/images/payment-qrcode.png
```

### 2. 收款码显示403 Forbidden

**原因**：权限不足

**解决**：
```bash
# 设置目录权限
chmod 755 /root/ai-interview-helper-server/src/static
chmod 755 /root/ai-interview-helper-server/src/static/images

# 设置文件权限
chmod 644 /root/ai-interview-helper-server/src/static/images/payment-qrcode.png

# 检查SELinux（如果启用）
setenforce 0  # 临时关闭测试
```

### 3. 头像上传失败

**原因**：目录不存在或权限不足

**解决**：
```bash
# 创建目录
mkdir -p /root/ai-interview-helper-server/src/static/avatars

# 设置权限（需要写权限）
chmod 755 /root/ai-interview-helper-server/src/static/avatars

# 检查Node.js进程的用户权限
ps aux | grep node
```

### 4. 图片更新后还是显示旧图片

**原因**：浏览器或CDN缓存

**解决**：
```bash
# 方法1：清除浏览器缓存
# Ctrl + Shift + R (强制刷新)

# 方法2：修改文件名
mv payment-qrcode.png payment-qrcode-v2.png

# 方法3：添加版本号参数
# https://api.feelnow.cn/static/images/payment-qrcode.png?v=2
```

## 📊 文件大小建议

- **收款码**: 建议 < 500KB（推荐 200KB 左右）
- **用户头像**: 限制 < 5MB（后端已配置）

## 🔒 安全建议

1. **不要在静态目录存储敏感信息**
2. **定期清理过期的头像文件**
3. **监控磁盘空间使用**

```bash
# 查看静态文件占用空间
du -sh /root/ai-interview-helper-server/src/static/*

# 清理30天前的头像（可选）
find /root/ai-interview-helper-server/src/static/avatars/ -name "avatar_*" -mtime +30 -delete
```

## 📞 技术支持

如有问题，请检查：
1. Nginx 错误日志：`tail -f /var/log/nginx/api-error.log`
2. Node.js 日志：`pm2 logs ai-interview-helper`
3. 文件权限：`ls -lh /root/ai-interview-helper-server/src/static/`

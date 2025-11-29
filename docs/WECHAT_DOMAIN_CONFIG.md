# 微信小程序域名配置指南

## 问题现象

小程序中提示"加载收款码失败"，控制台可能显示：
- `downloadFile:fail url not in domain list`
- 或其他网络请求失败错误

## 原因

微信小程序要求所有网络请求的域名必须在后台配置白名单，包括：
- request 合法域名（API请求）
- downloadFile 合法域名（文件下载）
- uploadFile 合法域名（文件上传）
- socket 合法域名（WebSocket）

## 解决方案

### 1. 登录微信小程序后台

访问：https://mp.weixin.qq.com/
使用管理员账号登录

### 2. 进入开发管理

左侧菜单：开发 → 开发管理 → 开发设置

### 3. 配置服务器域名

找到"服务器域名"部分，点击"修改"按钮

#### 需要配置的域名：

**request合法域名**（API请求）：
```
https://api.feelnow.cn
```

**downloadFile合法域名**（文件下载，用于收款码）：
```
https://api.feelnow.cn
```

**注意事项：**
- ✅ 必须使用 HTTPS 协议
- ✅ 域名需要备案
- ✅ 需要有效的SSL证书
- ❌ 不能使用IP地址
- ❌ 不能带端口号（微信会自动使用443端口）

### 4. 端口处理

由于微信小程序不支持自定义端口（如8443），需要：

**方案A：使用Nginx反向代理（推荐）**

在服务器上配置Nginx，将443端口转发到8443：

```nginx
server {
    listen 443 ssl;
    server_name api.feelnow.cn;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass https://localhost:8443;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**方案B：直接使用443端口**

修改知识库API服务，直接监听443端口（需要root权限）

### 5. 更新小程序配置

修改 `config.js`：

```javascript
// 使用标准443端口（不带端口号）
knowledgeApiUrl: 'https://api.feelnow.cn/api',

paymentQrcode: {
    url: 'https://api.feelnow.cn/static/images/payment-qrcode.png',
    accountName: '收款人姓名',
    enabled: true
}
```

### 6. 开发阶段临时方案

如果暂时无法配置域名，可以在开发工具中：

1. 点击右上角"详情"
2. 勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"
3. 仅用于开发测试，正式版本必须配置域名

## 验证配置

### 方法1：在小程序开发工具中测试

1. 取消勾选"不校验合法域名"
2. 重新编译小程序
3. 进入支付页面，查看收款码是否正常加载

### 方法2：使用真机预览

1. 点击"预览"生成二维码
2. 用手机微信扫码
3. 测试收款码加载功能

## 常见问题

### Q1: 提示"域名格式不正确"
A: 确保使用 `https://` 开头，不要带端口号

### Q2: 提示"域名未备案"
A: 域名必须在工信部完成ICP备案

### Q3: 配置后仍然失败
A: 
- 检查SSL证书是否有效
- 检查服务器防火墙是否开放443端口
- 清除小程序缓存后重试

### Q4: 开发环境可以，正式版不行
A: 检查是否忘记在后台配置域名白名单

## 当前项目配置状态

- 域名：`api.feelnow.cn`
- 当前端口：8443（需要改为443或配置反向代理）
- SSL证书：需要确认是否有效
- 备案状态：需要确认

## 下一步操作

1. [ ] 确认域名备案状态
2. [ ] 配置Nginx反向代理（443 → 8443）
3. [ ] 在微信后台添加域名白名单
4. [ ] 更新 config.js 中的URL（去掉端口号）
5. [ ] 测试验证

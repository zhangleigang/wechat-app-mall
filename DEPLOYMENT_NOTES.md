# 部署说明文档

## 📋 项目概述

**项目名称**：AI面试助手 - 微信小程序  
**当前版本**：8.4.0  
**最后更新**：2025-11-25  
**项目状态**：✅ 核心功能完成，待配置收款人姓名

---

## 🌐 服务器架构说明

### 后端服务部署情况

#### knowledge-api 服务
- **服务器 IP**：47.95.196.190
- **域名**：api.feelnow.cn
- **HTTPS 端口**：8443（⚠️ 非标准端口）
- **HTTP 端口**：80
- **服务状态**：✅ 已部署运行

#### 为什么使用 8443 端口？

**背景说明**：

1. **标准 HTTPS 端口是 443**，但在你的服务器上，443 端口可能：
   - 已被其他服务占用
   - 或者 Nginx 配置使用了 8443 作为 SSL 端口

2. **8443 是常用的备用 HTTPS 端口**：
   - 当 443 端口不可用时，8443 是标准的替代端口
   - 许多企业和开发环境使用 8443 端口
   - 功能上与 443 端口完全相同，只是端口号不同

3. **当前配置**：
   - Nginx 监听在 `0.0.0.0:8443` 端口
   - 所有 HTTPS 请求需要指定端口号：`https://api.feelnow.cn:8443`

4. **影响**：
   - ✅ 功能完全正常，不影响使用
   - ⚠️ 访问时需要带端口号
   - ⚠️ 微信小程序域名白名单需要包含端口号

---

## 🔗 API 访问地址

### 知识库 API
```
生产环境：https://api.feelnow.cn:8443/api
本地开发：http://localhost:3000/api
```

### 静态文件服务
```
收款码图片：https://api.feelnow.cn:8443/static/images/payment-qrcode.png
测试文件：https://api.feelnow.cn:8443/static/test.txt
```

### 健康检查
```
https://api.feelnow.cn:8443/health
```

---

## ✅ 已完成的配置

### 1. 后端服务
- ✅ knowledge-api 已部署到生产服务器
- ✅ HTTPS 已配置（使用 Let's Encrypt 证书）
- ✅ Nginx 反向代理已配置
- ✅ PM2 进程管理已配置
- ✅ 域名解析已配置

### 2. 静态文件服务
- ✅ Nginx 静态文件服务已配置
- ✅ 静态文件目录已创建：`/var/www/static/images/`
- ✅ 收款码图片已上传：`payment-qrcode.png`
- ✅ 文件权限已设置正确

### 3. 小程序配置
- ✅ config.js 已更新，使用正确的 API 地址
- ✅ 收款码 URL 已配置：`https://api.feelnow.cn:8443/static/images/payment-qrcode.png`

---

## ⚠️ 待完成的配置

### 1. 收款人姓名（必须）

**文件**：`config.js`

**当前状态**：
```javascript
accountName: '请填写收款人姓名', // ⚠️ 需要修改
```

**需要改为**：
```javascript
accountName: '你的真实姓名', // 例如：'张三'
```

### 2. 微信小程序域名白名单（必须）

**位置**：微信公众平台 → 开发 → 开发管理 → 服务器域名

**需要添加**：
- **request 合法域名**：`https://api.feelnow.cn:8443`
- **downloadFile 合法域名**：`https://api.feelnow.cn:8443`

**⚠️ 重要**：必须包含端口号 `:8443`

**步骤**：
1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 开发 → 开发管理 → 服务器域名
3. 点击"修改"
4. 在 request 合法域名中添加：`https://api.feelnow.cn:8443`
5. 在 downloadFile 合法域名中添加：`https://api.feelnow.cn:8443`
6. 保存并等待生效（约5分钟）

### 3. AI 服务配置（可选）

**文件**：`config.js`

**当前状态**：
```javascript
ai_api_base: 'https://your-ai-backend.example.com', // ⚠️ 需要配置
```

**说明**：如果暂时没有 AI 服务，可以先不配置，AI 功能会暂时不可用。

---

## 🧪 测试指南

### 在微信开发者工具中测试

#### 1. 访问套餐页面的方法

**方法A：通过个人中心**
1. 点击底部 TabBar 的"个人中心"
2. 在个人中心页面，找到"会员套餐"或"开通会员"入口
3. 点击进入套餐页面

**方法B：通过 AI 功能触发**
1. 点击底部 TabBar 的"岗位分析"、"简历解读"或"情绪小屋"
2. 如果未开通会员，会自动跳转到套餐页面

**方法C：直接跳转（调试用）**
在微信开发者工具的控制台中执行：
```javascript
wx.navigateTo({
  url: '/pages/member/packages/index'
})
```

#### 2. 测试会员购买流程

**完整流程**：
1. 进入套餐页面（`/pages/member/packages/index`）
2. 查看三个套餐选项：
   - 月度会员：¥19.9 / 30天
   - 季度会员：¥49.9 / 90天
   - 年度会员：¥99.9 / 365天
3. 点击"立即购买"按钮
4. 跳转到支付页面（`/pages/member/payment/index`）
5. 查看收款码图片（应该显示你上传的收款码）
6. 查看订单号和金额
7. 点击"我已支付"按钮
8. 跳转到支付结果页面（`/pages/member/payment-result/index`）
9. 查看会员信息：
   - 会员类型
   - 到期时间
   - 剩余天数

**验证会员激活**：
1. 返回个人中心
2. 查看会员状态（应该显示"已开通"）
3. 访问 AI 功能（应该可以正常使用）

#### 3. 测试收款码显示

**检查项**：
- [ ] 收款码图片能正常加载
- [ ] 图片清晰可见
- [ ] 显示收款人姓名
- [ ] 显示订单号
- [ ] 显示套餐价格

**如果图片不显示**：
1. 检查控制台是否有错误
2. 检查域名是否在白名单中
3. 在浏览器中测试图片链接：`https://api.feelnow.cn:8443/static/images/payment-qrcode.png`

---

## 🔧 配置文件说明

### config.js 完整配置

```javascript
module.exports = {
  version: '25.09.06',
  
  // === 已废弃的 apifm 配置 ===
  subDomain: 'deprecated',
  merchantId: 0,
  
  // === AI 服务配置 ===
  ai_api_base: 'https://your-ai-backend.example.com', // ⚠️ 待配置
  ai_api_key: '',
  
  // === 知识库 API 配置 ===
  knowledgeApiUrl: 'https://api.feelnow.cn:8443/api', // ✅ 已配置（注意端口 8443）
  useLocalKnowledge: false,
  
  // === 收款码支付配置 ===
  paymentQrcode: {
    url: 'https://api.feelnow.cn:8443/static/images/payment-qrcode.png', // ✅ 已配置
    accountName: '请填写收款人姓名', // ⚠️ 需要修改为真实姓名
    enabled: true
  }
}
```

---

## 📊 端口使用说明

### 服务器端口分配

| 端口 | 服务 | 协议 | 状态 | 说明 |
|------|------|------|------|------|
| 80 | Nginx | HTTP | ✅ 运行中 | HTTP 访问，会重定向到 HTTPS |
| 443 | - | HTTPS | ❌ 未使用 | 标准 HTTPS 端口（可能被占用） |
| 3000 | knowledge-api | HTTP | ✅ 运行中 | Node.js 服务（内部） |
| 8443 | Nginx | HTTPS | ✅ 运行中 | **实际使用的 HTTPS 端口** |

### 访问方式对比

| 访问方式 | URL | 状态 | 说明 |
|---------|-----|------|------|
| 本地 HTTP | `http://localhost/static/test.txt` | ✅ 可用 | 服务器本地测试 |
| 域名 HTTP | `http://api.feelnow.cn/static/test.txt` | ✅ 可用 | 会重定向到 HTTPS |
| 域名 HTTPS (443) | `https://api.feelnow.cn/static/test.txt` | ❌ 不可用 | 443 端口未监听 |
| 域名 HTTPS (8443) | `https://api.feelnow.cn:8443/static/test.txt` | ✅ 可用 | **正确的访问方式** |

---

## 🆘 常见问题

### Q1: 为什么要使用 8443 端口而不是 443？

**A**: 你的服务器 Nginx 配置使用了 8443 端口作为 HTTPS 端口。可能的原因：
- 443 端口被其他服务占用
- 服务器配置策略使用非标准端口
- 安全策略要求使用自定义端口

这不影响功能使用，只需要在所有 HTTPS 访问时带上 `:8443` 端口号即可。

### Q2: 小程序能否使用非标准端口？

**A**: 可以！微信小程序支持自定义端口，只需要：
1. 在域名白名单中包含端口号：`https://api.feelnow.cn:8443`
2. 在代码中使用完整的 URL（包含端口号）

### Q3: 如何改为使用标准的 443 端口？

**A**: 如果想使用标准 443 端口，需要：
1. 检查 443 端口是否被占用：`netstat -tlnp | grep :443`
2. 修改 Nginx 配置，将 `listen 8443` 改为 `listen 443`
3. 重启 Nginx：`systemctl reload nginx`
4. 更新小程序配置，去掉端口号

但当前使用 8443 端口完全没有问题，建议保持现状。

### Q4: 收款码图片不显示怎么办？

**A**: 按以下步骤排查：

1. **检查图片是否存在**：
```bash
ssh root@47.95.196.190
ls -la /var/www/static/images/payment-qrcode.png
```

2. **检查文件权限**：
```bash
chmod 644 /var/www/static/images/payment-qrcode.png
```

3. **测试服务器访问**：
```bash
curl -I https://api.feelnow.cn:8443/static/images/payment-qrcode.png
# 应该返回：HTTP/1.1 200 OK
```

4. **检查微信域名白名单**：
   - 确认已添加：`https://api.feelnow.cn:8443`
   - 等待5-10分钟生效

5. **查看小程序控制台错误**：
   - 打开微信开发者工具
   - 查看 Console 面板
   - 查找图片加载错误信息

---

## 📝 部署检查清单

### 服务器端

- [x] ✅ knowledge-api 服务运行正常
- [x] ✅ Nginx 配置正确
- [x] ✅ HTTPS 证书有效
- [x] ✅ 静态文件目录已创建
- [x] ✅ 收款码图片已上传
- [x] ✅ 文件权限设置正确
- [x] ✅ 防火墙端口已开放

### 小程序端

- [x] ✅ config.js 中 API 地址已配置（8443 端口）
- [x] ✅ config.js 中收款码 URL 已配置（8443 端口）
- [ ] ⚠️ config.js 中收款人姓名需要填写
- [ ] ⚠️ 微信域名白名单需要配置（包含 8443 端口）
- [ ] ⚠️ 在开发者工具中测试

### 测试验证

- [ ] 套餐页面可以访问
- [ ] 收款码图片正常显示
- [ ] 支付流程完整
- [ ] 会员激活成功
- [ ] AI 功能可以使用

---

## 🎯 下一步行动

### 立即完成（5分钟）

1. **修改收款人姓名**
   - 打开 `config.js`
   - 找到 `accountName: '请填写收款人姓名'`
   - 改为你的真实姓名

2. **配置微信域名白名单**
   - 登录微信公众平台
   - 添加：`https://api.feelnow.cn:8443`
   - 保存并等待生效

### 测试验证（10分钟）

1. 在微信开发者工具中打开项目
2. 测试会员购买流程
3. 验证收款码显示
4. 验证会员激活

### 提交审核（1天）

1. 完整测试所有功能
2. 上传代码到微信平台
3. 提交审核
4. 等待审核结果

---

## 📞 技术支持

### 相关文档

- [项目状态报告](./PROJECT_STATUS.md) - 完整的项目状态
- [待办清单](./TODO.md) - 待完成事项
- [收款码上传指南](./docs/UPLOAD_QRCODE_GUIDE.md) - 详细上传步骤
- [测试总结](./tests/test-summary.md) - 测试报告

### 服务器信息

- **IP**：47.95.196.190
- **域名**：api.feelnow.cn
- **SSH 用户**：root
- **服务目录**：/root/knowledge-api
- **静态文件目录**：/var/www/static

---

**文档版本**：1.0  
**最后更新**：2025-11-25  
**维护者**：项目团队

# 快速开始 - 简化认证系统

## 🎉 已完成的工作

你的小程序现在已经有了一个完整的本地认证系统！

### ✅ 已创建的文件

1. **认证工具**
   - `utils/simpleAuth.js` - 核心认证逻辑

2. **登录页面**
   - `pages/login/simple.wxml` - 页面结构
   - `pages/login/simple.js` - 页面逻辑
   - `pages/login/simple.wxss` - 页面样式
   - `pages/login/simple.json` - 页面配置

3. **文档**
   - `docs/SIMPLE_AUTH_USAGE.md` - 详细使用文档
   - `docs/WECHAT_LOGIN_GUIDE.md` - 微信登录完整指南

### ✅ 已更新的文件

1. `app.json` - 注册了新的登录页面
2. `pages/my/index.js` - 更新跳转到新登录页
3. `pages/ai/job/index.js` - 使用新的认证系统
4. `utils/ai.js` - 支持新的认证头

## 🚀 如何使用

### 1. 测试登录功能

1. 在微信开发者工具中编译项目
2. 点击底部导航栏的"个人中心"
3. 点击"立即登录"按钮
4. 在新登录页面：
   - 勾选"我已阅读并同意用户协议"
   - 点击"快速登录"按钮
5. 登录成功后会自动跳转回首页

### 2. 测试 AI 功能

1. 登录后，进入"岗位分析"页面
2. 输入问题，点击发送
3. 系统会自动携带用户认证信息

### 3. 查看用户信息

在任何页面的 JS 文件中：

```javascript
const SimpleAuth = require('../../utils/simpleAuth')

// 获取用户信息
const userInfo = SimpleAuth.getUserInfo()
console.log('当前用户:', userInfo)
```

## 📱 功能演示

### 登录流程

```
用户打开小程序
    ↓
点击"个人中心"
    ↓
点击"立即登录"
    ↓
跳转到登录页面
    ↓
勾选协议 → 点击"快速登录"
    ↓
自动生成用户ID和Token
    ↓
保存到本地存储
    ↓
跳转回首页
    ↓
可以使用所有功能
```

### 自动登录

```
用户再次打开小程序
    ↓
系统检查本地存储
    ↓
发现已有登录信息
    ↓
自动登录成功
    ↓
直接使用功能
```

## 🔧 配置说明

### 当前配置（开发模式）

在 `utils/simpleAuth.js` 中：

- ✅ 本地生成用户ID
- ✅ 本地生成Token
- ✅ 30天自动过期
- ✅ 支持静默登录
- ✅ 支持手机号登录（模拟）

### 生产环境配置

如果要部署到生产环境，需要：

1. **搭建后端服务**
   ```bash
   # 参考 docs/WECHAT_LOGIN_GUIDE.md 中的后端示例
   ```

2. **修改 config.js**
   ```javascript
   module.exports = {
     // 添加认证API地址
     auth_api_base: 'https://your-backend.com/api/auth',
     
     // 其他配置...
   }
   ```

3. **更新 simpleAuth.js**
   - 将本地生成改为API调用
   - 参考 `docs/SIMPLE_AUTH_USAGE.md` 中的"迁移到生产环境"章节

## 🎯 核心功能

### 1. 静默登录

```javascript
const SimpleAuth = require('../../utils/simpleAuth')

// 自动登录（推荐）
const hasLogined = await SimpleAuth.checkHasLogined()
if (hasLogined) {
  console.log('已登录')
}
```

### 2. 检查登录状态

```javascript
// 仅检查，不自动登录
const isLogined = SimpleAuth.checkLoginStatus()
if (!isLogined) {
  wx.navigateTo({ url: '/pages/login/simple' })
}
```

### 3. 获取用户信息

```javascript
const userInfo = SimpleAuth.getUserInfo()
console.log(userInfo)
// {
//   userId: 'user_1234567890_abc123',
//   token: 'token_1234567890_xyz789',
//   phone: undefined,
//   nickName: undefined,
//   avatarUrl: undefined,
//   loginTime: 1234567890000
// }
```

### 4. 更新用户信息

```javascript
SimpleAuth.updateUserInfo({
  nickName: '张三',
  avatarUrl: 'https://example.com/avatar.jpg'
})
```

### 5. 退出登录

```javascript
SimpleAuth.logout()
wx.reLaunch({ url: '/pages/login/simple' })
```

## 📊 数据存储

系统使用微信小程序的本地存储：

| 存储Key | 说明 | 示例值 |
|---------|------|--------|
| userId | 用户唯一标识 | user_1701234567890_abc123 |
| token | 认证令牌 | token_1701234567890_xyz789 |
| wxCode | 微信登录code | 071abc... |
| loginTime | 登录时间戳 | 1701234567890 |
| phone | 手机号（可选） | 138****1234 |
| nickName | 昵称（可选） | 张三 |
| avatarUrl | 头像（可选） | https://... |

## 🔐 安全说明

### 当前实现（开发/测试）

- ✅ 适合开发测试
- ✅ 适合演示展示
- ✅ 适合小型个人项目
- ⚠️ 不适合生产环境（需要后端支持）

### 安全特性

1. **Token 自动过期**：30天后需要重新登录
2. **本地存储加密**：微信小程序自动加密存储
3. **请求头携带**：API 请求自动携带认证信息

### 生产环境建议

1. 搭建后端服务器
2. 使用真实的用户数据库
3. 实现 JWT token 验证
4. 添加 token 刷新机制
5. 实现手机号真实解密

## 🐛 调试技巧

### 1. 查看登录状态

在控制台输入：

```javascript
const SimpleAuth = require('../../utils/simpleAuth')
console.log('用户信息:', SimpleAuth.getUserInfo())
console.log('登录状态:', SimpleAuth.checkLoginStatus())
```

### 2. 清除登录状态

```javascript
SimpleAuth.logout()
console.log('已退出登录')
```

### 3. 查看存储数据

在微信开发者工具中：
1. 点击"调试器"
2. 选择"Storage" → "Storage"
3. 查看所有存储的数据

### 4. 模拟登录过期

```javascript
// 修改登录时间为31天前
const oldTime = Date.now() - (31 * 24 * 60 * 60 * 1000)
wx.setStorageSync('loginTime', oldTime)

// 再次检查登录状态
const isLogined = SimpleAuth.checkLoginStatus()
console.log('登录状态:', isLogined) // 应该返回 false
```

## 📝 常见问题

### Q1: 登录后刷新小程序还需要重新登录吗？

**A:** 不需要。登录信息保存在本地，30天内都有效。

### Q2: 如何实现"记住我"功能？

**A:** 已经实现了，默认就是"记住我"状态。

### Q3: 可以获取真实的手机号吗？

**A:** 当前是模拟的。要获取真实手机号，需要后端服务器调用微信API解密。

### Q4: 如何在多个页面共享登录状态？

**A:** 使用 `SimpleAuth.checkLoginStatus()` 或 `SimpleAuth.checkHasLogined()`。

### Q5: Token 会自动刷新吗？

**A:** 当前不会。如果需要，可以在 `checkLoginStatus` 中添加刷新逻辑。

## 🎨 自定义登录页面

### 修改样式

编辑 `pages/login/simple.wxss`：

```css
/* 修改主题色 */
.primary-btn {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
}

/* 修改品牌图标 */
.brand-icon {
  font-size: 80px; /* 调整大小 */
}
```

### 修改文案

编辑 `pages/login/simple.wxml`：

```xml
<text class="brand-title">你的应用名称</text>
<text class="brand-subtitle">你的应用描述</text>
```

### 添加更多登录方式

在 `pages/login/simple.wxml` 中添加按钮：

```xml
<button class="login-btn" bindtap="handleWechatLogin">
  <text class="btn-icon">💬</text>
  <text class="btn-text">微信授权登录</text>
</button>
```

## 📚 相关文档

- [详细使用文档](./SIMPLE_AUTH_USAGE.md)
- [微信登录完整指南](./WECHAT_LOGIN_GUIDE.md)
- [技术架构文档](./technical/ARCHITECTURE.md)

## 🎉 下一步

1. ✅ 测试登录功能
2. ✅ 测试 AI 功能
3. ⏳ 根据需要自定义登录页面
4. ⏳ 准备后端服务（如果需要）
5. ⏳ 部署到生产环境

---

**恭喜！你的小程序现在有了完整的登录系统！** 🎊

如有问题，请查看相关文档或在控制台查看日志。

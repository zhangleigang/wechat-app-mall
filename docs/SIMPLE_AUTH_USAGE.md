# 简化认证系统使用说明

## 概述

本项目已实现一个简化的本地认证系统，不依赖第三方服务，适合开发测试和小型应用使用。

## 特性

- ✅ 静默登录（用户无感知）
- ✅ 手机号登录（可选）
- ✅ 本地存储用户信息
- ✅ Token 自动管理
- ✅ 30天自动过期
- ✅ 完整的错误处理

## 文件结构

```
utils/
  └── simpleAuth.js          # 简化认证工具
pages/
  └── login/
      ├── simple.wxml        # 新登录页面
      ├── simple.js
      ├── simple.wxss
      └── simple.json
```

## 使用方法

### 1. 在页面中检查登录状态

```javascript
const SimpleAuth = require('../../utils/simpleAuth')

Page({
  async onLoad() {
    // 方法1：检查是否已登录
    const isLogined = SimpleAuth.checkLoginStatus()
    if (!isLogined) {
      wx.navigateTo({ url: '/pages/login/simple' })
      return
    }
    
    // 方法2：自动登录（推荐）
    const hasLogined = await SimpleAuth.checkHasLogined()
    if (hasLogined) {
      // 已登录，继续执行
      this.loadData()
    }
  }
})
```

### 2. 获取用户信息

```javascript
const userInfo = SimpleAuth.getUserInfo()
console.log(userInfo)
// {
//   userId: 'user_1234567890_abc123',
//   token: 'token_1234567890_xyz789',
//   phone: '138****1234',
//   nickName: '用户昵称',
//   avatarUrl: 'https://...',
//   loginTime: 1234567890000
// }
```

### 3. 更新用户信息

```javascript
SimpleAuth.updateUserInfo({
  nickName: '新昵称',
  avatarUrl: 'https://new-avatar.jpg'
})
```

### 4. 退出登录

```javascript
SimpleAuth.logout()
wx.reLaunch({ url: '/pages/login/simple' })
```

### 5. 在 API 请求中使用认证

```javascript
const headers = SimpleAuth.getAuthHeaders()
// {
//   'Authorization': 'Bearer token_...',
//   'X-User-Id': 'user_...',
//   'Content-Type': 'application/json'
// }

wx.request({
  url: 'https://your-api.com/endpoint',
  method: 'POST',
  header: headers,
  data: { ... }
})
```

## API 参考

### SimpleAuth.silentLogin()

静默登录，返回 Promise。

```javascript
const result = await SimpleAuth.silentLogin()
if (result.success) {
  console.log('登录成功:', result.data)
} else {
  console.error('登录失败:', result.error)
}
```

### SimpleAuth.phoneLogin(phoneCode)

手机号登录，返回 Promise。

```javascript
// 在 getPhoneNumber 回调中使用
async handlePhoneLogin(e) {
  if (e.detail.errMsg === 'getPhoneNumber:ok') {
    const result = await SimpleAuth.phoneLogin(e.detail.code)
    if (result.success) {
      console.log('登录成功:', result.data)
    }
  }
}
```

### SimpleAuth.checkLoginStatus()

检查登录状态，返回 boolean。

```javascript
const isLogined = SimpleAuth.checkLoginStatus()
if (isLogined) {
  // 已登录
}
```

### SimpleAuth.checkHasLogined()

检查登录状态，如果未登录则自动静默登录，返回 Promise<boolean>。

```javascript
const hasLogined = await SimpleAuth.checkHasLogined()
if (hasLogined) {
  // 已登录或自动登录成功
}
```

### SimpleAuth.getUserInfo()

获取用户信息，返回对象。

```javascript
const userInfo = SimpleAuth.getUserInfo()
```

### SimpleAuth.updateUserInfo(info)

更新用户信息。

```javascript
SimpleAuth.updateUserInfo({
  nickName: '新昵称',
  avatarUrl: 'https://...'
})
```

### SimpleAuth.logout()

退出登录。

```javascript
SimpleAuth.logout()
```

### SimpleAuth.getAuthHeaders()

获取认证请求头。

```javascript
const headers = SimpleAuth.getAuthHeaders()
```

## 数据存储

系统使用 `wx.setStorageSync` 存储以下数据：

| Key | 说明 | 示例 |
|-----|------|------|
| userId | 用户ID | user_1234567890_abc123 |
| token | 认证令牌 | token_1234567890_xyz789 |
| phone | 手机号 | 138****1234 |
| nickName | 昵称 | 张三 |
| avatarUrl | 头像URL | https://... |
| wxCode | 微信code | 071abc... |
| loginTime | 登录时间戳 | 1234567890000 |

## 安全说明

### 当前实现（开发/测试）

- 用户ID和Token在本地生成
- 数据存储在本地
- 适合开发测试和演示

### 生产环境建议

如果要部署到生产环境，建议：

1. **搭建后端服务**
   - 实现真实的用户注册/登录
   - 使用数据库存储用户信息
   - 生成安全的JWT token

2. **修改 simpleAuth.js**
   - 将 `silentLogin` 改为调用后端API
   - 将 `phoneLogin` 改为调用后端解密接口
   - 添加 token 刷新机制

3. **示例后端实现**
   ```javascript
   // 修改 silentLogin 方法
   async function silentLogin() {
     const code = await getWxCode()
     
     const res = await wx.request({
       url: 'https://your-backend.com/api/auth/login',
       method: 'POST',
       data: { code }
     })
     
     if (res.data.code === 0) {
       wx.setStorageSync('userId', res.data.data.userId)
       wx.setStorageSync('token', res.data.data.token)
       return { success: true, data: res.data.data }
     }
     
     return { success: false, error: res.data.msg }
   }
   ```

## 迁移到生产环境

### 步骤1：准备后端API

创建以下接口：

- `POST /api/auth/login` - 静默登录
- `POST /api/auth/phone-login` - 手机号登录
- `POST /api/auth/check` - 检查token有效性
- `POST /api/auth/refresh` - 刷新token

### 步骤2：修改配置

在 `config.js` 中添加：

```javascript
module.exports = {
  // ... 其他配置
  auth_api_base: 'https://your-backend.com/api/auth',
  use_simple_auth: true // true: 使用简化认证, false: 使用后端认证
}
```

### 步骤3：更新 simpleAuth.js

将本地生成改为API调用（参考上面的示例）。

## 常见问题

### Q1: 为什么登录后刷新小程序还是登录状态？

A: 因为用户信息存储在本地，除非主动退出或超过30天，否则会一直保持登录。

### Q2: 如何清除登录状态？

A: 调用 `SimpleAuth.logout()` 或在开发者工具中清除缓存。

### Q3: 手机号登录获取的是真实手机号吗？

A: 当前是模拟的手机号。要获取真实手机号，需要后端解密。

### Q4: Token 会过期吗？

A: 会，默认30天后自动过期，需要重新登录。

### Q5: 可以同时使用旧的 AUTH 和新的 SimpleAuth 吗？

A: 可以，但建议统一使用一个认证系统。

## 下一步

1. ✅ 基础认证系统已完成
2. ⏳ 根据需要添加后端支持
3. ⏳ 实现用户资料编辑功能
4. ⏳ 添加第三方登录（微信、QQ等）

---

如有问题，请查看 `docs/WECHAT_LOGIN_GUIDE.md` 了解更多详情。

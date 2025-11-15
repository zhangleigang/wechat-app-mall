# 微信小程序登录实现指南

## 一、登录方式对比

| 登录方式 | 用户体验 | 安全性 | 获取信息 | 适用场景 |
|---------|---------|--------|---------|---------|
| 静默登录 | 无感知 | 高 | openid | 首次进入小程序 |
| 手机号登录 | 需授权 | 高 | 手机号 | 需要实名认证 |
| 微信授权 | 需授权 | 中 | 昵称、头像 | 社交类应用 |

## 二、推荐的登录流程

### 方案A：静默登录 + 手机号（推荐）

```
用户打开小程序
    ↓
自动调用 wx.login() 获取 code
    ↓
后端用 code 换取 openid
    ↓
后端生成临时 token
    ↓
用户可以浏览部分功能
    ↓
需要核心功能时，引导手机号授权
    ↓
获取手机号，完成正式注册
    ↓
后端生成正式 token
```

### 方案B：仅静默登录（简单场景）

```
用户打开小程序
    ↓
自动调用 wx.login() 获取 code
    ↓
后端用 code 换取 openid
    ↓
后端生成 token（以 openid 为用户标识）
    ↓
用户可以使用所有功能
```

## 三、代码实现示例

### 1. 前端代码（小程序端）

#### utils/simpleAuth.js - 简化版登录工具

```javascript
// 简化版登录工具（不依赖第三方服务）
const API_BASE = 'https://your-backend.com/api'

/**
 * 获取微信登录 code
 */
function getWxCode() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          resolve(res.code)
        } else {
          reject(new Error('获取code失败'))
        }
      },
      fail: reject
    })
  })
}

/**
 * 静默登录
 */
async function silentLogin() {
  try {
    // 1. 获取微信 code
    const code = await getWxCode()
    
    // 2. 发送到后端
    const res = await wx.request({
      url: `${API_BASE}/auth/login`,
      method: 'POST',
      data: { code }
    })
    
    if (res.data.code === 0) {
      // 3. 保存 token
      wx.setStorageSync('token', res.data.data.token)
      wx.setStorageSync('userId', res.data.data.userId)
      wx.setStorageSync('openid', res.data.data.openid)
      return { success: true, data: res.data.data }
    } else {
      throw new Error(res.data.msg || '登录失败')
    }
  } catch (error) {
    console.error('静默登录失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 手机号登录
 */
async function phoneLogin(code, encryptedData, iv) {
  try {
    const wxCode = await getWxCode()
    
    const res = await wx.request({
      url: `${API_BASE}/auth/phone-login`,
      method: 'POST',
      data: {
        code: wxCode,
        phoneCode: code,
        encryptedData,
        iv
      }
    })
    
    if (res.data.code === 0) {
      wx.setStorageSync('token', res.data.data.token)
      wx.setStorageSync('userId', res.data.data.userId)
      wx.setStorageSync('phone', res.data.data.phone)
      return { success: true, data: res.data.data }
    } else {
      throw new Error(res.data.msg || '登录失败')
    }
  } catch (error) {
    console.error('手机号登录失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 检查登录状态
 */
async function checkLoginStatus() {
  const token = wx.getStorageSync('token')
  if (!token) {
    return false
  }
  
  try {
    const res = await wx.request({
      url: `${API_BASE}/auth/check`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    return res.data.code === 0
  } catch (error) {
    return false
  }
}

/**
 * 退出登录
 */
function logout() {
  wx.removeStorageSync('token')
  wx.removeStorageSync('userId')
  wx.removeStorageSync('openid')
  wx.removeStorageSync('phone')
}

module.exports = {
  getWxCode,
  silentLogin,
  phoneLogin,
  checkLoginStatus,
  logout
}
```

#### pages/login/simple.wxml - 简化版登录页面

```xml
<view class="login-page">
  <view class="login-header">
    <image class="logo" src="/images/logo.png" />
    <text class="title">欢迎使用</text>
  </view>
  
  <view class="login-methods">
    <!-- 手机号快捷登录 -->
    <button 
      class="login-btn primary"
      open-type="getPhoneNumber" 
      bindgetphonenumber="handlePhoneLogin"
    >
      <text class="icon">📱</text>
      <text>手机号快捷登录</text>
    </button>
    
    <!-- 游客登录 -->
    <button 
      class="login-btn secondary"
      bindtap="handleGuestLogin"
    >
      <text class="icon">👤</text>
      <text>游客登录</text>
    </button>
  </view>
  
  <view class="agreement">
    <checkbox-group bindchange="onAgreeChange">
      <checkbox value="agree" checked="{{agreed}}" />
    </checkbox-group>
    <text>我已阅读并同意</text>
    <text class="link" bindtap="showAgreement">《用户协议》</text>
    <text>和</text>
    <text class="link" bindtap="showPrivacy">《隐私政策》</text>
  </view>
</view>
```

#### pages/login/simple.js

```javascript
const Auth = require('../../utils/simpleAuth')

Page({
  data: {
    agreed: false
  },
  
  onLoad() {
    // 页面加载时尝试静默登录
    this.tryAutoLogin()
  },
  
  /**
   * 自动登录
   */
  async tryAutoLogin() {
    const hasLogin = await Auth.checkLoginStatus()
    if (hasLogin) {
      // 已登录，跳转到首页
      wx.switchTab({
        url: '/pages/index/index'
      })
    }
  },
  
  /**
   * 手机号登录
   */
  async handlePhoneLogin(e) {
    if (!this.data.agreed) {
      wx.showToast({
        title: '请先同意用户协议',
        icon: 'none'
      })
      return
    }
    
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      wx.showLoading({ title: '登录中...' })
      
      const result = await Auth.phoneLogin(
        e.detail.code,
        e.detail.encryptedData,
        e.detail.iv
      )
      
      wx.hideLoading()
      
      if (result.success) {
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
        
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }, 1500)
      } else {
        wx.showModal({
          title: '登录失败',
          content: result.error,
          showCancel: false
        })
      }
    }
  },
  
  /**
   * 游客登录（静默登录）
   */
  async handleGuestLogin() {
    if (!this.data.agreed) {
      wx.showToast({
        title: '请先同意用户协议',
        icon: 'none'
      })
      return
    }
    
    wx.showLoading({ title: '登录中...' })
    
    const result = await Auth.silentLogin()
    
    wx.hideLoading()
    
    if (result.success) {
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })
      
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index'
        })
      }, 1500)
    } else {
      wx.showModal({
        title: '登录失败',
        content: result.error,
        showCancel: false
      })
    }
  },
  
  /**
   * 协议勾选
   */
  onAgreeChange(e) {
    this.setData({
      agreed: e.detail.value.length > 0
    })
  },
  
  /**
   * 显示用户协议
   */
  showAgreement() {
    wx.navigateTo({
      url: '/pages/agreement/index?type=user'
    })
  },
  
  /**
   * 显示隐私政策
   */
  showPrivacy() {
    wx.navigateTo({
      url: '/pages/agreement/index?type=privacy'
    })
  }
})
```

### 2. 后端代码（Node.js + Express 示例）

#### routes/auth.js

```javascript
const express = require('express')
const router = express.Router()
const axios = require('axios')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const APPID = 'your-appid'
const SECRET = 'your-secret'
const JWT_SECRET = 'your-jwt-secret'

/**
 * 静默登录
 */
router.post('/login', async (req, res) => {
  try {
    const { code } = req.body
    
    // 1. 调用微信接口换取 openid
    const wxRes = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: APPID,
        secret: SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    })
    
    if (wxRes.data.errcode) {
      return res.json({
        code: -1,
        msg: wxRes.data.errmsg
      })
    }
    
    const { openid, session_key } = wxRes.data
    
    // 2. 查询或创建用户
    let user = await User.findOne({ openid })
    if (!user) {
      user = await User.create({
        openid,
        session_key,
        createTime: new Date()
      })
    } else {
      // 更新 session_key
      user.session_key = session_key
      await user.save()
    }
    
    // 3. 生成 JWT token
    const token = jwt.sign(
      { userId: user._id, openid },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    
    res.json({
      code: 0,
      msg: '登录成功',
      data: {
        token,
        userId: user._id,
        openid
      }
    })
  } catch (error) {
    console.error('登录失败:', error)
    res.json({
      code: -1,
      msg: '登录失败'
    })
  }
})

/**
 * 手机号登录
 */
router.post('/phone-login', async (req, res) => {
  try {
    const { code, phoneCode, encryptedData, iv } = req.body
    
    // 1. 获取 session_key
    const wxRes = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: APPID,
        secret: SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    })
    
    const { openid, session_key } = wxRes.data
    
    // 2. 解密手机号
    const phone = decryptData(encryptedData, session_key, iv)
    
    // 3. 查询或创建用户
    let user = await User.findOne({ openid })
    if (!user) {
      user = await User.create({
        openid,
        phone: phone.phoneNumber,
        session_key,
        createTime: new Date()
      })
    } else {
      user.phone = phone.phoneNumber
      user.session_key = session_key
      await user.save()
    }
    
    // 4. 生成 token
    const token = jwt.sign(
      { userId: user._id, openid, phone: phone.phoneNumber },
      JWT_SECRET,
      { expiresIn: '30d' }
    )
    
    res.json({
      code: 0,
      msg: '登录成功',
      data: {
        token,
        userId: user._id,
        phone: phone.phoneNumber
      }
    })
  } catch (error) {
    console.error('手机号登录失败:', error)
    res.json({
      code: -1,
      msg: '登录失败'
    })
  }
})

/**
 * 检查登录状态
 */
router.post('/check', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.json({ code: -1, msg: '未登录' })
    }
    
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await User.findById(decoded.userId)
    
    if (!user) {
      return res.json({ code: -1, msg: '用户不存在' })
    }
    
    res.json({
      code: 0,
      msg: '已登录',
      data: {
        userId: user._id,
        phone: user.phone
      }
    })
  } catch (error) {
    res.json({ code: -1, msg: 'token无效' })
  }
})

/**
 * 解密数据
 */
function decryptData(encryptedData, sessionKey, iv) {
  const sessionKeyBuffer = Buffer.from(sessionKey, 'base64')
  const encryptedDataBuffer = Buffer.from(encryptedData, 'base64')
  const ivBuffer = Buffer.from(iv, 'base64')
  
  const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKeyBuffer, ivBuffer)
  decipher.setAutoPadding(true)
  
  let decoded = decipher.update(encryptedDataBuffer, null, 'utf8')
  decoded += decipher.final('utf8')
  
  return JSON.parse(decoded)
}

module.exports = router
```

## 四、你的项目建议

根据你当前的项目情况，我建议：

### 选项1：自建后端（推荐）

如果你有自己的后端服务器，可以：

1. 实现上面的简化版登录流程
2. 不依赖第三方服务（如 apifm）
3. 完全掌控用户数据和登录逻辑

### 选项2：继续使用 apifm

如果要继续使用当前的 apifm 服务：

1. 访问 https://www.it120.cc 注册账号
2. 申请专属域名
3. 在 `config.js` 中配置正确的 `subDomain`

### 选项3：临时方案（仅用于开发测试）

如果只是想测试 AI 功能，可以：

1. 移除登录检查
2. 使用模拟的用户数据
3. 专注于 AI 功能的开发

## 五、常见问题

### Q1: 为什么需要后端？
A: 微信小程序的登录必须通过后端，因为 `appSecret` 不能暴露在小程序代码中。

### Q2: session_key 有什么用？
A: 用于解密微信返回的加密数据（如手机号、用户信息等）。

### Q3: token 应该怎么管理？
A: 建议使用 JWT，设置合理的过期时间（如7-30天），并在每次请求时携带。

### Q4: 如何处理 token 过期？
A: 在请求拦截器中检查返回码，如果 token 过期，自动调用刷新 token 或重新登录。

## 六、安全建议

1. **永远不要在小程序中存储 appSecret**
2. **使用 HTTPS 传输数据**
3. **token 设置合理的过期时间**
4. **敏感操作需要二次验证**
5. **定期更新 session_key**

---

希望这份指南能帮助你理解微信小程序的登录机制！

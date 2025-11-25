# 个人收款码支付方案 - 详细实现文档

## 方案概述

使用个人微信收款码 + 半自动确认的方式实现会员支付功能。

**核心流程**：
```
用户选择套餐 → 生成订单 → 显示收款码+订单号 → 用户扫码转账（备注订单号）
→ 用户点击"我已支付" → 管理员在后台确认 → 系统自动开通会员
```

**技术栈**：
- 前端：微信小程序原生 + Vant Weapp
- 后端：apifm（订单管理）或 微信云开发
- 数据库：apifm 或 云数据库

---

## 架构设计

### 数据库设计

#### orders 表（订单表）
```javascript
{
  _id: "订单ID",
  orderNumber: "ORD20241125001", // 订单号（唯一）
  userId: "用户ID",
  openid: "用户openid",
  packageId: "quarterly", // 套餐ID
  packageName: "季度会员",
  amount: 49.9,
  duration: 90, // 天数
  status: 0, // 0-待支付 1-已支付 2-已取消
  paymentMethod: "qrcode", // 支付方式
  paymentProof: "", // 支付凭证URL（可选）
  createTime: "2024-11-25 10:00:00",
  payTime: null,
  confirmBy: "", // 确认人
  confirmTime: null
}
```

#### members 表（会员表）
```javascript
{
  _id: "会员ID",
  userId: "用户ID",
  openid: "用户openid",
  memberType: "quarterly",
  startDate: "2024-11-25",
  expireDate: "2025-02-23",
  status: 1, // 0-已过期 1-有效
  orderId: "关联订单ID",
  createTime: "2024-11-25 10:00:00"
}
```

#### payment_configs 表（收款码配置）
```javascript
{
  _id: "配置ID",
  qrcodeUrl: "收款码图片URL",
  accountName: "收款人姓名",
  isActive: true,
  updateTime: "2024-11-25"
}
```

---

## 实现步骤

### 第一步：准备收款码

#### 1.1 生成收款码


1. 打开微信 → 我 → 服务 → 收付款 → 二维码收款
2. 点击"保存收款码"
3. 保存到手机相册

#### 1.2 上传收款码

**方式A：使用图床（推荐）**
- 访问 https://imgse.com 或 https://sm.ms
- 上传收款码图片
- 获取图片URL

**方式B：使用云存储**
- 上传到微信云开发存储
- 获取文件URL

**方式C：使用项目静态资源**
- 放在 `/images/payment/` 目录
- 使用相对路径

#### 1.3 配置收款码

在 `config.js` 中添加配置：

```javascript
// config.js
module.exports = {
  // ... 其他配置
  
  // 收款码配置
  paymentQrcode: {
    url: 'https://your-image-url.com/qrcode.jpg', // 收款码URL
    accountName: '张三', // 收款人姓名（可选）
  }
}
```

---

### 第二步：修改支付页面

#### 2.1 修改 pages/member/payment/index.js

**关键改动**：
1. 移除 apifm 支付调用
2. 显示收款码和订单号
3. 添加"我已支付"按钮
4. 添加查询订单状态功能

**完整代码**：

```javascript
// pages/member/payment/index.js
const AUTH = require('../../../utils/auth')
const MEMBER = require('../../../utils/member')
const CONFIG = require('../../../config')

Page({
  data: {
    packageInfo: null,
    orderInfo: null,
    qrcodeUrl: '',
    loading: false,
    checking: false
  },

  async onLoad(options) {
    const { packageId } = options

    // 检查登录
    const isLogined = await AUTH.checkHasLogined()
    if (!isLogined) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再支付',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/simple' })
          } else {
            wx.navigateBack()
          }
        }
      })
      return
    }

    // 获取套餐信息
    const packageInfo = MEMBER.getPackageInfo(packageId)
    if (!packageInfo) {
      wx.showToast({ title: '套餐不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    this.setData({
      packageInfo: {
        ...packageInfo,
        duration: `${packageInfo.duration}天`
      },
      qrcodeUrl: CONFIG.paymentQrcode.url
    })

    // 创建订单
    await this.createOrder()
  },

  // 创建订单
  async createOrder() {
    this.setData({ loading: true })
    wx.showLoading({ title: '创建订单中...', mask: true })

    try {
      const orderInfo = await MEMBER.createMemberOrder(this.data.packageInfo.id)

      this.setData({
        orderInfo: orderInfo,
        loading: false
      })

      wx.hideLoading()
      
    } catch (error) {
      wx.hideLoading()
      this.setData({ loading: false })

      wx.showModal({
        title: '创建订单失败',
        content: error.message || '请稍后重试',
        showCancel: false,
        success: () => wx.navigateBack()
      })
    }
  },

  // 复制订单号
  copyOrderNumber() {
    wx.setClipboardData({
      data: this.data.orderInfo.orderNumber,
      success: () => {
        wx.showToast({ title: '订单号已复制', icon: 'success' })
      }
    })
  },

  // 保存收款码
  saveQrcode() {
    wx.downloadFile({
      url: this.data.qrcodeUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.showToast({ title: '已保存到相册', icon: 'success' })
            },
            fail: () => {
              wx.showToast({ title: '保存失败', icon: 'none' })
            }
          })
        }
      }
    })
  },

  // 预览收款码
  previewQrcode() {
    wx.previewImage({
      urls: [this.data.qrcodeUrl],
      current: this.data.qrcodeUrl
    })
  },

  // 我已支付
  async handlePaid() {
    if (this.data.checking) return

    this.setData({ checking: true })
    wx.showLoading({ title: '提交中...', mask: true })

    try {
      // 标记订单为"待确认"状态（可选）
      // 这里可以调用接口更新订单状态

      wx.hideLoading()
      this.setData({ checking: false })

      wx.showModal({
        title: '提交成功',
        content: '您的支付信息已提交，管理员确认后会立即开通会员（通常5-30分钟）',
        confirmText: '查询状态',
        cancelText: '返回首页',
        success: (res) => {
          if (res.confirm) {
            this.checkOrderStatus()
          } else {
            wx.switchTab({ url: '/pages/ai/job/index' })
          }
        }
      })

    } catch (error) {
      wx.hideLoading()
      this.setData({ checking: false })
      wx.showToast({ title: '提交失败', icon: 'none' })
    }
  },

  // 查询订单状态
  async checkOrderStatus() {
    wx.showLoading({ title: '查询中...', mask: true })

    try {
      // 调用接口查询订单状态
      const status = await MEMBER.checkOrderStatus(this.data.orderInfo.orderId)

      wx.hideLoading()

      if (status === 1) {
        // 已支付
        wx.showModal({
          title: '支付成功',
          content: '您的会员已开通，现在可以使用所有功能了！',
          showCancel: false,
          success: () => {
            wx.redirectTo({
              url: `/pages/member/payment-result/index?status=success&orderNumber=${this.data.orderInfo.orderNumber}&packageName=${this.data.packageInfo.name}`
            })
          }
        })
      } else {
        wx.showModal({
          title: '待确认',
          content: '订单还在处理中，请耐心等待。管理员确认后会立即开通会员。',
          showCancel: false
        })
      }

    } catch (error) {
      wx.hideLoading()
      wx.showToast({ title: '查询失败', icon: 'none' })
    }
  },

  // 取消订单
  cancelOrder() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个订单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack()
        }
      }
    })
  }
})
```

#### 2.2 修改 pages/member/payment/index.wxml

```xml
<view class="payment-container">
  <!-- 订单信息 -->
  <view class="order-section" wx:if="{{orderInfo}}">
    <view class="section-title">
      <van-icon name="orders-o" size="20px" />
      <text>订单信息</text>
    </view>
    
    <view class="order-card">
      <view class="order-row">
        <text class="label">订单号</text>
        <view class="value-box">
          <text class="value order-number">{{orderInfo.orderNumber}}</text>
          <van-button 
            size="mini" 
            type="primary" 
            bind:click="copyOrderNumber"
            custom-class="copy-btn"
          >
            复制
          </van-button>
        </view>
      </view>
      
      <view class="order-row">
        <text class="label">套餐类型</text>
        <text class="value">{{packageInfo.name}}</text>
      </view>
      
      <view class="order-row">
        <text class="label">有效期</text>
        <text class="value">{{packageInfo.duration}}</text>
      </view>
      
      <view class="order-row highlight">
        <text class="label">支付金额</text>
        <text class="value price">¥{{packageInfo.price}}</text>
      </view>
    </view>
  </view>

  <!-- 收款码 -->
  <view class="qrcode-section" wx:if="{{qrcodeUrl}}">
    <view class="section-title">
      <van-icon name="qr" size="20px" />
      <text>扫码支付</text>
    </view>
    
    <view class="qrcode-card">
      <image 
        class="qrcode-image" 
        src="{{qrcodeUrl}}" 
        mode="aspectFit"
        bind:tap="previewQrcode"
      />
      
      <view class="qrcode-actions">
        <van-button 
          size="small" 
          type="default"
          icon="photo-o"
          bind:click="saveQrcode"
        >
          保存收款码
        </van-button>
      </view>
    </view>
  </view>

  <!-- 支付说明 -->
  <view class="tips-section">
    <view class="section-title">
      <van-icon name="info-o" size="20px" />
      <text>支付说明</text>
    </view>
    
    <view class="tips-card">
      <view class="tip-item">
        <view class="tip-number">1</view>
        <text class="tip-text">长按上方二维码，选择"识别图中二维码"</text>
      </view>
      
      <view class="tip-item">
        <view class="tip-number">2</view>
        <text class="tip-text">在转账页面输入金额：<text class="highlight">¥{{packageInfo.price}}</text></text>
      </view>
      
      <view class="tip-item">
        <view class="tip-number">3</view>
        <text class="tip-text">在备注中填写订单号：<text class="highlight">{{orderInfo.orderNumber}}</text></text>
      </view>
      
      <view class="tip-item">
        <view class="tip-number">4</view>
        <text class="tip-text">完成转账后，点击下方"我已支付"按钮</text>
      </view>
      
      <view class="tip-item">
        <view class="tip-number">5</view>
        <text class="tip-text">管理员确认后会立即开通会员（通常5-30分钟）</text>
      </view>
    </view>
  </view>

  <!-- 重要提示 -->
  <view class="notice-section">
    <van-notice-bar
      left-icon="volume-o"
      text="请务必在转账备注中填写订单号，否则无法自动匹配订单"
      color="#ed6a0c"
      background="#fffbe8"
    />
  </view>

  <!-- 操作按钮 -->
  <view class="action-section">
    <van-button 
      type="primary" 
      size="large" 
      block
      bind:click="handlePaid"
      loading="{{checking}}"
      custom-class="primary-btn"
    >
      我已支付
    </van-button>
    
    <van-button 
      type="default" 
      size="large" 
      block
      bind:click="checkOrderStatus"
      custom-class="secondary-btn"
    >
      查询订单状态
    </van-button>
    
    <van-button 
      type="default" 
      size="large" 
      block
      bind:click="cancelOrder"
      custom-class="cancel-btn"
    >
      取消订单
    </van-button>
  </view>
</view>
```

#### 2.3 添加样式 pages/member/payment/index.wxss

```css
/* pages/member/payment/index.wxss */
.payment-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
  padding-bottom: 40rpx;
}

/* 通用区块样式 */
.section-title {
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

/* 订单信息 */
.order-section {
  margin-bottom: 30rpx;
}

.order-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.08);
}

.order-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.order-row:last-child {
  border-bottom: none;
}

.order-row.highlight {
  background: #fff7e6;
  margin: 0 -30rpx;
  padding: 20rpx 30rpx;
  border-radius: 0 0 16rpx 16rpx;
}

.order-row .label {
  font-size: 28rpx;
  color: #666;
}

.order-row .value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.value-box {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.order-number {
  font-family: 'Courier New', monospace;
  font-size: 26rpx;
  color: #1989fa;
}

.price {
  font-size: 36rpx;
  color: #ff6b00;
  font-weight: 600;
}

.copy-btn {
  padding: 0 20rpx !important;
  height: 50rpx !important;
}

/* 收款码 */
.qrcode-section {
  margin-bottom: 30rpx;
}

.qrcode-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qrcode-image {
  width: 500rpx;
  height: 500rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  margin-bottom: 30rpx;
}

.qrcode-actions {
  width: 100%;
}

/* 支付说明 */
.tips-section {
  margin-bottom: 30rpx;
}

.tips-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.08);
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  margin-bottom: 25rpx;
}

.tip-item:last-child {
  margin-bottom: 0;
}

.tip-number {
  flex-shrink: 0;
  width: 40rpx;
  height: 40rpx;
  background: #1989fa;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 600;
}

.tip-text {
  flex: 1;
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

.tip-text .highlight {
  color: #ff6b00;
  font-weight: 600;
}

/* 提示 */
.notice-section {
  margin-bottom: 30rpx;
}

/* 操作按钮 */
.action-section {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.primary-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  height: 90rpx !important;
  font-size: 32rpx !important;
  font-weight: 600 !important;
}

.secondary-btn {
  height: 90rpx !important;
  font-size: 30rpx !important;
  border-color: #1989fa !important;
  color: #1989fa !important;
}

.cancel-btn {
  height: 80rpx !important;
  font-size: 28rpx !important;
  color: #999 !important;
}
```

---

### 第三步：修改会员工具函数

#### 3.1 修改 utils/member.js

添加订单状态查询功能：

```javascript
// utils/member.js

// ... 保留原有代码 ...

/**
 * 查询订单状态
 * @param {string} orderId - 订单ID
 * @returns {Promise<number>} 订单状态 0-待支付 1-已支付
 */
async function checkOrderStatus(orderId) {
  const token = wx.getStorageSync('token')
  
  if (!token) {
    throw new Error('请先登录')
  }

  try {
    // 如果使用 apifm
    const res = await WXAPI.orderDetail(token, orderId)
    
    if (res.code === 0) {
      return res.data.status
    }
    
    throw new Error(res.msg || '查询失败')
    
  } catch (error) {
    console.error('查询订单状态失败:', error)
    throw error
  }
}

module.exports = {
  // ... 原有导出 ...
  checkOrderStatus
}
```

---

### 第四步：创建管理后台

#### 4.1 创建订单管理页面

创建 `pages/admin/orders/index.js`：

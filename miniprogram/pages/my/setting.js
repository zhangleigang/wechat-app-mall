// 简化版设置页面 - 移除了 apifm 依赖
const CONFIG = require('../../config.js')
const SimpleAuth = require('../../utils/simpleAuth')

Page({
  data: {
    enableDebug: wx.getSystemInfoSync().enableDebug,
    version: CONFIG.version || '1.0.0'
  },

  onLoad: function (options) {
    this.setData({
      version: CONFIG.version || '1.0.0'
    })
  },

  onShow: function () {
    // 加载用户信息
    this.loadUserInfo()
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        userMobile: userInfo.phone || '',
        userInfo: userInfo
      })
    }
  },

  clearStorage() {
    wx.showModal({
      title: '确认清除',
      content: '清除缓存后需要重新登录，确定继续吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          wx.showToast({
            title: '已清除',
            icon: 'success'
          })
          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/login/simple'
            })
          }, 1000)
        }
      }
    })
  },

  setEnableDebug() {
    const enableDebug = wx.getSystemInfoSync().enableDebug
    if (enableDebug) {
      wx.setEnableDebug({
        enableDebug: false
      })
    } else {
      wx.setEnableDebug({
        enableDebug: true
      })
    }
    this.setData({
      enableDebug: !enableDebug
    })
  },

  openSetting() {
    wx.openSetting({
      withSubscriptions: true
    })
  },

  loginOut() {
    wx.showModal({
      title: '确认退出',
      content: '退出登录后需要重新登录才能使用，确定继续吗？',
      success: (res) => {
        if (res.confirm) {
          SimpleAuth.logout()
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/login/simple'
            })
          }, 1000)
        }
      }
    })
  },
})
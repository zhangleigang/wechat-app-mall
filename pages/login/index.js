const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
Page({
  data: {
    checked: false // 初始化协议勾选状态
  },
  onLoad(options) {
  },
  onShow() {

  },
  xieyiChange(e) {
    this.setData({
      checked: e.detail,
    })
  },
  goxieyi(e) {
    wx.navigateTo({
      url: '/pages/about/index?key=' + e.currentTarget.dataset.key,
    })
  },
  showModal2() {
    console.log('showModal2 被调用')
    wx.showModal({
      title: '温馨提示',
      content: '请先阅读并同意《用户协议》、《隐私协议》',
      cancelText: '不同意',
      confirmText: '同意',
      success: res => {
        console.log('用户选择:', res)
        if (res.confirm) {
          this.setData({
            checked: true
          })
          wx.showToast({
            title: '已同意协议',
            icon: 'success'
          })
        }
      }
    })
  },
  showModal(action) {
    wx.showModal({
      title: '温馨提示',
      content: '已经阅读并同意《用户协议》、《隐私协议》',
      cancelText: '不同意',
      confirmText: '同意',
      success: res => {
        if (res.confirm) {
          this.setData({
            checked: true
          })
          if (action == 'loginOne') {
            this.loginOne()
          }
        }
      }
    })
  },
  async loginOne() {
    console.log('loginOne 被调用, checked:', this.data.checked)
    if (!this.data.checked) {
      this.showModal('loginOne')
      return
    }

    // 检查是否配置了正确的域名
    const CONFIG = require('../../config.js')
    if (CONFIG.subDomain === 'your-domain' || CONFIG.subDomain === 'tz') {
      wx.showModal({
        title: '配置提示',
        content: '请先在 config.js 中配置正确的 subDomain（专属域名）。\n\n如需申请专属域名，请访问：https://www.it120.cc',
        showCancel: false,
        confirmText: '我知道了'
      })
      return
    }

    wx.showLoading({
      title: '登录中...',
    })
    try {
      const res = await AUTH.login20241025()
      wx.hideLoading()
      console.log('登录结果:', res)
      if (res.code == 10000) {
        // 用户不存在
        wx.showModal({
          content: '您还未注册，请使用《手机号安全登录》方式登录',
          showCancel: false
        })
        return
      }
      if (res.code != 0) {
        // 登录错误
        wx.showModal({
          title: '登录失败',
          content: res.msg || '登录失败，请检查网络或配置',
          showCancel: false
        })
        return
      }
      wx.reLaunch({
        url: '/pages/ai/job/index',
      })
    } catch (error) {
      wx.hideLoading()
      console.error('登录异常:', error)
      wx.showModal({
        title: '登录异常',
        content: error.message || '网络异常，请稍后重试',
        showCancel: false
      })
    }
  },
  async getPhoneNumber(e) {
    if (e.detail.errMsg.indexOf('privacy permission is not authorized') != -1) {
      wx.showModal({
        content: '请阅读并同意隐私条款以后才能继续本操作',
        confirmText: '阅读协议',
        cancelText: '取消',
        success(res) {
          if (res.confirm) {
            wx.requirePrivacyAuthorize() // 弹出用户隐私授权框
          }
        }
      })
      return
    }
    if (!e.detail.errMsg) {
      wx.showModal({
        content: 'getPhoneNumber异常',
        showCancel: false
      })
      return
    }
    if (e.detail.errMsg == "getPhoneNumber:fail user deny") {
      return
    }
    if (!e.detail.errMsg || e.detail.errMsg != "getPhoneNumber:ok") {
      wx.showModal({
        content: e.detail.errMsg,
        showCancel: false
      })
      return;
    }
    this._getPhoneNumber(e)
  },
  async _getPhoneNumber(e) {
    // 检查是否配置了正确的域名
    const CONFIG = require('../../config.js')
    if (CONFIG.subDomain === 'your-domain' || CONFIG.subDomain === 'tz') {
      wx.showModal({
        title: '配置提示',
        content: '请先在 config.js 中配置正确的 subDomain（专属域名）。\n\n如需申请专属域名，请访问：https://www.it120.cc',
        showCancel: false,
        confirmText: '我知道了'
      })
      return
    }

    let referrer = '' // 推荐人
    let referrer_storge = wx.getStorageSync('referrer');
    if (referrer_storge) {
      referrer = referrer_storge;
    }
    wx.showLoading({
      title: '登录中...',
    })
    try {
      const code = await AUTH.wxaCode()
      // https://www.yuque.com/apifm/nu0f75/yiglsl
      const res = await WXAPI.loginWxaMobileV3({
        code,
        codeMobile: e.detail.code,
        autoReg: true,
        referrer
      })
      wx.hideLoading()
      if (res.code != 0) {
        // 登录错误
        wx.showModal({
          title: '登录失败',
          content: res.msg || '登录失败，请检查网络或配置',
          showCancel: false
        })
        return
      }
      wx.setStorageSync('token', res.data.token)
      wx.setStorageSync('uid', res.data.uid)
      wx.setStorageSync('openid', res.data.openid)
      wx.setStorageSync('mobile', res.data.mobile)
      wx.reLaunch({
        url: '/pages/ai/job/index',
      })
    } catch (error) {
      wx.hideLoading()
      console.error('登录异常:', error)
      wx.showModal({
        title: '登录异常',
        content: error.message || '网络异常，请稍后重试',
        showCancel: false
      })
    }
  },
})
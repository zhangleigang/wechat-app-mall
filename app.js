const CONFIG = require('config.js')
const SimpleAuth = require('utils/simpleAuth')
App({
  onLaunch: function () {
    console.log('小程序启动')

    // 自动登录
    this.autoLogin()

    const that = this;
    // 检测新版本
    const updateManager = wx.getUpdateManager()
    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success(res) {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate()
          }
        }
      })
    })
    /**
     * 初次加载判断网络情况
     * 无网络状态下根据实际情况进行调整
     */
    wx.getNetworkType({
      success(res) {
        const networkType = res.networkType
        if (networkType === 'none') {
          that.globalData.isConnected = false
          wx.showToast({
            title: '当前无网络',
            icon: 'loading',
            duration: 2000
          })
        }
      }
    });
    /**
     * 监听网络状态变化
     * 可根据业务需求进行调整
     */
    wx.onNetworkStatusChange(function (res) {
      if (!res.isConnected) {
        that.globalData.isConnected = false
        wx.showToast({
          title: '网络已断开',
          icon: 'loading',
          duration: 2000
        })
      } else {
        that.globalData.isConnected = true
        wx.hideToast()
      }
    })
    // apifm 配置查询已移除，不再需要
    // ---------------检测navbar高度
    let menuButtonObject = wx.getMenuButtonBoundingClientRect();
    wx.getSystemInfo({
      success: res => {
        let statusBarHeight = res.statusBarHeight,
          navTop = menuButtonObject.top,//胶囊按钮与顶部的距离
          navHeight = statusBarHeight + menuButtonObject.height + (menuButtonObject.top - statusBarHeight) * 2;//导航高度
        this.globalData.navHeight = navHeight;
        this.globalData.navTop = navTop;
        this.globalData.windowHeight = res.windowHeight;
        this.globalData.menuButtonObject = menuButtonObject;
      }
    })
  },

  onShow(e) {
    // 保存邀请人（保留功能，但不再调用 apifm 接口）
    if (e && e.query && e.query.inviter_id) {
      wx.setStorageSync('referrer', e.query.inviter_id)
    }
  },

  async autoLogin() {
    try {
      const isLogined = await SimpleAuth.checkHasLogined()
      if (isLogined) {
        console.log('自动登录成功')
        if (this.loginOK) {
          this.loginOK()
        }
      } else {
        console.log('自动登录失败')
        if (this.loginFail) {
          this.loginFail()
        }
      }
    } catch (error) {
      console.error('自动登录异常:', error)
    }
  },
  globalData: {
    isConnected: true,
    version: CONFIG.version
  }
})
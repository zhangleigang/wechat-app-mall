const AUTH = require('../../utils/auth')
const TOOLS = require('../../utils/tools.js')
const CONFIG = require('../../config.js')
const MemberLocal = require('../../utils/memberLocal.js')
Page({
  data: {
    nick: undefined,
    memberExpireDate: '',
    memberInfo: null,
    memberDaysRemaining: 0,
    userInfo: null,
    pendingOrderCount: 0,  // 待核实订单数量
  },
  onLoad() {
    // 初始化
  },

  onShow() {
    AUTH.checkHasLogined().then(isLogined => {
      if (isLogined) {
        this.loadUserInfo();
        this.loadMemberInfo();
        this.loadPendingOrderCount();
      } else {
        getApp().loginOK = () => {
          this.loadUserInfo();
          this.loadMemberInfo();
          this.loadPendingOrderCount();
        }
      }
    })
  },

  // 加载待核实订单数量
  loadPendingOrderCount() {
    try {
      const orders = wx.getStorageSync('pending_orders') || []
      const pendingCount = orders.filter(o => o.status === 'pending_verify').length
      this.setData({
        pendingOrderCount: pendingCount
      })
    } catch (error) {
      console.error('加载订单数量失败:', error)
    }
  },

  // 加载用户信息
  loadUserInfo() {
    // 尝试从 userInfo 读取
    let userInfo = wx.getStorageSync('userInfo')

    // 如果没有 userInfo，从 simpleAuth 的存储中构建
    if (!userInfo) {
      const userId = wx.getStorageSync('userId')
      const nickName = wx.getStorageSync('nickName')
      const avatarUrl = wx.getStorageSync('avatarUrl')
      const phone = wx.getStorageSync('phone')

      if (userId) {
        userInfo = {
          userId: userId,
          nickName: nickName || '用户',
          avatarUrl: avatarUrl || '/images/default.png',
          phone: phone || ''
        }
      }
    }

    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        nick: userInfo.nickName || '用户'
      })
    }
  },
  async loadMemberInfo() {
    try {
      const memberInfo = await MemberLocal.getMemberInfo()
      this.setData({
        memberInfo: memberInfo,
        memberExpireDate: memberInfo.expireDate || '',
        memberDaysRemaining: memberInfo.daysRemaining || 0
      })
    } catch (error) {
      console.error('加载会员信息失败:', error)
    }
  },
  async refreshMemberInfo() {
    try {
      wx.showLoading({ title: '刷新中...' })
      const memberInfo = await MemberLocal.refreshMemberStatus()
      this.setData({
        memberInfo: memberInfo,
        memberExpireDate: memberInfo.expireDate || '',
        memberDaysRemaining: memberInfo.daysRemaining || 0
      })
      wx.hideLoading()
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      })
    } catch (error) {
      wx.hideLoading()
      console.error('刷新会员信息失败:', error)
      wx.showToast({
        title: '刷新失败',
        icon: 'none'
      })
    }
  },

  // 跳转登录页面
  login() {
    wx.navigateTo({
      url: '/pages/login/simple'
    })
  },

  // 跳转会员购买页面（先跳转到套餐选择页面）
  goMemberPayment() {
    wx.navigateTo({
      url: '/pages/member/packages/index'
    })
  },

  // 跳转会员权益页面
  goMemberBenefits() {
    wx.navigateTo({
      url: '/pages/member/benefits/index'
    })
  },

  // 跳转订单管理页面
  goOrderManage() {
    wx.navigateTo({
      url: '/pages/admin/orders/index'
    })
  },

  // 跳转设置页面
  goSettings() {
    wx.navigateTo({
      url: '/pages/my/setting'
    })
  },

  // 跳转反馈页面
  goFeedback() {
    wx.navigateTo({
      url: '/pages/my/feedback'
    })
  }
})
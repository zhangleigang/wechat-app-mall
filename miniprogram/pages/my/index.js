const SimpleAuth = require('../../utils/simpleAuth')
const CONFIG = require('../../config.js')
const MemberAPI = require('../../utils/member-api.js')

Page({
  data: {
    nick: undefined,
    memberExpireDate: '',
    memberInfo: null,
    memberDaysRemaining: 0,
    userInfo: null,
    shortId: '',
    pendingOrderCount: 0,
    isAdmin: false,
  },

  onLoad() {
    // 初始化
  },

  onShow() {
    SimpleAuth.checkHasLogined().then(isLogined => {
      if (isLogined) {
        this.loadUserInfo();
        this.loadMemberInfo();
        this.checkAdminPermission();
        this.loadPendingOrderCount();
      } else {
        getApp().loginOK = () => {
          this.loadUserInfo();
          this.loadMemberInfo();
          this.checkAdminPermission();
          this.loadPendingOrderCount();
        }
      }
    })
  },

  // 加载待核实订单数量（仅管理员）
  loadPendingOrderCount() {
    if (!this.data.isAdmin) return

    try {
      const orders = wx.getStorageSync('pending_orders') || []
      const pendingCount = orders.filter(o => o.status === 'pending_verify').length
      this.setData({ pendingOrderCount: pendingCount })
    } catch (error) {
      console.error('加载订单数量失败:', error)
    }
  },

  // 加载用户信息
  async loadUserInfo() {
    const openid = wx.getStorageSync('openid')
    if (!openid) {
      this.setData({
        userInfo: null,
        nick: '未登录',
        shortId: ''
      })
      return
    }

    const nickName = wx.getStorageSync('nickName')
    const avatarUrl = wx.getStorageSync('avatarUrl')
    const phone = wx.getStorageSync('phone')

    const defaultNickName = nickName || `用户${openid.slice(-6)}`
    const defaultAvatarUrl = avatarUrl || '/images/default.png'
    const shortId = openid.length > 8 ? openid.slice(-8) : openid

    this.setData({
      userInfo: {
        openid: openid,
        nickName: defaultNickName,
        avatarUrl: defaultAvatarUrl,
        phone: phone || ''
      },
      nick: defaultNickName,
      shortId: shortId
    })

    // 如果本地没有昵称或头像，从后端获取
    if (!nickName || !avatarUrl) {
      try {
        const token = wx.getStorageSync('token')
        if (token) {
          const userInfoFromServer = await this.fetchUserInfoFromServer(token)
          if (userInfoFromServer) {
            const serverNickName = userInfoFromServer.nick_name
            const serverAvatarUrl = userInfoFromServer.avatar_url

            if (serverNickName && serverNickName !== nickName) {
              wx.setStorageSync('nickName', serverNickName)
            }
            if (serverAvatarUrl && serverAvatarUrl !== avatarUrl) {
              wx.setStorageSync('avatarUrl', serverAvatarUrl)
            }

            if (serverNickName || serverAvatarUrl) {
              this.setData({
                userInfo: {
                  openid: openid,
                  nickName: serverNickName || defaultNickName,
                  avatarUrl: serverAvatarUrl || defaultAvatarUrl,
                  phone: phone || ''
                },
                nick: serverNickName || defaultNickName
              })
            }
          }
        }
      } catch (error) {
        console.error('从后端获取用户信息失败:', error)
      }
    }
  },

  // 从后端获取用户信息
  fetchUserInfoFromServer(token) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${CONFIG.apiBaseUrl}/auth/userinfo`,
        method: 'GET',
        header: { 'Authorization': `Bearer ${token}` },
        success: (res) => {
          if (res.data.code === 0) {
            resolve(res.data.data)
          } else {
            reject(new Error(res.data.msg || '获取失败'))
          }
        },
        fail: reject
      })
    })
  },

  // 选择头像
  async onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    const openid = wx.getStorageSync('openid')
    const token = wx.getStorageSync('token')

    if (!openid || !token) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    wx.showLoading({ title: '上传中...' })

    try {
      const uploadResult = await this.uploadAvatar(avatarUrl, token)
      if (uploadResult.success) {
        const result = await MemberAPI.updateUserProfile(openid, {
          avatarUrl: uploadResult.url
        })

        wx.hideLoading()
        if (result.success) {
          wx.setStorageSync('avatarUrl', uploadResult.url)
          this.setData({ 'userInfo.avatarUrl': uploadResult.url })
          wx.showToast({ title: '头像已更新', icon: 'success' })
        } else {
          wx.showToast({ title: '保存失败，请重试', icon: 'none' })
        }
      } else {
        wx.hideLoading()
        wx.showToast({ title: uploadResult.message || '上传失败', icon: 'none' })
      }
    } catch (error) {
      wx.hideLoading()
      wx.showToast({ title: '上传失败，请重试', icon: 'none' })
    }
  },

  // 上传头像到服务器
  uploadAvatar(tempFilePath, token) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${CONFIG.apiBaseUrl}/upload/avatar`,
        filePath: tempFilePath,
        name: 'avatar',
        header: { 'Authorization': `Bearer ${token}` },
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            if (data.code === 0) {
              let baseUrl = CONFIG.apiBaseUrl
              if (baseUrl.endsWith('/api')) {
                baseUrl = baseUrl.slice(0, -4)
              }
              const fullUrl = `${baseUrl}${data.data.url}`
              resolve({ success: true, url: fullUrl })
            } else {
              resolve({ success: false, message: data.msg || '上传失败' })
            }
          } catch (error) {
            reject(error)
          }
        },
        fail: reject
      })
    })
  },

  // 编辑昵称
  editNickname() {
    const currentNick = this.data.nick || wx.getStorageSync('nickName') || '用户'

    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入昵称',
      content: currentNick,
      confirmText: '确认',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm && res.content) {
          const newNick = res.content.trim()

          // 验证昵称长度和内容
          if (!newNick) {
            wx.showToast({ title: '昵称不能为空', icon: 'none' })
            return
          }

          if (newNick.length > 20) {
            wx.showToast({ title: '昵称不能超过20个字符', icon: 'none' })
            return
          }

          if (newNick !== currentNick) {
            this.setData({
              nick: newNick,
              'userInfo.nickName': newNick
            })
            wx.setStorageSync('nickName', newNick)

            const openid = wx.getStorageSync('openid')
            if (openid) {
              try {
                await MemberAPI.updateUserProfile(openid, { nickName: newNick })
                wx.showToast({ title: '昵称已更新', icon: 'success' })
              } catch (error) {
                console.error('同步昵称到服务器失败:', error)
                wx.showToast({ title: '同步失败，但本地已保存', icon: 'none' })
              }
            }
          }
        }
      },
      fail: (error) => {
        console.error('显示昵称编辑弹窗失败:', error)
        wx.showToast({ title: '操作失败，请重试', icon: 'none' })
      }
    })
  },

  // 查看OpenID
  viewOpenId() {
    const openid = wx.getStorageSync('openid')
    if (openid) {
      wx.showModal({
        title: '用户标识信息',
        content: `OpenID: ${openid}\n\n点击"复制"按钮可复制到剪贴板`,
        confirmText: '复制',
        cancelText: '关闭',
        success: (res) => {
          if (res.confirm) {
            wx.setClipboardData({
              data: openid,
              success: () => wx.showToast({ title: '已复制OpenID', icon: 'success' }),
              fail: () => wx.showToast({ title: '复制失败', icon: 'none' })
            })
          }
        }
      })
    } else {
      wx.showModal({
        title: '提示',
        content: '还没有获取到OpenID，请先登录',
        showCancel: false
      })
    }
  },

  // 加载会员信息
  async loadMemberInfo() {
    try {
      const memberInfo = await MemberAPI.checkMemberStatus()
      this.setData({
        memberInfo: memberInfo,
        memberExpireDate: memberInfo.expireDate || '',
        memberDaysRemaining: memberInfo.daysRemaining || 0
      })
    } catch (error) {
      console.error('加载会员信息失败:', error)
    }
  },

  // 刷新会员信息
  async refreshMemberInfo() {
    try {
      wx.showLoading({ title: '刷新中...' })
      const memberInfo = await MemberAPI.refreshMemberStatus()
      this.setData({
        memberInfo: memberInfo,
        memberExpireDate: memberInfo.expireDate || '',
        memberDaysRemaining: memberInfo.daysRemaining || 0
      })
      wx.hideLoading()
      wx.showToast({ title: '刷新成功', icon: 'success' })
    } catch (error) {
      wx.hideLoading()
      wx.showToast({ title: '刷新失败', icon: 'none' })
    }
  },

  // 跳转登录页面
  login() {
    wx.navigateTo({ url: '/pages/login/simple' })
  },

  // 联系微信体验
  goMemberPayment() {
    wx.showModal({
      title: '解锁全部功能',
      content: '联系我的微信，开始体验完整功能\n\n微信号：csuzhangleigang',
      confirmText: '复制',
      cancelText: '知道了',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: 'csuzhangleigang',
            success: () => wx.showToast({ title: '微信号已复制', icon: 'success' }),
            fail: () => wx.showToast({ title: '复制失败，请重试', icon: 'none' })
          })
        }
      },
      fail: () => {
        wx.setClipboardData({
          data: 'csuzhangleigang',
          success: () => wx.showToast({ title: '微信号已复制：csuzhangleigang', icon: 'success', duration: 3000 })
        })
      }
    })
  },

  // 管理员功能导航
  goOrderManage() {
    wx.navigateTo({ url: '/pages/admin/orders/index' })
  },

  goFeedbackManage() {
    wx.navigateTo({ url: '/pages/admin/feedback/index' })
  },

  goUserManage() {
    wx.navigateTo({ url: '/pages/admin/users/index' })
  },

  // 普通功能导航
  goSettings() {
    wx.navigateTo({ url: '/pages/my/setting' })
  },

  goFeedback() {
    wx.navigateTo({ url: '/pages/my/feedback' })
  },

  // 头像加载错误处理
  onAvatarError() {
    this.setData({ 'userInfo.avatarUrl': '/images/default.png' })
    const currentAvatarUrl = wx.getStorageSync('avatarUrl')
    if (currentAvatarUrl && currentAvatarUrl !== '/images/default.png') {
      wx.removeStorageSync('avatarUrl')
    }
  },

  // 检查管理员权限
  checkAdminPermission() {
    const openid = wx.getStorageSync('openid')
    const adminOpenIds = ['onddF1_xp4H5FBBuT2NmNb4m_KbI']
    const isAdmin = adminOpenIds.includes(openid)

    this.setData({ isAdmin: isAdmin })

    if (isAdmin) {
      this.loadPendingOrderCount()
    }
  }
})
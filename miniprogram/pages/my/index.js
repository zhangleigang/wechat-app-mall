const SimpleAuth = require('../../utils/simpleAuth')
const TOOLS = require('../../utils/tools.js')
const CONFIG = require('../../config.js')
const MemberAPI = require('../../utils/member-api.js')
Page({
  data: {
    nick: undefined,
    memberExpireDate: '',
    memberInfo: null,
    memberDaysRemaining: 0,
    userInfo: null,
    shortId: '',  // 用于显示的短ID（openid后8位）
    pendingOrderCount: 0,  // 待核实订单数量
  },
  onLoad() {
    // 初始化
  },

  onShow() {
    SimpleAuth.checkHasLogined().then(isLogined => {
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
  async loadUserInfo() {
    const openid = wx.getStorageSync('openid')
    let nickName = wx.getStorageSync('nickName')
    let avatarUrl = wx.getStorageSync('avatarUrl')
    const phone = wx.getStorageSync('phone')

    console.log('本地存储的用户信息:', { openid, nickName, avatarUrl })

    if (openid) {
      // 如果本地没有昵称或头像，尝试从后端获取
      if (!nickName || !avatarUrl) {
        console.log('本地缺少用户信息，从后端获取...')
        try {
          const token = wx.getStorageSync('token')
          const userInfoFromServer = await this.fetchUserInfoFromServer(token)

          if (userInfoFromServer) {
            nickName = userInfoFromServer.nick_name || nickName
            avatarUrl = userInfoFromServer.avatar_url || avatarUrl

            // 保存到本地
            if (nickName) wx.setStorageSync('nickName', nickName)
            if (avatarUrl) wx.setStorageSync('avatarUrl', avatarUrl)

            console.log('从后端获取的用户信息:', { nickName, avatarUrl })
          }
        } catch (error) {
          console.error('从后端获取用户信息失败:', error)
        }
      }

      const userInfo = {
        openid: openid,
        nickName: nickName || '用户',
        avatarUrl: avatarUrl || '/images/default.png',
        phone: phone || ''
      }

      // 提取 openid 后8位用于显示
      const shortId = openid.length > 8 ? openid.slice(-8) : openid

      this.setData({
        userInfo: userInfo,
        nick: userInfo.nickName || '用户',
        shortId: shortId
      }, () => {
        console.log('setData 完成，当前 userInfo:', this.data.userInfo)
      })
    } else {
      console.warn('未找到 openid，用户可能未登录')
      this.setData({
        userInfo: null,
        nick: '未登录'
      })
    }
  },

  // 从后端获取用户信息
  fetchUserInfoFromServer(token) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${CONFIG.apiBaseUrl}/auth/userinfo`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
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
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '上传中...' })

    try {
      // 上传到服务器
      const uploadResult = await this.uploadAvatar(avatarUrl, token)

      if (uploadResult.success) {
        const serverAvatarUrl = uploadResult.url

        console.log('准备保存的头像URL:', serverAvatarUrl)

        // 保存到本地
        wx.setStorageSync('avatarUrl', serverAvatarUrl)

        // 同步到数据库
        const result = await MemberAPI.updateUserProfile(openid, {
          avatarUrl: serverAvatarUrl
        })

        console.log('更新数据库结果:', result)

        wx.hideLoading()

        if (result.success) {
          // 更新显示
          this.loadUserInfo()

          wx.showToast({
            title: '头像已更新',
            icon: 'success'
          })
        } else {
          wx.showToast({
            title: '保存失败，请重试',
            icon: 'none'
          })
        }
      } else {
        wx.hideLoading()
        wx.showToast({
          title: uploadResult.message || '上传失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('上传头像失败:', error)
      wx.showToast({
        title: '上传失败，请重试',
        icon: 'none'
      })
    }
  },

  // 上传头像到服务器
  uploadAvatar(tempFilePath, token) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${CONFIG.apiBaseUrl}/upload/avatar`,
        filePath: tempFilePath,
        name: 'avatar',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            if (data.code === 0) {
              // 构建完整URL
              // CONFIG.apiBaseUrl = 'https://api.feelnow.cn:8443/api'
              // data.data.url = '/static/avatars/avatar_xxx.jpg'
              // 结果: 'https://api.feelnow.cn:8443/static/avatars/avatar_xxx.jpg'

              // 正确的方式：只替换末尾的 /api
              let baseUrl = CONFIG.apiBaseUrl
              if (baseUrl.endsWith('/api')) {
                baseUrl = baseUrl.slice(0, -4)  // 去掉末尾的 '/api'
              }
              const fullUrl = `${baseUrl}${data.data.url}`

              console.log('上传成功，URL:', fullUrl)

              resolve({
                success: true,
                url: fullUrl
              })
            } else {
              resolve({
                success: false,
                message: data.msg || '上传失败'
              })
            }
          } catch (error) {
            console.error('解析上传响应失败:', error)
            reject(error)
          }
        },
        fail: (error) => {
          console.error('上传请求失败:', error)
          reject(error)
        }
      })
    })
  },

  // 编辑昵称
  editNickname() {
    const currentNick = wx.getStorageSync('nickName') || '用户'

    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入昵称',
      content: currentNick,
      success: async (res) => {
        if (res.confirm && res.content) {
          const newNick = res.content.trim()

          if (newNick) {
            // 保存昵称到本地
            wx.setStorageSync('nickName', newNick)

            // 更新显示
            this.loadUserInfo()

            // 同步到数据库
            const openid = wx.getStorageSync('openid')
            if (openid) {
              wx.showLoading({ title: '保存中...' })

              const result = await MemberAPI.updateUserProfile(openid, {
                nickName: newNick
              })

              wx.hideLoading()

              if (result.success) {
                wx.showToast({
                  title: '昵称已更新',
                  icon: 'success'
                })
              } else {
                wx.showToast({
                  title: '同步失败，请重试',
                  icon: 'none'
                })
              }
            } else {
              wx.showToast({
                title: '昵称已更新',
                icon: 'success'
              })
            }
          }
        }
      }
    })
  },

  // 查看OpenID
  viewOpenId() {
    const openid = wx.getStorageSync('openid')

    if (openid) {
      wx.showModal({
        title: '用户标识信息',
        content: `OpenID: ${openid}\n\n长按可复制`,
        confirmText: '复制OpenID',
        success: (res) => {
          if (res.confirm) {
            wx.setClipboardData({
              data: openid,
              success: () => {
                wx.showToast({
                  title: '已复制OpenID',
                  icon: 'success'
                })
              }
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
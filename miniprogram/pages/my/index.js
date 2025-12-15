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
    isAdmin: false,  // 是否为管理员
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

        // 延迟检查数据完整性
        setTimeout(() => {
          this.validateAndRestoreUserData();
        }, 1000);
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
    // 只有管理员才需要加载订单数量
    if (!this.data.isAdmin) {
      return
    }

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

    if (!openid) {
      console.warn('未找到 openid，用户可能未登录')
      this.setData({
        userInfo: null,
        nick: '未登录',
        shortId: ''
      })
      return
    }

    // 先从本地存储获取基本信息
    let nickName = wx.getStorageSync('nickName')
    let avatarUrl = wx.getStorageSync('avatarUrl')
    const phone = wx.getStorageSync('phone')

    console.log('本地存储的用户信息:', { openid, nickName, avatarUrl })

    // 设置默认值，确保界面不会空白
    const defaultNickName = nickName || `用户${openid.slice(-6)}`
    const defaultAvatarUrl = avatarUrl || '/images/default.png'

    // 先用本地数据更新界面，避免空白
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

    // 如果本地没有昵称或头像，异步从后端获取
    if (!nickName || !avatarUrl) {
      console.log('本地缺少用户信息，从后端获取...')
      try {
        const token = wx.getStorageSync('token')
        if (token) {
          const userInfoFromServer = await this.fetchUserInfoFromServer(token)

          if (userInfoFromServer) {
            const serverNickName = userInfoFromServer.nick_name
            const serverAvatarUrl = userInfoFromServer.avatar_url

            // 只有服务器返回的数据不为空时才更新
            if (serverNickName && serverNickName !== nickName) {
              nickName = serverNickName
              wx.setStorageSync('nickName', nickName)
            }

            if (serverAvatarUrl && serverAvatarUrl !== avatarUrl) {
              avatarUrl = serverAvatarUrl
              wx.setStorageSync('avatarUrl', avatarUrl)
            }

            // 如果从服务器获取到了新数据，更新界面
            if (serverNickName || serverAvatarUrl) {
              console.log('从后端获取的用户信息:', { nickName, avatarUrl })

              this.setData({
                userInfo: {
                  openid: openid,
                  nickName: nickName || defaultNickName,
                  avatarUrl: avatarUrl || defaultAvatarUrl,
                  phone: phone || ''
                },
                nick: nickName || defaultNickName
              })
            }
          }
        }
      } catch (error) {
        console.error('从后端获取用户信息失败:', error)
        // 网络失败时不影响已显示的默认数据
      }
    }

    console.log('最终用户信息:', this.data.userInfo)
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

    // 保存当前头像，以便失败时恢复
    const currentAvatarUrl = this.data.userInfo?.avatarUrl

    wx.showLoading({ title: '上传中...' })

    try {
      // 上传到服务器
      const uploadResult = await this.uploadAvatar(avatarUrl, token)

      if (uploadResult.success) {
        const serverAvatarUrl = uploadResult.url

        console.log('准备保存的头像URL:', serverAvatarUrl)

        // 同步到数据库
        const result = await MemberAPI.updateUserProfile(openid, {
          avatarUrl: serverAvatarUrl
        })

        console.log('更新数据库结果:', result)

        wx.hideLoading()

        if (result.success) {
          // 保存到本地
          wx.setStorageSync('avatarUrl', serverAvatarUrl)

          // 更新界面显示
          this.setData({
            'userInfo.avatarUrl': serverAvatarUrl
          })

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

      // 确保界面显示不会变空白
      if (currentAvatarUrl && !this.data.userInfo?.avatarUrl) {
        this.setData({
          'userInfo.avatarUrl': currentAvatarUrl
        })
      }
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
    const currentNick = this.data.nick || wx.getStorageSync('nickName') || '用户'

    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入昵称',
      content: currentNick,
      confirmText: '确认',
      success: async (res) => {
        if (res.confirm && res.content) {
          const newNick = res.content.trim()

          if (newNick && newNick !== currentNick) {
            // 先更新界面显示，提供即时反馈
            this.setData({
              nick: newNick,
              'userInfo.nickName': newNick
            })

            // 保存昵称到本地
            wx.setStorageSync('nickName', newNick)

            // 同步到数据库
            const openid = wx.getStorageSync('openid')
            if (openid) {
              wx.showLoading({ title: '保存中...' })

              try {
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
                    title: '同步失败，但本地已保存',
                    icon: 'none'
                  })
                }
              } catch (error) {
                wx.hideLoading()
                console.error('同步昵称失败:', error)
                wx.showToast({
                  title: '同步失败，但本地已保存',
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
    console.log('viewOpenId 函数被调用')

    const openid = wx.getStorageSync('openid')
    console.log('获取到的 openid:', openid)

    if (openid) {
      console.log('准备显示 Modal')
      wx.showModal({
        title: '用户标识信息',
        content: `OpenID: ${openid}\n\n点击"复制"按钮可复制到剪贴板`,
        confirmText: '复制',
        cancelText: '关闭',
        success: (res) => {
          console.log('Modal 回调:', res)
          if (res.confirm) {
            console.log('用户点击了复制')
            wx.setClipboardData({
              data: openid,
              success: () => {
                console.log('复制成功')
                wx.showToast({
                  title: '已复制OpenID',
                  icon: 'success'
                })
              },
              fail: (err) => {
                console.error('复制失败:', err)
                wx.showToast({
                  title: '复制失败',
                  icon: 'none'
                })
              }
            })
          }
        },
        fail: (err) => {
          console.error('Modal 显示失败:', err)
        }
      })
    } else {
      console.log('没有 openid，显示登录提示')
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
  },

  // 跳转反馈管理页面（管理员）
  goFeedbackManage() {
    wx.navigateTo({
      url: '/pages/admin/feedback/index'
    })
  },

  // 头像加载错误处理
  onAvatarError(e) {
    console.error('头像加载失败:', e.detail)

    // 设置默认头像
    this.setData({
      'userInfo.avatarUrl': '/images/default.png'
    })

    // 清除本地存储中可能损坏的头像URL
    const currentAvatarUrl = wx.getStorageSync('avatarUrl')
    if (currentAvatarUrl && currentAvatarUrl !== '/images/default.png') {
      console.log('清除损坏的头像URL:', currentAvatarUrl)
      wx.removeStorageSync('avatarUrl')
    }
  },

  // 数据完整性检查和恢复
  validateAndRestoreUserData() {
    const openid = wx.getStorageSync('openid')
    if (!openid) return

    // 检查并修复用户信息
    if (!this.data.userInfo || !this.data.nick) {
      console.log('检测到用户数据丢失，尝试恢复...')
      this.loadUserInfo()
    }

    // 检查头像URL是否有效
    const avatarUrl = this.data.userInfo?.avatarUrl
    if (avatarUrl && avatarUrl !== '/images/default.png') {
      // 可以添加头像URL有效性检查
    }
  },

  // 检查管理员权限
  checkAdminPermission() {
    const openid = wx.getStorageSync('openid')

    // 管理员 OpenID 列表
    const adminOpenIds = [
      'oAHR-1w1Qrz-cL2OiN_hjnqQlXNQ'  // 管理员 openid
    ]

    const isAdmin = adminOpenIds.includes(openid)

    this.setData({
      isAdmin: isAdmin
    })

    console.log('个人中心权限检查:', { openid, isAdmin, adminOpenIds })

    // 如果是管理员，加载待核实订单数量
    if (isAdmin) {
      this.loadPendingOrderCount()
    }
  }
})
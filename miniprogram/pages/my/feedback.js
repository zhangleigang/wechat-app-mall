// 意见反馈页面 - 多渠道反馈方案
const dayjs = require("dayjs")
const CONFIG = require('../../config.js')

Page({
  data: {
    autosize: {
      minHeight: 100
    },
    day: dayjs().format('YYYY-MM-DD'),
    feedbackCount: 0,
    maxFeedbackPerDay: 5,

    // 联系方式配置（请替换为实际联系方式）
    contactInfo: {
      wechat: 'csuzhangleigang',  // 请替换为你的微信号
      email: '110843630@qq.com'  // 请替换为你的邮箱
    },

    // 反馈方式
    feedbackMethods: [
      { id: 'form', name: '表单反馈', desc: '填写表单，我们会及时处理', icon: '📝' },
      { id: 'wechat', name: '微信联系', desc: '添加微信，直接沟通', icon: '💬' },
      { id: 'email', name: '邮件反馈', desc: '发送邮件，详细描述问题', icon: '📧' }
    ],

    selectedMethod: 'form'
  },

  onLoad: function (options) {

  },
  onShow: function () {
    this.checkTodayFeedbackCount()
  },

  // 检查今日反馈次数（本地存储）
  checkTodayFeedbackCount() {
    const key = 'feedback_count_' + this.data.day
    const count = wx.getStorageSync(key) || 0
    this.setData({
      feedbackCount: count
    })
  },

  // 选择反馈方式
  selectFeedbackMethod(e) {
    const method = e.currentTarget.dataset.method
    this.setData({
      selectedMethod: method
    })
  },

  // 微信联系
  contactWechat() {
    const wechat = this.data.contactInfo.wechat
    console.log('=== 微信联系功能调试 ===')
    console.log('微信号:', wechat)
    console.log('微信号类型:', typeof wechat)
    console.log('微信号长度:', wechat ? wechat.length : 'undefined')

    if (!wechat || wechat === 'your_wechat_id') {
      wx.showToast({
        title: '微信号未配置',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '微信联系',
      content: `微信号：${wechat}\n\n请复制微信号后，在微信中搜索添加好友`,
      confirmText: '复制',
      cancelText: '取消',
      success: (res) => {
        console.log('Modal 成功回调:', res)
        if (res.confirm) {
          console.log('用户点击了复制，准备复制微信号:', wechat)

          // 尝试复制
          wx.setClipboardData({
            data: String(wechat), // 确保是字符串
            success: () => {
              console.log('微信号复制成功!')
              wx.showToast({
                title: '微信号已复制',
                icon: 'success'
              })
            },
            fail: (err) => {
              console.error('微信号复制失败:', err)
              wx.showToast({
                title: '复制失败: ' + (err.errMsg || '未知错误'),
                icon: 'none'
              })
            }
          })
        } else {
          console.log('用户取消了复制')
        }
      },
      fail: (err) => {
        console.error('Modal 显示失败:', err)
        wx.showToast({
          title: 'Modal显示失败',
          icon: 'none'
        })
      }
    })
  },

  // 邮件反馈
  contactEmail() {
    const email = this.data.contactInfo.email
    console.log('准备复制邮箱:', email)

    wx.showModal({
      title: '邮件反馈',
      content: `邮箱：${email}\n\n请复制邮箱地址，在邮件应用中发送反馈`,
      confirmText: '复制',
      success: (res) => {
        console.log('邮箱 Modal 回调:', res)
        if (res.confirm) {
          console.log('开始复制邮箱:', email)
          wx.setClipboardData({
            data: email,
            success: () => {
              console.log('邮箱复制成功')
              wx.showToast({
                title: '邮箱已复制',
                icon: 'success'
              })
            },
            fail: (err) => {
              console.error('邮箱复制失败:', err)
              wx.showToast({
                title: '复制失败',
                icon: 'none'
              })
            }
          })
        }
      },
      fail: (err) => {
        console.error('邮箱 Modal 显示失败:', err)
      }
    })
  },

  // 提交表单反馈
  async bindSave() {
    if (!this.data.content) {
      wx.showToast({
        title: '请填写反馈信息',
        icon: 'none',
      })
      return
    }

    // 检查今日反馈次数
    if (this.data.feedbackCount >= this.data.maxFeedbackPerDay) {
      wx.showToast({
        title: '今日反馈次数已达上限',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '提交中...' })

    try {
      // 提交到后端
      const result = await this.submitFeedbackToServer()

      if (result.success) {
        // 更新今日反馈次数
        const key = 'feedback_count_' + this.data.day
        wx.setStorageSync(key, this.data.feedbackCount + 1)

        wx.hideLoading()
        wx.showModal({
          title: '提交成功',
          content: '感谢您的反馈！我们会认真处理您的建议。\n\n如需紧急联系，可选择微信或邮件方式。',
          confirmText: '知道了',
          showCancel: false,
          success: () => {
            wx.navigateBack()
          }
        })
      } else {
        throw new Error(result.message || '提交失败')
      }
    } catch (error) {
      wx.hideLoading()
      console.error('提交反馈失败:', error)

      // 提交失败时，保存到本地作为备份
      this.saveFeedbackLocally()

      wx.showModal({
        title: '提交失败',
        content: '网络异常，反馈已保存到本地。\n\n建议您使用微信或邮件方式联系我们。',
        confirmText: '微信联系',
        cancelText: '知道了',
        success: (res) => {
          if (res.confirm) {
            this.contactWechat()
          }
        }
      })
    }
  },

  // 提交反馈到服务器
  submitFeedbackToServer() {
    return new Promise((resolve, reject) => {
      const openid = wx.getStorageSync('openid')
      const token = wx.getStorageSync('token')

      wx.request({
        url: `${CONFIG.apiBaseUrl}/feedback/submit`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: {
          openid: openid,
          name: this.data.name || '匿名',
          mobile: this.data.mobile || '',
          wechat: this.data.wx || '',
          content: this.data.content,
          type: 'feedback',
          source: 'miniprogram'
        },
        success: (res) => {
          if (res.data.code === 0) {
            resolve({ success: true })
          } else {
            resolve({ success: false, message: res.data.msg })
          }
        },
        fail: reject
      })
    })
  },

  // 保存到本地（备份方案）
  saveFeedbackLocally() {
    const feedback = {
      name: this.data.name || '匿名',
      mobile: this.data.mobile || '',
      wx: this.data.wx || '',
      content: this.data.content,
      date: new Date().toISOString(),
      day: this.data.day,
      status: 'local_backup'
    }

    let feedbackList = wx.getStorageSync('feedback_list') || []
    feedbackList.unshift(feedback)

    if (feedbackList.length > 50) {
      feedbackList = feedbackList.slice(0, 50)
    }

    wx.setStorageSync('feedback_list', feedbackList)
  },

  afterPicRead(e) {
    wx.showToast({
      title: '图片上传功能暂不可用',
      icon: 'none'
    })
  },

  afterPicDel(e) {
    let picsList = this.data.picsList
    if (picsList) {
      picsList.splice(e.detail.index, 1)
      this.setData({
        picsList
      })
    }
  }
})
// 简化版反馈页面 - 移除了 apifm 依赖
// 反馈信息将保存在本地，供用户查看
const dayjs = require("dayjs")

Page({
  data: {
    autosize: {
      minHeight: 100
    },
    day: dayjs().format('YYYY-MM-DD'),
    feedbackCount: 0,
    maxFeedbackPerDay: 5
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

    // 保存反馈到本地
    const feedback = {
      name: this.data.name || '匿名',
      mobile: this.data.mobile || '',
      wx: this.data.wx || '',
      content: this.data.content,
      date: new Date().toISOString(),
      day: this.data.day
    }

    // 获取历史反馈
    let feedbackList = wx.getStorageSync('feedback_list') || []
    feedbackList.unshift(feedback)

    // 只保留最近50条
    if (feedbackList.length > 50) {
      feedbackList = feedbackList.slice(0, 50)
    }

    wx.setStorageSync('feedback_list', feedbackList)

    // 更新今日反馈次数
    const key = 'feedback_count_' + this.data.day
    wx.setStorageSync(key, this.data.feedbackCount + 1)

    wx.showToast({
      title: '反馈已保存',
      icon: 'success'
    })

    setTimeout(() => {
      wx.navigateBack({
        delta: 1,
      })
    }, 1000)
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
const AI = require('../../../utils/ai.js')
const AUTH = require('../../../utils/auth.js')
const SimpleAuth = require('../../../utils/simpleAuth.js')

Page({
  data: {
    sessionId: '',
    inputVal: '',
    messages: [],
    sending: false,
    scrollTop: 0,
    // 快捷问题
    quickQuestions: [
      '分析这个大数据工程师岗位的技能要求',
      '这个数据分析师职位需要什么经验？',
      '帮我分析Spark开发工程师的面试重点',
      '数据仓库工程师岗位的核心能力是什么？'
    ]
  },
  onLoad() {
    this.setData({ sessionId: Date.now() + '' })
    wx.setNavigationBarTitle({ title: '岗位分析' })
    // 加载历史对话
    this.loadConversation()
  },

  /**
   * 处理输入
   */
  handleInput(e) {
    this.setData({ inputVal: e.detail.value })
  },

  /**
   * 选择快捷问题
   */
  selectQuickQuestion(e) {
    const question = e.currentTarget.dataset.question
    this.setData({ inputVal: question })
    // 自动发送
    setTimeout(() => {
      this.send()
    }, 100)
  },
  /**
   * 发送消息
   */
  async send() {
    const text = (this.data.inputVal || '').trim()
    if (!text || this.data.sending) return

    // 检查登录状态（使用简化认证）
    const isLogined = await SimpleAuth.checkHasLogined()
    if (!isLogined) {
      wx.showModal({
        title: '需要登录',
        content: '请先登录后使用此功能',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/simple' })
          }
        }
      })
      return
    }

    // 添加触觉反馈
    wx.vibrateShort({ type: 'light' })

    // 添加用户消息
    const userMessage = {
      role: 'user',
      content: text,
      time: this.formatTime(new Date()),
      timestamp: Date.now()
    }

    this.setData({
      messages: [...this.data.messages, userMessage],
      inputVal: '',
      sending: true
    })

    // 滚动到底部
    this.scrollToBottom()

    try {
      // 调用AI接口
      const res = await AI.chat({
        scene: 'job',
        sessionId: this.data.sessionId,
        messages: [...this.data.messages, userMessage]
      })

      // 添加AI回复
      const aiMessage = {
        role: 'assistant',
        content: res.answer || '（暂无回复）',
        time: this.formatTime(new Date()),
        timestamp: Date.now()
      }

      this.setData({
        messages: [...this.data.messages, aiMessage],
        sending: false
      })

      // 滚动到底部
      this.scrollToBottom()

      // 保存对话历史
      this.saveConversation()

    } catch (err) {
      console.error('发送消息失败:', err)
      wx.showToast({
        title: err.message || 'AI服务异常',
        icon: 'none'
      })
      this.setData({ sending: false })
    }
  },
  /**
   * 复制消息
   */
  copyMessage(e) {
    const content = e.currentTarget.dataset.content
    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        })
      }
    })
  },

  /**
   * 点赞消息
   */
  likeMessage(e) {
    const index = e.currentTarget.dataset.index
    wx.showToast({
      title: '感谢您的反馈',
      icon: 'success'
    })
    // 这里可以添加点赞统计逻辑
  },

  /**
   * 清空对话
   */
  clearChat() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有对话记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ messages: [] })
          wx.removeStorageSync('job_conversation')
          wx.showToast({
            title: '已清空对话',
            icon: 'success'
          })
        }
      }
    })
  },

  /**
   * 导出对话
   */
  exportChat() {
    if (this.data.messages.length === 0) {
      wx.showToast({
        title: '暂无对话记录',
        icon: 'none'
      })
      return
    }

    let exportText = '岗位分析对话记录\n\n'
    this.data.messages.forEach((msg, index) => {
      const role = msg.role === 'user' ? '我' : 'AI助手'
      exportText += `${role} (${msg.time}):\n${msg.content}\n\n`
    })

    wx.setClipboardData({
      data: exportText,
      success: () => {
        wx.showToast({
          title: '对话记录已复制',
          icon: 'success'
        })
      }
    })
  },

  /**
   * 格式化时间
   */
  formatTime(date) {
    const now = new Date()
    const diff = now - date

    if (diff < 60000) { // 1分钟内
      return '刚刚'
    } else if (diff < 3600000) { // 1小时内
      return `${Math.floor(diff / 60000)}分钟前`
    } else if (date.toDateString() === now.toDateString()) { // 今天
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  },

  /**
   * 保存对话历史
   */
  saveConversation() {
    try {
      wx.setStorageSync('job_conversation', {
        messages: this.data.messages,
        updateTime: Date.now()
      })
    } catch (error) {
      console.error('保存对话失败:', error)
      // 静默失败，不影响用户体验
    }
  },

  /**
   * 加载对话历史
   */
  loadConversation() {
    try {
      const conversation = wx.getStorageSync('job_conversation')
      if (conversation && conversation.messages) {
        // 只加载24小时内的对话
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000
        if (conversation.updateTime > dayAgo) {
          this.setData({ messages: conversation.messages })
          this.scrollToBottom()
        }
      }
    } catch (error) {
      console.error('加载对话失败:', error)
    }
  },

  /**
   * 滚动到底部
   */
  scrollToBottom() {
    setTimeout(() => {
      wx.createSelectorQuery()
        .select('.messages-wrapper')
        .boundingClientRect((rect) => {
          if (rect) {
            this.setData({
              scrollTop: rect.height
            })
          }
        })
        .exec()
    }, 100)
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    return {
      title: '岗位分析 - AI智能分析岗位需求',
      path: '/pages/ai/job/index',
      imageUrl: ''
    }
  }
})
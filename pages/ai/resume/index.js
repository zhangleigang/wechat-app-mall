const AI = require('../../../utils/ai.js')
const AUTH = require('../../../utils/auth.js')

Page({
  data: {
    sessionId: '',
    inputVal: '',
    resumeText: '',
    resumeStatus: {
      uploaded: false,
      fileName: '',
      uploadTime: ''
    },
    messages: [],
    sending: false,
    scrollTop: 0,
    // 快捷分析选项
    quickAnalysis: [
      '分析简历亮点和优势',
      '找出简历中的问题',
      '针对数据分析岗位优化建议',
      '生成面试问答清单'
    ]
  },
  onLoad() {
    this.setData({ sessionId: Date.now() + '' })
    wx.setNavigationBarTitle({ title: '简历解读' })
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
   * 上传简历
   */
  async uploadResume() {
    const that = this

    // 添加触觉反馈
    wx.vibrateShort({ type: 'light' })

    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: async (res) => {
        const file = res.tempFiles[0]

        // 文件格式验证
        const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.png', '.jpeg']
        const fileName = file.name || file.path
        const fileExt = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()

        if (!allowedTypes.includes(fileExt)) {
          wx.showToast({
            title: '不支持的文件格式',
            icon: 'none'
          })
          return
        }

        wx.showLoading({ title: '正在上传解析...' })

        try {
          const parsed = await AI.uploadResume(file.path)
          wx.hideLoading()

          const txt = parsed.resumeText || ''
          that.setData({ resumeText: txt })

          if (txt) {
            // 更新简历状态
            const now = new Date()
            that.setData({
              resumeStatus: {
                uploaded: true,
                fileName: file.name || '简历文件',
                uploadTime: that.formatTime(now)
              }
            })

            // 添加系统提示
            const sysPrompt = {
              role: 'system',
              content: '候选人简历内容如下：\n' + txt,
              time: that.formatTime(now),
              timestamp: Date.now()
            }
            that.setData({ messages: [sysPrompt] })

            // 保存到本地
            that.saveConversation()

            wx.showToast({ title: '解析成功', icon: 'success' })
          } else {
            wx.showToast({ title: '未解析到文本', icon: 'none' })
          }
        } catch (e) {
          wx.hideLoading()
          console.error('上传失败:', e)

          wx.showModal({
            title: '上传失败',
            content: '请检查文件格式或网络连接',
            confirmText: '重试',
            success: (res) => {
              if (res.confirm) {
                that.uploadResume()
              }
            }
          })
        }
      },
      fail: (err) => {
        console.error('选择文件失败:', err)
      }
    })
  },

  /**
   * 选择快捷分析
   */
  selectAnalysis(e) {
    const question = e.currentTarget.dataset.question

    // 添加触觉反馈
    wx.vibrateShort({ type: 'light' })

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

    // 检查登录状态
    if (!AUTH.checkHasLogined()) {
      wx.navigateTo({ url: '/pages/login/index' })
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
        scene: 'resume',
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
          wx.removeStorageSync('resume_conversation')
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

    let exportText = '简历解读对话记录\n\n'
    if (this.data.resumeStatus.uploaded) {
      exportText += `简历文件: ${this.data.resumeStatus.fileName}\n`
      exportText += `上传时间: ${this.data.resumeStatus.uploadTime}\n\n`
    }

    this.data.messages.forEach((msg, index) => {
      if (msg.role === 'system') return // 跳过系统消息
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
      wx.setStorageSync('resume_conversation', {
        messages: this.data.messages,
        resumeStatus: this.data.resumeStatus,
        resumeText: this.data.resumeText,
        updateTime: Date.now()
      })
    } catch (error) {
      console.error('保存对话失败:', error)
    }
  },

  /**
   * 加载对话历史
   */
  loadConversation() {
    try {
      const conversation = wx.getStorageSync('resume_conversation')
      if (conversation && conversation.messages) {
        // 只加载24小时内的对话
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000
        if (conversation.updateTime > dayAgo) {
          this.setData({
            messages: conversation.messages,
            resumeStatus: conversation.resumeStatus || this.data.resumeStatus,
            resumeText: conversation.resumeText || ''
          })
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
      title: '简历解读 - AI智能分析简历',
      path: '/pages/ai/resume/index',
      imageUrl: ''
    }
  }
})
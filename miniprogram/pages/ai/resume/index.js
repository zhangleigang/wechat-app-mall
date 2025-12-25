const AI = require('../../../utils/ai.js')
const SimpleAuth = require('../../../utils/simpleAuth.js')
const MemberAPI = require('../../../utils/member-api.js')
const ResumeAPI = require('../../../utils/resume-api.js')
const favoritesApi = require('../../../utils/favorites-api.js')
const towxml = require('../../../components/towxml-dist/index.js')

Page({
  data: {
    sessionId: '',
    inputVal: '',
    // 简历列表管理
    resumeList: [],           // 简历列表
    activeResumeId: null,     // 当前选中的简历ID
    activeResumeText: '',     // 当前简历的文本内容
    // 对话管理
    messages: [],
    sending: false,
    scrollTop: 0,
    // 预设问题（更新为新的三个问题）
    presetQuestions: [
      '整个简历最大的亮点是什么？',
      '简历还有哪些可以优化的？',
      '用STAR原则解读这份简历'
    ]
  },
  async onLoad(options) {
    this.setData({ sessionId: Date.now() + '' })
    wx.setNavigationBarTitle({ title: '简历解读' })

    // 加载简历列表
    await this.loadResumeList()

    // 加载历史对话
    this.loadConversation()
  },

  /**
   * 加载简历列表
   */
  async loadResumeList() {
    try {
      // 检查登录状态
      const isLogined = await SimpleAuth.checkHasLogined()
      if (!isLogined) {
        return
      }

      const openid = wx.getStorageSync('openid')
      if (!openid) {
        return
      }

      wx.showLoading({ title: '加载中...' })

      const result = await ResumeAPI.getResumeList(openid)

      wx.hideLoading()

      if (result.success) {
        // 格式化简历列表的时间显示
        const formattedResumes = (result.resumes || []).map(resume => ({
          ...resume,
          uploadTime: this.formatUploadTime(resume.uploadTime)
        }))

        this.setData({
          resumeList: formattedResumes
        })

        // 如果列表不为空，自动选中第一个简历
        if (result.resumes && result.resumes.length > 0) {
          await this.selectResume(result.resumes[0].id)
        }
      } else {
        // 网络错误时显示提示
        if (result.message && result.message.includes('网络')) {
          wx.showToast({
            title: result.message,
            icon: 'none',
            duration: 2000
          })
        }
      }
    } catch (err) {
      wx.hideLoading()
    }
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

    // 检查登录状态
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

    // 检查会员状态
    const memberInfo = await MemberAPI.checkMemberStatus()
    if (!memberInfo.isValid) {

      wx.showModal({
        title: '解锁AI简历分析',
        content: '联系我的微信，开始体验AI简历分析功能\n\n微信号：csuzhangleigang',
        confirmText: '复制',
        cancelText: '知道了',
        success: (res) => {
          if (res.confirm) {
            wx.setClipboardData({
              data: 'csuzhangleigang',
              success: () => {
                wx.showToast({
                  title: '微信号已复制',
                  icon: 'success'
                })
              }
            })
          }
        }
      })
      return
    }

    // 检查简历数量限制（最多3个）
    if (this.data.resumeList.length >= 3) {
      wx.showModal({
        title: '简历数量已达上限',
        content: '最多只能上传3个简历，请先删除旧简历后再上传',
        showCancel: false
      })
      return
    }

    // 添加触觉反馈
    wx.vibrateShort({ type: 'light' })

    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: async (res) => {
        const file = res.tempFiles[0]

        // 获取原始文件名（优先使用name，如果没有则从path提取）
        let fileName = file.name
        if (!fileName || fileName.startsWith('wxfile://') || fileName.startsWith('tmp_')) {
          // 如果name是临时路径，尝试从path中提取
          fileName = file.path.split('/').pop()
        }

        // 文件格式验证
        const allowedTypes = ['.pdf', '.doc', '.docx', '.md']
        const fileExt = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()

        if (!allowedTypes.includes(fileExt)) {
          wx.showToast({
            title: '不支持的文件格式',
            icon: 'none',
            duration: 2000
          })
          return
        }

        // 文件大小验证（10MB）
        if (file.size > 10 * 1024 * 1024) {
          wx.showToast({
            title: '文件过大，请上传小于10MB的文件',
            icon: 'none',
            duration: 2000
          })
          return
        }

        wx.showLoading({ title: '正在上传解析...' })

        try {
          const openid = wx.getStorageSync('openid')
          const result = await ResumeAPI.uploadResume(file.path, openid, fileName)

          wx.hideLoading()

          if (result.success) {
            wx.showToast({
              title: '上传成功',
              icon: 'success'
            })

            // 刷新简历列表
            await that.loadResumeList()

            // 自动选中新上传的简历
            if (result.resume && result.resume.id) {
              await that.selectResume(result.resume.id)
            }
          } else {
            // 显示友好的错误提示
            const errorMsg = result.message || '上传失败，请稍后重试'

            wx.showModal({
              title: '上传失败',
              content: errorMsg,
              showCancel: result.message && result.message.includes('网络'),
              cancelText: '取消',
              confirmText: result.message && result.message.includes('网络') ? '重试' : '确定',
              success: (modalRes) => {
                if (modalRes.confirm && result.message && result.message.includes('网络')) {
                  // 网络错误时提供重试选项
                  that.uploadResume()
                }
              }
            })
          }
        } catch (e) {
          wx.hideLoading()

          const errorMsg = e.message || '上传失败，请检查文件格式或网络连接'

          wx.showModal({
            title: '上传失败',
            content: errorMsg,
            cancelText: '取消',
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
      }
    })
  },

  /**
   * 选择简历
   */
  async selectResume(resumeId) {
    try {
      // 如果已经是当前选中的简历，不需要重新加载
      if (this.data.activeResumeId === resumeId) {
        return
      }

      wx.showLoading({ title: '加载中...' })

      const openid = wx.getStorageSync('openid')
      const result = await ResumeAPI.getResumeDetail(resumeId, openid)

      wx.hideLoading()

      if (result.success) {
        // 更新activeResumeId和activeResumeText
        this.setData({
          activeResumeId: resumeId,
          activeResumeText: result.resume.parsedText || ''
        })

        // 清空当前对话历史
        this.setData({
          messages: []
        })

        // 清除本地缓存的对话
        wx.removeStorageSync('resume_conversation')

        // 显示切换提示
        wx.showToast({
          title: '已切换简历',
          icon: 'success'
        })

        // 添加触觉反馈
        wx.vibrateShort({ type: 'light' })
      } else {
        wx.showToast({
          title: result.message || '加载简历失败',
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      const errorMsg = err.message || '加载简历失败，请稍后重试'
      wx.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      })
    }
  },

  /**
   * 处理简历卡片点击事件
   */
  onResumeCardTap(e) {
    const resumeId = e.currentTarget.dataset.id
    this.selectResume(resumeId)
  },

  /**
   * 选择预设问题
   */
  selectPresetQuestion(e) {
    const question = e.currentTarget.dataset.question

    // 检查是否有activeResume
    if (!this.data.activeResumeId) {
      wx.showToast({
        title: '请先选择简历',
        icon: 'none'
      })
      return
    }

    // 添加触觉反馈
    wx.vibrateShort({ type: 'light' })

    this.setData({ inputVal: question })
    // 自动发送
    setTimeout(() => {
      this.send()
    }, 100)
  },

  /**
   * 处理简历长按事件（显示删除选项）
   */
  onResumeCardLongPress(e) {
    const resumeId = e.currentTarget.dataset.id
    const resumeName = e.currentTarget.dataset.name

    wx.showActionSheet({
      itemList: ['删除简历'],
      itemColor: '#ee0a24',
      success: (res) => {
        if (res.tapIndex === 0) {
          this.confirmDeleteResume(resumeId, resumeName)
        }
      }
    })
  },

  /**
   * 确认删除简历
   */
  confirmDeleteResume(resumeId, resumeName) {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除简历"${resumeName}"吗？删除后无法恢复。`,
      confirmText: '删除',
      confirmColor: '#ee0a24',
      success: (res) => {
        if (res.confirm) {
          this.deleteResume(resumeId)
        }
      }
    })
  },

  /**
   * 删除简历
   */
  async deleteResume(resumeId) {
    try {
      wx.showLoading({ title: '删除中...' })

      const openid = wx.getStorageSync('openid')
      const result = await ResumeAPI.deleteResume(resumeId, openid)

      wx.hideLoading()

      if (result.success) {
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        })

        // 如果删除的是当前选中简历，清空activeResumeId
        if (this.data.activeResumeId === resumeId) {
          this.setData({
            activeResumeId: null,
            activeResumeText: '',
            messages: []
          })
          wx.removeStorageSync('resume_conversation')
        }

        // 刷新简历列表
        await this.loadResumeList()

        // 添加触觉反馈
        wx.vibrateShort({ type: 'medium' })
      } else {
        wx.showModal({
          title: '删除失败',
          content: result.message || '请稍后重试',
          showCancel: false
        })
      }
    } catch (err) {
      wx.hideLoading()
      const errorMsg = err.message || '删除失败，请稍后重试'
      wx.showModal({
        title: '删除失败',
        content: errorMsg,
        showCancel: false
      })
    }
  },

  /**
   * 发送消息
   */
  async send() {
    const text = (this.data.inputVal || '').trim()
    if (!text || this.data.sending) return

    // 检查是否有activeResume
    if (!this.data.activeResumeId) {
      wx.showToast({
        title: '请先选择或上传简历',
        icon: 'none'
      })
      return
    }

    // 检查登录状态
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

    // 检查会员状态
    const memberInfo = await MemberAPI.checkMemberStatus()
    if (!memberInfo.isValid) {

      wx.showModal({
        title: '解锁AI简历分析',
        content: '联系我的微信，开始体验AI简历分析功能\n\n微信号：csuzhangleigang',
        confirmText: '复制',
        cancelText: '知道了',
        success: (res) => {
          if (res.confirm) {
            wx.setClipboardData({
              data: 'csuzhangleigang',
              success: () => {
                wx.showToast({
                  title: '微信号已复制',
                  icon: 'success'
                })
              }
            })
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
      const openid = wx.getStorageSync('openid')

      // 构建对话历史（只包含用户和AI的消息）
      const conversationHistory = this.data.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // 调用新的chatWithResume API
      const result = await ResumeAPI.chatWithResume(
        this.data.activeResumeId,
        text,
        openid,
        conversationHistory
      )

      if (result.success) {
        // 添加AI回复
        const aiMessage = {
          role: 'assistant',
          content: result.answer || '（暂无回复）',
          htmlContent: towxml(result.answer || '（暂无回复）', 'markdown'), // 使用towxml转换 Markdown
          time: this.formatTime(new Date()),
          timestamp: Date.now(),
          // 收藏相关字段
          question: text,
          isFavorited: false,
          favoriteId: 0
        }

        this.setData({
          messages: [...this.data.messages, aiMessage],
          sending: false
        })

        // 滚动到底部
        this.scrollToBottom()

        // 保存对话历史
        this.saveConversation()
      } else {
        throw new Error(result.message || 'AI服务异常')
      }

    } catch (err) {
      const errorMsg = err.message || 'AI服务异常，请稍后重试'

      // 显示错误提示
      wx.showModal({
        title: 'AI服务异常',
        content: errorMsg,
        showCancel: errorMsg.includes('网络'),
        cancelText: '取消',
        confirmText: errorMsg.includes('网络') ? '重试' : '确定',
        success: (res) => {
          if (res.confirm && errorMsg.includes('网络')) {
            // 网络错误时提供重试选项
            this.setData({ inputVal: text })
            setTimeout(() => this.send(), 100)
          }
        }
      })

      this.setData({ sending: false })
    }
  },

  /**
   * 处理收藏状态变化
   */
  onFavoriteChange(e) {
    const { favorited, favoriteId } = e.detail
    const index = e.currentTarget.dataset.index

    // 更新消息的收藏状态
    const messages = this.data.messages
    if (messages[index]) {
      messages[index].isFavorited = favorited
      messages[index].favoriteId = favoriteId
      this.setData({ messages })
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

    // 查找当前选中的简历信息
    if (this.data.activeResumeId) {
      const activeResume = this.data.resumeList.find(r => r.id === this.data.activeResumeId)
      if (activeResume) {
        exportText += `简历文件: ${activeResume.filename}\n`
        exportText += `上传时间: ${activeResume.uploadTime}\n\n`
      }
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
   * 格式化上传时间（简洁显示）
   */
  formatUploadTime(timeStr) {
    if (!timeStr) return ''

    try {
      const date = new Date(timeStr)
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const uploadDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

      // 计算天数差
      const daysDiff = Math.floor((today - uploadDate) / (24 * 60 * 60 * 1000))

      if (daysDiff === 0) {
        // 今天：显示时间
        return date.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        })
      } else if (daysDiff === 1) {
        // 昨天
        return '昨天'
      } else if (daysDiff < 7) {
        // 一周内：显示天数
        return `${daysDiff}天前`
      } else {
        // 超过一周：显示日期
        return `${date.getMonth() + 1}-${date.getDate()}`
      }
    } catch (e) {
      return timeStr
    }
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
      // 只有在有activeResumeId时才保存
      if (this.data.activeResumeId) {
        wx.setStorageSync('resume_conversation', {
          messages: this.data.messages,
          activeResumeId: this.data.activeResumeId,
          updateTime: Date.now()
        })
      }
    } catch (error) {
      console.error('保存对话失败:', error)
    }
  },

  /**
   * 加载对话历史
   */
  async loadConversation() {
    try {
      const conversation = wx.getStorageSync('resume_conversation')
      if (conversation && conversation.messages) {
        // 只加载24小时内的对话
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000
        if (conversation.updateTime > dayAgo) {
          // 检查resumeId是否匹配
          if (conversation.activeResumeId === this.data.activeResumeId) {
            this.setData({
              messages: conversation.messages
            })
            this.scrollToBottom()

            // 检查每条消息的收藏状态
            await this.checkMessagesFavoriteStatus()
          }
        }
      }
    } catch (error) {
      console.error('加载对话失败:', error)
    }
  },

  /**
   * 检查消息的收藏状态
   */
  async checkMessagesFavoriteStatus() {
    try {
      const openid = wx.getStorageSync('openid')
      if (!openid) return

      // 获取收藏列表
      const result = await favoritesApi.getFavorites({
        openid,
        page: 1,
        pageSize: 100
      })

      if (result.code === 0 && result.data && result.data.list) {
        const favorites = result.data.list
        const messages = this.data.messages

        // 更新每条AI消息的收藏状态
        let updated = false
        messages.forEach(msg => {
          if (msg.role === 'assistant' && msg.question) {
            const favorite = favorites.find(fav =>
              fav.sourceType === 'resume' &&
              fav.question === msg.question &&
              fav.answer === msg.content
            )
            if (favorite) {
              msg.isFavorited = true
              msg.favoriteId = favorite.id
              updated = true
            }
          }
        })

        if (updated) {
          this.setData({ messages })
        }
      }
    } catch (error) {
      console.error('检查收藏状态失败:', error)
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
   * 分享配置 - 优化版
   */
  onShareAppMessage(options) {
    const { from, target } = options || {};
    const { activeResumeId, resumeList, messages } = this.data;

    // 检测分享目标类型
    const isGroupShare = target && target.includes('group');

    // 获取当前简历信息
    const activeResume = activeResumeId ?
      resumeList.find(r => r.id === activeResumeId) : null;

    // 分析对话中的亮点（简单提取）
    const analysisHighlight = this.extractAnalysisHighlight();

    // 构建分享路径
    const sharePath = `/pages/ai/resume/index?from=share&target=${isGroupShare ? 'group' : 'private'}`;

    if (isGroupShare) {
      // 群聊分享 - 强调工具价值
      return {
        title: 'AI简历解读神器 - 群友一起优化简历，提升面试成功率！',
        path: sharePath,
        imageUrl: '' // 使用默认分享图片
      };
    } else {
      // 私聊分享 - 个性化内容
      if (analysisHighlight) {
        return {
          title: `我的简历分析结果：${analysisHighlight} - 快来试试AI简历解读！`,
          path: sharePath,
          imageUrl: '' // 使用默认分享图片
        };
      } else if (activeResume) {
        return {
          title: `AI帮我分析了简历，发现了很多亮点 - 推荐你也试试！`,
          path: sharePath,
          imageUrl: '' // 使用默认分享图片
        };
      } else {
        return {
          title: 'AI简历解读 - 发现简历亮点，提升面试成功率',
          path: sharePath,
          imageUrl: '' // 使用默认分享图片
        };
      }
    }
  },

  /**
   * 提取分析亮点用于分享
   */
  extractAnalysisHighlight() {
    try {
      const { messages } = this.data;

      // 查找包含"亮点"、"优势"、"特长"等关键词的AI回复
      const highlightKeywords = ['亮点', '优势', '特长', '突出', '擅长', '经验丰富'];

      for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (message.role === 'assistant' && message.content) {
          for (const keyword of highlightKeywords) {
            if (message.content.includes(keyword)) {
              // 提取包含关键词的句子（简化版）
              const sentences = message.content.split(/[。！？\n]/);
              for (const sentence of sentences) {
                if (sentence.includes(keyword) && sentence.length > 10 && sentence.length < 50) {
                  return sentence.trim();
                }
              }
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error('提取分析亮点失败:', error);
      return null;
    }
  }
})
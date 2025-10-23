const AI = require('../../../utils/ai.js')

Page({
  data: {
    sessionId: '',
    inputVal: '',
    resumeText: '',
    messages: [
      { role: 'system', content: '你是简历解读助手。针对用户上传或粘贴的简历内容，结合指定岗位或行业，给出：亮点总结、风险点、优化建议（含具体修改例句）、可转化的项目/技能、针对该岗位的问答清单。' }
    ],
    sending: false
  },
  onLoad() {
    this.setData({ sessionId: Date.now() + '' })
    wx.setNavigationBarTitle({ title: '简历解读' })
  },
  bindinput(e) {
    this.setData({ inputVal: e.detail.value })
  },
  async uploadResume() {
    const that = this
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: async (res) => {
        const file = res.tempFiles[0]
        wx.showLoading({ title: '上传解析中' })
        try {
          const parsed = await AI.uploadResume(file.path)
          wx.hideLoading()
          const txt = parsed.resumeText || ''
          that.setData({ resumeText: txt })
          if (txt) {
            const sysPrompt = { role: 'system', content: '候选人简历内容如下：\n' + txt }
            that.setData({ messages: [that.data.messages[0], sysPrompt] })
            wx.showToast({ title: '解析成功', icon: 'success' })
          } else {
            wx.showToast({ title: '未解析到文本', icon: 'none' })
          }
        } catch (e) {
          wx.hideLoading()
          wx.showToast({ title: '上传失败', icon: 'none' })
        }
      }
    })
  },
  async send() {
    const text = (this.data.inputVal || '').trim()
    if (!text || this.data.sending) return
    const messages = this.data.messages.concat([{ role: 'user', content: text }])
    this.setData({ messages, inputVal: '', sending: true })
    try {
      const res = await AI.chat({
        scene: 'resume',
        sessionId: this.data.sessionId,
        messages
      })
      const reply = { role: 'assistant', content: res.answer || '（暂无回复）' }
      this.setData({ messages: this.data.messages.concat([reply]) })
    } catch (err) {
      wx.showToast({ title: 'AI服务异常', icon: 'none' })
    } finally {
      this.setData({ sending: false })
    }
  },
})
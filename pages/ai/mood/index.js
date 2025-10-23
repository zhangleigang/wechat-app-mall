const AI = require('../../../utils/ai.js')

Page({
  data: {
    sessionId: '',
    inputVal: '',
    messages: [
      { role: 'system', content: '你是情绪支持与面试压力管理助手。请以温暖、专业、不评判的方式进行对话，帮助用户识别压力来源、提供呼吸/认知重构/准备策略等建议，并在适当时给出可执行的练习清单。' }
    ],
    sending: false
  },
  onLoad() {
    this.setData({ sessionId: Date.now() + '' })
    wx.setNavigationBarTitle({ title: '情绪小屋' })
  },
  bindinput(e) {
    this.setData({ inputVal: e.detail.value })
  },
  async send() {
    const text = (this.data.inputVal || '').trim()
    if (!text || this.data.sending) return
    const messages = this.data.messages.concat([{ role: 'user', content: text }])
    this.setData({ messages, inputVal: '', sending: true })
    try {
      const res = await AI.chat({
        scene: 'mood',
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
  }
})
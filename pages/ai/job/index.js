const AI = require('../../../utils/ai.js')

Page({
  data: {
    sessionId: '',
    inputVal: '',
    messages: [
      { role: 'system', content: '你是岗位分析助手，请根据用户提供的JD、岗位链接或关键词，输出：岗位职责概述、核心技能清单（按优先级）、常见面试问题、与候选人能力的差距与补齐建议。' }
    ],
    sending: false
  },
  onLoad() {
    this.setData({ sessionId: Date.now() + '' })
    wx.setNavigationBarTitle({ title: '岗位分析' })
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
        scene: 'job',
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
  quick(e) {
    const q = e.currentTarget.dataset.q || ''
    this.setData({ inputVal: q })
  }
})
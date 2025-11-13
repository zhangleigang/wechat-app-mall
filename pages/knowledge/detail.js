const { markdownToHtml } = require('../../utils/markdown.js')

Page({
  data: {
    question: '',
    answer: '',
    answerHtml: ''
  },

  onLoad(options) {
    const question = decodeURIComponent(options.question || '')
    const answer = decodeURIComponent(options.answer || '')

    // 将 Markdown 转换为 HTML
    const answerHtml = markdownToHtml(answer)

    this.setData({
      question,
      answer,
      answerHtml
    })

    // 设置导航栏标题为问题的前20个字
    const title = question.length > 20 ? question.substring(0, 20) + '...' : question
    wx.setNavigationBarTitle({ title })
  },

  onShareAppMessage() {
    return {
      title: this.data.question,
      path: `/pages/knowledge/detail?question=${encodeURIComponent(this.data.question)}&answer=${encodeURIComponent(this.data.answer)}`,
      imageUrl: ''
    }
  }
})
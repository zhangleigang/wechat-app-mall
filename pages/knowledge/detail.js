const KNOW = require('../../utils/knowledge.js')
const AI = require('../../utils/ai.js')

Page({
  data: {
    topic: null,
    generatingAnswer: false,
    generatedAnswers: {}
  },
  onLoad(options) {
    wx.setNavigationBarTitle({ title: '知识详情' })
    // 优先使用直达参数 id
    const id = options && options.id
    if (id) {
      const topic = (KNOW.topics || []).find(t => t.id === id)
      if (topic) {
        this.setData({ topic })
        wx.setNavigationBarTitle({ title: topic.title })
        return
      }
    }
    // 退化到 eventChannel 传参
    const ec = this.getOpenerEventChannel && this.getOpenerEventChannel()
    if (ec && ec.on) {
      ec.on('topic', (topic) => {
        this.setData({ topic })
        if (topic && topic.title) {
          wx.setNavigationBarTitle({ title: topic.title })
        }
      })
    }
  },
  // 调用AI生成答案
  generateAnswer(e) {
    const { questionIndex } = e.currentTarget.dataset
    const { topic } = this.data
    const question = topic.faqs[questionIndex]
    
    if (!question) return
    
    this.setData({
      generatingAnswer: true
    })
    
    // 构建提示信息
    const systemPrompt = '你是一个专业的技术面试官助手，请对下面的大数据相关技术问题提供准确、详细且专业的回答。回答应当条理清晰，包含必要的技术细节。'
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question }
    ]
    
    // 调用AI接口
    AI.chat({
      scene: 'knowledge',
      messages,
      sessionId: `knowledge-${Date.now()}`
    }).then(res => {
      const answer = res.answer || res.data || '暂无答案'
      const generatedAnswers = { ...this.data.generatedAnswers }
      generatedAnswers[questionIndex] = answer
      
      this.setData({
        generatingAnswer,
        generatedAnswers
      })
    }).catch(err => {
      console.error('AI生成答案失败:', err)
      wx.showToast({
        title: '生成答案失败，请重试',
        icon: 'none'
      })
    }).finally(() => {
      this.setData({
        generatingAnswer: false
      })
    })
  },
  onShareAppMessage() {
    const topic = this.data.topic
    return {
      title: topic ? topic.title : '知识详情',
      path: topic ? ('/pages/knowledge/detail?id=' + topic.id) : '/pages/knowledge/index',
      imageUrl: ''
    }
  }
})
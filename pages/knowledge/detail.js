const KNOW = require('../../utils/knowledge.js')

Page({
  data: {
    topic: null
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
  onShareAppMessage() {
    const topic = this.data.topic
    return {
      title: topic ? topic.title : '知识详情',
      path: topic ? ('/pages/knowledge/detail?id=' + topic.id) : '/pages/knowledge/index',
      imageUrl: ''
    }
  }
})
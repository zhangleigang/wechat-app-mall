const KNOW = require('../../utils/knowledge.js')
Page({
  data: {
    q: '',
    activeCategoryKey: 'hdfs',
    categories: KNOW.categories || [],
    topics: KNOW.topics || [],
    filteredTopics: []
  },
  onLoad() {
    wx.setNavigationBarTitle({ title: '面试知识' })
    this.applyFilter()
  },
  bindinput(e) {
    this.setData({ q: e.detail.value })
    this.applyFilter()
  },
  search() {
    this.applyFilter()
  },
  switchCategory(e) {
    const key = e.currentTarget.dataset.key
    if (!key || key === this.data.activeCategoryKey) return
    this.setData({ activeCategoryKey: key })
    this.applyFilter()
  },
  applyFilter() {
    const q = (this.data.q || '').trim().toLowerCase()
    const active = this.data.activeCategoryKey
    const topics = this.data.topics || []
    const match = (t) => {
      const blob = [t.title, t.summary].concat(t.tags || []).join(' ').toLowerCase()
      return !q || blob.indexOf(q) >= 0
    }
    const filtered = topics.filter(t => t.categoryKey === active && match(t))
    this.setData({ filteredTopics: filtered })
  },
  toDetail(e) {
    const id = e.currentTarget.dataset.id
    const topic = (this.data.topics || []).find(t => t.id === id)
    if (!topic) return
    wx.navigateTo({
      url: '/pages/knowledge/detail?id=' + id,
      success: (res) => {
        res.eventChannel.emit('topic', topic)
      }
    })
  }
})
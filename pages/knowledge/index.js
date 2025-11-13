const KNOW = require('../../utils/knowledge.js')
const { markdownToHtml } = require('../../utils/markdown.js')

Page({
  data: {
    activeCategoryKey: 'mr',  // 默认显示 MapReduce
    categories: KNOW.categories || [],
    topics: KNOW.topics || [],
    allQuestions: []  // 所有问题的扁平列表
  },
  onLoad() {
    wx.setNavigationBarTitle({ title: '面试知识' })
    this.loadQuestions()
  },
  switchCategory(e) {
    const key = e.currentTarget.dataset.key
    if (!key || key === this.data.activeCategoryKey) return
    this.setData({ activeCategoryKey: key })
    this.loadQuestions()
  },
  loadQuestions() {
    const active = this.data.activeCategoryKey
    const topics = this.data.topics || []

    // 筛选符合条件的主题
    const filteredTopics = topics.filter(t => t.categoryKey === active)

    // 将所有问题展平成一个列表
    const allQuestions = []
    filteredTopics.forEach(topic => {
      if (topic.faqs && topic.answers) {
        topic.faqs.forEach((question, index) => {
          const answer = topic.answers[index] || '答案加载中...'
          allQuestions.push({
            id: `${topic.id}-${index}`,
            question: question,
            answer: answer,
            answerHtml: markdownToHtml(answer),  // 转换为HTML
            expanded: false
          })
        })
      }
    })

    this.setData({ allQuestions })
  },

  /**
   * 查看题目详情
   */
  viewDetail(e) {
    const index = e.currentTarget.dataset.index
    const question = this.data.allQuestions[index]

    // 触觉反馈
    wx.vibrateShort({ type: 'light' })

    // 跳转到详情页
    wx.navigateTo({
      url: `/pages/knowledge/detail?question=${encodeURIComponent(question.question)}&answer=${encodeURIComponent(question.answer)}`
    })
  },

  /**
   * 分享配置
   */
  onShareAppMessage() {
    return {
      title: '面试知识库 - 精选大数据技术面试题',
      path: '/pages/knowledge/index',
      imageUrl: ''
    }
  }
})
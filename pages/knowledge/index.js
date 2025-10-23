Page({
  data: {
    q: '',
    categories: [
      { name: '通用面试技巧' },
      { name: '技术岗（前端/后端/算法）' },
      { name: '产品/运营/数据分析' },
      { name: '测试/质量/安全' },
      { name: '管理/领导力' }
    ],
    list: [
      { title: 'STAR 法则与结构化回答' },
      { title: '高频自我介绍要点' },
      { title: '行为面试题拆解范式' },
      { title: '项目亮点的讲述策略' },
      { title: '反问环节的高质量问题' }
    ]
  },
  onLoad() {
    wx.setNavigationBarTitle({ title: '面试知识' })
  },
  bindinput(e) {
    this.setData({ q: e.detail.value })
  },
  search() {
    const q = (this.data.q || '').trim()
    if (!q) return
    wx.showToast({ title: '搜索：' + q, icon: 'none' })
    // TODO: 接入你们的知识库/CMS接口
  }
})
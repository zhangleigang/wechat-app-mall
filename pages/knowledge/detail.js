const { markdownToHtml } = require('../../utils/markdown.js')

Page({
  data: {
    question: '',
    answer: '',
    answerHtml: ''
  },

  onLoad(options) {
    // 优先从全局数据获取（避免 URL 过长）
    const app = getApp();
    const questionData = app.globalData?.currentQuestion;

    let question = '';
    let answer = '';

    if (questionData) {
      // 从全局数据获取
      question = questionData.question || '';
      answer = questionData.answer || '';
      console.log('从全局数据加载题目');
    } else {
      // 降级方案：从 URL 参数获取（兼容旧版本）
      question = decodeURIComponent(options.question || '');
      answer = decodeURIComponent(options.answer || '');
      console.log('从 URL 参数加载题目');
    }

    // 将 Markdown 转换为 HTML
    const answerHtml = markdownToHtml(answer);

    this.setData({
      question,
      answer,
      answerHtml
    });

    // 设置导航栏标题为问题的前20个字
    const title = question.length > 20 ? question.substring(0, 20) + '...' : question;
    wx.setNavigationBarTitle({ title });

    // 清理全局数据，避免内存泄漏
    if (app.globalData?.currentQuestion) {
      delete app.globalData.currentQuestion;
    }
  },

  onShareAppMessage() {
    return {
      title: this.data.question,
      path: `/pages/knowledge/detail?question=${encodeURIComponent(this.data.question)}&answer=${encodeURIComponent(this.data.answer)}`,
      imageUrl: ''
    }
  }
})
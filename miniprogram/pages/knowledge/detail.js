const towxml = require('../../components/towxml-dist/index.js')

Page({
  data: {
    question: '',
    answer: '',
    answerHtml: '',
    isFavorite: false,
    currentItem: null
  },

  async onLoad(options) {
    // 1. 先验证会员状态
    const memberStatus = await this.checkMemberStatus();

    if (!memberStatus.isValid) {
      // 非会员，显示提示并引导开通
      this.showMemberRequired();
      return;
    }

    // 2. 会员有效，加载题目详情
    // 优先从全局数据获取（避免 URL 过长）
    const app = getApp();
    const questionData = app.globalData?.currentQuestion;

    let question = '';
    let answer = '';
    let id = options.id || '';
    let category = options.category || '';
    let categoryName = options.categoryName || '';

    if (questionData) {
      // 从全局数据获取
      question = questionData.question || '';
      answer = questionData.answer || '';
      id = questionData.id || id;
      category = questionData.category || category;
      categoryName = questionData.categoryName || categoryName;
      console.log('从全局数据加载题目');
    } else {
      // 降级方案：从 URL 参数获取（兼容旧版本）
      question = decodeURIComponent(options.question || '');
      answer = decodeURIComponent(options.answer || '');
      console.log('从 URL 参数加载题目');
    }

    // 使用Towxml处理所有Markdown内容
    const answerHtml = towxml(answer, 'markdown');

    // 保存当前项目信息
    const currentItem = {
      id,
      category,
      categoryName,
      question,
      answer
    };

    this.setData({
      question,
      answer,
      answerHtml,
      currentItem
    });

    // 检查是否已收藏
    this.checkFavorite(id);

    // 设置导航栏标题为问题的前20个字
    const title = question.length > 20 ? question.substring(0, 20) + '...' : question;
    wx.setNavigationBarTitle({ title });

    // 清理全局数据，避免内存泄漏
    if (app.globalData?.currentQuestion) {
      delete app.globalData.currentQuestion;
    }
  },

  /**
   * 检查会员状态
   */
  async checkMemberStatus() {
    try {
      const MemberAPI = require('../../utils/member-api.js');
      const status = await MemberAPI.checkMemberStatus();
      return status;
    } catch (error) {
      console.error('检查会员状态失败:', error);
      return { isValid: false, reason: 'error' };
    }
  },

  /**
   * 显示会员提示
   */
  showMemberRequired() {
    wx.showModal({
      title: '开通会员',
      content: '查看题目详情需要开通会员\n\n会员权益：\n• 查看200+题目完整答案\n• 无限次使用AI功能\n• 优先客服支持',
      confirmText: '立即开通',
      cancelText: '返回',
      success: (res) => {
        if (res.confirm) {
          // 跳转到套餐页面
          wx.redirectTo({
            url: '/pages/member/packages/index',
            fail: () => {
              wx.showToast({
                title: '跳转失败',
                icon: 'none'
              });
            }
          });
        } else {
          // 返回上一页
          wx.navigateBack({
            delta: 1
          });
        }
      }
    });
  },

  // 检查是否已收藏
  checkFavorite(id) {
    if (!id) return;

    try {
      const favorites = wx.getStorageSync('favorites') || [];
      const isFavorite = favorites.some(item => item.id === id);
      this.setData({ isFavorite });
    } catch (error) {
      console.error('检查收藏状态失败:', error);
    }
  },

  // 切换收藏状态
  toggleFavorite() {
    const { currentItem, isFavorite } = this.data;

    if (!currentItem || !currentItem.id) {
      wx.showToast({
        title: '无法收藏',
        icon: 'none'
      });
      return;
    }

    try {
      let favorites = wx.getStorageSync('favorites') || [];

      if (isFavorite) {
        // 取消收藏
        favorites = favorites.filter(item => item.id !== currentItem.id);
        wx.showToast({
          title: '已取消收藏',
          icon: 'success'
        });
      } else {
        // 添加收藏
        const favoriteItem = {
          ...currentItem,
          favoriteTime: new Date().toLocaleString('zh-CN')
        };
        favorites.unshift(favoriteItem);
        wx.showToast({
          title: '已添加收藏',
          icon: 'success'
        });
      }

      // 保存到本地存储
      wx.setStorageSync('favorites', favorites);

      // 更新状态
      this.setData({
        isFavorite: !isFavorite
      });
    } catch (error) {
      console.error('收藏操作失败:', error);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
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
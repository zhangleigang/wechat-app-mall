const towxml = require('../../components/towxml-dist/index.js')
const favoritesApi = require('../../utils/favorites-api.js')

Page({
  data: {
    question: '',
    answer: '',
    answerHtml: '',
    isFavorite: false,
    favoriteId: 0,
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
  async checkFavorite(id) {
    if (!id) return;

    try {
      const openid = wx.getStorageSync('openid');
      if (!openid) return;

      // 使用搜索API检查特定问题是否已收藏
      const result = await favoritesApi.getFavorites({
        openid,
        page: 1,
        pageSize: 1,
        sourceType: 'knowledge',
        sourceId: id
      });

      if (result.code === 0 && result.data && result.data.list && result.data.list.length > 0) {
        const favorite = result.data.list[0];
        this.setData({
          isFavorite: true,
          favoriteId: favorite.id
        });
      } else {
        // 确保重置状态
        this.setData({
          isFavorite: false,
          favoriteId: 0
        });
      }
    } catch (error) {
      console.error('检查收藏状态失败:', error);
      // 出错时重置状态
      this.setData({
        isFavorite: false,
        favoriteId: 0
      });
    }
  },

  // 处理收藏状态变化
  onFavoriteChange(e) {
    const { favorited, favoriteId } = e.detail;
    this.setData({
      isFavorite: favorited,
      favoriteId: favoriteId
    });
  },



  // 页面显示时重新检查收藏状态
  onShow() {
    // 如果有当前项目ID，重新检查收藏状态
    if (this.data.currentItem && this.data.currentItem.id) {
      this.checkFavorite(this.data.currentItem.id);
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
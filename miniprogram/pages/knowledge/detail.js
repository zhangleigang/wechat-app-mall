const towxml = require('../../components/towxml-dist/index.js')
const favoritesApi = require('../../utils/favorites-api.js')

Page({
  data: {
    question: '',
    answer: '',
    answerHtml: '',
    isFavorite: false,
    favoriteId: 0,
    currentItem: null,
    loading: true,
    showAnswer: false,
    showMemberPrompt: false,
    memberPromptReason: 'not_member'
  },

  async onLoad(options) {
    // 保存选项以供重试使用
    this.options = options;

    try {
      // 1. 首先加载题目数据（允许所有用户查看题目）
      const questionData = await this.loadQuestionData(options);

      if (!questionData) {
        this.handleDataLoadError();
        return;
      }

      // 2. 显示题目内容
      this.displayQuestionContent(questionData);

      // 3. 异步检查会员状态并处理答案显示
      this.checkMemberStatusAndDisplayAnswer();

      // 4. 检查收藏状态
      this.checkFavorite(questionData.id);

      // 5. 设置页面标题
      this.setPageTitle(questionData.question);

      // 6. 清理传递的数据（避免内存泄漏）
      this.cleanupTransferredData(options.dataId);

    } catch (error) {
      console.error('页面加载失败:', error);
      this.handlePageLoadError(error);
    }
  },

  /**
   * 加载题目数据（支持多种数据源和恢复机制）
   */
  async loadQuestionData(options) {
    try {
      const DataTransferManager = require('../../utils/data-transfer.js');

      console.log('[Detail] 开始加载题目数据:', options);

      // 1. 优先使用数据传递管理器获取数据
      let questionData = DataTransferManager.getQuestionData({
        dataId: options.dataId,
        urlParams: options,
        allowExpired: false
      });

      if (questionData && this.validateQuestionData(questionData)) {
        console.log('[Detail] 从数据传递管理器获取数据成功');
        return questionData;
      }

      // 2. 尝试从应用全局数据恢复
      questionData = this.recoverFromGlobalData();
      if (questionData && this.validateQuestionData(questionData)) {
        console.log('[Detail] 从全局数据恢复成功');
        return questionData;
      }

      // 3. 尝试从URL参数恢复基本信息
      questionData = this.recoverFromUrlParams(options);
      if (questionData && this.validateQuestionData(questionData)) {
        console.log('[Detail] 从URL参数恢复成功');
        return questionData;
      }

      // 4. 尝试从本地存储恢复（紧急情况）
      questionData = this.recoverFromLocalStorage(options);
      if (questionData && this.validateQuestionData(questionData)) {
        console.log('[Detail] 从本地存储恢复成功');
        return questionData;
      }

      // 5. 处理紧急模式
      if (options.emergency === 'true') {
        console.log('[Detail] 紧急模式，创建最小数据结构');
        return this.createEmergencyQuestionData(options);
      }

      console.warn('[Detail] 所有数据恢复方式都失败');
      return null;

    } catch (error) {
      console.error('[Detail] 加载题目数据失败:', error);
      return null;
    }
  },

  /**
   * 验证题目数据完整性
   */
  validateQuestionData(data) {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // 检查必要字段
    if (!data.question || typeof data.question !== 'string') {
      return false;
    }

    // 检查ID
    if (!data.id) {
      data.id = this.generateQuestionId();
    }

    return true;
  },

  /**
   * 从全局数据恢复
   */
  recoverFromGlobalData() {
    try {
      const app = getApp();
      if (app && app.globalData && app.globalData.currentQuestion) {
        const data = app.globalData.currentQuestion;

        // 检查数据时效性（5分钟内）
        if (app.globalData.navigationTimestamp) {
          const elapsed = Date.now() - app.globalData.navigationTimestamp;
          if (elapsed > 5 * 60 * 1000) {
            console.warn('[Detail] 全局数据已过期');
            return null;
          }
        }

        return { ...data };
      }
      return null;
    } catch (error) {
      console.error('[Detail] 从全局数据恢复失败:', error);
      return null;
    }
  },

  /**
   * 从URL参数恢复
   */
  recoverFromUrlParams(options) {
    try {
      const { id, question, answer, category, categoryName } = options;

      if (!question) {
        return null;
      }

      return {
        id: id || this.generateQuestionId(),
        question: decodeURIComponent(question),
        answer: decodeURIComponent(answer || ''),
        category: category || '',
        categoryName: decodeURIComponent(categoryName || ''),
        source: 'url_params'
      };
    } catch (error) {
      console.error('[Detail] 从URL参数恢复失败:', error);
      return null;
    }
  },

  /**
   * 从本地存储恢复
   */
  recoverFromLocalStorage(options) {
    try {
      // 尝试根据ID从本地存储中查找
      if (options.id) {
        const storageKey = `dt_q_${options.id}`;
        const data = wx.getStorageSync(storageKey);

        if (data && data.question) {
          return data;
        }
      }

      // 尝试查找最近的题目数据
      const recentKey = 'dt_recent_question';
      const recentData = wx.getStorageSync(recentKey);

      if (recentData && recentData.question) {
        // 检查时效性（10分钟内）
        if (recentData._meta && recentData._meta.timestamp) {
          const elapsed = Date.now() - recentData._meta.timestamp;
          if (elapsed < 10 * 60 * 1000) {
            return recentData;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('[Detail] 从本地存储恢复失败:', error);
      return null;
    }
  },

  /**
   * 创建紧急模式数据
   */
  createEmergencyQuestionData(options) {
    return {
      id: options.id || this.generateQuestionId(),
      question: '题目加载中...',
      answer: '答案加载中，请稍候...',
      category: options.category || '',
      categoryName: options.categoryName || '',
      source: 'emergency',
      isEmergency: true
    };
  },

  /**
   * 显示题目内容（所有用户都可以看到）
   */
  displayQuestionContent(questionData) {
    const currentItem = {
      id: questionData.id,
      category: questionData.category,
      categoryName: questionData.categoryName,
      question: questionData.question,
      answer: questionData.answer
    };

    this.setData({
      question: questionData.question,
      currentItem: currentItem,
      loading: false,
      showMemberPrompt: false,
      showAnswer: false
    });
  },

  /**
   * 检查会员状态并处理答案显示
   */
  async checkMemberStatusAndDisplayAnswer() {
    try {
      // 先清除可能过期的缓存
      const MemberAPI = require('../../utils/member-api.js');

      // 强制刷新会员状态（清除缓存）
      const memberStatus = await MemberAPI.refreshMemberStatus();

      console.log('会员状态检查结果:', memberStatus);

      if (memberStatus.isValid) {
        // 会员用户：显示完整答案
        console.log('用户是有效会员，显示完整答案');
        this.displayFullAnswer();
      } else {
        // 非会员用户：显示会员提示
        console.log('用户不是会员，显示会员提示，原因:', memberStatus.reason);
        this.displayMemberPrompt(memberStatus.reason);
      }
    } catch (error) {
      console.error('检查会员状态失败:', error);
      // 出错时默认显示会员提示
      this.displayMemberPrompt('error');
    }
  },

  /**
   * 显示完整答案（会员用户）
   */
  displayFullAnswer() {
    const answer = this.data.currentItem?.answer || '';
    const answerHtml = towxml(answer, 'markdown');

    this.setData({
      answer: answer,
      answerHtml: answerHtml,
      showAnswer: true,
      showMemberPrompt: false
    });
  },

  /**
   * 显示会员提示（非会员用户）
   */
  displayMemberPrompt(reason = 'not_member') {
    this.setData({
      showMemberPrompt: true,
      showAnswer: false,
      memberPromptReason: reason
    });
  },

  /**
   * 检查会员状态（带降级处理）
   */
  async checkMemberStatusWithFallback() {
    const ErrorHandler = require('../../utils/error-handler.js');

    try {
      // 使用重试机制检查会员状态
      const status = await ErrorHandler.retryOperation(async () => {
        const MemberAPI = require('../../utils/member-api.js');
        return await MemberAPI.checkMemberStatus();
      }, {
        configType: 'api',
        onRetry: (attempt, delay, error) => {
          console.log(`[Detail] 会员状态检查重试 ${attempt}，${delay}ms后执行`);
        }
      });

      return status;
    } catch (error) {
      console.error('检查会员状态失败:', error);

      // 检查网络状态
      const knowledgeApi = require('../../utils/knowledge-api.js');
      const networkStatus = await knowledgeApi.checkNetworkStatus();

      let reason = 'error';
      let message = '会员状态验证失败，请重试';

      if (!networkStatus.isConnected) {
        reason = 'network_error';
        message = '网络连接失败，请检查网络后重试';
      } else if (error.code === 'NETWORK_ERROR') {
        reason = 'network_error';
        message = '网络不稳定，请稍后重试';
      } else if (error.statusCode >= 500) {
        reason = 'server_error';
        message = '服务器暂时不可用，请稍后重试';
      }

      return {
        isValid: false,
        reason: reason,
        message: message
      };
    }
  },

  /**
   * 处理数据加载错误
   */
  handleDataLoadError() {
    const ErrorHandler = require('../../utils/error-handler.js');

    console.error('[Detail] 处理数据加载错误');

    // 使用增强的错误处理
    ErrorHandler.showUserFriendlyError('DATA_ERROR', {
      customTitle: '题目数据加载失败',
      customMessage: '无法获取题目数据，可能是网络问题或数据传递异常',
      onRetry: () => {
        this.retryDataLoad();
      },
      onRefresh: () => {
        this.refreshCurrentPage();
      },
      onGoBack: () => {
        wx.navigateBack({ delta: 1 });
      },
      showAdvancedOptions: true
    });
  },

  /**
   * 刷新当前页面
   */
  refreshCurrentPage() {
    const pages = getCurrentPages();
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1];
      const options = currentPage.options || this.options;

      wx.redirectTo({
        url: `/${currentPage.route}?${this.buildQueryString(options)}`
      });
    } else {
      wx.navigateBack({ delta: 1 });
    }
  },

  /**
   * 构建查询字符串
   */
  buildQueryString(options) {
    const params = [];
    Object.keys(options).forEach(key => {
      if (options[key] !== undefined && options[key] !== null) {
        params.push(`${encodeURIComponent(key)}=${encodeURIComponent(options[key])}`);
      }
    });
    return params.join('&');
  },

  /**
   * 重试数据加载
   */
  async retryDataLoad() {
    const ErrorHandler = require('../../utils/error-handler.js');

    try {
      console.log('[Detail] 开始重试数据加载');

      // 使用增强的加载提示
      const loadingController = ErrorHandler.showProgressLoading('重新加载数据...', {
        timeout: 15000,
        steps: ['清理缓存...', '重新获取数据...', '处理数据...'],
        onTimeout: () => {
          this.handleRetryTimeout();
        }
      });

      // 清理可能的缓存问题
      loadingController.updateMessage('清理缓存...');
      this.clearAllCaches();

      // 等待一下再重试
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 重新执行加载流程
      loadingController.updateMessage('重新获取数据...');
      await this.onLoad(this.options);

      loadingController.finish();
      ErrorHandler.showSuccess('重新加载成功');

    } catch (error) {
      console.error('[Detail] 重试加载失败:', error);

      // 使用增强的错误处理
      ErrorHandler.showUserFriendlyError('DATA_ERROR', {
        customTitle: '重试失败',
        customMessage: '重新加载数据失败，可能是网络问题或数据异常',
        onRetry: () => {
          // 再次重试
          this.retryDataLoad();
        },
        onRefresh: () => {
          // 刷新页面
          this.refreshCurrentPage();
        },
        onGoBack: () => {
          // 返回上一页
          wx.navigateBack({ delta: 1 });
        },
        showAdvancedOptions: true
      });
    }
  },

  /**
   * 处理重试超时
   */
  handleRetryTimeout() {
    console.warn('[Detail] 重试数据加载超时');

    const ErrorHandler = require('../../utils/error-handler.js');
    ErrorHandler.showUserFriendlyError('TIMEOUT', {
      customTitle: '重试超时',
      customMessage: '重新加载数据超时，可能是网络较慢',
      onRetry: () => {
        this.retryDataLoad();
      },
      onGoBack: () => {
        wx.navigateBack({ delta: 1 });
      },
      showAdvancedOptions: true
    });
  },

  /**
   * 显示数据恢复选项
   */
  showDataRecoveryOptions() {
    wx.showActionSheet({
      itemList: [
        '返回题目列表',
        '刷新整个应用',
        '清理缓存重试',
        '复制错误信息'
      ],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            // 返回题目列表
            wx.navigateBack({ delta: 1 });
            break;
          case 1:
            // 刷新整个应用
            wx.reLaunch({
              url: '/pages/knowledge/index'
            });
            break;
          case 2:
            // 清理缓存重试
            this.clearAllCachesAndRetry();
            break;
          case 3:
            // 复制错误信息
            this.copyErrorInfo();
            break;
        }
      }
    });
  },

  /**
   * 清理所有缓存
   */
  clearAllCaches() {
    try {
      // 清理数据传递缓存
      const DataTransferManager = require('../../utils/data-transfer.js');
      DataTransferManager.cleanupExpiredData();

      // 清理全局数据
      const app = getApp();
      if (app && app.globalData) {
        delete app.globalData.currentQuestion;
        delete app.globalData.navigationTimestamp;
      }

      // 清理相关本地存储
      const keysToRemove = ['dt_recent_question'];
      keysToRemove.forEach(key => {
        try {
          wx.removeStorageSync(key);
        } catch (e) {
          console.warn('[Detail] 清理存储键失败:', key, e);
        }
      });

      console.log('[Detail] 缓存清理完成');
    } catch (error) {
      console.error('[Detail] 清理缓存失败:', error);
    }
  },

  /**
   * 清理缓存并重试
   */
  async clearAllCachesAndRetry() {
    try {
      wx.showLoading({
        title: '清理缓存中...',
        mask: true
      });

      this.clearAllCaches();

      // 等待一下再重试
      await new Promise(resolve => setTimeout(resolve, 1000));

      await this.retryDataLoad();

    } catch (error) {
      wx.hideLoading();
      console.error('[Detail] 清理缓存重试失败:', error);
      wx.showToast({
        title: '操作失败，请手动返回',
        icon: 'none'
      });
    }
  },

  /**
   * 复制错误信息
   */
  copyErrorInfo() {
    try {
      const errorInfo = {
        timestamp: new Date().toISOString(),
        options: this.options,
        userAgent: wx.getSystemInfoSync(),
        page: 'knowledge/detail'
      };

      const errorText = `知识库详情页加载失败\n时间: ${errorInfo.timestamp}\n页面参数: ${JSON.stringify(errorInfo.options)}\n设备信息: ${JSON.stringify(errorInfo.userAgent)}`;

      wx.setClipboardData({
        data: errorText,
        success: () => {
          wx.showToast({
            title: '错误信息已复制',
            icon: 'success'
          });
        }
      });
    } catch (error) {
      console.error('[Detail] 复制错误信息失败:', error);
      wx.showToast({
        title: '复制失败',
        icon: 'none'
      });
    }
  },

  /**
   * 处理页面加载错误
   */
  handlePageLoadError(error) {
    const ErrorHandler = require('../../utils/error-handler.js');

    ErrorHandler.handleNavigationError(error, {
      page: 'knowledge/detail',
      timestamp: Date.now()
    }, {
      onRetry: () => {
        // 重新加载当前页面
        this.onLoad(this.options);
      },
      customMessage: '页面加载失败，请重试'
    });
  },

  /**
   * 设置页面标题
   */
  setPageTitle(question) {
    try {
      const title = question && question.length > 20
        ? question.substring(0, 20) + '...'
        : question || '题目详情';

      wx.setNavigationBarTitle({ title });
    } catch (error) {
      console.error('设置页面标题失败:', error);
    }
  },

  /**
   * 生成题目ID
   */
  generateQuestionId() {
    return 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  },

  /**
   * 检查会员状态（保留原方法以兼容）
   */
  async checkMemberStatus() {
    return await this.checkMemberStatusWithFallback();
  },

  /**
   * 显示会员提示（保留原方法以兼容）
   */
  showMemberRequired() {
    this.showMemberModal('not_member');
  },

  /**
   * 显示会员模态框
   */
  showMemberModal(reason = 'not_member') {
    let title = '解锁完整答案';
    let content = '联系我的微信，开始体验完整功能\n\n微信号：csuzhangleigang';

    // 根据不同原因显示不同内容
    if (reason === 'network_error') {
      title = '网络连接失败';
      content = '无法验证会员状态，请检查网络连接后重试';
    } else if (reason === 'error') {
      title = '验证失败';
      content = '会员状态验证失败，请稍后重试';
    }

    wx.showModal({
      title: title,
      content: content,
      confirmText: reason === 'network_error' ? '重试' : '复制',
      cancelText: '返回',
      success: (res) => {
        if (res.confirm) {
          if (reason === 'network_error') {
            // 重试检查会员状态
            this.retryMemberCheck();
          } else {
            // 复制微信号
            wx.setClipboardData({
              data: 'csuzhangleigang',
              success: () => {
                wx.showToast({
                  title: '微信号已复制',
                  icon: 'success'
                })
              },
              fail: () => {
                wx.showToast({
                  title: '复制失败，请重试',
                  icon: 'none'
                })
              }
            })
          }
        } else {
          // 返回上一页
          wx.navigateBack({
            delta: 1
          });
        }
      },
      fail: (error) => {
        console.error('显示会员弹窗失败:', error);
        // 降级处理：直接复制微信号
        wx.setClipboardData({
          data: 'csuzhangleigang',
          success: () => {
            wx.showToast({
              title: '微信号已复制：csuzhangleigang',
              icon: 'success',
              duration: 3000
            })
          },
          fail: () => {
            wx.showToast({
              title: '请手动复制微信号：csuzhangleigang',
              icon: 'none',
              duration: 3000
            })
          }
        })
      }
    });
  },

  /**
   * 重试会员检查
   */
  async retryMemberCheck() {
    const ErrorHandler = require('../../utils/error-handler.js');

    try {
      console.log('[Detail] 开始重试会员验证');

      // 使用增强的加载提示
      const loadingController = ErrorHandler.showProgressLoading('验证会员状态...', {
        timeout: 10000,
        steps: ['连接服务器...', '验证身份...', '检查权限...'],
        onTimeout: () => {
          this.handleMemberCheckTimeout();
        }
      });

      const memberStatus = await this.checkMemberStatusWithFallback();

      loadingController.finish();

      if (memberStatus.isValid) {
        // 会员验证成功，显示完整答案
        this.displayFullAnswer();
        ErrorHandler.showSuccess('会员验证成功');
      } else {
        // 仍然失败，显示相应提示
        this.displayMemberPrompt(memberStatus.reason);

        // 根据失败原因显示不同的用户提示
        this.handleMemberCheckFailure(memberStatus);
      }
    } catch (error) {
      console.error('[Detail] 重试会员检查失败:', error);

      // 使用增强的错误处理
      this.handleMemberCheckError(error);
    }
  },

  /**
   * 处理会员检查超时
   */
  handleMemberCheckTimeout() {
    console.warn('[Detail] 会员验证超时');

    const ErrorHandler = require('../../utils/error-handler.js');
    ErrorHandler.showUserFriendlyError('TIMEOUT', {
      customTitle: '验证超时',
      customMessage: '会员状态验证超时，可能是网络较慢或服务繁忙',
      onRetry: () => {
        this.retryMemberCheck();
      },
      showAdvancedOptions: true
    });

    // 显示会员提示（默认为非会员状态）
    this.displayMemberPrompt('timeout');
  },

  /**
   * 处理会员检查失败
   */
  handleMemberCheckFailure(memberStatus) {
    const { reason, message } = memberStatus;

    switch (reason) {
      case 'network_error':
        this.showNetworkErrorOptions();
        break;
      case 'server_error':
        wx.showToast({
          title: '服务器暂时不可用，请稍后重试',
          icon: 'none',
          duration: 3000
        });
        break;
      default:
        wx.showToast({
          title: message || '验证失败，请重试',
          icon: 'none',
          duration: 2000
        });
        break;
    }
  },

  /**
   * 处理会员检查错误
   */
  handleMemberCheckError(error) {
    const ErrorHandler = require('../../utils/error-handler.js');

    let errorType = 'MEMBER_ERROR';
    let customMessage = '会员状态验证失败';

    // 根据错误类型确定具体信息
    if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
      errorType = 'NETWORK_ERROR';
      customMessage = '网络连接失败，无法验证会员状态';
    } else if (error.statusCode >= 500) {
      errorType = 'API_ERROR';
      customMessage = '服务器暂时不可用，会员验证失败';
    } else if (error.statusCode === 401) {
      errorType = 'MEMBER_ERROR';
      customMessage = '身份验证失败，请重新登录';
    }

    ErrorHandler.showUserFriendlyError(errorType, {
      customTitle: '会员验证失败',
      customMessage: customMessage,
      onRetry: () => {
        this.retryMemberCheck();
      },
      onRefresh: () => {
        this.refreshCurrentPage();
      },
      showAdvancedOptions: true
    });

    // 显示会员提示（默认为验证失败状态）
    this.displayMemberPrompt('error');
  },

  /**
   * 显示网络错误选项
   */
  showNetworkErrorOptions() {
    wx.showModal({
      title: '网络连接问题',
      content: '网络连接不稳定，影响会员状态验证。\n\n建议：\n• 检查网络连接\n• 切换WiFi/移动网络\n• 稍后重试',
      confirmText: '重试验证',
      cancelText: '网络诊断',
      success: (res) => {
        if (res.confirm) {
          this.retryMemberCheck();
        } else {
          this.showNetworkDiagnostics();
        }
      }
    });
  },

  /**
   * 显示会员检查替代方案
   */
  showMemberCheckAlternatives() {
    wx.showActionSheet({
      itemList: [
        '重试验证',
        '网络诊断',
        '离线模式',
        '联系客服'
      ],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.retryMemberCheck();
            break;
          case 1:
            this.showNetworkDiagnostics();
            break;
          case 2:
            this.enableOfflineMode();
            break;
          case 3:
            this.contactSupport();
            break;
        }
      }
    });
  },

  /**
   * 显示网络诊断
   */
  async showNetworkDiagnostics() {
    try {
      const knowledgeApi = require('../../utils/knowledge-api.js');
      const diagnostics = knowledgeApi.getNetworkDiagnostics();
      const healthStatus = await knowledgeApi.getApiHealthStatus();

      const info = `网络诊断结果：

网络状态：${diagnostics.networkStatus.isConnected ? '已连接' : '未连接'}
网络类型：${diagnostics.networkStatus.networkType}
API健康：${healthStatus.healthy ? '正常' : '异常'}
${healthStatus.responseTime ? `响应时间：${healthStatus.responseTime}ms` : ''}

建议操作：
• 确认网络连接稳定
• 尝试切换网络环境
• 重启应用后重试`;

      wx.showModal({
        title: '网络诊断',
        content: info,
        confirmText: '重试',
        cancelText: '复制信息',
        success: (res) => {
          if (res.confirm) {
            this.retryMemberCheck();
          } else {
            wx.setClipboardData({
              data: info,
              success: () => {
                wx.showToast({
                  title: '诊断信息已复制',
                  icon: 'success'
                });
              }
            });
          }
        }
      });

    } catch (error) {
      console.error('[Detail] 网络诊断失败:', error);
      wx.showToast({
        title: '诊断失败',
        icon: 'none'
      });
    }
  },

  /**
   * 启用离线模式
   */
  enableOfflineMode() {
    wx.showModal({
      title: '离线模式',
      content: '离线模式下无法验证会员状态，将显示基本内容。\n\n确定启用离线模式吗？',
      confirmText: '启用',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 显示基本内容，不进行会员验证
          this.setData({
            showMemberPrompt: true,
            showAnswer: false,
            memberPromptReason: 'offline_mode'
          });

          wx.showToast({
            title: '已启用离线模式',
            icon: 'none'
          });
        }
      }
    });
  },

  /**
   * 联系客服
   */
  contactSupport() {
    const supportInfo = `会员验证问题

如需帮助，请联系客服：

微信：csuzhangleigang

请说明：
• 具体问题描述
• 网络环境信息
• 设备型号和系统版本`;

    wx.showModal({
      title: '联系客服',
      content: supportInfo,
      confirmText: '复制微信号',
      cancelText: '关闭',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: 'csuzhangleigang',
            success: () => {
              wx.showToast({
                title: '微信号已复制',
                icon: 'success'
              });
            }
          });
        }
      }
    });
  },

  /**
   * 处理会员提示点击
   */
  onMemberPromptTap() {
    const reason = this.data.memberPromptReason || 'not_member';
    this.showMemberModal(reason);
  },

  /**
   * 清理传递的数据
   */
  cleanupTransferredData(dataId) {
    try {
      if (dataId) {
        const DataTransferManager = require('../../utils/data-transfer.js');
        DataTransferManager.clearQuestionData(dataId);
      }

      // 清理全局数据
      const app = getApp();
      if (app && app.globalData && app.globalData.currentQuestion) {
        delete app.globalData.currentQuestion;
      }
    } catch (error) {
      console.error('清理数据失败:', error);
    }
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
/**
 * 知识库首页 - API 版本
 * 从云端 API 加载知识库数据
 */

const CONFIG = require('../../config.js');
const knowledgeApi = require('../../utils/knowledge-api.js');

// 降级方案：本地数据（已禁用以减小包体积）
// 如需使用本地数据，请取消下面的注释并设置 CONFIG.useLocalKnowledge = true
// let localKnowledge = null;
// if (CONFIG.useLocalKnowledge) {
//     localKnowledge = require('../../utils/knowledge.js');
// }

Page({
    data: {
        activeCategoryKey: 'hdfs',  // 默认显示 HDFS
        categories: [],
        topics: [],
        allQuestions: [],
        loading: true,
        error: null,
        useApi: !CONFIG.useLocalKnowledge
    },

    onLoad() {
        wx.setNavigationBarTitle({ title: '面试知识' });

        // 启动网络监控
        knowledgeApi.startNetworkMonitoring();

        this.initKnowledge();
    },

    /**
     * 初始化知识库数据
     */
    async initKnowledge() {
        try {
            this.setData({ loading: true, error: null });

            if (this.data.useApi) {
                // 使用 API 加载
                await this.loadFromApi();
            } else {
                // 使用本地数据
                this.loadFromLocal();
            }

            this.loadQuestions();
        } catch (error) {
            console.error('初始化知识库失败:', error);

            // 本地数据降级已禁用（减小包体积）
            this.setData({
                error: '加载失败，请检查网络连接或 API 配置',
                loading: false
            });
        }
    },

    /**
     * 从 API 加载数据
     */
    async loadFromApi() {
        const ErrorHandler = require('../../utils/error-handler.js');
        const loadingSteps = [
            '连接服务器...',
            '获取分类信息...',
            '加载题目数据...',
            '处理数据...'
        ];

        // 使用增强的加载管理
        const loadingController = ErrorHandler.showProgressLoading('加载知识库...', {
            timeout: 25000, // 25秒超时
            steps: loadingSteps,
            onTimeout: () => {
                this.handleLoadTimeout();
            }
        });

        try {
            // 更新加载状态
            loadingController.updateMessage('连接服务器...');

            // 获取分类（带重试和降级）
            const categories = await knowledgeApi.getCategories();

            loadingController.updateMessage('获取题目数据...');

            // 获取所有题目（带重试和降级）
            const result = await knowledgeApi.getQuestions({
                page: 1,
                pageSize: 1000  // 一次性加载所有题目
            });

            loadingController.updateMessage('处理数据...');

            // 完成加载
            loadingController.finish();

            this.setData({
                categories: categories || [],
                topics: result.list || [],
                loading: false,
                error: null
            });

            // 如果使用了降级数据，提示用户
            if (this.isUsingFallbackData(categories, result)) {
                wx.showToast({
                    title: '使用离线数据',
                    icon: 'none',
                    duration: 2000
                });
            }

            // 显示成功提示
            ErrorHandler.showSuccess('知识库加载完成', {
                duration: 1000
            });

        } catch (error) {
            console.error('[Knowledge] API加载失败:', error);

            // 使用加载控制器显示错误
            loadingController.error(error);

            // 使用增强的错误处理
            await this.handleApiLoadError(error);
            throw error;
        }
    },

    /**
     * 处理加载超时
     */
    handleLoadTimeout() {

        this.setData({
            error: '加载超时，请检查网络连接',
            loading: false
        });

        const ErrorHandler = require('../../utils/error-handler.js');
        ErrorHandler.showUserFriendlyError('TIMEOUT', {
            customTitle: '加载超时',
            customMessage: '知识库加载时间过长，可能是网络较慢',
            onRetry: () => {
                this.retryLoadApi();
            },
            onRefresh: () => {
                this.refreshPage();
            },
            showAdvancedOptions: true
        });
    },

    /**
     * 判断是否使用了降级数据
     */
    isUsingFallbackData(categories, result) {
        // 检查是否为默认数据
        if (categories && categories.length === 5 && categories[0].key === 'hdfs') {
            return true;
        }

        if (result && result.list && result.list.length === 1 &&
            result.list[0].id === 'default_1') {
            return true;
        }

        return false;
    },

    /**
     * 处理API加载错误
     */
    async handleApiLoadError(error) {
        const ErrorHandler = require('../../utils/error-handler.js');

        try {
            // 检查网络状态
            const networkStatus = await knowledgeApi.checkNetworkStatus();

            let errorType = 'API_ERROR';
            let customMessage = '知识库加载失败，请重试';

            // 根据错误类型和网络状态确定错误信息
            if (!networkStatus.isConnected) {
                errorType = 'NETWORK_ERROR';
                customMessage = '网络连接失败，请检查网络设置后重试';
            } else if (error.code === 'NETWORK_ERROR') {
                errorType = 'NETWORK_ERROR';
                customMessage = '网络不稳定，请稍后重试或切换网络';
            } else if (error.statusCode >= 500) {
                errorType = 'API_ERROR';
                customMessage = '服务器暂时不可用，我们正在努力修复';
            } else if (error.statusCode === 404) {
                errorType = 'DATA_ERROR';
                customMessage = '知识库数据不存在，请联系技术支持';
            } else {
                customMessage = error.message || '加载失败，请重试或刷新页面';
            }

            // 更新页面状态
            this.setData({
                error: customMessage,
                loading: false
            });

            // 显示增强的错误提示
            ErrorHandler.showUserFriendlyError(errorType, {
                customMessage: customMessage,
                onRetry: () => {
                    this.retryLoadApi();
                },
                onRefresh: () => {
                    this.refreshPage();
                },
                onGoBack: () => {
                    wx.switchTab({
                        url: '/pages/knowledge/index'
                    });
                },
                showAdvancedOptions: true
            });

        } catch (networkError) {
            console.error('[Knowledge] 网络状态检查失败:', networkError);

            // 网络检查失败，显示通用错误
            this.setData({
                error: '加载失败，请检查网络连接',
                loading: false
            });

            ErrorHandler.showUserFriendlyError('NETWORK_ERROR', {
                customMessage: '网络连接异常，请检查网络设置',
                onRetry: () => {
                    this.retryLoadApi();
                },
                showAdvancedOptions: true
            });
        }
    },

    /**
     * 刷新页面
     */
    refreshPage() {
        wx.reLaunch({
            url: '/pages/knowledge/index'
        });
    },

    /**
     * 重试API加载
     */
    async retryLoadApi() {
        const ErrorHandler = require('../../utils/error-handler.js');

        try {

            this.setData({
                loading: true,
                error: null
            });

            // 使用重试机制
            await ErrorHandler.retryOperation(async () => {
                return await this.loadFromApi();
            }, {
                configType: 'api',
                onRetry: (attempt, delay, error) => {
                    wx.showToast({
                        title: `重试中... (${attempt}/3)`,
                        icon: 'loading',
                        duration: delay
                    });
                },
                onFinalFailure: (error) => {
                    console.error('[Knowledge] 所有重试都失败:', error);
                    this.handleRetryFailure(error);
                }
            });

            // 重试成功
            ErrorHandler.showSuccess('重新加载成功');

        } catch (error) {
            console.error('[Knowledge] 重试加载失败:', error);
            // 错误已在 onFinalFailure 中处理
        }
    },

    /**
     * 处理重试失败
     */
    handleRetryFailure(error) {
        const ErrorHandler = require('../../utils/error-handler.js');

        this.setData({
            error: '多次重试失败，请检查网络或稍后再试',
            loading: false
        });

        ErrorHandler.showUserFriendlyError(error, {
            customTitle: '重试失败',
            customMessage: '已尝试多次重新加载，仍然失败。可能是网络问题或服务异常。',
            onRefresh: () => {
                this.refreshPage();
            },
            onGoBack: () => {
                // 显示更多恢复选项
                this.showLoadAlternatives();
            },
            showAdvancedOptions: true
        });
    },

    /**
     * 显示加载替代方案
     */
    showLoadAlternatives() {
        wx.showActionSheet({
            itemList: [
                '检查网络连接',
                '使用离线模式',
                '清理缓存重试',
                '联系技术支持'
            ],
            success: (res) => {
                switch (res.tapIndex) {
                    case 0:
                        this.showNetworkDiagnostics();
                        break;
                    case 1:
                        this.enableOfflineMode();
                        break;
                    case 2:
                        this.clearCacheAndRetry();
                        break;
                    case 3:
                        this.showTechnicalSupport();
                        break;
                }
            }
        });
    },

    /**
     * 显示网络诊断信息
     */
    async showNetworkDiagnostics() {
        try {
            const diagnostics = knowledgeApi.getNetworkDiagnostics();
            const healthStatus = await knowledgeApi.getApiHealthStatus();

            const info = `网络诊断信息：
            
网络状态：${diagnostics.networkStatus.isConnected ? '已连接' : '未连接'}
网络类型：${diagnostics.networkStatus.networkType}
API状态：${healthStatus.healthy ? '正常' : '异常'}
${healthStatus.responseTime ? `响应时间：${healthStatus.responseTime}ms` : ''}

建议：
• 确认网络连接正常
• 尝试切换WiFi/移动网络
• 检查防火墙设置`;

            wx.showModal({
                title: '网络诊断',
                content: info,
                confirmText: '重试连接',
                cancelText: '复制信息',
                success: (res) => {
                    if (res.confirm) {
                        this.retryLoadApi();
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
            console.error('[Knowledge] 网络诊断失败:', error);
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
            content: '离线模式将使用本地缓存的数据，可能不是最新内容。\n\n确定启用离线模式吗？',
            confirmText: '启用',
            cancelText: '取消',
            success: (res) => {
                if (res.confirm) {
                    this.loadOfflineData();
                }
            }
        });
    },

    /**
     * 加载离线数据
     */
    async loadOfflineData() {
        try {
            wx.showLoading({
                title: '加载离线数据...',
                mask: true
            });

            // 尝试从缓存获取数据
            const categories = knowledgeApi.getCache('categories') || [];
            const questionsCache = knowledgeApi.getCache('questions_all_1_1000_') || { list: [] };

            wx.hideLoading();

            if (categories.length > 0 || questionsCache.list.length > 0) {
                this.setData({
                    categories: categories,
                    topics: questionsCache.list,
                    loading: false,
                    error: null
                });

                wx.showToast({
                    title: '离线数据加载成功',
                    icon: 'success'
                });

                this.loadQuestions();
            } else {
                wx.showToast({
                    title: '没有可用的离线数据',
                    icon: 'none'
                });
            }

        } catch (error) {
            wx.hideLoading();
            console.error('[Knowledge] 离线数据加载失败:', error);
            wx.showToast({
                title: '离线数据加载失败',
                icon: 'none'
            });
        }
    },

    /**
     * 清理缓存并重试
     */
    async clearCacheAndRetry() {
        try {
            wx.showLoading({
                title: '清理缓存中...',
                mask: true
            });

            // 清理知识库缓存
            knowledgeApi.clearCache();

            // 等待一下再重试
            await new Promise(resolve => setTimeout(resolve, 1000));

            wx.hideLoading();

            // 重新加载
            await this.initKnowledge();

            wx.showToast({
                title: '缓存清理完成',
                icon: 'success'
            });

        } catch (error) {
            wx.hideLoading();
            console.error('[Knowledge] 清理缓存失败:', error);
            wx.showToast({
                title: '清理缓存失败',
                icon: 'none'
            });
        }
    },

    /**
     * 显示技术支持信息
     */
    showTechnicalSupport() {
        const supportInfo = `技术支持

如果问题持续存在，请联系技术支持：

微信：csuzhangleigang
邮箱：support@example.com

请提供以下信息：
• 设备型号和系统版本
• 网络环境（WiFi/移动网络）
• 错误发生时间
• 具体错误信息`;

        wx.showModal({
            title: '技术支持',
            content: supportInfo,
            confirmText: '复制',
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
     * 从本地加载数据（已禁用以减小包体积）
     */
    loadFromLocal() {
        throw new Error('本地数据已禁用，请使用 API 模式');
    },

    // 跳转到使用指南
    goGuide() {
        wx.navigateTo({
            url: '/pages/guide/index'
        })
    },

    /**
     * 切换分类
     */
    switchCategory(e) {
        const key = e.currentTarget.dataset.key;
        if (!key || key === this.data.activeCategoryKey) return;

        this.setData({ activeCategoryKey: key });
        this.loadQuestions();
    },

    /**
     * 加载当前分类的题目
     */
    loadQuestions() {
        const active = this.data.activeCategoryKey;
        const topics = this.data.topics || [];

        // 筛选符合条件的主题
        const filteredTopics = topics.filter(t => t.categoryKey === active);

        // 将所有问题展平成一个列表
        const allQuestions = [];
        filteredTopics.forEach((topic) => {
            if (topic.faqs && topic.answers) {
                topic.faqs.forEach((question, index) => {
                    const answer = topic.answers[index] || '答案加载中...';
                    allQuestions.push({
                        id: `${topic.id}-${index}`,
                        question: question,
                        answer: answer,
                        expanded: false
                    });
                });
            }
        });

        this.setData({ allQuestions });
    },

    /**
     * 查看题目详情
     */
    viewDetail(e) {
        const { index } = e.currentTarget.dataset;
        const question = this.data.allQuestions[index];

        if (!question) {
            wx.showToast({
                title: '题目不存在',
                icon: 'none'
            });
            return;
        }

        // 使用增强的跳转逻辑
        this.navigateToDetail(question, e);
    },

    /**
     * 增强的页面跳转逻辑
     * 实现多重存储、详细错误处理和重试机制
     */
    async navigateToDetail(question, originalEvent, retryCount = 0) {
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 1000;

        try {
            const DataTransferManager = require('../../utils/data-transfer.js');
            const ErrorHandler = require('../../utils/error-handler.js');

            // 添加分类信息和时间戳
            const questionWithCategory = {
                ...question,
                category: this.data.activeCategoryKey,
                categoryName: this.getCategoryName(this.data.activeCategoryKey),
                timestamp: Date.now(),
                source: 'knowledge_list'
            };

            // 记录跳转尝试
            this.logNavigationAttempt({
                questionId: question.id,
                category: this.data.activeCategoryKey,
                retryCount
            });

            // 使用多重存储策略
            const navigationData = await this.prepareNavigationData(questionWithCategory);

            // 执行跳转
            await this.executeNavigation(navigationData, originalEvent, retryCount);

        } catch (error) {
            console.error(`[Navigation] 跳转失败 (第${retryCount + 1}次):`, error);

            // 记录详细错误日志
            this.logNavigationError(error, question, retryCount);

            // 判断是否需要重试
            if (retryCount < MAX_RETRIES && this.isRetryableError(error)) {

                // 显示重试提示
                if (retryCount === 0) {
                    wx.showToast({
                        title: '跳转中，请稍候...',
                        icon: 'loading',
                        duration: RETRY_DELAY
                    });
                }

                // 延迟重试
                setTimeout(() => {
                    this.navigateToDetail(question, originalEvent, retryCount + 1);
                }, RETRY_DELAY);

            } else {
                // 达到最大重试次数或不可重试的错误，使用降级方案
                this.handleNavigationFailure(error, question, retryCount);
            }
        }
    },

    /**
     * 准备跳转数据（多重存储）
     */
    async prepareNavigationData(questionData) {
        const DataTransferManager = require('../../utils/data-transfer.js');

        try {
            // 1. 存储到数据传递管理器（包含全局变量和本地存储）
            const dataId = DataTransferManager.setQuestionData(questionData);

            // 2. 创建安全的跳转URL
            const { url } = DataTransferManager.createSafeNavigationUrl(
                '/pages/knowledge/detail',
                questionData
            );

            // 3. 准备降级URL（包含关键参数）
            const fallbackUrl = this.createFallbackUrl(questionData);

            // 4. 额外存储到应用全局数据（双重保险）
            const app = getApp();
            if (app) {
                app.globalData = app.globalData || {};
                app.globalData.currentQuestion = questionData;
                app.globalData.navigationTimestamp = Date.now();
            }

            return {
                primaryUrl: url,
                fallbackUrl: fallbackUrl,
                dataId: dataId,
                questionData: questionData
            };

        } catch (error) {
            console.error('[Navigation] 准备跳转数据失败:', error);
            throw new Error('DATA_PREPARATION_FAILED');
        }
    },

    /**
     * 执行页面跳转
     */
    async executeNavigation(navigationData, originalEvent, retryCount) {
        return new Promise((resolve, reject) => {
            const { primaryUrl, fallbackUrl, questionData } = navigationData;

            // 尝试主要跳转方式
            wx.navigateTo({
                url: primaryUrl,
                success: (res) => {
                    resolve(res);
                },
                fail: (error) => {

                    // 尝试降级跳转
                    wx.navigateTo({
                        url: fallbackUrl,
                        success: (res) => {
                            resolve(res);
                        },
                        fail: (fallbackError) => {
                            console.error('[Navigation] 降级跳转也失败:', fallbackError);

                            // 尝试最后的兜底方案
                            this.tryEmergencyNavigation(questionData)
                                .then(resolve)
                                .catch(reject);
                        }
                    });
                }
            });
        });
    },

    /**
     * 紧急跳转方案（最后兜底）
     */
    async tryEmergencyNavigation(questionData) {
        return new Promise((resolve, reject) => {

            // 使用最简单的URL，只传递必要参数
            const emergencyUrl = `/pages/knowledge/detail?id=${encodeURIComponent(questionData.id)}&emergency=true`;

            wx.navigateTo({
                url: emergencyUrl,
                success: (res) => {
                    resolve(res);
                },
                fail: (error) => {
                    console.error('[Navigation] 紧急跳转失败:', error);
                    reject(new Error('ALL_NAVIGATION_METHODS_FAILED'));
                }
            });
        });
    },

    /**
     * 创建降级URL
     */
    createFallbackUrl(questionData) {
        const baseUrl = '/pages/knowledge/detail';
        const params = [];

        // 添加关键参数
        if (questionData.id) params.push(`id=${encodeURIComponent(questionData.id)}`);
        if (questionData.category) params.push(`category=${encodeURIComponent(questionData.category)}`);
        if (questionData.question) {
            // 限制问题长度以避免URL过长
            const shortQuestion = questionData.question.length > 100
                ? questionData.question.substring(0, 100) + '...'
                : questionData.question;
            params.push(`question=${encodeURIComponent(shortQuestion)}`);
        }

        return params.length > 0 ? `${baseUrl}?${params.join('&')}` : baseUrl;
    },

    /**
     * 判断是否为可重试的错误
     */
    isRetryableError(error) {
        if (!error) return false;

        const retryableErrors = [
            'DATA_PREPARATION_FAILED',
            'NAVIGATION_TIMEOUT',
            'NETWORK_ERROR',
            'TEMPORARY_FAILURE'
        ];

        const errorMessage = error.message || error.toString();

        return retryableErrors.some(retryableError =>
            errorMessage.includes(retryableError)
        ) || errorMessage.includes('fail');
    },

    /**
     * 记录跳转尝试日志
     */
    logNavigationAttempt(attemptData) {
        try {
            // 简单的尝试记录，不做复杂处理
            // 在生产环境中可以发送到分析服务
        } catch (error) {
            // 静默失败，不影响主要功能
        }
    },

    /**
     * 记录跳转错误日志
     */
    logNavigationError(error, question, retryCount) {
        const errorLog = {
            type: 'navigation_error',
            error: error.message || error.toString(),
            context: {
                questionId: question.id,
                category: this.data.activeCategoryKey,
                retryCount: retryCount,
                timestamp: Date.now(),
                userAgent: wx.getSystemInfoSync()
            }
        };

        console.error('[Navigation Error Log]', errorLog);

        // 保存到本地存储用于调试
        try {
            const logs = wx.getStorageSync('navigation_error_logs') || [];
            logs.push(errorLog);

            // 限制日志数量
            if (logs.length > 50) {
                logs.splice(0, logs.length - 50);
            }

            wx.setStorageSync('navigation_error_logs', logs);
        } catch (storageError) {
            console.error('[Navigation] 保存错误日志失败:', storageError);
        }
    },

    /**
     * 处理跳转失败
     */
    handleNavigationFailure(error, question, retryCount) {

        // 根据错误类型确定错误信息
        let customMessage = '页面跳转失败，请重试';

        if (error && error.message === 'ALL_NAVIGATION_METHODS_FAILED') {
            customMessage = '页面跳转遇到问题，可能是系统繁忙或数据异常';
        } else if (error && error.message === 'DATA_PREPARATION_FAILED') {
            customMessage = '数据准备失败，请检查网络连接后重试';
        }

        // 记录跳转失败统计
        this.recordNavigationFailure(error, question, retryCount);

        // 显示用户友好的错误提示
        wx.showModal({
            title: '页面跳转失败',
            content: `${customMessage}\n\n已尝试 ${retryCount + 1} 次，您可以：\n1. 重试跳转\n2. 刷新页面\n3. 返回重新选择`,
            confirmText: '重试',
            cancelText: '更多选项',
            success: (res) => {
                if (res.confirm) {
                    // 重试
                    this.navigateToDetail(question, null, 0);
                } else {
                    // 显示其他选项
                    this.showNavigationAlternatives(question);
                }
            }
        });
    },

    /**
     * 记录跳转失败统计
     */
    recordNavigationFailure(error, question, retryCount) {
        try {
            const failureRecord = {
                timestamp: Date.now(),
                error: error.message || error.toString(),
                questionId: question.id,
                retryCount: retryCount,
                userAgent: wx.getSystemInfoSync()
            };

            // 保存到本地存储用于分析
            const failures = wx.getStorageSync('navigation_failures') || [];
            failures.push(failureRecord);

            // 限制记录数量
            if (failures.length > 20) {
                failures.splice(0, failures.length - 20);
            }

            wx.setStorageSync('navigation_failures', failures);

        } catch (storageError) {
            console.error('[Navigation] 保存失败记录出错:', storageError);
        }
    },

    /**
     * 显示跳转替代方案
     */
    showNavigationAlternatives(question) {
        wx.showActionSheet({
            itemList: ['刷新当前页面', '返回首页', '复制题目内容'],
            success: (res) => {
                switch (res.tapIndex) {
                    case 0:
                        // 刷新当前页面
                        this.reload();
                        break;
                    case 1:
                        // 返回首页
                        wx.switchTab({
                            url: '/pages/knowledge/index'
                        });
                        break;
                    case 2:
                        // 复制题目内容
                        wx.setClipboardData({
                            data: question.question,
                            success: () => {
                                wx.showToast({
                                    title: '题目已复制',
                                    icon: 'success'
                                });
                            }
                        });
                        break;
                }
            }
        });
    },

    /**
     * 降级跳转方案（保留兼容性）
     * 注意：此方法已被新的 navigateToDetail 方法替代
     */
    fallbackNavigation(question) {

        // 直接调用新的跳转方法
        this.navigateToDetail(question, null, 0);
    },

    /**
     * 切换问题展开/收起
     */
    toggleQuestion(e) {
        const { id } = e.currentTarget.dataset;
        const questions = this.data.allQuestions.map(q => {
            if (q.id === id) {
                return { ...q, expanded: !q.expanded };
            }
            return q;
        });

        this.setData({ allQuestions: questions });
    },

    /**
     * 获取分类名称
     */
    getCategoryName(categoryKey) {
        const category = this.data.categories.find(c => c.key === categoryKey);
        return category ? category.name : categoryKey;
    },

    /**
     * 重新加载
     */
    async reload() {
        await this.initKnowledge();
    },

    /**
     * 下拉刷新
     */
    async onPullDownRefresh() {
        try {
            await this.initKnowledge();
            wx.showToast({
                title: '刷新成功',
                icon: 'success'
            });
        } catch (error) {
            wx.showToast({
                title: '刷新失败',
                icon: 'none'
            });
        } finally {
            wx.stopPullDownRefresh();
        }
    },

    /**
     * 页面显示时的处理
     */
    onShow() {
        // 清理过期的数据传递缓存
        this.cleanupExpiredData();

        // 检查是否需要恢复跳转状态
        this.checkPendingNavigation();
    },

    /**
     * 页面隐藏时的处理
     */
    onHide() {
        // 清理定时器和临时数据
        this.cleanupTemporaryData();
    },

    /**
     * 页面卸载时的处理
     */
    onUnload() {
        // 清理所有临时数据和监听器
        this.cleanupAllData();
    },

    /**
     * 清理过期数据
     */
    cleanupExpiredData() {
        try {
            const DataTransferManager = require('../../utils/data-transfer.js');
            DataTransferManager.cleanupExpiredData();
        } catch (error) {
            console.error('[Cleanup] 清理过期数据失败:', error);
        }
    },

    /**
     * 检查待处理的跳转
     */
    checkPendingNavigation() {
        try {
            const app = getApp();
            if (app && app.globalData && app.globalData.pendingNavigation) {
                const { question, timestamp } = app.globalData.pendingNavigation;

                // 检查是否在合理时间内
                if (Date.now() - timestamp < 30000) { // 30秒内
                    this.navigateToDetail(question, null, 0);
                }

                // 清理待处理状态
                delete app.globalData.pendingNavigation;
            }
        } catch (error) {
            console.error('[Navigation] 检查待处理跳转失败:', error);
        }
    },

    /**
     * 清理临时数据
     */
    cleanupTemporaryData() {
        try {
            // 清理导航相关的临时数据
            const app = getApp();
            if (app && app.globalData) {
                delete app.globalData.navigationTimestamp;
                delete app.globalData.retryCount;
            }
        } catch (error) {
            console.error('[Cleanup] 清理临时数据失败:', error);
        }
    },

    /**
     * 清理所有数据
     */
    cleanupAllData() {
        try {
            this.cleanupTemporaryData();
            this.cleanupExpiredData();

            // 清理错误日志（保留最近的）
            const logs = wx.getStorageSync('navigation_error_logs') || [];
            if (logs.length > 10) {
                const recentLogs = logs.slice(-10);
                wx.setStorageSync('navigation_error_logs', recentLogs);
            }
        } catch (error) {
            console.error('[Cleanup] 清理所有数据失败:', error);
        }
    },

    /**
     * 获取跳转统计信息（用于调试）
     */
    getNavigationStats() {
        try {
            const DataTransferManager = require('../../utils/data-transfer.js');
            const stats = DataTransferManager.getStats();

            const logs = wx.getStorageSync('navigation_error_logs') || [];
            const recentErrors = logs.filter(log =>
                Date.now() - log.context.timestamp < 24 * 60 * 60 * 1000 // 24小时内
            );

            return {
                dataTransfer: stats,
                errorCount: recentErrors.length,
                lastError: recentErrors[recentErrors.length - 1] || null
            };
        } catch (error) {
            console.error('[Stats] 获取统计信息失败:', error);
            return null;
        }
    },

    /**
     * 测试跳转功能（开发调试用）
     */
    testNavigation() {
        if (this.data.allQuestions && this.data.allQuestions.length > 0) {
            const testQuestion = this.data.allQuestions[0];
            this.navigateToDetail(testQuestion, null, 0);
        }
    },

    /**
     * 分享配置 - 知识库列表页
     */
    onShareAppMessage(options) {
        const { from, target } = options || {};
        const { activeCategoryKey, categories, allQuestions } = this.data;

        // 检测分享目标类型
        const isGroupShare = target && target.includes('group');

        // 获取当前分类信息
        const currentCategory = categories.find(c => c.key === activeCategoryKey);
        const categoryName = currentCategory ? currentCategory.name : '大数据面试';
        const questionCount = allQuestions ? allQuestions.length : 0;

        // 构建分享路径
        const sharePath = `/pages/knowledge/index?from=share&category=${activeCategoryKey}&target=${isGroupShare ? 'group' : 'private'}`;

        if (isGroupShare) {
            // 群聊分享 - 强调学习价值和题目数量
            return {
                title: `${categoryName}面试题库 - ${questionCount}道精选题目，群友一起刷题提升！`,
                path: sharePath,
                imageUrl: '' // 使用默认分享图片
            };
        } else {
            // 私聊分享 - 个人推荐
            if (questionCount > 0) {
                return {
                    title: `推荐${categoryName}面试题库 - ${questionCount}道精选题目，助你面试成功！`,
                    path: sharePath,
                    imageUrl: '' // 使用默认分享图片
                };
            } else {
                return {
                    title: `大数据面试题库 - 精选面试题目，提升面试竞争力！`,
                    path: sharePath,
                    imageUrl: '' // 使用默认分享图片
                };
            }
        }
    }
});

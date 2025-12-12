/**
 * 添加自定义问题弹窗组件
 * 支持输入问题、AI生成答案（流式）、添加标签、保存到收藏
 */

const favoritesApi = require('../../utils/favorites-api');
const errorHandler = require('../../utils/error-handler');
const haptic = require('../../utils/haptic');

Component({
    properties: {
        // 是否显示弹窗
        show: {
            type: Boolean,
            value: false
        },
        // 用户OpenID
        openid: {
            type: String,
            value: ''
        },
        // 配额信息（可选，用于前端验证）
        quotaInfo: {
            type: Object,
            value: null
        }
    },

    data: {
        // 问题输入
        question: '',
        questionError: '',

        // AI答案生成
        answer: '',
        isGenerating: false,
        generateProgress: 0,

        // 标签管理
        tags: [],
        tagInput: '',
        tagError: '',

        // 保存状态
        isSaving: false,

        // 流式请求控制
        generateTask: null,

        // 内部状态：记录当前弹窗显示状态
        _lastShowState: false
    },

    lifetimes: {
        // 组件生命周期函数，组件实例进入页面节点树时执行
        attached() {
            // 初始化时记录初始状态
            this.setData({
                _lastShowState: this.properties.show
            });
        }
    },

    observers: {
        'show': function (show) {
            // 只有当show状态真正改变时才执行操作
            if (show !== this.data._lastShowState) {
                if (show) {
                    // 弹窗从关闭变为打开，立即重置状态
                    this.setData({
                        _lastShowState: show,
                        question: '',
                        questionError: '',
                        answer: '',
                        isGenerating: false,
                        generateProgress: 0,
                        tags: [],
                        tagInput: '',
                        tagError: '',
                        isSaving: false,
                        generateTask: null
                    });
                } else {
                    // 弹窗从打开变为关闭，只更新状态标志
                    this.setData({
                        _lastShowState: show
                    });
                }
            }
        }
    },

    methods: {
        /**
         * 关闭弹窗
         */
        close() {
            // 如果正在生成，先取消
            if (this.data.generateTask) {
                this.data.generateTask.abort();
            }

            // 重置所有状态
            this.setData({
                question: '',
                questionError: '',
                answer: '',
                isGenerating: false,
                generateProgress: 0,
                tags: [],
                tagInput: '',
                tagError: '',
                isSaving: false,
                generateTask: null
            });

            this.triggerEvent('close');
        },

        /**
         * 输入问题
         */
        onQuestionInput(e) {
            // 兼容微信小程序textarea不同版本的input事件
            let inputValue;
            if (e && e.detail) {
                inputValue = e.detail.value !== undefined ? e.detail.value : e.detail;
            }

            const question = typeof inputValue === 'string' ? inputValue : '';

            this.setData({
                question: question,
                questionError: '' // 输入时清除错误
            });
        },

        /**
         * 问题输入框获得焦点
         */
        onQuestionFocus() {
            // 获得焦点时清除错误提示
            this.setData({
                questionError: ''
            });
        },

        /**
         * 问题输入框失去焦点
         */
        onQuestionBlur() {
            // 失去焦点时不做验证，只在点击生成按钮时验证
        },

        /**
         * 验证问题
         */
        validateQuestion() {
            const question = (this.data.question || '').trim();

            if (!question) {
                this.setData({
                    questionError: '请输入问题'
                });
                return false;
            }

            if (question.length < 5) {
                this.setData({
                    questionError: '问题至少需要5个字符'
                });
                return false;
            }

            // 清除错误提示
            this.setData({
                questionError: ''
            });

            return true;
        },

        /**
         * 生成AI答案
         */
        generateAnswer() {
            // 验证问题
            if (!this.validateQuestion()) {
                return;
            }

            // 检查OpenID
            if (!this.properties.openid) {
                wx.showToast({
                    title: '请先登录',
                    icon: 'none'
                });
                return;
            }

            // 开始生成
            this.setData({
                isGenerating: true,
                answer: '',
                generateProgress: 0
            });

            const question = this.data.question.trim();

            // 调用流式API
            const generateTask = favoritesApi.generateAnswer(
                question,
                this.properties.openid,
                // onChunk - 接收数据块
                (chunk) => {
                    const newAnswer = this.data.answer + chunk;
                    const progress = Math.min(90, this.data.generateProgress + 5);

                    this.setData({
                        answer: newAnswer,
                        generateProgress: progress
                    });
                },
                // onComplete - 完成
                (fullAnswer) => {
                    this.setData({
                        answer: fullAnswer,
                        isGenerating: false,
                        generateProgress: 100,
                        generateTask: null
                    });

                    wx.showToast({
                        title: '生成完成',
                        icon: 'success'
                    });

                    // 成功触觉反馈
                    haptic.success();
                },
                // onError - 错误
                (error, retryable) => {
                    this.setData({
                        isGenerating: false,
                        generateTask: null
                    });

                    // 使用统一错误处理
                    if (retryable) {
                        errorHandler.showError(error, {
                            onRetry: () => this.generateAnswer(),
                            customMessage: '生成答案失败'
                        });
                    } else {
                        errorHandler.showError(error, {
                            showRetry: false,
                            customMessage: error.message || '生成答案失败'
                        });
                    }
                }
            );

            // 保存任务引用，用于取消
            this.setData({
                generateTask
            });
        },

        /**
         * 取消生成
         */
        cancelGenerate() {
            if (this.data.generateTask) {
                this.data.generateTask.abort();
            }

            this.setData({
                isGenerating: false,
                generateTask: null
            });

            wx.showToast({
                title: '已取消',
                icon: 'none'
            });
        },

        /**
         * 输入标签
         */
        onTagInput(e) {
            this.setData({
                tagInput: e.detail.value,
                tagError: ''
            });
        },

        /**
         * 添加标签
         */
        addTag() {
            const tagName = this.data.tagInput.trim();

            // 验证标签
            if (!tagName) {
                this.setData({
                    tagError: '请输入标签名称'
                });
                return;
            }

            if (tagName.length > 10) {
                this.setData({
                    tagError: '标签名称不能超过10个字符'
                });
                return;
            }

            // 检查是否已存在
            if (this.data.tags.includes(tagName)) {
                this.setData({
                    tagError: '标签已存在'
                });
                return;
            }

            // 添加标签
            this.setData({
                tags: [...this.data.tags, tagName],
                tagInput: '',
                tagError: ''
            });
        },

        /**
         * 删除标签
         */
        removeTag(e) {
            const { index } = e.currentTarget.dataset;
            const tags = this.data.tags.filter((_, i) => i !== index);

            this.setData({
                tags
            });
        },

        /**
         * 保存到收藏
         */
        async saveToFavorites() {
            // 验证问题
            if (!this.validateQuestion()) {
                return;
            }

            // 检查是否已生成答案
            if (!this.data.answer) {
                wx.showToast({
                    title: '请先生成答案',
                    icon: 'none'
                });
                return;
            }

            // 检查OpenID
            if (!this.properties.openid) {
                wx.showToast({
                    title: '请先登录',
                    icon: 'none'
                });
                return;
            }

            try {
                this.setData({
                    isSaving: true
                });

                // 调用创建收藏API
                const result = await favoritesApi.createFavorite({
                    openid: this.properties.openid,
                    question: this.data.question.trim(),
                    answer: this.data.answer,
                    sourceType: 'custom',
                    tags: this.data.tags
                });

                if (result.success) {
                    wx.showToast({
                        title: '保存成功',
                        icon: 'success'
                    });

                    // 成功触觉反馈
                    haptic.success();

                    // 触发保存成功事件
                    this.triggerEvent('saved', {
                        favoriteId: result.favoriteId
                    });

                    // 延迟关闭弹窗
                    setTimeout(() => {
                        this.close();
                    }, 1500);
                } else {
                    // 检查是否是配额错误
                    if (result.code === 'QUOTA_EXCEEDED' || result.error === 'QUOTA_EXCEEDED') {
                        // 触发配额超限事件，让父组件处理
                        this.triggerEvent('quotaExceeded', {
                            current: result.current,
                            limit: result.limit
                        });
                        this.close();
                    } else {
                        throw new Error(result.message || result.error || '保存失败');
                    }
                }
            } catch (error) {
                // 使用统一错误处理
                errorHandler.showError(error, {
                    onRetry: () => this.saveToFavorites(),
                    customMessage: '保存失败'
                });
            } finally {
                this.setData({
                    isSaving: false
                });
            }
        }
    }
});

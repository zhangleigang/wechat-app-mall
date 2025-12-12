/**
 * 收藏详情页面
 * 显示完整的问题和答案，支持标签管理、删除、分享功能
 */

const towxml = require('../../components/towxml-dist/index.js');
const SimpleAuth = require('../../utils/simpleAuth');
const favoritesApi = require('../../utils/favorites-api');
const errorHandler = require('../../utils/error-handler');
const haptic = require('../../utils/haptic');

Page({
    data: {
        // 收藏详情
        favorite: null,
        answerHtml: null,  // towxml渲染后的对象

        // 标签管理
        showTagInput: false,
        newTagName: '',
        maxTags: 5,

        // 编辑相关
        isEditing: false,
        editedQuestion: '',

        // 删除相关
        showDeleteToast: false,
        deleteTimer: null,
        undoSeconds: 5,
        deletedFavorite: null,  // 保存已删除的收藏，用于撤销

        // 更多操作
        showMoreActions: false,

        // 状态
        loading: true,
        isLogined: false,
        openid: '',

        // 页面参数
        favoriteId: null
    },

    onLoad(options) {
        const { id } = options;

        if (!id) {
            wx.showToast({
                title: '参数错误',
                icon: 'none'
            });
            setTimeout(() => {
                wx.navigateBack();
            }, 1500);
            return;
        }

        this.setData({
            favoriteId: parseInt(id)
        });

        this.checkLoginAndLoad();
    },

    onUnload() {
        // 清除删除定时器
        if (this.data.deleteTimer) {
            clearTimeout(this.data.deleteTimer);
        }
    },

    /**
     * 检查登录并加载详情
     */
    async checkLoginAndLoad() {
        try {
            const isLogined = await SimpleAuth.checkHasLogined();
            const openid = wx.getStorageSync('openid');

            this.setData({
                isLogined,
                openid
            });

            if (isLogined && openid) {
                await this.loadDetail();
            } else {
                wx.showToast({
                    title: '请先登录',
                    icon: 'none'
                });
                setTimeout(() => {
                    wx.navigateBack();
                }, 1500);
            }
        } catch (error) {
            console.error('检查登录失败:', error);
            wx.showToast({
                title: '加载失败',
                icon: 'none'
            });
        }
    },

    /**
     * 加载收藏详情
     */
    async loadDetail() {
        try {
            this.setData({ loading: true });

            const result = await favoritesApi.getFavoriteDetail(
                this.data.favoriteId,
                this.data.openid
            );

            if (result.success) {
                const favorite = result.favorite;

                // 使用towxml渲染Markdown答案
                // towxml会自动处理代码块、标题、列表、链接等Markdown语法
                const answerHtml = towxml(favorite.answer || '', 'markdown');

                // 格式化时间显示
                const formattedTime = this.formatTime(favorite.created_at || favorite.createdAt);

                this.setData({
                    favorite: {
                        ...favorite,
                        formattedTime
                    },
                    answerHtml,
                    loading: false
                });

                // 设置页面标题
                wx.setNavigationBarTitle({
                    title: '收藏详情'
                });
            } else {
                throw new Error(result.message || '加载失败');
            }
        } catch (error) {
            console.error('加载收藏详情失败:', error);

            // 使用统一错误处理，提供重试选项
            errorHandler.showError(error, {
                onRetry: () => this.loadDetail(),
                customMessage: '加载详情失败'
            });

            this.setData({ loading: false });

            // 如果是内容不存在错误，返回上一页
            if (error.code === 'NOT_FOUND') {
                setTimeout(() => {
                    wx.navigateBack();
                }, 1500);
            }
        }
    },

    /**
     * 格式化时间
     */
    formatTime(timestamp) {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day} ${hour}:${minute}`;
    },

    /**
     * 显示添加标签输入框
     */
    showAddTag() {
        this.setData({
            showTagInput: true,
            newTagName: ''  // 清空输入框，准备新的输入
        });
    },

    /**
     * 隐藏添加标签输入框
     */
    hideAddTag() {
        this.setData({
            showTagInput: false,
            newTagName: ''
        });
    },

    /**
     * 标签名称输入（原生input事件）
     */
    onTagNameInput(e) {
        const newValue = e.detail.value || '';
        this.setData({
            newTagName: newValue
        });
    },

    /**
     * 添加标签
     */
    async addTag() {
        const { newTagName, favorite, openid } = this.data;

        // 验证标签名称
        if (!newTagName || newTagName.trim() === '') {
            wx.showToast({
                title: '标签名称不能为空',
                icon: 'none'
            });
            return;
        }

        if (newTagName.length > 10) {
            wx.showToast({
                title: '标签名称不能超过10个字符',
                icon: 'none'
            });
            return;
        }

        // 检查是否已存在相同标签
        const existingTag = favorite.tags.find(tag => tag.name === newTagName.trim());
        if (existingTag) {
            wx.showToast({
                title: '标签已存在',
                icon: 'none'
            });
            return;
        }

        try {
            wx.showLoading({ title: '添加中...' });

            const result = await favoritesApi.addTag(
                favorite.id,
                newTagName.trim(),
                openid
            );

            wx.hideLoading();

            if (result.success) {
                // 立即更新本地标签列表 - 实时UI更新
                const newTag = {
                    id: result.tagId,
                    name: newTagName.trim()
                };

                // 使用深拷贝确保数据更新触发视图刷新
                const updatedFavorite = {
                    ...favorite,
                    tags: [...favorite.tags, newTag]
                };

                this.setData({
                    favorite: updatedFavorite,
                    showTagInput: false,
                    newTagName: ''
                });

                wx.showToast({
                    title: '添加成功',
                    icon: 'success'
                });

                // 成功触觉反馈
                haptic.success();

                // 通知收藏列表页面刷新标签列表
                const pages = getCurrentPages();
                if (pages.length > 1) {
                    const prevPage = pages[pages.length - 2];
                    if (prevPage.route === 'pages/favorites/index' && prevPage.loadTags) {
                        // 强制刷新标签列表，跳过缓存
                        prevPage.loadTags(true);
                    }
                }
            } else {
                throw new Error(result.message || '添加失败');
            }
        } catch (error) {
            console.error('添加标签失败:', error);

            wx.hideLoading();

            // 使用统一错误处理
            errorHandler.showError(error, {
                onRetry: () => this.addTag(),
                customMessage: '添加标签失败'
            });
        }
    },

    /**
     * 删除标签
     */
    async removeTag(e) {
        const { tagId, tagName } = e.currentTarget.dataset;
        const { favorite, openid } = this.data;

        try {
            const res = await new Promise((resolve) => {
                wx.showModal({
                    title: '确认删除',
                    content: `确定要删除标签"${tagName}"吗？`,
                    confirmText: '删除',
                    confirmColor: '#ee0a24',
                    success: resolve
                });
            });

            if (!res.confirm) {
                return;
            }

            wx.showLoading({ title: '删除中...' });

            const result = await favoritesApi.removeTag(
                favorite.id,
                tagId,
                openid
            );

            wx.hideLoading();

            if (result.success) {
                // 立即更新本地标签列表 - 实时UI更新
                const updatedTags = favorite.tags.filter(tag => tag.id !== tagId);

                // 使用深拷贝确保数据更新触发视图刷新
                const updatedFavorite = {
                    ...favorite,
                    tags: updatedTags
                };

                this.setData({
                    favorite: updatedFavorite
                });

                wx.showToast({
                    title: '删除成功',
                    icon: 'success'
                });

                // 成功触觉反馈
                haptic.success();

                // 通知收藏列表页面刷新标签列表
                const pages = getCurrentPages();
                if (pages.length > 1) {
                    const prevPage = pages[pages.length - 2];
                    if (prevPage.route === 'pages/favorites/index' && prevPage.loadTags) {
                        // 强制刷新标签列表，跳过缓存
                        prevPage.loadTags(true);
                    }
                }
            } else {
                throw new Error(result.message || '删除失败');
            }
        } catch (error) {
            console.error('删除标签失败:', error);

            wx.hideLoading();

            // 使用统一错误处理
            errorHandler.showError(error, {
                onRetry: () => this.removeTag({ currentTarget: { dataset: { tagId, tagName } } }),
                customMessage: '删除标签失败'
            });
        }
    },

    /**
     * 进入编辑模式
     */
    startEdit() {
        const { favorite } = this.data;

        // 只有自定义问题才能编辑
        if (favorite.sourceType !== 'custom') {
            wx.showToast({
                title: '只能编辑自定义问题',
                icon: 'none'
            });
            return;
        }

        this.setData({
            isEditing: true,
            editedQuestion: favorite.question
        });
    },

    /**
     * 取消编辑
     */
    cancelEdit() {
        this.setData({
            isEditing: false,
            editedQuestion: ''
        });
    },

    /**
     * 问题文本输入
     */
    onQuestionInput(e) {
        this.setData({
            editedQuestion: e.detail.value
        });
    },

    /**
     * 保存编辑
     */
    async saveEdit() {
        const { editedQuestion, favorite, openid } = this.data;

        // 验证问题文本
        if (!editedQuestion || editedQuestion.trim() === '') {
            wx.showToast({
                title: '问题内容不能为空',
                icon: 'none'
            });
            return;
        }

        if (editedQuestion.trim().length < 5) {
            wx.showToast({
                title: '问题至少需要5个字符',
                icon: 'none'
            });
            return;
        }

        // 如果没有修改，直接退出编辑模式
        if (editedQuestion.trim() === favorite.question) {
            this.setData({
                isEditing: false
            });
            return;
        }

        try {
            wx.showLoading({ title: '保存中...' });

            const result = await favoritesApi.updateFavorite(
                favorite.id,
                {
                    openid,
                    question: editedQuestion.trim()
                }
            );

            wx.hideLoading();

            if (result.success) {
                // 立即更新本地数据 - 实时UI更新
                const updatedFavorite = {
                    ...this.data.favorite,
                    question: editedQuestion.trim()
                };

                this.setData({
                    favorite: updatedFavorite,
                    isEditing: false,
                    editedQuestion: ''
                });

                wx.showToast({
                    title: '保存成功',
                    icon: 'success'
                });

                // 成功触觉反馈
                haptic.success();
            } else {
                throw new Error(result.message || '保存失败');
            }
        } catch (error) {
            console.error('保存编辑失败:', error);

            wx.hideLoading();

            // 使用统一错误处理
            errorHandler.showError(error, {
                onRetry: () => this.saveEdit(),
                customMessage: '保存失败'
            });
        }
    },

    /**
     * 显示更多操作菜单
     */
    toggleMoreActions() {
        this.setData({
            showMoreActions: !this.data.showMoreActions
        });
    },

    /**
     * 隐藏更多操作菜单
     */
    hideMoreActions() {
        this.setData({
            showMoreActions: false
        });
    },

    /**
     * 分享收藏
     */
    shareFavorite() {
        // 隐藏菜单
        this.hideMoreActions();

        // 触发分享（小程序中需要用户主动触发分享）
        wx.showToast({
            title: '请点击右上角分享',
            icon: 'none'
        });
    },

    /**
     * 删除收藏
     */
    async deleteFavorite() {
        // 隐藏更多操作菜单
        this.hideMoreActions();

        const { favorite, openid } = this.data;

        try {
            const res = await new Promise((resolve) => {
                wx.showModal({
                    title: '确认删除',
                    content: '确定要删除这条收藏吗？删除后可在5秒内撤销。',
                    confirmText: '删除',
                    confirmColor: '#ee0a24',
                    success: resolve
                });
            });

            if (!res.confirm) {
                return;
            }

            wx.showLoading({ title: '删除中...' });

            const result = await favoritesApi.deleteFavorite(
                favorite.id,
                openid
            );

            wx.hideLoading();

            if (result.success) {
                // 保存已删除的收藏信息，用于撤销
                this.setData({
                    deletedFavorite: favorite,
                    showDeleteToast: true
                });

                // 显示撤销提示
                wx.showToast({
                    title: '已删除，可撤销',
                    icon: 'success',
                    duration: 5000
                });

                // 重要操作触觉反馈
                haptic.heavy();

                // 5秒后自动返回列表页
                const timer = setTimeout(() => {
                    this.setData({
                        showDeleteToast: false,
                        deletedFavorite: null
                    });

                    // 返回列表页并刷新
                    const pages = getCurrentPages();
                    if (pages.length > 1) {
                        const prevPage = pages[pages.length - 2];
                        if (prevPage.route === 'pages/favorites/index') {
                            // 通知列表页刷新
                            prevPage.setData({
                                page: 1,
                                favorites: [],
                                hasMore: true
                            });
                            prevPage.loadFavorites();
                            // 强制刷新标签列表，跳过缓存
                            prevPage.loadTags(true);
                        }
                    }

                    wx.navigateBack();
                }, 5000);

                this.setData({
                    deleteTimer: timer
                });
            } else {
                throw new Error(result.message || '删除失败');
            }
        } catch (error) {
            console.error('删除收藏失败:', error);

            wx.hideLoading();

            // 使用统一错误处理
            errorHandler.showError(error, {
                onRetry: () => this.deleteFavorite(),
                customMessage: '删除失败'
            });
        }
    },

    /**
     * 撤销删除
     */
    async undoDelete() {
        const { deletedFavorite, deleteTimer, openid } = this.data;

        if (!deletedFavorite) {
            return;
        }

        // 清除定时器
        if (deleteTimer) {
            clearTimeout(deleteTimer);
        }

        try {
            wx.showLoading({ title: '撤销中...' });

            // 重新创建收藏
            const result = await favoritesApi.createFavorite({
                openid,
                question: deletedFavorite.question,
                answer: deletedFavorite.answer,
                sourceType: deletedFavorite.sourceType,
                sourceId: deletedFavorite.sourceId,
                sourceCategory: deletedFavorite.sourceCategory,
                tags: deletedFavorite.tags.map(tag => tag.name)
            });

            wx.hideLoading();

            if (result.success) {
                this.setData({
                    showDeleteToast: false,
                    deletedFavorite: null,
                    deleteTimer: null
                });

                wx.showToast({
                    title: '已撤销',
                    icon: 'success'
                });

                // 重新加载详情
                this.setData({
                    favoriteId: result.favoriteId
                });
                await this.loadDetail();

                // 通知列表页面刷新标签
                const pages = getCurrentPages();
                if (pages.length > 1) {
                    const prevPage = pages[pages.length - 2];
                    if (prevPage.route === 'pages/favorites/index' && prevPage.loadTags) {
                        // 强制刷新标签列表，跳过缓存
                        prevPage.loadTags(true);
                    }
                }

                // 成功触觉反馈
                haptic.success();
            } else {
                throw new Error(result.message || '撤销失败');
            }
        } catch (error) {
            console.error('撤销删除失败:', error);

            wx.hideLoading();

            // 使用统一错误处理
            errorHandler.showError(error, {
                onRetry: () => this.undoDelete(),
                customMessage: '撤销失败'
            });
        }
    },

    /**
     * 分享到好友
     */
    onShareAppMessage() {
        const { favorite } = this.data;

        if (!favorite) {
            return {
                title: 'AI面试助手 - 我的收藏',
                path: '/pages/favorites/index'
            };
        }

        // 获取问题预览（前30个字符）
        const questionPreview = favorite.question.length > 30
            ? favorite.question.substring(0, 30) + '...'
            : favorite.question;

        // 获取来源标签
        const sourceLabel = favorite.sourceType === 'knowledge'
            ? '知识库'
            : favorite.sourceType === 'resume'
                ? '简历解读'
                : '自定义';

        return {
            title: `【${sourceLabel}】${questionPreview}`,
            path: `/pages/favorites/detail?id=${favorite.id}`,
            imageUrl: '' // 可以设置分享图片
        };
    },

    /**
     * 分享到朋友圈（需要开通）
     */
    onShareTimeline() {
        const { favorite } = this.data;

        if (!favorite) {
            return {
                title: 'AI面试助手 - 我的收藏'
            };
        }

        // 获取问题预览
        const questionPreview = favorite.question.length > 30
            ? favorite.question.substring(0, 30) + '...'
            : favorite.question;

        return {
            title: `${questionPreview} - AI面试助手`,
            query: `id=${favorite.id}`,
            imageUrl: '' // 可以设置分享图片
        };
    }
});

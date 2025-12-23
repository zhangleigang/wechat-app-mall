/**
 * 我的收藏页面
 * 展示用户收藏的问题列表，支持标签筛选、分页加载、下拉刷新
 */

const SimpleAuth = require('../../utils/simpleAuth');
const favoritesApi = require('../../utils/favorites-api');
const errorHandler = require('../../utils/error-handler');
const haptic = require('../../utils/haptic');

Page({
    data: {
        // 收藏列表
        favorites: [],
        allTags: [],           // 所有标签（带问题数量）
        activeTag: null,       // 当前筛选标签

        // 分页
        page: 1,
        pageSize: 20,
        total: 0,
        hasMore: true,

        // 状态
        loading: false,
        loadingMore: false,
        isEmpty: false,
        isLogined: false,

        // 用户信息
        openid: '',

        // 添加问题弹窗
        showAddModal: false,

        // 配额信息
        quotaInfo: {
            isValid: false,      // 是否是会员
            current: 0,          // 当前收藏数量
            limit: 10,           // 限制数量
            remaining: 10,       // 剩余数量
            unlimited: false     // 是否无限制
        }
    },

    onLoad() {
        wx.setNavigationBarTitle({ title: '我的收藏' });
    },

    onShow() {
        // 每次显示页面时都重新加载，确保数据是最新的（实时UI更新）
        // 这样当用户从会员套餐页面返回时，配额信息会立即更新

        // 确保弹窗是关闭状态
        if (this.data.showAddModal) {
            this.setData({
                showAddModal: false
            });
        }

        this.checkLoginAndLoad();
    },

    onHide() {
        // 页面隐藏时，确保关闭弹窗，避免残留请求
        if (this.data.showAddModal) {
            this.setData({
                showAddModal: false
            });
        }
    },

    /**
     * 检查登录并加载收藏
     * 优化：合并setData调用，减少渲染次数
     */
    async checkLoginAndLoad() {
        try {
            const isLogined = await SimpleAuth.checkHasLogined();
            const openid = wx.getStorageSync('openid');

            if (isLogined && openid) {
                // 优化：合并所有初始状态更新为一次setData
                this.setData({
                    isLogined,
                    openid,
                    page: 1,
                    favorites: [],
                    hasMore: true
                });

                // 并行加载所有数据，提高加载速度
                await Promise.all([
                    this.loadFavorites(),
                    this.loadTags(),
                    this.loadQuotaInfo()
                ]);
            } else {
                // 优化：合并未登录状态更新
                this.setData({
                    isLogined,
                    openid,
                    isEmpty: true,
                    favorites: [],
                    allTags: []
                });
            }
        } catch (error) {
            console.error('检查登录失败:', error);
            this.setData({
                isEmpty: true,
                isLogined: false
            });
        }
    },

    /**
     * 加载收藏列表
     * @param {boolean} append - 是否追加到现有列表（分页加载）
     * @param {boolean} forceRefresh - 是否强制刷新（跳过缓存）
     */
    async loadFavorites(append = false, forceRefresh = false) {
        if (!this.data.openid) {
            return;
        }

        try {
            // 优化：合并setData调用，减少渲染次数
            const updateData = {
                loading: !append,
                loadingMore: append
            };
            this.setData(updateData);

            const params = {
                openid: this.data.openid,
                page: this.data.page,
                pageSize: this.data.pageSize,
                forceRefresh: forceRefresh  // 传递强制刷新参数
            };

            // 如果有标签筛选，添加标签参数
            if (this.data.activeTag) {
                params.tag = this.data.activeTag;
            }

            const result = await favoritesApi.getFavorites(params);

            if (result.success) {
                const newFavorites = result.favorites || [];

                // 优化：预计算所有格式化数据，避免在模板中计算
                const formattedFavorites = newFavorites.map(item => ({
                    ...item,
                    questionPreview: this.getQuestionPreview(item.question),
                    sourceIcon: this.getSourceIcon(item.source_type),
                    sourceName: this.getSourceName(item.source_type),
                    formattedTime: this.formatTime(item.created_at)
                }));

                // 优化：一次性更新所有相关数据，减少setData调用
                const finalUpdateData = {
                    favorites: append
                        ? [...this.data.favorites, ...formattedFavorites]
                        : formattedFavorites,
                    total: result.total,
                    hasMore: result.hasMore,
                    isEmpty: result.total === 0,
                    loading: false,
                    loadingMore: false
                };

                this.setData(finalUpdateData);

                // 如果使用了缓存，在控制台提示
                if (result.fromCache) {
                }
            } else {
                throw new Error(result.message || '加载失败');
            }
        } catch (error) {
            console.error('加载收藏列表失败:', error);

            // 使用统一错误处理，提供重试选项
            errorHandler.showError(error, {
                onRetry: () => this.loadFavorites(append, forceRefresh),
                customMessage: '加载收藏列表失败'
            });

            // 优化：合并错误状态更新
            this.setData({
                loading: false,
                loadingMore: false,
                isEmpty: this.data.favorites.length === 0
            });
        }
    },

    /**
     * 加载标签列表
     * @param {boolean} forceRefresh - 是否强制刷新（跳过缓存）
     */
    async loadTags(forceRefresh = false) {
        if (!this.data.openid) {
            return;
        }

        try {
            const result = await favoritesApi.getTags(this.data.openid, forceRefresh);

            if (result.success) {
                this.setData({
                    allTags: result.tags || []
                });

                // 如果使用了缓存，在控制台提示
                if (result.fromCache) {
                }
            }
        } catch (error) {
            console.error('加载标签列表失败:', error);
            // 标签加载失败不影响主要功能，只记录日志
        }
    },

    /**
     * 加载配额信息
     * 每次页面显示时都会调用，确保会员状态实时更新
     */
    async loadQuotaInfo() {
        if (!this.data.openid) {
            return;
        }

        try {
            // 获取统计信息（包含最新的会员状态和配额信息）
            // 后端会实时查询数据库，确保数据是最新的
            const result = await favoritesApi.getStats(this.data.openid);

            if (result.success && result.stats) {
                const quota = result.stats.quota || {};
                this.setData({
                    quotaInfo: {
                        isValid: quota.isValid || false,
                        current: quota.current || 0,
                        limit: quota.limit || 10,
                        remaining: quota.remaining || 0,
                        unlimited: quota.unlimited || false
                    }
                });

            }
        } catch (error) {
            console.error('加载配额信息失败:', error);
            // 配额加载失败不影响主要功能，只记录日志
        }
    },

    /**
     * 查看收藏详情
     */
    viewDetail(e) {
        const { id } = e.currentTarget.dataset;

        // 轻微触觉反馈 - 点击项目
        haptic.light();

        wx.navigateTo({
            url: `/pages/favorites/detail?id=${id}`,
            fail: () => {
                wx.showToast({
                    title: '跳转失败',
                    icon: 'none'
                });
            }
        });
    },

    /**
     * 选择标签筛选
     */
    selectTag(e) {
        const { tag } = e.currentTarget.dataset;

        // 选择触觉反馈
        haptic.selection();

        // 如果点击的是当前标签，则取消筛选
        const newActiveTag = this.data.activeTag === tag ? null : tag;

        this.setData({
            activeTag: newActiveTag,
            page: 1,
            favorites: [],
            hasMore: true
        });

        this.loadFavorites();
    },

    /**
     * 清除标签筛选
     */
    clearTagFilter() {
        this.setData({
            activeTag: null,
            page: 1,
            favorites: [],
            hasMore: true
        });

        this.loadFavorites();
    },

    /**
     * 滚动到底部，加载更多
     * 优化：防抖处理，避免快速滚动时多次触发
     */
    onReachBottom() {
        if (!this.data.hasMore || this.data.loadingMore) {
            return;
        }

        // 清除之前的定时器
        if (this._loadMoreTimer) {
            clearTimeout(this._loadMoreTimer);
        }

        // 防抖：延迟300ms执行，避免快速滚动时多次触发
        this._loadMoreTimer = setTimeout(() => {
            this.setData({
                page: this.data.page + 1
            });

            this.loadFavorites(true);
        }, 300);
    },

    /**
     * 下拉刷新
     * 优化：强制刷新，跳过缓存
     */
    async onPullDownRefresh() {
        try {
            this.setData({
                page: 1,
                favorites: [],
                hasMore: true,
                activeTag: null
            });

            // 强制刷新，跳过缓存
            await Promise.all([
                this.loadFavorites(false, true),  // forceRefresh = true
                this.loadTags(true)                // forceRefresh = true
            ]);

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
     * 去登录
     */
    goLogin() {
        wx.navigateTo({
            url: '/pages/login/simple'
        });
    },

    /**
     * 显示添加问题弹窗
     */
    async showAddQuestionModal() {
        // 轻微触觉反馈 - 按钮点击
        haptic.light();

        // 检查登录状态
        if (!this.data.isLogined || !this.data.openid) {
            wx.showToast({
                title: '请先登录',
                icon: 'none'
            });
            this.goLogin();
            return;
        }

        // 检查配额
        const quota = this.data.quotaInfo;
        if (!quota.unlimited && quota.remaining <= 0) {
            // 达到限制，显示升级提示
            this.showUpgradeModal();
            return;
        }

        this.setData({
            showAddModal: true
        });
    },

    /**
     * 关闭添加问题弹窗
     */
    closeAddQuestionModal() {
        this.setData({
            showAddModal: false
        });
    },

    /**
     * 配额超限处理
     */
    onQuotaExceeded(e) {
        this.showUpgradeModal();
    },

    /**
     * 显示升级提示弹窗
     */
    showUpgradeModal() {
        const quota = this.data.quotaInfo;

        wx.showModal({
            title: '收藏数量已达上限',
            content: `免费用户最多收藏${quota.limit}条问题。\n\n升级会员即可无限收藏，还能享受更多专属权益！`,
            confirmText: '立即升级',
            cancelText: '我知道了',
            success: (res) => {
                if (res.confirm) {
                    // 跳转到会员套餐页面
                    this.goToMemberPackages();
                }
            }
        });
    },

    /**
     * 跳转到会员套餐页面
     */
    goToMemberPackages() {
        wx.showModal({
            title: '解锁无限收藏',
            content: '联系我的微信，开始体验无限收藏功能\n\n微信号：csuzhangleigang',
            confirmText: '复制微信号',
            cancelText: '知道了',
            success: (res) => {
                if (res.confirm) {
                    wx.setClipboardData({
                        data: 'csuzhangleigang',
                        success: () => {
                            wx.showToast({
                                title: '微信号已复制',
                                icon: 'success'
                            })
                        }
                    })
                }
            },
            fail: () => {
                wx.showToast({
                    title: '页面跳转失败',
                    icon: 'none'
                });
            }
        });
    },

    /**
     * 添加问题成功回调
     */
    onQuestionSaved(e) {

        // 刷新列表和配额信息
        this.setData({
            page: 1,
            favorites: [],
            hasMore: true,
            activeTag: null
        });

        Promise.all([
            this.loadFavorites(),
            this.loadTags(),
            this.loadQuotaInfo()
        ]).then(() => {
            wx.showToast({
                title: '添加成功',
                icon: 'success'
            });

            // 成功触觉反馈
            haptic.success();
        });
    },

    /**
     * 获取问题预览（前50个字符）
     */
    getQuestionPreview(question) {
        if (!question) return '';
        return question.length > 50
            ? question.substring(0, 50) + '...'
            : question;
    },

    /**
     * 获取来源图标
     */
    getSourceIcon(sourceType) {
        const icons = {
            knowledge: '📚',
            resume: '📄',
            custom: '✏️'
        };
        return icons[sourceType] || '📝';
    },

    /**
     * 获取来源名称
     */
    getSourceName(sourceType) {
        const names = {
            knowledge: '知识库',
            resume: '简历解读',
            custom: '自定义'
        };
        return names[sourceType] || '未知';
    },

    /**
     * 格式化时间
     */
    formatTime(timestamp) {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        // 小于1分钟
        if (diff < 60000) {
            return '刚刚';
        }

        // 小于1小时
        if (diff < 3600000) {
            return `${Math.floor(diff / 60000)}分钟前`;
        }

        // 小于1天
        if (diff < 86400000) {
            return `${Math.floor(diff / 3600000)}小时前`;
        }

        // 小于7天
        if (diff < 604800000) {
            return `${Math.floor(diff / 86400000)}天前`;
        }

        // 格式化为日期
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        // 如果是今年，不显示年份
        if (year === now.getFullYear()) {
            return `${month}-${day}`;
        }

        return `${year}-${month}-${day}`;
    }
});

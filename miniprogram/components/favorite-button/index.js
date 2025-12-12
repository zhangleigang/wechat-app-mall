// components/favorite-button/index.js
const favoritesApi = require('../../utils/favorites-api.js')
const haptic = require('../../utils/haptic.js')

Component({
    /**
     * 组件的属性列表
     */
    properties: {
        // 问题ID（用于知识库来源）
        questionId: {
            type: String,
            value: ''
        },
        // 问题文本
        question: {
            type: String,
            value: ''
        },
        // 答案内容
        answer: {
            type: String,
            value: ''
        },
        // 来源类型：knowledge, resume, custom
        sourceType: {
            type: String,
            value: 'knowledge'
        },
        // 来源分类（如HDFS、Spark等）
        sourceCategory: {
            type: String,
            value: ''
        },
        // 初始收藏状态
        isFavorited: {
            type: Boolean,
            value: false
        },
        // 收藏ID（如果已收藏）
        favoriteId: {
            type: Number,
            value: 0
        },
        // 按钮大小：small, medium, large
        size: {
            type: String,
            value: 'medium'
        }
    },

    /**
     * 组件的初始数据
     */
    data: {
        favorited: false,
        loading: false,
        animating: false
    },

    /**
     * 组件的方法列表
     */
    methods: {
        // 初始化收藏状态
        initFavoriteState() {
            this.setData({
                favorited: this.properties.isFavorited
            })
        },

        // 切换收藏状态
        async toggleFavorite() {
            if (this.data.loading) {
                return
            }

            // 轻微触觉反馈 - 按钮点击
            haptic.light()

            const openid = wx.getStorageSync('openid')
            if (!openid) {
                wx.showToast({
                    title: '请先登录',
                    icon: 'none'
                })
                return
            }

            this.setData({ loading: true })

            try {
                if (this.data.favorited) {
                    // 取消收藏
                    await this.removeFavorite(openid)
                } else {
                    // 添加收藏
                    await this.addFavorite(openid)
                }
            } catch (error) {
                console.error('Toggle favorite error:', error)
                wx.showToast({
                    title: error.message || '操作失败',
                    icon: 'none'
                })
            } finally {
                this.setData({ loading: false })
            }
        },

        // 添加收藏
        async addFavorite(openid) {
            const { question, answer, sourceType, questionId, sourceCategory } = this.properties

            if (!question || !answer) {
                throw new Error('问题或答案不能为空')
            }

            const data = {
                openid,
                question,
                answer,
                sourceType,
                sourceId: questionId,
                sourceCategory,
                tags: []
            }

            // 如果是简历来源，自动添加"简历分析"标签
            if (sourceType === 'resume') {
                data.tags = ['简历分析']
            }

            const result = await favoritesApi.createFavorite(data)

            // 检查是否是配额错误
            if (!result.success && (result.code === 'QUOTA_EXCEEDED' || result.error === 'QUOTA_EXCEEDED')) {
                // 显示升级提示
                this.showUpgradeModal(result.current, result.limit);
                return;
            }

            if (!result.success) {
                throw new Error(result.message || result.error || '收藏失败');
            }

            // 立即更新状态 - 实时UI更新
            this.setData({
                favorited: true,
                animating: true
            })

            // 更新properties中的favoriteId，确保后续操作使用正确的ID
            this.properties.favoriteId = result.favoriteId || result.data?.id

            // 触发动画
            setTimeout(() => {
                this.setData({ animating: false })
            }, 300)

            // 触发成功事件，通知父组件立即更新
            this.triggerEvent('favoritechange', {
                favorited: true,
                favoriteId: this.properties.favoriteId
            })

            // 显示成功提示
            wx.showToast({
                title: '收藏成功',
                icon: 'success',
                duration: 1500
            })

            // 成功触觉反馈
            haptic.success()
        },

        // 显示升级提示弹窗
        showUpgradeModal(current, limit) {
            wx.showModal({
                title: '收藏数量已达上限',
                content: `免费用户最多收藏${limit}条问题。\n\n升级会员即可无限收藏，还能享受更多专属权益！`,
                confirmText: '立即升级',
                cancelText: '我知道了',
                success: (res) => {
                    if (res.confirm) {
                        // 跳转到会员套餐页面
                        wx.navigateTo({
                            url: '/pages/member/packages/index',
                            fail: () => {
                                wx.showToast({
                                    title: '页面跳转失败',
                                    icon: 'none'
                                });
                            }
                        });
                    }
                }
            });
        },

        // 取消收藏
        async removeFavorite(openid) {
            const favoriteId = this.properties.favoriteId

            if (!favoriteId) {
                throw new Error('收藏ID不存在')
            }

            await favoritesApi.deleteFavorite(favoriteId, openid)

            // 更新状态
            this.setData({
                favorited: false,
                animating: true
            })

            // 触发动画
            setTimeout(() => {
                this.setData({ animating: false })
            }, 300)

            // 触发取消事件
            this.triggerEvent('favoritechange', {
                favorited: false,
                favoriteId: 0
            })

            // 显示成功提示
            wx.showToast({
                title: '已取消收藏',
                icon: 'success',
                duration: 1500
            })

            // 轻微触觉反馈
            haptic.light()
        }
    },

    /**
     * 组件生命周期
     */
    lifetimes: {
        attached() {
            this.initFavoriteState()
        }
    },

    observers: {
        'isFavorited': function (newVal) {
            this.setData({
                favorited: newVal
            })
        }
    }
})

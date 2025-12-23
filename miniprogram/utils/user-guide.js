/**
 * 用户引导工具
 * 用于新用户首次使用时的引导流程
 */

class UserGuide {
    constructor() {
        this.storageKey = 'user_guide_status'
    }

    /**
     * 检查是否需要显示新用户引导
     */
    shouldShowGuide() {
        try {
            const guideStatus = wx.getStorageSync(this.storageKey)
            return !guideStatus || !guideStatus.hasShownGuide
        } catch (error) {
            console.error('检查引导状态失败:', error)
            return true // 出错时默认显示引导
        }
    }

    /**
     * 标记引导已显示
     */
    markGuideShown() {
        try {
            wx.setStorageSync(this.storageKey, {
                hasShownGuide: true,
                shownAt: Date.now(),
                version: '1.0'
            })
        } catch (error) {
            console.error('保存引导状态失败:', error)
        }
    }

    /**
     * 显示新用户引导弹窗
     */
    showWelcomeGuide() {
        wx.showModal({
            title: '🎉 欢迎使用AI面试助手',
            content: `感谢选择我们的产品！

🎯 这里有200+大数据面试题
💡 AI智能分析岗位和简历  
📚 专业的面试准备工具

想了解如何使用和开通会员吗？`,
            confirmText: '查看指南',
            cancelText: '稍后再说',
            success: (res) => {
                if (res.confirm) {
                    // 跳转到使用指南
                    wx.navigateTo({
                        url: '/pages/guide/index'
                    })
                }
                // 无论选择什么都标记为已显示
                this.markGuideShown()
            },
            fail: () => {
                // 弹窗失败也标记为已显示，避免重复弹出
                this.markGuideShown()
            }
        })
    }

    /**
     * 显示会员引导
     */
    showMembershipGuide() {
        wx.showModal({
            title: '💎 解锁完整功能',
            content: `当前为免费体验模式

🔓 开通会员即可：
• 查看完整题目答案
• 无限次AI分析功能
• 上传简历智能解读
• 无限收藏题目

添加微信开通会员：csuzhangleigang`,
            confirmText: '复制微信',
            cancelText: '继续体验',
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
            }
        })
    }

    /**
     * 显示功能介绍提示
     */
    showFeatureTip(feature) {
        const tips = {
            knowledge: {
                title: '📚 面试知识库',
                content: '这里有200+精选大数据面试题\n\n• 免费浏览所有题目\n• 会员可查看完整答案\n• 支持收藏和标签管理'
            },
            resume: {
                title: '📄 简历解读',
                content: 'AI智能分析你的简历\n\n• 上传PDF/Word/Markdown格式\n• 专业优化建议\n• STAR原则解读\n• 多轮智能问答'
            },
            favorites: {
                title: '⭐ 我的收藏',
                content: '管理你的面试题库\n\n• 多来源收藏题目\n• 标签分类管理\n• AI生成答案\n• 免费用户限10条'
            },
            ai: {
                title: '🤖 AI功能',
                content: '智能面试助手\n\n• 岗位分析和预测\n• 简历智能解读\n• 情绪支持小屋\n• 需要会员权限'
            }
        }

        const tip = tips[feature]
        if (!tip) return

        wx.showModal({
            title: tip.title,
            content: tip.content,
            confirmText: '了解更多',
            cancelText: '知道了',
            success: (res) => {
                if (res.confirm) {
                    wx.navigateTo({
                        url: '/pages/guide/index'
                    })
                }
            }
        })
    }

    /**
     * 重置引导状态（用于测试）
     */
    resetGuideStatus() {
        try {
            wx.removeStorageSync(this.storageKey)
        } catch (error) {
            console.error('重置引导状态失败:', error)
        }
    }

    /**
     * 检查用户活跃度，适时显示引导
     */
    checkUserEngagement() {
        try {
            const openid = wx.getStorageSync('openid')
            if (!openid) return

            // 检查用户使用情况
            const usageStats = this.getUserUsageStats()

            // 如果用户浏览了很多题目但没有成为会员，显示会员引导
            if (usageStats.viewedQuestions > 10 && !usageStats.isMember) {
                setTimeout(() => {
                    this.showMembershipGuide()
                }, 2000)
            }
        } catch (error) {
            console.error('检查用户活跃度失败:', error)
        }
    }

    /**
     * 获取用户使用统计
     */
    getUserUsageStats() {
        try {
            const stats = wx.getStorageSync('user_usage_stats') || {
                viewedQuestions: 0,
                usedAIFeatures: 0,
                favoriteCount: 0,
                isMember: false,
                lastActiveTime: Date.now()
            }
            return stats
        } catch (error) {
            console.error('获取使用统计失败:', error)
            return {
                viewedQuestions: 0,
                usedAIFeatures: 0,
                favoriteCount: 0,
                isMember: false,
                lastActiveTime: Date.now()
            }
        }
    }

    /**
     * 更新用户使用统计
     */
    updateUsageStats(action, value = 1) {
        try {
            const stats = this.getUserUsageStats()

            switch (action) {
                case 'viewQuestion':
                    stats.viewedQuestions += value
                    break
                case 'useAI':
                    stats.usedAIFeatures += value
                    break
                case 'addFavorite':
                    stats.favoriteCount += value
                    break
                case 'becomeMember':
                    stats.isMember = true
                    break
            }

            stats.lastActiveTime = Date.now()
            wx.setStorageSync('user_usage_stats', stats)
        } catch (error) {
            console.error('更新使用统计失败:', error)
        }
    }
}

// 创建单例实例
const userGuide = new UserGuide()

module.exports = userGuide
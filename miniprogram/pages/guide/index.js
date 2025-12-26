// pages/guide/index.js
Page({
    data: {
        currentStep: 0,
        steps: [
            {
                title: '🎯 AI面试助手能帮你什么？',
                content: `• 200+大数据面试题库，覆盖主流技术
• 专业解读简历，提供优化建议  
• 收藏管理，打造个人题库`,
                emoji: '🎯'
            },
            {
                title: '📚 免费功能体验',
                content: `• 浏览所有面试题目分类
• 查看题目列表和难度标识
• 收藏感兴趣的题目（限10条）
• 了解大数据技术栈覆盖范围`,
                emoji: '📚'
            },
            {
                title: '💎 会员专享功能',
                content: `• 查看完整题目答案和解析
• 无限次AI简历解读功能
• 上传3个简历文件，智能问答
• 无限收藏题目，标签分类管理`,
                emoji: '💎'
            },
            {
                title: '💰 如何开通会员？',
                content: `1️⃣ 点击个人中心"查看OpenID"
2️⃣ 复制你的用户标识码
3️⃣ 添加微信：csuzhangleigang
4️⃣ 发送"开通会员+OpenID+套餐"
5️⃣ 完成支付后立即激活
6️⃣ 返回小程序即可使用！`,
                emoji: '💰'
            },
            {
                title: '🎁 会员套餐选择',
                content: `月度会员：¥29.9/30天
• 适合短期面试准备

季度会员：¥49.9/90天 💥推荐
• 性价比最高，充分准备

年度会员：¥99.9/365天
• 长期学习，持续提升

💡 所有套餐功能完全相同！`,
                emoji: '🎁'
            }
        ]
    },

    onLoad() {
        wx.setNavigationBarTitle({
            title: '使用指南'
        })
    },

    // 下一步
    nextStep() {
        if (this.data.currentStep < this.data.steps.length - 1) {
            this.setData({
                currentStep: this.data.currentStep + 1
            })
        }
    },

    // 上一步
    prevStep() {
        if (this.data.currentStep > 0) {
            this.setData({
                currentStep: this.data.currentStep - 1
            })
        }
    },

    // 跳转到指定步骤
    goToStep(e) {
        const step = parseInt(e.currentTarget.dataset.step)
        if (step !== this.data.currentStep) {
            this.setData({
                currentStep: step
            })
        }
    },

    // 立即体验
    startExperience() {
        wx.showToast({
            title: '跳转到知识库',
            icon: 'success',
            duration: 1500
        })

        setTimeout(() => {
            wx.switchTab({
                url: '/pages/knowledge/index',
                fail: () => {
                    wx.showToast({
                        title: '跳转失败，请重试',
                        icon: 'none'
                    })
                }
            })
        }, 1500)
    },

    // 联系开通会员
    contactForMembership() {
        wx.showModal({
            title: '开通会员',
            content: '添加微信：csuzhangleigang\n发送：开通会员+OpenID+套餐',
            confirmText: '复制',
            cancelText: '取消',
            success: (res) => {
                if (res.confirm) {
                    // 复制微信号
                    wx.setClipboardData({
                        data: 'csuzhangleigang',
                        success: () => {
                            wx.showToast({
                                title: '微信号已复制',
                                icon: 'success',
                                duration: 2000
                            })

                            // 延迟跳转到个人中心
                            setTimeout(() => {
                                wx.switchTab({
                                    url: '/pages/my/index',
                                    success: () => {
                                        setTimeout(() => {
                                            wx.showToast({
                                                title: '请点击查看OpenID',
                                                icon: 'none',
                                                duration: 3000
                                            })
                                        }, 1000)
                                    }
                                })
                            }, 2000)
                        },
                        fail: () => {
                            wx.showToast({
                                title: '复制失败，请手动添加',
                                icon: 'none',
                                duration: 2000
                            })
                        }
                    })
                }
            },
            fail: () => {
                // 降级处理 - 直接复制微信号
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
                            title: '请添加微信：csuzhangleigang',
                            icon: 'none',
                            duration: 3000
                        })
                    }
                })
            }
        })
    },

    // 分享给好友
    onShareAppMessage() {
        return {
            title: 'AI面试助手使用指南 - 大数据面试必备神器',
            path: '/pages/guide/index'
        }
    }
})
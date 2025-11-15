const SimpleAuth = require('../../utils/simpleAuth')

Page({
    data: {
        agreed: false,
        loading: false,
        showPhoneLogin: true // 是否显示手机号登录选项
    },

    onLoad(options) {
        // 检查是否已登录
        this.checkAutoLogin()
    },

    /**
     * 检查自动登录
     */
    async checkAutoLogin() {
        const isLogined = SimpleAuth.checkLoginStatus()
        if (isLogined) {
            console.log('已登录，跳转到首页')
            wx.showToast({
                title: '欢迎回来',
                icon: 'success'
            })
            setTimeout(() => {
                this.navigateToHome()
            }, 1000)
        }
    },

    /**
     * 快速登录（静默登录）
     */
    async handleQuickLogin() {
        if (!this.data.agreed) {
            wx.showToast({
                title: '请先同意用户协议',
                icon: 'none'
            })
            return
        }

        this.setData({ loading: true })

        try {
            const result = await SimpleAuth.silentLogin()

            if (result.success) {
                wx.showToast({
                    title: '登录成功',
                    icon: 'success'
                })

                console.log('登录成功:', result.data)

                // 延迟跳转，让用户看到成功提示
                setTimeout(() => {
                    this.navigateToHome()
                }, 1500)
            } else {
                throw new Error(result.error || '登录失败')
            }
        } catch (error) {
            console.error('登录失败:', error)
            wx.showModal({
                title: '登录失败',
                content: error.message || '请稍后重试',
                showCancel: false
            })
        } finally {
            this.setData({ loading: false })
        }
    },

    /**
     * 手机号登录
     */
    async handlePhoneLogin(e) {
        if (!this.data.agreed) {
            wx.showToast({
                title: '请先同意用户协议',
                icon: 'none'
            })
            return
        }

        console.log('手机号授权结果:', e.detail)

        if (e.detail.errMsg === 'getPhoneNumber:ok') {
            this.setData({ loading: true })

            try {
                const result = await SimpleAuth.phoneLogin(e.detail.code)

                if (result.success) {
                    wx.showToast({
                        title: '登录成功',
                        icon: 'success'
                    })

                    console.log('手机号登录成功:', result.data)

                    setTimeout(() => {
                        this.navigateToHome()
                    }, 1500)
                } else {
                    throw new Error(result.error || '登录失败')
                }
            } catch (error) {
                console.error('手机号登录失败:', error)
                wx.showModal({
                    title: '登录失败',
                    content: error.message || '请稍后重试',
                    showCancel: false
                })
            } finally {
                this.setData({ loading: false })
            }
        } else if (e.detail.errMsg === 'getPhoneNumber:fail user deny') {
            console.log('用户拒绝授权手机号')
        }
    },

    /**
     * 切换协议勾选
     */
    toggleAgreement() {
        this.setData({
            agreed: !this.data.agreed
        })
    },

    /**
     * 显示协议
     */
    showAgreement(e) {
        const type = e.currentTarget.dataset.type
        wx.navigateTo({
            url: `/pages/about/index?key=${type === 'user' ? 'yhxy' : 'ysxy'}`
        })
    },

    /**
     * 跳转到首页
     */
    navigateToHome() {
        // 检查是否有返回页面参数
        const pages = getCurrentPages()
        if (pages.length > 1) {
            // 有上一页，返回上一页
            wx.navigateBack()
        } else {
            // 没有上一页，跳转到首页
            wx.switchTab({
                url: '/pages/ai/job/index'
            })
        }
    }
})

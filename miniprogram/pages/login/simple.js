const SimpleAuth = require('../../utils/simpleAuth')

Page({
    data: {
        agreed: false,
        loading: false,
        showPhoneLogin: true, // 是否显示手机号登录选项
        avatarUrl: '', // 用户头像
        nickname: '' // 用户昵称
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
     * 选择头像
     */
    onChooseAvatar(e) {
        const { avatarUrl } = e.detail
        this.setData({ avatarUrl })
        console.log('选择头像:', avatarUrl)

        wx.showToast({
            title: '头像已选择',
            icon: 'success',
            duration: 1000
        })
    },

    /**
     * 输入昵称
     */
    onNicknameInput(e) {
        this.setData({ nickname: e.detail.value })
        console.log('输入昵称:', e.detail.value)
    },

    /**
     * 保存用户信息并登录
     */
    async handleSaveAndLogin() {
        if (!this.data.agreed) {
            wx.showToast({
                title: '请先同意用户协议',
                icon: 'none'
            })
            return
        }

        const { avatarUrl, nickname } = this.data

        if (!avatarUrl || !nickname) {
            wx.showToast({
                title: '请完善头像和昵称',
                icon: 'none'
            })
            return
        }

        this.setData({ loading: true })

        try {
            // 先登录获取OpenID
            const result = await SimpleAuth.silentLogin()

            if (result.success) {
                // 保存头像和昵称
                wx.setStorageSync('avatarUrl', avatarUrl)
                wx.setStorageSync('nickName', nickname)

                wx.showToast({
                    title: '登录成功',
                    icon: 'success'
                })

                console.log('登录成功，用户信息已保存')

                // 延迟跳转
                setTimeout(() => {
                    console.log('准备执行跳转...');
                    this.navigateToHome();
                }, 1500);
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
                    console.log('快速登录成功，准备跳转...');
                    this.navigateToHome();
                }, 1500);
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
        console.log('准备跳转到首页...');

        // 跳转到 tabBar 的第一个页面（面试知识）
        wx.switchTab({
            url: '/pages/knowledge/index',
            success: () => {
                console.log('跳转到面试知识页面成功');
            },
            fail: (error) => {
                console.error('switchTab 失败:', error);
                // 备用方案：使用 reLaunch 跳转到非 tabBar 页面
                wx.reLaunch({
                    url: '/pages/knowledge/index',
                    success: () => {
                        console.log('reLaunch 跳转成功');
                    },
                    fail: (err) => {
                        console.error('reLaunch 也失败:', err);
                    }
                });
            }
        });
    }
})

const MemberLocal = require('../../../utils/memberLocal')

Page({
    data: {
        status: 'success', // success | fail
        orderNumber: '',
        packageName: '',
        memberInfo: null,
        loading: true
    },

    onLoad(options) {
        const { status, orderNumber, packageName } = options

        this.setData({
            status: status || 'success',
            orderNumber: orderNumber || '',
            packageName: packageName || ''
        })

        // 如果支付成功，获取最新的会员信息
        if (status === 'success') {
            this.loadMemberInfo()
        } else {
            this.setData({ loading: false })
        }
    },

    // 加载会员信息
    async loadMemberInfo() {
        try {
            // 刷新会员状态（从本地存储获取最新数据）
            const memberInfo = MemberLocal.refreshMemberStatus()

            // 格式化到期日期
            let formattedExpireDate = ''
            if (memberInfo.expireDate) {
                const date = new Date(memberInfo.expireDate)
                formattedExpireDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
            }

            this.setData({
                memberInfo: {
                    ...memberInfo,
                    expireDate: formattedExpireDate
                },
                loading: false
            })

        } catch (error) {
            console.error('获取会员信息失败:', error)
            this.setData({
                loading: false
            })
        }
    },

    // 返回首页
    goHome() {
        wx.switchTab({
            url: '/pages/ai/job/index'
        })
    },

    // 查看会员信息
    viewMember() {
        wx.switchTab({
            url: '/pages/my/index'
        })
    },

    // 重新支付（支付失败时）
    retryPayment() {
        wx.navigateBack({
            delta: 2 // 返回到套餐选择页面
        })
    }
})

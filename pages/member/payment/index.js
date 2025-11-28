const AUTH = require('../../../utils/auth')
const MemberLocal = require('../../../utils/memberLocal')
const CONFIG = require('../../../config')

Page({
    data: {
        packageInfo: null,
        loading: false,
        orderInfo: null,
        qrcodeUrl: '',
        accountName: '',
        checking: false,
        showQrcode: false
    },

    async onLoad(options) {
        const { packageId, price } = options

        if (!packageId || !price) {
            wx.showToast({
                title: '参数错误',
                icon: 'none'
            })
            setTimeout(() => {
                wx.navigateBack()
            }, 1500)
            return
        }

        // 获取套餐信息
        const packageInfo = MemberLocal.getPackageInfo(packageId)

        if (!packageInfo) {
            wx.showToast({
                title: '套餐不存在',
                icon: 'none'
            })
            setTimeout(() => {
                wx.navigateBack()
            }, 1500)
            return
        }

        // 检查登录
        const isLogined = await AUTH.checkHasLogined()
        if (!isLogined) {
            wx.showModal({
                title: '提示',
                content: '请先登录后再支付',
                confirmText: '去登录',
                success: (res) => {
                    if (res.confirm) {
                        wx.navigateTo({ url: '/pages/login/simple' })
                    } else {
                        wx.navigateBack()
                    }
                }
            })
            return
        }

        // 生成本地订单号
        const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`

        this.setData({
            packageInfo: {
                ...packageInfo,
                duration: `${packageInfo.duration}天`
            },
            orderInfo: {
                orderNumber: orderId
            },
            qrcodeUrl: CONFIG.paymentQrcode.url,
            accountName: CONFIG.paymentQrcode.accountName,
            showQrcode: true
        })
    },

    // 复制订单号
    copyOrderNumber() {
        wx.setClipboardData({
            data: this.data.orderInfo.orderNumber,
            success: () => {
                wx.showToast({ title: '订单号已复制', icon: 'success' })
            }
        })
    },

    // 保存收款码
    saveQrcode() {
        wx.downloadFile({
            url: this.data.qrcodeUrl,
            success: (res) => {
                if (res.statusCode === 200) {
                    wx.saveImageToPhotosAlbum({
                        filePath: res.tempFilePath,
                        success: () => {
                            wx.showToast({ title: '已保存到相册', icon: 'success' })
                        },
                        fail: () => {
                            wx.showToast({ title: '保存失败', icon: 'none' })
                        }
                    })
                }
            }
        })
    },

    // 预览收款码
    previewQrcode() {
        wx.previewImage({
            urls: [this.data.qrcodeUrl],
            current: this.data.qrcodeUrl
        })
    },

    // 我已支付
    async handlePaid() {
        if (this.data.checking) return

        wx.showModal({
            title: '确认支付',
            content: '请确认您已完成转账支付',
            confirmText: '已完成',
            cancelText: '取消',
            success: async (res) => {
                if (res.confirm) {
                    this.setData({ checking: true })
                    await this.confirmPayment()
                }
            }
        })
    },

    // 确认支付完成并激活会员
    async confirmPayment() {
        wx.showLoading({ title: '激活中...', mask: true })

        try {
            const { packageInfo } = this.data

            // 从套餐配置中获取正确的天数（数字类型）
            const packageConfig = MemberLocal.getPackageInfo(packageInfo.id)
            if (!packageConfig) {
                throw new Error('套餐配置不存在')
            }

            // 激活会员（使用配置中的数字天数）
            const result = MemberLocal.activateMember(
                packageInfo.id,
                packageConfig.duration
            )

            wx.hideLoading()

            if (result.success) {
                wx.showToast({
                    title: '会员已激活',
                    icon: 'success',
                    duration: 2000
                })

                // 延迟跳转到成功页面
                setTimeout(() => {
                    wx.redirectTo({
                        url: `/pages/member/payment-result/index?status=success&packageName=${packageInfo.name}`
                    })
                }, 2000)
            }

        } catch (error) {
            wx.hideLoading()
            this.setData({ checking: false })

            wx.showModal({
                title: '激活失败',
                content: error.message || '请联系客服处理',
                showCancel: false
            })
        }
    },

    // 取消支付
    handleCancel() {
        wx.navigateBack()
    }
})

const AUTH = require('../../../utils/auth')
const MemberLocal = require('../../../utils/memberLocal')
const CONFIG = require('../../../config')

Page({
    data: {
        packageInfo: null,
        loading: false,
        orderInfo: null,
        qrcodeUrl: '',
        localQrcodeUrl: '', // 本地临时图片路径
        accountName: '',
        checking: false,
        showQrcode: false,
        packageConfig: null // 原始套餐配置（包含数字天数）
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

        // 检查收款码配置
        const qrcodeUrl = CONFIG.paymentQrcode.url
        console.log('收款码配置:', {
            url: qrcodeUrl,
            accountName: CONFIG.paymentQrcode.accountName,
            enabled: CONFIG.paymentQrcode.enabled
        })

        this.setData({
            packageInfo: {
                ...packageInfo,
                duration: `${packageInfo.duration}天`
            },
            packageConfig: packageInfo, // 保存原始配置
            orderInfo: {
                orderNumber: orderId
            },
            qrcodeUrl: qrcodeUrl,
            accountName: CONFIG.paymentQrcode.accountName,
            showQrcode: true
        })

        // 下载二维码到本地，使其支持长按识别
        this.downloadQrcodeToLocal()
    },

    // 下载二维码到本地临时文件
    downloadQrcodeToLocal() {
        // 检查URL是否有效
        if (!this.data.qrcodeUrl || this.data.qrcodeUrl.includes('example.com')) {
            console.warn('收款码URL未配置或使用示例地址')
            wx.showModal({
                title: '提示',
                content: '收款码尚未配置，请联系管理员上传收款码\n\n临时方案：您可以联系客服获取收款码',
                confirmText: '联系客服',
                cancelText: '知道了',
                success: (res) => {
                    if (res.confirm) {
                        // 可以跳转到客服页面或复制客服微信
                        wx.showToast({
                            title: '请联系客服',
                            icon: 'none'
                        })
                    }
                }
            })
            return
        }

        wx.showLoading({ title: '加载收款码...', mask: true })

        wx.downloadFile({
            url: this.data.qrcodeUrl,
            success: (res) => {
                wx.hideLoading()

                if (res.statusCode === 200) {
                    // 使用本地临时文件路径
                    this.setData({
                        localQrcodeUrl: res.tempFilePath
                    })
                    console.log('收款码下载成功，支持长按识别')
                } else {
                    console.error('下载二维码失败，状态码:', res.statusCode)
                    this.handleDownloadError('服务器返回错误')
                }
            },
            fail: (err) => {
                wx.hideLoading()
                console.error('下载二维码失败:', err)
                this.handleDownloadError(err.errMsg || '网络错误')
            }
        })
    },

    // 处理下载失败
    handleDownloadError(errorMsg) {
        wx.showModal({
            title: '收款码加载失败',
            content: `无法加载收款码图片\n错误：${errorMsg}\n\n您仍可以点击"保存收款码到相册"按钮尝试保存，或联系客服获取收款码`,
            confirmText: '重试',
            cancelText: '知道了',
            success: (res) => {
                if (res.confirm) {
                    this.downloadQrcodeToLocal()
                }
            }
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
        wx.showLoading({ title: '保存中...', mask: true })

        wx.downloadFile({
            url: this.data.qrcodeUrl,
            success: (res) => {
                if (res.statusCode === 200) {
                    wx.saveImageToPhotosAlbum({
                        filePath: res.tempFilePath,
                        success: () => {
                            wx.hideLoading()
                            wx.showModal({
                                title: '保存成功',
                                content: '收款码已保存到相册\n\n请打开微信"扫一扫"，点击右上角相册图标，选择刚保存的二维码完成支付',
                                confirmText: '知道了',
                                showCancel: false
                            })
                        },
                        fail: (err) => {
                            wx.hideLoading()
                            if (err.errMsg.includes('auth deny')) {
                                wx.showModal({
                                    title: '需要授权',
                                    content: '请允许访问相册以保存收款码',
                                    confirmText: '去设置',
                                    success: (res) => {
                                        if (res.confirm) {
                                            wx.openSetting()
                                        }
                                    }
                                })
                            } else {
                                wx.showToast({ title: '保存失败，请重试', icon: 'none' })
                            }
                        }
                    })
                } else {
                    wx.hideLoading()
                    wx.showToast({ title: '下载失败，请重试', icon: 'none' })
                }
            },
            fail: () => {
                wx.hideLoading()
                wx.showToast({ title: '网络错误，请重试', icon: 'none' })
            }
        })
    },

    // 快速保存（优化版）
    quickSave() {
        // 使用本地已下载的图片，速度更快
        const imagePath = this.data.localQrcodeUrl || this.data.qrcodeUrl

        if (this.data.localQrcodeUrl) {
            // 已经下载到本地，直接保存
            this.saveToAlbum(this.data.localQrcodeUrl)
        } else {
            // 需要先下载
            wx.showLoading({ title: '准备中...', mask: true })
            wx.downloadFile({
                url: this.data.qrcodeUrl,
                success: (res) => {
                    if (res.statusCode === 200) {
                        this.saveToAlbum(res.tempFilePath)
                    } else {
                        wx.hideLoading()
                        wx.showToast({ title: '加载失败', icon: 'none' })
                    }
                },
                fail: () => {
                    wx.hideLoading()
                    wx.showToast({ title: '网络错误', icon: 'none' })
                }
            })
        }
    },

    // 保存到相册
    saveToAlbum(filePath) {
        wx.saveImageToPhotosAlbum({
            filePath: filePath,
            success: () => {
                wx.hideLoading()
                // 简化提示，直接告知下一步
                wx.showModal({
                    title: '✅ 已保存',
                    content: '打开微信扫一扫 → 点击相册 → 选择收款码 → 完成支付',
                    confirmText: '知道了',
                    showCancel: false
                })
            },
            fail: (err) => {
                wx.hideLoading()
                if (err.errMsg.includes('auth deny')) {
                    wx.showModal({
                        title: '需要授权',
                        content: '请允许访问相册',
                        confirmText: '去设置',
                        success: (res) => {
                            if (res.confirm) {
                                wx.openSetting()
                            }
                        }
                    })
                } else {
                    wx.showToast({ title: '保存失败', icon: 'none' })
                }
            }
        })
    },

    // 显示详细指引
    showDetailGuide() {
        const price = this.data.packageInfo.price
        wx.showModal({
            title: '💡 详细支付步骤',
            content: `1. 点击"保存收款码"按钮\n\n2. 打开微信首页，点击右上角"+"号\n\n3. 选择"扫一扫"\n\n4. 点击右上角"相册"图标\n\n5. 选择刚保存的收款码\n\n6. 确认金额 ¥${price} 后完成支付\n\n7. 返回小程序点击"我已完成支付"`,
            confirmText: '明白了',
            showCancel: false
        })
    },

    // 点击二维码（保留兼容）
    handleQrcodeClick() {
        this.quickSave()
    },

    // 长按二维码（保留兼容）
    handleLongPress() {
        wx.showModal({
            title: '如何支付？',
            content: '由于微信限制，小程序内无法直接识别二维码\n\n请点击下方"保存并查看支付步骤"按钮，我们将为您提供详细的支付指引',
            confirmText: '查看步骤',
            cancelText: '知道了',
            success: (res) => {
                if (res.confirm) {
                    this.saveAndGuide()
                }
            }
        })
    },

    // 长按提示
    handleLongPress() {
        wx.showModal({
            title: '温馨提示',
            content: '小程序内长按识别二维码功能受微信限制，可能无法使用\n\n建议点击"保存并查看支付步骤"按钮，按照指引完成支付',
            confirmText: '查看步骤',
            cancelText: '知道了',
            success: (res) => {
                if (res.confirm) {
                    this.saveAndGuide()
                }
            }
        })
    },

    // 保存并显示支付指引
    saveAndGuide() {
        wx.showLoading({ title: '保存中...', mask: true })

        wx.downloadFile({
            url: this.data.qrcodeUrl,
            success: (res) => {
                if (res.statusCode === 200) {
                    wx.saveImageToPhotosAlbum({
                        filePath: res.tempFilePath,
                        success: () => {
                            wx.hideLoading()
                            this.showPaymentGuide()
                        },
                        fail: (err) => {
                            wx.hideLoading()
                            if (err.errMsg.includes('auth deny')) {
                                wx.showModal({
                                    title: '需要授权',
                                    content: '请允许访问相册以保存收款码',
                                    confirmText: '去设置',
                                    success: (res) => {
                                        if (res.confirm) {
                                            wx.openSetting()
                                        }
                                    }
                                })
                            } else {
                                wx.showToast({ title: '保存失败，请重试', icon: 'none' })
                            }
                        }
                    })
                } else {
                    wx.hideLoading()
                    wx.showToast({ title: '下载失败，请重试', icon: 'none' })
                }
            },
            fail: () => {
                wx.hideLoading()
                wx.showToast({ title: '网络错误，请重试', icon: 'none' })
            }
        })
    },

    // 显示支付指引
    showPaymentGuide() {
        const price = this.data.packageInfo.price
        wx.showModal({
            title: '✅ 收款码已保存',
            content: `📱 支付步骤：\n\n1️⃣ 打开微信首页\n\n2️⃣ 点击右上角"+"号\n\n3️⃣ 选择"扫一扫"\n\n4️⃣ 点击右上角"相册"图标\n\n5️⃣ 选择刚保存的收款码\n\n6️⃣ 确认金额 ¥${price} 后完成支付\n\n7️⃣ 返回小程序点击"我已完成支付"`,
            confirmText: '明白了',
            showCancel: false
        })
    },

    // 我已支付
    async handlePaid() {
        if (this.data.checking) return

        if (!this.data.packageInfo || !this.data.orderInfo) {
            wx.showToast({
                title: '数据错误，请重试',
                icon: 'none'
            })
            return
        }

        wx.showModal({
            title: '⚠️ 支付确认',
            content: `请确认您已完成 ¥${this.data.packageInfo.price} 的转账支付\n\n订单号：${this.data.orderInfo.orderNumber}\n\n虚假确认将导致账号被永久封禁`,
            confirmText: '已完成支付',
            confirmColor: '#ff6b00',
            cancelText: '我再想想',
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
            const { packageInfo, packageConfig, orderInfo } = this.data
            const openid = wx.getStorageSync('openid')
            const userInfo = wx.getStorageSync('userInfo') || {}
            const deviceInfo = wx.getSystemInfoSync()

            // 调用后端API开通会员并记录订单
            const res = await wx.request({
                url: `${CONFIG.memberApiUrl}/member/activate`,
                method: 'POST',
                data: {
                    openid: openid,
                    nick_name: userInfo.nickName || '用户',
                    order_number: orderInfo.orderNumber,
                    package_id: packageConfig.id,
                    package_name: packageConfig.name,
                    amount: packageConfig.price,
                    days: packageConfig.duration,
                    device_info: `${deviceInfo.platform} ${deviceInfo.system}`
                }
            })

            wx.hideLoading()
            this.setData({ checking: false })

            if (res.data.code === 0) {
                // 同时保存到本地（降级方案）
                this.saveOrderRecord({
                    orderNumber: orderInfo.orderNumber,
                    userId: openid,
                    userInfo: userInfo,
                    packageId: packageConfig.id,
                    packageName: packageConfig.name,
                    amount: packageConfig.price,
                    duration: packageConfig.duration,
                    timestamp: Date.now(),
                    date: new Date().toLocaleString('zh-CN'),
                    status: 'pending_verify'
                })

                // 显示成功提示
                wx.showModal({
                    title: '✅ 会员已开通',
                    content: `过期时间：${res.data.data.expire_date}\n\n我们会在24小时内核对支付记录\n如有问题会及时联系您`,
                    confirmText: '开始使用',
                    showCancel: false,
                    success: () => {
                        wx.redirectTo({
                            url: `/pages/member/payment-result/index?status=success&packageName=${packageInfo.name}`
                        })
                    }
                })
            } else {
                throw new Error(res.data.message || '开通失败')
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

    // 保存订单记录
    saveOrderRecord(orderRecord) {
        try {
            // 获取现有订单列表
            let pendingOrders = wx.getStorageSync('pending_orders') || []

            // 添加新订单
            pendingOrders.push(orderRecord)

            // 保存回本地存储
            wx.setStorageSync('pending_orders', pendingOrders)

            console.log('订单记录已保存:', orderRecord)

            // 如果有后端API，可以在这里上传
            // this.uploadOrderToServer(orderRecord)
        } catch (error) {
            console.error('保存订单记录失败:', error)
        }
    },

    // 上传订单到服务器（可选）
    // uploadOrderToServer(orderRecord) {
    //     wx.request({
    //         url: 'https://your-api.com/orders/record',
    //         method: 'POST',
    //         data: orderRecord,
    //         success: (res) => {
    //             console.log('订单已上传到服务器')
    //         },
    //         fail: (err) => {
    //             console.error('上传订单失败', err)
    //         }
    //     })
    // },

    // 取消支付
    handleCancel() {
        wx.navigateBack()
    }
})

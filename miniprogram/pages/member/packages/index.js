const SimpleAuth = require('../../../utils/simpleAuth')
const MemberAPI = require('../../../utils/member-api')

Page({
    data: {
        packages: [],
        selectedPackage: 'quarterly' // 默认选中季度会员
    },

    onLoad(options) {
        // 加载本地套餐配置
        this.loadPackages()

        // 检查登录状态
        SimpleAuth.checkHasLogined().then(isLogined => {
            if (!isLogined) {
                wx.showModal({
                    title: '提示',
                    content: '请先登录后再开通会员',
                    confirmText: '去登录',
                    success: (res) => {
                        if (res.confirm) {
                            wx.navigateTo({
                                url: '/pages/login/simple'
                            })
                        } else {
                            wx.navigateBack()
                        }
                    }
                })
            }
        })
    },

    // 加载套餐配置
    loadPackages() {
        const packagesConfig = MemberAPI.MEMBER_PACKAGES
        const packages = [
            {
                id: packagesConfig.monthly.id,
                name: packagesConfig.monthly.name,
                duration: `${packagesConfig.monthly.duration}天`,
                price: packagesConfig.monthly.price,
                originalPrice: packagesConfig.monthly.price,
                discount: '',
                features: [
                    '无限次岗位分析',
                    '无限次简历解读',
                    '无限次情绪支持',
                    '完整知识库访问'
                ],
                recommended: false,
                badge: ''
            },
            {
                id: packagesConfig.quarterly.id,
                name: packagesConfig.quarterly.name,
                duration: `${packagesConfig.quarterly.duration}天`,
                price: packagesConfig.quarterly.price,
                originalPrice: packagesConfig.monthly.price * 3,
                discount: '优惠17%',
                features: [
                    '无限次岗位分析',
                    '无限次简历解读',
                    '无限次情绪支持',
                    '完整知识库访问',
                    '优先客服支持',
                    '数据云端保存'
                ],
                recommended: true,
                badge: '推荐'
            },
            {
                id: packagesConfig.yearly.id,
                name: packagesConfig.yearly.name,
                duration: `${packagesConfig.yearly.duration}天`,
                price: packagesConfig.yearly.price,
                originalPrice: packagesConfig.monthly.price * 12,
                discount: '优惠58%',
                features: [
                    '无限次岗位分析',
                    '无限次简历解读',
                    '无限次情绪支持',
                    '完整知识库访问',
                    '优先客服支持',
                    '数据云端保存',
                    '多设备同步',
                    '专属客服通道'
                ],
                recommended: false,
                badge: '最划算'
            }
        ]

        this.setData({ packages })
    },

    // 选择套餐
    selectPackage(e) {
        const packageId = e.currentTarget.dataset.id
        this.setData({
            selectedPackage: packageId
        })
    },

    // 查看会员权益详情
    viewBenefits() {
        wx.navigateTo({
            url: '/pages/member/benefits/index'
        })
    },

    // 立即开通
    handlePurchase() {
        const selectedPkg = this.data.packages.find(pkg => pkg.id === this.data.selectedPackage)

        if (!selectedPkg) {
            wx.showToast({
                title: '请选择套餐',
                icon: 'none'
            })
            return
        }

        // 跳转到支付确认页面
        wx.navigateTo({
            url: `/pages/member/payment/index?packageId=${selectedPkg.id}&price=${selectedPkg.price}`
        })
    }
})

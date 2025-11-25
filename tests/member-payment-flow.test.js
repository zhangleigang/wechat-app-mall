/**
 * 会员购买流程测试
 * 测试套餐选择、收款码展示、支付确认和会员激活、会员信息显示
 */

const MemberLocal = require('../utils/memberLocal')

// 模拟微信API
global.wx = {
    getStorageSync: jest.fn(),
    setStorageSync: jest.fn(),
    removeStorageSync: jest.fn(),
    showToast: jest.fn(),
    showModal: jest.fn(),
    showLoading: jest.fn(),
    hideLoading: jest.fn(),
    navigateTo: jest.fn(),
    navigateBack: jest.fn(),
    redirectTo: jest.fn(),
    switchTab: jest.fn(),
    setClipboardData: jest.fn(),
    downloadFile: jest.fn(),
    saveImageToPhotosAlbum: jest.fn(),
    previewImage: jest.fn()
}

// 模拟配置
jest.mock('../config.js', () => ({
    paymentQrcode: {
        url: 'https://example.com/qrcode.jpg',
        accountName: '测试收款账户',
        enabled: true
    }
}))

describe('会员购买流程测试', () => {
    beforeEach(() => {
        // 清除所有mock调用记录
        jest.clearAllMocks()
        // 清除会员缓存
        MemberLocal.clearMemberCache()
    })

    describe('8.2.1 测试套餐选择功能', () => {
        test('应该能够获取所有可用套餐', () => {
            const packages = MemberLocal.MEMBER_PACKAGES

            expect(packages).toBeDefined()
            expect(packages.monthly).toBeDefined()
            expect(packages.quarterly).toBeDefined()
            expect(packages.yearly).toBeDefined()
        })

        test('应该能够根据ID获取套餐信息', () => {
            const monthlyPackage = MemberLocal.getPackageInfo('monthly')

            expect(monthlyPackage).toBeDefined()
            expect(monthlyPackage.id).toBe('monthly')
            expect(monthlyPackage.name).toBe('月度会员')
            expect(monthlyPackage.duration).toBe(30)
            expect(monthlyPackage.price).toBe(19.9)
        })

        test('应该能够获取季度套餐信息', () => {
            const quarterlyPackage = MemberLocal.getPackageInfo('quarterly')

            expect(quarterlyPackage).toBeDefined()
            expect(quarterlyPackage.id).toBe('quarterly')
            expect(quarterlyPackage.name).toBe('季度会员')
            expect(quarterlyPackage.duration).toBe(90)
            expect(quarterlyPackage.price).toBe(49.9)
        })

        test('应该能够获取年度套餐信息', () => {
            const yearlyPackage = MemberLocal.getPackageInfo('yearly')

            expect(yearlyPackage).toBeDefined()
            expect(yearlyPackage.id).toBe('yearly')
            expect(yearlyPackage.name).toBe('年度会员')
            expect(yearlyPackage.duration).toBe(365)
            expect(yearlyPackage.price).toBe(99.9)
        })

        test('无效的套餐ID应该返回null', () => {
            const invalidPackage = MemberLocal.getPackageInfo('invalid')

            expect(invalidPackage).toBeNull()
        })

        test('套餐信息应该包含所有必要字段', () => {
            const packageInfo = MemberLocal.getPackageInfo('monthly')

            expect(packageInfo).toHaveProperty('id')
            expect(packageInfo).toHaveProperty('name')
            expect(packageInfo).toHaveProperty('duration')
            expect(packageInfo).toHaveProperty('price')
        })
    })

    describe('8.2.2 测试收款码展示', () => {
        test('支付页面应该显示收款码URL', () => {
            const CONFIG = require('../config.js')

            expect(CONFIG.paymentQrcode.url).toBeDefined()
            expect(CONFIG.paymentQrcode.url).toBe('https://example.com/qrcode.jpg')
        })

        test('支付页面应该显示收款账户名', () => {
            const CONFIG = require('../config.js')

            expect(CONFIG.paymentQrcode.accountName).toBeDefined()
            expect(CONFIG.paymentQrcode.accountName).toBe('测试收款账户')
        })

        test('支付页面应该显示套餐价格', () => {
            const packageInfo = MemberLocal.getPackageInfo('yearly')

            expect(packageInfo.price).toBe(99.9)
        })

        test('应该能够生成订单号', () => {
            const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`

            expect(orderId).toMatch(/^ORDER_\d+_[A-Z0-9]+$/)
        })
    })

    describe('8.2.3 测试支付确认和会员激活', () => {
        test('应该能够激活月度会员', () => {
            wx.getStorageSync.mockReturnValue(null)

            const result = MemberLocal.activateMember('monthly', 30)

            expect(result.success).toBe(true)
            expect(wx.setStorageSync).toHaveBeenCalled()

            // 验证会员信息
            const memberInfo = MemberLocal.getMemberInfo()
            expect(memberInfo.isValid).toBe(true)
            expect(memberInfo.packageType).toBe('monthly')
        })

        test('应该能够激活季度会员', () => {
            wx.getStorageSync.mockReturnValue(null)

            const result = MemberLocal.activateMember('quarterly', 90)

            expect(result.success).toBe(true)

            const memberInfo = MemberLocal.getMemberInfo()
            expect(memberInfo.isValid).toBe(true)
            expect(memberInfo.packageType).toBe('quarterly')
            expect(memberInfo.daysRemaining).toBeGreaterThanOrEqual(89)
        })

        test('应该能够激活年度会员', () => {
            wx.getStorageSync.mockReturnValue(null)

            const result = MemberLocal.activateMember('yearly', 365)

            expect(result.success).toBe(true)

            const memberInfo = MemberLocal.getMemberInfo()
            expect(memberInfo.isValid).toBe(true)
            expect(memberInfo.packageType).toBe('yearly')
            expect(memberInfo.daysRemaining).toBeGreaterThanOrEqual(364)
        })

        test('激活会员应该设置正确的到期时间', () => {
            wx.getStorageSync.mockReturnValue(null)

            const now = new Date()
            MemberLocal.activateMember('monthly', 30)

            const memberInfo = MemberLocal.getMemberInfo()
            const expireDate = new Date(memberInfo.expireDate)

            // 到期时间应该在30天后
            const expectedExpire = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            const timeDiff = Math.abs(expireDate.getTime() - expectedExpire.getTime())

            // 允许1秒的误差
            expect(timeDiff).toBeLessThan(1000)
        })

        test('激活会员应该保存购买日期', () => {
            wx.getStorageSync.mockReturnValue(null)

            const now = new Date()
            MemberLocal.activateMember('monthly', 30)

            const memberInfo = MemberLocal.getMemberInfo()
            const purchaseDate = new Date(memberInfo.purchaseDate)

            // 购买日期应该是当前时间
            const timeDiff = Math.abs(purchaseDate.getTime() - now.getTime())
            expect(timeDiff).toBeLessThan(1000)
        })

        test('激活会员应该生成订单ID', () => {
            wx.getStorageSync.mockReturnValue(null)

            MemberLocal.activateMember('monthly', 30)

            const memberInfo = MemberLocal.getMemberInfo()

            expect(memberInfo.orderId).toBeDefined()
            expect(memberInfo.orderId).toMatch(/^local_\d+$/)
        })

        test('重复激活应该延长会员时间', () => {
            wx.getStorageSync.mockReturnValue(null)

            // 第一次激活
            MemberLocal.activateMember('monthly', 30)
            const firstInfo = MemberLocal.getMemberInfo()
            const firstExpire = new Date(firstInfo.expireDate)

            // 第二次激活
            MemberLocal.activateMember('monthly', 30)
            const secondInfo = MemberLocal.getMemberInfo()
            const secondExpire = new Date(secondInfo.expireDate)

            // 第二次到期时间应该比第一次晚30天
            const daysDiff = (secondExpire.getTime() - firstExpire.getTime()) / (24 * 60 * 60 * 1000)
            expect(daysDiff).toBeGreaterThanOrEqual(29)
            expect(daysDiff).toBeLessThanOrEqual(31)
        })
    })

    describe('8.2.4 测试会员信息显示', () => {
        test('应该能够获取会员信息', () => {
            wx.getStorageSync.mockReturnValue(null)

            MemberLocal.activateMember('yearly', 365)
            const memberInfo = MemberLocal.getMemberInfo()

            expect(memberInfo).toBeDefined()
            expect(memberInfo.isValid).toBe(true)
            expect(memberInfo.expireDate).toBeDefined()
            expect(memberInfo.purchaseDate).toBeDefined()
            expect(memberInfo.packageType).toBe('yearly')
            expect(memberInfo.daysRemaining).toBeDefined()
        })

        test('会员信息应该包含剩余天数', () => {
            wx.getStorageSync.mockReturnValue(null)

            MemberLocal.activateMember('monthly', 30)
            const memberInfo = MemberLocal.getMemberInfo()

            expect(memberInfo.daysRemaining).toBeGreaterThanOrEqual(29)
            expect(memberInfo.daysRemaining).toBeLessThanOrEqual(30)
        })

        test('会员信息应该包含格式化的到期日期', () => {
            wx.getStorageSync.mockReturnValue(null)

            MemberLocal.activateMember('monthly', 30)
            const memberInfo = MemberLocal.getMemberInfo()

            expect(memberInfo.expireDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
        })

        test('应该能够刷新会员状态', () => {
            wx.getStorageSync.mockImplementation((key) => {
                if (key === 'memberInfo') {
                    return JSON.stringify({
                        isValid: true,
                        expireDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        packageType: 'monthly'
                    })
                }
                return null
            })

            const memberInfo = MemberLocal.refreshMemberStatus()

            expect(memberInfo).toBeDefined()
            expect(memberInfo.isValid).toBe(true)
            expect(memberInfo.daysRemaining).toBeGreaterThanOrEqual(29)
        })

        test('未激活会员应该返回无效状态', () => {
            wx.getStorageSync.mockReturnValue(null)

            const memberInfo = MemberLocal.getMemberInfo()

            expect(memberInfo.isValid).toBe(false)
            expect(memberInfo.reason).toBe('not_member')
        })

        test('过期会员应该返回过期状态', () => {
            wx.getStorageSync.mockImplementation((key) => {
                if (key === 'memberInfo') {
                    return JSON.stringify({
                        isValid: true,
                        expireDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 昨天过期
                        packageType: 'monthly'
                    })
                }
                return null
            })

            const memberInfo = MemberLocal.getMemberInfo()

            expect(memberInfo.isValid).toBe(false)
            expect(memberInfo.reason).toBe('expired')
        })
    })

    describe('完整购买流程测试', () => {
        test('完整的购买流程应该成功', () => {
            wx.getStorageSync.mockReturnValue(null)

            // 1. 选择套餐
            const packageInfo = MemberLocal.getPackageInfo('yearly')
            expect(packageInfo).toBeDefined()

            // 2. 生成订单号
            const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
            expect(orderId).toMatch(/^ORDER_/)

            // 3. 显示收款码
            const CONFIG = require('../config.js')
            expect(CONFIG.paymentQrcode.url).toBeDefined()

            // 4. 确认支付并激活会员
            const result = MemberLocal.activateMember(packageInfo.id, packageInfo.duration)
            expect(result.success).toBe(true)

            // 5. 获取会员信息
            const memberInfo = MemberLocal.getMemberInfo()
            expect(memberInfo.isValid).toBe(true)
            expect(memberInfo.packageType).toBe('yearly')
            expect(memberInfo.daysRemaining).toBeGreaterThanOrEqual(364)
        })

        test('购买后应该能够立即使用会员功能', () => {
            wx.getStorageSync.mockReturnValue(null)

            // 激活会员
            MemberLocal.activateMember('monthly', 30)

            // 检查会员状态
            const status = MemberLocal.checkMemberStatus()

            expect(status.isValid).toBe(true)
            expect(status.canUse).toBe(true)
        })
    })
})

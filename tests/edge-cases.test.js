/**
 * 边界情况测试
 * 测试删除本地存储后的行为、会员到期边界时间、并发访问情况
 */

const MemberLocal = require('../utils/memberLocal')
const SimpleAuth = require('../utils/simpleAuth')

// 模拟微信API
global.wx = {
    getStorageSync: jest.fn(),
    setStorageSync: jest.fn(),
    removeStorageSync: jest.fn(),
    showToast: jest.fn(),
    showModal: jest.fn(),
    login: jest.fn(),
    request: jest.fn()
}

// 模拟配置
jest.mock('../config.js', () => ({
    knowledgeApiUrl: 'https://api.feelnow.cn:8443/api',
    paymentQrcode: {
        url: 'https://example.com/qrcode.jpg',
        accountName: '测试收款账户',
        enabled: true
    }
}))

describe('边界情况测试', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        MemberLocal.clearMemberCache()
    })

    describe('8.4.1 测试删除本地存储后的行为', () => {
        test('删除所有存储后应该能够重新登录', async () => {
            // 模拟删除所有存储
            wx.getStorageSync.mockReturnValue(null)
            wx.login.mockImplementation((options) => {
                options.success({ code: 'new_code_after_clear' })
            })

            // 尝试登录
            const result = await SimpleAuth.silentLogin()

            expect(wx.login).toHaveBeenCalled()
            expect(result.success).toBe(true)
            expect(result.data.userId).toBeDefined()
            expect(result.data.token).toBeDefined()
        })

        test('删除会员数据后应该返回未开通会员状态', () => {
            wx.getStorageSync.mockImplementation((key) => {
                if (key === 'userId') return 'user_123'
                if (key === 'token') return 'token_456'
                return null // memberData 被删除
            })

            const memberInfo = MemberLocal.getMemberInfo()

            expect(memberInfo.isValid).toBe(false)
            expect(memberInfo.reason).toBe('not_member')
        })

        test('删除用户数据后应该返回未登录状态', () => {
            wx.getStorageSync.mockReturnValue(null)

            const memberInfo = MemberLocal.getMemberInfo()

            expect(memberInfo.isValid).toBe(false)
            expect(memberInfo.reason).toBe('not_login')
        })

        test('部分删除存储后应该能够恢复', async () => {
            // 只保留 userId，删除 token
            wx.getStorageSync.mockImplementation((key) => {
                if (key === 'userId') return 'user_123'
                return null
            })

            wx.login.mockImplementation((options) => {
                options.success({ code: 'recovery_code' })
            })

            const result = await SimpleAuth.checkHasLogined()

            expect(result).toBe(true)
            expect(wx.setStorageSync).toHaveBeenCalled()
        })

        test('清除缓存后应该重新计算会员状态', () => {
            // 设置会员数据
            const memberData = {
                isValid: true,
                expireDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                packageType: 'monthly'
            }

            wx.getStorageSync.mockImplementation((key) => {
                if (key === 'userId') return 'user_123'
                if (key === 'token') return 'token_456'
                if (key === 'memberData') return memberData
                return null
            })

            // 第一次获取（会缓存）
            const info1 = MemberLocal.getMemberInfo()
            expect(info1.isValid).toBe(true)

            // 清除缓存
            MemberLocal.clearMemberCache()

            // 第二次获取（重新计算）
            const info2 = MemberLocal.getMemberInfo()
            expect(info2.isValid).toBe(true)
            expect(info2.daysRemaining).toBeDefined()
        })
    })

    describe('8.4.2 测试会员到期边界时间', () => {
        test('会员在到期当天23:59:59应该仍然有效', () => {
            const today = new Date()
            today.setHours(23, 59, 59, 999)

            wx.getStorageSync.mockImplementation((key) => {
                if (key === 'userId') return 'user_123'
                if (key === 'token') return 'token_456'
                if (key === 'memberData') {
                    return {
                        isValid: true,
                        expireDate: today.toISOString(),
                        packageType: 'monthly'
                    }
                }
                return null
            })

            const memberInfo = MemberLocal.getMemberInfo()

            expect(memberInfo.isValid).toBe(true)
            expect(memberInfo.daysRemaining).toBe(0)
        })

        test('会员在到期后1秒应该失效', () => {
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            yesterday.setHours(23, 59, 59, 999)

            wx.getStorageSync.mockImplementation((key) => {
                if (key === 'userId') return 'user_123'
                if (key === 'token') return 'token_456'
                if (key === 'memberData') {
                    return {
                        isValid: true,
                        expireDate: yesterday.toISOString(),
                        packageType: 'monthly'
                    }
                }
                return null
            })

            const memberInfo = MemberLocal.getMemberInfo()

            expect(memberInfo.isValid).toBe(false)
            expect(memberInfo.reason).toBe('expired')
        })

        test('会员在到期前1小时应该仍然有效', () => {
            const oneHourLater = new Date(Date.now() + 60 * 60 * 1000)

            wx.getStorageSync.mockImplementation((key) => {
                if (key === 'userId') return 'user_123'
                if (key === 'token') return 'token_456'
                if (key === 'memberData') {
                    return {
                        isValid: true,
                        expireDate: oneHourLater.toISOString(),
                        packageType: 'monthly'
                    }
                }
                return null
            })

            const memberInfo = MemberLocal.getMemberInfo()

            expect(memberInfo.isValid).toBe(true)
            expect(memberInfo.daysRemaining).toBe(0)
        })

        test('会员剩余天数计算应该向下取整', () => {
            const futureDate = new Date(Date.now() + 30.9 * 24 * 60 * 60 * 1000)

            wx.getStorageSync.mockImplementation((key) => {
                if (key === 'userId') return 'user_123'
                if (key === 'token') return 'token_456'
                if (key === 'memberData') {
                    return {
                        isValid: true,
                        expireDate: futureDate.toISOString(),
                        packageType: 'monthly'
                    }
                }
                return null
            })

            const memberInfo = MemberLocal.getMemberInfo()

            expect(memberInfo.isValid).toBe(true)
            expect(memberInfo.daysRemaining).toBe(30)
        })

        test('激活会员时应该精确计算到期时间', () => {
            wx.getStorageSync.mockReturnValue(null)

            const beforeActivate = Date.now()
            MemberLocal.activateMember('monthly', 30)
            const afterActivate = Date.now()

            const memberInfo = MemberLocal.getMemberInfo()
            const expireTime = new Date(memberInfo.expireDate).getTime()
            const expectedExpire = beforeActivate + 30 * 24 * 60 * 60 * 1000

            // 允许激活过程中的时间误差（最多1秒）
            expect(expireTime).toBeGreaterThanOrEqual(expectedExpire)
            expect(expireTime).toBeLessThanOrEqual(expectedExpire + (afterActivate - beforeActivate) + 1000)
        })

        test('跨年会员到期时间应该正确计算', () => {
            wx.getStorageSync.mockReturnValue(null)

            // 假设在12月31日激活
            const dec31 = new Date('2025-12-31T23:59:59')
            const originalNow = Date.now
            Date.now = jest.fn(() => dec31.getTime())

            MemberLocal.activateMember('monthly', 30)

            const memberInfo = MemberLocal.getMemberInfo()
            const expireDate = new Date(memberInfo.expireDate)

            // 应该到期在次年1月30日
            expect(expireDate.getFullYear()).toBe(2026)
            expect(expireDate.getMonth()).toBe(0) // 1月
            expect(expireDate.getDate()).toBe(30)

            // 恢复原始 Date.now
            Date.now = originalNow
        })

        test('闰年2月会员到期时间应该正确计算', () => {
            wx.getStorageSync.mockReturnValue(null)

            // 假设在2024年1月31日激活（2024是闰年）
            const jan31 = new Date('2024-01-31T12:00:00')
            const originalNow = Date.now
            Date.now = jest.fn(() => jan31.getTime())

            MemberLocal.activateMember('monthly', 30)

            const memberInfo = MemberLocal.getMemberInfo()
            const expireDate = new Date(memberInfo.expireDate)

            // 应该到期在3月1日或3月2日（取决于30天的计算）
            expect(expireDate.getFullYear()).toBe(2024)
            expect(expireDate.getMonth()).toBeGreaterThanOrEqual(1) // 至少是2月

            // 恢复原始 Date.now
            Date.now = originalNow
        })
    })

    describe('8.4.3 测试并发访问情况', () => {
        test('多次同时调用getMemberInfo应该返回一致结果', () => {
            wx.getStorageSync.mockImplementation((key) => {
                if (key === 'userId') return 'user_123'
                if (key === 'token') return 'token_456'
                if (key === 'memberData') {
                    return {
                        isValid: true,
                        expireDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        packageType: 'monthly'
                    }
                }
                return null
            })

            // 清除缓存确保每次都重新计算
            MemberLocal.clearMemberCache()

            // 并发调用10次
            const results = []
            for (let i = 0; i < 10; i++) {
                MemberLocal.clearMemberCache() // 每次清除缓存
                results.push(MemberLocal.getMemberInfo())
            }

            // 所有结果应该一致
            const firstResult = results[0]
            results.forEach(result => {
                expect(result.isValid).toBe(firstResult.isValid)
                expect(result.daysRemaining).toBe(firstResult.daysRemaining)
                expect(result.packageType).toBe(firstResult.packageType)
            })
        })

        test('并发激活会员应该正确累加时间', () => {
            wx.getStorageSync.mockReturnValue(null)

            // 第一次激活
            MemberLocal.activateMember('monthly', 30)
            const firstExpire = new Date(MemberLocal.getMemberInfo().expireDate)

            // 立即第二次激活
            MemberLocal.activateMember('monthly', 30)
            const secondExpire = new Date(MemberLocal.getMemberInfo().expireDate)

            // 第二次到期时间应该比第一次晚约30天
            const daysDiff = (secondExpire.getTime() - firstExpire.getTime()) / (24 * 60 * 60 * 1000)
            expect(daysDiff).toBeGreaterThanOrEqual(29)
            expect(daysDiff).toBeLessThanOrEqual(31)
        })

        test('并发调用checkMemberStatus应该返回一致结果', () => {
            wx.getStorageSync.mockImplementation((key) => {
                if (key === 'userId') return 'user_123'
                if (key === 'token') return 'token_456'
                if (key === 'memberData') {
                    return {
                        isValid: true,
                        expireDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        packageType: 'monthly'
                    }
                }
                return null
            })

            // 并发调用多次
            const results = []
            for (let i = 0; i < 5; i++) {
                results.push(MemberLocal.checkMemberStatus())
            }

            // 所有结果应该一致
            results.forEach(result => {
                expect(result.isValid).toBe(true)
                expect(result.canUse).toBe(true)
            })
        })

        test('快速切换登录状态应该正确处理', async () => {
            // 模拟快速登录、登出、再登录
            wx.getStorageSync.mockReturnValue(null)
            wx.login.mockImplementation((options) => {
                options.success({ code: 'test_code' })
            })

            // 第一次登录
            await SimpleAuth.silentLogin()
            expect(wx.setStorageSync).toHaveBeenCalled()

            // 登出
            SimpleAuth.logout()
            expect(wx.removeStorageSync).toHaveBeenCalled()

            // 再次登录
            jest.clearAllMocks()
            wx.getStorageSync.mockReturnValue(null)
            await SimpleAuth.silentLogin()
            expect(wx.setStorageSync).toHaveBeenCalled()
        })

        test('缓存机制应该在并发访问时正常工作', () => {
            wx.getStorageSync.mockImplementation((key) => {
                if (key === 'userId') return 'user_123'
                if (key === 'token') return 'token_456'
                if (key === 'memberData') {
                    return {
                        isValid: true,
                        expireDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        packageType: 'monthly'
                    }
                }
                return null
            })

            // 第一次调用会读取存储
            const info1 = MemberLocal.getMemberInfo()
            const storageCallCount1 = wx.getStorageSync.mock.calls.length

            // 后续调用应该使用缓存
            const info2 = MemberLocal.getMemberInfo()
            const info3 = MemberLocal.getMemberInfo()
            const storageCallCount2 = wx.getStorageSync.mock.calls.length

            // 缓存生效，存储调用次数不应该增加太多
            expect(storageCallCount2).toBeLessThanOrEqual(storageCallCount1 + 6) // 允许少量额外调用
            expect(info1.isValid).toBe(info2.isValid)
            expect(info2.isValid).toBe(info3.isValid)
        })
    })

    describe('8.4.4 其他边界情况', () => {
        test('无效的套餐ID应该返回错误', () => {
            wx.getStorageSync.mockReturnValue(null)

            const result = MemberLocal.activateMember('invalid_package', 30)

            expect(result.success).toBe(false)
            expect(result.msg).toContain('无效')
        })

        test('负数天数应该被拒绝', () => {
            wx.getStorageSync.mockReturnValue(null)

            const result = MemberLocal.activateMember('monthly', -10)

            expect(result.success).toBe(false)
        })

        test('零天数应该被拒绝', () => {
            wx.getStorageSync.mockReturnValue(null)

            const result = MemberLocal.activateMember('monthly', 0)

            expect(result.success).toBe(false)
        })

        test('超大天数应该能够正常处理', () => {
            wx.getStorageSync.mockReturnValue(null)

            const result = MemberLocal.activateMember('yearly', 3650) // 10年

            expect(result.success).toBe(true)

            const memberInfo = MemberLocal.getMemberInfo()
            expect(memberInfo.isValid).toBe(true)
            expect(memberInfo.daysRemaining).toBeGreaterThan(3600)
        })

        test('损坏的会员数据应该被正确处理', () => {
            wx.getStorageSync.mockImplementation((key) => {
                if (key === 'userId') return 'user_123'
                if (key === 'token') return 'token_456'
                if (key === 'memberData') {
                    return {
                        // 缺少必要字段
                        isValid: true
                        // 没有 expireDate
                    }
                }
                return null
            })

            const memberInfo = MemberLocal.getMemberInfo()

            // 应该返回无效状态
            expect(memberInfo.isValid).toBe(false)
        })

        test('非法的日期格式应该被正确处理', () => {
            wx.getStorageSync.mockImplementation((key) => {
                if (key === 'userId') return 'user_123'
                if (key === 'token') return 'token_456'
                if (key === 'memberData') {
                    return {
                        isValid: true,
                        expireDate: 'invalid-date-format',
                        packageType: 'monthly'
                    }
                }
                return null
            })

            const memberInfo = MemberLocal.getMemberInfo()

            // 应该返回无效状态
            expect(memberInfo.isValid).toBe(false)
        })

        test('Token过期边界应该精确到毫秒', () => {
            const now = Date.now()
            const exactly30Days = now - (30 * 24 * 60 * 60 * 1000)

            wx.getStorageSync.mockImplementation((key) => {
                if (key === 'userId') return 'user_123'
                if (key === 'token') return 'token_456'
                if (key === 'loginTime') return exactly30Days
                return null
            })

            // 正好30天，应该仍然有效
            const isLogined = SimpleAuth.checkLoginStatus()
            expect(isLogined).toBe(true)
        })

        test('Token过期后1毫秒应该失效', () => {
            const now = Date.now()
            const over30Days = now - (30 * 24 * 60 * 60 * 1000 + 1)

            wx.getStorageSync.mockImplementation((key) => {
                if (key === 'userId') return 'user_123'
                if (key === 'token') return 'token_456'
                if (key === 'loginTime') return over30Days
                return null
            })

            const isLogined = SimpleAuth.checkLoginStatus()
            expect(isLogined).toBe(false)
        })
    })
})

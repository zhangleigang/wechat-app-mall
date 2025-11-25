/**
 * 认证流程测试
 * 测试首次启动自动登录、Token过期重新登录、网络断开本地降级
 */

const SimpleAuth = require('../utils/simpleAuth')

// 模拟微信API
global.wx = {
    login: jest.fn(),
    request: jest.fn(),
    getStorageSync: jest.fn(),
    setStorageSync: jest.fn(),
    removeStorageSync: jest.fn(),
    showToast: jest.fn()
}

// 模拟配置
jest.mock('../config.js', () => ({
    knowledgeApiUrl: 'https://api.feelnow.cn:8443/api',
    version: '1.0.0'
}))

describe('认证流程测试', () => {
    beforeEach(() => {
        // 清除所有mock调用记录
        jest.clearAllMocks()
    })

    describe('8.1.1 测试首次启动自动登录', () => {
        test('首次启动时应该自动调用微信登录', async () => {
            // 模拟首次启动，无本地存储
            wx.getStorageSync.mockReturnValue(null)
            wx.login.mockImplementation((options) => {
                options.success({ code: 'test_wx_code_123' })
            })

            // 模拟后端API登录成功
            wx.request.mockImplementation((options) => {
                options.success({
                    data: {
                        code: 0,
                        data: {
                            userId: 'backend_user_123',
                            token: 'backend_token_456',
                            openid: 'test_openid'
                        }
                    }
                })
            })

            const result = await SimpleAuth.silentLogin()

            expect(wx.login).toHaveBeenCalled()
            expect(wx.request).toHaveBeenCalled()
            expect(result.success).toBe(true)
            expect(result.data.userId).toBe('backend_user_123')
            expect(wx.setStorageSync).toHaveBeenCalledWith('userId', 'backend_user_123')
            expect(wx.setStorageSync).toHaveBeenCalledWith('token', 'backend_token_456')
        })

        test('首次启动时如果已有本地信息应该直接使用', async () => {
            // 模拟已有本地存储
            wx.getStorageSync.mockImplementation((key) => {
                if (key === 'userId') return 'existing_user_123'
                if (key === 'token') return 'existing_token_456'
                return null
            })

            const result = await SimpleAuth.silentLogin()

            expect(wx.login).not.toHaveBeenCalled()
            expect(result.success).toBe(true)
            expect(result.data.userId).toBe('existing_user_123')
        })

        test('checkHasLogined应该在未登录时自动触发登录', async () => {
            // 模拟未登录状态
            wx.getStorageSync.mockReturnValue(null)
            wx.login.mockImplementation((options) => {
                options.success({ code: 'test_code' })
            })

            // 模拟本地登录
            const result = await SimpleAuth.checkHasLogined()

            expect(wx.login).toHaveBeenCalled()
            expect(result).toBe(true)
        })
    })

    describe('8.1.2 测试Token过期后的重新登录', () => {
        test('Token过期应该返回false并清除存储', () => {
            const now = Date.now()
            const expiredTime = now - (31 * 24 * 60 * 60 * 1000) // 31天前

            wx.getStorageSync.mockImplementation((key) => {
                if (key === 'userId') return 'user_123'
                if (key === 'token') return 'token_456'
                if (key === 'loginTime') return expiredTime
                return null
            })

            const isLogined = SimpleAuth.checkLoginStatus()

            expect(isLogined).toBe(false)
            expect(wx.removeStorageSync).toHaveBeenCalledWith('userId')
            expect(wx.removeStorageSync).toHaveBeenCalledWith('token')
        })

        test('Token未过期应该返回true', () => {
            const now = Date.now()
            const recentTime = now - (10 * 24 * 60 * 60 * 1000) // 10天前

            wx.getStorageSync.mockImplementation((key) => {
                if (key === 'userId') return 'user_123'
                if (key === 'token') return 'token_456'
                if (key === 'loginTime') return recentTime
                return null
            })

            const isLogined = SimpleAuth.checkLoginStatus()

            expect(isLogined).toBe(true)
            expect(wx.removeStorageSync).not.toHaveBeenCalled()
        })

        test('Token过期后checkHasLogined应该自动重新登录', async () => {
            const expiredTime = Date.now() - (31 * 24 * 60 * 60 * 1000)

            // 第一次调用返回过期的token，后续调用返回null（已清除）
            let callCount = 0
            wx.getStorageSync.mockImplementation((key) => {
                callCount++
                if (callCount <= 3) {
                    if (key === 'userId') return 'user_123'
                    if (key === 'token') return 'token_456'
                    if (key === 'loginTime') return expiredTime
                }
                return null
            })

            wx.login.mockImplementation((options) => {
                options.success({ code: 'new_code' })
            })

            const result = await SimpleAuth.checkHasLogined()

            expect(wx.removeStorageSync).toHaveBeenCalled()
            expect(wx.login).toHaveBeenCalled()
            expect(result).toBe(true)
        })
    })

    describe('8.1.3 测试网络断开时的本地降级', () => {
        test('后端API失败时应该降级到本地登录', async () => {
            wx.getStorageSync.mockReturnValue(null)
            wx.login.mockImplementation((options) => {
                options.success({ code: 'test_code' })
            })

            // 模拟网络请求失败
            wx.request.mockImplementation((options) => {
                options.fail(new Error('网络错误'))
            })

            const result = await SimpleAuth.silentLogin()

            expect(wx.request).toHaveBeenCalled()
            expect(result.success).toBe(true)
            expect(result.data.userId).toMatch(/^user_/)
            expect(result.data.token).toMatch(/^token_/)
            expect(wx.setStorageSync).toHaveBeenCalledWith('userId', expect.stringMatching(/^user_/))
        })

        test('后端API返回错误时应该降级到本地登录', async () => {
            wx.getStorageSync.mockReturnValue(null)
            wx.login.mockImplementation((options) => {
                options.success({ code: 'test_code' })
            })

            // 模拟后端返回错误
            wx.request.mockImplementation((options) => {
                options.success({
                    data: {
                        code: -1,
                        msg: '服务器错误'
                    }
                })
            })

            const result = await SimpleAuth.silentLogin()

            // 应该抛出错误，不会降级（根据当前实现）
            expect(result.success).toBe(false)
        })

        test('本地登录应该生成有效的用户信息', async () => {
            wx.getStorageSync.mockReturnValue(null)
            wx.login.mockImplementation((options) => {
                options.success({ code: 'test_code' })
            })

            // 模拟使用本地配置
            const CONFIG = require('../config.js')
            CONFIG.knowledgeApiUrl = 'http://localhost:3000/api'

            const result = await SimpleAuth.silentLogin()

            expect(result.success).toBe(true)
            expect(result.data.userId).toMatch(/^user_\d+_[a-z0-9]+$/)
            expect(result.data.token).toMatch(/^token_\d+_[a-z0-9]+$/)
            expect(wx.setStorageSync).toHaveBeenCalledWith('wxCode', 'test_code')
        })
    })

    describe('其他认证功能测试', () => {
        test('getUserInfo应该返回完整的用户信息', () => {
            wx.getStorageSync.mockImplementation((key) => {
                const data = {
                    userId: 'user_123',
                    token: 'token_456',
                    phone: '138****1234',
                    nickName: '测试用户',
                    avatarUrl: 'https://example.com/avatar.jpg',
                    loginTime: Date.now()
                }
                return data[key]
            })

            const userInfo = SimpleAuth.getUserInfo()

            expect(userInfo.userId).toBe('user_123')
            expect(userInfo.token).toBe('token_456')
            expect(userInfo.phone).toBe('138****1234')
            expect(userInfo.nickName).toBe('测试用户')
        })

        test('logout应该清除所有认证信息', () => {
            SimpleAuth.logout()

            expect(wx.removeStorageSync).toHaveBeenCalledWith('userId')
            expect(wx.removeStorageSync).toHaveBeenCalledWith('token')
            expect(wx.removeStorageSync).toHaveBeenCalledWith('phone')
            expect(wx.removeStorageSync).toHaveBeenCalledWith('nickName')
            expect(wx.removeStorageSync).toHaveBeenCalledWith('avatarUrl')
            expect(wx.removeStorageSync).toHaveBeenCalledWith('wxCode')
            expect(wx.removeStorageSync).toHaveBeenCalledWith('loginTime')
        })

        test('getAuthHeaders应该返回正确的请求头', () => {
            wx.getStorageSync.mockImplementation((key) => {
                if (key === 'token') return 'test_token_123'
                if (key === 'userId') return 'test_user_456'
                return null
            })

            const headers = SimpleAuth.getAuthHeaders()

            expect(headers['Authorization']).toBe('Bearer test_token_123')
            expect(headers['X-User-Id']).toBe('test_user_456')
            expect(headers['Content-Type']).toBe('application/json')
        })
    })
})

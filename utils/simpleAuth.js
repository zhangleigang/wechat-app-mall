/**
 * 简化版认证工具
 * 用于本地开发和测试，不依赖第三方服务
 */

const CONFIG = require('../config.js')

/**
 * 获取微信登录 code
 */
function getWxCode() {
    return new Promise((resolve, reject) => {
        wx.login({
            success: (res) => {
                if (res.code) {
                    resolve(res.code)
                } else {
                    reject(new Error('获取code失败'))
                }
            },
            fail: reject
        })
    })
}

/**
 * 生成简单的用户ID（基于时间戳和随机数）
 */
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

/**
 * 生成简单的 token
 */
function generateToken() {
    return 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16)
}

/**
 * 静默登录
 * 支持本地模拟和后端API两种模式
 */
async function silentLogin() {
    try {
        // 1. 检查是否已有本地用户信息
        let userId = wx.getStorageSync('userId')
        let token = wx.getStorageSync('token')

        if (userId && token) {
            console.log('使用已有登录信息:', { userId, token })
            return {
                success: true,
                data: { userId, token }
            }
        }

        // 2. 获取微信 code
        const code = await getWxCode()
        console.log('获取到微信 code:', code)

        // 3. 判断是否使用后端API
        if (CONFIG.knowledgeApiUrl && CONFIG.knowledgeApiUrl !== 'http://localhost:3000/api') {
            // 使用后端API登录
            console.log('使用后端API登录')
            return await loginWithBackend(code)
        } else {
            // 使用本地模拟登录
            console.log('使用本地模拟登录')
            return await loginLocally(code)
        }
    } catch (error) {
        console.error('静默登录失败:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * 使用后端API登录
 */
async function loginWithBackend(code) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${CONFIG.knowledgeApiUrl.replace('/api', '')}/api/auth/login`,
            method: 'POST',
            data: { code },
            success: (res) => {
                if (res.data.code === 0) {
                    // 保存登录信息
                    wx.setStorageSync('userId', res.data.data.userId)
                    wx.setStorageSync('token', res.data.data.token)
                    wx.setStorageSync('openid', res.data.data.openid)
                    wx.setStorageSync('loginTime', Date.now())

                    console.log('后端登录成功:', res.data.data)

                    resolve({
                        success: true,
                        data: res.data.data
                    })
                } else {
                    reject(new Error(res.data.msg || '登录失败'))
                }
            },
            fail: (err) => {
                console.error('后端登录请求失败:', err)
                // 降级到本地登录
                console.log('降级到本地登录')
                loginLocally(code).then(resolve).catch(reject)
            }
        })
    })
}

/**
 * 本地模拟登录
 */
async function loginLocally(code) {
    // 生成本地用户信息
    const userId = generateUserId()
    const token = generateToken()

    // 保存到本地存储
    wx.setStorageSync('userId', userId)
    wx.setStorageSync('token', token)
    wx.setStorageSync('wxCode', code)
    wx.setStorageSync('loginTime', Date.now())

    console.log('本地登录成功:', { userId, token })

    return {
        success: true,
        data: { userId, token, isNewUser: true }
    }
}

/**
 * 手机号登录（模拟）
 * 实际生产环境需要后端解密
 */
async function phoneLogin(phoneCode) {
    try {
        const code = await getWxCode()

        // 模拟手机号（实际需要后端解密）
        const mockPhone = '138****' + Math.floor(Math.random() * 10000).toString().padStart(4, '0')

        let userId = wx.getStorageSync('userId')
        if (!userId) {
            userId = generateUserId()
        }

        const token = generateToken()

        // 保存信息
        wx.setStorageSync('userId', userId)
        wx.setStorageSync('token', token)
        wx.setStorageSync('phone', mockPhone)
        wx.setStorageSync('wxCode', code)
        wx.setStorageSync('loginTime', Date.now())

        console.log('手机号登录成功:', { userId, phone: mockPhone })

        return {
            success: true,
            data: { userId, token, phone: mockPhone }
        }
    } catch (error) {
        console.error('手机号登录失败:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * 检查登录状态
 */
function checkLoginStatus() {
    const userId = wx.getStorageSync('userId')
    const token = wx.getStorageSync('token')
    const loginTime = wx.getStorageSync('loginTime')

    if (!userId || !token) {
        return false
    }

    // 检查登录是否过期（30天）
    const now = Date.now()
    const expireTime = 30 * 24 * 60 * 60 * 1000 // 30天

    if (loginTime && (now - loginTime > expireTime)) {
        console.log('登录已过期')
        logout()
        return false
    }

    return true
}

/**
 * 检查是否已登录，如果未登录则自动静默登录
 */
async function checkHasLogined() {
    const isLogined = checkLoginStatus()

    if (isLogined) {
        return true
    }

    // 自动静默登录
    console.log('未登录，执行自动登录...')
    const result = await silentLogin()
    return result.success
}

/**
 * 获取用户信息
 */
function getUserInfo() {
    return {
        userId: wx.getStorageSync('userId'),
        token: wx.getStorageSync('token'),
        phone: wx.getStorageSync('phone'),
        nickName: wx.getStorageSync('nickName'),
        avatarUrl: wx.getStorageSync('avatarUrl'),
        loginTime: wx.getStorageSync('loginTime')
    }
}

/**
 * 更新用户信息
 */
function updateUserInfo(info) {
    if (info.nickName) {
        wx.setStorageSync('nickName', info.nickName)
    }
    if (info.avatarUrl) {
        wx.setStorageSync('avatarUrl', info.avatarUrl)
    }
    console.log('用户信息已更新:', info)
}

/**
 * 退出登录
 */
function logout() {
    wx.removeStorageSync('userId')
    wx.removeStorageSync('token')
    wx.removeStorageSync('phone')
    wx.removeStorageSync('nickName')
    wx.removeStorageSync('avatarUrl')
    wx.removeStorageSync('wxCode')
    wx.removeStorageSync('loginTime')
    console.log('已退出登录')
}

/**
 * 获取请求头（用于 API 调用）
 */
function getAuthHeaders() {
    const token = wx.getStorageSync('token')
    const userId = wx.getStorageSync('userId')

    return {
        'Authorization': `Bearer ${token}`,
        'X-User-Id': userId,
        'Content-Type': 'application/json'
    }
}

module.exports = {
    getWxCode,
    silentLogin,
    phoneLogin,
    checkLoginStatus,
    checkHasLogined,
    getUserInfo,
    updateUserInfo,
    logout,
    getAuthHeaders
}

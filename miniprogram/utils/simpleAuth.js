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

// 已移除 generateUserId，统一使用 openid

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
        let openid = wx.getStorageSync('openid')
        let token = wx.getStorageSync('token')

        if (openid && token) {
            return {
                success: true,
                data: { openid, token }
            }
        }

        // 2. 获取微信 code
        const code = await getWxCode()

        // 3. 判断是否使用后端API
        if (CONFIG.apiBaseUrl && CONFIG.apiBaseUrl !== 'http://localhost:3000/api') {
            // 使用后端API登录
            return await loginWithBackend(code)
        } else {
            // 使用本地模拟登录
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
    // 使用统一的 API 地址
    const apiUrl = CONFIG.apiBaseUrl || 'https://api.feelnow.cn:8443/api'

    return new Promise((resolve, reject) => {
        wx.request({
            url: `${apiUrl}/auth/login`,
            method: 'POST',
            data: { code },
            success: (res) => {
                if (res.data.code === 0) {
                    // 保存登录信息
                    wx.setStorageSync('openid', res.data.data.openid)
                    wx.setStorageSync('token', res.data.data.token)
                    wx.setStorageSync('loginTime', Date.now())

                    // 保存用户信息（昵称、头像）
                    // 即使是 null 也要保存，确保清空旧数据
                    wx.setStorageSync('nickName', res.data.data.nickName || '')
                    wx.setStorageSync('avatarUrl', res.data.data.avatarUrl || '')

                    resolve({
                        success: true,
                        data: res.data.data
                    })
                } else {
                    reject(new Error(res.data.msg || '登录失败'))
                }
            },
            fail: (err) => {
                // 生产环境不使用本地模拟登录
                reject(new Error('登录服务暂时不可用，请稍后重试'))

                // 开发环境可以取消下面的注释启用降级
                // loginLocally(code).then(resolve).catch(reject)
            }
        })
    })
}

/**
 * 本地模拟登录
 */
async function loginLocally(code) {
    // 生成本地用户信息（使用模拟 openid）
    const openid = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    const token = generateToken()

    // 保存到本地存储
    wx.setStorageSync('openid', openid)
    wx.setStorageSync('token', token)
    wx.setStorageSync('wxCode', code)
    wx.setStorageSync('loginTime', Date.now())

    return {
        success: true,
        data: { openid, token, isNewUser: true }
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

        let openid = wx.getStorageSync('openid')
        if (!openid) {
            openid = 'phone_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        }

        const token = generateToken()

        // 保存信息
        wx.setStorageSync('openid', openid)
        wx.setStorageSync('token', token)
        wx.setStorageSync('phone', mockPhone)
        wx.setStorageSync('wxCode', code)
        wx.setStorageSync('loginTime', Date.now())

        return {
            success: true,
            data: { openid, token, phone: mockPhone }
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
    const openid = wx.getStorageSync('openid')
    const token = wx.getStorageSync('token')
    const loginTime = wx.getStorageSync('loginTime')

    if (!openid || !token) {
        return false
    }

    // 检查登录是否过期（30天）
    const now = Date.now()
    const expireTime = 30 * 24 * 60 * 60 * 1000 // 30天

    if (loginTime && (now - loginTime > expireTime)) {
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
    const result = await silentLogin()
    return result.success
}

/**
 * 获取用户信息
 */
function getUserInfo() {
    return {
        openid: wx.getStorageSync('openid'),
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
    if (info.gender !== undefined) {
        wx.setStorageSync('gender', info.gender)
    }
}

/**
 * 退出登录
 */
function logout() {
    wx.removeStorageSync('openid')
    wx.removeStorageSync('token')
    wx.removeStorageSync('phone')
    wx.removeStorageSync('nickName')
    wx.removeStorageSync('avatarUrl')
    wx.removeStorageSync('wxCode')
    wx.removeStorageSync('loginTime')
}

/**
 * 获取请求头（用于 API 调用）
 */
function getAuthHeaders() {
    const token = wx.getStorageSync('token')
    const openid = wx.getStorageSync('openid')

    return {
        'Authorization': `Bearer ${token}`,
        'X-OpenID': openid,
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

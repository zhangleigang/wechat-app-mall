/**
 * Member Service API 客户端
 * 对接后端会员服务
 */

const CONFIG = require('../config.js')

/**
 * 会员套餐配置
 */
const MEMBER_PACKAGES = {
    monthly: {
        id: 'monthly',
        name: '月度会员',
        duration: 30,
        price: 29.9,
        originalPrice: 39.9
    },
    quarterly: {
        id: 'quarterly',
        name: '季度会员',
        duration: 90,
        price: 49.9,
        originalPrice: 89.9
    },
    yearly: {
        id: 'yearly',
        name: '年度会员',
        duration: 365,
        price: 99.9,
        originalPrice: 299.9
    }
}

/**
 * HTTP请求封装
 */
function request(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const token = wx.getStorageSync('token')

        wx.request({
            url: `${CONFIG.apiBaseUrl}${url}`,
            method: method,
            data: data,
            header: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            success: (res) => {
                if (res.statusCode === 200) {
                    resolve(res.data)
                } else {
                    reject(new Error(res.data.message || '请求失败'))
                }
            },
            fail: (err) => {
                reject(err)
            }
        })
    })
}

/**
 * 查询会员状态
 * @param {string} openid - 用户OpenID
 * @returns {Promise<Object>}
 */
async function getMemberStatus(openid) {
    try {
        const res = await request(`/member/status?openid=${openid}`)

        if (res.code === 0) {
            return {
                success: true,
                isValid: res.data.isValid,
                expireDate: res.data.expireDate,
                daysRemaining: res.data.daysRemaining,
                memberType: formatMemberType(res.data.daysRemaining)
            }
        } else {
            return {
                success: false,
                isValid: false,
                message: res.message
            }
        }
    } catch (err) {
        return {
            success: false,
            isValid: false,
            error: err.message
        }
    }
}

/**
 * 激活会员
 * @param {string} openid - 用户OpenID
 * @param {string} packageId - 套餐ID
 * @param {number} amount - 支付金额
 * @returns {Promise<Object>}
 */
async function activateMember(openid, packageId, amount) {
    try {
        const packageInfo = MEMBER_PACKAGES[packageId]
        if (!packageInfo) {
            throw new Error('无效的套餐类型')
        }

        // 获取用户信息
        const userInfo = wx.getStorageSync('userInfo') || {}
        const nickName = userInfo.nickName || `用户${openid.slice(-6)}` // 使用 openid 后6位作为默认昵称
        const avatarUrl = userInfo.avatarUrl || ''

        const res = await request('/member/activate', 'POST', {
            openid: openid,
            nickName: nickName,
            avatarUrl: avatarUrl,
            packageId: packageId,
            duration: packageInfo.duration,
            amount: amount
        })

        if (res.code === 0) {
            // 清除缓存
            clearMemberCache()

            return {
                success: true,
                expireDate: res.data.expireDate,
                orderId: res.data.orderId
            }
        } else {
            return {
                success: false,
                message: res.message
            }
        }
    } catch (err) {
        return {
            success: false,
            error: err.message
        }
    }
}

/**
 * 续费会员
 * @param {string} openid - 用户OpenID
 * @param {string} packageId - 套餐ID
 * @param {number} amount - 支付金额
 * @returns {Promise<Object>}
 */
async function renewMember(openid, packageId, amount) {
    try {
        const packageInfo = MEMBER_PACKAGES[packageId]
        if (!packageInfo) {
            throw new Error('无效的套餐类型')
        }

        // 获取用户信息
        const userInfo = wx.getStorageSync('userInfo') || {}
        const nickName = userInfo.nickName || `用户${openid.slice(-6)}` // 使用 openid 后6位作为默认昵称
        const avatarUrl = userInfo.avatarUrl || ''

        const res = await request('/member/renew', 'POST', {
            openid: openid,
            nickName: nickName,
            avatarUrl: avatarUrl,
            packageId: packageId,
            duration: packageInfo.duration,
            amount: amount
        })

        if (res.code === 0) {
            // 清除缓存
            clearMemberCache()

            return {
                success: true,
                expireDate: res.data.expireDate,
                orderId: res.data.orderId
            }
        } else {
            return {
                success: false,
                message: res.message
            }
        }
    } catch (err) {
        return {
            success: false,
            error: err.message
        }
    }
}


/**
 * 检查会员状态（带缓存）
 * @returns {Promise<Object>}
 */
async function checkMemberStatus() {
    const openid = wx.getStorageSync('openid')

    if (!openid) {
        return {
            isValid: false,
            reason: 'not_login'
        }
    }

    // 从缓存读取
    const cachedInfo = wx.getStorageSync('memberInfo')
    const cacheTime = wx.getStorageSync('memberInfoTime')

    // 缓存有效期10分钟
    if (cachedInfo && cacheTime && (Date.now() - cacheTime < 600000)) {
        return cachedInfo
    }

    // 从服务器获取
    const result = await getMemberStatus(openid)

    if (result.success) {
        const memberInfo = {
            isValid: result.isValid,
            expireDate: result.expireDate,
            daysRemaining: result.daysRemaining,
            memberType: result.memberType
        }

        // 缓存会员信息
        wx.setStorageSync('memberInfo', memberInfo)
        wx.setStorageSync('memberInfoTime', Date.now())

        return memberInfo
    } else {
        return {
            isValid: false,
            reason: 'api_error',
            message: result.message || result.error
        }
    }
}

/**
 * 刷新会员状态
 * @returns {Promise<Object>}
 */
async function refreshMemberStatus() {
    clearMemberCache()
    return await checkMemberStatus()
}

/**
 * 格式化会员类型
 * @param {number} daysRemaining - 剩余天数
 * @returns {string}
 */
function formatMemberType(daysRemaining) {
    if (daysRemaining >= 300) {
        return '年度会员'
    } else if (daysRemaining >= 60) {
        return '季度会员'
    } else {
        return '月度会员'
    }
}

/**
 * 更新用户信息（昵称、头像）
 * @param {string} openid - 用户OpenID
 * @param {Object} profile - 用户信息 { nickName, avatarUrl }
 * @returns {Promise<Object>}
 */
async function updateUserProfile(openid, profile) {
    try {
        const res = await request('/member/update-profile', 'POST', {
            openid: openid,
            nickName: profile.nickName,
            avatarUrl: profile.avatarUrl
        })

        if (res.code === 0) {
            return {
                success: true,
                message: '用户信息已更新'
            }
        } else {
            return {
                success: false,
                message: res.msg || '更新失败'
            }
        }
    } catch (err) {
        return {
            success: false,
            error: err.message
        }
    }
}

/**
 * 清除会员缓存
 */
function clearMemberCache() {
    wx.removeStorageSync('memberInfo')
    wx.removeStorageSync('memberInfoTime')
}

/**
 * 获取套餐信息
 * @param {string} packageId - 套餐ID
 * @returns {Object}
 */
function getPackageInfo(packageId) {
    return MEMBER_PACKAGES[packageId]
}

module.exports = {
    getMemberStatus,
    activateMember,
    renewMember,
    checkMemberStatus,
    refreshMemberStatus,
    updateUserProfile,
    clearMemberCache,
    getPackageInfo,
    MEMBER_PACKAGES
}

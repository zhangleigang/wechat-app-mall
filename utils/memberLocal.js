/**
 * 本地会员管理模块
 * 不依赖apifm，使用本地存储管理会员状态
 */

/**
 * 会员套餐配置
 */
const MEMBER_PACKAGES = {
    monthly: {
        id: 'monthly',
        name: '月度会员',
        duration: 30, // 天数
        price: 19.9
    },
    quarterly: {
        id: 'quarterly',
        name: '季度会员',
        duration: 90,
        price: 49.9
    },
    yearly: {
        id: 'yearly',
        name: '年度会员',
        duration: 365,
        price: 99.9
    }
}

/**
 * 获取会员信息
 * @returns {Object} 会员信息
 */
function getMemberInfo() {
    const token = wx.getStorageSync('token')

    if (!token) {
        return {
            isValid: false,
            reason: 'not_login'
        }
    }

    // 从本地存储读取会员信息
    const memberData = wx.getStorageSync('memberData')

    if (!memberData) {
        return {
            isValid: false,
            reason: 'not_member'
        }
    }

    // 检查数据完整性
    if (!memberData.expireDate) {
        console.error('会员数据不完整，缺少 expireDate')
        return {
            isValid: false,
            reason: 'invalid_data'
        }
    }

    // 检查是否过期
    let expireDate
    try {
        expireDate = new Date(memberData.expireDate)
        // 检查日期是否有效
        if (isNaN(expireDate.getTime())) {
            throw new Error('Invalid date')
        }
    } catch (error) {
        console.error('解析到期时间失败:', memberData.expireDate, error)
        return {
            isValid: false,
            reason: 'invalid_date'
        }
    }

    const now = new Date()

    if (expireDate < now) {
        return {
            isValid: false,
            reason: 'expired',
            expireDate: memberData.expireDate,
            purchaseDate: memberData.purchaseDate,
            packageType: memberData.packageType
        }
    }

    // 计算剩余天数
    const daysRemaining = getDaysToExpire(memberData.expireDate)

    return {
        isValid: true,
        expireDate: memberData.expireDate,
        purchaseDate: memberData.purchaseDate,
        packageType: memberData.packageType,
        price: memberData.price,
        paymentMethod: memberData.paymentMethod,
        orderId: memberData.orderId,
        daysRemaining: daysRemaining,
        memberType: formatMemberType(daysRemaining)
    }
}

/**
 * 激活会员
 * @param {string} packageId - 套餐ID (monthly/quarterly/yearly)
 * @param {number} days - 会员天数（可选，默认使用套餐配置）
 * @returns {Object} 激活结果
 */
function activateMember(packageId, days) {
    const token = wx.getStorageSync('token')

    if (!token) {
        return {
            success: false,
            msg: '请先登录'
        }
    }

    const packageInfo = MEMBER_PACKAGES[packageId]
    if (!packageInfo) {
        return {
            success: false,
            msg: '无效的套餐类型'
        }
    }

    // 使用传入的天数或套餐默认天数
    const duration = days || packageInfo.duration

    // 验证天数
    if (!duration || duration <= 0) {
        return {
            success: false,
            msg: '无效的会员天数'
        }
    }

    // 计算到期时间
    const now = new Date()
    const expireDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000)

    // 验证日期是否有效
    if (isNaN(expireDate.getTime())) {
        console.error('日期计算失败:', { now, duration, expireDate })
        return {
            success: false,
            msg: '日期计算失败'
        }
    }

    console.log('激活会员:', {
        packageId,
        duration,
        now: now.toISOString(),
        expireDate: expireDate.toISOString()
    })

    // 生成本地订单ID
    const orderId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 保存会员信息
    const memberData = {
        isValid: true,
        expireDate: expireDate.toISOString(),
        purchaseDate: now.toISOString(),
        packageType: packageId,
        price: packageInfo.price,
        paymentMethod: 'qrcode',
        orderId: orderId
    }

    // 保存会员信息（确保正确序列化）
    try {
        wx.setStorageSync('memberData', memberData)
        console.log('会员信息已保存:', memberData)
    } catch (error) {
        console.error('保存会员信息失败:', error)
        throw new Error('保存会员信息失败')
    }

    // 清除会员信息缓存
    clearMemberCache()

    return {
        success: true,
        memberData: memberData,
        message: '会员已激活'
    }
}

/**
 * 检查会员状态
 * @returns {Object} 会员状态
 */
function checkMemberStatus() {
    return getMemberInfo()
}

/**
 * 刷新会员状态
 * @returns {Object} 最新的会员信息
 */
function refreshMemberStatus() {
    // 清除缓存
    clearMemberCache()
    // 重新获取
    return getMemberInfo()
}

/**
 * 计算到期天数
 * @param {string} expireDate - 到期日期
 * @returns {number} 剩余天数
 */
function getDaysToExpire(expireDate) {
    const now = new Date()
    const expire = new Date(expireDate)
    const diff = expire - now
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * 格式化会员类型
 * @param {number} daysRemaining - 剩余天数
 * @returns {string} 会员类型
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
 * 清除会员缓存
 */
function clearMemberCache() {
    wx.removeStorageSync('memberInfo')
    wx.removeStorageSync('memberInfoTime')
}

/**
 * 获取套餐配置
 * @param {string} packageId - 套餐ID
 * @returns {Object} 套餐信息
 */
function getPackageInfo(packageId) {
    return MEMBER_PACKAGES[packageId]
}

/**
 * 获取所有套餐配置
 * @returns {Object} 所有套餐信息
 */
function getAllPackages() {
    return MEMBER_PACKAGES
}

/**
 * 延长会员时间
 * @param {number} days - 延长天数
 * @returns {Object} 更新结果
 */
function extendMembership(days) {
    const memberInfo = getMemberInfo()

    if (!memberInfo.isValid && memberInfo.reason !== 'expired') {
        throw new Error('无法延长会员：用户未登录或无会员记录')
    }

    const memberData = wx.getStorageSync('memberData')
    if (!memberData) {
        throw new Error('无法延长会员：未找到会员数据')
    }

    // 从当前到期时间延长，如果已过期则从现在开始
    let baseDate = new Date(memberData.expireDate)
    const now = new Date()

    if (baseDate < now) {
        baseDate = now
    }

    const newExpireDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000)

    memberData.expireDate = newExpireDate.toISOString()

    wx.setStorageSync('memberData', memberData)
    clearMemberCache()

    return {
        success: true,
        newExpireDate: newExpireDate.toISOString(),
        message: `会员已延长${days}天`
    }
}

/**
 * 清除会员数据（用于测试或重置）
 */
function clearMemberData() {
    wx.removeStorageSync('memberData')
    clearMemberCache()
}

module.exports = {
    getMemberInfo,
    activateMember,
    checkMemberStatus,
    refreshMemberStatus,
    getDaysToExpire,
    formatMemberType,
    clearMemberCache,
    getPackageInfo,
    getAllPackages,
    extendMembership,
    clearMemberData,
    MEMBER_PACKAGES
}

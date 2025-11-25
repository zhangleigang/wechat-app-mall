// apifm-wxapi 已移除，此文件已废弃，请使用 utils/memberLocal.js
// const WXAPI = require('apifm-wxapi')

/**
 * 会员套餐配置
 * 需要在apifm后台创建对应的会员卡
 */
const MEMBER_PACKAGES = {
    monthly: {
        id: 'monthly',
        name: '月度会员',
        duration: 30, // 天数
        price: 19.9,
        cardId: null // 需要在apifm后台创建会员卡后填写ID
    },
    quarterly: {
        id: 'quarterly',
        name: '季度会员',
        duration: 90,
        price: 49.9,
        cardId: null
    },
    yearly: {
        id: 'yearly',
        name: '年度会员',
        duration: 365,
        price: 99.9,
        cardId: null
    }
}

/**
 * 创建会员订单
 * @param {string} packageId - 套餐ID (monthly/quarterly/yearly)
 * @returns {Promise<Object>} 订单信息
 */
async function createMemberOrder(packageId) {
    const token = wx.getStorageSync('token')

    if (!token) {
        throw new Error('请先登录')
    }

    const packageInfo = MEMBER_PACKAGES[packageId]
    if (!packageInfo) {
        throw new Error('无效的套餐类型')
    }

    // 使用apifm的会员卡购买接口
    // 如果后台配置了会员卡，使用cardBuy
    if (packageInfo.cardId) {
        const res = await WXAPI.cardBuy(token, packageInfo.cardId)
        if (res.code !== 0) {
            throw new Error(res.msg || '创建订单失败')
        }
        return {
            orderId: res.data.id,
            orderNumber: res.data.orderNumber,
            amount: packageInfo.price,
            packageInfo: packageInfo
        }
    }

    // 如果没有配置会员卡ID，使用通用订单创建
    // 创建订单数据
    const orderData = {
        token: token,
        goodsJsonStr: JSON.stringify([{
            name: packageInfo.name,
            price: packageInfo.price,
            number: 1,
            propertyChildIds: '',
            logisticsType: 0, // 无需物流
            addition: JSON.stringify({
                type: 'member',
                packageId: packageId,
                duration: packageInfo.duration
            })
        }]),
        provinceId: 0,
        cityId: 0,
        districtId: 0,
        address: '会员服务',
        linkMan: wx.getStorageSync('userInfo')?.nickName || '会员',
        mobile: wx.getStorageSync('userInfo')?.mobile || '',
        remark: `购买${packageInfo.name}`,
        isCart: false,
        logisticsType: 0 // 无需物流
    }

    const res = await WXAPI.orderCreate(orderData)

    if (res.code !== 0) {
        throw new Error(res.msg || '创建订单失败')
    }

    return {
        orderId: res.data.id,
        orderNumber: res.data.orderNumber,
        amount: res.data.amountReal || packageInfo.price,
        packageInfo: packageInfo
    }
}

/**
 * 获取会员信息
 * @returns {Promise<Object>} 会员信息
 */
async function getMemberInfo() {
    const token = wx.getStorageSync('token')

    if (!token) {
        return {
            isValid: false,
            reason: 'not_login'
        }
    }

    // 从缓存读取
    const cachedInfo = wx.getStorageSync('memberInfo')
    const cacheTime = wx.getStorageSync('memberInfoTime')

    // 缓存有效期1小时
    if (cachedInfo && cacheTime && (Date.now() - cacheTime < 3600000)) {
        return cachedInfo
    }

    // 从服务器获取
    const res = await WXAPI.cardMyList(token)

    if (res.code !== 0) {
        return {
            isValid: false,
            reason: 'api_error',
            message: res.msg
        }
    }

    // 解析会员信息
    const memberInfo = parseMemberInfo(res.data)

    // 缓存会员信息
    wx.setStorageSync('memberInfo', memberInfo)
    wx.setStorageSync('memberInfoTime', Date.now())

    return memberInfo
}

/**
 * 解析会员卡数据
 * @param {Array} cards - 会员卡列表
 * @returns {Object} 解析后的会员信息
 */
function parseMemberInfo(cards) {
    if (!cards || cards.length === 0) {
        return {
            isValid: false,
            reason: 'not_member'
        }
    }

    // 筛选有效的会员卡 (status == 0 表示有效)
    const validCards = cards.filter(card => card.status === 0)

    if (validCards.length === 0) {
        return {
            isValid: false,
            reason: 'not_member'
        }
    }

    // 获取最晚的到期时间
    const expireDates = validCards
        .map(card => card.dateEnd)
        .filter(Boolean)
        .sort((a, b) => new Date(b) - new Date(a))

    const expireDate = expireDates[0]

    // 检查是否过期
    if (new Date(expireDate) < new Date()) {
        return {
            isValid: false,
            reason: 'expired',
            expireDate: expireDate
        }
    }

    // 计算会员类型
    const daysRemaining = getDaysToExpire(expireDate)
    const memberType = formatMemberType(daysRemaining)

    return {
        isValid: true,
        expireDate: expireDate,
        daysRemaining: daysRemaining,
        memberType: memberType,
        cards: validCards
    }
}

/**
 * 检查会员状态
 * @returns {Promise<Object>} 会员状态
 */
async function checkMemberStatus() {
    return await getMemberInfo()
}

/**
 * 刷新会员状态
 * @returns {Promise<Object>} 最新的会员信息
 */
async function refreshMemberStatus() {
    // 清除缓存
    clearMemberCache()
    // 重新获取
    return await getMemberInfo()
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

module.exports = {
    createMemberOrder,
    getMemberInfo,
    checkMemberStatus,
    refreshMemberStatus,
    getDaysToExpire,
    formatMemberType,
    clearMemberCache,
    getPackageInfo,
    MEMBER_PACKAGES
}

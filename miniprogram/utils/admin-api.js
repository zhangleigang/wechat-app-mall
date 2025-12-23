/**
 * 管理员API工具
 */

const CONFIG = require('../config')

const AdminAPI = {


    /**
     * 获取会员列表
     * @param {Object} params - 查询参数
     * @param {number} params.page - 页码，默认1
     * @param {number} params.limit - 每页数量，默认20
     * @returns {Promise<Object>} 会员列表数据
     */
    async getMembers(params = {}) {
        const { page = 1, limit = 20 } = params

        const url = `${CONFIG.apiBaseUrl}/admin/members?page=${page}&limit=${limit}`

        return new Promise((resolve, reject) => {
            wx.request({
                url: url,
                method: 'GET',
                header: {
                    'Content-Type': 'application/json'
                },
                success: (res) => {
                    if (res.statusCode === 200) {
                        resolve(res.data)
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}`))
                    }
                },
                fail: (err) => {
                    reject(err)
                }
            })
        })
    },

    /**
     * 获取用户列表 (微信转账功能)
     * @param {Object} params - 查询参数
     * @param {number} params.page - 页码，默认1
     * @param {number} params.limit - 每页数量，默认20
     * @param {string} params.memberStatus - 会员状态筛选，all/member/non-member
     * @returns {Promise<Object>} 用户列表数据
     */
    async getUsers(params = {}) {
        const { page = 1, limit = 20, memberStatus = 'all' } = params

        const url = `${CONFIG.apiBaseUrl}/admin/users?page=${page}&limit=${limit}&memberStatus=${memberStatus}`

        return new Promise((resolve, reject) => {
            wx.request({
                url: url,
                method: 'GET',
                header: {
                    'Content-Type': 'application/json'
                },
                success: (res) => {
                    if (res.statusCode === 200) {
                        resolve(res.data)
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}`))
                    }
                },
                fail: (err) => {
                    reject(err)
                }
            })
        })
    },

    /**
     * 快速开通会员 (微信转账功能)
     * @param {Object} params - 激活参数
     * @param {string} params.openid - 用户OpenID
     * @param {number} params.duration - 会员时长(天)
     * @returns {Promise<Object>} 操作结果
     */
    async activateMember(params) {
        const { openid, duration } = params

        const url = `${CONFIG.apiBaseUrl}/admin/activate-member`

        return new Promise((resolve, reject) => {
            wx.request({
                url: url,
                method: 'POST',
                header: {
                    'Content-Type': 'application/json'
                },
                data: {
                    openid,
                    duration
                },
                success: (res) => {
                    if (res.statusCode === 200) {
                        resolve(res.data)
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}`))
                    }
                },
                fail: (err) => {
                    reject(err)
                }
            })
        })
    },

    /**
     * 获取统计数据
     * @returns {Promise<Object>} 统计数据
     */
    async getStats() {
        const url = `${CONFIG.apiBaseUrl}/admin/stats`

        return new Promise((resolve, reject) => {
            wx.request({
                url: url,
                method: 'GET',
                header: {
                    'Content-Type': 'application/json'
                },
                success: (res) => {
                    if (res.statusCode === 200) {
                        resolve(res.data)
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}`))
                    }
                },
                fail: (err) => {
                    reject(err)
                }
            })
        })
    },



    /**
     * 格式化套餐ID为中文名称
     * @param {string} packageId - 套餐ID
     * @returns {string} 套餐中文名称
     */
    formatPackageName(packageId) {
        const packageNames = {
            'monthly': '月度会员',
            'quarterly': '季度会员',
            'yearly': '年度会员'
        }
        return packageNames[packageId] || packageId
    },

    /**
     * 格式化日期
     * @param {string} dateStr - 日期字符串
     * @returns {string} 格式化后的日期
     */
    formatDate(dateStr) {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false  // 使用24小时制
        })
    }
}

module.exports = AdminAPI
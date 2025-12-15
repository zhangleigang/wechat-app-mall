// 管理员反馈管理页面（简化版）
const CONFIG = require('../../../config.js')

Page({
    data: {
        feedbacks: [],
        stats: {},
        loading: false,

        // 筛选条件
        filterStatus: 'unread',

        // 状态选项（简化）
        statusOptions: [
            { text: '未读', value: 'unread' },
            { text: '已读', value: 'read' },
            { text: '已解决', value: 'resolved' },
            { text: '全部', value: 'all' }
        ]
    },

    onLoad() {
        // 检查管理员权限
        if (!this.checkAdminPermission()) {
            wx.showModal({
                title: '权限不足',
                content: '此页面仅限管理员访问',
                showCancel: false,
                success: () => {
                    wx.navigateBack()
                }
            })
            return
        }

        this.loadFeedbacks()
    },

    onShow() {
        this.loadFeedbacks()
    },

    // 检查管理员权限
    checkAdminPermission() {
        const openid = wx.getStorageSync('openid')
        const adminOpenIds = ['oAHR-1w1Qrz-cL2OiN_hjnqQlXNQ']
        return adminOpenIds.includes(openid)
    },

    // 加载反馈列表
    async loadFeedbacks() {
        this.setData({ loading: true })

        try {
            const token = wx.getStorageSync('token')
            const res = await this.requestFeedbacks(token)

            if (res.data.code === 0) {
                this.setData({
                    feedbacks: res.data.data.list,
                    stats: res.data.data.stats
                })
            } else {
                throw new Error(res.data.msg)
            }
        } catch (error) {
            console.error('加载反馈失败:', error)
            wx.showToast({
                title: '加载失败',
                icon: 'none'
            })
        } finally {
            this.setData({ loading: false })
        }
    },

    // 请求反馈数据
    requestFeedbacks(token) {
        return new Promise((resolve, reject) => {
            wx.request({
                url: `${CONFIG.apiBaseUrl}/feedback/list?status=${this.data.filterStatus}`,
                method: 'GET',
                header: {
                    'Authorization': `Bearer ${token}`
                },
                success: resolve,
                fail: reject
            })
        })
    },

    // 筛选状态
    onStatusChange(e) {
        this.setData({
            filterStatus: e.detail
        })
        this.loadFeedbacks()
    },

    // 查看反馈详情
    viewDetail(e) {
        const index = e.currentTarget.dataset.index
        const feedback = this.data.feedbacks[index]

        const content = `用户：${feedback.nick_name || feedback.name || '匿名'}\n\n内容：${feedback.content}\n\n联系方式：${feedback.mobile || feedback.wechat || '无'}\n\n时间：${this.formatTime(feedback.created_at)}`

        wx.showModal({
            title: '反馈详情',
            content: content,
            showCancel: false
        })
    },

    // 标记为已读
    async markAsRead(e) {
        const index = e.currentTarget.dataset.index
        const feedback = this.data.feedbacks[index]

        try {
            await this.updateFeedback(feedback.id, 'read')

            // 更新本地数据
            const feedbacks = this.data.feedbacks
            feedbacks[index].status = 'read'
            this.setData({ feedbacks })

            wx.showToast({
                title: '已标记为已读',
                icon: 'success'
            })
        } catch (error) {
            wx.showToast({
                title: '操作失败',
                icon: 'none'
            })
        }
    },

    // 标记为已解决
    async markAsResolved(e) {
        const index = e.currentTarget.dataset.index
        const feedback = this.data.feedbacks[index]

        try {
            await this.updateFeedback(feedback.id, 'resolved')

            // 更新本地数据
            const feedbacks = this.data.feedbacks
            feedbacks[index].status = 'resolved'
            this.setData({ feedbacks })

            wx.showToast({
                title: '已标记为已解决',
                icon: 'success'
            })
        } catch (error) {
            wx.showToast({
                title: '操作失败',
                icon: 'none'
            })
        }
    },

    // 标记为Bug
    async markAsBug(e) {
        const index = e.currentTarget.dataset.index
        const feedback = this.data.feedbacks[index]

        try {
            await this.updateFeedback(feedback.id, 'mark_bug')

            // 更新本地数据
            const feedbacks = this.data.feedbacks
            feedbacks[index].type = 'bug'
            this.setData({ feedbacks })

            wx.showToast({
                title: '已标记为Bug',
                icon: 'success'
            })
        } catch (error) {
            wx.showToast({
                title: '操作失败',
                icon: 'none'
            })
        }
    },

    // 更新反馈状态
    updateFeedback(id, action) {
        return new Promise((resolve, reject) => {
            const token = wx.getStorageSync('token')

            wx.request({
                url: `${CONFIG.apiBaseUrl}/feedback/${id}/action`,
                method: 'PUT',
                header: {
                    'Authorization': `Bearer ${token}`
                },
                data: { action },
                success: (res) => {
                    if (res.data.code === 0) {
                        resolve(res.data)
                    } else {
                        reject(new Error(res.data.msg))
                    }
                },
                fail: reject
            })
        })
    },

    // 复制联系方式
    copyContact(e) {
        const contact = e.currentTarget.dataset.contact
        if (contact) {
            wx.setClipboardData({
                data: contact,
                success: () => {
                    wx.showToast({
                        title: '已复制',
                        icon: 'success'
                    })
                }
            })
        }
    },

    // 格式化时间
    formatTime(timestamp) {
        const date = new Date(timestamp)
        const now = new Date()
        const diff = now - date

        if (diff < 60000) { // 1分钟内
            return '刚刚'
        } else if (diff < 3600000) { // 1小时内
            return Math.floor(diff / 60000) + '分钟前'
        } else if (diff < 86400000) { // 1天内
            return Math.floor(diff / 3600000) + '小时前'
        } else {
            return date.toLocaleDateString()
        }
    }
})
// pages/admin/orders/index.js
Page({
    data: {
        orders: [],
        stats: {
            total: 0,
            pending: 0,
            verified: 0,
            totalAmount: 0
        },
        filterStatus: 'all'  // all, pending, verified
    },

    onLoad() {
        this.loadOrders()
    },

    onShow() {
        this.loadOrders()
    },

    // 加载订单列表
    loadOrders() {
        try {
            const allOrders = wx.getStorageSync('pending_orders') || []

            // 按时间倒序排列（最新的在前面）
            allOrders.sort((a, b) => b.timestamp - a.timestamp)

            // 计算统计数据
            const stats = {
                total: allOrders.length,
                pending: allOrders.filter(o => o.status === 'pending_verify').length,
                verified: allOrders.filter(o => o.status === 'verified').length,
                totalAmount: allOrders.reduce((sum, o) => sum + (o.amount || 0), 0)
            }

            this.setData({
                orders: allOrders,
                stats: stats
            })
        } catch (error) {
            console.error('加载订单失败:', error)
            wx.showToast({
                title: '加载失败',
                icon: 'none'
            })
        }
    },

    // 筛选订单
    filterOrders(e) {
        const status = e.currentTarget.dataset.status
        this.setData({ filterStatus: status })
    },

    // 获取筛选后的订单
    getFilteredOrders() {
        const { orders, filterStatus } = this.data
        if (filterStatus === 'all') {
            return orders
        }
        return orders.filter(o => o.status === filterStatus)
    },

    // 复制订单号
    copyOrderNumber(e) {
        const orderNumber = e.currentTarget.dataset.order
        wx.setClipboardData({
            data: orderNumber,
            success: () => {
                wx.showToast({
                    title: '已复制',
                    icon: 'success'
                })
            }
        })
    },

    // 标记为已核实
    markAsVerified(e) {
        const index = e.currentTarget.dataset.index
        const orders = this.data.orders

        wx.showModal({
            title: '确认核实',
            content: '确认该订单已收到款项？',
            success: (res) => {
                if (res.confirm) {
                    orders[index].status = 'verified'
                    orders[index].verifiedAt = Date.now()
                    orders[index].verifiedDate = new Date().toLocaleString('zh-CN')

                    wx.setStorageSync('pending_orders', orders)
                    this.loadOrders()

                    wx.showToast({
                        title: '已标记',
                        icon: 'success'
                    })
                }
            }
        })
    },

    // 查看订单详情
    viewDetail(e) {
        const index = e.currentTarget.dataset.index
        const order = this.data.orders[index]

        const content = `订单号：${order.orderNumber}\n用户ID：${order.userId}\n套餐：${order.packageName}\n金额：¥${order.amount}\n时间：${order.date}\n状态：${order.status === 'pending_verify' ? '待核实' : '已核实'}`

        wx.showModal({
            title: '订单详情',
            content: content,
            showCancel: false
        })
    },

    // 导出订单数据
    exportOrders() {
        const orders = this.data.orders

        if (orders.length === 0) {
            wx.showToast({
                title: '暂无订单',
                icon: 'none'
            })
            return
        }

        // 生成CSV格式
        let csv = '订单号,用户ID,套餐名称,金额,时间,状态\n'
        orders.forEach(order => {
            csv += `${order.orderNumber},${order.userId},${order.packageName},${order.amount},${order.date},${order.status === 'pending_verify' ? '待核实' : '已核实'}\n`
        })

        wx.setClipboardData({
            data: csv,
            success: () => {
                wx.showModal({
                    title: '导出成功',
                    content: '订单数据已复制到剪贴板\n可以粘贴到Excel中查看',
                    showCancel: false
                })
            }
        })
    },

    // 清空已核实的订单
    clearVerified() {
        wx.showModal({
            title: '确认清空',
            content: '确定要清空所有已核实的订单吗？\n此操作不可恢复',
            confirmColor: '#ff6b00',
            success: (res) => {
                if (res.confirm) {
                    const orders = this.data.orders.filter(o => o.status === 'pending_verify')
                    wx.setStorageSync('pending_orders', orders)
                    this.loadOrders()

                    wx.showToast({
                        title: '已清空',
                        icon: 'success'
                    })
                }
            }
        })
    },

    // 清空所有订单
    clearAll() {
        wx.showModal({
            title: '⚠️ 危险操作',
            content: '确定要清空所有订单记录吗？\n此操作不可恢复',
            confirmText: '确定清空',
            confirmColor: '#ff0000',
            success: (res) => {
                if (res.confirm) {
                    wx.removeStorageSync('pending_orders')
                    this.setData({
                        orders: [],
                        stats: {
                            total: 0,
                            pending: 0,
                            verified: 0,
                            totalAmount: 0
                        }
                    })

                    wx.showToast({
                        title: '已清空',
                        icon: 'success'
                    })
                }
            }
        })
    }
})

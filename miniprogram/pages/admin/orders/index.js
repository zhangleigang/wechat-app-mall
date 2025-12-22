// pages/admin/orders/index.js
const AdminAPI = require('../../../utils/admin-api')
const OrderStatus = require('../../../utils/order-status')

Page({
    data: {
        orders: [],
        stats: {
            total: 0,
            pending: 0,
            verified: 0,
            totalAmount: 0
        },
        filterStatus: 'all',  // all, pending, verified
        loading: false,
        page: 1,
        hasMore: true,
        lastRefreshTime: 0  // 记录最后刷新时间，用于避免频繁刷新
    },

    async onLoad() {
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

        await this.loadOrders()
        // 统计数据由 calculateStats 在订单加载完成后自动计算
    },

    async onShow() {
        console.log('=== 页面显示，检查是否需要刷新数据 ===')

        // 如果有订单正在处理中，不重新加载数据
        if (this.hasOrdersProcessing()) {
            console.log('有订单正在处理中，跳过数据重新加载')
            return
        }

        // 检查是否需要刷新数据（比如从其他页面返回）
        const lastRefreshTime = this.data.lastRefreshTime || 0
        const currentTime = Date.now()
        const shouldRefresh = (currentTime - lastRefreshTime) > 30000 // 30秒内不重复刷新

        if (shouldRefresh) {
            console.log('距离上次刷新超过30秒，重新加载数据')
            await this.loadOrders()
            this.setData({ lastRefreshTime: currentTime })
        } else {
            console.log('距离上次刷新不足30秒，仅重新计算统计数据')
            // 仅重新计算统计数据，确保显示是最新的
            this.calculateStats()
        }
    },

    // 加载订单列表
    async loadOrders(refresh = true) {
        if (this.data.loading) return

        this.setData({ loading: true })

        try {
            const page = refresh ? 1 : this.data.page
            console.log('=== 开始加载订单列表 ===')
            console.log('请求参数:', { page, limit: 50 })

            const result = await AdminAPI.getOrders({ page, limit: 50 })
            console.log('API响应结果:', result)

            if (result.code === 0) {
                console.log('原始订单数据:', result.data.list)

                // Use consistent status mapping utility (Requirements: 1.5)
                const orders = result.data.list.map(order => {
                    const mappedOrder = OrderStatus.mapOrderStatus(order);

                    console.log(`订单 ${order.order_number}: 数据库状态=${order.status}, 映射状态=${mappedOrder.status}`)

                    return {
                        ...mappedOrder,
                        packageName: AdminAPI.formatPackageName(order.package_id),
                        date: AdminAPI.formatDate(order.created_at),
                        userId: order.openid,
                        orderNumber: order.order_number,
                        verifying: false // 初始化验证状态
                    }
                })

                console.log('处理后的订单数据:', orders)

                this.setData({
                    orders: refresh ? orders : [...this.data.orders, ...orders],
                    page: page,
                    hasMore: orders.length === 50,
                    loading: false
                }, () => {
                    // 订单数据更新完成后，重新计算统计数据
                    this.calculateStats()
                })

                console.log('页面数据已更新:', this.data.orders)
            } else {
                console.error('API返回错误:', result)
                throw new Error(result.msg || '加载失败')
            }
        } catch (error) {
            console.error('加载订单失败:', error)
            wx.showToast({
                title: '加载失败: ' + error.message,
                icon: 'none'
            })
            this.setData({ loading: false })
        }
    },

    // 加载统计数据（从后端获取，作为备用）
    loadStats() {
        console.log('=== 开始加载后端统计数据 ===')

        AdminAPI.getStats().then(result => {
            console.log('统计API响应结果:', result)

            if (result.code === 0) {
                // 使用后端返回的统计数据作为备用
                const backendStats = {
                    total: result.data.totalOrders,
                    pending: result.data.pendingOrders,
                    verified: result.data.verifiedOrders,
                    totalAmount: result.data.totalRevenue
                }

                console.log('后端统计数据:', backendStats)

                // 如果本地还没有统计数据，使用后端数据
                if (!this.data.stats || this.data.stats.total === 0) {
                    this.setData({ stats: backendStats })
                }
            } else {
                console.error('统计API返回错误:', result)
            }
        }).catch(error => {
            console.error('加载统计数据失败:', error)
        })
    },

    // 计算统计数据（基于当前订单列表）
    calculateStats() {
        const allOrders = this.data.orders || []
        console.log('=== 开始重新计算统计数据 ===')
        console.log('当前订单总数:', allOrders.length)

        // Use consistent status checking (Requirements: 1.5)
        const pending = allOrders.filter(o => OrderStatus.isOrderPending(o)).length
        const verified = allOrders.filter(o => OrderStatus.isOrderVerified(o)).length
        const cancelled = allOrders.filter(o => OrderStatus.isOrderCancelled(o)).length
        const totalAmount = allOrders.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0)

        const newStats = {
            total: allOrders.length,
            pending: pending,
            verified: verified,
            cancelled: cancelled,
            totalAmount: totalAmount.toFixed(2)
        }

        console.log('统计结果:', {
            '待核实订单': pending,
            '已核实订单': verified,
            '已取消订单': cancelled,
            '总金额': newStats.totalAmount
        })

        // 检查统计数据是否发生变化
        const oldStats = this.data.stats
        const statsChanged = !oldStats ||
            oldStats.pending !== newStats.pending ||
            oldStats.verified !== newStats.verified ||
            oldStats.cancelled !== newStats.cancelled ||
            oldStats.totalAmount !== newStats.totalAmount

        if (statsChanged) {
            console.log('统计数据发生变化，更新UI')
            this.setData({ stats: newStats })
        } else {
            console.log('统计数据无变化')
        }

        console.log('=== 统计数据计算完成 ===')
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
    async markAsVerified(e) {
        const index = e.currentTarget.dataset.index
        const order = this.data.orders[index]

        // Use consistent status validation (Requirements: 1.5)
        if (OrderStatus.isOrderVerified(order)) {
            wx.showToast({
                title: '订单已核实',
                icon: 'none'
            })
            return
        }

        if (!OrderStatus.isOrderPending(order)) {
            wx.showToast({
                title: '只能核实待核实状态的订单',
                icon: 'none'
            })
            return
        }

        // 检查是否正在处理中
        if (order.verifying) {
            wx.showToast({
                title: '正在处理中，请稍候',
                icon: 'none'
            })
            return
        }

        // 显示详细的确认对话框
        this.showVerificationDialog(order, index)
    },

    // 显示验证确认对话框
    showVerificationDialog(order, index) {
        // 构建详细的订单信息内容
        const orderDetails = [
            `订单号：${order.orderNumber}`,
            `套餐类型：${order.packageName}`,
            `支付金额：¥${order.amount}`,
            `用户ID：${order.userId}`,
            `创建时间：${order.date}`,
            `当前状态：待核实`
        ].join('\n')

        const dialogContent = `请确认已收到用户的付款并核实订单信息：\n\n${orderDetails}\n\n确认标记此订单为"已核实"状态吗？`

        wx.showModal({
            title: '订单核实确认',
            content: dialogContent,
            confirmText: '确认核实',
            cancelText: '取消',
            confirmColor: '#07c160',
            success: async (res) => {
                if (res.confirm) {
                    // 用户确认核实
                    await this.processOrderVerification(order, index)
                } else {
                    // 用户取消操作
                    console.log('用户取消了订单核实操作')
                }
            },
            fail: (error) => {
                console.error('显示确认对话框失败:', error)
                wx.showToast({
                    title: '操作失败',
                    icon: 'none'
                })
            }
        })
    },

    // 处理订单验证
    async processOrderVerification(order, index) {
        // 设置按钮为加载状态
        const orders = [...this.data.orders]
        orders[index].verifying = true
        this.setData({ orders })

        try {
            console.log(`开始验证订单: ${order.orderNumber} (ID: ${order.id})`)
            const result = await AdminAPI.verifyOrder(order.id)

            if (result.code === 0) {
                console.log(`订单 ${order.orderNumber} 后端验证成功，开始更新前端显示`)

                // 调用专门的刷新方法来更新显示
                this.refreshDisplayAfterVerification(order.id, 'verified')

                // 显示成功提示
                wx.showToast({
                    title: '订单已核实',
                    icon: 'success'
                })

                console.log(`订单 ${order.orderNumber} 验证流程完成`)

            } else {
                throw new Error(result.msg || '验证失败')
            }
        } catch (error) {
            // 恢复按钮状态
            orders[index].verifying = false
            this.setData({ orders })

            console.error('验证订单失败:', error)
            wx.showToast({
                title: '验证失败：' + error.message,
                icon: 'none',
                duration: 3000
            })
        }
    },

    // 查看订单详情
    viewDetail(e) {
        const index = e.currentTarget.dataset.index
        const order = this.data.orders[index]

        // Use consistent status display (Requirements: 1.5)
        const statusText = order.statusText || OrderStatus.getStatusDisplayText(order.originalStatus || OrderStatus.getStatusFromMapping(order.status))
        const content = `订单号：${order.orderNumber}\n用户ID：${order.userId}\n套餐：${order.packageName}\n金额：¥${order.amount}\n时间：${order.date}\n状态：${statusText}`

        wx.showModal({
            title: '订单详情',
            content: content,
            showCancel: false
        })
    },

    // 导出订单数据
    async exportOrders() {
        if (this.data.orders.length === 0) {
            wx.showToast({
                title: '暂无订单',
                icon: 'none'
            })
            return
        }

        wx.showLoading({ title: '导出中...', mask: true })

        try {
            const csvData = await AdminAPI.exportOrders()
            wx.hideLoading()

            wx.setClipboardData({
                data: csvData,
                success: () => {
                    wx.showModal({
                        title: '导出成功',
                        content: '订单数据已复制到剪贴板\n可以粘贴到Excel中查看',
                        showCancel: false
                    })
                }
            })
        } catch (error) {
            wx.hideLoading()
            console.error('导出失败:', error)
            wx.showToast({
                title: '导出失败',
                icon: 'none'
            })
        }
    },

    // 清空已核实的订单（后端数据不支持前端清空）
    clearVerified() {
        wx.showModal({
            title: '提示',
            content: '订单数据存储在服务器，无法通过前端清空\n如需清理数据，请联系技术人员',
            showCancel: false
        })
    },

    // 清空所有订单（后端数据不支持前端清空）
    clearAll() {
        wx.showModal({
            title: '提示',
            content: '订单数据存储在服务器，无法通过前端清空\n如需清理数据，请联系技术人员',
            showCancel: false
        })
    },

    // 下拉刷新
    async onPullDownRefresh() {
        console.log('=== 用户触发下拉刷新 ===')

        // 如果有订单正在处理中，阻止刷新
        if (this.hasOrdersProcessing()) {
            wx.showToast({
                title: '有订单正在处理中，请稍候',
                icon: 'none'
            })
            wx.stopPullDownRefresh()
            return
        }

        try {
            await this.loadOrders(true)
            console.log('下拉刷新完成')
        } catch (error) {
            console.error('下拉刷新失败:', error)
        } finally {
            wx.stopPullDownRefresh()
        }
    },

    // 上拉加载更多
    onReachBottom() {
        if (this.data.hasMore && !this.data.loading) {
            this.setData({ page: this.data.page + 1 })
            this.loadOrders(false)
        }
    },

    // 检查订单是否可以被核实 - 使用状态工具 (Requirements: 1.5)
    canVerifyOrder(order) {
        return OrderStatus.canVerifyOrder(order)
    },

    // 检查是否有任何订单正在处理中
    hasOrdersProcessing() {
        return this.data.orders.some(order => order.verifying)
    },

    // 刷新显示数据（在订单状态变更后调用）
    refreshDisplayAfterVerification(orderId, newStatus) {
        console.log(`=== 刷新显示数据：订单 ${orderId} 状态变更为 ${newStatus} ===`)

        // 确保订单数据是最新的
        const orders = [...this.data.orders]
        const orderIndex = orders.findIndex(o => o.id === orderId)

        if (orderIndex !== -1) {
            const oldStatus = orders[orderIndex].status

            // 确保订单状态已更新
            orders[orderIndex].status = newStatus
            orders[orderIndex].verifying = false

            console.log(`订单 ${orderId} 状态从 ${oldStatus} 更新为: ${newStatus}`)

            // 立即更新订单列表显示
            this.setData({ orders }, () => {
                // 重新计算统计数据
                this.calculateStats()

                // 如果当前筛选状态不是 'all'，可能需要重新筛选显示
                if (this.data.filterStatus !== 'all') {
                    console.log('当前筛选状态:', this.data.filterStatus)
                    // 触发筛选更新（通过重新设置相同的筛选状态来刷新显示）
                    this.setData({ filterStatus: this.data.filterStatus })
                }

                // 记录刷新时间
                this.setData({ lastRefreshTime: Date.now() })

                console.log('显示刷新完成')
            })
        } else {
            console.warn(`未找到订单 ${orderId}，无法刷新显示`)
        }
    },

    // 强制刷新整个页面数据（用于确保数据一致性）
    async forceRefreshAll() {
        console.log('=== 强制刷新所有数据 ===')

        // 重新加载订单数据
        await this.loadOrders(true)

        // 重新计算统计数据
        this.calculateStats()

        console.log('强制刷新完成')
    },

    // 导航到用户管理页面
    navigateToUsers() {
        wx.navigateTo({
            url: '/pages/admin/users/index'
        })
    },

    // 检查管理员权限
    checkAdminPermission() {
        const openid = wx.getStorageSync('openid')
        console.log('当前用户 openid:', openid)

        // 管理员 OpenID 列表
        const adminOpenIds = [
            'onddF1_xp4H5FBBuT2NmNb4m_KbI'  // 管理员 openid
        ]

        const isAdmin = adminOpenIds.includes(openid)
        console.log('是否为管理员:', isAdmin)
        return isAdmin
    }
})

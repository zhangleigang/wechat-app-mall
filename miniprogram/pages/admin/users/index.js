// pages/admin/users/index.js
const AdminAPI = require('../../../utils/admin-api')

Page({
    data: {
        users: [],
        stats: {
            total: 0,
            members: 0,
            nonMembers: 0
        },
        filterStatus: 'all',  // all, member, non-member
        searchKeyword: '',
        loading: false,
        page: 1,
        hasMore: true,
        lastRefreshTime: 0,
        activatingUsers: {} // 记录正在激活的用户
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

        await this.loadUsers()
    },

    async onShow() {
        console.log('=== 用户管理页面显示，检查是否需要刷新数据 ===')

        // 如果有用户正在激活中，不重新加载数据
        if (this.hasUsersActivating()) {
            console.log('有用户正在激活中，跳过数据重新加载')
            return
        }

        // 检查是否需要刷新数据
        const lastRefreshTime = this.data.lastRefreshTime || 0
        const currentTime = Date.now()
        const shouldRefresh = (currentTime - lastRefreshTime) > 30000 // 30秒内不重复刷新

        if (shouldRefresh) {
            console.log('距离上次刷新超过30秒，重新加载数据')
            await this.loadUsers()
            this.setData({ lastRefreshTime: currentTime })
        } else {
            console.log('距离上次刷新不足30秒，仅重新计算统计数据')
            this.calculateStats()
        }
    },

    // 加载用户列表
    async loadUsers(refresh = true) {
        if (this.data.loading) return

        this.setData({ loading: true })

        try {
            const page = refresh ? 1 : this.data.page
            const { filterStatus, searchKeyword } = this.data

            console.log('=== 开始加载用户列表 ===')
            console.log('请求参数:', { page, limit: 50, memberStatus: filterStatus })

            const result = await AdminAPI.getUsers({
                page,
                limit: 50,
                memberStatus: filterStatus === 'all' ? 'all' :
                    filterStatus === 'member' ? 'member' : 'non-member'
            })

            console.log('API响应结果:', result)

            if (result.code === 0) {
                let users = result.data.users.map(user => ({
                    ...user,
                    displayName: user.nick_name || '未设置昵称',
                    memberStatus: user.isMember ? '会员' : '非会员',
                    memberStatusClass: user.isMember ? 'member' : 'non-member',
                    createTime: this.formatDate(user.createTime),
                    memberExpiry: user.memberExpiry ? this.formatDate(user.memberExpiry) : '无',
                    activating: false // 初始化激活状态
                }))

                // 如果有搜索关键词，进行前端筛选
                if (searchKeyword.trim()) {
                    users = users.filter(user =>
                        user.displayName.includes(searchKeyword) ||
                        user.openid.includes(searchKeyword)
                    )
                }

                this.setData({
                    users: refresh ? users : [...this.data.users, ...users],
                    page: page,
                    hasMore: users.length === 50,
                    loading: false
                }, () => {
                    this.calculateStats()
                })

                console.log('用户数据已更新:', this.data.users)
            } else {
                console.error('API返回错误:', result)
                throw new Error(result.msg || '加载失败')
            }
        } catch (error) {
            console.error('加载用户失败:', error)
            wx.showToast({
                title: '加载失败: ' + error.message,
                icon: 'none'
            })
            this.setData({ loading: false })
        }
    },

    // 计算统计数据
    calculateStats() {
        const allUsers = this.data.users || []
        console.log('=== 开始重新计算统计数据 ===')
        console.log('当前用户总数:', allUsers.length)

        const members = allUsers.filter(u => u.isMember).length
        const nonMembers = allUsers.filter(u => !u.isMember).length

        const newStats = {
            total: allUsers.length,
            members: members,
            nonMembers: nonMembers
        }

        console.log('统计结果:', {
            '总用户': newStats.total,
            '会员用户': members,
            '非会员用户': nonMembers
        })

        this.setData({ stats: newStats })
        console.log('=== 统计数据计算完成 ===')
    },

    // 筛选用户
    filterUsers(e) {
        const status = e.currentTarget.dataset.status
        this.setData({
            filterStatus: status,
            page: 1,
            hasMore: true
        })
        this.loadUsers(true)
    },

    // 搜索用户
    onSearchInput(e) {
        const keyword = e.detail.value
        this.setData({ searchKeyword: keyword })

        // 防抖处理
        clearTimeout(this.searchTimer)
        this.searchTimer = setTimeout(() => {
            this.loadUsers(true)
        }, 500)
    },

    // 清空搜索
    clearSearch() {
        this.setData({ searchKeyword: '' })
        this.loadUsers(true)
    },

    // 复制用户OpenID
    copyOpenId(e) {
        const openid = e.currentTarget.dataset.openid
        wx.setClipboardData({
            data: openid,
            success: () => {
                wx.showToast({
                    title: '已复制',
                    icon: 'success'
                })
            }
        })
    },

    // 查看用户详情
    viewUserDetail(e) {
        const index = e.currentTarget.dataset.index
        const user = this.data.users[index]

        const content = `昵称：${user.displayName}\nOpenID：${user.openid}\n会员状态：${user.memberStatus}\n注册时间：${user.createTime}\n会员到期：${user.memberExpiry}`

        wx.showModal({
            title: '用户详情',
            content: content,
            showCancel: false
        })
    },

    // 一键开通会员
    async activateMember(e) {
        const index = e.currentTarget.dataset.index
        const user = this.data.users[index]

        // 检查用户是否已经是会员
        if (user.isMember) {
            wx.showToast({
                title: '用户已是会员',
                icon: 'none'
            })
            return
        }

        // 检查是否正在激活中
        if (user.activating) {
            wx.showToast({
                title: '正在处理中，请稍候',
                icon: 'none'
            })
            return
        }

        // 显示确认对话框
        this.showActivationDialog(user, index)
    },

    // 显示激活确认对话框
    showActivationDialog(user, index) {
        const userDetails = [
            `用户昵称：${user.displayName}`,
            `OpenID：${user.openid}`,
            `当前状态：${user.memberStatus}`,
            `注册时间：${user.createTime}`
        ].join('\n')

        // 显示时长选择对话框
        wx.showActionSheet({
            itemList: ['开通365天会员', '开通90天会员', '开通30天会员', '自定义天数'],
            success: (res) => {
                let duration = 365

                switch (res.tapIndex) {
                    case 0:
                        duration = 365
                        break
                    case 1:
                        duration = 90
                        break
                    case 2:
                        duration = 30
                        break
                    case 3:
                        // 自定义天数
                        this.showCustomDurationDialog(user, index)
                        return
                }

                // 显示最终确认对话框
                const dialogContent = `确认为以下用户开通会员？\n\n${userDetails}\n\n开通后将获得${duration}天会员权限。`

                wx.showModal({
                    title: '开通会员确认',
                    content: dialogContent,
                    confirmText: '确认开通',
                    cancelText: '取消',
                    confirmColor: '#07c160',
                    success: async (confirmRes) => {
                        if (confirmRes.confirm) {
                            await this.processActivation(user, index, duration)
                        }
                    }
                })
            }
        })
    },

    // 显示自定义天数对话框
    showCustomDurationDialog(user, index) {
        wx.showModal({
            title: '自定义会员天数',
            content: '请输入会员天数（1-3650天）',
            editable: true,
            placeholderText: '365',
            success: (res) => {
                if (res.confirm) {
                    const duration = parseInt(res.content)

                    if (isNaN(duration) || duration < 1 || duration > 3650) {
                        wx.showToast({
                            title: '请输入1-3650之间的数字',
                            icon: 'none'
                        })
                        return
                    }

                    // 显示最终确认
                    const userDetails = [
                        `用户昵称：${user.displayName}`,
                        `OpenID：${user.openid}`,
                        `当前状态：${user.memberStatus}`,
                        `注册时间：${user.createTime}`
                    ].join('\n')

                    const dialogContent = `确认为以下用户开通会员？\n\n${userDetails}\n\n开通后将获得${duration}天会员权限。`

                    wx.showModal({
                        title: '开通会员确认',
                        content: dialogContent,
                        confirmText: '确认开通',
                        cancelText: '取消',
                        confirmColor: '#07c160',
                        success: async (confirmRes) => {
                            if (confirmRes.confirm) {
                                await this.processActivation(user, index, duration)
                            }
                        }
                    })
                }
            }
        })
    },

    // 处理会员激活
    async processActivation(user, index, duration = 365) {
        // 设置激活状态
        const users = [...this.data.users]
        users[index].activating = true
        this.setData({ users })

        try {
            console.log(`开始激活用户: ${user.displayName} (OpenID: ${user.openid})`)

            const result = await AdminAPI.activateMember({
                openid: user.openid,
                duration: duration
            })

            if (result.code === 0) {
                console.log(`用户 ${user.displayName} 激活成功`)

                // 更新用户状态
                users[index].isMember = true
                users[index].memberStatus = '会员'
                users[index].memberStatusClass = 'member'
                users[index].memberExpiry = this.formatDate(result.data.memberExpiry)
                users[index].activating = false

                this.setData({ users }, () => {
                    this.calculateStats()
                })

                wx.showToast({
                    title: '会员开通成功',
                    icon: 'success'
                })

                console.log(`用户 ${user.displayName} 激活流程完成`)

            } else {
                throw new Error(result.msg || '激活失败')
            }
        } catch (error) {
            // 恢复激活状态
            users[index].activating = false
            this.setData({ users })

            console.error('激活用户失败:', error)
            wx.showToast({
                title: '激活失败：' + error.message,
                icon: 'none',
                duration: 3000
            })
        }
    },

    // 批量操作
    batchActivate() {
        const nonMembers = this.data.users.filter(u => !u.isMember)

        if (nonMembers.length === 0) {
            wx.showToast({
                title: '没有需要激活的用户',
                icon: 'none'
            })
            return
        }

        wx.showModal({
            title: '批量开通确认',
            content: `确认为 ${nonMembers.length} 个非会员用户批量开通会员？\n\n此操作不可撤销，请谨慎操作。`,
            confirmText: '确认开通',
            cancelText: '取消',
            confirmColor: '#07c160',
            success: async (res) => {
                if (res.confirm) {
                    await this.processBatchActivation(nonMembers)
                }
            }
        })
    },

    // 处理批量激活
    async processBatchActivation(users) {
        let successCount = 0
        let failCount = 0
        const failedUsers = []

        for (let i = 0; i < users.length; i++) {
            // 更新进度提示
            wx.showLoading({
                title: `激活中 ${i + 1}/${users.length}...`,
                mask: true
            })

            try {
                const result = await AdminAPI.activateMember({
                    openid: users[i].openid,
                    duration: 365
                })

                if (result.code === 0) {
                    successCount++
                    console.log(`用户 ${users[i].displayName} 激活成功`)
                } else {
                    failCount++
                    failedUsers.push({
                        name: users[i].displayName,
                        reason: result.msg || '未知错误'
                    })
                    console.error(`用户 ${users[i].displayName} 激活失败:`, result.msg)
                }
            } catch (error) {
                failCount++
                failedUsers.push({
                    name: users[i].displayName,
                    reason: error.message || '网络错误'
                })
                console.error(`激活用户 ${users[i].displayName} 失败:`, error)
            }

            // 添加小延迟避免请求过于频繁
            await new Promise(resolve => setTimeout(resolve, 200))
        }

        wx.hideLoading()

        // 刷新数据
        await this.loadUsers(true)

        // 显示详细结果
        let resultContent = `成功激活：${successCount} 个用户\n失败：${failCount} 个用户`

        if (failedUsers.length > 0 && failedUsers.length <= 3) {
            resultContent += '\n\n失败详情：\n'
            failedUsers.forEach(user => {
                resultContent += `${user.name}: ${user.reason}\n`
            })
        } else if (failedUsers.length > 3) {
            resultContent += '\n\n部分失败详情：\n'
            failedUsers.slice(0, 3).forEach(user => {
                resultContent += `${user.name}: ${user.reason}\n`
            })
            resultContent += `...还有 ${failedUsers.length - 3} 个用户失败`
        }

        wx.showModal({
            title: '批量激活完成',
            content: resultContent,
            showCancel: false,
            confirmText: '确定'
        })
    },

    // 下拉刷新
    async onPullDownRefresh() {
        console.log('=== 用户触发下拉刷新 ===')

        if (this.hasUsersActivating()) {
            wx.showToast({
                title: '有用户正在激活中，请稍候',
                icon: 'none'
            })
            wx.stopPullDownRefresh()
            return
        }

        try {
            await this.loadUsers(true)
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
            this.loadUsers(false)
        }
    },

    // 检查是否有用户正在激活中
    hasUsersActivating() {
        return this.data.users.some(user => user.activating)
    },

    // 格式化日期
    formatDate(dateStr) {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })
    },

    // 导航到订单管理页面
    navigateToOrders() {
        wx.navigateTo({
            url: '/pages/admin/orders/index'
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
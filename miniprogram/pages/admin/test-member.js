// 会员服务测试页面
const MemberAPI = require('../../utils/member-api')

Page({
    data: {
        openid: '',
        testResults: []
    },

    onLoad() {
        const openid = wx.getStorageSync('openid')
        this.setData({ openid })
    },

    // 测试查询会员状态
    async testGetStatus() {
        this.addLog('开始测试：查询会员状态')

        try {
            const result = await MemberAPI.checkMemberStatus()
            this.addLog('✅ 成功: ' + JSON.stringify(result, null, 2))
        } catch (err) {
            this.addLog('❌ 失败: ' + err.message)
        }
    },

    // 测试激活会员
    async testActivate() {
        this.addLog('开始测试：激活会员（月度）')

        const openid = this.data.openid
        if (!openid) {
            this.addLog('❌ 失败: 用户未登录')
            return
        }

        try {
            const result = await MemberAPI.activateMember(openid, 'monthly', 29.9)
            this.addLog('✅ 成功: ' + JSON.stringify(result, null, 2))
        } catch (err) {
            this.addLog('❌ 失败: ' + err.message)
        }
    },

    // 测试续费会员
    async testRenew() {
        this.addLog('开始测试：续费会员（季度）')

        const openid = this.data.openid
        if (!openid) {
            this.addLog('❌ 失败: 用户未登录')
            return
        }

        try {
            const result = await MemberAPI.renewMember(openid, 'quarterly', 49.9)
            this.addLog('✅ 成功: ' + JSON.stringify(result, null, 2))
        } catch (err) {
            this.addLog('❌ 失败: ' + err.message)
        }
    },

    // 测试查询订单
    async testGetOrders() {
        this.addLog('开始测试：查询订单记录')

        const openid = this.data.openid
        if (!openid) {
            this.addLog('❌ 失败: 用户未登录')
            return
        }

        try {
            const result = await MemberAPI.getOrders(openid)
            this.addLog('✅ 成功: ' + JSON.stringify(result, null, 2))
        } catch (err) {
            this.addLog('❌ 失败: ' + err.message)
        }
    },

    // 清除缓存
    clearCache() {
        MemberAPI.clearMemberCache()
        this.addLog('✅ 缓存已清除')
    },

    // 清空日志
    clearLog() {
        this.setData({ testResults: [] })
    },

    // 添加日志
    addLog(message) {
        const results = this.data.testResults
        results.push({
            time: new Date().toLocaleTimeString(),
            message: message
        })
        this.setData({ testResults: results })
    }
})

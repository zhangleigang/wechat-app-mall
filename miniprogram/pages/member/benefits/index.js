const MemberAPI = require('../../../utils/member-api')

Page({
    data: {
        memberInfo: null,
        memberExpireDate: '',
        memberDaysRemaining: 0,
        benefits: [
            {
                icon: '🎯',
                title: '无限次岗位分析',
                desc: 'AI智能分析职位描述，提取核心技能要求，预测面试问题',
                color: '#667eea'
            },
            {
                icon: '📄',
                title: '无限次简历解读',
                desc: '上传简历即可获得专业优化建议，提升简历竞争力',
                color: '#f093fb'
            },
            {
                icon: '💬',
                title: '无限次情绪支持',
                desc: 'AI情绪小屋随时陪伴，缓解面试压力，提供心理支持',
                color: '#4facfe'
            },
            {
                icon: '📚',
                title: '完整知识库访问',
                desc: '200+精选面试题，覆盖10+技术分类，随时查阅学习',
                color: '#43e97b'
            },
            {
                icon: '⚡',
                title: '优先客服支持',
                desc: '会员专属客服通道，问题快速响应，优先处理',
                color: '#fa709a'
            },
            {
                icon: '☁️',
                title: '数据云端保存',
                desc: '对话记录、分析结果云端存储，永久保存不丢失',
                color: '#30cfd0'
            },
            {
                icon: '🔄',
                title: '多设备同步',
                desc: '手机、平板、电脑多端数据实时同步，随时随地使用',
                color: '#a8edea'
            },
            {
                icon: '🎁',
                title: '专属功能优先体验',
                desc: '新功能会员优先体验，享受最新AI技术成果',
                color: '#fed6e3'
            }
        ],
        comparison: {
            free: {
                title: '非会员',
                features: [
                    { text: '每日3次岗位分析', available: true },
                    { text: '每日3次简历解读', available: true },
                    { text: '基础知识库访问', available: true },
                    { text: '无限次情绪支持', available: false },
                    { text: '完整知识库', available: false },
                    { text: '优先客服', available: false },
                    { text: '云端保存', available: false },
                    { text: '多设备同步', available: false }
                ]
            },
            member: {
                title: '会员',
                features: [
                    { text: '无限次岗位分析', available: true },
                    { text: '无限次简历解读', available: true },
                    { text: '完整知识库访问', available: true },
                    { text: '无限次情绪支持', available: true },
                    { text: '完整知识库', available: true },
                    { text: '优先客服', available: true },
                    { text: '云端保存', available: true },
                    { text: '多设备同步', available: true }
                ]
            }
        }
    },

    onLoad() {
        this.loadMemberInfo()
    },

    onShow() {
        this.loadMemberInfo()
    },

    // 加载会员信息
    async loadMemberInfo() {
        try {
            const memberInfo = await MemberAPI.checkMemberStatus()
            this.setData({
                memberInfo: memberInfo,
                memberExpireDate: memberInfo.expireDate || '',
                memberDaysRemaining: memberInfo.daysRemaining || 0
            })
        } catch (error) {
            console.error('加载会员信息失败:', error)
        }
    },

    // 立即开通/续费
    handlePurchase() {
        wx.navigateTo({
            url: '/pages/member/packages/index'
        })
    }
})

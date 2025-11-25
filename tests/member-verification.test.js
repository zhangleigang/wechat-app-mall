/**
 * 会员验证测试
 * 测试会员状态验证的各种场景
 */

const MemberLocal = require('../utils/memberLocal.js')
const SimpleAuth = require('../utils/simpleAuth.js')

// 模拟微信API
global.wx = {
    getStorageSync: function (key) {
        return this._storage[key]
    },
    setStorageSync: function (key, value) {
        this._storage[key] = value
    },
    removeStorageSync: function (key) {
        delete this._storage[key]
    },
    _storage: {}
}

/**
 * 测试1: 有效会员访问AI功能
 */
function testValidMemberAccess() {
    console.log('\n=== 测试1: 有效会员访问AI功能 ===')

    // 设置登录状态
    wx.setStorageSync('token', 'test_token_123')
    wx.setStorageSync('userId', 'test_user_123')

    // 激活年度会员
    const result = MemberLocal.activateMember('yearly')
    console.log('激活会员结果:', result)

    // 检查会员状态
    const memberInfo = MemberLocal.getMemberInfo()
    console.log('会员信息:', memberInfo)

    // 验证结果
    if (memberInfo.isValid) {
        console.log('✓ 测试通过: 有效会员可以访问AI功能')
        console.log(`  - 会员类型: ${memberInfo.memberType}`)
        console.log(`  - 剩余天数: ${memberInfo.daysRemaining}天`)
        console.log(`  - 到期时间: ${memberInfo.expireDate}`)
        return true
    } else {
        console.log('✗ 测试失败: 会员应该是有效的')
        return false
    }
}

/**
 * 测试2: 无效会员跳转购买页面
 */
function testInvalidMemberRedirect() {
    console.log('\n=== 测试2: 无效会员跳转购买页面 ===')

    // 清除会员数据
    wx.removeStorageSync('memberData')

    // 设置登录状态
    wx.setStorageSync('token', 'test_token_123')

    // 检查会员状态
    const memberInfo = MemberLocal.getMemberInfo()
    console.log('会员信息:', memberInfo)

    // 验证结果
    if (!memberInfo.isValid && memberInfo.reason === 'not_member') {
        console.log('✓ 测试通过: 无效会员应该跳转到购买页面')
        console.log(`  - 失败原因: ${memberInfo.reason}`)
        console.log('  - 应该跳转到: /pages/member/payment/index')
        return true
    } else {
        console.log('✗ 测试失败: 应该检测到无效会员')
        return false
    }
}

/**
 * 测试3: 会员过期提示
 */
function testExpiredMemberPrompt() {
    console.log('\n=== 测试3: 会员过期提示 ===')

    // 设置登录状态
    wx.setStorageSync('token', 'test_token_123')

    // 设置过期的会员数据
    const expiredDate = new Date()
    expiredDate.setDate(expiredDate.getDate() - 10) // 10天前过期

    const expiredMemberData = {
        isValid: true,
        expireDate: expiredDate.toISOString(),
        purchaseDate: new Date(expiredDate.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        packageType: 'yearly',
        price: 99.9,
        paymentMethod: 'qrcode',
        orderId: 'test_order_expired'
    }

    wx.setStorageSync('memberData', expiredMemberData)

    // 检查会员状态
    const memberInfo = MemberLocal.getMemberInfo()
    console.log('会员信息:', memberInfo)

    // 验证结果
    if (!memberInfo.isValid && memberInfo.reason === 'expired') {
        console.log('✓ 测试通过: 正确检测到会员已过期')
        console.log(`  - 失败原因: ${memberInfo.reason}`)
        console.log(`  - 过期时间: ${memberInfo.expireDate}`)
        console.log('  - 应该提示: "您的会员已过期，请续费"')
        return true
    } else {
        console.log('✗ 测试失败: 应该检测到会员过期')
        return false
    }
}

/**
 * 测试4: 会员状态刷新
 */
function testMemberStatusRefresh() {
    console.log('\n=== 测试4: 会员状态刷新 ===')

    // 设置登录状态
    wx.setStorageSync('token', 'test_token_123')

    // 激活月度会员
    MemberLocal.activateMember('monthly')

    // 第一次获取会员信息
    const memberInfo1 = MemberLocal.getMemberInfo()
    console.log('第一次获取会员信息:', {
        isValid: memberInfo1.isValid,
        daysRemaining: memberInfo1.daysRemaining
    })

    // 刷新会员状态
    const memberInfo2 = MemberLocal.refreshMemberStatus()
    console.log('刷新后的会员信息:', {
        isValid: memberInfo2.isValid,
        daysRemaining: memberInfo2.daysRemaining
    })

    // 验证结果
    if (memberInfo1.isValid && memberInfo2.isValid) {
        console.log('✓ 测试通过: 会员状态刷新成功')
        console.log(`  - 刷新前剩余天数: ${memberInfo1.daysRemaining}天`)
        console.log(`  - 刷新后剩余天数: ${memberInfo2.daysRemaining}天`)
        return true
    } else {
        console.log('✗ 测试失败: 会员状态刷新异常')
        return false
    }
}

/**
 * 测试5: 未登录用户访问
 */
function testNotLoginAccess() {
    console.log('\n=== 测试5: 未登录用户访问 ===')

    // 清除所有存储
    wx._storage = {}

    // 检查会员状态
    const memberInfo = MemberLocal.getMemberInfo()
    console.log('会员信息:', memberInfo)

    // 验证结果
    if (!memberInfo.isValid && memberInfo.reason === 'not_login') {
        console.log('✓ 测试通过: 正确检测到未登录状态')
        console.log(`  - 失败原因: ${memberInfo.reason}`)
        console.log('  - 应该跳转到: /pages/login/simple')
        return true
    } else {
        console.log('✗ 测试失败: 应该检测到未登录')
        return false
    }
}

/**
 * 测试6: 会员即将过期提醒
 */
function testMemberExpiringSoon() {
    console.log('\n=== 测试6: 会员即将过期提醒 ===')

    // 设置登录状态
    wx.setStorageSync('token', 'test_token_123')

    // 设置即将过期的会员（3天后过期）
    const expireDate = new Date()
    expireDate.setDate(expireDate.getDate() + 3)

    const memberData = {
        isValid: true,
        expireDate: expireDate.toISOString(),
        purchaseDate: new Date(expireDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        packageType: 'monthly',
        price: 19.9,
        paymentMethod: 'qrcode',
        orderId: 'test_order_expiring'
    }

    wx.setStorageSync('memberData', memberData)

    // 检查会员状态
    const memberInfo = MemberLocal.getMemberInfo()
    console.log('会员信息:', memberInfo)

    // 验证结果
    if (memberInfo.isValid && memberInfo.daysRemaining <= 7) {
        console.log('✓ 测试通过: 正确检测到会员即将过期')
        console.log(`  - 剩余天数: ${memberInfo.daysRemaining}天`)
        console.log('  - 应该提示: "您的会员即将过期，请及时续费"')
        return true
    } else {
        console.log('✗ 测试失败: 应该检测到会员即将过期')
        return false
    }
}

/**
 * 测试7: 不同套餐类型的会员
 */
function testDifferentPackageTypes() {
    console.log('\n=== 测试7: 不同套餐类型的会员 ===')

    // 设置登录状态
    wx.setStorageSync('token', 'test_token_123')

    const packages = ['monthly', 'quarterly', 'yearly']
    const results = []

    for (const packageId of packages) {
        // 清除旧数据
        wx.removeStorageSync('memberData')

        // 激活会员
        const result = MemberLocal.activateMember(packageId)
        const memberInfo = MemberLocal.getMemberInfo()

        console.log(`\n${packageId} 套餐:`)
        console.log(`  - 会员类型: ${memberInfo.memberType}`)
        console.log(`  - 剩余天数: ${memberInfo.daysRemaining}天`)
        console.log(`  - 价格: ¥${memberInfo.price}`)

        results.push(memberInfo.isValid)
    }

    // 验证结果
    if (results.every(r => r === true)) {
        console.log('\n✓ 测试通过: 所有套餐类型都能正常激活')
        return true
    } else {
        console.log('\n✗ 测试失败: 部分套餐激活失败')
        return false
    }
}

/**
 * 运行所有测试
 */
function runAllTests() {
    console.log('========================================')
    console.log('开始运行会员验证测试')
    console.log('========================================')

    const tests = [
        { name: '有效会员访问AI功能', fn: testValidMemberAccess },
        { name: '无效会员跳转购买页面', fn: testInvalidMemberRedirect },
        { name: '会员过期提示', fn: testExpiredMemberPrompt },
        { name: '会员状态刷新', fn: testMemberStatusRefresh },
        { name: '未登录用户访问', fn: testNotLoginAccess },
        { name: '会员即将过期提醒', fn: testMemberExpiringSoon },
        { name: '不同套餐类型的会员', fn: testDifferentPackageTypes }
    ]

    const results = []

    for (const test of tests) {
        try {
            const passed = test.fn()
            results.push({ name: test.name, passed })
        } catch (error) {
            console.log(`\n✗ 测试异常: ${test.name}`)
            console.log(`  错误信息: ${error.message}`)
            results.push({ name: test.name, passed: false })
        }
    }

    // 输出测试总结
    console.log('\n========================================')
    console.log('测试总结')
    console.log('========================================')

    const passedCount = results.filter(r => r.passed).length
    const totalCount = results.length

    results.forEach(result => {
        const status = result.passed ? '✓ 通过' : '✗ 失败'
        console.log(`${status}: ${result.name}`)
    })

    console.log(`\n总计: ${passedCount}/${totalCount} 测试通过`)
    console.log('========================================')

    return passedCount === totalCount
}

// 如果直接运行此文件，执行所有测试
if (require.main === module) {
    const allPassed = runAllTests()
    process.exit(allPassed ? 0 : 1)
}

module.exports = {
    testValidMemberAccess,
    testInvalidMemberRedirect,
    testExpiredMemberPrompt,
    testMemberStatusRefresh,
    testNotLoginAccess,
    testMemberExpiringSoon,
    testDifferentPackageTypes,
    runAllTests
}

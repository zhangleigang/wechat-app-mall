const express = require('express')
const mysql = require('mysql2/promise')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

// 数据库连接池
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'interview_helper',
    waitForConnections: true,
    connectionLimit: 10
})

// ============ 用户接口 ============

// 1. 查询会员状态
app.get('/api/member/status', async (req, res) => {
    try {
        const { openid } = req.query

        if (!openid) {
            return res.json({ code: -1, message: '缺少openid参数' })
        }

        const [rows] = await pool.query(
            'SELECT expire_date FROM user_members WHERE openid = ?',
            [openid]
        )

        if (rows.length === 0 || !rows[0].expire_date) {
            return res.json({
                code: 0,
                data: {
                    is_member: false,
                    expire_date: null,
                    days_remaining: 0
                }
            })
        }

        const expireDate = new Date(rows[0].expire_date)
        const now = new Date()

        if (expireDate <= now) {
            return res.json({
                code: 0,
                data: {
                    is_member: false,
                    expire_date: expireDate.toLocaleString('zh-CN'),
                    days_remaining: 0
                }
            })
        }

        const daysRemaining = Math.ceil((expireDate - now) / (24 * 60 * 60 * 1000))

        res.json({
            code: 0,
            data: {
                is_member: true,
                expire_date: expireDate.toLocaleString('zh-CN'),
                days_remaining: daysRemaining
            }
        })
    } catch (error) {
        console.error('查询会员状态失败:', error)
        res.json({ code: -1, message: '查询失败' })
    }
})

// 2. 创建订单并开通会员
app.post('/api/member/activate', async (req, res) => {
    const conn = await pool.getConnection()

    try {
        const { openid, nick_name, order_number, package_id, package_name, amount, days, device_info } = req.body

        if (!openid || !order_number || !days) {
            return res.json({ code: -1, message: '参数错误' })
        }

        await conn.beginTransaction()

        // 1. 创建订单记录
        const [orderResult] = await conn.query(
            'INSERT INTO orders (order_number, openid, nick_name, package_id, package_name, amount, days, device_info, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)',
            [order_number, openid, nick_name, package_id, package_name, amount, days, device_info]
        )

        // 2. 更新会员状态
        const [memberRows] = await conn.query(
            'SELECT expire_date FROM user_members WHERE openid = ?',
            [openid]
        )

        let newExpireDate
        const now = new Date()

        if (memberRows.length === 0) {
            // 新用户
            newExpireDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
            await conn.query(
                'INSERT INTO user_members (openid, nick_name, expire_date) VALUES (?, ?, ?)',
                [openid, nick_name, newExpireDate]
            )
        } else {
            // 老用户续费
            const currentExpire = new Date(memberRows[0].expire_date)
            const baseDate = currentExpire > now ? currentExpire : now
            newExpireDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000)

            await conn.query(
                'UPDATE user_members SET expire_date = ?, nick_name = ? WHERE openid = ?',
                [newExpireDate, nick_name, openid]
            )
        }

        await conn.commit()

        res.json({
            code: 0,
            message: '会员已开通',
            data: {
                expire_date: newExpireDate.toLocaleString('zh-CN'),
                order_id: orderResult.insertId
            }
        })
    } catch (error) {
        await conn.rollback()
        console.error('开通会员失败:', error)
        res.json({ code: -1, message: '开通失败' })
    } finally {
        conn.release()
    }
})

// ============ 管理员接口 ============

// 3. 查询订单列表
app.get('/api/admin/orders', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 20
        const status = req.query.status
        const offset = (page - 1) * limit

        // 构建查询条件
        let whereClause = ''
        let params = []

        if (status !== undefined && status !== '') {
            whereClause = 'WHERE status = ?'
            params.push(parseInt(status))
        }

        // 查询统计数据
        const [stats] = await pool.query(
            'SELECT COUNT(*) as total, SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as pending, SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as verified, SUM(CASE WHEN status = -1 THEN 1 ELSE 0 END) as abnormal, SUM(amount) as total_amount FROM orders'
        )

        // 查询列表
        const [rows] = await pool.query(
            `SELECT id, order_number, openid, nick_name, package_id, package_name, amount, days, status, device_info, created_at, verified_at, remark FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        )

        res.json({
            code: 0,
            data: {
                total: stats[0].total,
                pending: stats[0].pending,
                verified: stats[0].verified,
                abnormal: stats[0].abnormal,
                total_amount: stats[0].total_amount || 0,
                page,
                limit,
                list: rows
            }
        })
    } catch (error) {
        console.error('查询订单列表失败:', error)
        res.json({ code: -1, message: '查询失败' })
    }
})

// 4. 核实订单
app.post('/api/admin/orders/:orderId/verify', async (req, res) => {
    try {
        const { orderId } = req.params
        const { status, remark } = req.body

        if (![1, -1].includes(status)) {
            return res.json({ code: -1, message: '状态参数错误' })
        }

        await pool.query(
            'UPDATE orders SET status = ?, verified_at = NOW(), remark = ? WHERE id = ?',
            [status, remark, orderId]
        )

        res.json({
            code: 0,
            message: '订单已核实'
        })
    } catch (error) {
        console.error('核实订单失败:', error)
        res.json({ code: -1, message: '核实失败' })
    }
})

// 5. 导出订单（CSV格式）
app.get('/api/admin/orders/export', async (req, res) => {
    try {
        const { start_date, end_date } = req.query

        let whereClause = ''
        let params = []

        if (start_date && end_date) {
            whereClause = 'WHERE created_at BETWEEN ? AND ?'
            params = [start_date, end_date + ' 23:59:59']
        }

        const [rows] = await pool.query(
            `SELECT order_number, nick_name, package_name, amount, CASE status WHEN 0 THEN '待核实' WHEN 1 THEN '已核实' ELSE '异常' END as status_text, created_at FROM orders ${whereClause} ORDER BY created_at DESC`,
            params
        )

        // 生成CSV
        let csv = '订单号,用户昵称,套餐名称,金额,状态,创建时间\n'
        rows.forEach(row => {
            csv += `${row.order_number},${row.nick_name},${row.package_name},${row.amount},${row.status_text},${row.created_at}\n`
        })

        res.setHeader('Content-Type', 'text/csv; charset=utf-8')
        res.setHeader('Content-Disposition', 'attachment; filename=orders.csv')
        res.send('\ufeff' + csv) // 添加BOM以支持Excel打开中文
    } catch (error) {
        console.error('导出订单失败:', error)
        res.json({ code: -1, message: '导出失败' })
    }
})

// 健康检查
app.get('/health', (req, res) => {
    res.send('OK')
})

// 启动服务
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`✅ 会员服务已启动: http://localhost:${PORT}`)
    console.log(`📊 数据库: ${process.env.DB_NAME || 'interview_helper'}`)
    console.log(`🔗 API地址: http://localhost:${PORT}/api`)
})

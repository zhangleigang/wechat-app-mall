/**
 * 管理员接口路由
 */

const express = require('express');
const router = express.Router();

/**
 * 查询订单列表
 * GET /api/admin/orders?page=1&limit=20&status=1
 */
router.get('/orders', async (req, res) => {
    const pool = req.app.locals.pool;

    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;
        const offset = (page - 1) * limit;

        // 构建查询条件
        let whereClause = '';
        let params = [];

        if (status !== undefined && status !== '') {
            whereClause = 'WHERE status = ?';
            params.push(parseInt(status));
        }

        // 查询统计数据
        const [stats] = await pool.query(
            'SELECT COUNT(*) as total, SUM(amount) as total_amount FROM orders'
        );

        // 查询列表
        const [rows] = await pool.query(
            `SELECT id, order_number, openid, nick_name, package_id, amount, duration, created_at FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        res.json({
            code: 0,
            data: {
                total: stats[0].total,
                total_amount: stats[0].total_amount || 0,
                page,
                limit,
                list: rows
            }
        });
    } catch (error) {
        console.error('查询订单列表失败:', error);
        res.json({ code: -1, msg: '查询失败' });
    }
});

/**
 * 查询会员列表
 * GET /api/admin/members?page=1&limit=20
 */
router.get('/members', async (req, res) => {
    const pool = req.app.locals.pool;

    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        // 查询总数
        const [countResult] = await pool.query('SELECT COUNT(*) as total FROM members');

        // 查询列表
        const [rows] = await pool.query(
            'SELECT openid, nick_name, avatar_url, gender, country, province, city, expire_date, created_at, updated_at, last_login_at FROM members ORDER BY updated_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );

        // 计算会员状态
        const now = new Date();
        const list = rows.map(row => ({
            ...row,
            isValid: row.expire_date && new Date(row.expire_date) > now,
            daysRemaining: row.expire_date ? Math.max(0, Math.ceil((new Date(row.expire_date) - now) / (24 * 60 * 60 * 1000))) : 0
        }));

        res.json({
            code: 0,
            data: {
                total: countResult[0].total,
                page,
                limit,
                list
            }
        });
    } catch (error) {
        console.error('查询会员列表失败:', error);
        res.json({ code: -1, msg: '查询失败' });
    }
});

/**
 * 导出订单（CSV格式）
 * GET /api/admin/orders/export?start_date=2024-01-01&end_date=2024-12-31
 */
router.get('/orders/export', async (req, res) => {
    const pool = req.app.locals.pool;

    try {
        const { start_date, end_date } = req.query;

        let whereClause = '';
        let params = [];

        if (start_date && end_date) {
            whereClause = 'WHERE created_at BETWEEN ? AND ?';
            params = [start_date, end_date + ' 23:59:59'];
        }

        const [rows] = await pool.query(
            `SELECT order_number, openid, nick_name, package_id, amount, duration, created_at FROM orders ${whereClause} ORDER BY created_at DESC`,
            params
        );

        // 生成CSV
        let csv = '订单号,OpenID,用户昵称,套餐ID,金额,天数,创建时间\n';
        rows.forEach(row => {
            csv += `${row.order_number},${row.openid},${row.nick_name || ''},${row.package_id},${row.amount},${row.duration},${row.created_at}\n`;
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
        res.send('\ufeff' + csv); // 添加BOM以支持Excel打开中文
    } catch (error) {
        console.error('导出订单失败:', error);
        res.json({ code: -1, msg: '导出失败' });
    }
});

/**
 * 统计数据
 * GET /api/admin/stats
 */
router.get('/stats', async (req, res) => {
    const pool = req.app.locals.pool;

    try {
        // 总用户数
        const [totalUsers] = await pool.query('SELECT COUNT(*) as count FROM members');

        // 有效会员数
        const [validMembers] = await pool.query(
            'SELECT COUNT(*) as count FROM members WHERE expire_date > NOW()'
        );

        // 总订单数
        const [totalOrders] = await pool.query('SELECT COUNT(*) as count FROM orders');

        // 总收入
        const [totalRevenue] = await pool.query('SELECT SUM(amount) as total FROM orders');

        // 今日新增用户
        const [todayUsers] = await pool.query(
            'SELECT COUNT(*) as count FROM members WHERE DATE(created_at) = CURDATE()'
        );

        // 今日订单
        const [todayOrders] = await pool.query(
            'SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE()'
        );

        res.json({
            code: 0,
            data: {
                totalUsers: totalUsers[0].count,
                validMembers: validMembers[0].count,
                totalOrders: totalOrders[0].count,
                totalRevenue: totalRevenue[0].total || 0,
                todayUsers: todayUsers[0].count,
                todayOrders: todayOrders[0].count
            }
        });
    } catch (error) {
        console.error('获取统计数据失败:', error);
        res.json({ code: -1, msg: '获取失败' });
    }
});

module.exports = router;

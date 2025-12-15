/**
 * 管理员接口路由
 */

const express = require('express');
const router = express.Router();

// Import shared order status utilities (Requirements: 1.5)
const {
    ORDER_STATUS,
    STATUS_DISPLAY,
    isValidOrderStatus,
    validateAndSanitizeStatus
} = require('../utils/orderStatus');

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

        // 状态筛选 - 使用状态验证 (Requirements: 1.5)
        if (status !== undefined && status !== '') {
            try {
                const validatedStatus = validateAndSanitizeStatus(status);
                whereClause = 'WHERE status = ?';
                params.push(validatedStatus);
            } catch (error) {
                return res.status(400).json({
                    code: -1,
                    msg: `Invalid status parameter: ${error.message}`
                });
            }
        }

        // 查询统计数据
        const [stats] = await pool.query(
            'SELECT COUNT(*) as total, SUM(amount) as total_amount FROM orders'
        );

        // 查询列表
        const [rows] = await pool.query(
            `SELECT id, order_number, openid, nick_name, package_id, amount, duration, status, created_at FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
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
            `SELECT order_number, openid, nick_name, package_id, amount, duration, status, created_at FROM orders ${whereClause} ORDER BY created_at DESC`,
            params
        );

        // 生成CSV
        let csv = '订单号,OpenID,用户昵称,套餐ID,金额,天数,状态,创建时间\n';
        rows.forEach(row => {
            // Use consistent status mapping (Requirements: 1.5)
            const statusText = isValidOrderStatus(row.status) ?
                STATUS_DISPLAY[row.status] :
                `无效状态(${row.status})`;
            csv += `${row.order_number},${row.openid},${row.nick_name || ''},${row.package_id},${row.amount},${row.duration},${statusText},${row.created_at}\n`;
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
 * 验证订单（标记为已核实）
 * POST /api/admin/orders/:id/verify
 */
router.post('/orders/:id/verify', async (req, res) => {
    const pool = req.app.locals.pool;
    let connection = null;

    try {
        const orderId = parseInt(req.params.id);

        if (!orderId || orderId <= 0) {
            return res.json({ code: -1, msg: '订单ID无效' });
        }

        // 获取数据库连接并开始事务
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 使用 SELECT FOR UPDATE 锁定订单记录，防止并发修改
        const [orderRows] = await connection.query(
            'SELECT id, order_number, openid, status, amount, package_id FROM orders WHERE id = ? FOR UPDATE',
            [orderId]
        );

        if (orderRows.length === 0) {
            await connection.rollback();
            return res.json({ code: -1, msg: '订单不存在' });
        }

        const order = orderRows[0];

        // 检查订单状态 - 使用状态常量 (Requirements: 1.5)
        if (!isValidOrderStatus(order.status)) {
            await connection.rollback();
            return res.json({
                code: -1,
                msg: `订单状态无效: ${order.status}`
            });
        }

        if (order.status === ORDER_STATUS.VERIFIED) {
            await connection.rollback();
            return res.json({ code: -1, msg: '订单已经是核实状态，无需重复操作' });
        }

        if (order.status === ORDER_STATUS.CANCELLED) {
            await connection.rollback();
            return res.json({ code: -1, msg: '订单已取消，无法核实' });
        }

        // 更新订单状态为已核实 - 使用状态常量 (Requirements: 1.5)
        // 检查是否有 updated_at 字段，如果有则更新，如果没有则只更新状态
        let updateResult;
        try {
            // 尝试使用 updated_at 字段
            [updateResult] = await connection.query(
                'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = ?',
                [ORDER_STATUS.VERIFIED, orderId, ORDER_STATUS.PENDING]
            );
        } catch (updateError) {
            if (updateError.message.includes('updated_at')) {
                console.warn('orders 表缺少 updated_at 字段，使用备用更新方式');
                // 如果 updated_at 字段不存在，只更新状态
                [updateResult] = await connection.query(
                    'UPDATE orders SET status = ? WHERE id = ? AND status = ?',
                    [ORDER_STATUS.VERIFIED, orderId, ORDER_STATUS.PENDING]
                );
            } else {
                throw updateError;
            }
        }

        // 验证更新是否成功（防止状态在事务期间被其他进程修改）
        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.json({ code: -1, msg: '订单状态已被其他管理员修改，请刷新后重试' });
        }

        // 提交事务
        await connection.commit();

        // 记录操作日志
        console.log(`订单验证成功: 订单ID=${orderId}, 订单号=${order.order_number}, OpenID=${order.openid}, 金额=${order.amount}`);

        res.json({
            code: 0,
            msg: '订单已标记为核实',
            data: {
                orderId: orderId,
                orderNumber: order.order_number,
                previousStatus: ORDER_STATUS.PENDING,
                newStatus: ORDER_STATUS.VERIFIED
            }
        });

    } catch (error) {
        // 回滚事务
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('事务回滚失败:', rollbackError);
            }
        }

        console.error('验证订单失败:', {
            orderId: req.params.id,
            error: error.message,
            stack: error.stack
        });

        res.json({
            code: -1,
            msg: '操作失败，请稍后重试',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        // 释放数据库连接
        if (connection) {
            connection.release();
        }
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

        // 总订单数和按状态分组 - 使用状态常量 (Requirements: 1.5)
        const [totalOrders] = await pool.query('SELECT COUNT(*) as count FROM orders');
        const [pendingOrders] = await pool.query('SELECT COUNT(*) as count FROM orders WHERE status = ?', [ORDER_STATUS.PENDING]);
        const [verifiedOrders] = await pool.query('SELECT COUNT(*) as count FROM orders WHERE status = ?', [ORDER_STATUS.VERIFIED]);

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
                pendingOrders: pendingOrders[0].count,
                verifiedOrders: verifiedOrders[0].count,
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

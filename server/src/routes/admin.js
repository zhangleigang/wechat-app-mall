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
 * 查询用户列表 (微信转账功能)
 * GET /api/admin/users?page=1&limit=20&memberStatus=all
 */
router.get('/users', async (req, res) => {
    const pool = req.app.locals.pool;

    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const memberStatus = req.query.memberStatus || 'all'; // all, member, non-member
        const offset = (page - 1) * limit;

        // 构建查询条件
        let whereClause = '';
        let params = [];

        if (memberStatus === 'member') {
            whereClause = 'WHERE expire_date > NOW()';
        } else if (memberStatus === 'non-member') {
            whereClause = 'WHERE expire_date IS NULL OR expire_date <= NOW()';
        }

        // 查询总数
        const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM members ${whereClause}`, params);

        // 查询列表
        const [rows] = await pool.query(
            `SELECT openid, nick_name, avatar_url, expire_date, created_at, updated_at FROM members ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        // 计算会员状态
        const now = new Date();
        const list = rows.map(row => ({
            ...row,
            isMember: row.expire_date && new Date(row.expire_date) > now,
            memberExpiry: row.expire_date,
            createTime: row.created_at
        }));

        res.json({
            code: 0,
            data: {
                total: countResult[0].total,
                page,
                limit,
                users: list
            }
        });
    } catch (error) {
        console.error('查询用户列表失败:', error);
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
 * 快速开通会员 (微信转账功能)
 * POST /api/admin/activate-member
 */
router.post('/activate-member', async (req, res) => {
    const pool = req.app.locals.pool;
    let connection = null;

    try {
        const { openid, duration } = req.body;

        // 参数验证
        if (!openid) {
            return res.json({ code: -1, msg: 'OpenID不能为空' });
        }

        if (!duration || duration <= 0) {
            return res.json({ code: -1, msg: '会员时长必须大于0天' });
        }

        // 获取数据库连接并开始事务
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 检查用户是否存在
        const [userRows] = await connection.query(
            'SELECT openid, nick_name, expire_date FROM members WHERE openid = ? FOR UPDATE',
            [openid]
        );

        if (userRows.length === 0) {
            await connection.rollback();
            return res.json({ code: -1, msg: '用户不存在' });
        }

        const user = userRows[0];
        const now = new Date();

        // 计算新的过期时间
        let newExpireDate;
        if (user.expire_date && new Date(user.expire_date) > now) {
            // 如果用户还是有效会员，在现有基础上延长
            newExpireDate = new Date(user.expire_date);
            newExpireDate.setDate(newExpireDate.getDate() + duration);
        } else {
            // 如果用户不是会员或已过期，从现在开始计算
            newExpireDate = new Date();
            newExpireDate.setDate(newExpireDate.getDate() + duration);
        }

        // 更新用户会员状态
        const [updateResult] = await connection.query(
            'UPDATE members SET expire_date = ?, updated_at = CURRENT_TIMESTAMP WHERE openid = ?',
            [newExpireDate, openid]
        );

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.json({ code: -1, msg: '更新会员状态失败' });
        }

        // 提交事务
        await connection.commit();

        // 记录操作日志
        console.log(`会员激活成功: OpenID=${openid}, 昵称=${user.nick_name}, 延长天数=${duration}, 新过期时间=${newExpireDate.toISOString()}`);

        res.json({
            code: 0,
            message: '会员开通成功',
            data: {
                memberExpiry: newExpireDate.toISOString().slice(0, 19).replace('T', ' ')
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

        console.error('激活会员失败:', {
            openid: req.body.openid,
            duration: req.body.duration,
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

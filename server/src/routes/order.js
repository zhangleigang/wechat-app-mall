/**
 * 订单管理路由
 */

const express = require('express');
const router = express.Router();

/**
 * 查询用户订单
 * GET /api/orders?openid=xxx
 */
router.get('/', async (req, res) => {
    const pool = req.app.locals.pool;

    try {
        const openid = req.query.openid;

        if (!openid) {
            return res.json({ code: -1, msg: '缺少OpenID参数' });
        }

        const [rows] = await pool.query(
            'SELECT id, order_number, package_id, amount, duration, created_at FROM orders WHERE openid = ? ORDER BY created_at DESC',
            [openid]
        );

        res.json({
            code: 0,
            data: rows
        });
    } catch (error) {
        console.error('查询订单失败:', error);
        res.json({ code: -1, msg: '查询失败' });
    }
});

/**
 * 查询订单详情
 * GET /api/orders/:orderNumber
 */
router.get('/:orderNumber', async (req, res) => {
    const pool = req.app.locals.pool;

    try {
        const { orderNumber } = req.params;

        const [rows] = await pool.query(
            'SELECT * FROM orders WHERE order_number = ?',
            [orderNumber]
        );

        if (rows.length === 0) {
            return res.json({ code: -1, msg: '订单不存在' });
        }

        res.json({
            code: 0,
            data: rows[0]
        });
    } catch (error) {
        console.error('查询订单详情失败:', error);
        res.json({ code: -1, msg: '查询失败' });
    }
});

module.exports = router;

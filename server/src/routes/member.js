/**
 * 会员管理路由
 */

const express = require('express');
const router = express.Router();

/**
 * 查询会员状态
 * GET /api/member/status?openid=xxx
 */
router.get('/status', async (req, res) => {
    const pool = req.app.locals.pool;

    try {
        const openid = req.query.openid;

        if (!openid) {
            return res.json({ code: -1, msg: '缺少OpenID参数' });
        }

        const [rows] = await pool.query(
            'SELECT openid, nick_name, avatar_url, expire_date FROM members WHERE openid = ?',
            [openid]
        );

        if (rows.length === 0 || !rows[0].expire_date) {
            return res.json({
                code: 0,
                data: {
                    isValid: false,
                    expireDate: null,
                    daysRemaining: 0
                }
            });
        }

        const expireDate = new Date(rows[0].expire_date);
        const now = new Date();

        if (expireDate <= now) {
            return res.json({
                code: 0,
                data: {
                    isValid: false,
                    expireDate: expireDate.toISOString().split('T')[0],
                    daysRemaining: 0,
                    nickName: rows[0].nick_name,
                    avatarUrl: rows[0].avatar_url
                }
            });
        }

        const daysRemaining = Math.ceil((expireDate - now) / (24 * 60 * 60 * 1000));

        res.json({
            code: 0,
            data: {
                isValid: true,
                expireDate: expireDate.toISOString().split('T')[0],
                daysRemaining: daysRemaining,
                nickName: rows[0].nick_name,
                avatarUrl: rows[0].avatar_url
            }
        });
    } catch (error) {
        console.error('查询会员状态失败:', error);
        res.json({ code: -1, msg: '查询失败' });
    }
});

/**
 * 开通会员
 * POST /api/member/activate
 * Body: { openid, nickName, avatarUrl, packageId, duration, amount }
 */
router.post('/activate', async (req, res) => {
    const pool = req.app.locals.pool;
    const conn = await pool.getConnection();

    try {
        const { openid, nickName, avatarUrl, packageId, duration, amount } = req.body;

        if (!openid || !packageId || !duration) {
            return res.json({ code: -1, msg: '参数错误：缺少openid、packageId或duration' });
        }

        await conn.beginTransaction();

        // 1. 创建订单记录
        const orderNumber = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        await conn.query(
            'INSERT INTO orders (order_number, openid, nick_name, package_id, amount, duration) VALUES (?, ?, ?, ?, ?, ?)',
            [orderNumber, openid, nickName, packageId, amount, duration]
        );

        // 2. 更新会员状态
        const [memberRows] = await conn.query(
            'SELECT expire_date FROM members WHERE openid = ?',
            [openid]
        );

        let newExpireDate;
        const now = new Date();

        if (memberRows.length === 0) {
            // 新用户
            newExpireDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
            await conn.query(
                'INSERT INTO members (openid, nick_name, avatar_url, expire_date) VALUES (?, ?, ?, ?)',
                [openid, nickName, avatarUrl, newExpireDate]
            );
        } else {
            // 老用户续费
            const currentExpire = new Date(memberRows[0].expire_date);
            const baseDate = currentExpire > now ? currentExpire : now;
            newExpireDate = new Date(baseDate.getTime() + duration * 24 * 60 * 60 * 1000);

            await conn.query(
                'UPDATE members SET nick_name = ?, avatar_url = ?, expire_date = ? WHERE openid = ?',
                [nickName, avatarUrl, newExpireDate, openid]
            );
        }

        await conn.commit();

        res.json({
            code: 0,
            msg: '会员已开通',
            data: {
                expireDate: newExpireDate.toISOString().split('T')[0],
                orderNumber: orderNumber
            }
        });
    } catch (error) {
        await conn.rollback();
        console.error('开通会员失败:', error);
        res.json({ code: -1, msg: '开通失败: ' + error.message });
    } finally {
        conn.release();
    }
});

/**
 * 更新用户信息
 * POST /api/member/update-profile
 * Body: { openid, nickName, avatarUrl }
 */
router.post('/update-profile', async (req, res) => {
    const pool = req.app.locals.pool;

    try {
        const { openid, nickName, avatarUrl } = req.body;

        if (!openid) {
            return res.json({ code: -1, msg: '缺少OpenID参数' });
        }

        // 检查用户是否存在
        const [memberRows] = await pool.query(
            'SELECT openid FROM members WHERE openid = ?',
            [openid]
        );

        if (memberRows.length === 0) {
            // 用户不存在，创建新记录（但不设置会员到期时间）
            await pool.query(
                'INSERT INTO members (openid, nick_name, avatar_url) VALUES (?, ?, ?)',
                [openid, nickName || null, avatarUrl || null]
            );
        } else {
            // 用户存在，更新信息
            const updates = [];
            const values = [];

            if (nickName !== undefined) {
                updates.push('nick_name = ?');
                values.push(nickName);
            }
            if (avatarUrl !== undefined) {
                updates.push('avatar_url = ?');
                values.push(avatarUrl);
            }

            if (updates.length > 0) {
                values.push(openid);
                await pool.query(
                    `UPDATE members SET ${updates.join(', ')} WHERE openid = ?`,
                    values
                );
            }
        }

        res.json({
            code: 0,
            msg: '用户信息已更新'
        });
    } catch (error) {
        console.error('更新用户信息失败:', error);
        res.json({ code: -1, msg: '更新失败: ' + error.message });
    }
});

/**
 * 续费会员
 * POST /api/member/renew
 * Body: { openid, nickName, avatarUrl, packageId, duration, amount }
 */
router.post('/renew', async (req, res) => {
    const pool = req.app.locals.pool;
    const conn = await pool.getConnection();

    try {
        const { openid, nickName, avatarUrl, packageId, duration, amount } = req.body;

        if (!openid || !packageId || !duration) {
            return res.json({ code: -1, msg: '参数错误：缺少openid、packageId或duration' });
        }

        await conn.beginTransaction();

        // 1. 创建订单记录
        const orderNumber = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        await conn.query(
            'INSERT INTO orders (order_number, openid, nick_name, package_id, amount, duration) VALUES (?, ?, ?, ?, ?, ?)',
            [orderNumber, openid, nickName, packageId, amount, duration]
        );

        // 2. 更新会员状态
        const [memberRows] = await conn.query(
            'SELECT expire_date FROM members WHERE openid = ?',
            [openid]
        );

        let newExpireDate;
        const now = new Date();

        if (memberRows.length === 0) {
            // 新用户（理论上不应该走到这里）
            newExpireDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
            await conn.query(
                'INSERT INTO members (openid, nick_name, avatar_url, expire_date) VALUES (?, ?, ?, ?)',
                [openid, nickName, avatarUrl, newExpireDate]
            );
        } else {
            // 续费：从当前到期时间或现在（取较晚的）开始计算
            const currentExpire = new Date(memberRows[0].expire_date);
            const baseDate = currentExpire > now ? currentExpire : now;
            newExpireDate = new Date(baseDate.getTime() + duration * 24 * 60 * 60 * 1000);

            await conn.query(
                'UPDATE members SET nick_name = ?, avatar_url = ?, expire_date = ? WHERE openid = ?',
                [nickName, avatarUrl, newExpireDate, openid]
            );
        }

        await conn.commit();

        res.json({
            code: 0,
            msg: '续费成功',
            data: {
                expireDate: newExpireDate.toISOString().split('T')[0],
                orderNumber: orderNumber
            }
        });
    } catch (error) {
        await conn.rollback();
        console.error('续费失败:', error);
        res.json({ code: -1, msg: '续费失败: ' + error.message });
    } finally {
        conn.release();
    }
});

module.exports = router;

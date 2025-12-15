/**
 * 意见反馈路由（简化版）
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

/**
 * 提交反馈
 * POST /api/feedback/submit
 */
router.post('/submit', authMiddleware, async (req, res) => {
    const pool = req.app.locals.pool;

    try {
        const { openid, name, mobile, wechat, content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.json({
                code: -1,
                msg: '反馈内容不能为空'
            });
        }

        if (content.length > 1000) {
            return res.json({
                code: -1,
                msg: '反馈内容不能超过1000字'
            });
        }

        // 检查今日反馈次数（防止刷屏）
        const today = new Date().toISOString().split('T')[0];
        const [todayCount] = await pool.query(
            'SELECT COUNT(*) as count FROM feedback WHERE openid = ? AND DATE(created_at) = ?',
            [openid, today]
        );

        if (todayCount[0].count >= 5) {
            return res.json({
                code: -1,
                msg: '今日反馈次数已达上限'
            });
        }

        // 插入反馈记录
        const [result] = await pool.query(
            `INSERT INTO feedback (openid, name, mobile, wechat, content, created_at) 
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [openid, name || '匿名', mobile || '', wechat || '', content.trim()]
        );

        res.json({
            code: 0,
            msg: '反馈提交成功',
            data: {
                id: result.insertId
            }
        });

    } catch (error) {
        console.error('提交反馈失败:', error);
        res.json({
            code: -1,
            msg: '提交失败，请重试'
        });
    }
});

/**
 * 获取反馈列表（管理员专用）
 * GET /api/feedback/list?status=unread
 */
router.get('/list', async (req, res) => {
    const pool = req.app.locals.pool;

    try {
        const status = req.query.status || 'unread';

        // 查询统计信息
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'unread' THEN 1 ELSE 0 END) as unread_count,
                SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read_count,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
                SUM(CASE WHEN type = 'bug' THEN 1 ELSE 0 END) as bug_count
            FROM feedback
        `);

        // 构建查询条件
        let whereClause = '';
        let params = [];

        if (status !== 'all') {
            whereClause = 'WHERE f.status = ?';
            params.push(status);
        }

        // 查询列表（关联用户信息）
        const [rows] = await pool.query(`
            SELECT 
                f.id, f.openid, f.name, f.mobile, f.wechat, f.content, 
                f.type, f.status, f.admin_note, f.created_at,
                m.nick_name, m.avatar_url
            FROM feedback f
            LEFT JOIN members m ON f.openid = m.openid
            ${whereClause}
            ORDER BY 
                CASE f.status 
                    WHEN 'unread' THEN 1 
                    WHEN 'read' THEN 2 
                    WHEN 'resolved' THEN 3 
                END,
                f.created_at DESC
            LIMIT 50
        `, params);

        res.json({
            code: 0,
            data: {
                stats: stats[0],
                list: rows
            }
        });

    } catch (error) {
        console.error('获取反馈列表失败:', error);
        res.json({
            code: -1,
            msg: '获取失败'
        });
    }
});

/**
 * 快速操作反馈（标记已读/已解决/标记为Bug）
 * PUT /api/feedback/:id/action
 */
router.put('/:id/action', async (req, res) => {
    const pool = req.app.locals.pool;

    try {
        const feedbackId = req.params.id;
        const { action, note } = req.body; // action: 'read', 'resolved', 'mark_bug'

        let updateData = {};

        switch (action) {
            case 'read':
                updateData.status = 'read';
                break;
            case 'resolved':
                updateData.status = 'resolved';
                break;
            case 'mark_bug':
                updateData.type = 'bug';
                break;
            default:
                return res.json({
                    code: -1,
                    msg: '无效的操作'
                });
        }

        if (note) {
            updateData.admin_note = note;
        }

        // 构建更新语句
        const fields = Object.keys(updateData).map(key => `${key} = ?`);
        const values = Object.values(updateData);

        await pool.query(
            `UPDATE feedback SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
            [...values, feedbackId]
        );

        res.json({
            code: 0,
            msg: '操作成功'
        });

    } catch (error) {
        console.error('操作反馈失败:', error);
        res.json({
            code: -1,
            msg: '操作失败'
        });
    }
});

module.exports = router;
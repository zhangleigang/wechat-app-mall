/**
 * 管理员反馈管理路由
 */

const express = require('express');
const router = express.Router();

/**
 * 获取反馈列表（管理员专用）
 * GET /api/admin/feedback?status=unread&type=all&page=1
 */
router.get('/feedback', async (req, res) => {
    const pool = req.app.locals.pool;

    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status || 'all';
        const type = req.query.type || 'all';
        const offset = (page - 1) * limit;

        // 构建查询条件
        let whereConditions = [];
        let params = [];

        if (status !== 'all') {
            whereConditions.push('f.status = ?');
            params.push(status);
        }

        if (type !== 'all') {
            whereConditions.push('f.type = ?');
            params.push(type);
        }

        const whereClause = whereConditions.length > 0 ?
            'WHERE ' + whereConditions.join(' AND ') : '';

        // 查询总数和统计
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'unread' THEN 1 ELSE 0 END) as unread_count,
                SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read_count,
                SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_count,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
                SUM(CASE WHEN type = 'bug' THEN 1 ELSE 0 END) as bug_count,
                SUM(CASE WHEN type = 'suggestion' THEN 1 ELSE 0 END) as suggestion_count
            FROM feedback f ${whereClause}
        `, params);

        // 查询列表
        const [rows] = await pool.query(`
            SELECT 
                f.id, f.openid, f.name, f.mobile, f.wechat, f.content, 
                f.type, f.source, f.status, f.admin_reply,
                f.created_at, f.updated_at,
                m.nick_name, m.avatar_url
            FROM feedback f
            LEFT JOIN members m ON f.openid = m.openid
            ${whereClause}
            ORDER BY 
                CASE f.status 
                    WHEN 'unread' THEN 1 
                    WHEN 'read' THEN 2 
                    WHEN 'processing' THEN 3 
                    WHEN 'resolved' THEN 4 
                END,
                f.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        res.json({
            code: 0,
            data: {
                stats: stats[0],
                total: stats[0].total,
                page,
                limit,
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
 * 更新反馈状态和回复
 * PUT /api/admin/feedback/:id
 */
router.put('/feedback/:id', async (req, res) => {
    const pool = req.app.locals.pool;

    try {
        const feedbackId = req.params.id;
        const { status, type, admin_reply } = req.body;

        // 构建更新字段
        let updateFields = [];
        let params = [];

        if (status) {
            updateFields.push('status = ?');
            params.push(status);
        }

        if (type) {
            updateFields.push('type = ?');
            params.push(type);
        }

        if (admin_reply !== undefined) {
            updateFields.push('admin_reply = ?');
            params.push(admin_reply);
        }

        if (updateFields.length === 0) {
            return res.json({
                code: -1,
                msg: '没有要更新的字段'
            });
        }

        updateFields.push('updated_at = NOW()');
        params.push(feedbackId);

        await pool.query(
            `UPDATE feedback SET ${updateFields.join(', ')} WHERE id = ?`,
            params
        );

        res.json({
            code: 0,
            msg: '更新成功'
        });

    } catch (error) {
        console.error('更新反馈失败:', error);
        res.json({
            code: -1,
            msg: '更新失败'
        });
    }
});

/**
 * 批量标记为已读
 * PUT /api/admin/feedback/batch-read
 */
router.put('/feedback/batch-read', async (req, res) => {
    const pool = req.app.locals.pool;

    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.json({
                code: -1,
                msg: '请选择要标记的反馈'
            });
        }

        const placeholders = ids.map(() => '?').join(',');

        await pool.query(
            `UPDATE feedback SET status = 'read', updated_at = NOW() WHERE id IN (${placeholders})`,
            ids
        );

        res.json({
            code: 0,
            msg: `已标记 ${ids.length} 条反馈为已读`
        });

    } catch (error) {
        console.error('批量标记失败:', error);
        res.json({
            code: -1,
            msg: '操作失败'
        });
    }
});

module.exports = router;
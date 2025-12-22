/**
 * 微信转账支付路由
 */

const express = require('express');
const router = express.Router();

/**
 * 获取转账信息接口
 * GET /api/wechat-payment/info
 */
router.get('/info', async (req, res) => {
    const pool = req.app.locals.pool;

    try {
        // 查询微信转账配置
        const [configRows] = await pool.query(
            'SELECT wechat_id, member_price, member_duration FROM wechat_payment_config WHERE is_active = TRUE ORDER BY id DESC LIMIT 1'
        );

        if (configRows.length === 0) {
            return res.json({
                code: -1,
                msg: '微信转账配置未找到'
            });
        }

        const config = configRows[0];

        res.json({
            code: 0,
            data: {
                wechatId: config.wechat_id,
                price: config.member_price,
                duration: config.member_duration
            }
        });
    } catch (error) {
        console.error('获取转账信息失败:', error);
        res.json({
            code: -1,
            msg: '获取失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
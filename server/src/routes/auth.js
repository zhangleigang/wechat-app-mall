/**
 * 认证路由（整合到 member-service）
 * 替代 knowledge-api 的 users.json 存储
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');

// JWT 密钥（从环境变量读取）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 微信小程序配置
const WECHAT_APPID = process.env.WECHAT_APPID || '';
const WECHAT_SECRET = process.env.WECHAT_SECRET || '';

/**
 * 生成 JWT token
 */
function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

/**
 * 验证 JWT token
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

/**
 * 静默登录
 * POST /api/auth/login
 * Body: { code: '微信登录code' }
 */
router.post('/login', async (req, res) => {
    const pool = req.app.locals.pool; // 从 app 获取数据库连接池

    try {
        const { code } = req.body;

        if (!code) {
            return res.json({
                code: -1,
                msg: '缺少登录code'
            });
        }

        // 开发模式：如果没有配置微信参数，使用模拟登录
        if (!WECHAT_APPID || !WECHAT_SECRET) {
            console.log('⚠️  开发模式：使用模拟登录');
            const mockOpenid = 'mock_openid_' + Date.now();

            // 查询或创建用户（使用 members 表）
            const [rows] = await pool.query(
                'SELECT * FROM members WHERE openid = ?',
                [mockOpenid]
            );

            let user;
            if (rows.length === 0) {
                // 创建新用户
                await pool.query(
                    'INSERT INTO members (openid, session_key, last_login_at) VALUES (?, ?, NOW())',
                    [mockOpenid, 'mock_session_key']
                );
                user = { openid: mockOpenid };
            } else {
                user = rows[0];
                // 更新最后登录时间
                await pool.query(
                    'UPDATE members SET last_login_at = NOW() WHERE openid = ?',
                    [mockOpenid]
                );
            }

            const token = generateToken({
                openid: user.openid
            });

            return res.json({
                code: 0,
                msg: '登录成功（开发模式）',
                data: {
                    openid: user.openid,
                    token,
                    isNewUser: rows.length === 0
                }
            });
        }

        // 生产模式：调用微信接口
        const wxRes = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
            params: {
                appid: WECHAT_APPID,
                secret: WECHAT_SECRET,
                js_code: code,
                grant_type: 'authorization_code'
            }
        });

        if (wxRes.data.errcode) {
            return res.json({
                code: -1,
                msg: wxRes.data.errmsg || '微信登录失败'
            });
        }

        const { openid, session_key } = wxRes.data;

        // 查询或创建用户（使用 members 表）
        const [rows] = await pool.query(
            'SELECT * FROM members WHERE openid = ?',
            [openid]
        );

        let user;
        const isNewUser = rows.length === 0;

        if (isNewUser) {
            // 创建新用户
            await pool.query(
                'INSERT INTO members (openid, session_key, last_login_at) VALUES (?, ?, NOW())',
                [openid, session_key]
            );
            user = {
                openid,
                session_key,
                nick_name: null,
                avatar_url: null
            };
        } else {
            user = rows[0];
            console.log('老用户登录，数据库数据:', {
                openid: user.openid,
                nick_name: user.nick_name,
                avatar_url: user.avatar_url
            });
            // 更新 session_key 和最后登录时间
            await pool.query(
                'UPDATE members SET session_key = ?, last_login_at = NOW() WHERE openid = ?',
                [session_key, openid]
            );
        }

        // 如果前端传递了用户信息，更新到数据库
        const { nickName, avatarUrl, gender, country, province, city, language } = req.body;
        if (nickName || avatarUrl || gender !== undefined) {
            const updates = [];
            const values = [];

            if (nickName) {
                updates.push('nick_name = ?');
                values.push(nickName);
                user.nick_name = nickName; // 更新内存中的值
            }
            if (avatarUrl) {
                updates.push('avatar_url = ?');
                values.push(avatarUrl);
                user.avatar_url = avatarUrl; // 更新内存中的值
            }
            if (gender !== undefined) {
                updates.push('gender = ?');
                values.push(gender);
            }
            if (country) {
                updates.push('country = ?');
                values.push(country);
            }
            if (province) {
                updates.push('province = ?');
                values.push(province);
            }
            if (city) {
                updates.push('city = ?');
                values.push(city);
            }
            if (language) {
                updates.push('language = ?');
                values.push(language);
            }

            if (updates.length > 0) {
                values.push(openid);
                await pool.query(
                    `UPDATE members SET ${updates.join(', ')} WHERE openid = ?`,
                    values
                );
            }
        }

        // 生成 JWT token
        const token = generateToken({
            openid: user.openid
        });

        const responseData = {
            openid: user.openid,
            token,
            nickName: user.nick_name || null,
            avatarUrl: user.avatar_url || null,
            isNewUser
        };

        console.log('登录响应数据:', responseData);

        res.json({
            code: 0,
            msg: '登录成功',
            data: responseData
        });
    } catch (error) {
        console.error('登录失败:', error);
        res.json({
            code: -1,
            msg: error.message || '登录失败'
        });
    }
});

/**
 * 更新用户信息
 * POST /api/auth/update-profile
 * Headers: Authorization: Bearer {token}
 * Body: { nickName, avatarUrl, gender, country, province, city, language }
 */
router.post('/update-profile', async (req, res) => {
    const pool = req.app.locals.pool;

    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.json({ code: -1, msg: '未登录' });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.json({ code: -1, msg: 'Token无效' });
        }

        const { nickName, avatarUrl, gender, country, province, city, language } = req.body;
        const { openid } = decoded;

        // 更新用户信息（使用 members 表）
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
        if (gender !== undefined) {
            updates.push('gender = ?');
            values.push(gender);
        }
        if (country !== undefined) {
            updates.push('country = ?');
            values.push(country);
        }
        if (province !== undefined) {
            updates.push('province = ?');
            values.push(province);
        }
        if (city !== undefined) {
            updates.push('city = ?');
            values.push(city);
        }
        if (language !== undefined) {
            updates.push('language = ?');
            values.push(language);
        }

        if (updates.length === 0) {
            return res.json({ code: -1, msg: '没有要更新的数据' });
        }

        values.push(openid);

        await pool.query(
            `UPDATE members SET ${updates.join(', ')} WHERE openid = ?`,
            values
        );

        res.json({
            code: 0,
            msg: '更新成功'
        });
    } catch (error) {
        console.error('更新用户信息失败:', error);
        res.json({
            code: -1,
            msg: error.message || '更新失败'
        });
    }
});

/**
 * 检查 token
 * POST /api/auth/check
 * Headers: Authorization: Bearer {token}
 */
router.post('/check', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.json({ code: -1, msg: '未登录' });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.json({ code: -1, msg: 'Token无效或已过期' });
        }

        res.json({
            code: 0,
            msg: 'Token有效',
            data: {
                openid: decoded.openid
            }
        });
    } catch (error) {
        console.error('检查Token失败:', error);
        res.json({
            code: -1,
            msg: error.message || '检查失败'
        });
    }
});

/**
 * 获取用户信息
 * GET /api/auth/userinfo
 * Headers: Authorization: Bearer {token}
 */
router.get('/userinfo', async (req, res) => {
    const pool = req.app.locals.pool;

    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.json({ code: -1, msg: '未登录' });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.json({ code: -1, msg: 'Token无效' });
        }

        const [rows] = await pool.query(
            'SELECT openid, unionid, nick_name, avatar_url, gender, country, province, city, language, phone, expire_date, created_at, last_login_at FROM members WHERE openid = ?',
            [decoded.openid]
        );

        if (rows.length === 0) {
            return res.json({ code: -1, msg: '用户不存在' });
        }

        res.json({
            code: 0,
            data: rows[0]
        });
    } catch (error) {
        console.error('获取用户信息失败:', error);
        res.json({
            code: -1,
            msg: error.message || '获取失败'
        });
    }
});

module.exports = router;

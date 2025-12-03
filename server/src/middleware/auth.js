/**
 * 认证中间件
 */

const { verifyToken } = require('../utils/jwt');

/**
 * JWT 认证中间件
 */
function authMiddleware(req, res, next) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                code: -1,
                msg: '未登录'
            });
        }

        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                code: -1,
                msg: 'Token无效或已过期'
            });
        }

        // 将用户信息挂载到 req 对象
        req.user = decoded;
        next();
    } catch (error) {
        console.error('认证失败:', error);
        res.status(401).json({
            code: -1,
            msg: '认证失败'
        });
    }
}

module.exports = authMiddleware;

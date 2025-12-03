/**
 * 全局错误处理中间件
 */

function errorHandler(err, req, res, next) {
    console.error('服务器错误:', err);

    // 数据库错误
    if (err.code && err.code.startsWith('ER_')) {
        return res.status(500).json({
            code: -1,
            msg: '数据库错误',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // JWT 错误
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            code: -1,
            msg: 'Token无效'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            code: -1,
            msg: 'Token已过期'
        });
    }

    // 默认错误
    res.status(500).json({
        code: -1,
        msg: err.message || '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
}

module.exports = errorHandler;

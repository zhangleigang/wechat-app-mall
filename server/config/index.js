/**
 * 服务配置
 */

require('dotenv').config();

module.exports = {
    // 服务配置
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,

    // 数据库配置
    database: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ai_interview_helper',
        waitForConnections: true,
        connectionLimit: 10
    },

    // JWT 配置
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        expiresIn: '30d'
    },

    // 微信配置
    wechat: {
        appid: process.env.WECHAT_APPID || '',
        secret: process.env.WECHAT_SECRET || ''
    },

    // CORS 配置
    cors: {
        origin: process.env.CORS_ORIGIN || '*'
    }
};

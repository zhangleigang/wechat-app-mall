/**
 * PM2 部署配置文件
 * 用于统一管理knowledge-api和member-service两个服务
 * 
 * 使用方式：
 * pm2 start ecosystem.config.js
 * pm2 status
 * pm2 logs
 */

module.exports = {
    apps: [
        // 知识库API服务
        {
            name: 'knowledge-api',
            script: './knowledge-api/server.js',
            instances: 1,
            exec_mode: 'fork',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
                // 微信小程序配置（可选，不配置则使用开发模式）
                // WECHAT_APPID: 'your_appid',
                // WECHAT_SECRET: 'your_secret',
                // JWT_SECRET: 'your_jwt_secret'
            },
            error_file: './logs/knowledge-api-error.log',
            out_file: './logs/knowledge-api-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            max_memory_restart: '200M',
            autorestart: true,
            watch: false
        },

        // 会员服务
        {
            name: 'member-service',
            script: './member-service/server.js',
            instances: 1,
            exec_mode: 'fork',
            env: {
                NODE_ENV: 'production',
                PORT: 3001,
                // 数据库配置（必填）
                DB_HOST: 'localhost',
                DB_USER: 'root',
                DB_PASSWORD: 'your_password',  // 修改为实际密码
                DB_NAME: 'interview_helper'
            },
            error_file: './logs/member-service-error.log',
            out_file: './logs/member-service-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            max_memory_restart: '200M',
            autorestart: true,
            watch: false
        }
    ]
}

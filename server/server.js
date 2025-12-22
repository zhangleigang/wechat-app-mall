/**
 * AI面试助手 - 统一后端服务
 * 整合认证、会员、知识库、订单等所有功能
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const config = require('./config');
const { pool, testConnection } = require('./config/database');
const { errorHandler } = require('./src/middleware/errorHandler');

const app = express();

// ============ 中间件配置 ============
app.use(cors(config.cors));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/static', express.static('src/static'));

// 将数据库连接池挂载到 app
app.locals.pool = pool;

// ============ 路由配置 ============
const authRoutes = require('./src/routes/auth');
const memberRoutes = require('./src/routes/member');
const knowledgeRoutes = require('./src/routes/knowledge');
const orderRoutes = require('./src/routes/order');
const adminRoutes = require('./src/routes/admin');
const uploadRoutes = require('./src/routes/upload');
const resumeRoutes = require('./src/routes/resume');
const favoritesRoutes = require('./src/routes/favorites');
const feedbackRoutes = require('./src/routes/feedback');
const wechatPaymentRoutes = require('./src/routes/wechat-payment');

app.use('/api/auth', authRoutes);
app.use('/api/member', memberRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/wechat-payment', wechatPaymentRoutes);

// ============ 健康检查 ============
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: config.env
    });
});

// ============ 错误处理 ============
app.use(errorHandler);

// ============ 404处理 ============
app.use((req, res) => {
    res.status(404).json({
        code: -1,
        msg: '接口不存在'
    });
});

// ============ 启动服务 ============
async function startServer() {
    try {
        // 测试数据库连接
        await testConnection();

        // 启动服务
        app.listen(config.port, () => {
            console.log('');
            console.log('========================================');
            console.log('🚀 AI面试助手后端服务已启动');
            console.log('========================================');
            console.log(`📡 服务地址: http://localhost:${config.port}`);
            console.log(`🌍 环境: ${config.env}`);
            console.log(`📊 数据库: ${config.database.database}`);
            console.log('========================================');
            console.log('');
            console.log('📚 API文档:');
            console.log(`  - 健康检查: GET  /health`);
            console.log(`  - 用户登录: POST /api/auth/login`);
            console.log(`  - 会员状态: GET  /api/member/status`);
            console.log(`  - 知识库:   GET  /api/knowledge/categories`);
            console.log(`  - 收藏管理: GET  /api/favorites`);
            console.log('');
        });
    } catch (error) {
        console.error('❌ 服务启动失败:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;

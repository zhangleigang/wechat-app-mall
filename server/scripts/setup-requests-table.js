require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');
const config = require('../config/database');

async function createTable() {
    const connection = await mysql.createConnection(config);
    try {
        console.log('正在创建 group_product_requests 表...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS group_product_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                jd_url VARCHAR(255) NOT NULL COMMENT '用户填写的京东链接或SKU',
                jd_sku_id VARCHAR(50) NOT NULL COMMENT '提取的SKU',
                openid VARCHAR(100) NOT NULL COMMENT '提报人OpenID',
                room_no VARCHAR(50) NOT NULL COMMENT '提报人房号',
                status VARCHAR(20) DEFAULT 'pending' COMMENT '状态: pending, published, rejected',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('表 group_product_requests 创建成功！');
    } catch (err) {
        console.error('创建失败:', err);
    } finally {
        await connection.end();
    }
}

createTable();
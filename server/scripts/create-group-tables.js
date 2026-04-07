require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../config/database');

async function createTables() {
    try {
        const pool = config.pool;
        
        console.log('Creating group_products table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS group_products (
                id INT PRIMARY KEY AUTO_INCREMENT,
                jd_url VARCHAR(1000) COMMENT '商品链接',
                jd_sku_id VARCHAR(50) COMMENT '京东SKU，用于跳转京东小程序',
                title VARCHAR(255) COMMENT '商品名称',
                image VARCHAR(500) COMMENT '主图',
                category VARCHAR(50) COMMENT '分类',
                jd_price DECIMAL(10,2) COMMENT '京东当前价',
                room_no VARCHAR(50) COMMENT '发布者房号，如"4-2002-C"',
                openid VARCHAR(100) NOT NULL COMMENT '发布者',
                intention_count INT DEFAULT 1 COMMENT '意向登记数量',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                INDEX idx_category (category),
                INDEX idx_created_at (created_at),
                INDEX idx_openid (openid)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='团购商品表';
        `);
        console.log('group_products table created successfully.');

        console.log('Creating group_intentions table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS group_intentions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                product_id INT NOT NULL COMMENT '商品外键',
                openid VARCHAR(100) NOT NULL COMMENT '参与者',
                room_no VARCHAR(50) NOT NULL COMMENT '参与者房号，如"4-2002-C"',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '登记时间',
                UNIQUE KEY uk_product_openid (product_id, openid),
                INDEX idx_product_id (product_id),
                INDEX idx_openid (openid),
                CONSTRAINT fk_group_intentions_product FOREIGN KEY (product_id) REFERENCES group_products(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='团购意向表';
        `);
        console.log('group_intentions table created successfully.');

        console.log('Creating group_user_rooms table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS group_user_rooms (
                openid VARCHAR(100) PRIMARY KEY COMMENT '用户openid',
                room_no VARCHAR(50) NOT NULL COMMENT '绑定房号，如"4-2002-C"',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '绑定时间',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                INDEX idx_room_no (room_no)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='团购用户房号绑定表';
        `);
        console.log('group_user_rooms table created successfully.');

        process.exit(0);
    } catch (error) {
        console.error('Error creating tables:', error);
        process.exit(1);
    }
}

createTables();

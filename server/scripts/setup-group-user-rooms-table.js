require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../config/database');

async function main() {
    const connection = await mysql.createConnection(config.database);
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS group_user_rooms (
                openid VARCHAR(100) PRIMARY KEY COMMENT '用户openid',
                room_no VARCHAR(50) NOT NULL COMMENT '绑定房号，如"4-2002-C"',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '绑定时间',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                INDEX idx_room_no (room_no)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='团购用户房号绑定表';
        `);
        console.log('✅ group_user_rooms table is ready');
    } catch (e) {
        console.error('❌ Failed to create group_user_rooms table:', e.message || e);
        process.exitCode = 1;
    } finally {
        await connection.end();
    }
}

main();

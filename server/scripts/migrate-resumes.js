/**
 * 简历表数据库迁移脚本
 * 执行 init-resumes.sql 创建 resumes 表和相关视图
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../config');

async function runMigration() {
    let connection;

    try {
        console.log('========================================');
        console.log('📦 开始执行简历表数据库迁移');
        console.log('========================================');
        console.log('');

        // 创建数据库连接
        console.log('🔌 连接数据库...');
        connection = await mysql.createConnection({
            host: config.database.host,
            user: config.database.user,
            password: config.database.password,
            multipleStatements: true // 允许执行多条SQL语句
        });
        console.log('✅ 数据库连接成功');
        console.log('');

        // 读取SQL文件
        console.log('📖 读取SQL脚本...');
        const sqlFilePath = path.join(__dirname, '../database/init-resumes.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        console.log('✅ SQL脚本读取成功');
        console.log('');

        // 执行SQL脚本
        console.log('⚙️  执行SQL脚本...');
        const [results] = await connection.query(sqlContent);
        console.log('✅ SQL脚本执行成功');
        console.log('');

        // 验证表结构
        console.log('🔍 验证表结构...');
        const [tables] = await connection.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'resumes'
        `, [config.database.database]);

        if (tables.length > 0) {
            console.log('✅ resumes 表创建成功');

            // 查询表结构
            const [columns] = await connection.query(`
                SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_COMMENT
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'resumes'
                ORDER BY ORDINAL_POSITION
            `, [config.database.database]);

            console.log('');
            console.log('📋 表结构:');
            console.table(columns.map(col => ({
                字段名: col.COLUMN_NAME,
                类型: col.COLUMN_TYPE,
                可空: col.IS_NULLABLE,
                键: col.COLUMN_KEY,
                注释: col.COLUMN_COMMENT
            })));

            // 查询索引
            const [indexes] = await connection.query(`
                SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE
                FROM INFORMATION_SCHEMA.STATISTICS
                WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'resumes'
                ORDER BY INDEX_NAME, SEQ_IN_INDEX
            `, [config.database.database]);

            console.log('');
            console.log('🔑 索引信息:');
            console.table(indexes.map(idx => ({
                索引名: idx.INDEX_NAME,
                字段: idx.COLUMN_NAME,
                唯一: idx.NON_UNIQUE === 0 ? '是' : '否'
            })));

            // 查询视图
            const [views] = await connection.query(`
                SELECT TABLE_NAME
                FROM INFORMATION_SCHEMA.VIEWS
                WHERE TABLE_SCHEMA = ?
                AND TABLE_NAME IN ('resume_stats', 'recent_resumes')
            `, [config.database.database]);

            console.log('');
            console.log('👁️  视图信息:');
            if (views.length > 0) {
                views.forEach(view => {
                    console.log(`  ✅ ${view.TABLE_NAME}`);
                });
            } else {
                console.log('  ⚠️  未找到视图');
            }
        } else {
            console.log('❌ resumes 表创建失败');
            process.exit(1);
        }

        console.log('');
        console.log('========================================');
        console.log('✅ 数据库迁移完成！');
        console.log('========================================');

    } catch (error) {
        console.error('');
        console.error('========================================');
        console.error('❌ 数据库迁移失败');
        console.error('========================================');
        console.error('错误信息:', error.message);
        console.error('');

        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('💡 提示: 请检查数据库用户名和密码是否正确');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('💡 提示: 请检查数据库服务是否已启动');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('💡 提示: 请先运行 init.sql 创建数据库');
        }

        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 数据库连接已关闭');
        }
    }
}

// 执行迁移
runMigration();

#!/usr/bin/env node

/**
 * 数据库清理脚本 - 小程序上线前数据清理
 * 
 * 功能：
 * 1. 清理所有用户数据（保留表结构）
 * 2. 清理上传的文件
 * 3. 重置自增ID
 * 4. 验证清理结果
 * 
 * 使用方法：
 *   node scripts/clean-database.js
 * 
 * 注意：此操作不可逆，请在生产环境谨慎使用！
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// 数据库配置
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ai_interview_helper',
    charset: 'utf8mb4'
};

// 需要清理的表（按依赖关系排序）
const TABLES_TO_CLEAN = [
    'favorite_tags',    // 关联表先清理
    'tags',            // 标签表
    'favorites',       // 收藏表
    'resumes',         // 简历表
    'orders',          // 订单表
    'members'          // 用户表最后清理
];

// 需要清理的文件目录
const DIRECTORIES_TO_CLEAN = [
    'uploads/resumes',     // 简历文件
    'uploads/avatars',     // 头像文件（如果有）
    'logs'                 // 日志文件（可选）
];

class DatabaseCleaner {
    constructor() {
        this.connection = null;
        this.stats = {
            tablesCleared: 0,
            recordsDeleted: 0,
            filesDeleted: 0,
            directoriesCleared: 0
        };
    }

    /**
     * 连接数据库
     */
    async connect() {
        try {
            this.connection = await mysql.createConnection(dbConfig);
            console.log('✅ 数据库连接成功');

            // 测试连接
            const [rows] = await this.connection.execute('SELECT 1 as test');
            if (rows[0].test !== 1) {
                throw new Error('数据库连接测试失败');
            }
        } catch (error) {
            console.error('❌ 数据库连接失败:', error.message);
            throw error;
        }
    }

    /**
     * 获取用户确认
     */
    async getUserConfirmation() {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            console.log('\n⚠️  警告：此操作将清除所有用户数据！');
            console.log('📋 将要清理的内容：');
            console.log('   - 所有用户账户和会员信息');
            console.log('   - 所有订单记录');
            console.log('   - 所有简历文件和数据');
            console.log('   - 所有收藏和标签');
            console.log('   - 所有上传的文件');
            console.log('\n🔄 此操作不可逆！请确保已备份重要数据。');

            rl.question('\n确定要继续吗？请输入 "YES" 确认: ', (answer) => {
                rl.close();
                resolve(answer === 'YES');
            });
        });
    }

    /**
     * 清理数据库表
     */
    async cleanTables() {
        console.log('\n🗑️  开始清理数据库表...');

        // 禁用外键检查
        await this.connection.execute('SET FOREIGN_KEY_CHECKS = 0');

        for (const table of TABLES_TO_CLEAN) {
            try {
                // 获取清理前的记录数
                const [countResult] = await this.connection.execute(
                    `SELECT COUNT(*) as count FROM ${table}`
                );
                const recordCount = countResult[0].count;

                if (recordCount > 0) {
                    // 清理表数据
                    await this.connection.execute(`DELETE FROM ${table}`);

                    // 重置自增ID
                    await this.connection.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);

                    console.log(`   ✅ ${table}: 删除 ${recordCount} 条记录`);
                    this.stats.recordsDeleted += recordCount;
                } else {
                    console.log(`   ⏭️  ${table}: 表为空，跳过`);
                }

                this.stats.tablesCleared++;
            } catch (error) {
                console.error(`   ❌ ${table}: 清理失败 - ${error.message}`);
            }
        }

        // 重新启用外键检查
        await this.connection.execute('SET FOREIGN_KEY_CHECKS = 1');

        console.log(`✅ 数据库清理完成，共清理 ${this.stats.tablesCleared} 个表`);
    }

    /**
     * 清理文件目录
     */
    async cleanDirectories() {
        console.log('\n📁 开始清理文件目录...');

        for (const dir of DIRECTORIES_TO_CLEAN) {
            const fullPath = path.join(__dirname, '..', dir);

            try {
                // 检查目录是否存在
                await fs.access(fullPath);

                // 读取目录内容
                const files = await fs.readdir(fullPath);

                if (files.length > 0) {
                    // 删除所有文件
                    for (const file of files) {
                        const filePath = path.join(fullPath, file);
                        const stat = await fs.stat(filePath);

                        if (stat.isFile()) {
                            await fs.unlink(filePath);
                            this.stats.filesDeleted++;
                        } else if (stat.isDirectory()) {
                            // 递归删除子目录
                            await this.deleteDirectory(filePath);
                        }
                    }

                    console.log(`   ✅ ${dir}: 删除 ${files.length} 个文件/目录`);
                } else {
                    console.log(`   ⏭️  ${dir}: 目录为空，跳过`);
                }

                this.stats.directoriesCleared++;
            } catch (error) {
                if (error.code === 'ENOENT') {
                    console.log(`   ⏭️  ${dir}: 目录不存在，跳过`);
                } else {
                    console.error(`   ❌ ${dir}: 清理失败 - ${error.message}`);
                }
            }
        }

        console.log(`✅ 文件清理完成，共清理 ${this.stats.directoriesCleared} 个目录`);
    }

    /**
     * 递归删除目录
     */
    async deleteDirectory(dirPath) {
        const files = await fs.readdir(dirPath);

        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stat = await fs.stat(filePath);

            if (stat.isDirectory()) {
                await this.deleteDirectory(filePath);
            } else {
                await fs.unlink(filePath);
                this.stats.filesDeleted++;
            }
        }

        await fs.rmdir(dirPath);
    }

    /**
     * 验证清理结果
     */
    async verifyCleanup() {
        console.log('\n🔍 验证清理结果...');

        let allEmpty = true;

        for (const table of TABLES_TO_CLEAN) {
            try {
                const [result] = await this.connection.execute(
                    `SELECT COUNT(*) as count FROM ${table}`
                );
                const count = result[0].count;

                if (count === 0) {
                    console.log(`   ✅ ${table}: 已清空`);
                } else {
                    console.log(`   ❌ ${table}: 仍有 ${count} 条记录`);
                    allEmpty = false;
                }
            } catch (error) {
                console.error(`   ❌ ${table}: 验证失败 - ${error.message}`);
                allEmpty = false;
            }
        }

        return allEmpty;
    }

    /**
     * 显示统计信息
     */
    showStats() {
        console.log('\n📊 清理统计：');
        console.log(`   🗃️  清理表数量: ${this.stats.tablesCleared}`);
        console.log(`   📝 删除记录数: ${this.stats.recordsDeleted}`);
        console.log(`   📁 清理目录数: ${this.stats.directoriesCleared}`);
        console.log(`   🗂️  删除文件数: ${this.stats.filesDeleted}`);
    }

    /**
     * 关闭数据库连接
     */
    async close() {
        if (this.connection) {
            await this.connection.end();
            console.log('✅ 数据库连接已关闭');
        }
    }

    /**
     * 执行完整的清理流程
     */
    async run() {
        try {
            console.log('🚀 AI面试助手 - 数据库清理工具');
            console.log('=====================================');

            // 连接数据库
            await this.connect();

            // 获取用户确认
            const confirmed = await this.getUserConfirmation();
            if (!confirmed) {
                console.log('\n❌ 操作已取消');
                return;
            }

            console.log('\n🔄 开始清理...');

            // 清理数据库
            await this.cleanTables();

            // 清理文件
            await this.cleanDirectories();

            // 验证结果
            const success = await this.verifyCleanup();

            // 显示统计
            this.showStats();

            if (success) {
                console.log('\n🎉 数据库清理完成！系统已重置为全新状态。');
                console.log('💡 现在可以进行新用户流程测试了。');
            } else {
                console.log('\n⚠️  清理过程中出现问题，请检查上述错误信息。');
            }

        } catch (error) {
            console.error('\n💥 清理过程中发生错误:', error.message);
            console.error('详细错误:', error);
        } finally {
            await this.close();
        }
    }
}

// 主程序入口
if (require.main === module) {
    const cleaner = new DatabaseCleaner();
    cleaner.run().catch(console.error);
}

module.exports = DatabaseCleaner;
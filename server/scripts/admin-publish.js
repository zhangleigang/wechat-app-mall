require('dotenv').config({ path: '../.env' });
const readline = require('readline');
const mysql = require('mysql2/promise');
const config = require('../config/database');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const CATEGORIES = [
    '洗衣机',
    '沙发',
    '冰箱',
    '热水器',
    '餐桌餐椅',
    '床架床垫',
    '书桌工学椅',
    '其他'
];

async function main() {
    const connection = await mysql.createConnection(config.database);
    try {
        console.log('\n======================================');
        console.log('       🛠️ 人工发布商品辅助工具 🛠️       ');
        console.log('======================================\n');
        
        // 1. 显示待处理的提报
        const [requests] = await connection.query('SELECT * FROM group_product_requests WHERE status = "pending" ORDER BY created_at ASC');
        if (requests.length > 0) {
            console.log(`发现 ${requests.length} 个待处理的业主提报:`);
            requests.forEach(r => {
                console.log(`[ID: ${r.id}] 房号: ${r.room_no} | SKU: ${r.jd_sku_id} | 链接: ${r.jd_url} | 提报时间: ${new Date(r.created_at).toLocaleString()}`);
            });
            console.log('--------------------------------------\n');
        } else {
            console.log('当前没有待处理的提报。\n');
        }

        // 2. 开始人工发布流程
        console.log('开始手动发布新商品（按 Ctrl+C 退出）:');
        
        let targetSku = await question('👉 请输入要发布的商品 SKU ID (必填): ');
        targetSku = targetSku.trim();
        if (!targetSku) {
            console.log('SKU ID 不能为空！退出...');
            return;
        }

        const title = await question('👉 请输入商品标题 (必填): ');
        const image = await question('👉 请输入商品主图 URL (必填): ');
        const priceInput = await question('👉 请输入商品价格 (例如 99.00): ');
        
        console.log('\n可选商品分类:');
        CATEGORIES.forEach((c, idx) => {
            console.log(`${idx + 1}. ${c}`);
        });
        let categoryInput = await question('👉 请选择分类 (输入序号或名称，默认其他): ');
        categoryInput = categoryInput.trim();
        let category = '其他';
        if (categoryInput) {
            const idx = parseInt(categoryInput, 10);
            if (!Number.isNaN(idx) && idx >= 1 && idx <= CATEGORIES.length) {
                category = CATEGORIES[idx - 1];
            } else if (CATEGORIES.includes(categoryInput)) {
                category = categoryInput;
            }
        }

        let roomNo = await question('👉 请输入首个意向房号 (可选，若填写将自动为其登记意向): ');
        
        roomNo = roomNo.trim();

        // 开始写入数据库
        await connection.beginTransaction();

        // 插入商品
        const [result] = await connection.query(
            `INSERT INTO group_products (jd_url, jd_sku_id, title, image, category, jd_price, room_no, openid, intention_count) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                `https://item.jd.com/${targetSku}.html`, 
                targetSku, 
                title.trim() || '未命名商品', 
                image.trim() || '', 
                category, 
                parseFloat(priceInput) || 0, 
                roomNo || '管理员', 
                'admin_manual_publish', 
                roomNo ? 1 : 0
            ]
        );
        
        const productId = result.insertId;

        // 如果填了首个房号，顺便自动帮他把意向给登记了
        if (roomNo) {
            await connection.query(
                `INSERT INTO group_intentions (product_id, openid, room_no) VALUES (?, ?, ?)`,
                [productId, 'admin_proxy', roomNo]
            );
        }

        // 尝试把该 SKU 对应的 pending 提报更新为 published
        const [updateResult] = await connection.query(
            'UPDATE group_product_requests SET status = "published" WHERE jd_sku_id = ? AND status = "pending"', 
            [targetSku]
        );

        await connection.commit();

        console.log(`\n✅ 发布成功！商品在数据库的 ID: ${productId}`);
        if (updateResult.affectedRows > 0) {
            console.log(`已自动将 ${updateResult.affectedRows} 条相关的用户提报标记为"已处理(published)"`);
        }

    } catch (e) {
        if (connection) await connection.rollback();
        console.error('❌ 发布失败:', e);
    } finally {
        rl.close();
        if (connection) await connection.end();
    }
}

main();

const express = require('express');
const router = express.Router();

const CATEGORY_ALL = '全部';
const CATEGORY_OTHER = '其他';
const ALLOWED_CATEGORIES = new Set([
    '洗衣机',
    '沙发',
    '冰箱',
    '热水器',
    '餐桌餐椅',
    '床架床垫',
    '书桌工学椅',
    CATEGORY_OTHER
]);

function isAdminOpenid(openid) {
    const o = String(openid || '').trim();
    if (!o) return false;
    if (o === 'admin_manual_publish') return true;
    if (o === 'admin_proxy') return true;
    if (o.startsWith('admin_')) return true;
    return false;
}

function normalizeCategory(category) {
    const c = String(category || '').trim();
    if (!c || c === '默认') return CATEGORY_OTHER;
    return ALLOWED_CATEGORIES.has(c) ? c : CATEGORY_OTHER;
}

function normalizeImageUrl(url) {
    const u = String(url || '').trim();
    if (!u) return '';
    if (u.endsWith('.jpg.avif')) return u.slice(0, -5);
    if (u.endsWith('.png.avif')) return u.slice(0, -5);
    return u;
}

function normalizePrice(price) {
    if (price === null || price === undefined || price === '') return 0;
    const n = Number(price);
    return Number.isFinite(n) ? n : 0;
}

async function assertRoomBinding(connOrPool, openid, room_no) {
    if (isAdminOpenid(openid)) return;
    const o = String(openid || '').trim();
    const r = String(room_no || '').trim();
    if (!o || !r) return;

    const [rows] = await connOrPool.query('SELECT room_no FROM group_user_rooms WHERE openid = ? LIMIT 1', [o]);
    if (rows.length === 0) {
        try {
            await connOrPool.query('INSERT INTO group_user_rooms (openid, room_no) VALUES (?, ?)', [o, r]);
            return;
        } catch (e) {
            if (e && (e.code === 'ER_DUP_ENTRY' || e.errno === 1062)) {
                const [rows2] = await connOrPool.query('SELECT room_no FROM group_user_rooms WHERE openid = ? LIMIT 1', [o]);
                if (rows2.length > 0 && rows2[0].room_no !== r) {
                    const err = new Error(`该账号已绑定房号：${rows2[0].room_no}，不可更换为：${r}`);
                    err.statusCode = 400;
                    throw err;
                }
                return;
            }
            throw e;
        }
    }

    if (rows[0].room_no !== r) {
        const err = new Error(`该账号已绑定房号：${rows[0].room_no}，不可更换为：${r}`);
        err.statusCode = 400;
        throw err;
    }
}

// 2. 原发布新商品逻辑 (保留，供管理员人工调用或后续工具调用)
router.post('/products', async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const { jd_url, jd_sku_id, title, image, category, jd_price, room_no, openid } = req.body;
        
        if (!openid || !room_no || !jd_sku_id) {
            return res.status(400).json({ code: -1, msg: '缺少必要参数(openid, room_no, jd_sku_id)' });
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await assertRoomBinding(connection, openid, room_no);

            // 插入商品
            const [productResult] = await connection.query(
                `INSERT INTO group_products 
                 (jd_url, jd_sku_id, title, image, category, jd_price, room_no, openid, intention_count) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                [jd_url, jd_sku_id, title, normalizeImageUrl(image), normalizeCategory(category), normalizePrice(jd_price), room_no, openid]
            );

            const productId = productResult.insertId;

            // 插入默认意向（发布者自己）
            await connection.query(
                `INSERT INTO group_intentions (product_id, openid, room_no) VALUES (?, ?, ?)`,
                [productId, openid, room_no]
            );

            await connection.commit();
            res.json({ code: 0, data: { id: productId }, msg: '发布成功' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({ code: -1, msg: status === 400 ? error.message : ('发布失败: ' + error.message) });
    }
});

router.patch('/products/by-sku/:sku', async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const sku = String(req.params.sku || '').trim();
        if (!sku) return res.status(400).json({ code: -1, msg: '缺少必要参数(sku)' });

        const {
            title,
            image,
            jd_price,
            category,
            jd_url
        } = req.body || {};

        const updates = [];
        const params = [];

        if (title !== undefined) {
            updates.push('title = ?');
            params.push(String(title || '').trim());
        }
        if (image !== undefined) {
            updates.push('image = ?');
            params.push(normalizeImageUrl(image));
        }
        if (jd_price !== undefined) {
            updates.push('jd_price = ?');
            params.push(normalizePrice(jd_price));
        }
        if (category !== undefined) {
            updates.push('category = ?');
            params.push(normalizeCategory(category));
        }
        if (jd_url !== undefined) {
            updates.push('jd_url = ?');
            params.push(String(jd_url || '').trim());
        }

        if (updates.length === 0) {
            return res.status(400).json({ code: -1, msg: '未提供可更新字段' });
        }

        params.push(sku);
        const [result] = await pool.query(
            `UPDATE group_products SET ${updates.join(', ')} WHERE jd_sku_id = ? ORDER BY id DESC LIMIT 1`,
            params
        );

        if (!result.affectedRows) {
            return res.status(404).json({ code: -1, msg: '未找到该SKU对应的商品' });
        }

        res.json({ code: 0, msg: '更新成功' });
    } catch (error) {
        res.status(500).json({ code: -1, msg: '更新失败: ' + (error.message || '') });
    }
});

// 3. 获取商品列表
router.get('/products', async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const { category } = req.query;
        
        let query = 'SELECT * FROM group_products WHERE 1=1';
        const params = [];

        if (category && category !== CATEGORY_ALL) {
            if (category === CATEGORY_OTHER) {
                query += " AND (category = ? OR category IS NULL OR category = '' OR category = '默认')";
                params.push(CATEGORY_OTHER);
            } else {
                query += ' AND category = ?';
                params.push(category);
            }
        }

        query += ' ORDER BY created_at DESC';

        const [rows] = await pool.query(query, params);
        const productIds = rows.map((r) => r.id);
        const intentionsMap = new Map();

        if (productIds.length > 0) {
            const [intentionRows] = await pool.query(
                'SELECT id, product_id, room_no, created_at FROM group_intentions WHERE product_id IN (?) ORDER BY created_at ASC',
                [productIds]
            );
            intentionRows.forEach((ir) => {
                if (!intentionsMap.has(ir.product_id)) intentionsMap.set(ir.product_id, []);
                intentionsMap.get(ir.product_id).push({
                    id: ir.id,
                    room_no: ir.room_no,
                    created_at: ir.created_at
                });
            });
        }

        const data = rows.map((r) => ({
            ...(r || {}),
            category: normalizeCategory(r.category),
            image: normalizeImageUrl(r.image),
            intentions: intentionsMap.get(r.id) || [],
            intention_count: (intentionsMap.get(r.id) || []).length
        }));
        res.json({ code: 0, data });
    } catch (error) {
        res.status(500).json({ code: -1, msg: '获取列表失败' });
    }
});

// 4. 我的心愿单（用户已登记意向的商品列表 + 总价汇总）
router.get('/wishlist', async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const openid = String(req.query.openid || '').trim();
        if (!openid) {
            return res.status(400).json({ code: -1, msg: '缺少必要参数(openid)' });
        }

        const [rows] = await pool.query(
            `SELECT p.*, i.created_at AS intention_created_at
             FROM group_intentions i
             INNER JOIN group_products p ON p.id = i.product_id
             WHERE i.openid = ?
             ORDER BY i.created_at DESC`,
            [openid]
        );

        const items = rows.map((r) => ({
            ...r,
            category: normalizeCategory(r.category),
            image: normalizeImageUrl(r.image)
        }));

        const productIds = items.map((it) => it.id);
        if (productIds.length > 0) {
            const [countRows] = await pool.query(
                'SELECT product_id, COUNT(*) AS cnt FROM group_intentions WHERE product_id IN (?) GROUP BY product_id',
                [productIds]
            );
            const countMap = new Map(countRows.map((cr) => [cr.product_id, Number(cr.cnt) || 0]));
            items.forEach((it) => {
                it.intention_count = countMap.get(it.id) || 0;
            });
        }

        const total = items.reduce((sum, it) => sum + normalizePrice(it.jd_price), 0);

        res.json({
            code: 0,
            data: {
                items,
                count: items.length,
                total_price: Number(total.toFixed(2))
            }
        });
    } catch (error) {
        res.status(500).json({ code: -1, msg: '获取心愿单失败' });
    }
});

// 4. 获取商品详情
router.get('/products/:id', async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const productId = req.params.id;

        const [products] = await pool.query('SELECT * FROM group_products WHERE id = ?', [productId]);
        if (products.length === 0) {
            return res.status(404).json({ code: -1, msg: '商品不存在' });
        }

        const [intentions] = await pool.query(
            'SELECT id, openid, room_no, created_at FROM group_intentions WHERE product_id = ? ORDER BY created_at ASC',
            [productId]
        );

        res.json({
            code: 0,
            data: {
                ...products[0],
                category: normalizeCategory(products[0].category),
                image: normalizeImageUrl(products[0].image),
                intention_count: intentions.length,
                intentions
            }
        });
    } catch (error) {
        res.status(500).json({ code: -1, msg: '获取详情失败' });
    }
});

// 5. 登记意向
router.post('/products/:id/intentions', async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const productId = req.params.id;
        const { openid, room_no } = req.body;

        if (!openid || !room_no) {
            return res.status(400).json({ code: -1, msg: '缺少必要参数(openid, room_no)' });
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await assertRoomBinding(connection, openid, room_no);

            // 检查是否已登记
            const [existing] = await connection.query(
                'SELECT id FROM group_intentions WHERE product_id = ? AND openid = ?',
                [productId, openid]
            );

            if (existing.length > 0) {
                await connection.rollback();
                return res.status(400).json({ code: -1, msg: '您已经登记过该商品意向了' });
            }

            // 插入意向
            await connection.query(
                'INSERT INTO group_intentions (product_id, openid, room_no) VALUES (?, ?, ?)',
                [productId, openid, room_no]
            );

            // 更新意向数量
            await connection.query(
                'UPDATE group_products SET intention_count = (SELECT COUNT(*) FROM group_intentions WHERE product_id = ?) WHERE id = ?',
                [productId, productId]
            );

            await connection.commit();
            res.json({ code: 0, msg: '登记成功' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({ code: -1, msg: status === 400 ? error.message : ('登记失败: ' + error.message) });
    }
});

module.exports = router;

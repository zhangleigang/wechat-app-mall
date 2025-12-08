/**
 * 收藏管理路由
 * 包含收藏CRUD、标签管理、AI生成答案等功能
 */

const express = require('express');
const router = express.Router();
const {
    ERROR_CODES,
    BusinessError,
    validateParams,
    asyncHandler
} = require('../middleware/errorHandler');
const logger = require('../utils/logger');


async function createFavorite(req, res) {
    const pool = req.app.locals.pool;
    const conn = await pool.getConnection();

    try {
        const { openid, question, answer, sourceType, sourceId, sourceCategory, tags } = req.body;

        // 验证必填参数
        validateParams(req.body, {
            openid: { required: true, type: 'string' },
            question: { required: true, type: 'string', minLength: 1 },
            answer: { required: true, type: 'string', minLength: 1 },
            sourceType: {
                required: true,
                validator: (val) => ['knowledge', 'resume', 'custom'].includes(val),
                message: 'sourceType必须是knowledge、resume或custom之一'
            }
        });

        // 检查会员配额
        const quotaCheck = await checkFavoriteQuota(conn, openid);
        if (!quotaCheck.allowed) {
            throw new BusinessError(ERROR_CODES.LIMIT_EXCEEDED, quotaCheck.message, {
                error: 'QUOTA_EXCEEDED',
                current: quotaCheck.current,
                limit: quotaCheck.limit,
                isValid: quotaCheck.isValid
            });
        }

        await conn.beginTransaction();

        try {
            // 1. 插入收藏记录
            const [result] = await conn.query(
                `INSERT INTO favorites (openid, question, answer, source_type, source_id, source_category, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [openid, question, answer, sourceType, sourceId || null, sourceCategory || null]
            );

            const favoriteId = result.insertId;

            // 2. 处理标签
            let tagsToAdd = [];

            // 自动标签：简历来源自动添加"简历分析"标签
            if (sourceType === 'resume') {
                tagsToAdd.push('简历分析');
            }

            // 添加用户提供的标签
            if (tags && Array.isArray(tags) && tags.length > 0) {
                tagsToAdd = tagsToAdd.concat(tags);
            }

            // 去重并添加标签
            const uniqueTags = [...new Set(tagsToAdd.map(t => t.trim()).filter(t => t))];

            for (const tagName of uniqueTags) {
                // 获取或创建标签
                const tagId = await getOrCreateTag(conn, openid, tagName);

                // 关联标签到收藏（使用INSERT IGNORE避免重复）
                await conn.query(
                    'INSERT IGNORE INTO favorite_tags (favorite_id, tag_id, created_at) VALUES (?, ?, NOW())',
                    [favoriteId, tagId]
                );

                // 更新标签使用次数
                await conn.query(
                    'UPDATE tags SET use_count = use_count + 1 WHERE id = ?',
                    [tagId]
                );
            }

            await conn.commit();

            // 3. 查询完整的收藏信息（包含标签）
            const favorite = await getFavoriteById(conn, favoriteId, openid);

            res.json({
                code: 0,
                message: '收藏成功',
                data: favorite
            });
        } catch (error) {
            await conn.rollback();
            throw error;
        }
    } catch (error) {
        if (error instanceof BusinessError) {
            throw error;
        }
        logger.logDatabaseError('createFavorite', error, { openid: req.body.openid });
        throw new BusinessError(ERROR_CODES.DATABASE_ERROR, '创建收藏失败');
    } finally {
        conn.release();
    }
}


async function getFavorites(req, res) {
    const pool = req.app.locals.pool;
    const conn = await pool.getConnection();

    try {
        const { openid, page = 1, pageSize = 20, tag } = req.query;

        // 验证参数
        validateParams(req.query, {
            openid: { required: true, type: 'string' }
        });

        const pageNum = parseInt(page);
        const pageSizeNum = parseInt(pageSize);
        const offset = (pageNum - 1) * pageSizeNum;

        let query;
        let countQuery;
        let params;
        let countParams;

        if (tag) {
            // 按标签筛选 - 优化：使用EXISTS子查询代替JOIN，减少DISTINCT开销
            query = `
                SELECT f.* 
                FROM favorites f
                WHERE f.openid = ? 
                AND EXISTS (
                    SELECT 1 FROM favorite_tags ft
                    INNER JOIN tags t ON ft.tag_id = t.id
                    WHERE ft.favorite_id = f.id AND t.name = ? AND t.openid = ?
                )
                ORDER BY f.created_at DESC
                LIMIT ? OFFSET ?
            `;
            countQuery = `
                SELECT COUNT(*) as total
                FROM favorites f
                WHERE f.openid = ? 
                AND EXISTS (
                    SELECT 1 FROM favorite_tags ft
                    INNER JOIN tags t ON ft.tag_id = t.id
                    WHERE ft.favorite_id = f.id AND t.name = ? AND t.openid = ?
                )
            `;
            params = [openid, tag, openid, pageSizeNum, offset];
            countParams = [openid, tag, openid];
        } else {
            // 获取所有收藏 - 使用覆盖索引 idx_openid_created
            query = `
                SELECT * FROM favorites 
                WHERE openid = ? 
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `;
            countQuery = `
                SELECT COUNT(*) as total 
                FROM favorites 
                WHERE openid = ?
            `;
            params = [openid, pageSizeNum, offset];
            countParams = [openid];
        }

        // 查询收藏列表
        const [favorites] = await conn.query(query, params);

        // 查询总数
        const [countResult] = await conn.query(countQuery, countParams);
        const total = countResult[0].total;

        // 批量加载标签 - 优化：使用单次查询代替N+1查询
        if (favorites.length > 0) {
            const favoriteIds = favorites.map(f => f.id);
            const [tagRows] = await conn.query(
                `SELECT ft.favorite_id, t.id, t.name 
                 FROM tags t
                 INNER JOIN favorite_tags ft ON t.id = ft.tag_id
                 WHERE ft.favorite_id IN (?)
                 ORDER BY ft.favorite_id, t.name`,
                [favoriteIds]
            );

            // 将标签分组到对应的收藏
            const tagsByFavorite = {};
            tagRows.forEach(tag => {
                if (!tagsByFavorite[tag.favorite_id]) {
                    tagsByFavorite[tag.favorite_id] = [];
                }
                tagsByFavorite[tag.favorite_id].push({
                    id: tag.id,
                    name: tag.name
                });
            });

            // 为每个收藏添加标签
            favorites.forEach(favorite => {
                favorite.tags = tagsByFavorite[favorite.id] || [];
            });
        }

        res.json({
            code: 0,
            message: 'success',
            data: {
                favorites: favorites,
                pagination: {
                    page: pageNum,
                    pageSize: pageSizeNum,
                    total: total,
                    totalPages: Math.ceil(total / pageSizeNum),
                    hasMore: offset + favorites.length < total
                }
            }
        });
    } catch (error) {
        if (error instanceof BusinessError) {
            throw error;
        }
        logger.logDatabaseError('getFavorites', error, { openid: req.query.openid });
        throw new BusinessError(ERROR_CODES.DATABASE_ERROR, '获取收藏列表失败');
    } finally {
        conn.release();
    }
}


async function getFavoriteDetail(req, res) {
    const pool = req.app.locals.pool;
    const conn = await pool.getConnection();

    try {
        const { id } = req.params;
        const { openid } = req.query;

        // 验证参数
        validateParams(req.query, {
            openid: { required: true, type: 'string' }
        });

        validateParams(req.params, {
            id: {
                required: true,
                validator: (val) => !isNaN(parseInt(val)),
                message: '无效的收藏ID'
            }
        });

        const favorite = await getFavoriteById(conn, parseInt(id), openid);

        if (!favorite) {
            throw new BusinessError(ERROR_CODES.NOT_FOUND, '收藏不存在');
        }

        res.json({
            code: 0,
            message: 'success',
            data: favorite
        });
    } catch (error) {
        if (error instanceof BusinessError) {
            throw error;
        }
        logger.logDatabaseError('getFavoriteDetail', error, { id: req.params.id });
        throw new BusinessError(ERROR_CODES.DATABASE_ERROR, '获取收藏详情失败');
    } finally {
        conn.release();
    }
}


async function updateFavorite(req, res) {
    const pool = req.app.locals.pool;
    const conn = await pool.getConnection();

    try {
        const { id } = req.params;
        const { openid, question, tags } = req.body;

        // 验证参数
        validateParams(req.body, {
            openid: { required: true, type: 'string' }
        });

        validateParams(req.params, {
            id: {
                required: true,
                validator: (val) => !isNaN(parseInt(val)),
                message: '无效的收藏ID'
            }
        });

        const favoriteId = parseInt(id);

        await conn.beginTransaction();

        try {
            // 1. 验证收藏所有权
            const [rows] = await conn.query(
                'SELECT id, openid FROM favorites WHERE id = ?',
                [favoriteId]
            );

            if (rows.length === 0) {
                throw new BusinessError(ERROR_CODES.NOT_FOUND, '收藏不存在');
            }

            if (rows[0].openid !== openid) {
                throw new BusinessError(ERROR_CODES.FORBIDDEN, '无权限修改此收藏');
            }

            // 2. 更新问题（如果提供）
            if (question !== undefined && question.trim()) {
                await conn.query(
                    'UPDATE favorites SET question = ?, updated_at = NOW() WHERE id = ?',
                    [question.trim(), favoriteId]
                );
            }

            // 3. 更新标签（如果提供）
            if (tags !== undefined && Array.isArray(tags)) {
                // 删除旧的标签关联
                const [oldTags] = await conn.query(
                    'SELECT tag_id FROM favorite_tags WHERE favorite_id = ?',
                    [favoriteId]
                );

                if (oldTags.length > 0) {
                    await conn.query(
                        'DELETE FROM favorite_tags WHERE favorite_id = ?',
                        [favoriteId]
                    );

                    // 减少旧标签的使用次数
                    for (const oldTag of oldTags) {
                        await conn.query(
                            'UPDATE tags SET use_count = GREATEST(use_count - 1, 0) WHERE id = ?',
                            [oldTag.tag_id]
                        );
                    }
                }

                // 添加新的标签关联
                for (const tagName of tags) {
                    if (tagName && tagName.trim()) {
                        const tagId = await getOrCreateTag(conn, openid, tagName.trim());

                        await conn.query(
                            'INSERT INTO favorite_tags (favorite_id, tag_id, created_at) VALUES (?, ?, NOW())',
                            [favoriteId, tagId]
                        );

                        await conn.query(
                            'UPDATE tags SET use_count = use_count + 1 WHERE id = ?',
                            [tagId]
                        );
                    }
                }
            }

            await conn.commit();

            // 4. 返回更新后的收藏信息
            const favorite = await getFavoriteById(conn, favoriteId, openid);

            res.json({
                code: 0,
                message: '更新成功',
                data: favorite
            });
        } catch (error) {
            await conn.rollback();
            throw error;
        }
    } catch (error) {
        if (error instanceof BusinessError) {
            throw error;
        }
        logger.logDatabaseError('updateFavorite', error, { id: req.params.id });
        throw new BusinessError(ERROR_CODES.DATABASE_ERROR, '更新收藏失败');
    } finally {
        conn.release();
    }
}


async function deleteFavorite(req, res) {
    const pool = req.app.locals.pool;
    const conn = await pool.getConnection();

    try {
        const { id } = req.params;
        const { openid } = req.body;

        // 验证参数
        validateParams(req.body, {
            openid: { required: true, type: 'string' }
        });

        validateParams(req.params, {
            id: {
                required: true,
                validator: (val) => !isNaN(parseInt(val)),
                message: '无效的收藏ID'
            }
        });

        const favoriteId = parseInt(id);

        await conn.beginTransaction();

        try {
            // 1. 验证收藏所有权
            const [rows] = await conn.query(
                'SELECT id, openid FROM favorites WHERE id = ?',
                [favoriteId]
            );

            if (rows.length === 0) {
                throw new BusinessError(ERROR_CODES.NOT_FOUND, '收藏不存在');
            }

            if (rows[0].openid !== openid) {
                throw new BusinessError(ERROR_CODES.FORBIDDEN, '无权限删除此收藏');
            }

            // 2. 获取关联的标签，减少使用次数
            const [tagRows] = await conn.query(
                'SELECT tag_id FROM favorite_tags WHERE favorite_id = ?',
                [favoriteId]
            );

            for (const tag of tagRows) {
                await conn.query(
                    'UPDATE tags SET use_count = GREATEST(use_count - 1, 0) WHERE id = ?',
                    [tag.tag_id]
                );
            }

            // 3. 删除标签关联（由于外键级联，这一步可能不需要，但为了明确性保留）
            await conn.query(
                'DELETE FROM favorite_tags WHERE favorite_id = ?',
                [favoriteId]
            );

            // 4. 删除收藏记录
            await conn.query(
                'DELETE FROM favorites WHERE id = ?',
                [favoriteId]
            );

            await conn.commit();

            res.json({
                code: 0,
                message: '删除成功'
            });
        } catch (error) {
            await conn.rollback();
            throw error;
        }
    } catch (error) {
        if (error instanceof BusinessError) {
            throw error;
        }
        logger.logDatabaseError('deleteFavorite', error, { id: req.params.id });
        throw new BusinessError(ERROR_CODES.DATABASE_ERROR, '删除收藏失败');
    } finally {
        conn.release();
    }
}

// ============ 辅助函数 ============


async function getOrCreateTag(conn, openid, tagName) {
    // 查找现有标签
    const [rows] = await conn.query(
        'SELECT id FROM tags WHERE openid = ? AND name = ?',
        [openid, tagName]
    );

    if (rows.length > 0) {
        return rows[0].id;
    }

    // 创建新标签
    const [result] = await conn.query(
        'INSERT INTO tags (openid, name, use_count, created_at) VALUES (?, ?, 0, NOW())',
        [openid, tagName]
    );

    return result.insertId;
}


async function getFavoriteById(conn, favoriteId, openid) {
    const [rows] = await conn.query(
        'SELECT * FROM favorites WHERE id = ? AND openid = ?',
        [favoriteId, openid]
    );

    if (rows.length === 0) {
        return null;
    }

    const favorite = rows[0];

    // 加载标签
    const [tagRows] = await conn.query(
        `SELECT t.id, t.name 
         FROM tags t
         INNER JOIN favorite_tags ft ON t.id = ft.tag_id
         WHERE ft.favorite_id = ?`,
        [favoriteId]
    );

    favorite.tags = tagRows;

    return favorite;
}


async function getTags(req, res) {
    const pool = req.app.locals.pool;
    const conn = await pool.getConnection();

    try {
        const { openid } = req.query;

        // 验证参数
        validateParams(req.query, {
            openid: { required: true, type: 'string' }
        });

        // 查询用户的所有标签，按使用次数降序排序
        const [tags] = await conn.query(
            `SELECT id, name, use_count, created_at 
             FROM tags 
             WHERE openid = ? 
             ORDER BY use_count DESC, name ASC`,
            [openid]
        );

        res.json({
            code: 0,
            message: 'success',
            data: tags
        });
    } catch (error) {
        if (error instanceof BusinessError) {
            throw error;
        }
        logger.logDatabaseError('getTags', error, { openid: req.query.openid });
        throw new BusinessError(ERROR_CODES.DATABASE_ERROR, '获取标签列表失败');
    } finally {
        conn.release();
    }
}


async function addTag(req, res) {
    const pool = req.app.locals.pool;
    const conn = await pool.getConnection();

    try {
        const { id } = req.params;
        const { openid, tagName } = req.body;

        // 验证参数
        validateParams(req.body, {
            openid: { required: true, type: 'string' },
            tagName: {
                required: true,
                type: 'string',
                minLength: 1,
                maxLength: 10,
                message: '标签名称长度必须在1-10个字符之间'
            }
        });

        validateParams(req.params, {
            id: {
                required: true,
                validator: (val) => !isNaN(parseInt(val)),
                message: '无效的收藏ID'
            }
        });

        const favoriteId = parseInt(id);
        const trimmedTagName = tagName.trim();

        await conn.beginTransaction();

        try {
            // 1. 验证收藏所有权
            const [rows] = await conn.query(
                'SELECT id, openid FROM favorites WHERE id = ?',
                [favoriteId]
            );

            if (rows.length === 0) {
                throw new BusinessError(ERROR_CODES.NOT_FOUND, '收藏不存在');
            }

            if (rows[0].openid !== openid) {
                throw new BusinessError(ERROR_CODES.FORBIDDEN, '无权限修改此收藏');
            }

            // 2. 获取或创建标签
            const tagId = await getOrCreateTag(conn, openid, trimmedTagName);

            // 3. 检查是否已经关联
            const [existingRelation] = await conn.query(
                'SELECT id FROM favorite_tags WHERE favorite_id = ? AND tag_id = ?',
                [favoriteId, tagId]
            );

            if (existingRelation.length > 0) {
                throw new BusinessError(ERROR_CODES.DUPLICATE, '该标签已存在');
            }

            // 4. 创建关联
            await conn.query(
                'INSERT INTO favorite_tags (favorite_id, tag_id, created_at) VALUES (?, ?, NOW())',
                [favoriteId, tagId]
            );

            // 5. 更新标签使用次数
            await conn.query(
                'UPDATE tags SET use_count = use_count + 1 WHERE id = ?',
                [tagId]
            );

            await conn.commit();

            // 6. 返回更新后的收藏信息
            const favorite = await getFavoriteById(conn, favoriteId, openid);

            res.json({
                code: 0,
                message: '添加标签成功',
                data: favorite
            });
        } catch (error) {
            await conn.rollback();
            throw error;
        }
    } catch (error) {
        if (error instanceof BusinessError) {
            throw error;
        }
        logger.logDatabaseError('addTag', error, { id: req.params.id });
        throw new BusinessError(ERROR_CODES.DATABASE_ERROR, '添加标签失败');
    } finally {
        conn.release();
    }
}


async function removeTag(req, res) {
    const pool = req.app.locals.pool;
    const conn = await pool.getConnection();

    try {
        const { id, tagId } = req.params;
        const { openid } = req.body;

        // 验证参数
        validateParams(req.body, {
            openid: { required: true, type: 'string' }
        });

        validateParams(req.params, {
            id: {
                required: true,
                validator: (val) => !isNaN(parseInt(val)),
                message: '无效的收藏ID'
            },
            tagId: {
                required: true,
                validator: (val) => !isNaN(parseInt(val)),
                message: '无效的标签ID'
            }
        });

        const favoriteId = parseInt(id);
        const tagIdNum = parseInt(tagId);

        await conn.beginTransaction();

        try {
            // 1. 验证收藏所有权
            const [rows] = await conn.query(
                'SELECT id, openid FROM favorites WHERE id = ?',
                [favoriteId]
            );

            if (rows.length === 0) {
                throw new BusinessError(ERROR_CODES.NOT_FOUND, '收藏不存在');
            }

            if (rows[0].openid !== openid) {
                throw new BusinessError(ERROR_CODES.FORBIDDEN, '无权限修改此收藏');
            }

            // 2. 验证标签关联是否存在
            const [relationRows] = await conn.query(
                'SELECT id FROM favorite_tags WHERE favorite_id = ? AND tag_id = ?',
                [favoriteId, tagIdNum]
            );

            if (relationRows.length === 0) {
                throw new BusinessError(ERROR_CODES.NOT_FOUND, '标签关联不存在');
            }

            // 3. 删除关联
            await conn.query(
                'DELETE FROM favorite_tags WHERE favorite_id = ? AND tag_id = ?',
                [favoriteId, tagIdNum]
            );

            // 4. 减少标签使用次数
            await conn.query(
                'UPDATE tags SET use_count = GREATEST(use_count - 1, 0) WHERE id = ?',
                [tagIdNum]
            );

            await conn.commit();

            // 5. 返回更新后的收藏信息
            const favorite = await getFavoriteById(conn, favoriteId, openid);

            res.json({
                code: 0,
                message: '移除标签成功',
                data: favorite
            });
        } catch (error) {
            await conn.rollback();
            throw error;
        }
    } catch (error) {
        if (error instanceof BusinessError) {
            throw error;
        }
        logger.logDatabaseError('removeTag', error, { id: req.params.id, tagId: req.params.tagId });
        throw new BusinessError(ERROR_CODES.DATABASE_ERROR, '移除标签失败');
    } finally {
        conn.release();
    }
}


async function generateAnswer(req, res) {
    let connectionClosed = false;

    try {
        const { question, openid } = req.body;

        // 验证必填参数
        validateParams(req.body, {
            openid: { required: true, type: 'string' },
            question: {
                required: true,
                type: 'string',
                minLength: 5,
                message: '问题长度至少为5个字符'
            }
        });

        // 设置 SSE 响应头
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // 禁用 Nginx 缓冲

        // 监听客户端断开连接
        req.on('close', () => {
            connectionClosed = true;
            logger.info('客户端断开连接', { openid, function: 'generateAnswer' });
        });

        // 监听连接错误
        req.on('error', (error) => {
            connectionClosed = true;
            logger.error('连接错误', { openid, event: 'connection_error', function: 'generateAnswer', error: error.message });
        });

        // 发送初始连接成功消息
        if (!connectionClosed) {
            res.write('event: connected\n');
            res.write('data: {"status":"connected"}\n\n');
        }

        // 构建消息上下文
        const deepseek = require('../services/deepseek');
        const messages = [
            {
                role: 'system',
                content: '你是一位专业的面试辅导专家，擅长回答各类技术面试问题。请提供详细、专业、有深度的答案，帮助求职者更好地理解和准备面试。'
            },
            {
                role: 'user',
                content: question
            }
        ];

        let fullAnswer = '';
        let chunkCount = 0;

        // 调用流式 API
        try {
            fullAnswer = await deepseek.chatStream(
                messages,
                (chunk) => {
                    // 检查连接是否已关闭
                    if (connectionClosed) {
                        logger.info('连接已关闭，停止发送数据', { openid, chunkCount, function: 'generateAnswer' });
                        return;
                    }

                    try {
                        // 发送数据块
                        chunkCount++;
                        res.write('event: chunk\n');
                        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
                    } catch (writeError) {
                        connectionClosed = true;
                        logger.error('写入数据块失败', {
                            openid,
                            event: 'write_error',
                            chunkCount,
                            function: 'generateAnswer',
                            error: writeError.message
                        });
                    }
                }
            );

            // 检查连接状态后再发送完成信号
            if (!connectionClosed) {
                // 发送完成信号
                res.write('event: done\n');
                res.write(`data: ${JSON.stringify({
                    content: fullAnswer,
                    status: 'completed',
                    chunkCount: chunkCount
                })}\n\n`);
                res.end();

                logger.info('答案生成成功', {
                    openid,
                    questionLength: question.length,
                    answerLength: fullAnswer.length,
                    chunkCount: chunkCount,
                    function: 'generateAnswer'
                });
            } else {
                logger.info('答案生成完成但连接已关闭', {
                    openid,
                    answerLength: fullAnswer.length,
                    function: 'generateAnswer'
                });
            }
        } catch (error) {
            // 检查连接状态
            if (!connectionClosed) {
                // 发送错误事件
                const errorMessage = error.message || 'AI生成答案失败';
                const errorCode = getErrorCode(error);

                res.write('event: error\n');
                res.write(`data: ${JSON.stringify({
                    error: errorMessage,
                    code: errorCode,
                    retryable: isRetryableStreamError(error)
                })}\n\n`);
                res.end();

                logger.error('生成答案失败', {
                    openid,
                    question: question.substring(0, 50),
                    errorCode: errorCode,
                    function: 'generateAnswer',
                    error: error.message
                });
            } else {
                logger.error('生成答案失败（连接已断开）', {
                    openid,
                    event: 'error_after_disconnect',
                    function: 'generateAnswer',
                    error: error.message
                });
            }
        }
    } catch (error) {
        // 参数验证错误或其他错误
        if (!res.headersSent) {
            if (error instanceof BusinessError) {
                res.status(400).json({
                    code: error.code,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    code: ERROR_CODES.INTERNAL_ERROR,
                    message: '服务器内部错误'
                });
            }
        } else if (!connectionClosed) {
            // 如果已经开始发送 SSE 且连接未关闭，发送错误事件
            try {
                res.write('event: error\n');
                res.write(`data: ${JSON.stringify({
                    error: error.message || '服务器错误',
                    code: 'SERVER_ERROR',
                    retryable: false
                })}\n\n`);
                res.end();
            } catch (writeError) {
                logger.error('写入最终错误响应失败', {
                    event: 'final_error_write_failed',
                    function: 'generateAnswer',
                    error: writeError.message
                });
            }
        }
    }
}


function getErrorCode(error) {
    const message = error.message || '';

    if (message.includes('超时') || message.includes('timeout')) {
        return 'TIMEOUT_ERROR';
    } else if (message.includes('网络') || message.includes('network')) {
        return 'NETWORK_ERROR';
    } else if (message.includes('密钥') || message.includes('unauthorized')) {
        return 'AUTH_ERROR';
    } else if (message.includes('频率') || message.includes('rate limit')) {
        return 'RATE_LIMIT_ERROR';
    } else if (message.includes('服务异常') || message.includes('server error')) {
        return 'API_SERVER_ERROR';
    } else {
        return 'GENERATION_ERROR';
    }
}


function isRetryableStreamError(error) {
    const errorCode = getErrorCode(error);

    // 超时、网络错误、服务器错误可重试
    return ['TIMEOUT_ERROR', 'NETWORK_ERROR', 'API_SERVER_ERROR', 'RATE_LIMIT_ERROR'].includes(errorCode);
}


async function checkMemberStatus(conn, openid) {
    try {
        const [rows] = await conn.query(
            'SELECT openid, expire_date FROM members WHERE openid = ?',
            [openid]
        );

        if (rows.length === 0) {
            // 用户不存在，返回非会员状态
            return {
                exists: false,
                isValid: false,
                expireDate: null
            };
        }

        const member = rows[0];
        const now = new Date();
        const expireDate = member.expire_date ? new Date(member.expire_date) : null;
        const isValid = expireDate && expireDate > now;

        return {
            exists: true,
            isValid: isValid,
            expireDate: expireDate
        };
    } catch (error) {
        logger.logDatabaseError('checkMemberStatus', error, { openid });
        throw new BusinessError(ERROR_CODES.DATABASE_ERROR, '查询会员状态失败');
    }
}


async function countUserFavorites(conn, openid) {
    try {
        const [rows] = await conn.query(
            'SELECT COUNT(*) as count FROM favorites WHERE openid = ?',
            [openid]
        );

        return rows[0].count;
    } catch (error) {
        logger.logDatabaseError('countUserFavorites', error, { openid });
        throw new BusinessError(ERROR_CODES.DATABASE_ERROR, '统计收藏数量失败');
    }
}


async function checkFavoriteQuota(conn, openid) {
    const FREE_USER_LIMIT = 10; // 免费用户限制10条

    try {
        // 1. 检查会员状态
        const memberStatus = await checkMemberStatus(conn, openid);

        // 2. 如果是有效会员，无限制
        if (memberStatus.isValid) {
            return {
                allowed: true,
                isValid: true,
                current: null,
                limit: null,
                message: '会员用户，无限制'
            };
        }

        // 3. 非会员用户，检查收藏数量
        const currentCount = await countUserFavorites(conn, openid);

        if (currentCount >= FREE_USER_LIMIT) {
            return {
                allowed: false,
                isValid: false,
                current: currentCount,
                limit: FREE_USER_LIMIT,
                message: `免费用户最多收藏${FREE_USER_LIMIT}条，请升级会员以解除限制`
            };
        }

        // 4. 未达到限制，允许创建
        return {
            allowed: true,
            isValid: false,
            current: currentCount,
            limit: FREE_USER_LIMIT,
            message: `免费用户已收藏${currentCount}/${FREE_USER_LIMIT}条`
        };
    } catch (error) {
        // 如果检查失败，为了不影响用户体验，允许创建（但记录错误）
        logger.error('配额检查失败', { openid, function: 'checkFavoriteQuota', error: error.message });
        return {
            allowed: true,
            isValid: false,
            current: null,
            limit: null,
            message: '配额检查失败，允许创建'
        };
    }
}


async function getStats(req, res) {
    const pool = req.app.locals.pool;
    const conn = await pool.getConnection();

    try {
        const { openid } = req.query;

        // 验证参数
        validateParams(req.query, {
            openid: { required: true, type: 'string' }
        });

        // 1. 获取会员状态
        const memberStatus = await checkMemberStatus(conn, openid);

        // 2. 尝试从摘要表获取统计信息（性能优化）
        const [summaryRows] = await conn.query(
            'SELECT * FROM favorite_summary WHERE openid = ?',
            [openid]
        );

        let totalCount, sourceStats, tagCount;

        if (summaryRows.length > 0) {
            // 使用摘要表数据（快速）
            const summary = summaryRows[0];
            totalCount = summary.total_count;
            sourceStats = [
                { source_type: 'knowledge', count: summary.knowledge_count },
                { source_type: 'resume', count: summary.resume_count },
                { source_type: 'custom', count: summary.custom_count }
            ].filter(s => s.count > 0);
            tagCount = [{ count: summary.tag_count }];
        } else {
            // 摘要表不存在或数据未初始化，使用实时查询
            totalCount = await countUserFavorites(conn, openid);

            // 按来源类型统计
            const [sourceStatsResult] = await conn.query(
                `SELECT 
                    source_type,
                    COUNT(*) as count
                 FROM favorites
                 WHERE openid = ?
                 GROUP BY source_type`,
                [openid]
            );
            sourceStats = sourceStatsResult;

            // 统计标签数量
            const [tagCountResult] = await conn.query(
                'SELECT COUNT(*) as count FROM tags WHERE openid = ?',
                [openid]
            );
            tagCount = tagCountResult;
        }

        // 3. 计算配额信息
        const FREE_USER_LIMIT = 10;
        const quotaInfo = {
            isValid: memberStatus.isValid,
            current: totalCount,
            limit: memberStatus.isValid ? null : FREE_USER_LIMIT,
            remaining: memberStatus.isValid ? null : Math.max(0, FREE_USER_LIMIT - totalCount),
            unlimited: memberStatus.isValid
        };

        res.json({
            code: 0,
            message: 'success',
            data: {
                member: {
                    isValid: memberStatus.isValid,
                    expireDate: memberStatus.expireDate
                },
                favorites: {
                    total: totalCount,
                    bySource: sourceStats.reduce((acc, item) => {
                        acc[item.source_type] = item.count;
                        return acc;
                    }, {})
                },
                tags: {
                    total: tagCount[0].count
                },
                quota: quotaInfo
            }
        });
    } catch (error) {
        if (error instanceof BusinessError) {
            throw error;
        }
        logger.logDatabaseError('getStats', error, { openid: req.query.openid });
        throw new BusinessError(ERROR_CODES.DATABASE_ERROR, '获取统计信息失败');
    } finally {
        conn.release();
    }
}

// ============ 路由定义 ============

/**
 * 创建收藏
 * POST /api/favorites
 */
router.post('/', asyncHandler(createFavorite));

/**
 * 获取收藏列表（支持分页和标签筛选）
 * GET /api/favorites
 */
router.get('/', asyncHandler(getFavorites));

/**
 * 获取标签列表（带问题数量）
 * GET /api/favorites/tags
 */
router.get('/tags', asyncHandler(getTags));

/**
 * 获取收藏统计信息
 * GET /api/favorites/stats
 */
router.get('/stats', asyncHandler(getStats));

/**
 * 获取收藏详情
 * GET /api/favorites/:id
 */
router.get('/:id', asyncHandler(getFavoriteDetail));

/**
 * 更新收藏
 * PUT /api/favorites/:id
 */
router.put('/:id', asyncHandler(updateFavorite));

/**
 * 删除收藏
 * DELETE /api/favorites/:id
 */
router.delete('/:id', asyncHandler(deleteFavorite));

/**
 * 为收藏添加标签
 * POST /api/favorites/:id/tags
 */
router.post('/:id/tags', asyncHandler(addTag));

/**
 * 移除收藏的标签
 * DELETE /api/favorites/:id/tags/:tagId
 */
router.delete('/:id/tags/:tagId', asyncHandler(removeTag));

/**
 * 生成AI答案（流式输出）
 * POST /api/favorites/generate-answer
 */
router.post('/generate-answer', asyncHandler(generateAnswer));

module.exports = router;

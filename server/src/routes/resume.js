/**
 * 简历管理路由
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { upload, handleUploadError } = require('../middleware/upload');
const { parseFile } = require('../services/fileParser');
const { chat, buildResumeContext, buildDocumentContext } = require('../services/deepseek');
const {
    ERROR_CODES,
    BusinessError,
    asyncHandler,
    validateParams
} = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * 上传简历
 * POST /api/resume/upload
 * Content-Type: multipart/form-data
 * Body: { file, openid }
 */
router.post('/upload', upload.single('file'), handleUploadError, asyncHandler(async (req, res) => {
    const pool = req.app.locals.pool;
    const conn = await pool.getConnection();

    try {
        const { openid, originalName } = req.body;
        const file = req.file;

        // 验证参数
        if (!openid) {
            // 删除已上传的文件
            if (file) {
                await fs.unlink(file.path).catch(err => console.error('删除文件失败:', err));
            }
            throw new BusinessError(ERROR_CODES.BAD_REQUEST, '缺少OpenID参数');
        }

        if (!file) {
            throw new BusinessError(ERROR_CODES.BAD_REQUEST, '未上传文件');
        }

        // 使用传递的原始文件名，如果没有则使用multer解析的文件名
        const displayFilename = originalName || file.originalname;

        // 1. 验证用户会员状态
        const [memberRows] = await conn.query(
            'SELECT expire_date FROM members WHERE openid = ?',
            [openid]
        );

        if (memberRows.length === 0 || !memberRows[0].expire_date) {
            // 删除已上传的文件
            await fs.unlink(file.path).catch(err => console.error('删除文件失败:', err));
            throw new BusinessError(ERROR_CODES.FORBIDDEN, '请先开通会员');
        }

        const expireDate = new Date(memberRows[0].expire_date);
        const now = new Date();

        if (expireDate <= now) {
            // 删除已上传的文件
            await fs.unlink(file.path).catch(err => console.error('删除文件失败:', err));
            throw new BusinessError(ERROR_CODES.FORBIDDEN, '会员已过期，请续费');
        }

        // 2. 检查简历数量限制（最多3个）
        const [countRows] = await conn.query(
            'SELECT COUNT(*) as count FROM resumes WHERE openid = ?',
            [openid]
        );

        if (countRows[0].count >= 3) {
            // 删除已上传的文件
            await fs.unlink(file.path).catch(err => console.error('删除文件失败:', err));
            throw new BusinessError(ERROR_CODES.LIMIT_EXCEEDED, '最多只能上传3个简历，请先删除旧简历');
        }

        // 3. 解析文件内容
        let parsedText;
        try {
            parsedText = await parseFile(file.path, file.originalname);
        } catch (parseError) {
            // 记录文件解析错误
            logger.logFileError('parseFile', file.path, parseError, {
                openid,
                filename: file.originalname,
                fileSize: file.size
            });

            // 删除已上传的文件
            await fs.unlink(file.path).catch(err => {
                logger.logFileError('unlinkFile', file.path, err);
            });

            throw new BusinessError(
                ERROR_CODES.FILE_PARSE_ERROR,
                '文件解析失败，请确认文件格式正确',
                process.env.NODE_ENV === 'development' ? parseError.message : null
            );
        }

        // 4. 存储简历信息到数据库
        await conn.beginTransaction();

        try {
            const relativePath = path.relative(
                path.join(__dirname, '../../'),
                file.path
            );

            const [result] = await conn.query(
                `INSERT INTO resumes (openid, filename, file_path, parsed_text, file_size, upload_time) 
                 VALUES (?, ?, ?, ?, ?, NOW())`,
                [openid, displayFilename, relativePath, parsedText, file.size]
            );

            await conn.commit();

            // 5. 返回简历信息
            res.json({
                code: 0,
                message: '上传成功',
                data: {
                    id: result.insertId,
                    filename: displayFilename,
                    uploadTime: new Date().toISOString(),
                    parsedText: parsedText
                }
            });
        } catch (dbError) {
            await conn.rollback();

            // 记录数据库错误
            logger.logDatabaseError('insertResume', dbError, {
                openid,
                filename: file.originalname
            });

            // 删除已上传的文件
            await fs.unlink(file.path).catch(err => {
                logger.logFileError('unlinkFile', file.path, err);
            });

            throw new BusinessError(
                ERROR_CODES.DATABASE_ERROR,
                '数据存储失败',
                process.env.NODE_ENV === 'development' ? dbError.message : null
            );
        }
    } finally {
        conn.release();
    }
}));

/**
 * 获取简历列表
 * GET /api/resume/list
 * Query: { openid }
 */
router.get('/list', asyncHandler(async (req, res) => {
    const pool = req.app.locals.pool;
    const conn = await pool.getConnection();

    try {
        const { openid } = req.query;

        // 验证参数
        validateParams(req.query, {
            openid: { required: true, type: 'string' }
        });

        // 查询用户的所有简历（不包含parsed_text）
        const [rows] = await conn.query(
            `SELECT id, filename, upload_time, file_size 
             FROM resumes 
             WHERE openid = ? 
             ORDER BY upload_time DESC`,
            [openid]
        );

        // 格式化返回数据
        const resumes = rows.map(row => ({
            id: row.id,
            filename: row.filename,
            uploadTime: row.upload_time,
            fileSize: row.file_size
        }));

        res.json({
            code: 0,
            message: 'success',
            data: {
                resumes: resumes,
                total: resumes.length,
                limit: 3
            }
        });
    } finally {
        conn.release();
    }
}));

/**
 * 获取简历详情
 * GET /api/resume/:id
 * Query: { openid }
 */
router.get('/:id', asyncHandler(async (req, res) => {
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
                message: '无效的简历ID'
            }
        });

        // 查询简历详情
        const [rows] = await conn.query(
            `SELECT id, openid, filename, file_path, parsed_text, file_size, upload_time 
             FROM resumes 
             WHERE id = ?`,
            [parseInt(id)]
        );

        // 检查简历是否存在
        if (rows.length === 0) {
            throw new BusinessError(ERROR_CODES.NOT_FOUND, '简历不存在');
        }

        const resume = rows[0];

        // 验证简历所有权（OpenID匹配）
        if (resume.openid !== openid) {
            throw new BusinessError(ERROR_CODES.FORBIDDEN, '无权限访问此简历');
        }

        // 返回完整简历信息
        res.json({
            code: 0,
            message: 'success',
            data: {
                id: resume.id,
                filename: resume.filename,
                filePath: resume.file_path,
                parsedText: resume.parsed_text,
                fileSize: resume.file_size,
                uploadTime: resume.upload_time
            }
        });
    } finally {
        conn.release();
    }
}));

/**
 * 删除简历
 * DELETE /api/resume/:id
 * Body: { openid }
 */
router.delete('/:id', asyncHandler(async (req, res) => {
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
                message: '无效的简历ID'
            }
        });

        // 开始事务，确保删除操作的原子性
        await conn.beginTransaction();

        try {
            // 查询简历信息
            const [rows] = await conn.query(
                `SELECT id, openid, file_path 
                 FROM resumes 
                 WHERE id = ?`,
                [parseInt(id)]
            );

            // 检查简历是否存在
            if (rows.length === 0) {
                await conn.rollback();
                throw new BusinessError(ERROR_CODES.NOT_FOUND, '简历不存在');
            }

            const resume = rows[0];

            // 验证简历所有权
            if (resume.openid !== openid) {
                await conn.rollback();
                throw new BusinessError(ERROR_CODES.FORBIDDEN, '无权限删除此简历');
            }

            // 从数据库删除记录
            await conn.query(
                'DELETE FROM resumes WHERE id = ?',
                [parseInt(id)]
            );

            // 从文件系统删除文件
            const filePath = path.join(__dirname, '../../', resume.file_path);
            try {
                await fs.unlink(filePath);
            } catch (fileError) {
                console.error('删除文件失败:', fileError);
                // 即使文件删除失败，也继续提交事务
                // 因为数据库记录已删除，文件可以手动清理
            }

            // 提交事务
            await conn.commit();

            res.json({
                code: 0,
                message: '删除成功'
            });
        } catch (error) {
            // 回滚事务
            await conn.rollback();
            throw error;
        }
    } finally {
        conn.release();
    }
}));

/**
 * 基于文档的AI问答（支持简历及其他文档类型）
 * POST /api/resume/chat
 * Body: { openid, resumeId, question, conversationHistory, documentType }
 */
router.post('/chat', asyncHandler(async (req, res) => {
    const pool = req.app.locals.pool;
    const conn = await pool.getConnection();

    try {
        const { openid, resumeId, question, conversationHistory, documentType } = req.body;

        // 验证参数
        validateParams(req.body, {
            openid: { required: true, type: 'string' },
            resumeId: {
                required: true,
                validator: (val) => !isNaN(parseInt(val)),
                message: '无效的简历ID'
            },
            question: {
                required: true,
                type: 'string',
                minLength: 1,
                message: '问题不能为空'
            }
        });

        // 1. 验证用户会员状态
        const [memberRows] = await conn.query(
            'SELECT expire_date FROM members WHERE openid = ?',
            [openid]
        );

        if (memberRows.length === 0 || !memberRows[0].expire_date) {
            throw new BusinessError(ERROR_CODES.FORBIDDEN, '请先开通会员');
        }

        const expireDate = new Date(memberRows[0].expire_date);
        const now = new Date();

        if (expireDate <= now) {
            throw new BusinessError(ERROR_CODES.FORBIDDEN, '会员已过期，请续费');
        }

        // 2. 从数据库获取简历文本
        const [resumeRows] = await conn.query(
            `SELECT id, openid, parsed_text 
             FROM resumes 
             WHERE id = ?`,
            [parseInt(resumeId)]
        );

        // 检查简历是否存在
        if (resumeRows.length === 0) {
            throw new BusinessError(ERROR_CODES.NOT_FOUND, '简历不存在');
        }

        const resume = resumeRows[0];

        // 验证简历所有权
        if (resume.openid !== openid) {
            throw new BusinessError(ERROR_CODES.FORBIDDEN, '无权限访问此简历');
        }

        // 检查简历文本是否存在
        if (!resume.parsed_text || resume.parsed_text.trim() === '') {
            throw new BusinessError(ERROR_CODES.FILE_PARSE_ERROR, '简历内容为空，无法进行问答');
        }

        // 3. 构建AI对话上下文
        // 支持指定文档类型，如果未指定则智能判断
        const messages = buildDocumentContext(
            resume.parsed_text,
            question.trim(),
            conversationHistory || [],
            documentType || null  // 可选：'resume', 'job', 'report' 或 null（自动判断）
        );

        // 4. 调用DeepSeek API
        let answer;
        try {
            answer = await chat(messages);
        } catch (aiError) {
            // 记录AI服务错误
            logger.logAIServiceError('DeepSeek', aiError, {
                openid,
                resumeId: parseInt(resumeId),
                question: question.substring(0, 100) // 只记录前100个字符
            });

            throw new BusinessError(
                ERROR_CODES.AI_SERVICE_ERROR,
                'AI服务异常，请稍后重试',
                process.env.NODE_ENV === 'development' ? aiError.message : null
            );
        }

        // 5. 返回AI回答
        res.json({
            code: 0,
            message: 'success',
            data: {
                answer: answer,
                timestamp: Date.now()
            }
        });
    } finally {
        conn.release();
    }
}));

module.exports = router;

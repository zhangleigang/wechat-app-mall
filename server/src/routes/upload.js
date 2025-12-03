/**
 * 文件上传路由
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../static/avatars');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer 存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名：时间戳 + 随机字符串 + 扩展名
        const ext = path.extname(file.originalname);
        const hash = crypto.randomBytes(8).toString('hex');
        const filename = `avatar_${Date.now()}_${hash}${ext}`;
        cb(null, filename);
    }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
    // 只允许图片
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('只支持上传图片文件（jpg, png, gif, webp）'), false);
    }
};

// 配置 multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 限制 5MB
    }
});

/**
 * 上传头像
 * POST /api/upload/avatar
 * Headers: Authorization: Bearer {token}
 * Body: FormData with 'avatar' field
 */
router.post('/avatar', upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.json({
                code: -1,
                msg: '没有上传文件'
            });
        }

        // 构建访问URL
        const avatarUrl = `/static/avatars/${req.file.filename}`;

        res.json({
            code: 0,
            msg: '上传成功',
            data: {
                url: avatarUrl,
                filename: req.file.filename,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error('上传头像失败:', error);
        res.json({
            code: -1,
            msg: error.message || '上传失败'
        });
    }
});

/**
 * 删除头像（可选）
 * DELETE /api/upload/avatar/:filename
 * Headers: Authorization: Bearer {token}
 */
router.delete('/avatar/:filename', async (req, res) => {
    try {
        const { filename } = req.params;

        // 安全检查：只允许删除 avatar_ 开头的文件
        if (!filename.startsWith('avatar_')) {
            return res.json({
                code: -1,
                msg: '无效的文件名'
            });
        }

        const filePath = path.join(uploadDir, filename);

        // 检查文件是否存在
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({
                code: 0,
                msg: '删除成功'
            });
        } else {
            res.json({
                code: -1,
                msg: '文件不存在'
            });
        }
    } catch (error) {
        console.error('删除头像失败:', error);
        res.json({
            code: -1,
            msg: error.message || '删除失败'
        });
    }
});

module.exports = router;

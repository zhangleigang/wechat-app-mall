const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads/resumes');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置存储策略
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // 使用 openid_timestamp_原始文件名 格式
        const openid = req.body.openid || 'unknown';
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext);
        const filename = `${openid}_${timestamp}_${basename}${ext}`;
        cb(null, filename);
    }
});

// 文件过滤器 - 验证文件类型
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.md', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件格式，请上传 PDF、Word、Markdown 或图片格式'), false);
    }
};

// 创建 multer 实例
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB 限制
    }
});

// 错误处理中间件
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                code: 1003,
                message: '文件过大，请上传小于10MB的文件'
            });
        }
        return res.status(400).json({
            code: 1003,
            message: '文件上传失败: ' + err.message
        });
    } else if (err) {
        return res.status(400).json({
            code: 1003,
            message: err.message
        });
    }
    next();
};

module.exports = {
    upload,
    handleUploadError
};

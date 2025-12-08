/**
 * 日志记录工具
 * 记录错误、警告和信息日志到文件
 */

const fs = require('fs');
const path = require('path');

// 日志目录
const LOG_DIR = path.join(__dirname, '../../logs');

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * 日志级别
 */
const LOG_LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

/**
 * 格式化日志消息
 */
function formatLogMessage(level, message, metadata = {}) {
    // 使用北京时间（UTC+8）
    const now = new Date();
    const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    const timestamp = beijingTime.toISOString().replace('T', ' ').replace('Z', '');

    const logEntry = {
        timestamp,
        level,
        message,
        ...metadata
    };

    return JSON.stringify(logEntry);
}

/**
 * 写入日志到文件
 */
function writeLog(level, message, metadata = {}) {
    try {
        const logMessage = formatLogMessage(level, message, metadata);
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const logFile = path.join(LOG_DIR, `${date}.log`);

        // 追加日志到文件
        fs.appendFileSync(logFile, logMessage + '\n', 'utf8');

        // 同时输出到控制台（开发环境）
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${level}] ${message}`, metadata);
        }
    } catch (error) {
        // 日志写入失败时输出到控制台
        console.error('日志写入失败:', error);
        console.error('原始日志:', level, message, metadata);
    }
}

/**
 * 记录错误日志
 */
function error(message, metadata = {}) {
    writeLog(LOG_LEVELS.ERROR, message, metadata);
}

/**
 * 记录警告日志
 */
function warn(message, metadata = {}) {
    writeLog(LOG_LEVELS.WARN, message, metadata);
}

/**
 * 记录信息日志
 */
function info(message, metadata = {}) {
    writeLog(LOG_LEVELS.INFO, message, metadata);
}

/**
 * 记录调试日志
 */
function debug(message, metadata = {}) {
    if (process.env.NODE_ENV === 'development') {
        writeLog(LOG_LEVELS.DEBUG, message, metadata);
    }
}

/**
 * 记录HTTP请求错误
 */
function logRequestError(req, err) {
    const metadata = {
        method: req.method,
        url: req.url,
        path: req.path,
        query: req.query,
        body: sanitizeBody(req.body),
        params: req.params,
        headers: sanitizeHeaders(req.headers),
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        error: {
            name: err.name,
            message: err.message,
            code: err.code,
            stack: err.stack
        }
    };

    // 添加用户信息（如果存在）
    if (req.user) {
        metadata.userId = req.user.id || req.user.openid;
    }

    error('HTTP请求错误', metadata);
}

/**
 * 记录数据库错误
 */
function logDatabaseError(operation, err, context = {}) {
    const metadata = {
        operation,
        error: {
            name: err.name,
            message: err.message,
            code: err.code,
            errno: err.errno,
            sqlState: err.sqlState,
            sqlMessage: err.sqlMessage
        },
        ...context
    };

    error('数据库错误', metadata);
}

/**
 * 记录文件操作错误
 */
function logFileError(operation, filePath, err, context = {}) {
    const metadata = {
        operation,
        filePath,
        error: {
            name: err.name,
            message: err.message,
            code: err.code
        },
        ...context
    };

    error('文件操作错误', metadata);
}

/**
 * 记录AI服务错误
 */
function logAIServiceError(service, err, context = {}) {
    const metadata = {
        service,
        error: {
            name: err.name,
            message: err.message,
            code: err.code,
            response: err.response ? {
                status: err.response.status,
                statusText: err.response.statusText,
                data: err.response.data
            } : null
        },
        ...context
    };

    error('AI服务错误', metadata);
}

/**
 * 清理敏感信息（请求体）
 */
function sanitizeBody(body) {
    if (!body || typeof body !== 'object') {
        return body;
    }

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];

    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '***';
        }
    }

    return sanitized;
}

/**
 * 清理敏感信息（请求头）
 */
function sanitizeHeaders(headers) {
    if (!headers || typeof headers !== 'object') {
        return headers;
    }

    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

    for (const header of sensitiveHeaders) {
        if (sanitized[header]) {
            sanitized[header] = '***';
        }
    }

    return sanitized;
}

/**
 * 清理旧日志文件（保留最近30天）
 */
function cleanOldLogs(daysToKeep = 30) {
    try {
        const files = fs.readdirSync(LOG_DIR);
        const now = Date.now();
        const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

        for (const file of files) {
            if (!file.endsWith('.log')) continue;

            const filePath = path.join(LOG_DIR, file);
            const stats = fs.statSync(filePath);
            const age = now - stats.mtime.getTime();

            if (age > maxAge) {
                fs.unlinkSync(filePath);
                console.log(`已删除旧日志文件: ${file}`);
            }
        }
    } catch (error) {
        console.error('清理旧日志失败:', error);
    }
}

// 定期清理旧日志（每天执行一次）
if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
        cleanOldLogs(30);
    }, 24 * 60 * 60 * 1000);
}

module.exports = {
    LOG_LEVELS,
    error,
    warn,
    info,
    debug,
    logRequestError,
    logDatabaseError,
    logFileError,
    logAIServiceError,
    cleanOldLogs
};

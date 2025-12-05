/**
 * 统一错误处理中间件
 */

const logger = require('../utils/logger');

/**
 * 错误代码定义
 */
const ERROR_CODES = {
    // 成功
    SUCCESS: 0,

    // 客户端错误 (400-499)
    BAD_REQUEST: -1,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,

    // 业务错误 (1000-1999)
    FILE_PARSE_ERROR: 1001,      // 文件解析失败
    DATABASE_ERROR: 1002,         // 数据库错误
    FILE_STORAGE_ERROR: 1003,     // 文件存储失败
    AI_SERVICE_ERROR: 1004,       // AI服务异常
    LIMIT_EXCEEDED: 1005,         // 超出限制

    // 服务器错误 (500-599)
    INTERNAL_ERROR: 500
};

/**
 * 错误消息映射
 */
const ERROR_MESSAGES = {
    [ERROR_CODES.BAD_REQUEST]: '请求参数错误',
    [ERROR_CODES.UNAUTHORIZED]: '未授权访问',
    [ERROR_CODES.FORBIDDEN]: '无权限访问',
    [ERROR_CODES.NOT_FOUND]: '资源不存在',
    [ERROR_CODES.FILE_PARSE_ERROR]: '文件解析失败',
    [ERROR_CODES.DATABASE_ERROR]: '数据存储失败',
    [ERROR_CODES.FILE_STORAGE_ERROR]: '文件保存失败',
    [ERROR_CODES.AI_SERVICE_ERROR]: 'AI服务异常',
    [ERROR_CODES.LIMIT_EXCEEDED]: '超出限制',
    [ERROR_CODES.INTERNAL_ERROR]: '服务器内部错误'
};

/**
 * 自定义业务错误类
 */
class BusinessError extends Error {
    constructor(code, message, details = null) {
        super(message);
        this.name = 'BusinessError';
        this.code = code;
        this.details = details;
    }
}

/**
 * 创建标准错误响应
 */
function createErrorResponse(code, message, details = null) {
    const response = {
        code: code,
        message: message || ERROR_MESSAGES[code] || '未知错误'
    };

    if (details) {
        response.details = details;
    }

    return response;
}

/**
 * 统一错误处理中间件
 */
function errorHandler(err, req, res, next) {
    // 记录错误日志到文件
    logger.logRequestError(req, err);

    // 业务错误
    if (err instanceof BusinessError) {
        return res.status(getHttpStatus(err.code)).json(
            createErrorResponse(err.code, err.message, err.details)
        );
    }

    // 数据库错误
    if (err.code && err.code.startsWith('ER_')) {
        return res.status(500).json(
            createErrorResponse(
                ERROR_CODES.DATABASE_ERROR,
                '数据库操作失败',
                process.env.NODE_ENV === 'development' ? err.message : null
            )
        );
    }

    // 文件系统错误
    if (err.code && (err.code === 'ENOENT' || err.code === 'EACCES')) {
        return res.status(500).json(
            createErrorResponse(
                ERROR_CODES.FILE_STORAGE_ERROR,
                '文件操作失败',
                process.env.NODE_ENV === 'development' ? err.message : null
            )
        );
    }

    // 网络请求错误（如DeepSeek API）
    if (err.code && (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT')) {
        return res.status(500).json(
            createErrorResponse(
                ERROR_CODES.AI_SERVICE_ERROR,
                'AI服务连接失败',
                process.env.NODE_ENV === 'development' ? err.message : null
            )
        );
    }

    // 默认服务器错误
    return res.status(500).json(
        createErrorResponse(
            ERROR_CODES.INTERNAL_ERROR,
            '服务器内部错误',
            process.env.NODE_ENV === 'development' ? err.message : null
        )
    );
}

/**
 * 根据错误代码获取HTTP状态码
 */
function getHttpStatus(errorCode) {
    if (errorCode >= 400 && errorCode < 500) {
        return errorCode;
    }
    if (errorCode >= 1000 && errorCode < 2000) {
        return 400; // 业务错误返回400
    }
    return 500;
}

/**
 * 异步路由处理器包装器
 * 自动捕获异步错误并传递给错误处理中间件
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * 验证请求参数
 */
function validateParams(params, rules) {
    const errors = [];

    for (const [field, rule] of Object.entries(rules)) {
        const value = params[field];

        // 必填验证
        if (rule.required && (value === undefined || value === null || value === '')) {
            errors.push(`${field}不能为空`);
            continue;
        }

        // 如果字段不存在且非必填，跳过后续验证
        if (value === undefined || value === null) {
            continue;
        }

        // 类型验证
        if (rule.type) {
            const actualType = typeof value;
            if (actualType !== rule.type) {
                errors.push(`${field}类型错误，期望${rule.type}，实际${actualType}`);
            }
        }

        // 最小值验证
        if (rule.min !== undefined && value < rule.min) {
            errors.push(`${field}不能小于${rule.min}`);
        }

        // 最大值验证
        if (rule.max !== undefined && value > rule.max) {
            errors.push(`${field}不能大于${rule.max}`);
        }

        // 最小长度验证
        if (rule.minLength !== undefined && value.length < rule.minLength) {
            errors.push(`${field}长度不能小于${rule.minLength}`);
        }

        // 最大长度验证
        if (rule.maxLength !== undefined && value.length > rule.maxLength) {
            errors.push(`${field}长度不能大于${rule.maxLength}`);
        }

        // 正则验证
        if (rule.pattern && !rule.pattern.test(value)) {
            errors.push(`${field}格式不正确`);
        }

        // 自定义验证
        if (rule.validator && !rule.validator(value)) {
            errors.push(rule.message || `${field}验证失败`);
        }
    }

    if (errors.length > 0) {
        throw new BusinessError(ERROR_CODES.BAD_REQUEST, errors.join('; '));
    }
}

module.exports = {
    ERROR_CODES,
    ERROR_MESSAGES,
    BusinessError,
    createErrorResponse,
    errorHandler,
    asyncHandler,
    validateParams
};

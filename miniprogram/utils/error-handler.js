/**
 * 统一错误处理工具
 * 提供友好的错误提示和重试选项
 */

/**
 * 错误类型映射
 */
const ERROR_MESSAGES = {
    // 网络错误
    'NETWORK_ERROR': '网络连接失败，请检查网络设置',
    'TIMEOUT': '请求超时，请稍后重试',
    'REQUEST_FAILED': '请求失败，请稍后重试',

    // 认证错误
    'UNAUTHORIZED': '请先登录',
    'TOKEN_EXPIRED': '登录已过期，请重新登录',

    // 业务错误
    'QUOTA_EXCEEDED': '已达到收藏上限',
    'DUPLICATE_FAVORITE': '该问题已收藏',
    'NOT_FOUND': '内容不存在',
    'VALIDATION_ERROR': '输入内容不符合要求',

    // 服务器错误
    'SERVER_ERROR': '服务器错误，请稍后重试',
    'SERVICE_UNAVAILABLE': '服务暂时不可用，请稍后重试',

    // 默认错误
    'UNKNOWN_ERROR': '操作失败，请重试'
};

/**
 * 可重试的错误类型
 */
const RETRYABLE_ERRORS = [
    'NETWORK_ERROR',
    'TIMEOUT',
    'REQUEST_FAILED',
    'SERVER_ERROR',
    'SERVICE_UNAVAILABLE'
];

/**
 * 显示错误提示
 * @param {Error|string} error - 错误对象或错误码
 * @param {Object} options - 配置选项
 * @param {Function} options.onRetry - 重试回调函数
 * @param {boolean} options.showRetry - 是否显示重试按钮
 * @param {string} options.customMessage - 自定义错误消息
 */
function showError(error, options = {}) {
    const {
        onRetry,
        showRetry = true,
        customMessage
    } = options;

    // 解析错误信息
    let errorCode = 'UNKNOWN_ERROR';
    let errorMessage = customMessage;

    if (typeof error === 'string') {
        errorCode = error;
    } else if (error && error.code) {
        errorCode = error.code;
    } else if (error && error.message) {
        errorMessage = errorMessage || error.message;
    }

    // 获取友好的错误消息
    if (!errorMessage) {
        errorMessage = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES['UNKNOWN_ERROR'];
    }

    // 判断是否可重试
    const isRetryable = RETRYABLE_ERRORS.includes(errorCode);
    const shouldShowRetry = showRetry && isRetryable && typeof onRetry === 'function';

    // 显示错误提示
    if (shouldShowRetry) {
        // 显示带重试按钮的模态框
        wx.showModal({
            title: '操作失败',
            content: errorMessage,
            confirmText: '重试',
            cancelText: '取消',
            confirmColor: '#667eea',
            success: (res) => {
                if (res.confirm) {
                    // 用户点击重试
                    onRetry();
                }
            }
        });
    } else {
        // 显示简单的Toast提示
        wx.showToast({
            title: errorMessage,
            icon: 'none',
            duration: 2500
        });
    }

    // 记录错误日志
    console.error('[Error Handler]', {
        code: errorCode,
        message: errorMessage,
        originalError: error
    });
}

/**
 * 显示成功提示
 * @param {string} message - 成功消息
 * @param {Object} options - 配置选项
 */
function showSuccess(message, options = {}) {
    const {
        duration = 1500,
        icon = 'success'
    } = options;

    wx.showToast({
        title: message,
        icon: icon,
        duration: duration
    });
}

/**
 * 显示加载提示
 * @param {string} message - 加载消息
 */
function showLoading(message = '加载中...') {
    wx.showLoading({
        title: message,
        mask: true
    });
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
    wx.hideLoading();
}

/**
 * 包装异步函数，自动处理错误
 * @param {Function} asyncFn - 异步函数
 * @param {Object} options - 配置选项
 * @returns {Function} 包装后的函数
 */
function withErrorHandler(asyncFn, options = {}) {
    return async function (...args) {
        try {
            return await asyncFn.apply(this, args);
        } catch (error) {
            showError(error, options);
            throw error;
        }
    };
}

/**
 * 确认对话框
 * @param {Object} options - 配置选项
 * @returns {Promise<boolean>} 用户是否确认
 */
function confirm(options = {}) {
    const {
        title = '确认',
        content = '确定要执行此操作吗？',
        confirmText = '确定',
        cancelText = '取消',
        confirmColor = '#667eea'
    } = options;

    return new Promise((resolve) => {
        wx.showModal({
            title,
            content,
            confirmText,
            cancelText,
            confirmColor,
            success: (res) => {
                resolve(res.confirm);
            },
            fail: () => {
                resolve(false);
            }
        });
    });
}

module.exports = {
    showError,
    showSuccess,
    showLoading,
    hideLoading,
    withErrorHandler,
    confirm,
    ERROR_MESSAGES,
    RETRYABLE_ERRORS
};

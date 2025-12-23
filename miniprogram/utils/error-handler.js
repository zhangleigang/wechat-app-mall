/**
 * 统一错误处理工具
 * 提供友好的错误提示和重试选项
 */

const ErrorConfig = require('./error-config.js');

/**
 * 错误类型定义
 */
const ErrorTypes = {
    NETWORK_ERROR: 'network_error',
    API_ERROR: 'api_error',
    DATA_ERROR: 'data_error',
    MEMBER_ERROR: 'member_error',
    NAVIGATION_ERROR: 'navigation_error'
};

/**
 * 错误类型映射
 */
const ERROR_MESSAGES = {
    // 网络错误
    'NETWORK_ERROR': '网络连接失败，请检查网络设置',
    'network_error': '网络连接失败，请检查网络设置',
    'TIMEOUT': '请求超时，请稍后重试',
    'REQUEST_FAILED': '请求失败，请稍后重试',

    // API错误
    'API_ERROR': 'API调用失败，请稍后重试',
    'api_error': 'API调用失败，请稍后重试',

    // 数据错误
    'DATA_ERROR': '数据获取失败，请重试',
    'data_error': '数据获取失败，请重试',
    'DATA_TRANSFER_FAILED': '数据传递失败，正在尝试恢复',

    // 会员错误
    'MEMBER_ERROR': '会员验证失败，请重新登录',
    'member_error': '会员验证失败，请重新登录',
    'MEMBER_REQUIRED': '此功能需要会员权限',

    // 页面跳转错误
    'NAVIGATION_ERROR': '页面跳转失败，请重试',
    'navigation_error': '页面跳转失败，请重试',
    'PAGE_NOT_FOUND': '页面不存在',

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
    'network_error',
    'TIMEOUT',
    'REQUEST_FAILED',
    'API_ERROR',
    'api_error',
    'DATA_ERROR',
    'data_error',
    'SERVER_ERROR',
    'SERVICE_UNAVAILABLE',
    'NAVIGATION_ERROR',
    'navigation_error'
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
 * @param {Object} options - 配置选项
 */
function showLoading(message = '加载中...', options = {}) {
    const {
        timeout = 30000, // 30秒超时
        onTimeout,
        mask = true
    } = options;

    wx.showLoading({
        title: message,
        mask: mask
    });

    // 设置超时处理
    if (timeout > 0) {
        const timeoutId = setTimeout(() => {
            wx.hideLoading();

            if (onTimeout) {
                onTimeout();
            } else {
                // 默认超时处理
                showUserFriendlyError('TIMEOUT', {
                    customTitle: '操作超时',
                    customMessage: '操作时间过长，请检查网络连接或稍后重试',
                    onRetry: () => {
                        // 可以在这里重新执行操作
                    },
                    showAdvancedOptions: true
                });
            }
        }, timeout);

        // 存储超时ID以便取消
        if (!wx._loadingTimeouts) {
            wx._loadingTimeouts = new Set();
        }
        wx._loadingTimeouts.add(timeoutId);
    }
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
    wx.hideLoading();

    // 清理所有超时定时器
    if (wx._loadingTimeouts) {
        wx._loadingTimeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        wx._loadingTimeouts.clear();
    }
}

/**
 * 带进度的加载提示
 * @param {string} message - 加载消息
 * @param {Object} options - 配置选项
 * @returns {Object} 进度控制器
 */
function showProgressLoading(message = '加载中...', options = {}) {
    const {
        timeout = 30000,
        onTimeout,
        steps = []
    } = options;

    let currentStep = 0;
    let progressInterval = null;
    let timeoutId = null;

    // 显示初始加载
    wx.showLoading({
        title: message,
        mask: true
    });

    // 如果有步骤，显示进度
    if (steps.length > 0) {
        progressInterval = setInterval(() => {
            if (currentStep < steps.length) {
                wx.showLoading({
                    title: steps[currentStep],
                    mask: true
                });
                currentStep++;
            }
        }, 2000); // 每2秒切换一次提示
    }

    // 设置超时
    if (timeout > 0) {
        timeoutId = setTimeout(() => {
            cleanup();

            if (onTimeout) {
                onTimeout();
            } else {
                showUserFriendlyError('TIMEOUT', {
                    customTitle: '加载超时',
                    customMessage: '加载时间过长，请检查网络连接',
                    onRetry: () => {
                    },
                    showAdvancedOptions: true
                });
            }
        }, timeout);
    }

    function cleanup() {
        wx.hideLoading();
        if (progressInterval) {
            clearInterval(progressInterval);
        }
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }

    return {
        updateMessage: (newMessage) => {
            wx.showLoading({
                title: newMessage,
                mask: true
            });
        },
        finish: () => {
            cleanup();
        },
        error: (error) => {
            cleanup();
            showUserFriendlyError(error, {
                showAdvancedOptions: true
            });
        }
    };
}

/**
 * 智能加载管理器
 */
class LoadingManager {
    constructor() {
        this.activeLoadings = new Map();
        this.loadingQueue = [];
        this.maxConcurrent = 3;
    }

    /**
     * 开始加载
     * @param {string} id - 加载ID
     * @param {string} message - 加载消息
     * @param {Object} options - 配置选项
     */
    start(id, message, options = {}) {
        const {
            timeout = 30000,
            onTimeout,
            onProgress,
            priority = 0
        } = options;

        // 如果已经在加载，更新消息
        if (this.activeLoadings.has(id)) {
            this.updateMessage(id, message);
            return;
        }

        const loadingInfo = {
            id,
            message,
            startTime: Date.now(),
            timeout,
            onTimeout,
            onProgress,
            priority,
            timeoutId: null
        };

        // 添加到队列
        this.loadingQueue.push(loadingInfo);
        this.loadingQueue.sort((a, b) => b.priority - a.priority);

        // 处理队列
        this.processQueue();
    }

    /**
     * 处理加载队列
     */
    processQueue() {
        while (this.activeLoadings.size < this.maxConcurrent && this.loadingQueue.length > 0) {
            const loadingInfo = this.loadingQueue.shift();
            this.executeLoading(loadingInfo);
        }
    }

    /**
     * 执行加载
     * @param {Object} loadingInfo - 加载信息
     */
    executeLoading(loadingInfo) {
        const { id, message, timeout, onTimeout } = loadingInfo;

        // 显示加载
        wx.showLoading({
            title: message,
            mask: true
        });

        // 设置超时
        if (timeout > 0) {
            loadingInfo.timeoutId = setTimeout(() => {
                this.finish(id, 'timeout');

                if (onTimeout) {
                    onTimeout();
                } else {
                    showUserFriendlyError('TIMEOUT', {
                        customTitle: '加载超时',
                        customMessage: `${message}超时，请重试`,
                        showAdvancedOptions: true
                    });
                }
            }, timeout);
        }

        // 添加到活动列表
        this.activeLoadings.set(id, loadingInfo);
    }

    /**
     * 更新加载消息
     * @param {string} id - 加载ID
     * @param {string} message - 新消息
     */
    updateMessage(id, message) {
        const loadingInfo = this.activeLoadings.get(id);
        if (loadingInfo) {
            loadingInfo.message = message;
            wx.showLoading({
                title: message,
                mask: true
            });
        }
    }

    /**
     * 完成加载
     * @param {string} id - 加载ID
     * @param {string} result - 结果类型
     */
    finish(id, result = 'success') {
        const loadingInfo = this.activeLoadings.get(id);
        if (loadingInfo) {
            // 清理超时定时器
            if (loadingInfo.timeoutId) {
                clearTimeout(loadingInfo.timeoutId);
            }

            // 从活动列表移除
            this.activeLoadings.delete(id);

            // 如果没有其他加载，隐藏加载提示
            if (this.activeLoadings.size === 0) {
                wx.hideLoading();
            }

            // 处理队列中的下一个
            this.processQueue();

            // 记录加载统计
            this.recordLoadingStats(loadingInfo, result);
        }
    }

    /**
     * 记录加载统计
     * @param {Object} loadingInfo - 加载信息
     * @param {string} result - 结果
     */
    recordLoadingStats(loadingInfo, result) {
        const duration = Date.now() - loadingInfo.startTime;
        const stats = {
            id: loadingInfo.id,
            message: loadingInfo.message,
            duration,
            result,
            timestamp: Date.now()
        };

        // 如果加载时间过长，记录警告
        if (duration > 10000) {
        }
    }

    /**
     * 取消所有加载
     */
    cancelAll() {
        this.activeLoadings.forEach((loadingInfo) => {
            if (loadingInfo.timeoutId) {
                clearTimeout(loadingInfo.timeoutId);
            }
        });

        this.activeLoadings.clear();
        this.loadingQueue = [];
        wx.hideLoading();
    }

    /**
     * 获取加载状态
     */
    getStatus() {
        return {
            active: Array.from(this.activeLoadings.keys()),
            queued: this.loadingQueue.map(item => item.id),
            total: this.activeLoadings.size + this.loadingQueue.length
        };
    }
}

// 创建全局加载管理器实例
const globalLoadingManager = new LoadingManager();

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

/**
 * 处理页面跳转错误
 * @param {Error|string} error - 错误对象或错误码
 * @param {Object} context - 上下文信息
 * @param {Object} options - 配置选项
 */
function handleNavigationError(error, context = {}, options = {}) {
    console.error('[Navigation Error]', {
        error,
        context,
        timestamp: new Date().toISOString()
    });

    const {
        onRetry,
        showRetry = true,
        customMessage
    } = options;

    // 记录详细的错误日志
    const errorLog = {
        type: 'navigation_error',
        error: error,
        context: context,
        timestamp: Date.now(),
        userAgent: wx.getSystemInfoSync()
    };

    console.error('[Navigation Error Detail]', errorLog);

    // 显示用户友好的错误提示
    showError(error || ErrorTypes.NAVIGATION_ERROR, {
        onRetry,
        showRetry,
        customMessage: customMessage || '页面跳转失败，请重试'
    });
}

/**
 * 处理API调用错误
 * @param {Error|string} error - 错误对象或错误码
 * @param {Function} retryCallback - 重试回调函数
 * @param {Object} options - 配置选项
 */
function handleApiError(error, retryCallback, options = {}) {
    console.error('[API Error]', {
        error,
        timestamp: new Date().toISOString()
    });

    const {
        maxRetries = 3,
        retryDelay = 1000,
        customMessage
    } = options;

    // 记录API错误日志
    const errorLog = {
        type: 'api_error',
        error: error,
        timestamp: Date.now()
    };

    console.error('[API Error Detail]', errorLog);

    // 显示错误提示并提供重试选项
    showError(error || ErrorTypes.API_ERROR, {
        onRetry: retryCallback,
        showRetry: typeof retryCallback === 'function',
        customMessage: customMessage || 'API调用失败，请重试'
    });
}

/**
 * 显示用户友好的错误提示
 * @param {Error|string} error - 错误对象或错误码
 * @param {Object} options - 配置选项
 */
function showUserFriendlyError(error, options = {}) {
    const {
        onRetry,
        onCancel,
        onRefresh,
        onGoBack,
        showActions = true,
        customTitle,
        customMessage,
        showAdvancedOptions = false
    } = options;

    let errorMessage = '';
    let errorCode = '';
    let errorTitle = customTitle || '操作失败';

    if (typeof error === 'string') {
        errorCode = error;
        errorMessage = customMessage || ERROR_MESSAGES[error] || ERROR_MESSAGES['UNKNOWN_ERROR'];
    } else if (error && error.code) {
        errorCode = error.code;
        errorMessage = customMessage || ERROR_MESSAGES[error.code] || error.message || ERROR_MESSAGES['UNKNOWN_ERROR'];
    } else if (error && error.message) {
        errorMessage = customMessage || error.message;
    } else {
        errorMessage = customMessage || ERROR_MESSAGES['UNKNOWN_ERROR'];
    }

    // 根据错误类型调整标题
    if (!customTitle) {
        switch (errorCode) {
            case 'NETWORK_ERROR':
            case 'network_error':
                errorTitle = '网络连接失败';
                break;
            case 'API_ERROR':
            case 'api_error':
                errorTitle = '服务请求失败';
                break;
            case 'NAVIGATION_ERROR':
            case 'navigation_error':
                errorTitle = '页面跳转失败';
                break;
            case 'DATA_ERROR':
            case 'data_error':
                errorTitle = '数据加载失败';
                break;
            case 'MEMBER_ERROR':
            case 'member_error':
                errorTitle = '会员验证失败';
                break;
        }
    }

    if (showActions && (onRetry || onCancel || onRefresh || onGoBack || showAdvancedOptions)) {
        // 显示带多个选项的错误提示
        showAdvancedErrorDialog(errorTitle, errorMessage, {
            onRetry,
            onCancel,
            onRefresh,
            onGoBack,
            showAdvancedOptions,
            errorCode
        });
    } else {
        // 显示简单的Toast提示
        wx.showToast({
            title: errorMessage,
            icon: 'none',
            duration: 2500
        });
    }
}

/**
 * 显示高级错误对话框
 * @param {string} title - 错误标题
 * @param {string} message - 错误消息
 * @param {Object} options - 选项
 */
function showAdvancedErrorDialog(title, message, options = {}) {
    const {
        onRetry,
        onCancel,
        onRefresh,
        onGoBack,
        showAdvancedOptions,
        errorCode
    } = options;

    // 构建操作选项
    const actions = [];

    if (onRetry) actions.push('重试');
    if (onRefresh) actions.push('刷新页面');
    if (onGoBack) actions.push('返回上页');
    if (showAdvancedOptions) actions.push('更多选项');

    if (actions.length === 0) {
        // 没有操作选项，显示简单模态框
        wx.showModal({
            title: title,
            content: message,
            showCancel: false,
            confirmText: '确定',
            confirmColor: '#667eea'
        });
        return;
    }

    if (actions.length <= 2) {
        // 使用模态框显示
        wx.showModal({
            title: title,
            content: message,
            confirmText: actions[0] || '确定',
            cancelText: actions[1] || '取消',
            confirmColor: '#667eea',
            success: (res) => {
                if (res.confirm) {
                    if (actions[0] === '重试' && onRetry) onRetry();
                    else if (actions[0] === '刷新页面' && onRefresh) onRefresh();
                    else if (actions[0] === '返回上页' && onGoBack) onGoBack();
                    else if (actions[0] === '更多选项' && showAdvancedOptions) {
                        showErrorRecoveryOptions(errorCode);
                    }
                } else if (res.cancel) {
                    if (actions[1] === '重试' && onRetry) onRetry();
                    else if (actions[1] === '刷新页面' && onRefresh) onRefresh();
                    else if (actions[1] === '返回上页' && onGoBack) onGoBack();
                    else if (actions[1] === '更多选项' && showAdvancedOptions) {
                        showErrorRecoveryOptions(errorCode);
                    } else if (onCancel) onCancel();
                }
            }
        });
    } else {
        // 使用操作表显示多个选项
        wx.showActionSheet({
            itemList: actions,
            success: (res) => {
                const selectedAction = actions[res.tapIndex];

                switch (selectedAction) {
                    case '重试':
                        if (onRetry) onRetry();
                        break;
                    case '刷新页面':
                        if (onRefresh) onRefresh();
                        break;
                    case '返回上页':
                        if (onGoBack) onGoBack();
                        break;
                    case '更多选项':
                        showErrorRecoveryOptions(errorCode);
                        break;
                }
            }
        });
    }
}

/**
 * 显示错误恢复选项
 * @param {string} errorCode - 错误代码
 */
function showErrorRecoveryOptions(errorCode) {
    const commonOptions = [
        '重新加载应用',
        '清理缓存',
        '网络诊断',
        '复制错误信息',
        '联系技术支持'
    ];

    // 根据错误类型添加特定选项
    let specificOptions = [];
    switch (errorCode) {
        case 'NETWORK_ERROR':
        case 'network_error':
            specificOptions = ['检查网络设置', '切换网络'];
            break;
        case 'NAVIGATION_ERROR':
        case 'navigation_error':
            specificOptions = ['返回首页', '重启页面'];
            break;
        case 'DATA_ERROR':
        case 'data_error':
            specificOptions = ['离线模式', '重新获取数据'];
            break;
    }

    const allOptions = [...specificOptions, ...commonOptions];

    wx.showActionSheet({
        itemList: allOptions,
        success: (res) => {
            const selectedOption = allOptions[res.tapIndex];
            handleErrorRecoveryAction(selectedOption, errorCode);
        }
    });
}

/**
 * 处理错误恢复操作
 * @param {string} action - 恢复操作
 * @param {string} errorCode - 错误代码
 */
function handleErrorRecoveryAction(action, errorCode) {
    switch (action) {
        case '重新加载应用':
            wx.reLaunch({
                url: '/pages/knowledge/index'
            });
            break;

        case '清理缓存':
            clearApplicationCache();
            break;

        case '网络诊断':
            performNetworkDiagnostics();
            break;

        case '复制错误信息':
            copyErrorInformation(errorCode);
            break;

        case '联系技术支持':
            showTechnicalSupport();
            break;

        case '检查网络设置':
            showNetworkSettings();
            break;

        case '切换网络':
            showNetworkSwitchGuide();
            break;

        case '返回首页':
            wx.switchTab({
                url: '/pages/knowledge/index'
            });
            break;

        case '重启页面':
            getCurrentPages().length > 0 && wx.redirectTo({
                url: getCurrentPages()[getCurrentPages().length - 1].route
            });
            break;

        case '离线模式':
            enableOfflineMode();
            break;

        case '重新获取数据':
            retryDataOperation();
            break;

        default:
            wx.showToast({
                title: '功能开发中',
                icon: 'none'
            });
            break;
    }
}

/**
 * 清理应用缓存
 */
function clearApplicationCache() {
    wx.showModal({
        title: '清理缓存',
        content: '将清理应用缓存数据，这可能有助于解决问题。确定继续吗？',
        confirmText: '清理',
        cancelText: '取消',
        success: (res) => {
            if (res.confirm) {
                try {
                    wx.showLoading({
                        title: '清理中...',
                        mask: true
                    });

                    // 清理数据传递缓存
                    const DataTransferManager = require('./data-transfer.js');
                    DataTransferManager.cleanupExpiredData();

                    // 清理错误日志
                    cleanupErrorLogs();

                    // 清理其他缓存
                    const cacheKeys = ['navigation_error_logs', 'dt_recent_question'];
                    cacheKeys.forEach(key => {
                        try {
                            wx.removeStorageSync(key);
                        } catch (e) {
                        }
                    });

                    wx.hideLoading();
                    wx.showToast({
                        title: '缓存清理完成',
                        icon: 'success'
                    });

                    // 延迟重启应用
                    setTimeout(() => {
                        wx.reLaunch({
                            url: '/pages/knowledge/index'
                        });
                    }, 1500);

                } catch (error) {
                    wx.hideLoading();
                    wx.showToast({
                        title: '清理失败，请重试',
                        icon: 'none'
                    });
                }
            }
        }
    });
}

/**
 * 执行网络诊断
 */
async function performNetworkDiagnostics() {
    try {
        wx.showLoading({
            title: '诊断网络...',
            mask: true
        });

        // 获取网络状态
        const networkInfo = await new Promise((resolve) => {
            wx.getNetworkType({
                success: resolve,
                fail: () => resolve({ networkType: 'unknown' })
            });
        });

        // 测试网络连接
        const connectivityTest = await testNetworkConnectivity();

        wx.hideLoading();

        const diagnosticInfo = `网络诊断结果：

网络类型：${networkInfo.networkType}
网络状态：${connectivityTest.connected ? '已连接' : '连接异常'}
${connectivityTest.responseTime ? `响应时间：${connectivityTest.responseTime}ms` : ''}
${connectivityTest.error ? `错误信息：${connectivityTest.error}` : ''}

建议：
• 确认网络连接正常
• 尝试切换WiFi/移动网络
• 检查网络设置和权限`;

        wx.showModal({
            title: '网络诊断',
            content: diagnosticInfo,
            confirmText: '复制结果',
            cancelText: '关闭',
            success: (res) => {
                if (res.confirm) {
                    wx.setClipboardData({
                        data: diagnosticInfo,
                        success: () => {
                            wx.showToast({
                                title: '诊断结果已复制',
                                icon: 'success'
                            });
                        }
                    });
                }
            }
        });

    } catch (error) {
        wx.hideLoading();
        wx.showToast({
            title: '网络诊断失败',
            icon: 'none'
        });
    }
}

/**
 * 测试网络连接
 */
function testNetworkConnectivity() {
    return new Promise((resolve) => {
        const startTime = Date.now();

        wx.request({
            url: 'https://api.feelnow.cn/api/health',
            method: 'GET',
            timeout: 5000,
            success: (res) => {
                const responseTime = Date.now() - startTime;
                resolve({
                    connected: true,
                    responseTime: responseTime,
                    statusCode: res.statusCode
                });
            },
            fail: (error) => {
                resolve({
                    connected: false,
                    error: error.errMsg || '连接失败'
                });
            }
        });
    });
}

/**
 * 复制错误信息
 */
function copyErrorInformation(errorCode) {
    try {
        const systemInfo = wx.getSystemInfoSync();
        const errorInfo = `错误报告

错误代码：${errorCode}
时间：${new Date().toLocaleString()}
设备：${systemInfo.brand} ${systemInfo.model}
系统：${systemInfo.system}
微信版本：${systemInfo.version}
小程序版本：${systemInfo.SDKVersion}

如需技术支持，请将此信息发送给客服。`;

        wx.setClipboardData({
            data: errorInfo,
            success: () => {
                wx.showToast({
                    title: '错误信息已复制',
                    icon: 'success'
                });
            }
        });
    } catch (error) {
        wx.showToast({
            title: '复制失败',
            icon: 'none'
        });
    }
}

/**
 * 显示技术支持信息
 */
function showTechnicalSupport() {
    const supportInfo = `技术支持

遇到问题？我们来帮您解决！

联系方式：
微信：csuzhangleigang
邮箱：support@feelnow.cn

请提供：
• 具体问题描述
• 操作步骤
• 错误截图（如有）
• 设备和网络信息

我们会尽快为您解决问题。`;

    wx.showModal({
        title: '技术支持',
        content: supportInfo,
        confirmText: '复制微信号',
        cancelText: '关闭',
        success: (res) => {
            if (res.confirm) {
                wx.setClipboardData({
                    data: 'csuzhangleigang',
                    success: () => {
                        wx.showToast({
                            title: '微信号已复制',
                            icon: 'success'
                        });
                    }
                });
            }
        }
    });
}

/**
 * 显示网络设置指南
 */
function showNetworkSettings() {
    const settingsGuide = `网络设置检查

请检查以下设置：

1. WiFi连接
   • 确认已连接到可用WiFi
   • 尝试断开重连WiFi

2. 移动网络
   • 确认移动数据已开启
   • 检查流量是否充足

3. 小程序权限
   • 确认已允许网络访问
   • 检查微信网络权限

4. 网络环境
   • 尝试切换网络环境
   • 检查防火墙设置`;

    wx.showModal({
        title: '网络设置',
        content: settingsGuide,
        confirmText: '去设置',
        cancelText: '知道了',
        success: (res) => {
            if (res.confirm) {
                // 尝试打开系统设置（可能不支持）
                wx.openSetting({
                    success: () => {
                    },
                    fail: () => {
                        wx.showToast({
                            title: '请手动检查网络设置',
                            icon: 'none'
                        });
                    }
                });
            }
        }
    });
}

/**
 * 显示网络切换指南
 */
function showNetworkSwitchGuide() {
    const switchGuide = `网络切换建议

请尝试以下操作：

1. WiFi ↔ 移动网络
   • 当前使用WiFi？尝试关闭WiFi使用移动网络
   • 当前使用移动网络？尝试连接WiFi

2. 重新连接
   • 断开当前网络连接
   • 等待10秒后重新连接

3. 重启网络
   • 开启飞行模式
   • 等待10秒后关闭飞行模式

4. 更换网络
   • 尝试连接其他WiFi网络
   • 使用手机热点测试`;

    wx.showModal({
        title: '网络切换',
        content: switchGuide,
        showCancel: false,
        confirmText: '知道了'
    });
}

/**
 * 启用离线模式
 */
function enableOfflineMode() {
    wx.showModal({
        title: '离线模式',
        content: '离线模式将使用本地缓存数据，功能可能受限。确定启用吗？',
        confirmText: '启用',
        cancelText: '取消',
        success: (res) => {
            if (res.confirm) {
                // 设置离线模式标志
                wx.setStorageSync('offline_mode', true);

                wx.showToast({
                    title: '已启用离线模式',
                    icon: 'success'
                });

                // 重新加载当前页面
                setTimeout(() => {
                    const pages = getCurrentPages();
                    if (pages.length > 0) {
                        const currentPage = pages[pages.length - 1];
                        wx.redirectTo({
                            url: `/${currentPage.route}?offline=true`
                        });
                    }
                }, 1500);
            }
        }
    });
}

/**
 * 重试数据操作
 */
function retryDataOperation() {
    wx.showLoading({
        title: '重新获取数据...',
        mask: true
    });

    // 清理可能的缓存问题
    try {
        const DataTransferManager = require('./data-transfer.js');
        DataTransferManager.cleanupExpiredData();
    } catch (error) {
        console.error('清理数据传递缓存失败:', error);
    }

    // 延迟后重新加载页面
    setTimeout(() => {
        wx.hideLoading();

        const pages = getCurrentPages();
        if (pages.length > 0) {
            const currentPage = pages[pages.length - 1];
            wx.redirectTo({
                url: `/${currentPage.route}?retry=true`
            });
        } else {
            wx.reLaunch({
                url: '/pages/knowledge/index'
            });
        }
    }, 2000);
}

/**
 * 重试机制实现
 * @param {Function} operation - 要重试的操作
 * @param {Object} options - 重试选项
 * @returns {Promise} 操作结果
 */
async function retryOperation(operation, options = {}) {
    const {
        configType = 'default',
        onRetry,
        onFinalFailure
    } = options;

    const config = ErrorConfig.getRetryConfig(configType);
    let lastError = null;

    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
        try {
            const result = await operation();
            return result;
        } catch (error) {
            lastError = error;

            if (attempt <= config.maxRetries) {
                const delay = ErrorConfig.calculateRetryDelay(attempt, config);

                if (onRetry) {
                    onRetry(attempt, delay, error);
                }

                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // 所有重试都失败
    if (onFinalFailure) {
        onFinalFailure(lastError);
    }

    throw lastError;
}

/**
 * 记录错误日志
 * @param {string} errorType - 错误类型
 * @param {Error|string} error - 错误信息
 * @param {Object} context - 上下文信息
 */
function logError(errorType, error, context = {}) {
    const config = ErrorConfig.getErrorConfig(errorType);
    const timestamp = new Date().toISOString();

    const logEntry = {
        type: errorType,
        severity: config.severity,
        error: error,
        context: context,
        timestamp: timestamp,
        userAgent: wx.getSystemInfoSync()
    };

    // 根据配置的日志级别输出
    switch (config.logLevel) {
        case 'debug':
            break;
        case 'info':
            break;
        case 'warn':
            break;
        case 'error':
        default:
            console.error('[Error Log]', logEntry);
            break;
    }

    // 如果启用了详细日志记录，保存到本地存储
    if (ErrorConfig.LogConfig.enableDetailedLogging) {
        try {
            const logs = wx.getStorageSync('error_logs') || [];
            logs.push(logEntry);

            // 限制日志条数
            if (logs.length > ErrorConfig.LogConfig.maxLogEntries) {
                logs.splice(0, logs.length - ErrorConfig.LogConfig.maxLogEntries);
            }

            wx.setStorageSync('error_logs', logs);
        } catch (storageError) {
            console.error('[Error Log] 保存日志失败:', storageError);
        }
    }
}

/**
 * 清理过期的错误日志
 */
function cleanupErrorLogs() {
    try {
        const logs = wx.getStorageSync('error_logs') || [];
        const now = Date.now();
        const retention = ErrorConfig.LogConfig.errorLogRetention;

        const validLogs = logs.filter(log => {
            const logTime = new Date(log.timestamp).getTime();
            return (now - logTime) < retention;
        });

        if (validLogs.length !== logs.length) {
            wx.setStorageSync('error_logs', validLogs);
        }
    } catch (error) {
        console.error('[Error Log] 清理日志失败:', error);
    }
}

module.exports = {
    showError,
    showSuccess,
    showLoading,
    hideLoading,
    showProgressLoading,
    withErrorHandler,
    confirm,
    handleNavigationError,
    handleApiError,
    showUserFriendlyError,
    showAdvancedErrorDialog,
    showErrorRecoveryOptions,
    handleErrorRecoveryAction,
    retryOperation,
    logError,
    cleanupErrorLogs,
    clearApplicationCache,
    performNetworkDiagnostics,
    testNetworkConnectivity,
    copyErrorInformation,
    showTechnicalSupport,
    LoadingManager,
    globalLoadingManager,
    ERROR_MESSAGES,
    RETRYABLE_ERRORS,
    ErrorTypes: ErrorConfig.ErrorTypes
};

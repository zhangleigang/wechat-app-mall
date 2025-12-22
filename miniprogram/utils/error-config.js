/**
 * 错误处理配置
 * 定义错误类型、重试策略和配置参数
 */

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
 * 重试配置
 */
const RetryConfig = {
    // 默认重试配置
    default: {
        maxRetries: 3,
        retryDelay: 1000,
        exponentialBackoff: true,
        maxDelay: 10000
    },

    // 网络请求重试配置
    network: {
        maxRetries: 3,
        retryDelay: 1000,
        exponentialBackoff: true,
        maxDelay: 8000
    },

    // API调用重试配置
    api: {
        maxRetries: 2,
        retryDelay: 1500,
        exponentialBackoff: true,
        maxDelay: 6000
    },

    // 页面跳转重试配置
    navigation: {
        maxRetries: 2,
        retryDelay: 500,
        exponentialBackoff: false,
        maxDelay: 1000
    },

    // 数据传递重试配置
    dataTransfer: {
        maxRetries: 1,
        retryDelay: 200,
        exponentialBackoff: false,
        maxDelay: 500
    }
};

/**
 * 错误严重级别
 */
const ErrorSeverity = {
    LOW: 'low',        // 轻微错误，不影响核心功能
    MEDIUM: 'medium',  // 中等错误，影响部分功能
    HIGH: 'high',      // 严重错误，影响核心功能
    CRITICAL: 'critical' // 致命错误，应用无法正常使用
};

/**
 * 错误分类配置
 */
const ErrorCategories = {
    [ErrorTypes.NETWORK_ERROR]: {
        severity: ErrorSeverity.HIGH,
        retryable: true,
        userFriendly: true,
        logLevel: 'error'
    },
    [ErrorTypes.API_ERROR]: {
        severity: ErrorSeverity.MEDIUM,
        retryable: true,
        userFriendly: true,
        logLevel: 'error'
    },
    [ErrorTypes.DATA_ERROR]: {
        severity: ErrorSeverity.MEDIUM,
        retryable: true,
        userFriendly: true,
        logLevel: 'warn'
    },
    [ErrorTypes.MEMBER_ERROR]: {
        severity: ErrorSeverity.LOW,
        retryable: false,
        userFriendly: true,
        logLevel: 'info'
    },
    [ErrorTypes.NAVIGATION_ERROR]: {
        severity: ErrorSeverity.HIGH,
        retryable: true,
        userFriendly: true,
        logLevel: 'error'
    }
};

/**
 * 用户友好的错误消息模板
 */
const ErrorMessageTemplates = {
    [ErrorTypes.NETWORK_ERROR]: {
        title: '网络连接失败',
        message: '网络连接不稳定，请检查网络设置后重试',
        actions: ['重试', '网络诊断', '离线模式'],
        recoveryOptions: ['检查网络设置', '切换网络', '重新加载应用'],
        severity: ErrorSeverity.HIGH
    },
    [ErrorTypes.API_ERROR]: {
        title: '服务请求失败',
        message: '服务暂时不可用，我们正在努力修复',
        actions: ['重试', '刷新页面', '联系客服'],
        recoveryOptions: ['稍后重试', '清理缓存', '重新加载应用'],
        severity: ErrorSeverity.MEDIUM
    },
    [ErrorTypes.DATA_ERROR]: {
        title: '数据加载失败',
        message: '数据获取失败，可能是网络问题或服务异常',
        actions: ['重试', '刷新页面', '返回上页'],
        recoveryOptions: ['重新获取数据', '离线模式', '清理缓存'],
        severity: ErrorSeverity.MEDIUM
    },
    [ErrorTypes.MEMBER_ERROR]: {
        title: '会员验证失败',
        message: '无法验证会员状态，请检查网络或重新登录',
        actions: ['重试验证', '重新登录', '联系客服'],
        recoveryOptions: ['检查网络', '清理缓存', '重新登录'],
        severity: ErrorSeverity.LOW
    },
    [ErrorTypes.NAVIGATION_ERROR]: {
        title: '页面跳转失败',
        message: '页面跳转遇到问题，可能是数据传递异常',
        actions: ['重试', '返回首页', '刷新页面'],
        recoveryOptions: ['重启页面', '清理缓存', '重新加载应用'],
        severity: ErrorSeverity.HIGH
    }
};

/**
 * 超时错误模板
 */
const TimeoutErrorTemplate = {
    title: '操作超时',
    message: '操作时间过长，可能是网络较慢或服务繁忙',
    actions: ['重试', '网络诊断', '取消'],
    recoveryOptions: ['检查网络', '稍后重试', '切换网络'],
    severity: ErrorSeverity.MEDIUM
};

/**
 * 加载状态配置
 */
const LoadingConfig = {
    // 默认超时时间
    defaultTimeout: 30000,

    // 不同操作的超时时间
    timeouts: {
        navigation: 10000,      // 页面跳转
        api: 15000,            // API调用
        dataLoad: 20000,       // 数据加载
        memberCheck: 10000,    // 会员验证
        fileUpload: 60000      // 文件上传
    },

    // 加载提示配置
    messages: {
        navigation: ['正在跳转...', '准备页面...', '加载内容...'],
        api: ['连接服务器...', '处理请求...', '获取数据...'],
        dataLoad: ['加载数据...', '解析内容...', '准备显示...'],
        memberCheck: ['验证会员状态...', '检查权限...', '准备内容...'],
        fileUpload: ['上传文件...', '处理文件...', '保存数据...']
    },

    // 进度显示配置
    showProgress: true,
    progressInterval: 2000,  // 2秒切换一次提示

    // 最大并发加载数
    maxConcurrentLoading: 3
};

/**
 * 降级策略配置
 */
const FallbackConfig = {
    // 数据获取降级策略
    dataFallback: {
        sources: ['globalData', 'localStorage', 'urlParams', 'apiRequest'],
        timeout: 5000
    },

    // 页面跳转降级策略
    navigationFallback: {
        methods: ['navigateTo', 'redirectTo', 'reLaunch'],
        timeout: 3000
    },

    // 会员验证降级策略
    memberFallback: {
        defaultBehavior: 'allowWithWarning', // 'block' | 'allowWithWarning' | 'allow'
        cacheTimeout: 10 * 60 * 1000 // 10分钟
    }
};

/**
 * 日志配置
 */
const LogConfig = {
    // 是否启用详细日志
    enableDetailedLogging: true,

    // 日志级别
    logLevel: 'info', // 'debug' | 'info' | 'warn' | 'error'

    // 是否记录用户行为
    trackUserActions: true,

    // 错误日志保留时间（毫秒）
    errorLogRetention: 7 * 24 * 60 * 60 * 1000, // 7天

    // 最大日志条数
    maxLogEntries: 100
};

/**
 * 性能监控配置
 */
const PerformanceConfig = {
    // 是否启用性能监控
    enableMonitoring: true,

    // 慢操作阈值（毫秒）
    slowOperationThreshold: 2000,

    // 内存使用监控
    memoryMonitoring: true,

    // 网络请求监控
    networkMonitoring: true
};

/**
 * 获取错误配置
 * @param {string} errorType - 错误类型
 * @returns {Object} 错误配置
 */
function getErrorConfig(errorType) {
    return ErrorCategories[errorType] || {
        severity: ErrorSeverity.MEDIUM,
        retryable: false,
        userFriendly: true,
        logLevel: 'error'
    };
}

/**
 * 获取重试配置
 * @param {string} configType - 配置类型
 * @returns {Object} 重试配置
 */
function getRetryConfig(configType = 'default') {
    return RetryConfig[configType] || RetryConfig.default;
}

/**
 * 获取错误消息模板
 * @param {string} errorType - 错误类型
 * @returns {Object} 消息模板
 */
function getErrorMessageTemplate(errorType) {
    return ErrorMessageTemplates[errorType] || {
        title: '操作失败',
        message: '操作失败，请重试',
        actions: ['重试', '取消']
    };
}

/**
 * 计算重试延迟
 * @param {number} attempt - 当前重试次数
 * @param {Object} config - 重试配置
 * @returns {number} 延迟时间（毫秒）
 */
function calculateRetryDelay(attempt, config) {
    const { retryDelay, exponentialBackoff, maxDelay } = config;

    if (!exponentialBackoff) {
        return retryDelay;
    }

    const delay = retryDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, maxDelay);
}

module.exports = {
    ErrorTypes,
    ErrorSeverity,
    ErrorCategories,
    ErrorMessageTemplates,
    TimeoutErrorTemplate,
    LoadingConfig,
    RetryConfig,
    FallbackConfig,
    LogConfig,
    PerformanceConfig,
    getErrorConfig,
    getRetryConfig,
    getErrorMessageTemplate,
    calculateRetryDelay
};
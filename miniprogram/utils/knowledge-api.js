/**
 * 知识库 API 调用工具
 * 从云端服务器加载知识库数据
 */

const CONFIG = require('../config.js');

// API 基础地址（从配置文件读取，使用统一的 apiBaseUrl）
let API_BASE_URL = CONFIG.apiBaseUrl || 'http://localhost:3000/api';

// 缓存配置
const CACHE_KEY_PREFIX = 'knowledge_';
const CACHE_VERSION_KEY = 'knowledge_version';
const CACHE_EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000; // 7天

/**
 * 发起 API 请求（带重试和降级机制）
 */
function request(url, options = {}) {
    const {
        method = 'GET',
        data = {},
        timeout = 10000,
        retryConfig = 'network',
        enableFallback = true
    } = options;

    return requestWithRetry(url, {
        method,
        data,
        timeout,
        retryConfig,
        enableFallback
    });
}

/**
 * 带重试机制的请求
 */
async function requestWithRetry(url, options) {
    const ErrorHandler = require('./error-handler.js');
    const ErrorConfig = require('./error-config.js');

    const {
        method,
        data,
        timeout,
        retryConfig,
        enableFallback
    } = options;

    const config = ErrorConfig.getRetryConfig(retryConfig);
    let lastError = null;

    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
        try {
            console.log(`[KnowledgeAPI] 请求尝试 ${attempt}/${config.maxRetries + 1}: ${url}`);

            const result = await executeRequest(url, {
                method,
                data,
                timeout: timeout + (attempt - 1) * 2000 // 递增超时时间
            });

            // 请求成功，记录成功日志
            if (attempt > 1) {
                console.log(`[KnowledgeAPI] 重试成功，第 ${attempt} 次尝试`);
            }

            return result;

        } catch (error) {
            lastError = error;

            console.warn(`[KnowledgeAPI] 请求失败 (第${attempt}次):`, {
                url,
                error: error.message,
                statusCode: error.statusCode,
                attempt
            });

            // 判断是否应该重试
            if (attempt <= config.maxRetries && isRetryableError(error)) {
                const delay = ErrorConfig.calculateRetryDelay(attempt, config);

                console.log(`[KnowledgeAPI] 将在 ${delay}ms 后进行第 ${attempt + 1} 次重试`);

                // 显示重试提示（仅第一次失败时）
                if (attempt === 1) {
                    wx.showToast({
                        title: '网络不稳定，正在重试...',
                        icon: 'loading',
                        duration: delay
                    });
                }

                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                break;
            }
        }
    }

    // 所有重试都失败，尝试降级处理
    if (enableFallback) {
        try {
            const fallbackResult = await handleRequestFallback(url, options, lastError);
            if (fallbackResult) {
                console.log('[KnowledgeAPI] 降级处理成功');
                return fallbackResult;
            }
        } catch (fallbackError) {
            console.error('[KnowledgeAPI] 降级处理也失败:', fallbackError);
        }
    }

    // 记录最终失败
    ErrorHandler.logError('API_ERROR', lastError, {
        url,
        method,
        attempts: config.maxRetries + 1
    });

    throw enhanceError(lastError, url, config.maxRetries + 1);
}

/**
 * 执行单次请求
 */
function executeRequest(url, options) {
    const { method, data, timeout } = options;

    return new Promise((resolve, reject) => {
        const requestOptions = {
            url: `${API_BASE_URL}${url}`,
            method: method,
            data: data,
            timeout: timeout,
            header: {
                'content-type': 'application/json'
            },
            success: (res) => {
                // 检查HTTP状态码
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    // 检查业务状态码
                    if (res.data && res.data.code === 0) {
                        resolve(res.data.data);
                    } else {
                        const error = new Error(res.data?.message || '业务处理失败');
                        error.code = res.data?.code || 'BUSINESS_ERROR';
                        error.statusCode = res.statusCode;
                        reject(error);
                    }
                } else {
                    const error = new Error(`HTTP ${res.statusCode}: ${getHttpErrorMessage(res.statusCode)}`);
                    error.statusCode = res.statusCode;
                    error.code = 'HTTP_ERROR';
                    reject(error);
                }
            },
            fail: (err) => {
                const error = new Error(err.errMsg || '网络请求失败');
                error.code = 'NETWORK_ERROR';
                error.originalError = err;
                reject(error);
            }
        };

        wx.request(requestOptions);
    });
}

/**
 * 判断错误是否可重试
 */
function isRetryableError(error) {
    if (!error) return false;

    // 网络错误通常可重试
    if (error.code === 'NETWORK_ERROR') return true;

    // 超时错误可重试
    if (error.message && error.message.includes('timeout')) return true;

    // 5xx服务器错误可重试
    if (error.statusCode >= 500) return true;

    // 429 请求过多可重试
    if (error.statusCode === 429) return true;

    // 408 请求超时可重试
    if (error.statusCode === 408) return true;

    // 502, 503, 504 网关错误可重试
    if ([502, 503, 504].includes(error.statusCode)) return true;

    return false;
}

/**
 * 处理请求降级
 */
async function handleRequestFallback(url, options, originalError) {
    console.log('[KnowledgeAPI] 开始降级处理:', url);

    // 1. 尝试从缓存获取数据
    const cachedData = await tryGetFromCache(url, options);
    if (cachedData) {
        console.log('[KnowledgeAPI] 降级：使用缓存数据');
        return cachedData;
    }

    // 2. 尝试使用备用API地址（如果配置了）
    const backupResult = await tryBackupApi(url, options);
    if (backupResult) {
        console.log('[KnowledgeAPI] 降级：使用备用API成功');
        return backupResult;
    }

    // 3. 返回默认数据（如果适用）
    const defaultData = getDefaultData(url);
    if (defaultData) {
        console.log('[KnowledgeAPI] 降级：使用默认数据');
        return defaultData;
    }

    return null;
}

/**
 * 尝试从缓存获取数据
 */
async function tryGetFromCache(url, options) {
    try {
        // 根据URL和参数生成缓存键
        const cacheKey = generateCacheKey(url, options.data);
        const cached = getCache(cacheKey);

        if (cached) {
            // 检查缓存是否过期（降级时允许使用过期缓存）
            return cached;
        }
    } catch (error) {
        console.error('[KnowledgeAPI] 缓存降级失败:', error);
    }
    return null;
}

/**
 * 尝试备用API
 */
async function tryBackupApi(url, options) {
    const CONFIG = require('../config.js');

    // 如果配置了备用API地址
    if (CONFIG.backupApiBaseUrl && CONFIG.backupApiBaseUrl !== API_BASE_URL) {
        try {
            console.log('[KnowledgeAPI] 尝试备用API:', CONFIG.backupApiBaseUrl);

            const originalBaseUrl = API_BASE_URL;
            API_BASE_URL = CONFIG.backupApiBaseUrl;

            const result = await executeRequest(url, {
                ...options,
                timeout: 5000 // 备用API使用较短超时
            });

            // 恢复原API地址
            API_BASE_URL = originalBaseUrl;

            return result;
        } catch (error) {
            console.error('[KnowledgeAPI] 备用API也失败:', error);
            // 恢复原API地址
            API_BASE_URL = CONFIG.apiBaseUrl || 'http://localhost:3000/api';
        }
    }
    return null;
}

/**
 * 获取默认数据
 */
function getDefaultData(url) {
    // 为不同的API端点提供默认数据
    if (url.includes('/categories')) {
        return getDefaultCategories();
    } else if (url.includes('/questions')) {
        return getDefaultQuestions();
    }
    return null;
}

/**
 * 获取默认分类数据
 */
function getDefaultCategories() {
    return [
        { key: 'hdfs', name: 'HDFS', description: 'Hadoop分布式文件系统' },
        { key: 'spark', name: 'Spark', description: 'Apache Spark大数据处理' },
        { key: 'flink', name: 'Flink', description: 'Apache Flink流处理' },
        { key: 'kafka', name: 'Kafka', description: 'Apache Kafka消息队列' },
        { key: 'hbase', name: 'HBase', description: 'HBase NoSQL数据库' }
    ];
}

/**
 * 获取默认题目数据
 */
function getDefaultQuestions() {
    return {
        list: [{
            id: 'default_1',
            question: '数据加载中，请稍后重试',
            answer: '网络连接不稳定，请检查网络后重试',
            category: 'system',
            categoryName: '系统提示'
        }],
        total: 1,
        page: 1,
        pageSize: 20
    };
}

/**
 * 增强错误信息
 */
function enhanceError(error, url, attempts) {
    const enhancedError = new Error(getUserFriendlyErrorMessage(error));
    enhancedError.originalError = error;
    enhancedError.url = url;
    enhancedError.attempts = attempts;
    enhancedError.code = error.code || 'UNKNOWN_ERROR';
    enhancedError.statusCode = error.statusCode;

    return enhancedError;
}

/**
 * 获取用户友好的错误消息
 */
function getUserFriendlyErrorMessage(error) {
    if (!error) return '未知错误';

    if (error.code === 'NETWORK_ERROR') {
        return '网络连接失败，请检查网络设置';
    }

    if (error.statusCode) {
        switch (error.statusCode) {
            case 400:
                return '请求参数错误';
            case 401:
                return '身份验证失败，请重新登录';
            case 403:
                return '访问被拒绝，请检查权限';
            case 404:
                return '请求的资源不存在';
            case 429:
                return '请求过于频繁，请稍后重试';
            case 500:
                return '服务器内部错误，请稍后重试';
            case 502:
                return '网关错误，请稍后重试';
            case 503:
                return '服务暂时不可用，请稍后重试';
            case 504:
                return '网关超时，请稍后重试';
            default:
                return `服务器错误 (${error.statusCode})，请稍后重试`;
        }
    }

    return error.message || '操作失败，请重试';
}

/**
 * 获取HTTP错误消息
 */
function getHttpErrorMessage(statusCode) {
    const messages = {
        400: '请求参数错误',
        401: '未授权访问',
        403: '访问被禁止',
        404: '资源不存在',
        408: '请求超时',
        429: '请求过于频繁',
        500: '服务器内部错误',
        502: '网关错误',
        503: '服务不可用',
        504: '网关超时'
    };

    return messages[statusCode] || '未知错误';
}

/**
 * 生成缓存键
 */
function generateCacheKey(url, data) {
    const params = data ? JSON.stringify(data) : '';
    return `${url}_${params}`.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * 获取缓存数据
 */
function getCache(key) {
    try {
        const cacheData = wx.getStorageSync(CACHE_KEY_PREFIX + key);
        if (cacheData) {
            const { data, expireTime } = cacheData;
            if (Date.now() < expireTime) {
                return data;
            } else {
                // 缓存过期，删除
                wx.removeStorageSync(CACHE_KEY_PREFIX + key);
            }
        }
    } catch (error) {
        console.error('读取缓存失败:', error);
    }
    return null;
}

/**
 * 设置缓存数据
 */
function setCache(key, data, expireTime = CACHE_EXPIRE_TIME) {
    try {
        wx.setStorageSync(CACHE_KEY_PREFIX + key, {
            data,
            expireTime: Date.now() + expireTime
        });
    } catch (error) {
        console.error('设置缓存失败:', error);
    }
}

/**
 * 清除所有知识库缓存
 */
function clearCache() {
    try {
        const keys = wx.getStorageInfoSync().keys;
        keys.forEach(key => {
            if (key.startsWith(CACHE_KEY_PREFIX)) {
                wx.removeStorageSync(key);
            }
        });
    } catch (error) {
        console.error('清除缓存失败:', error);
    }
}

/**
 * 检查数据版本，判断是否需要更新
 */
async function checkVersion() {
    try {
        const remoteVersion = await request('/knowledge/version');
        const localVersion = getCache('version');

        if (!localVersion || localVersion.version !== remoteVersion.version) {
            // 版本不一致，需要更新
            return {
                needUpdate: true,
                remoteVersion,
                localVersion
            };
        }

        return {
            needUpdate: false,
            remoteVersion,
            localVersion
        };
    } catch (error) {
        console.error('检查版本失败:', error);
        return {
            needUpdate: false,
            error: error.message
        };
    }
}

/**
 * 获取所有分类
 */
async function getCategories(useCache = true) {
    try {
        // 先尝试从缓存读取
        if (useCache) {
            const cached = getCache('categories');
            if (cached) {
                return cached;
            }
        }

        // 从服务器获取（带重试和降级）
        const categories = await request('/knowledge/categories', {
            retryConfig: 'api',
            enableFallback: true
        });

        // 缓存数据
        setCache('categories', categories);

        return categories;
    } catch (error) {
        console.error('获取分类失败:', error);

        // 尝试返回缓存数据（即使过期）
        const expiredCache = getCache('categories');
        if (expiredCache) {
            console.log('[KnowledgeAPI] 使用过期缓存数据');
            return expiredCache;
        }

        // 最后降级到默认数据
        const defaultCategories = getDefaultCategories();
        console.log('[KnowledgeAPI] 使用默认分类数据');
        return defaultCategories;
    }
}

/**
 * 获取题目列表
 */
async function getQuestions(options = {}) {
    const { category, page = 1, pageSize = 20, keyword, useCache = true } = options;

    try {
        // 构建缓存 key
        const cacheKey = `questions_${category || 'all'}_${page}_${pageSize}_${keyword || ''}`;

        // 先尝试从缓存读取
        if (useCache) {
            const cached = getCache(cacheKey);
            if (cached) {
                return cached;
            }
        }

        // 从服务器获取（带重试和降级）
        const params = {};
        if (category) params.category = category;
        if (page) params.page = page;
        if (pageSize) params.pageSize = pageSize;
        if (keyword) params.keyword = keyword;

        const result = await request('/knowledge/questions', {
            data: params,
            retryConfig: 'api',
            enableFallback: true
        });

        // 缓存数据（短期缓存，1小时）
        setCache(cacheKey, result, 60 * 60 * 1000);

        return result;
    } catch (error) {
        console.error('获取题目列表失败:', error);

        // 尝试返回缓存数据（即使过期）
        const cacheKey = `questions_${category || 'all'}_${page}_${pageSize}_${keyword || ''}`;
        const expiredCache = getCache(cacheKey);
        if (expiredCache) {
            console.log('[KnowledgeAPI] 使用过期缓存数据');
            return expiredCache;
        }

        // 最后降级到默认数据
        const defaultQuestions = getDefaultQuestions();
        console.log('[KnowledgeAPI] 使用默认题目数据');
        return defaultQuestions;
    }
}

/**
 * 获取题目详情
 */
async function getQuestionDetail(id, useCache = true) {
    try {
        // 先尝试从缓存读取
        if (useCache) {
            const cached = getCache(`question_${id}`);
            if (cached) {
                return cached;
            }
        }

        // 从服务器获取（带重试和降级）
        const question = await request(`/knowledge/questions/${id}`, {
            retryConfig: 'api',
            enableFallback: true
        });

        // 缓存数据
        setCache(`question_${id}`, question);

        return question;
    } catch (error) {
        console.error('获取题目详情失败:', error);

        // 尝试返回缓存数据（即使过期）
        const expiredCache = getCache(`question_${id}`);
        if (expiredCache) {
            console.log('[KnowledgeAPI] 使用过期缓存数据');
            return expiredCache;
        }

        // 如果没有缓存，抛出增强的错误
        throw enhanceError(error, `/knowledge/questions/${id}`, 1);
    }
}

/**
 * 获取完整知识库数据（首次加载使用）
 */
async function getFullKnowledge(forceUpdate = false) {
    try {
        // 先尝试从缓存读取
        if (!forceUpdate) {
            const cached = getCache('full');
            if (cached) {
                return cached;
            }
        }

        // 显示加载提示
        wx.showLoading({ title: '加载知识库...' });

        // 从服务器获取（带重试和降级）
        const knowledge = await request('/knowledge/full', {
            retryConfig: 'network',
            enableFallback: true,
            timeout: 15000 // 完整数据需要更长超时时间
        });

        // 缓存数据
        setCache('full', knowledge);
        setCache('version', {
            version: knowledge.version,
            updateTime: knowledge.updateTime
        });

        wx.hideLoading();

        return knowledge;
    } catch (error) {
        wx.hideLoading();
        console.error('获取完整知识库失败:', error);

        // 尝试返回缓存数据（即使过期）
        const expiredCache = getCache('full');
        if (expiredCache) {
            console.log('[KnowledgeAPI] 使用过期的完整知识库缓存');
            wx.showToast({
                title: '使用离线数据',
                icon: 'none',
                duration: 2000
            });
            return expiredCache;
        }

        // 显示用户友好的错误提示
        const ErrorHandler = require('./error-handler.js');
        ErrorHandler.showUserFriendlyError(error, {
            onRetry: () => {
                // 重试加载
                return getFullKnowledge(forceUpdate);
            }
        });

        throw error;
    }
}

/**
 * 初始化知识库（小程序启动时调用）
 */
async function initKnowledge() {
    try {
        // 检查版本
        const versionCheck = await checkVersion();

        if (versionCheck.needUpdate) {
            console.log('知识库有更新，开始下载...');
            // 清除旧缓存
            clearCache();
            // 下载新数据
            await getFullKnowledge(true);
            console.log('知识库更新完成');
        } else {
            console.log('知识库已是最新版本');
            // 确保有缓存数据
            const cached = getCache('full');
            if (!cached) {
                console.log('本地无缓存，开始下载...');
                await getFullKnowledge(true);
            }
        }

        return true;
    } catch (error) {
        console.error('初始化知识库失败:', error);
        // 初始化失败不影响小程序启动
        return false;
    }
}

/**
 * 网络状态监控
 */
let networkStatus = {
    isConnected: true,
    networkType: 'unknown',
    lastCheck: 0
};

/**
 * 检查网络状态
 */
function checkNetworkStatus() {
    return new Promise((resolve) => {
        wx.getNetworkType({
            success: (res) => {
                networkStatus = {
                    isConnected: res.networkType !== 'none',
                    networkType: res.networkType,
                    lastCheck: Date.now()
                };
                resolve(networkStatus);
            },
            fail: () => {
                networkStatus = {
                    isConnected: false,
                    networkType: 'unknown',
                    lastCheck: Date.now()
                };
                resolve(networkStatus);
            }
        });
    });
}

/**
 * 监听网络状态变化
 */
function startNetworkMonitoring() {
    wx.onNetworkStatusChange((res) => {
        networkStatus = {
            isConnected: res.isConnected,
            networkType: res.networkType,
            lastCheck: Date.now()
        };

        console.log('[KnowledgeAPI] 网络状态变化:', networkStatus);

        // 网络恢复时，清理失败的请求缓存
        if (res.isConnected) {
            console.log('[KnowledgeAPI] 网络已恢复，清理错误缓存');
            clearErrorCache();
        }
    });
}

/**
 * 清理错误缓存
 */
function clearErrorCache() {
    try {
        const keys = wx.getStorageInfoSync().keys;
        keys.forEach(key => {
            if (key.startsWith('error_cache_')) {
                wx.removeStorageSync(key);
            }
        });
    } catch (error) {
        console.error('[KnowledgeAPI] 清理错误缓存失败:', error);
    }
}

/**
 * 获取API健康状态
 */
async function getApiHealthStatus() {
    try {
        const startTime = Date.now();

        // 发送简单的健康检查请求
        await request('/health', {
            timeout: 3000,
            retryConfig: 'default',
            enableFallback: false
        });

        const responseTime = Date.now() - startTime;

        return {
            healthy: true,
            responseTime: responseTime,
            timestamp: Date.now()
        };
    } catch (error) {
        return {
            healthy: false,
            error: error.message,
            timestamp: Date.now()
        };
    }
}

/**
 * 智能重试策略（根据网络状态调整）
 */
function getAdaptiveRetryConfig(baseConfig) {
    const config = { ...baseConfig };

    // 根据网络类型调整重试策略
    if (networkStatus.networkType === 'wifi') {
        // WiFi网络：更激进的重试
        config.maxRetries = Math.min(config.maxRetries + 1, 5);
        config.retryDelay = Math.max(config.retryDelay - 200, 500);
    } else if (networkStatus.networkType === '2g') {
        // 2G网络：更保守的重试
        config.maxRetries = Math.max(config.maxRetries - 1, 1);
        config.retryDelay = config.retryDelay + 1000;
        config.maxDelay = config.maxDelay + 5000;
    } else if (['3g', '4g', '5g'].includes(networkStatus.networkType)) {
        // 移动网络：标准重试
        // 保持默认配置
    }

    return config;
}

/**
 * 显示网络错误提示
 */
function showNetworkErrorPrompt(error, retryCallback) {
    const ErrorHandler = require('./error-handler.js');

    // 检查网络状态
    checkNetworkStatus().then((status) => {
        let title = '网络请求失败';
        let content = '';

        if (!status.isConnected) {
            title = '网络连接失败';
            content = '请检查网络连接后重试\n\n• 确认WiFi或移动网络已连接\n• 尝试切换网络环境\n• 检查网络设置';
        } else if (status.networkType === '2g') {
            title = '网络较慢';
            content = '当前网络较慢，建议：\n\n• 切换到WiFi网络\n• 移动到信号更好的位置\n• 稍后重试';
        } else {
            title = '服务连接失败';
            content = '无法连接到服务器，可能原因：\n\n• 服务器暂时繁忙\n• 网络环境不稳定\n• 防火墙或代理设置';
        }

        wx.showModal({
            title: title,
            content: content,
            confirmText: '重试',
            cancelText: '取消',
            success: (res) => {
                if (res.confirm && typeof retryCallback === 'function') {
                    retryCallback();
                }
            }
        });
    });
}

/**
 * 获取网络诊断信息
 */
function getNetworkDiagnostics() {
    return {
        networkStatus: networkStatus,
        apiBaseUrl: API_BASE_URL,
        cacheStats: getCacheStats(),
        timestamp: Date.now()
    };
}

/**
 * 获取缓存统计信息
 */
function getCacheStats() {
    try {
        const storageInfo = wx.getStorageInfoSync();
        const knowledgeCacheKeys = storageInfo.keys.filter(key =>
            key.startsWith(CACHE_KEY_PREFIX)
        );

        return {
            totalKeys: storageInfo.keys.length,
            knowledgeCacheKeys: knowledgeCacheKeys.length,
            currentSize: storageInfo.currentSize,
            limitSize: storageInfo.limitSize
        };
    } catch (error) {
        return {
            error: error.message
        };
    }
}

module.exports = {
    // 配置
    setApiBaseUrl: (url) => {
        API_BASE_URL = url;
    },

    // 版本管理
    checkVersion,

    // 数据获取
    getCategories,
    getQuestions,
    getQuestionDetail,
    getFullKnowledge,

    // 初始化
    initKnowledge,

    // 缓存管理
    clearCache,
    getCache,
    setCache,

    // 网络监控和诊断
    checkNetworkStatus,
    startNetworkMonitoring,
    getApiHealthStatus,
    showNetworkErrorPrompt,
    getNetworkDiagnostics,

    // 内部方法（用于测试和调试）
    _internal: {
        requestWithRetry,
        isRetryableError,
        handleRequestFallback,
        getAdaptiveRetryConfig
    }
};

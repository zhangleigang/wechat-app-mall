/**
 * 知识库 API 调用工具
 * 从云端服务器加载知识库数据
 */

const CONFIG = require('../config.js');

// API 基础地址（从配置文件读取）
let API_BASE_URL = CONFIG.knowledgeApiUrl || 'http://localhost:3000/api';

// 缓存配置
const CACHE_KEY_PREFIX = 'knowledge_';
const CACHE_VERSION_KEY = 'knowledge_version';
const CACHE_EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000; // 7天

/**
 * 发起 API 请求
 */
function request(url, options = {}) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${API_BASE_URL}${url}`,
            method: options.method || 'GET',
            data: options.data || {},
            header: {
                'content-type': 'application/json'
            },
            success: (res) => {
                if (res.statusCode === 200 && res.data.code === 0) {
                    resolve(res.data.data);
                } else {
                    reject(new Error(res.data.message || '请求失败'));
                }
            },
            fail: (err) => {
                reject(err);
            }
        });
    });
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

        // 从服务器获取
        const categories = await request('/categories');

        // 缓存数据
        setCache('categories', categories);

        return categories;
    } catch (error) {
        console.error('获取分类失败:', error);
        throw error;
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

        // 从服务器获取
        const params = {};
        if (category) params.category = category;
        if (page) params.page = page;
        if (pageSize) params.pageSize = pageSize;
        if (keyword) params.keyword = keyword;

        const result = await request('/questions', { data: params });

        // 缓存数据（短期缓存，1小时）
        setCache(cacheKey, result, 60 * 60 * 1000);

        return result;
    } catch (error) {
        console.error('获取题目列表失败:', error);
        throw error;
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

        // 从服务器获取
        const question = await request(`/questions/${id}`);

        // 缓存数据
        setCache(`question_${id}`, question);

        return question;
    } catch (error) {
        console.error('获取题目详情失败:', error);
        throw error;
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

        // 从服务器获取
        const knowledge = await request('/knowledge/full');

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
    setCache
};

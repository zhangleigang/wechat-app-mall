/**
 * 收藏功能 API 客户端
 * 对接后端收藏服务
 */

const CONFIG = require('../config.js');
const errorHandler = require('./error-handler.js');

// ============================================
// 缓存管理
// ============================================

// 缓存配置
const CACHE_CONFIG = {
    TAGS_CACHE_KEY: 'favorites_tags_cache',
    TAGS_CACHE_TIME: 5 * 60 * 1000, // 标签缓存5分钟
    LIST_CACHE_KEY_PREFIX: 'favorites_list_cache_',
    LIST_CACHE_TIME: 2 * 60 * 1000  // 列表缓存2分钟
};

/**
 * 获取缓存
 * @param {string} key - 缓存键
 * @param {number} maxAge - 最大缓存时间（毫秒）
 * @returns {Object|null}
 */
function getCache(key, maxAge) {
    try {
        const cached = wx.getStorageSync(key);
        if (!cached) {
            return null;
        }

        const { data, timestamp } = cached;
        const now = Date.now();

        // 检查缓存是否过期
        if (now - timestamp > maxAge) {
            // 缓存过期，删除
            wx.removeStorageSync(key);
            return null;
        }

        return data;
    } catch (error) {
        console.error('获取缓存失败:', error);
        return null;
    }
}

/**
 * 设置缓存
 * @param {string} key - 缓存键
 * @param {Object} data - 缓存数据
 */
function setCache(key, data) {
    try {
        wx.setStorageSync(key, {
            data: data,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('设置缓存失败:', error);
    }
}

/**
 * 清除缓存
 * @param {string} key - 缓存键（可选，不传则清除所有收藏相关缓存）
 */
function clearCache(key) {
    try {
        if (key) {
            wx.removeStorageSync(key);
        } else {
            // 清除所有收藏相关缓存
            wx.removeStorageSync(CACHE_CONFIG.TAGS_CACHE_KEY);

            // 清除所有列表缓存
            const { keys } = wx.getStorageInfoSync();
            keys.forEach(k => {
                if (k.startsWith(CACHE_CONFIG.LIST_CACHE_KEY_PREFIX)) {
                    wx.removeStorageSync(k);
                }
            });
        }
    } catch (error) {
        console.error('清除缓存失败:', error);
    }
}

/**
 * 生成列表缓存键
 * @param {Object} params - 查询参数
 * @returns {string}
 */
function getListCacheKey(params) {
    const { openid, page, pageSize, tag } = params;
    return `${CACHE_CONFIG.LIST_CACHE_KEY_PREFIX}${openid}_p${page}_s${pageSize}_t${tag || 'all'}`;
}

/**
 * HTTP请求封装
 * @param {string} url - API路径
 * @param {string} method - HTTP方法
 * @param {Object} data - 请求数据
 * @param {number} retryCount - 重试次数
 * @returns {Promise<Object>}
 */
function request(url, method = 'GET', data = null, retryCount = 0) {
    return new Promise((resolve, reject) => {
        const token = wx.getStorageSync('token');

        const requestConfig = {
            url: `${CONFIG.apiBaseUrl}${url}`,
            method: method,
            header: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            success: (res) => {
                if (res.statusCode === 200) {
                    resolve(res.data);
                } else if (res.statusCode === 401) {
                    // 未授权，可能需要重新登录
                    reject(new Error('未授权，请重新登录'));
                } else if (res.statusCode === 403) {
                    // 权限不足
                    reject(new Error('权限不足'));
                } else if (res.statusCode >= 500 && retryCount < 2) {
                    // 服务器错误，重试
                    console.log(`服务器错误，重试第 ${retryCount + 1} 次`);
                    setTimeout(() => {
                        request(url, method, data, retryCount + 1)
                            .then(resolve)
                            .catch(reject);
                    }, 1000 * (retryCount + 1)); // 递增延迟
                } else {
                    reject(new Error(res.data.message || '请求失败'));
                }
            },
            fail: (err) => {
                // 网络错误，重试
                if (retryCount < 2) {
                    console.log(`网络错误，重试第 ${retryCount + 1} 次`);
                    setTimeout(() => {
                        request(url, method, data, retryCount + 1)
                            .then(resolve)
                            .catch(reject);
                    }, 1000 * (retryCount + 1));
                } else {
                    reject(new Error('网络连接失败，请检查网络'));
                }
            }
        };

        // 根据方法设置数据
        if (method === 'GET') {
            // GET请求使用query参数
            if (data) {
                const queryString = Object.keys(data)
                    .map(key => `${key}=${encodeURIComponent(data[key])}`)
                    .join('&');
                requestConfig.url += `?${queryString}`;
            }
        } else {
            // POST/PUT/DELETE使用body
            requestConfig.data = data;
        }

        wx.request(requestConfig);
    });
}

/**
 * 处理API响应
 * @param {Object} response - API响应
 * @returns {Object}
 */
function handleResponse(response) {
    if (response.code === 0) {
        return {
            success: true,
            data: response.data
        };
    } else {
        return {
            success: false,
            message: response.message || '操作失败',
            code: response.code
        };
    }
}

/**
 * 创建收藏
 * 优化：创建成功后清除缓存
 * @param {Object} favoriteData - 收藏数据
 * @param {string} favoriteData.openid - 用户OpenID
 * @param {string} favoriteData.question - 问题内容
 * @param {string} favoriteData.answer - 答案内容
 * @param {string} favoriteData.sourceType - 来源类型 (knowledge/resume/custom)
 * @param {string} favoriteData.sourceId - 来源ID（可选）
 * @param {string} favoriteData.sourceCategory - 来源分类（可选）
 * @param {Array<string>} favoriteData.tags - 标签数组（可选）
 * @returns {Promise<Object>}
 */
async function createFavorite(favoriteData) {
    try {
        const res = await request('/favorites', 'POST', favoriteData);
        const result = handleResponse(res);

        if (result.success) {
            // 清除缓存，确保下次获取最新数据
            clearCache();

            return {
                success: true,
                favoriteId: result.data.id,
                message: '收藏成功'
            };
        } else {
            return result;
        }
    } catch (err) {
        console.error('创建收藏失败:', err);
        return {
            success: false,
            error: err.message
        };
    }
}

/**
 * 获取收藏列表
 * 优化：使用缓存，减少API调用
 * @param {Object} params - 查询参数
 * @param {string} params.openid - 用户OpenID
 * @param {number} params.page - 页码（默认1）
 * @param {number} params.pageSize - 每页数量（默认20）
 * @param {string} params.tag - 标签筛选（可选）
 * @param {boolean} params.forceRefresh - 是否强制刷新（跳过缓存）
 * @returns {Promise<Object>}
 */
async function getFavorites(params) {
    try {
        const queryParams = {
            openid: params.openid,
            page: params.page || 1,
            pageSize: params.pageSize || 20
        };

        if (params.tag) {
            queryParams.tag = params.tag;
        }

        // 尝试从缓存获取（仅缓存第一页，避免缓存过多数据）
        if (!params.forceRefresh && queryParams.page === 1) {
            const cacheKey = getListCacheKey(queryParams);
            const cached = getCache(cacheKey, CACHE_CONFIG.LIST_CACHE_TIME);

            if (cached) {
                console.log('使用收藏列表缓存');
                return {
                    ...cached,
                    fromCache: true
                };
            }
        }

        // 缓存未命中或强制刷新，请求API
        const res = await request('/favorites', 'GET', queryParams);
        const result = handleResponse(res);

        if (result.success) {
            const pagination = result.data.pagination || {};
            const responseData = {
                success: true,
                favorites: result.data.favorites || [],
                total: pagination.total || 0,
                page: pagination.page || 1,
                pageSize: pagination.pageSize || 20,
                hasMore: pagination.hasMore || false,
                fromCache: false
            };

            // 缓存第一页结果
            if (queryParams.page === 1) {
                const cacheKey = getListCacheKey(queryParams);
                setCache(cacheKey, responseData);
            }

            return responseData;
        } else {
            return result;
        }
    } catch (err) {
        console.error('获取收藏列表失败:', err);
        return {
            success: false,
            error: err.message,
            favorites: [],
            total: 0
        };
    }
}

/**
 * 获取收藏详情
 * @param {number} id - 收藏ID
 * @param {string} openid - 用户OpenID
 * @returns {Promise<Object>}
 */
async function getFavoriteDetail(id, openid) {
    try {
        const res = await request(`/favorites/${id}`, 'GET', { openid });
        const result = handleResponse(res);

        if (result.success) {
            return {
                success: true,
                favorite: result.data
            };
        } else {
            return result;
        }
    } catch (err) {
        console.error('获取收藏详情失败:', err);
        return {
            success: false,
            error: err.message
        };
    }
}

/**
 * 更新收藏
 * 优化：更新成功后清除缓存
 * @param {number} id - 收藏ID
 * @param {Object} updateData - 更新数据
 * @param {string} updateData.openid - 用户OpenID
 * @param {string} updateData.question - 问题内容（可选）
 * @param {Array<string>} updateData.tags - 标签数组（可选）
 * @returns {Promise<Object>}
 */
async function updateFavorite(id, updateData) {
    try {
        const res = await request(`/favorites/${id}`, 'PUT', updateData);
        const result = handleResponse(res);

        if (result.success) {
            // 清除缓存，确保下次获取最新数据
            clearCache();

            return {
                success: true,
                message: '更新成功'
            };
        } else {
            return result;
        }
    } catch (err) {
        console.error('更新收藏失败:', err);
        return {
            success: false,
            error: err.message
        };
    }
}

/**
 * 删除收藏
 * 优化：删除成功后清除缓存
 * @param {number} id - 收藏ID
 * @param {string} openid - 用户OpenID
 * @returns {Promise<Object>}
 */
async function deleteFavorite(id, openid) {
    try {
        const res = await request(`/favorites/${id}`, 'DELETE', { openid });
        const result = handleResponse(res);

        if (result.success) {
            // 清除缓存，确保下次获取最新数据
            clearCache();

            return {
                success: true,
                message: '删除成功'
            };
        } else {
            return result;
        }
    } catch (err) {
        console.error('删除收藏失败:', err);
        return {
            success: false,
            error: err.message
        };
    }
}

/**
 * 获取标签列表（带问题数量）
 * 优化：使用缓存，减少API调用
 * @param {string} openid - 用户OpenID
 * @param {boolean} forceRefresh - 是否强制刷新（跳过缓存）
 * @returns {Promise<Object>}
 */
async function getTags(openid, forceRefresh = false) {
    try {
        // 尝试从缓存获取
        if (!forceRefresh) {
            const cached = getCache(
                `${CACHE_CONFIG.TAGS_CACHE_KEY}_${openid}`,
                CACHE_CONFIG.TAGS_CACHE_TIME
            );

            if (cached) {
                console.log('使用标签缓存');
                return {
                    success: true,
                    tags: cached,
                    fromCache: true
                };
            }
        }

        // 缓存未命中或强制刷新，请求API
        const res = await request('/favorites/tags', 'GET', { openid });
        const result = handleResponse(res);

        if (result.success) {
            const tags = result.data || [];

            // 缓存结果
            setCache(`${CACHE_CONFIG.TAGS_CACHE_KEY}_${openid}`, tags);

            return {
                success: true,
                tags: tags,
                fromCache: false
            };
        } else {
            return result;
        }
    } catch (err) {
        console.error('获取标签列表失败:', err);
        return {
            success: false,
            error: err.message,
            tags: []
        };
    }
}

/**
 * 为收藏添加标签
 * 优化：添加成功后清除缓存
 * @param {number} favoriteId - 收藏ID
 * @param {string} tagName - 标签名称
 * @param {string} openid - 用户OpenID
 * @returns {Promise<Object>}
 */
async function addTag(favoriteId, tagName, openid) {
    try {
        const res = await request(`/favorites/${favoriteId}/tags`, 'POST', {
            openid,
            tagName
        });
        const result = handleResponse(res);

        if (result.success) {
            // 清除缓存，确保下次获取最新数据
            clearCache();

            return {
                success: true,
                tagId: result.data.tagId,
                message: '标签添加成功'
            };
        } else {
            return result;
        }
    } catch (err) {
        console.error('添加标签失败:', err);
        return {
            success: false,
            error: err.message
        };
    }
}

/**
 * 移除收藏的标签
 * 优化：移除成功后清除缓存
 * @param {number} favoriteId - 收藏ID
 * @param {number} tagId - 标签ID
 * @param {string} openid - 用户OpenID
 * @returns {Promise<Object>}
 */
async function removeTag(favoriteId, tagId, openid) {
    try {
        const res = await request(`/favorites/${favoriteId}/tags/${tagId}`, 'DELETE', {
            openid
        });
        const result = handleResponse(res);

        if (result.success) {
            // 清除缓存，确保下次获取最新数据
            clearCache();

            return {
                success: true,
                message: '标签移除成功'
            };
        } else {
            return result;
        }
    } catch (err) {
        console.error('移除标签失败:', err);
        return {
            success: false,
            error: err.message
        };
    }
}

/**
 * 获取收藏统计信息（包含配额信息）
 * @param {string} openid - 用户OpenID
 * @returns {Promise<Object>}
 */
async function getStats(openid) {
    try {
        const res = await request('/favorites/stats', 'GET', { openid });
        const result = handleResponse(res);

        if (result.success) {
            return {
                success: true,
                stats: result.data
            };
        } else {
            return result;
        }
    } catch (err) {
        console.error('获取统计信息失败:', err);
        return {
            success: false,
            error: err.message,
            stats: null
        };
    }
}

/**
 * 生成AI答案（流式输出）
 * 使用Server-Sent Events (SSE)接收流式数据
 * @param {string} question - 问题内容
 * @param {string} openid - 用户OpenID
 * @param {Function} onChunk - 接收数据块的回调函数 (chunk) => void
 * @param {Function} onComplete - 完成时的回调函数 (fullAnswer) => void
 * @param {Function} onError - 错误时的回调函数 (error) => void
 * @returns {Object} - 返回包含abort方法的对象，用于取消请求
 */
function generateAnswer(question, openid, onChunk, onComplete, onError) {
    const token = wx.getStorageSync('token');
    let requestTask = null;
    let buffer = '';
    let fullAnswer = '';
    let isAborted = false;

    try {
        // 创建请求任务
        requestTask = wx.request({
            url: `${CONFIG.apiBaseUrl}/favorites/generate-answer`,
            method: 'POST',
            data: {
                question,
                openid
            },
            header: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            enableChunked: true, // 启用分块传输
            success: (res) => {
                if (isAborted) return;

                if (res.statusCode !== 200) {
                    const errorMsg = res.data?.message || '请求失败';
                    onError && onError(new Error(errorMsg));
                }
            },
            fail: (err) => {
                if (isAborted) return;
                onError && onError(new Error(err.errMsg || '网络连接失败'));
            }
        });

        // 监听数据接收
        requestTask.onHeadersReceived((result) => {
            if (isAborted) return;

            // 验证是否是SSE响应
            const contentType = result.header['Content-Type'] || result.header['content-type'];
            if (!contentType || !contentType.includes('text/event-stream')) {
                onError && onError(new Error('服务器响应格式错误'));
                requestTask.abort();
            }
        });

        // 监听分块数据
        requestTask.onChunkReceived((result) => {
            if (isAborted) return;

            try {
                // 将ArrayBuffer转换为字符串
                const chunk = arrayBufferToString(result.data);
                buffer += chunk;

                // 解析SSE事件
                const events = parseSSEEvents(buffer);

                events.forEach(event => {
                    if (event.event === 'connected') {
                        // 连接成功
                        console.log('SSE连接成功');
                    } else if (event.event === 'chunk') {
                        // 接收数据块
                        const data = JSON.parse(event.data);
                        if (data.content) {
                            fullAnswer += data.content;
                            onChunk && onChunk(data.content);
                        }
                    } else if (event.event === 'done') {
                        // 完成
                        const data = JSON.parse(event.data);
                        onComplete && onComplete(data.content || fullAnswer);
                    } else if (event.event === 'error') {
                        // 错误
                        const data = JSON.parse(event.data);
                        onError && onError(new Error(data.error || '生成失败'), data.retryable);
                    }
                });

                // 清除已处理的buffer
                buffer = '';
            } catch (err) {
                console.error('解析SSE数据失败:', err);
                onError && onError(new Error('数据解析失败'));
            }
        });

    } catch (err) {
        onError && onError(err);
    }

    // 返回控制对象
    return {
        abort: () => {
            isAborted = true;
            if (requestTask) {
                requestTask.abort();
            }
        }
    };
}

/**
 * 将ArrayBuffer转换为字符串
 * @param {ArrayBuffer} buffer - ArrayBuffer数据
 * @returns {string}
 */
function arrayBufferToString(buffer) {
    const uint8Array = new Uint8Array(buffer);
    let result = '';
    for (let i = 0; i < uint8Array.length; i++) {
        result += String.fromCharCode(uint8Array[i]);
    }
    return result;
}

/**
 * 解析SSE事件
 * @param {string} text - SSE文本数据
 * @returns {Array<Object>} - 解析后的事件数组
 */
function parseSSEEvents(text) {
    const events = [];
    const lines = text.split('\n');
    let currentEvent = { event: 'message', data: '' };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line === '') {
            // 空行表示事件结束
            if (currentEvent.data) {
                events.push(currentEvent);
                currentEvent = { event: 'message', data: '' };
            }
        } else if (line.startsWith('event:')) {
            currentEvent.event = line.substring(6).trim();
        } else if (line.startsWith('data:')) {
            currentEvent.data = line.substring(5).trim();
        }
    }

    return events;
}

module.exports = {
    createFavorite,
    getFavorites,
    getFavoriteDetail,
    updateFavorite,
    deleteFavorite,
    getTags,
    addTag,
    removeTag,
    generateAnswer,
    getStats,
    clearCache  // 导出清除缓存函数，供外部使用
};
